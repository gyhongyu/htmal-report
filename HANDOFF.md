# 📋 專案工作交接文檔 (HANDOFF.md)

> 📌 **專案**: `htmal-report` (HTML 報告發布與展示中心)  
> 🕒 **交接時間**: 2026-09-29  
> 🌟 **核心架構**: Google Sheet / Drive 萬能雲端 SSOT + GitHub 歷史靜態雙軌架構  
> ⚠️ **單一真理源原則**: 本文檔為專案根目錄唯一合法交接合約，接班代理人請以此為準。

---

## 0. 🧠 智腦不二過記憶突觸 (Brain Synapse & Anti-Failure DNA)

### 📌 關鍵對話突觸 (Conversation Synapse)
- **當前交班會話 ID**: `74ac6e83-7669-4675-b7c8-1cc72bdb3a22`
- **歷史關聯背景**: 舊版 Node.js 後端已完整封存至分支 `backup-legacy-20260818`，線上已全面運行純前端 SWR + Google Apps Script (GAS) 雲端架構。

### ⛔ 鋼鐵防線與不可違背之硬性鐵律 (Hard Invariants)
1. **🛑 絕對禁止破壞 151 篇歷史舊報告網址**：
   - 舊報告存放在 `reports/report-xxx.html`，外部已被大量系統（如 FollowLoop）歸檔。
   - **嚴禁刪除、移動或重新命名既有 `reports/` 底下的檔案**！前端嚴禁提供刪除按鈕，編輯時標題/分類反灰唯讀，HTML 透過 GAS Direct Commit 原地覆蓋。
2. **⚡ SWR 並行秒開架構保護 (Zero-Block Invariant)**：
   - `utils/reportsLoader.js` 中的 `loadReportsIndex()` **必須 100% 維持 `Promise.allSettled` 並行異步拉取**。本地 JSON 5ms 瞬間渲染，GAS 雲端並行同步。嚴禁改回串行阻塞等待！
3. **🎨 左右雙欄即時預覽編輯器規格保護**：
   - 編輯視圖必須維持原本 Admin Panel 標誌性的 **左側 HTML 代碼編輯（深色主題） ✕ 右側即時動態 iframe 滿版預覽 (`min-h-[520px]`)**，嚴禁退化為單一陽春彈窗！
4. **🔒 密碼認證與防護罩**：
   - 密碼優先讀取 Google Sheet《HTML代碼倉庫》`Config` 工作表（B1 格），保底密碼為 `10101010`，具備「記住我」持久化機制。
5. **⛔ 絕對禁止未授權 Git 推送鐵律 (No Unsolicited Push)**：
   - 除非使用者明確下達「推送倉庫」、「git push」、「推到 github」等指令，否則任何代理人嚴禁發起主動 push！

---

## 1. 🗺️ 專案最新物理架構與模組地圖 (Project Topology & Modules)

專案詳細拓撲已由 `project_structure_keeper` 治理，詳見 [`docs/TOPOLOGY.md`](docs/TOPOLOGY.md)：

```mermaid
graph TD
    A["用戶訪問前端 (index.html / preview.html)"] --> B{"報告類型判斷"}
    B -->|"有 driveId (rep_xxx)"| C["☁️ 雲端動態報告 (Google Drive/Sheet)"]
    B -->|"無 driveId (report-xxx.html)"| D["📁 GitHub 歷史靜態歸檔 (151 篇)"]
    
    C --> C1["由 preview.html 向 GAS 請求 HTML 原生 100% 滿版無損渲染"]
    C --> C2["前端支援：預覽 / ✏️ 編輯 / 🗑️ 刪除 (0秒即時生效)"]
    
    D --> D1["由 preview.html 向 ./reports/ 請求 HTML 渲染"]
    D --> D2["舊網址：https://html.foxlink.co.in/reports/report-xxx.html 永恆有效"]
    D --> D3["前端編輯：標題分類反灰唯讀，HTML 透過 GAS Direct Commit 原地覆蓋倉庫"]
    D --> D4["前端嚴禁提供刪除按鈕 (受版本控制保護)"]
```

