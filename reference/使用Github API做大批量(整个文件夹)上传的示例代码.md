
# 生产级 GitHub 文件夹一次性上传方案（并发 + 重试 + 进度条 + 补传）

太好了—我把你要的**生产级**方案一次给全：  
- 并发上传 + 进度条  
- 自动判断文本/二进制（图片/音视频/Office/PDF 完全原样保存）  
- 失败**自动重试（指数退避 + 限流等待）**  
- **>100 MB 自动跳过**并输出清单（建议用 Git LFS）  
- 支持中文/英文/中英混合路径  
- 产出 `failed_files.json` / `skipped_files.json`  
- **附带补传脚本**：只补失败文件，继续单次 commit

---

## 使用方式（一次性说明）
```bash
# 1) Node 18+，ESM 模式
npm init -y
npm i node-fetch@3 cli-progress

# package.json 中加一行：
# "type": "module"

# 2) 配置环境变量（建议）
$env:GITHUB_TOKEN="ghp_xxx"            # PowerShell
export GITHUB_TOKEN="ghp_xxx"          # macOS/Linux

# 可选（也可在脚本里写死）
export GITHUB_OWNER="your-user-or-org"
export GITHUB_REPO="your-repo"
export GITHUB_BRANCH="main"
export UPLOAD_ROOT="./your-local-folder"

# 3) 运行主上传脚本
node upload-folder.js

# 4) 若存在失败文件，执行补传
node retry-failed.js
```

---

## 脚本 1：`upload-folder.js`  
> **一次 commit 上传整个文件夹（含子文件夹）**；并发、进度条、自动重试、限流等待、>100MB 跳过、生成失败/跳过清单。  
> 注释非常详细，基本把关键注意点都写在了代码里。

