/**
 * GitHub API 封装模块
 * 基于 test-api 中验证过的实现
 * 包含自动重试、限流处理等功能
 */

import fetch from 'node-fetch';

export class GitHubAPI {
    constructor(owner, repo, token) {
        this.owner = owner;
        this.repo = repo;
        this.token = token;
        this.baseUrl = 'https://api.github.com';
        this.MAX_RETRIES = 5;
        this.RETRY_BASE_DELAY = 1500;
        this.BACKOFF_FACTOR = 2;
    }

    /**
     * 统一的 API 调用方法（含重试和限流处理）
     */
    async apiCall(endpoint, options = {}, attempt = 1) {
        const url = `${this.baseUrl}${endpoint}`;
        const res = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `token ${this.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github+json',
                ...options.headers
            }
        });

        if (res.ok) {
            const text = await res.text();
            return text ? JSON.parse(text) : {};
        }

        // 处理限流
        const remaining = res.headers.get('x-ratelimit-remaining');
        const resetAt = res.headers.get('x-ratelimit-reset');

        if (res.status === 403 && remaining === '0' && resetAt) {
            const resetMs = Math.max(0, Number(resetAt) * 1000 - Date.now()) + 1000;
            console.warn(`触发 GitHub 限流，等待 ${(resetMs / 1000).toFixed(1)} 秒...`);
            await this.sleep(resetMs);
            return this.apiCall(endpoint, options, attempt);
        }

        // 重试逻辑
        const retriable = res.status >= 500 || [502, 503, 429].includes(res.status);
        if (retriable && attempt < this.MAX_RETRIES) {
            const delay = this.RETRY_BASE_DELAY * Math.pow(this.BACKOFF_FACTOR, attempt - 1);
            console.warn(`API 调用失败 (${res.status})，第 ${attempt} 次重试，等待 ${delay}ms`);
            await this.sleep(delay);
            return this.apiCall(endpoint, options, attempt + 1);
        }

        const errText = await res.text();
        throw new Error(`GitHub API Error: ${res.status} - ${errText}`);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 获取仓库信息
     */
    async getRepoInfo() {
        return await this.apiCall(`/repos/${this.owner}/${this.repo}`);
    }

    /**
     * 创建或更新文件
     */
    async createOrUpdateFile(path, content, message, sha = null) {
        const base64Content = Buffer.from(content).toString('base64');
        const body = {
            message,
            content: base64Content
        };

        if (sha) {
            body.sha = sha;
        }

        return await this.apiCall(
            `/repos/${this.owner}/${this.repo}/contents/${path}`,
            {
                method: 'PUT',
                body: JSON.stringify(body)
            }
        );
    }

    /**
     * 获取文件内容
     */
    async getFileContent(path) {
        try {
            const result = await this.apiCall(
                `/repos/${this.owner}/${this.repo}/contents/${path}`
            );

            if (result.content) {
                const content = Buffer.from(result.content, 'base64').toString('utf8');
                return {
                    content,
                    sha: result.sha,
                    path: result.path,
                    name: result.name
                };
            }
            return null;
        } catch (error) {
            if (error.message.includes('404')) {
                return null; // 文件不存在
            }
            throw error;
        }
    }

    /**
     * 删除文件
     */
    async deleteFile(path, sha, message) {
        return await this.apiCall(
            `/repos/${this.owner}/${this.repo}/contents/${path}`,
            {
                method: 'DELETE',
                body: JSON.stringify({
                    message,
                    sha
                })
            }
        );
    }

    /**
     * 批量创建/更新文件（使用 Git Tree API）
     * 适合一次提交多个文件
     */
    async batchCommit(files, commitMessage) {
        // 1. 获取当前分支的最新 commit
        const refData = await this.apiCall(`/repos/${this.owner}/${this.repo}/git/ref/heads/main`);
        const headSha = refData.object.sha;

        // 2. 获取 base tree
        const headCommit = await this.apiCall(`/repos/${this.owner}/${this.repo}/git/commits/${headSha}`);
        const baseTreeSha = headCommit.tree.sha;

        // 3. 为每个文件创建 blob
        const treeEntries = [];
        for (const file of files) {
            const isBinary = this.isBinaryContent(file.content);
            const content = isBinary
                ? Buffer.from(file.content).toString('base64')
                : file.content;

            const blob = await this.apiCall(
                `/repos/${this.owner}/${this.repo}/git/blobs`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        content,
                        encoding: isBinary ? 'base64' : 'utf-8'
                    })
                }
            );

            treeEntries.push({
                path: file.path,
                mode: '100644',
                type: 'blob',
                sha: blob.sha
            });
        }

        // 4. 创建 tree
        const tree = await this.apiCall(
            `/repos/${this.owner}/${this.repo}/git/trees`,
            {
                method: 'POST',
                body: JSON.stringify({
                    base_tree: baseTreeSha,
                    tree: treeEntries
                })
            }
        );

        // 5. 创建 commit
        const newCommit = await this.apiCall(
            `/repos/${this.owner}/${this.repo}/git/commits`,
            {
                method: 'POST',
                body: JSON.stringify({
                    message: commitMessage,
                    tree: tree.sha,
                    parents: [headSha]
                })
            }
        );

        // 6. 更新分支引用
        await this.apiCall(
            `/repos/${this.owner}/${this.repo}/git/refs/heads/main`,
            {
                method: 'PATCH',
                body: JSON.stringify({
                    sha: newCommit.sha
                })
            }
        );

        return newCommit;
    }

    /**
     * 简单判断是否为二进制内容
     */
    isBinaryContent(content) {
        if (typeof content !== 'string') return true;
        // 检查是否包含 null 字节
        return content.includes('\0');
    }
}
