# 🛡️ 研發即時現狀與架構真理庫 (STATE.md)

> 📌 **專案**: htmal-report | **初始化時間**: 2026-09-29  
> ⚠️ **鐵律**: 本文檔嚴格限制 ≤200 行，為專案唯一真理來源 (Single Source of Truth, SSOT)。

---

## 1. 專案定位與架構不變量 (Hard Invariants)
- **雙軌報告架構**：
  1. **雲端動態報告**：Google Drive (`HTML_Reports_Store`) + Google Sheet (`1Fs921osBAcxuF45alc0IG20u5u_E6OIyCaL91qOKafY`)，透過 GAS 萬能網關全生命週期管理。
  2. **歷史靜態歸檔**：`reports/report-xxx.html` (151 篇)，外部大量歸檔引用，**絕對嚴禁刪除、移動或重命名**。
- **SWR 並行秒開**：`utils/reportsLoader.js` 必須維持 `Promise.allSettled` 並行拉取，本地快取先瞬間渲染，GAS 雲端異步同步。
- **左右雙欄即時預覽編輯器**：左側代碼 ✕ 右側 iframe 滿版預覽 (`min-h-[520px]`)，嚴禁退化為陽春彈窗。
- **動態密碼管理**：優先讀取 Google Sheet `Config` 頁籤 B1，保底密碼 `10101010`。
- **Git 鐵律**：嚴禁主動執行未授權之 `git push`。

---

## 2. 核心技術棧與模組邊界
- **前端核心**：原生 Vanilla JS (`app.js`, `preview.html`)、Tailwind CSS (CDN)、模組化元件 (`components/`)。
- **雲端網關**：Google Apps Script (`gas/`)，提供 REST API、密碼驗證、Google Drive 存儲與 GitHub REST API 原地覆蓋。
- **專案守護**：`.agents/skills/project_structure_keeper/` (拓撲守護)、`.agents/skills/agent_code_map/` (AST 代碼地圖)。

---

## 3. 當前里程碑與就緒狀態
- [x] 完成雙軌報告秒開架構 (SWR 5ms 渲染)
- [x] 完成左右雙欄即時預覽編輯器
- [x] 完成專案拓撲架構守護與代碼地圖引擎播種
- [x] 完成 DEV_DMC 知識庫初始化 (docs/ 治理骨架)
- [x] 完成 iOS Safari 滿版報告預覽修復 (Blob URL + srcdoc 雙軌架構，淘汰 document.write)
