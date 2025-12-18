# **使用GitHub作为文件中转站的标准作业程序(SOP)**

版本: 1.0  
日期: 2025年8月13日  
目的: 本文档旨在规范化利用GitHub作为临时文件存储中转站的操作流程，以供大语言模型（LLM）安全、高效地访问文件URL。

## **第一部分：仓库管理员操作流程**

本部分适用于负责创建和维护GitHub仓库及安全凭证的负责人。

### **步骤一：创建专用的GitHub仓库**

1. **登录GitHub账户**。  
2. 在页面右上角，点击 \+ 号，然后选择 **New repository**。  
3. **填写仓库信息**:  
   * **Repository name**: 建议使用一个清晰的名称，例如 llm-file-transit-station。  
   * **Description**: （可选）填写描述，例如 "用于AI应用临时文件上传的公共中转仓库"。  
   * **Public/Private**: **必须选择 Public**。因为只有公共仓库中的文件才能被大模型通过URL直接访问。  
   * **Initialize this repository with a README**: 建议勾选此项，方便仓库初始化。  
4. 点击 **Create repository** 完成创建。

### **步骤二：生成个人访问令牌 (Personal Access Token)**

此令牌是让您的后端代码获得操作仓库权限的“密码”，必须严格保密。

1. 在GitHub页面右上角，点击您的头像，然后选择 **Settings**。  
2. 在左侧导航栏最下方，点击 **Developer settings**。  
3. 在新的左侧导航栏中，选择 **Personal access tokens \-\> Tokens (classic)**。  
4. 点击 **Generate new token** 按钮，然后选择 **Generate new token (classic)**。  
5. **填写令牌信息**:  
   * **Note**: 给令牌一个描述性名称，例如 LLM\_File\_Uploader\_Token。  
   * **Expiration**: 设置令牌的有效期。为了安全，可以选择一个有效期（如90天）。如果项目需要长期运行，也可以选择 No expiration。  
   * **Select scopes**: 这是最关键的一步。**只需要勾选 repo 这个顶级复选框即可**。它将授予令牌对仓库的完全控制权，包括读、写和删除。  
6. 点击页面最下方的 **Generate token** 按钮。

### **步骤三：安全地交付凭证**

1. **立即复制令牌**: 令牌生成后会立即显示，这是**唯一一次**看到完整令牌的机会。请立即将其复制到一个安全的地方。如果刷新页面，令牌将无法再次完整显示。  
2. **准备交付信息**: 您需要向开发团队提供以下两个信息：  
   * **GitHub仓库名称**: 格式为 您的用户名/您的仓库名 (例如: gyhongyu/llm-file-transit-station)。  
   * **新生成的个人访问令牌**: (例如: ghp\_YourNewSecretTokenGoesHere)。  
3. **安全交付**: **绝对禁止**通过微信、邮件等明文方式发送令牌。最佳实践是：  
   * 将这两个信息存入一个名为 .env 的文本文件中。  
   * 通过安全的方式（如加密U盘、安全的密码管理器分享功能等）将此 .env 文件交给开发人员。

**交付给开发人员的 .env 文件模板：**

\# .env  
\# 用于GitHub文件上传的凭证  
GITHUB\_REPO="您的用户名/您的仓库名"  
GITHUB\_PAT="ghp\_您新生成的安全令牌粘贴在这里"

## **第二部分：开发人员操作指南**

本部分包含开发人员在项目中实现文件上传、获取URL及删除文件的完整代码和步骤。

### **步骤一：项目环境设置**

1. 创建一个新的Node.js项目目录。  
2. 在项目根目录下，创建一个名为 .env 的文件，并将管理员提供的凭证内容粘贴进去。  
3. 打开终端，安装所有必需的依赖库：  
   npm init \-y  
   npm install express multer axios cors dotenv

### **步骤二：后端服务器代码 (server.js)**

在项目根目录下创建 server.js 文件，并粘贴以下完整代码。此服务器提供了文件上传和删除两个核心API。

// server.js

// 1\. 引入所需库  
const express \= require('express');  
const multer \= require('multer');  
const axios \= require('axios');  
const cors \= require('cors');  
require('dotenv').config(); // 确保此行在顶部，以便加载.env文件中的环境变量