```javascript
/**
 * upload-folder.js
 *
 * 用 GitHub Git Data API 将本地整个文件夹一次性上传为“一个 commit”。
 * 特性：
 *  - 并发上传 blob（默认 5 个，可调）
 *  - 自动区分文本/二进制（网络传输用 Base64，但 Git 仓库存的是原始文件，不会改变）
 *  - 进度条显示（文件总数、百分比、当前文件）
 *  - 自动重试（指数退避），并针对 GitHub 限流（403 + x-ratelimit-remaining: 0）自动等待到重置时间
 *  - 跳过 >100 MB 文件并记录（建议改用 Git LFS）
 *  - 生成 failed_files.json / skipped_files.json，便于后续补传
 *
 * 重要限制 & 说明：
 *  1) GitHub 对单文件大小的硬限制是 100 MB，超过会被拒绝，建议用 Git LFS；本脚本默认 95 MB 就跳过，避免浪费请求。
 *  2) 本脚本“追加式”提交：不会删除仓库中已有但本地已删除的文件；若要做“镜像同步”，需要额外构造完整树，超出本脚本范围。
 *  3) Base64 仅用于 HTTP 传输二进制；Git 最终保存是原始二进制，与你本地一致。
 *  4) 若有极大量大文件，内存峰值可能较高（blob 需整块提交，Git API 不支持流式分块）；建议分批或启用 LFS。
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import cliProgress from 'cli-progress';

// ======== 可配置参数（支持环境变量，便于 CI/CD 注入）========
const owner  = process.env.GITHUB_OWNER  || 'YOUR_GITHUB_USERNAME';
const repo   = process.env.GITHUB_REPO   || 'YOUR_REPO_NAME';
const branch = process.env.GITHUB_BRANCH || 'main';
const token  = process.env.GITHUB_TOKEN  || 'YOUR_GITHUB_TOKEN'; // 强烈建议用环境变量
const localFolderPath = process.env.UPLOAD_ROOT || './your-local-folder';

const CONCURRENCY_LIMIT = Number(process.env.CONCURRENCY || 5);  // 并发数：初次建议 3~5，稳定后可到 10~20
const MAX_RETRIES_API   = 5;        // GitHub API 通用最大重试次数（包括限流后恢复）
const RETRY_BASE_DELAY  = 1500;     // 首次失败的等待（毫秒），后续指数退避
const BACKOFF_FACTOR    = 2;        // 指数退避倍数
const MAX_FILE_SIZE_BYTES = 95 * 1024 * 1024; // 超过此大小跳过（GitHub 硬限制 100MB）

// 若任何文件失败是否“中止提交”（true = 有失败就不提交；false = 提交成功部分并生成失败清单）
const ABORT_ON_FAILURES = false;

// 简单忽略列表（无需再传上去的通用项；如需复杂模式，可引入 minimatch 自己扩展）
const IGNORE_NAMES = new Set(['.git', '.DS_Store', 'Thumbs.db', '.idea']);

// ================ 小工具函数 ================
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// 只探测前若干字节即可判断是否含有 NUL（更快，避免整文件读入判定）
function isBinaryFileQuick(localPath, probeBytes = 8192) {
  const fd = fs.openSync(localPath, 'r');
  try {
    const buf = Buffer.alloc(Math.min(probeBytes, fs.statSync(localPath).size));
    fs.readSync(fd, buf, 0, buf.length, 0);
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] === 0) return true; // 出现 NUL 字节，基本可判为二进制
    }
    return false; // 未发现 NUL，大概率是文本
  } finally {
    fs.closeSync(fd);
  }
}

// 统一处理 GitHub API 调用：自动重试 + 限流等待
async function githubApiWithRetry(endpoint, { method = 'GET', body = null } = {}, attempt = 1) {
  const url = `https://api.github.com${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json'
    },
    body: body ? JSON.stringify(body) : null
  });

  if (res.ok) {
    // 某些空响应会返回 204，无 body；此处统一处理为 {} 或 JSON
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  }

  // 读取错误信息、限流头
  const errText = await res.text().catch(() => '');
  const remaining = res.headers.get('x-ratelimit-remaining');
  const resetAt   = res.headers.get('x-ratelimit-reset'); // Unix epoch seconds

  // 命中限流：403 + remaining=0  → 等到 reset 再重试
  if (res.status === 403 && remaining === '0' && resetAt) {
    const resetMs = Math.max(0, Number(resetAt) * 1000 - Date.now()) + 1000; // +1s 缓冲
    console.warn(`⛔ 触发 GitHub 限流，等待 ${(resetMs/1000).toFixed(1)} 秒后重试...`);
    await sleep(resetMs);
    return githubApiWithRetry(endpoint, { method, body }, attempt); // 重新尝试，不增加 attempt 计数
  }

  // 其它可重试错误：5xx / 502 / 503 / 429 / 403（非限流，但可能暂时性问题）
  const retriable = res.status >= 500 || [502, 503, 429].includes(res.status) || res.status === 403;

  if (retriable && attempt < MAX_RETRIES_API) {
    const delay = RETRY_BASE_DELAY * Math.pow(BACKOFF_FACTOR, attempt - 1);
    console.warn(`⚠️ API 调用失败（${res.status}），第 ${attempt} 次重试，等待 ${delay}ms。详情：${errText.slice(0,180)}...`);
    await sleep(delay);
    return githubApiWithRetry(endpoint, { method, body }, attempt + 1);
  }

  // 最终失败，抛出详细错误
  throw new Error(`${method} ${endpoint} failed: ${res.status} ${errText}`);
}

// 递归遍历目录，返回 { localPath, repoPath, size } 列表
function listAllFiles(rootDir, basePath = '') {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  let files = [];
  for (const ent of entries) {
    if (IGNORE_NAMES.has(ent.name)) continue;       // 忽略常见系统/隐藏项
    const abs = path.join(rootDir, ent.name);
    const rel = path.join(basePath, ent.name).replace(/\\/g, '/'); // 统一为 Posix 路径
    if (ent.isDirectory()) {
      files = files.concat(listAllFiles(abs, rel));
    } else if (ent.isFile()) {
      const stat = fs.statSync(abs);
      files.push({ localPath: abs, repoPath: rel, size: stat.size });
    }
  }
  return files;
}

