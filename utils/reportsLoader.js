// 从 GitHub Pages 加载报告的工具函数
// 禁用所有缓存，确保实时获取最新数据

/**
 * 从 data/reports-index.json 加载报告索引
 * 使用时间戳和禁用缓存 headers 确保获取最新数据
 */
async function loadReportsIndex() {
    try {
        // 添加时间戳防止缓存
        const timestamp = Date.now();
        const response = await fetch(`./data/reports-index.json?v=${timestamp}`, {
            cache: 'no-store', // 禁用缓存
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        if (!response.ok) {
            console.error('无法加载报告索引');
            return { reports: [] };
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('加载报告索引失败:', error);
        return { reports: [] };
    }
}

/**
 * 获取所有报告列表（只包含元数据）
 */
async function getAllStoredPages() {
    try {
        const indexData = await loadReportsIndex();
        return indexData.reports.map(r => ({
            pageId: r.id,
            title: r.title,
            description: r.description,
            categories: r.categories,
            fileName: r.fileName,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt
        }));
    } catch (error) {
        console.error('获取报告列表失败:', error);
        return [];
    }
}

/**
 * 根据文件名获取报告HTML内容
 * 禁用缓存确保获取最新版本
 */
async function getReportHTML(fileName) {
    try {
        const timestamp = Date.now();
        const response = await fetch(`./reports/${fileName}?v=${timestamp}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        if (!response.ok) {
            return null;
        }
        return await response.text();
    } catch (error) {
        console.error('获取报告内容失败:', error);
        return null;
    }
}

/**
 * 获取报告完整数据（元数据 + HTML内容）
 */
async function getStoredPageData(pageId) {
    try {
        const indexData = await loadReportsIndex();
        const reportMeta = indexData.reports.find(r => r.id === pageId);

        if (!reportMeta) {
            return null;
        }

        const htmlCode = await getReportHTML(reportMeta.fileName);

        if (!htmlCode) {
            return null;
        }

        return {
            title: reportMeta.title,
            description: reportMeta.description,
            categories: reportMeta.categories,
            htmlCode: htmlCode,
            createdAt: reportMeta.createdAt,
            updatedAt: reportMeta.updatedAt
        };
    } catch (error) {
        console.error('获取页面数据失败:', error);
        return null;
    }
}
