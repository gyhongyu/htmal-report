# 📋 專案工作交接文檔 (HANDOFF.md)

> 📌 **專案**: `htmal-report` (HTML 報告發布與展示中心)  
> 🕒 **交接時間**: 2026-09-29  
> 🌟 **核心架構**: Google Sheet / Drive 萬能雲端 SSOT + GitHub 歷史靜態雙軌架構  
> ⚠️ **單一真理源原則**: 本文檔為專案根目錄唯一合法交接合約，接班代理人請以此為準。

---

## 0. 🚀 進場第一動與導航門禁 (Pre-Flight Navigation - 第一步強制執行)

進場代理人禁止摸象，**第一步必須在終端依序執行以下雙門禁指令**，於記憶體中建立全域拓撲與心智模型：

```powershell
# 1. 執行目錄拓撲與衛生審計 (確認 0 孤兒雜檔，掌握模組責任邊界)
py .agents\skills\project_structure_keeper\scripts\keeper.py audit

# 2. 宏觀建立代碼拓撲記憶 (AST 調用鏈穿透與函式精確定位)
py .agents\skills\agent_code_map\scripts\map.py
```

---

## 1. ⛔ 鋼鐵防線與不可違背之硬性鐵律 (Hard Invariants)

1. **🛑 絕對禁止破壞 151 篇歷史舊報告網址**：存放於 `reports/report-xxx.html`，外部已被大量引用，**嚴禁刪除、移動或重命名**；前端反灰唯讀，原地覆蓋。
2. **🛑 Google Sheet 台帳真理鎖定律**：唯一真理試算表為《HTML代碼倉庫》（ID: `1Fs921osBAcxuF45alc0IG20u5u_E6OIyCaL91qOKafY`），嚴禁私自替換或盲連業務表格。
3. **⚡ SWR 並行秒開架構**：`utils/reportsLoader.js` 必須維持 `Promise.allSettled` 並行拉取，本地快取 5ms 瞬間渲染，GAS 雲端異步同步，嚴禁改回串行阻塞。
4. **🎨 雙欄預覽編輯器規格**：左側代碼 ✕ 右側 iframe 滿版預覽 (`min-h-[520px]`)，嚴禁退化。
5. **🔒 密碼認證**：密碼優先讀取 Google Sheet `Config` 頁籤 B1，保底密碼為 `10101010`。
6. **⛔ 絕對禁止未授權 Git 推送**：除非使用者明確下達指令，否則嚴禁發起主動 push！

---

## 2. 🗺️ 專案物理架構與模組職責 (速查)

詳細拓撲架構請查閱 [`docs/TOPOLOGY.md`](docs/TOPOLOGY.md)：
- [`reports/`](reports/)：歷史 151 篇舊報告唯讀封存庫。
- [`utils/`](utils/)：`reportsLoader.js`（SWR 並行秒開核心載入器）。
- [`components/`](components/)：UI 元件庫（`HTMLEditor.js`、`PreviewPanel.js`）。
- [`assets/`](assets/)：專案共用靜態資產庫（含 1200x630 官方社群預覽封面 `Foxlink-CIBC.jpg`）。
- [`gas/`](gas/)：GAS 後端萬能網關源碼 (`Code.gs`)。
- [`preview.html`](preview.html)：雲端動態報告預覽入口（srcdoc 滿版雙軌渲染，支援 WhatsApp/LINE CIBC 預覽卡片）。
- [`docs/`](docs/)：DEV_DMC 研發知識庫（歷史翻車與架構決策全量收納於 [`docs/ACTIVE_LOG.md`](docs/ACTIVE_LOG.md) 與 [`docs/STATE.md`](docs/STATE.md)）。

---

## 3. 系統現況與關鍵資產 (System Baseline)

- **Google Sheet 試算表 ID**: `1Fs921osBAcxuF45alc0IG20u5u_E6OIyCaL91qOKafY`（《HTML代碼倉庫》）
- **GAS 部署端點**: `https://script.google.com/macros/s/AKfycbxcSYXocdTxhvYRq0A5eXsJqYvOI0xImay63Au9FSmolEwlbJ0My5Gr0aWUcvVpx8AiIA/exec` (版本 @5)
- **多模式切換**: 開發模式 `py .agent_profiles/switch_mode.py dev` | 生產模式 `py .agent_profiles/switch_mode.py prod`

---

## 4. 🎯 下一棒核心待辦任務 (Current Action Items)

- **當前狀態**: **✅ Production Ready (生產就緒，目前無遺留待辦)**
- **近期完工成果**:
  1. iOS Safari 滿版渲染與 WebKit 跨域圖片修復（`srcdoc` 優先雙軌機制）。
  2. WhatsApp / LINE 官方 CIBC 社群預覽卡片優化與 `assets/` 目錄正規化。
  *(詳細研發日誌請參閱 `docs/ACTIVE_LOG.md`)*
