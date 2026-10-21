/**
 * 🔗 Base62 短網址編解碼演算法模組 (Universal Short URL Engine)
 * 支援雙軌報告 (Dual-Track Reports)：
 * 1. 雲端報告 (rep_1786988344233) -> 7 碼純 Base62 (如: vszOYMV)
 * 2. 本地報告 (report-1766042552185) -> 'l' + 7 碼 Base62 (如: lv5Iizrj)
 * 
 * 物理特性：
 * - 100% 無狀態、不依賴資料庫存儲、不需查表
 * - 微信/LINE/WhatsApp 絕不截斷，總長度僅約 33 字元 (https://html.foxlink.co.in/vszOYMV)
 */

const BASE62_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BASE = 62n;

/**
 * 數值轉 Base62
 * @param {BigInt|number} num 
 * @returns {string}
 */
function encodeBase62(num) {
    let n = BigInt(num);
    if (n === 0n) return BASE62_CHARS[0];
    let res = [];
    while (n > 0n) {
        res.push(BASE62_CHARS[Number(n % BASE)]);
        n = n / BASE;
    }
    return res.reverse().join('');
}

/**
 * Base62 轉數值
 * @param {string} str 
 * @returns {BigInt}
 */
function decodeBase62(str) {
    let n = 0n;
    for (let i = 0; i < str.length; i++) {
        const idx = BASE62_CHARS.indexOf(str[i]);
        if (idx === -1) throw new Error(`Invalid Base62 char: ${str[i]}`);
        n = n * BASE + BigInt(idx);
    }
    return n;
}

/**
 * 將報告原始 pageId 編碼為短代碼
 * @param {string} pageId 例如 "rep_1786988344233" 或 "report-1766042552185"
 * @returns {string} 短代碼，例如 "vszOYMV"
 */
function pageIdToShortCode(pageId) {
    if (!pageId) return '';
    const str = String(pageId).trim();
    const match = str.match(/^(rep_|report-)(\d+)$/);
    if (match) {
        const prefix = match[1];
        const ts = match[2];
        const encoded = encodeBase62(ts);
        if (prefix === 'report-') {
            return `l${encoded}`;
        }
        return encoded;
    }
    return str;
}

/**
 * 將短代碼還原為 pageId 與類型
 * @param {string} shortCode 例如 "vszOYMV" 或 "lv5Iizrj"
 * @returns {{ pageId: string, isCloud: boolean } | null}
 */
function shortCodeToPageId(shortCode) {
    if (!shortCode) return null;
    try {
        const code = String(shortCode).trim();
        if (code.startsWith('l')) {
            const ts = decodeBase62(code.slice(1));
            if (ts > 1000000000000n) {
                return {
                    pageId: `report-${ts.toString()}`,
                    isCloud: false
                };
            }
        }
        const ts = decodeBase62(code);
        if (ts > 1000000000000n) {
            return {
                pageId: `rep_${ts.toString()}`,
                isCloud: true
            };
        }
    } catch (e) {
        console.warn('短代碼解碼異常:', e);
    }
    return null;
}

/**
 * 取得漂亮的短網址
 * @param {string} pageId 
 * @returns {string} 例如 "https://html.foxlink.co.in/vszOYMV"
 */
function getShortReportUrl(pageId) {
    const code = pageIdToShortCode(pageId);
    if (!code) return window.location.origin;
    return `${window.location.origin}/${code}`;
}

// 支援瀏覽器環境全域變數或 Node/模組
if (typeof window !== 'undefined') {
    window.pageIdToShortCode = pageIdToShortCode;
    window.shortCodeToPageId = shortCodeToPageId;
    window.getShortReportUrl = getShortReportUrl;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        encodeBase62,
        decodeBase62,
        pageIdToShortCode,
        shortCodeToPageId,
        getShortReportUrl
    };
}
