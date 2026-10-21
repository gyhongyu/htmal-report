# ⚖️ 專案開發規範與 AI 代理人最高鐵則 (AGENTS.md)

> [!IMPORTANT]
> **🌟 進入本專案第一步強制動作（First-Action Invariant）**：
> 任何 AI Agent 在本專案開啟對話的第一輪，**必須優先讀取本專案根目錄下的 [`HANDOFF.md`](file:///e:/Projects/htmal-report/HANDOFF.md) 與 `.agents/skills/` 專案技能**，徹底理解專案雙軌架構與歷史脈絡後方可進行任何分析或代碼編寫！

---

## ⛔ 專案核心硬性鐵律 (Non-Negotiable Guardrails)

### 1. 🛑 絕對禁止破壞 151 篇歷史舊報告網址

- 舊報告存放在 `reports/report-xxx.html`，外部已被大量系統（如 FollowLoop）歸檔。
- **嚴禁刪除、移動或重新命名既有 `reports/` 底下的檔案**！
- 舊卡片在前端嚴禁提供刪除按鈕，編輯時標題/分類反灰唯讀，HTML 透過 GAS Direct Commit 原地覆蓋。

### 2. ⚡ SWR 並行秒開架構保護 (Zero-Block Invariant)

- `utils/reportsLoader.js` 中的 `loadReportsIndex()` **必須 100% 維持 `Promise.allSettled` 並行異步拉取**。
- 本地 JSON 5ms 瞬間先完成渲染，GAS 雲端並行同步。**嚴禁改回串行阻塞等待**！

### 3. 🔒 密碼認證與防護罩

- 密碼優先讀取 Google Sheet《HTML代碼倉庫》`Config` 工作表（B1 格）。
- 保底密碼為 `10101010`，首頁必須具備「記住我」持久化機制。

### 4. 🛑 Google Sheet 台帳真理鎖定律 (SSOT Sheet Asset Lock)

- 本專案綁定之 Google Sheet 唯一真理：**《HTML代碼倉庫》**（ID: `1Fs921osBAcxuF45alc0IG20u5u_E6OIyCaL91qOKafY`）。
- **嚴禁自作聰明替換、改寫、重新關聯或在文檔傳播其他 Sheet ID**！
- 任何代理人欲變更或校驗試算表時，**必須先比對試算表名稱（必須為《HTML代碼倉庫》）與頁籤結構（必須含 `工作表1` 與 `Config`）**，嚴禁盲連任何個人流水帳或業務表格！

### 5. ⛔ 絕對禁止未授權 Git 推送鐵律 (No Unsolicited Push)

- 除非使用者在對話中明確下達「推送倉庫」、「git push」、「推到 github」等明確指令，否則嚴禁主動發起 push！

<!-- [END: CODE_MAP_INVARIANT] -->
