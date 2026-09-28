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

### 3. 🎨 左右雙欄即時預覽編輯器規格保護
- 編輯視圖必須維持原本 Admin Panel 標誌性的 **左側 HTML 代碼編輯（深色主題） ✕ 右側即時動態 iframe 滿版預覽 (`min-h-[520px]`)**。
- 嚴禁退化為單一陽春彈窗！

### 4. 🔒 密碼認證與防護罩
- 密碼優先讀取 Google Sheet《HTML代碼倉庫》`Config` 工作表（B1 格）。
- 保底密碼為 `10101010`，首頁必須具備「記住我」持久化機制。

### 5. ⛔ 絕對禁止未授權 Git 推送鐵律 (No Unsolicited Push)
- 除非使用者在對話中明確下達「推送倉庫」、「git push」、「推到 github」等明確指令，否則嚴禁主動發起 push！

---

## 📁 必讀專案技能 (Project Skills)
- [`html_report_publisher`](file:///e:/Projects/htmal-report/.agents/skills/html_report_publisher/SKILL.md)：AI 報告雲端極速發布大師
- [`htmal_report_admin`](file:///e:/Projects/htmal-report/.agents/skills/htmal_report_admin/SKILL.md)：雙軌架構與 Admin 維護手冊
- [`project_structure_keeper`](file:///e:/Projects/htmal-report/.agents/skills/project_structure_keeper/SKILL.md)：專案拓撲架構活地圖與封箱審計守護者
- [`agent_code_map`](file:///e:/Projects/htmal-report/.agents/skills/agent_code_map/SKILL.md)：專案原生 AST 代碼地圖與調用鏈穿透引擎
- [`dmc_knowledge_manager`](file:///C:/Users/9892/.gemini/config/skills/dmc_knowledge_manager/SKILL.md)：DEV_DMC 研發知識治理、日誌追加與活頁蒸餾大師 (docs/)

<!-- [START: CODE_MAP_INVARIANT] -->
## 🗺️ 專案代碼導航與呼叫鏈門禁 (Code Map Navigation Invariant)
1. **嚴禁盲目摸象**：排查 Bug、尋找函式位置或跨檔案追蹤時，**絕對嚴禁**一上來直接使用全局 `grep` 大海撈針！
2. **第一步宏觀導航**：凡面對未知代碼或排查架構，優先在終端執行極速地圖命令（0 成本在記憶體建立心智模型）：
   ```powershell
   py .agents\skills\agent_code_map\scripts\map.py
   ```
3. **第二步微觀定位**：若要追蹤某個函式/方法被專案中「哪些檔案、哪些類別呼叫」，強制調用呼叫者穿透指令：
   ```powershell
   py .agents\skills\agent_code_map\scripts\callers.py <symbol_name>
   ```
4. **定義尋址**：若要定位類別或函式的原始定義位置：
   ```powershell
   py .agents\skills\agent_code_map\scripts\callers.py --def <symbol_name>
   ```
<!-- [END: CODE_MAP_INVARIANT] -->