// 创建单个 blob（自动文本/二进制），失败会抛错；由外层负责重试
async function createBlobOnce({ localPath, repoPath, size }) {
  // 大文件直接跳过（避免 100MB 硬限制失败）
  if (size > MAX_FILE_SIZE_BYTES) {
    const mb = (size / (1024*1024)).toFixed(1);
    throw new Error(`SKIP_TOO_LARGE >100MB: ${repoPath} (${mb}MB)`);
  }

  const isBinary = isBinaryFileQuick(localPath);
  const content  = isBinary
    ? fs.readFileSync(localPath).toString('base64')
    : fs.readFileSync(localPath, 'utf8');

  // 注意：这里的 Base64 仅用于“HTTP 传输层”，Git 最终保存为原始二进制文件
  const blob = await githubApiWithRetry(
    `/repos/${owner}/${repo}/git/blobs`,
    { method: 'POST', body: { content, encoding: isBinary ? 'base64' : 'utf-8' } }
  );

  // 返回构造 tree 所需的条目
  return { path: repoPath, mode: '100644', type: 'blob', sha: blob.sha };
}

// 为单文件提供“文件级重试”（独立于 API 级重试），避免某个文件失败拖垮整体
async function createBlobWithFileRetry(fileMeta, maxFileRetries = 3) {
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      return await createBlobOnce(fileMeta);
    } catch (e) {
      const msg = String(e.message || e);
      // 对于“超大文件”直接抛给上层标记为跳过；无须重试
      if (msg.startsWith('SKIP_TOO_LARGE')) throw e;

      if (attempt < maxFileRetries) {
        const delay = RETRY_BASE_DELAY * Math.pow(BACKOFF_FACTOR, attempt - 1);
        console.warn(`⚠️ 文件上传失败（第 ${attempt} 次）：${fileMeta.repoPath}\n   原因：${msg}\n   将在 ${delay}ms 后重试...`);
        await sleep(delay);
      } else {
        throw new Error(`FILE_FINAL_FAIL: ${fileMeta.repoPath} | last error: ${msg}`);
      }
    }
  }
}

// 简易并发执行器
async function runConcurrent(files, concurrency, progressBar) {
  const results = [];
  const failed  = [];
  const skipped = [];

  let cursor = 0;
  const total = files.length;

  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= total) break;
      const file = files[idx];
      try {
        const treeEntry = await createBlobWithFileRetry(file);
        results.push(treeEntry);
      } catch (e) {
        const msg = String(e.message || e);
        if (msg.startsWith('SKIP_TOO_LARGE')) {
          skipped.push({ ...file, reason: msg });
        } else {
          failed.push({ ...file, reason: msg });
        }
      } finally {
        progressBar.increment(1, { filename: file.repoPath });
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return { results, failed, skipped };
}

