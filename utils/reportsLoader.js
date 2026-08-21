// 從 GAS 雲端資料庫 (Google Sheet + Google Drive) 或 GitHub Pages 加載報告的工具函數
// 禁用所有緩存，確保即時獲取最新數據

// GAS Web App 雲端網關網址
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxcSYXocdTxhvYRq0A5eXsJqYvOI0xImay63Au9FSmolEwlbJ0My5Gr0aWUcvVpx8AiIA/exec';
const CLOUD_CACHE_KEY = 'htmal_cloud_reports_cache';

/**
 * 讀取本地快取的雲端報告列表
 */
function getCachedCloudReports() {
    try {
        const cached = localStorage.getItem(CLOUD_CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.warn('讀取本地雲端快取異常:', e);
    }
    return [];
}

/**
 * 將雲端報告列表存入本地快取
 */
function setCachedCloudReports(reports) {
    try {
        if (Array.isArray(reports)) {
            localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify(reports));
        }
    } catch (e) {
        console.warn('寫入本地雲端快取異常:', e);
    }
}

/**
 * 合併雲端與本地報告（雲端在前，本地在後，以 id 去重）
 */
function mergeReports(cloudList, localList) {
    const mergedMap = new Map();
    (cloudList || []).forEach(r => { if (r && r.id) mergedMap.set(r.id, r); });
    (localList || []).forEach(r => { if (r && r.id && !mergedMap.has(r.id)) mergedMap.set(r.id, r); });
    return Array.from(mergedMap.values());
}

/**
 * 標準化報告數據結構
 */
function formatReportItems(reports) {
    return (reports || []).map(r => ({
        pageId: r.id,
        title: r.title,
        description: r.description || '',
        categories: r.categories || ['未分類'],
        fileName: r.fileName || '',
        driveId: r.driveId || '',
        createdAt: r.createdAt,
        updatedAt: r.updatedAt || r.createdAt
    }));
}

/**
 * 載入報告索引清單 (SWR: 本地與快取 5ms 先行渲染，GAS 雲端背景異步同步)
 * @param {Function} onCloudSync - 雲端同步完成時的回調 (updatedReports) => void
 */
async function loadReportsIndex(onCloudSync = null) {
    // 1. 取得現有快取（0ms 秒開）
    let cachedCloud = getCachedCloudReports();
    let localReports = [];

    // 2. 本地靜態 JSON 載入 (5ms)
    try {
        const timestamp = Date.now();
        const response = await fetch(`./data/reports-index.json?v=${timestamp}`, { cache: 'no-store' });
        if (response.ok) {
            const localData = await response.json();
            localReports = localData.reports || [];
        }
    } catch (e) {
        console.warn('本地索引載入異常:', e);
    }

    // 3. 背景發起 GAS 雲端即時同步（完全非阻塞背景執行，不設過激逾時，允許慢速網路與冷啟動完成）
    if (GAS_API_URL) {
        (async () => {
            const fetchCloud = async (retryCount = 0) => {
                try {
                    const timestamp = Date.now();
                    const response = await fetch(`${GAS_API_URL}?action=list&v=${timestamp}`, {
                        cache: 'no-store'
                    });
                    if (response.ok) {
                        const data = await response.json();
                        const liveCloudReports = data.reports || [];
                        
                        // 更新快取
                        setCachedCloudReports(liveCloudReports);
                        
                        // 若有註冊回調，通知前端更新
                        if (typeof onCloudSync === 'function') {
                            const newMerged = mergeReports(liveCloudReports, localReports);
                            console.log(`☁️ 雲端背景同步成功：共 ${liveCloudReports.length} 篇雲端報告`);
                            onCloudSync(newMerged);
                        }
                        return true;
                    }
                } catch (e) {
                    console.warn(`GAS 雲端背景同步重試 (${retryCount + 1}/2):`, e);
                    if (retryCount < 1) {
                        setTimeout(() => fetchCloud(retryCount + 1), 2000);
                    }
                }
                return false;
            };
            fetchCloud(0);
        })();
    }

    // 4. 第一階段立即返回（快取雲端 + 本地 151 篇）
    const initialMerged = mergeReports(cachedCloud, localReports);
    console.log(`⚡ SWR 首屏極速載入：總計 ${initialMerged.length} 篇 (快取雲端 ${cachedCloud.length} + 本地 ${localReports.length})`);
    return { reports: initialMerged };
}

/**
 * 獲取所有報告列表（標準化元數據，支援 SWR 背景更新回調）
 */
async function getAllStoredPages(onUpdate = null) {
    try {
        const onCloudSync = onUpdate ? (updatedReports) => {
            onUpdate(formatReportItems(updatedReports));
        } : null;

        const indexData = await loadReportsIndex(onCloudSync);
        return formatReportItems(indexData.reports);
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
