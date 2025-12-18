/**
 * Admin Backend Server
 * Express 服务器，提供报告管理 API
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ConfigManager } from './lib/config-manager.js';
import { GitHubAPI } from './lib/github-api.js';
import { ReportsManager } from './lib/reports-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// 初始化配置管理器
const configManager = new ConfigManager();

// 全局变量存储 GitHub API 和 Reports Manager 实例
let githubApi = null;
let reportsManager = null;

// 初始化 GitHub API 和 Reports Manager
function initializeManagers() {
    const config = configManager.getConfig();
    if (config && config.owner && config.repo && config.token) {
        githubApi = new GitHubAPI(config.owner, config.repo, config.token);
        reportsManager = new ReportsManager(githubApi);
        return true;
    }
    return false;
}

// 启动时尝试初始化
const initialized = initializeManagers();

// ===================== 配置相关 API =====================

/**
 * 获取配置状态
 */
app.get('/api/config/status', (req, res) => {
    const config = configManager.getConfig();
    const hasConfig = configManager.isConfigValid();

    res.json({
        configured: hasConfig,
        config: hasConfig ? {
            owner: config.owner,
            repo: config.repo,
            tokenSet: !!config.token,
            port: config.port
        } : null
    });
});

/**
 * 保存配置
 */
app.post('/api/config/save', (req, res) => {
    const { owner, repo, token, port } = req.body;

    if (!owner || !repo || !token) {
        return res.status(400).json({
            success: false,
            error: '缺少必要配置项'
        });
    }

    const success = configManager.saveConfig(owner, repo, token, port);

    if (success) {
        // 重新初始化管理器
        initializeManagers();

        res.json({
            success: true,
            message: '配置保存成功'
        });
    } else {
        res.status(500).json({
            success: false,
            error: '保存配置失败'
        });
    }
});

/**
 * 更新配置
 */
app.put('/api/config/update', (req, res) => {
    const updates = req.body;

    const success = configManager.updateConfig(updates);

    if (success) {
        initializeManagers();
        res.json({
            success: true,
            message: '配置更新成功'
        });
    } else {
        res.status(500).json({
            success: false,
            error: '更新配置失败'
        });
    }
});

// ===================== 报告管理 API =====================

// 中间件：检查配置是否已完成
function requireConfig(req, res, next) {
    if (!reportsManager) {
        return res.status(400).json({
            success: false,
            error: '请先配置 GitHub 仓库信息'
        });
    }
    next();
}

/**
 * 获取所有报告列表
 */
app.get('/api/reports', requireConfig, async (req, res) => {
    try {
        const reports = await reportsManager.getAllReports();
        res.json({
            success: true,
            reports
        });
    } catch (error) {
        console.error('获取报告列表失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 获取单个报告详情
 */
app.get('/api/reports/:id', requireConfig, async (req, res) => {
    try {
        const report = await reportsManager.getReport(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                error: '报告不存在'
            });
        }

        res.json({
            success: true,
            report
        });
    } catch (error) {
        console.error('获取报告失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 创建报告
 */
app.post('/api/reports', requireConfig, async (req, res) => {
    try {
        const { title, description, categories, htmlCode } = req.body;

        // 验证必填字段
        if (!title || !htmlCode) {
            return res.status(400).json({
                success: false,
                error: '缺少标题或HTML内容'
            });
        }

        if (!categories || categories.length < 3) {
            return res.status(400).json({
                success: false,
                error: '至少需要选择3个分类标签'
            });
        }

        const report = await reportsManager.createReport({
            title,
            description,
            categories,
            htmlCode
        });

        res.json({
            success: true,
            message: '报告创建成功',
            report
        });
    } catch (error) {
        console.error('创建报告失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 更新报告
 */
app.put('/api/reports/:id', requireConfig, async (req, res) => {
    try {
        const { title, description, categories, htmlCode } = req.body;

        // 验证必填字段
        if (!title || !htmlCode) {
            return res.status(400).json({
                success: false,
                error: '缺少标题或HTML内容'
            });
        }

        if (categories && categories.length < 3) {
            return res.status(400).json({
                success: false,
                error: '至少需要选择3个分类标签'
            });
        }

        const report = await reportsManager.updateReport(req.params.id, {
            title,
            description,
            categories,
            htmlCode
        });

        res.json({
            success: true,
            message: '报告更新成功',
            report
        });
    } catch (error) {
        console.error('更新报告失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 删除报告
 */
app.delete('/api/reports/:id', requireConfig, async (req, res) => {
    try {
        const result = await reportsManager.deleteReport(req.params.id);

        res.json({
            success: true,
            message: '报告删除成功',
            ...result
        });
    } catch (error) {
        console.error('删除报告失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 测试GitHub连接
 */
app.get('/api/test/connection', requireConfig, async (req, res) => {
    try {
        const repoInfo = await githubApi.getRepoInfo();
        res.json({
            success: true,
            message: '连接成功',
            repo: {
                name: repoInfo.name,
                fullName: repoInfo.full_name,
                private: repoInfo.private,
                defaultBranch: repoInfo.default_branch
            }
        });
    } catch (error) {
        console.error('测试连接失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 启动服务器
const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
    console.log('========================================');
    console.log('HTML Reports Admin 管理后台');
    console.log('========================================');
    console.log(`运行于: http://localhost:${PORT}`);
    console.log('');

    if (initialized) {
        const config = configManager.getConfig();
        console.log('✓ 配置已加载');
        console.log(`  仓库: ${config.owner}/${config.repo}`);
    } else {
        console.log('⚠️  尚未配置');
        console.log('  请在浏览器中完成首次配置');
    }

    console.log('========================================');
});