async function main() {
  if (!token || token === 'YOUR_GITHUB_TOKEN') {
    console.error('❌ 未设置 GITHUB_TOKEN（请使用环境变量 GITHUB_TOKEN 注入 PAT，需具有 repo 权限）');
    process.exit(1);
  }

  console.log(`🚀 准备上传目录：${localFolderPath}`);
  console.log(`   仓库：${owner}/${repo} @ ${branch}`);

  if (!fs.existsSync(localFolderPath) || !fs.statSync(localFolderPath).isDirectory()) {
    console.error('❌ 本地路径不存在或不是文件夹：', localFolderPath);
    process.exit(1);
  }

  // 1) 获取分支最新 commit 与 base tree
  const refData   = await githubApiWithRetry(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
  const headSha   = refData.object.sha;
  const headCommit = await githubApiWithRetry(`/repos/${owner}/${repo}/git/commits/${headSha}`);
  const baseTreeSha = headCommit.tree.sha;

  // 2) 枚举全部文件
  const allFiles = listAllFiles(localFolderPath);
  console.log(`📂 发现 ${allFiles.length} 个文件，将并发上传 blob（并发=${CONCURRENCY_LIMIT}）...`);
  if (allFiles.length === 0) {
    console.log('ℹ️ 目录为空，无需提交。');
    return;
  }

  // 3) 进度条
  const progressBar = new cliProgress.SingleBar({
    format: '进度 [{bar}] {percentage}% | {value}/{total} | {filename}',
    barCompleteChar: '█',
    barIncompleteChar: '-',
    hideCursor: true
  }, cliProgress.Presets.shades_classic);
  progressBar.start(allFiles.length, 0, { filename: '' });

  // 4) 并发创建 blobs（含文件级重试、>100MB 跳过）
  const { results: treeEntries, failed, skipped } =
    await runConcurrent(allFiles, CONCURRENCY_LIMIT, progressBar);

  progressBar.stop();

  // 5) 输出失败/跳过清单（落盘，方便补传）
  if (failed.length > 0) {
    fs.writeFileSync('failed_files.json', JSON.stringify(failed, null, 2), 'utf8');
    console.warn(`⚠️ 有 ${failed.length} 个文件最终失败，已写入 failed_files.json（供 retry-failed.js 使用）`);
  }
  if (skipped.length > 0) {
    fs.writeFileSync('skipped_files.json', JSON.stringify(skipped, null, 2), 'utf8');
    console.warn(`ℹ️ 有 ${skipped.length} 个大文件被跳过（>100MB），详见 skipped_files.json。建议改用 Git LFS。`);
  }

  // 若配置为“有失败就中止提交”，这里直接退出
  if (ABORT_ON_FAILURES && failed.length > 0) {
    console.error('❌ 检测到失败文件，按配置 ABORT_ON_FAILURES=true，终止本次提交。');
    process.exit(2);
  }

  // 如果完全没有可提交的条目，直接结束（说明全失败或全被跳过）
  if (treeEntries.length === 0) {
    console.error('❌ 没有可提交的文件（可能全部失败或全部被跳过）。');
    process.exit(3);
  }

  // 6) 创建 tree（基于 base_tree 累加本次新增/更新的文件）
  console.log('🌳 创建 tree ...');
  const tree = await githubApiWithRetry(`/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    body: { base_tree: baseTreeSha, tree: treeEntries }
  });

  // 7) 创建 commit（一次 commit，保证日志干净）
  console.log('📝 创建 commit ...');
  const messageLines = [
    `Upload folder: ${localFolderPath}`,
    `Files committed: ${treeEntries.length}`,
    failed.length  ? `Failed: ${failed.length} (see failed_files.json)` : '',
    skipped.length ? `Skipped(>100MB): ${skipped.length} (see skipped_files.json)` : ''
  ].filter(Boolean);
  const newCommit = await githubApiWithRetry(`/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    body: { message: messageLines.join('\n'), tree: tree.sha, parents: [headSha] }
  });

  // 8) 更新分支引用到新 commit
  console.log(`📌 更新分支 ${branch} -> ${newCommit.sha} ...`);
  await githubApiWithRetry(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: { sha: newCommit.sha }
  });

  console.log(`🎉 完成：commit ${newCommit.sha}`);
  if (failed.length)  console.log(`   ⛑ 需补传：failed_files.json`);
  if (skipped.length) console.log(`   📦 建议 LFS：skipped_files.json`);
}

