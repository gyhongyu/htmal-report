/**
 * 报告管理模块
 * 处理报告的CRUD操作和索引文件管理
 */

import { GitHubAPI } from './github-api.js';

export class ReportsManager {
    constructor(githubApi) {
        this.github = githubApi;
        this.indexPath = 'data/reports-index.json';
    }

    /**
     * 获取报告索引
     */
    async getReportsIndex() {
        const file = await this.github.getFileContent(this.indexPath);

        if (!file) {
            // 索引文件不存在，返回空索引
            return {
                version: '1.0',
                lastUpdated: new Date().toISOString(),
                reports: [],
                sha: null
            };
        }

        try {
            const index = JSON.parse(file.content);
            return {
                ...index,
                sha: file.sha
            };
        } catch (error) {
            console.error('解析索引文件失败:', error);
            return {
                version: '1.0',
                lastUpdated: new Date().toISOString(),
                reports: [],
                sha: file.sha
            };
        }
    }

    /**
     * 保存报告索引
     */
    async saveReportsIndex(index, sha) {
        const content = JSON.stringify({
            version: index.version,
            lastUpdated: new Date().toISOString(),
            reports: index.reports
        }, null, 2);

        await this.github.createOrUpdateFile(
            this.indexPath,
            content,
            `Update reports index: ${index.reports.length} reports`,
            sha
        );
    }

    /**
     * 生成报告ID
     */
    generateReportId() {
        return `report-${Date.now()}`;
    }

    /**
     * 创建报告
     */
    async createReport(reportData) {
        const { title, description, categories, htmlCode } = reportData;

        // 生成报告ID和文件名
        const reportId = this.generateReportId();
        const fileName = `${reportId}.html`;
        const filePath = `reports/${fileName}`;

        // 获取当前索引
        const indexData = await this.getReportsIndex();

        // 创建报告元数据
        const now = new Date().toISOString();
        const reportMeta = {
            id: reportId,
            title: title || '无标题',
            description: description || '',
            categories: categories || [],
            fileName: fileName,
            createdAt: now,
            updatedAt: now
        };

        // 批量提交：HTML文件 + 索引文件
        const files = [
            {
                path: filePath,
                content: htmlCode
            },
            {
                path: this.indexPath,
                content: JSON.stringify({
                    version: '1.0',
                    lastUpdated: now,
                    reports: [...indexData.reports, reportMeta]
                }, null, 2)
            }
        ];

        await this.github.batchCommit(
            files,
            `Create report: ${title || reportId}`
        );

        return {
            ...reportMeta,
            htmlCode
        };
    }

    /**
     * 更新报告
     */
    async updateReport(reportId, reportData) {
        const { title, description, categories, htmlCode } = reportData;

        // 获取当前索引
        const indexData = await this.getReportsIndex();

        // 查找报告
        const reportIndex = indexData.reports.findIndex(r => r.id === reportId);
        if (reportIndex === -1) {
            throw new Error(`报告不存在: ${reportId}`);
        }

        const existingReport = indexData.reports[reportIndex];
        const filePath = `reports/${existingReport.fileName}`;

        // 更新报告元数据
        const now = new Date().toISOString();
        const updatedMeta = {
            ...existingReport,
            title: title !== undefined ? title : existingReport.title,
            description: description !== undefined ? description : existingReport.description,
            categories: categories !== undefined ? categories : existingReport.categories,
            updatedAt: now
        };

        indexData.reports[reportIndex] = updatedMeta;

        // 批量提交：HTML文件 + 索引文件
        const files = [
            {
                path: filePath,
                content: htmlCode
            },
            {
                path: this.indexPath,
                content: JSON.stringify({
                    version: '1.0',
                    lastUpdated: now,
                    reports: indexData.reports
                }, null, 2)
            }
        ];

        await this.github.batchCommit(
            files,
            `Update report: ${updatedMeta.title}`
        );

        return {
            ...updatedMeta,
            htmlCode
        };
    }

    /**
     * 删除报告
     */
    async deleteReport(reportId) {
        // 获取当前索引
        const indexData = await this.getReportsIndex();

        // 查找报告
        const report = indexData.reports.find(r => r.id === reportId);
        if (!report) {
            throw new Error(`报告不存在: ${reportId}`);
        }

        const filePath = `reports/${report.fileName}`;

        // 获取HTML文件的SHA (用于删除)
        const htmlFile = await this.github.getFileContent(filePath);
        if (!htmlFile) {
            throw new Error(`HTML文件不存在: ${filePath}`);
        }

        // 移除索引中的报告
        indexData.reports = indexData.reports.filter(r => r.id !== reportId);

        // 先删除HTML文件
        await this.github.deleteFile(
            filePath,
            htmlFile.sha,
            `Delete report: ${report.title}`
        );

        // 再更新索引
        await this.saveReportsIndex(indexData, indexData.sha);

        return { success: true, deletedReport: report };
    }

    /**
     * 获取单个报告详情
     */
    async getReport(reportId) {
        // 获取索引
        const indexData = await this.getReportsIndex();

        // 查找报告元数据
        const reportMeta = indexData.reports.find(r => r.id === reportId);
        if (!reportMeta) {
            return null;
        }

        // 获取HTML内容
        const filePath = `reports/${reportMeta.fileName}`;
        const htmlFile = await this.github.getFileContent(filePath);

        if (!htmlFile) {
            return null;
        }

        return {
            ...reportMeta,
            htmlCode: htmlFile.content
        };
    }

    /**
     * 获取所有报告列表(仅元数据)
     */
    async getAllReports() {
        const indexData = await this.getReportsIndex();
        return indexData.reports;
    }
}
