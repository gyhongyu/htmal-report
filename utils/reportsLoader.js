// 從 GAS 雲端資料庫 (Google Sheet + Google Drive) 或 GitHub Pages 加載報告的工具函數
// 禁用所有緩存，確保即時獲取最新數據

// GAS Web App 雲端網關網址
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxcSYXocdTxhvYRq0A5eXsJqYvOI0xImay63Au9FSmolEwlbJ0My5Gr0aWUcvVpx8AiIA/exec';

/**
 * 載入報告索引清單 (極速並行雙軌：本地 5ms 先行渲染，GAS 雲端並行同步)
 */
async function loadReportsIndex() {
    let cloudReports = [];
    let localReports = [];

    // 1. 本地與雲端同時並行發起請求 (Promise.allSettled 徹底告別串行阻塞)
    const localPromise = (async () => {
        try {
            const timestamp = Date.now();
            const response = await fetch(`./data/reports-index.json?v=${timestamp}`, { cache: 'no-store' });
            if (response.ok) {
                const localData = await response.json();
                return localData.reports || [];
            }
        } catch (e) {
            console.warn('本地索引載入異常:', e);
        }
        return [];
    })();

    const cloudPromise = (async () => {
        if (!GAS_API_URL) return [];
        try {
            const timestamp = Date.now();
            // 設定 5 秒逾時，防止 GAS 喚醒延遲阻塞整體 UI
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            const response = await fetch(`${GAS_API_URL}?action=list&v=${timestamp}`, {
                cache: 'no-store',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (response.ok) {
                const data = await response.json();
                return data.reports || [];
            }
        } catch (e) {
            console.warn('GAS 雲端快速通道連線微延遲:', e);
        }
        return [];
    })();

    // 並行等待結果
    const [localRes, cloudRes] = await Promise.allSettled([localPromise, cloudPromise]);
    localReports = localRes.status === 'fulfilled' ? localRes.value : [];
    cloudReports = cloudRes.status === 'fulfilled' ? cloudRes.value : [];

    // 2. 智能合併（雲端優先排最前，接著排本地舊檔案）
    const mergedMap = new Map();
    cloudReports.forEach(r => { if (r.id) mergedMap.set(r.id, r); });
    localReports.forEach(r => { if (r.id && !mergedMap.has(r.id)) mergedMap.set(r.id, r); });

    const allMerged = Array.from(mergedMap.values());
    console.log(`⚡ 極速並行載入完成：總計 ${allMerged.length} 篇 (雲端 ${cloudReports.length} + 本地 ${localReports.length})`);
    return { reports: allMerged };
}

/**
 * 獲取所有報告列表（標準化元數據）
 */
async function getAllStoredPages() {
    try {
        const indexData = await loadReportsIndex();
        return indexData.reports.map(r => ({
            pageId: r.id,
            title: r.title,
            description: r.description || '',
            categories: r.categories || ['未分類'],
            fileName: r.fileName || '',
            driveId: r.driveId || '',
            createdAt: r.createdAt,
            updatedAt: r.updatedAt || r.createdAt
        }));
    } catch (error) {
        console.error('獲取報告列表失敗:', error);
        return [];
    }
}

/**
 * 獲取報告 HTML 內容 (支援從 DriveId 或本地 fileName 載入)
 */
async function getReportHTML(fileNameOrDriveId, isDriveId = false) {
    if (!fileNameOrDriveId) return null;

    // A. 從 Google Drive (透過 GAS) 讀取
    if (isDriveId || (fileNameOrDriveId && !fileNameOrDriveId.endsWith('.html'))) {
        try {
            const timestamp = Date.now();
            const response = await fetch(`${GAS_API_URL}?action=get&driveId=${fileNameOrDriveId}&v=${timestamp}`, {
                cache: 'no-store'
            });
            if (response.ok) {
                return await response.text();
            }
        } catch (error) {
            console.error('從 GAS 載入 HTML 失敗:', error);
        }
    }

    // B. 從本地 reports/ 載入
    try {
        const timestamp = Date.now();
        const response = await fetch(`./reports/${fileNameOrDriveId}?v=${timestamp}`, {
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
        console.error('獲取本地報告內容失敗:', error);
        return null;
    }
}

/**
 * 獲取報告完整數據（元數據 + HTML內容）
 */
async function getStoredPageData(pageId) {
    try {
        const indexData = await loadReportsIndex();
        const reportMeta = indexData.reports.find(r => r.id === pageId);

        if (!reportMeta) {
            return null;
        }

        const targetIdentifier = reportMeta.driveId || reportMeta.fileName;
        const isDrive = !!reportMeta.driveId;
        const htmlCode = await getReportHTML(targetIdentifier, isDrive);

        if (!htmlCode) {
            return null;
        }

        return {
            title: reportMeta.title,
            description: reportMeta.description,
            categories: reportMeta.categories,
            htmlCode: htmlCode,
            createdAt: reportMeta.createdAt,
            updatedAt: reportMeta.updatedAt || reportMeta.createdAt
        };
    } catch (error) {
        console.error('獲取頁面數據失敗:', error);
        return null;
    }
}

async function getConfigStatus() {
    return { config: { baseUrl: window.location.origin } };
}