main().catch(err => {
  console.error('❌ 未捕获异常：', err);
  process.exit(99);
});
```

---

## 脚本 2：`retry-failed.js`  
> **只补传 `failed_files.json` 里的条目**，仍然一次 commit，把“补上的文件”打包成一个提交。  
> 支持并发、重试、限流等待；注释同样详细。

```javascript
/**
 * retry-failed.js
 *
 * 读取 upload-folder.js 生成的 failed_files.json，仅对失败文件进行补传，
 * 并将成功补传的文件打包为一个新的 commit。
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import cliProgress from 'cli-progress';

// 与主脚本相同的配置/常量（保持一致）
const owner  = process.env.GITHUB_OWNER  || 'YOUR_GITHUB_USERNAME';
const repo   = process.env.GITHUB_REPO   || 'YOUR_REPO_NAME';
const branch = process.env.GITHUB_BRANCH || 'main';
const token  = process.env.GITHUB_TOKEN  || 'YOUR_GITHUB_TOKEN';
const CONCURRENCY_LIMIT = Number(process.env.CONCURRENCY || 5);
const MAX_RETRIES_API   = 5;
const RETRY_BASE_DELAY  = 1500;
const BACKOFF_FACTOR    = 2;
const MAX_FILE_SIZE_BYTES = 95 * 1024 * 1024;
const FAILED_LIST_FILE = 'failed_files.json';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function githubApiWithRetry(endpoint, { method = 'GET', body = null } = {}, attempt = 1) {
  const url = `https://api.github.com${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json'
    },
    body: body ? JSON.stringify(body) : null
  });

  if (res.ok) {
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  }

  const errText = await res.text().catch(() => '');
  const remaining = res.headers.get('x-ratelimit-remaining');
  const resetAt   = res.headers.get('x-ratelimit-reset');

  if (res.status === 403 && remaining === '0' && resetAt) {
    const resetMs = Math.max(0, Number(resetAt) * 1000 - Date.now()) + 1000;
    console.warn(`⛔ 触发限流，等待 ${(resetMs/1000).toFixed(1)} 秒后重试...`);
    await sleep(resetMs);
    return githubApiWithRetry(endpoint, { method, body }, attempt);
  }

  const retriable = res.status >= 500 || [502, 503, 429].includes(res.status) || res.status === 403;
  if (retriable && attempt < MAX_RETRIES_API) {
    const delay = RETRY_BASE_DELAY * Math.pow(BACKOFF_FACTOR, attempt - 1);
    console.warn(`⚠️ API 失败（${res.status}），第 ${attempt} 次重试，等待 ${delay}ms。详情：${errText.slice(0,180)}...`);
    await sleep(delay);
    return githubApiWithRetry(endpoint, { method, body }, attempt + 1);
  }

  throw new Error(`${method} ${endpoint} failed: ${res.status} ${errText}`);
}

function isBinaryFileQuick(localPath, probeBytes = 8192) {
  const fd = fs.openSync(localPath, 'r');
  try {
    const buf = Buffer.alloc(Math.min(probeBytes, fs.statSync(localPath).size));
    fs.readSync(fd, buf, 0, buf.length, 0);
    for (let i = 0; i < buf.length; i++) if (buf[i] === 0) return true;
    return false;
  } finally {
    fs.closeSync(fd);
  }
}

async function createBlobOnce({ localPath, repoPath, size }) {
  if (size > MAX_FILE_SIZE_BYTES) {
    const mb = (size / (1024*1024)).toFixed(1);
    throw new Error(`SKIP_TOO_LARGE >100MB: ${repoPath} (${mb}MB)`);
  }
  const isBinary = isBinaryFileQuick(localPath);
  const content  = isBinary
    ? fs.readFileSync(localPath).toString('base64')
    : fs.readFileSync(localPath, 'utf8');

  const blob = await githubApiWithRetry(`/repos/${owner}/${repo}/git/blobs`, {
    method: 'POST',
    body: { content, encoding: isBinary ? 'base64' : 'utf-8' }
  });
  return { path: repoPath, mode: '100644', type: 'blob', sha: blob.sha };
}

async function createBlobWithRetry(fileMeta, maxFileRetries = 3) {
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      return await createBlobOnce(fileMeta);
    } catch (e) {
      const msg = String(e.message || e);
      if (msg.startsWith('SKIP_TOO_LARGE')) throw e;
      if (attempt < maxFileRetries) {
        const delay = RETRY_BASE_DELAY * Math.pow(BACKOFF_FACTOR, attempt - 1);
        console.warn(`⚠️ 补传失败（第 ${attempt} 次）：${fileMeta.repoPath}\n   原因：${msg}\n   ${delay}ms 后重试...`);
        await sleep(delay);
      } else {
        throw new Error(`FILE_FINAL_FAIL: ${fileMeta.repoPath} | last error: ${msg}`);
      }
    }
  }
}

async function runConcurrent(files, concurrency, progressBar) {
  const results = [];
  const failed  = [];
  const skipped = [];
  let cursor = 0;

  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= files.length) break;
      const f = files[idx];

      // 失败清单里只有 repoPath/localPath/size/reason，需校验本地仍然存在
      if (!fs.existsSync(f.localPath)) {
        failed.push({ ...f, reason: 'LOCAL_NOT_FOUND' });
        progressBar.increment(1, { filename: f.repoPath });
        continue;
      }

      try {
        const st = fs.statSync(f.localPath);
        const entry = await createBlobWithRetry({ ...f, size: st.size });
        results.push(entry);
      } catch (e) {
        const msg = String(e.message || e);
        if (msg.startsWith('SKIP_TOO_LARGE')) skipped.push({ ...f, reason: msg });
        else failed.push({ ...f, reason: msg });
      } finally {
        progressBar.increment(1, { filename: f.repoPath });
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return { results, failed, skipped };
}

async function main() {
  if (!token || token === 'YOUR_GITHUB_TOKEN') {
    console.error('❌ 未设置 GITHUB_TOKEN（请使用环境变量）');
    process.exit(1);
  }
  if (!fs.existsSync(FAILED_LIST_FILE)) {
    console.log('✅ 没有 failed_files.json，看来无需补传。');
    return;
  }

  const failedList = JSON.parse(fs.readFileSync(FAILED_LIST_FILE, 'utf8'));
  if (!Array.isArray(failedList) || failedList.length === 0) {
    console.log('✅ failed_files.json 为空，无需补传。');
    return;
  }

  console.log(`🔁 读取失败清单，共 ${failedList.length} 个待补传文件。`);

  // 获取最新 HEAD 和 base tree
  const refData   = await githubApiWithRetry(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
  const headSha   = refData.object.sha;
  const headCommit = await githubApiWithRetry(`/repos/${owner}/${repo}/git/commits/${headSha}`);
  const baseTreeSha = headCommit.tree.sha;

  const progressBar = new cliProgress.SingleBar({
    format: '补传 [{bar}] {percentage}% | {value}/{total} | {filename}',
    barCompleteChar: '█', barIncompleteChar: '-', hideCursor: true
  }, cliProgress.Presets.shades_classic);
  progressBar.start(failedList.length, 0, { filename: '' });

  const { results: treeEntries, failed, skipped } =
    await runConcurrent(failedList, CONCURRENCY_LIMIT, progressBar);
  progressBar.stop();

  if (failed.length) {
    fs.writeFileSync('failed_files_recheck.json', JSON.stringify(failed, null, 2), 'utf8');
    console.warn(`⚠️ 仍有 ${failed.length} 个文件失败，详见 failed_files_recheck.json`);
  }
  if (skipped.length) {
    fs.writeFileSync('skipped_files_recheck.json', JSON.stringify(skipped, null, 2), 'utf8');
    console.warn(`ℹ️ 仍有 ${skipped.length} 个大文件被跳过，详见 skipped_files_recheck.json（建议 LFS）`);
  }

  if (treeEntries.length === 0) {
    console.log('ℹ️ 本次无可提交的补传文件。');
    return;
  }

  console.log('🌳 创建补传 tree ...');
  const tree = await githubApiWithRetry(`/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    body: { base_tree: baseTreeSha, tree: treeEntries }
  });

  console.log('📝 创建补传 commit ...');
  const newCommit = await githubApiWithRetry(`/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    body: {
      message: `Retry upload ${treeEntries.length} file(s) from ${FAILED_LIST_FILE}`,
      tree: tree.sha,
      parents: [headSha]
    }
  });

  console.log(`📌 更新 ${branch} -> ${newCommit.sha} ...`);
  await githubApiWithRetry(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: { sha: newCommit.sha }
  });

  console.log(`✅ 补传完成：commit ${newCommit.sha}`);
}

main().catch(err => {
  console.error('❌ 未捕获异常：', err);
  process.exit(99);
});
```

---

## 额外提示（写进注释外，便于你把控）
- **中文/混合文件名**：路径统一 `replace(/\\/g, '/')`，GitHub API 接受 UTF-8；你在网页上看到的也是原名。  
- **大文件（>100 MB）**：GitHub 会拒绝；脚本已在 95 MB 提前跳过，输出 `skipped_files*.json`。建议把这些路径纳入 **Git LFS**。  
- **删除远端多余文件**：当前为“增量提交”。如需“镜像同步（含删除）”，需要列出远端树、对比差异、构造完整新树再提交——可后续再做。  
- **安全**：强烈建议用环境变量注入 `GITHUB_TOKEN`（最小权限、细粒度 token，仅授予目标仓库）。  
- **并发建议**：首次大批量上传时 `CONCURRENCY_LIMIT=3~5`，观察限流与错误，再按需提升到 `10~20`。

