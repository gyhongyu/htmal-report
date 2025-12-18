# HTML Reports 管理系统

基于 GitHub Pages 的静态报告展示系统 + 本地 Node.js Admin 管理后台。

**在线访问**：https://html.foxlink.co.in

---

## 🚀 快速开始

### 新电脑使用流程

```bash
# 1. git clone 仓库
git clone https://github.com/gyhongyu/htmal-report.git
cd htmal-report

# 2. 运行 start.bat
start.bat

# 3. 浏览器自动打开 localhost:3030
# 4. 首次访问 → 弹出配置窗口
# 5. 填写 GitHub 信息 → 保存
# 6. 自动创建 admin/.env
# 7. 开始使用
```

**就这么简单！** 脚本会自动：
- ✅ 检测 Git 是否安装
- ✅ 检测 Node.js 是否安装  
- ✅ 自动安装依赖（npm install）
- ✅ 检测端口占用
- ✅ 启动服务器并打开浏览器

---

## 📋 前置要求

只需安装两个软件：

1. **Git**  
   下载：https://git-scm.com/downloads

2. **Node.js (LTS 版本)**  
   下载：https://nodejs.org/

---

## 🏗️ 项目架构

### 双端系统

#### 本地 Admin 后台
- **地址**: http://localhost:3030
- **功能**: 创建、编辑、删除报告
- **技术**: Node.js + Express + React
- **存储**: 通过 GitHub API 自动同步

#### 在线查看平台  
- **地址**: https://html.foxlink.co.in
- **功能**: 只读查看、搜索、分享、预览
- **技术**: 纯静态 HTML + React（GitHub Pages）
- **特性**: 自动版本检测，打开即最新

---

## 📁 项目结构

```
htmal-report/
├── start.bat              # 智能启动脚本（根目录）
├── index.html            # 前端主页
├── preview.html         # 预览页面
├── app.js              # 前端应用逻辑
│
├── components/         # React 组件
│   ├── HomePage.js
│   ├── PageCard.js
│   └── ...
│
├── utils/             # 工具函数
│   └── reportsLoader.js
│
├── reports/          # HTML 报告文件
│   └── report-*.html
│
├── data/
│   └── reports-index.json  # 报告索引和版本信息
│
└── admin/            # 本地管理后台
    ├── server.js     # Express 服务器
    ├── .env         # 配置文件（自动生成，不上传）
    ├── .env.example # 配置示例
    │
    ├── lib/        # 后端模块
    │   ├── github-api.js       # GitHub API 封装
    │   ├── config-manager.js   # 配置管理
    │   └── reports-manager.js  # 报告 CRUD
    │
    └── public/     # Admin 前端
        ├── index.html
        ├── app.js
        └── components/
```

---

## ⚙️ 首次配置

运行 `start.bat` 后，首次访问会弹出配置窗口：

### 需要填写的信息

1. **GitHub 用户名**  
   例如：`gyhongyu`

2. **仓库名称**  
   例如：`htmal-report`

3. **Personal Access Token (PAT)**
   - 访问：https://github.com/settings/tokens/new
   - 勾选 `repo` 权限
   - 生成并复制 Token
   - 粘贴到配置窗口

4. **服务器端口**（可选）  
   默认：`3030`

**保存后自动创建 `admin/.env` 文件**，无需手动操作。

---

## 📝 使用流程

### 创建报告

1. 打开 Admin 后台（http://localhost:3030）
2. 点击"创建新页面"
3. 编辑 HTML 内容
4. 填写标题、描述、选择分类
5. 点击"保存" → **自动同步到 GitHub**

### 查看报告

**方式 1 - 在线查看**：
- 访问 https://html.foxlink.co.in
- 自动显示最新内容
- 支持搜索、筛选、分享

**方式 2 - 本地预览**：
- 在 Admin 后台点击"预览"
- 或访问 `/preview.html?id=报告ID`

### 编辑/删除报告

1. 在 Admin 后台找到对应报告
2. 点击"编辑"或"删除"
3. 保存后 → **自动同步到 GitHub**

---

## 🔄 自动更新机制

### 工作原理

1. 每次本地保存报告 → 更新 `reports-index.json` 的 `lastUpdated`
2. 访问公网地址 → 检查本地缓存的版本号
3. 如发现新版本 → 自动刷新页面
4. 加载最新内容

### 用户体验

```
本地编辑 → 关闭浏览器 → 重新访问公网
→ 显示加载动画 → 自动检测更新 → 显示最新内容
```

**无需任何手动刷新！** ✨

---

## 🛠️ 常见问题

### Q: 端口 3030 被占用怎么办？

**A**: `start.bat` 会自动检测并询问是否关闭占用进程。或手动关闭：

```powershell
# 查找占用端口的进程
netstat -ano | findstr :3030

# 关闭进程（替换 PID）
taskkill /F /PID <进程ID>
```

### Q: 如何在多台电脑之间同步？

**A**: 
```bash
# 在新电脑上
git clone https://github.com/gyhongyu/htmal-report.git
cd htmal-report
start.bat
# 填写相同的 GitHub 配置即可
```

### Q: 如何备份数据？

**A**: 所有数据都在 GitHub 仓库中：
- `reports/` - HTML 文件
- `data/reports-index.json` - 索引文件

定期 `git pull` 或直接在 GitHub 下载即可。

### Q: Token 过期了怎么办？

**A**: 
1. 访问 http://localhost:3030
2. 点击右上角"设置"图标
3. 重新填写新的 Token
4. 保存即可

### Q: 公网显示的不是最新内容？

**A**: 
- 首次访问后会自动检测版本
- 如果页面已打开，按 **F5** 刷新
- 关闭后重新打开会自动更新

---

## 🔐 安全说明

- ✅ Admin 后台仅在本地运行（localhost:3030）
- ✅ GitHub Token 保存在本地 `.env` 文件（已在 .gitignore）
- ✅ Token 永远不会上传到 GitHub
- ⚠️ GitHub Pages 上的报告是公开的（如仓库为 Public）

---

## 🎨 技术栈

### 前端
- React 18
- TailwindCSS (CDN)
- Babel Standalone
- Lucide Icons

### 后端
- Node.js
- Express
- GitHub REST API

### 部署
- GitHub Pages
- 自定义域名：html.foxlink.co.in

---

## 📜 许可证

MIT License

---

## 💡 提示

- 第一次运行会自动安装依赖（需要几分钟）
- 建议使用 Chrome 或 Edge 浏览器
- 网络不稳定时 GitHub API 可能失败，重试即可
- 自定义域名配置请查看 GitHub Pages 设置

---

**享受使用！**🚀
