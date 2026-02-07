// Admin API 工具函數
// 呼叫本地 Express API

const API_BASE = '';  // 同域，無需指定

async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API呼叫失敗:', error);
        throw error;
    }
}

// 配置相關
async function getConfigStatus() {
    return await apiCall('/api/config/status');
}

async function saveConfig(config) {
    return await apiCall('/api/config/save', {
        method: 'POST',
        body: JSON.stringify(config)
    });
}

async function updateConfig(updates) {
    return await apiCall('/api/config/update', {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
}

// 報告相關
async function getAllReports() {
    const data = await apiCall('/api/reports');
    return data.reports || [];
}

async function getReport(reportId) {
    const data = await apiCall(`/api/reports/${reportId}`);
    return data.report;
}

async function createReport(reportData) {
    return await apiCall('/api/reports', {
        method: 'POST',
        body: JSON.stringify(reportData)
    });
}

async function updateReport(reportId, reportData) {
    return await apiCall(`/api/reports/${reportId}`, {
        method: 'PUT',
        body: JSON.stringify(reportData)
    });
}

async function deleteReport(reportId) {
    return await apiCall(`/api/reports/${reportId}`, {
        method: 'DELETE'
    });
}

async function testConnection() {
    return await apiCall('/api/test/connection');
}

// 兼容舊的函數名（供複用的組件使用）
async function savePageData(pageId, pageData) {
    if (pageId) {
        const result = await updateReport(pageId, pageData);
        return result.report?.id || pageId;
    } else {
        const result = await createReport(pageData);
        return result.report?.id;
    }
}

async function getStoredPageData(pageId) {
    try {
        const report = await getReport(pageId);
        return {
            title: report.title,
            description: report.description,
            categories: report.categories,
            htmlCode: report.htmlCode,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt
        };
    } catch (error) {
        console.error('獲取頁面數據失敗:', error);
        return null;
    }
}

async function getAllStoredPages() {
    try {
        const reports = await getAllReports();
        return reports.map(r => ({
            pageId: r.id,
            title: r.title,
            description: r.description,
            categories: r.categories,
            fileName: r.fileName,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt
        }));
    } catch (error) {
        console.error('獲取所有頁面失敗:', error);
        return [];
    }
}

async function deleteStoredPage(pageId) {
    try {
        await deleteReport(pageId);
        return true;
    } catch (error) {
        console.error('刪除頁面失敗:', error);
        return false;
    }
}