### 核心模組職責邊界速查：
- [`reports/`](reports/)：歷史舊報告唯讀封存庫 (151 篇)，絕對受版本控制保護。
- [`utils/`](utils/)：`reportsLoader.js`（SWR 並行秒開核心載入器）。
- [`components/`](components/)：`HTMLEditor.js`、`PreviewPanel.js` 等左右雙欄預覽元件。
- [`gas/`](gas/)：GAS 後端萬能網關代碼 (`Code.gs`)。
- [`docs/`](docs/)：DEV_DMC 研發知識庫 (`STATE.md`, `ACTIVE_LOG.md`, `TOPOLOGY.md`)。
- [`.agents/skills/`](.agents/skills/)：專案原生技能庫（`project_structure_keeper` 拓撲守護、`agent_code_map` AST 地圖）。
- [`.agent_profiles/`](.agent_profiles/)：多模式規則庫（開發模式與生產模式切換）。

---

## 2. 系統現況與關鍵雲端資產配置 (System Baseline & Assets)

- **Google Sheet 台帳名稱**：《HTML代碼倉庫》
- **Google Sheet 試算表 ID**：`1YgwlA-f5Iq487-0FVU2ChOckNVLb3h1ejbrUNkUr4WQ`
- **Google Sheet 線上網址**：[開啟 Google 試算表](https://docs.google.com/spreadsheets/d/1YgwlA-f5Iq487-0FVU2ChOckNVLb3h1ejbrUNkUr4WQ/edit)
- **Google Drive HTML 存儲資料夾**：`HTML_Reports_Store`
- **GAS 部署端點 (Web App Live URL)**：
  `https://script.google.com/macros/s/AKfycbxcSYXocdTxhvYRq0A5eXsJqYvOI0xImay63Au9FSmolEwlbJ0My5Gr0aWUcvVpx8AiIA/exec`
- **GitHub 直連憑證 (用於 GAS 原地 Commit 覆蓋舊報告)**：
  - 帳號：`gyhongyu` / 倉庫：`htmal-report` / Token：配置於 GAS 後端代碼中。
- **AI Agent 一鍵發布工具**：[`.agents/skills/html_report_publisher/scripts/gas_publisher.py`](.agents/skills/html_report_publisher/scripts/gas_publisher.py)
  ```powershell
  py .agents\skills\html_report_publisher\scripts\gas_publisher.py --file "path/to/report.html" --title "報告標題" --categories "分類1,分類2" --desc "簡述"
  ```
- **多模式開發切換**：
  - 開發模式（預設）：`py .agent_profiles/switch_mode.py dev`（或點擊 `切換為開發模式.bat`）
  - 生產模式（只查不改）：`py .agent_profiles/switch_mode.py prod`（或點擊 `切換為生產模式.bat`）

---

## 3. 下一棒核心任務建議 (Immediate Action Items)

1. **維持 SWR 秒開與左右雙欄預覽穩定性**：任何前端微調或樣式優化，不得破壞 `Promise.allSettled` 並行邏輯與雙欄布局。
2. **監控與維護 GAS 萬能網關**：若 Google Sheet 結構有擴展，需同步維護 `gas/Code.gs`。
3. **日常研發遵守 DMC 與拓撲紀律**：
   - 重大修改單向追加至 [`docs/ACTIVE_LOG.md`](docs/ACTIVE_LOG.md)。
   - 維護 [`docs/STATE.md`](docs/STATE.md) 嚴格 $\le 200$ 行門禁。
   - 交接或提交前運行 `py .agents\skills\project_structure_keeper\scripts\keeper.py audit`。

---

## 4. 驗收啟動指令與導航門禁 (Pre-Flight Navigation & Verification Step)

進場代理人請於終端依序執行以下雙門禁指令，於記憶體中建立心智模型：

```powershell
# 1. 目錄衛生與拓撲審計（掌握房間地圖）
py .agents\skills\project_structure_keeper\scripts\keeper.py audit

# 2. 宏觀代碼地圖抽取（掌握全域 Class 與 Def 拓撲）
py .agents\skills\agent_code_map\scripts\map.py

# 3. DMC 研發日誌健康度巡檢
py C:\Users\9892\.gemini\config\skills\dmc_knowledge_manager\scripts\dmc.py status
```
