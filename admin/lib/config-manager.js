/**
 * 配置管理模块
 * 处理 .env 文件的读取、保存和更新
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ConfigManager {
    constructor(configPath = path.join(__dirname, '..', '.env')) {
        this.configPath = configPath;
    }

    /**
     * 检查配置文件是否存在
     */
    hasConfig() {
        return fs.existsSync(this.configPath);
    }

    /**
     * 读取配置
     */
    readConfig() {
        if (!this.hasConfig()) {
            return null;
        }

        try {
            const content = fs.readFileSync(this.configPath, 'utf8');
            const config = {};

            content.split('\n').forEach(line => {
                line = line.trim();

                // 跳过注释和空行
                if (!line || line.startsWith('#')) return;

                const equalIndex = line.indexOf('=');
                if (equalIndex === -1) return;

                const key = line.substring(0, equalIndex).trim();
                let value = line.substring(equalIndex + 1).trim();

                // 移除引号
                value = value.replace(/^["']|["']$/g, '');

                if (key && value) {
                    config[key] = value;
                }
            });

            return config;
        } catch (error) {
            console.error('读取配置文件失败:', error);
            return null;
        }
    }

    /**
     * 保存配置
     */
    saveConfig(owner, repo, token, port = 3030, baseUrl = '') {
        const content = `# GitHub 配置
# 此文件包含敏感信息，请勿上传到 Git

# GitHub 用户名
GITHUB_OWNER=${owner}

# 倉庫名稱
GITHUB_REPO=${repo}

# Personal Access Token
GITHUB_TOKEN=${token}

# 伺服器端口
PORT=${port}

# 預覽網址 (GitHub Pages 或自定義域名)
PREVIEW_BASE_URL=${baseUrl}
`;

        try {
            fs.writeFileSync(this.configPath, content, 'utf8');
            return true;
        } catch (error) {
            console.error('保存配置文件失敗:', error);
            return false;
        }
    }

    /**
     * 更新配置（部分更新）
     */
    updateConfig(updates) {
        const current = this.readConfig() || {};

        return this.saveConfig(
            updates.owner || current.GITHUB_OWNER,
            updates.repo || current.GITHUB_REPO,
            updates.token || current.GITHUB_TOKEN,
            updates.port || current.PORT || 3030,
            updates.baseUrl !== undefined ? updates.baseUrl : current.PREVIEW_BASE_URL || ''
        );
    }

    /**
     * 获取配置值
     */
    getConfig() {
        const config = this.readConfig();
        if (!config) return null;

        return {
            owner: config.GITHUB_OWNER,
            repo: config.GITHUB_REPO,
            token: config.GITHUB_TOKEN,
            port: config.PORT || 3030,
            baseUrl: config.PREVIEW_BASE_URL || ''
        };
    }

    /**
     * 验证配置是否完整
     */
    isConfigValid() {
        const config = this.getConfig();
        return config && config.owner && config.repo && config.token;
    }
}