// 2\. 初始化应用和中间件  
const app \= express();  
app.use(cors()); // 允许跨域请求  
app.use(express.json()); // 用于解析删除请求中的JSON体  
const upload \= multer({ storage: multer.memoryStorage() }); // 使用内存存储，避免在服务器上留下临时文件

// 3\. 从环境变量中安全地读取凭证  
const GITHUB\_TOKEN \= process.env.GITHUB\_PAT;  
const GITHUB\_REPO \= process.env.GITHUB\_REPO;

// \--- API Endpoint 1: 文件上传 \---  
app.post('/api/upload', upload.single('file'), async (req, res) \=\> {  
    // 检查文件是否存在  
    if (\!req.file) {  
        return res.status(400).json({ error: '没有提供文件' });  
    }  
    // 检查凭证是否已配置  
    if (\!GITHUB\_TOKEN || \!GITHUB\_REPO) {  
        return res.status(500).json({ error: '服务器未配置GitHub凭证' });  
    }

    try {  
        // 为防止文件名冲突，在文件名前加上时间戳  
        const fileName \= \`${Date.now()}-${req.file.originalname}\`;  
        // GitHub API需要文件内容为Base64编码  
        const fileContent \= req.file.buffer.toString('base64');  
        const url \= \`https://api.github.com/repos/${GITHUB\_REPO}/contents/${fileName}\`;

        const response \= await axios.put(url, {  
            message: \`upload: ${fileName}\`, // Git commit 信息  
            content: fileContent  
        }, {  
            headers: { 'Authorization': \`token ${GITHUB\_TOKEN}\` }  
        });

        // 成功后，返回三个关键信息给前端  
        res.json({  
            download\_url: response.data.content.download\_url, // 文件下载URL，用于传给LLM  
            sha: response.data.content.sha,                  // 文件的唯一SHA值，删除时必需  
            path: response.data.content.path,                // 文件在仓库中的路径，删除时必需  
        });  
    } catch (error) {  
        console.error('GitHub API Upload Error:', error.response?.data || error.message);  
        res.status(500).json({ error: '上传文件至GitHub失败' });  
    }  
});

// \--- API Endpoint 2: 文件删除 \---  
app.post('/api/delete', async (req, res) \=\> {  
    // 从请求体中获取路径和SHA值  
    const { path, sha } \= req.body;

    if (\!path || \!sha) {  
        return res.status(400).json({ error: '请求中缺少文件路径(path)或SHA值' });  
    }

    try {  
        const url \= \`https://api.github.com/repos/${GITHUB\_REPO}/contents/${path}\`;

        await axios.delete(url, {  
            headers: { 'Authorization': \`token ${GITHUB\_TOKEN}\` },  
            data: {  
                message: \`delete: ${path}\`, // Git commit 信息  
                sha: sha                   // 必须提供要删除文件的准确SHA值  
            }  
        });

        res.json({ message: '文件已成功从GitHub删除' });  
    } catch (error) {  
        console.error('GitHub API Delete Error:', error.response?.data || error.message);  
        res.status(500).json({ error: '从GitHub删除文件失败' });  
    }  
});

// 4\. 启动服务器  
const PORT \= 3000;  
app.listen(PORT, () \=\> {  
    console.log(\`中转站代理服务器正在 http://localhost:${PORT} 运行\`);  
});

### **步骤三：前端实现代码 (index.html)**

在项目根目录下创建 index.html 文件。此文件包含一个完整的用户界面和JS逻辑，用于演示整个“上传 \-\> 处理 \-\> 删除”的流程。

\<\!DOCTYPE html\>  
\<html lang="zh-CN"\>  
\<head\>  
    \<meta charset="UTF-8"\>  
    \<meta name="viewport" content="width=device-width, initial-scale=1.0"\>  
    \<title\>GitHub文件中转站客户端\</title\>  
    \<style\>  
        body { font-family: sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: auto; }  
        \#logs { background-color: \#f4f4f4; border: 1px solid \#ddd; padding: 10px; margin-top: 20px; white-space: pre-wrap; font-family: monospace; }  
        button { padding: 10px 15px; cursor: pointer; }  
    \</style\>  
\</head\>  
\<body\>  
    \<h1\>GitHub文件中转站 \- 完整流程演示\</h1\>  
    \<p\>选择一个文件，点击按钮开始“上传 \-\> 模拟AI处理 \-\> 删除”的完整流程。\</p\>  
      
    \<input type="file" id="file-uploader"\>  
    \<button onclick="handleFileProcessing()"\>开始处理\</button\>

    \<h3\>处理日志:\</h3\>  
    \<div id="logs"\>\</div\>

    \<script\>  
        const MY\_BACKEND\_URL \= 'http://localhost:3000';  
        const logsContainer \= document.getElementById('logs');

        // 记录日志到页面  
        function log(message) {  
            logsContainer.innerHTML \+= message \+ '\\n';  
        }

        // 核心处理函数  
        async function handleFileProcessing() {  
            logsContainer.innerHTML \= ''; // 清空日志  
            const fileInput \= document.getElementById('file-uploader');  
            if (\!fileInput.files\[0\]) {  
                alert('请先选择一个文件');  
                return;  
            }

            let uploadInfo; // 用于存储上传成功后的信息 { download\_url, sha, path }

            try {  
                // \--- 阶段1: 上传文件到后端，再由后端上传到GitHub \---  
                log('1. 开始上传文件...');  
                const formData \= new FormData();  
                formData.append('file', fileInput.files\[0\]);

                const uploadResponse \= await fetch(\`${MY\_BACKEND\_URL}/api/upload\`, {  
                    method: 'POST',  
                    body: formData,  
                });  
                uploadInfo \= await uploadResponse.json();

                if (\!uploadResponse.ok) throw new Error('上传失败: ' \+ (uploadInfo.error || '未知错误'));  
                log(\`   ✔️ 文件上传成功\! URL: ${uploadInfo.download\_url}\`);

                // \--- 阶段2: 将URL和提示词发送给大模型 (此处为模拟) \---  
                log('\\n2. 将URL发送给大模型进行处理...');  
                // 真实场景: const llmResult \= await callYourLLM(uploadInfo.download\_url, "你的提示词");  
                await new Promise(resolve \=\> setTimeout(resolve, 1500)); // 模拟网络延迟和AI处理时间  
                const llmResult \= { success: true, content: "这是大模型根据文件内容返回的分析结果。" };  
                log(\`   ✔️ 大模型处理完成。\`);

                // \--- 阶段3: 根据处理结果，调用后端删除GitHub上的文件 \---  
                if (llmResult.success) {  
                    log('\\n3. 开始删除GitHub上的临时文件...');  
                    const deleteResponse \= await fetch(\`${MY\_BACKEND\_URL}/api/delete\`, {  
                        method: 'POST',  
                        headers: { 'Content-Type': 'application/json' },  
                        body: JSON.stringify({  
                            path: uploadInfo.path,  
                            sha: uploadInfo.sha  
                        })  
                    });  
                    const deleteResult \= await deleteResponse.json();  
                    if (\!deleteResponse.ok) throw new Error('删除失败: ' \+ (deleteResult.error || '未知错误'));

                    log(\`   ✔️ 临时文件 (${uploadInfo.path}) 已成功删除\!\`);  
                }  
                log('\\n🎉 完整流程执行完毕\!');

            } catch (error) {  
                log(\`\\n❌ 流程中出现错误: ${error.message}\`);  
                // 增加错误处理：如果文件已上传但后续步骤失败，尝试清理文件  
                if (uploadInfo && uploadInfo.path) {  
                    log('   \> 正在尝试清理已上传的临时文件...');  
                    try {  
                         await fetch(\`${MY\_BACKEND\_URL}/api/delete\`, {  
                            method: 'POST',  
                            headers: { 'Content-Type': 'application/json' },  
                            body: JSON.stringify({ path: uploadInfo.path, sha: uploadInfo.sha })  
                        });  
                        log('   \> 清理成功。');  
                    } catch (cleanupError) {  
                        log(\`   \> 清理失败，请手动检查仓库。错误: ${cleanupError.message}\`);  
                    }  
                }  
            }  
        }  
    \</script\>  
\</body\>  
\</html\>

### **步骤四：运行和测试**

1. 在终端中，确保您位于项目根目录下，运行后端服务器：  
   node server.js

   您应该会看到 中转站代理服务器正在 http://localhost:3000 运行 的提示。  
2. 用浏览器打开 index.html 文件。  
3. 点击“选择文件”按钮，任选一个文件。  
4. 点击“开始处理”按钮，观察下方的日志输出，它会实时显示整个流程的每一步。