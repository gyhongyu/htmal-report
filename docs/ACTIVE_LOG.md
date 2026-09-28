# 📝 研發結構化原子日誌 (ACTIVE_LOG.md)
> ⚠️ **【鐵律：只追加不修改 (Append-Only)】**
> 任何代碼修正、重構、架構決策或工具鏈變更，以標準 6 行格式追加至文末。

---

### [2026-09-29] [UNREFINED] [governance] 播種四大專案工程治理技能與重構交接文檔
- **類型**: `TOOLING`
- **代碼錨點**: `.agents/skills/`, `.agent_profiles/`, `docs/`, `HANDOFF.md`
- **核心事實 / 決策理由**:
  - 本專案完成現代化雙軌架構後，需具備自主拓撲導航、AST 代碼地圖、DMC 知識治理與多模式開發能力。
  - 將過時之 `NEXT_AGENT_HANDOVER_ROADMAP.md` 升級重寫為開源標準之專案根目錄唯一真理源 `HANDOFF.md`，終結孤兒文檔。
- **踩坑 / 失敗模式**:
  - 全域 `topology_engine.py` 原先將新建立之頂層目錄誤判為根目錄孤兒雜檔，已於全域及專案端修復 `target_path.is_dir()` 判斷邏輯。
- **防禦手段 / 測試背書**:
  - 運行 `keeper.py audit` 通過 0 孤兒雜檔審計。
  - 運行 `dmc.py status` 與 `multi_rules_engine.py status` 確認系統全數健康。

---

### [2026-09-29] [UNREFINED] [cloud/gas] 固化 Google Sheet 台帳真理鎖與校正資產 ID (INCIDENT-20260929-01)
- **類型**: `BUG_FIX`
- **代碼錨點**: `gas/Code.gs` (L4), `utils/reportsLoader.js` (L4), `preview.html` (L80), `AGENTS.md` (L28~L32), `HANDOFF.md`
- **核心事實 / 決策理由**:
  - 歷史文檔與多名 AI 代理人誤將業務流水帳 Sheet ID 記錄為《HTML代碼倉庫》，導致嚴重知識劇毒與資安混淆風險。
  - 透過 Drive API 與 GAS 容器探針驗證出真值試算表《HTML代碼倉庫》（`1Fs921osBAcxuF45alc0IG20u5u_E6OIyCaL91qOKafY`）。
  - 將專案 Code.gs 推送並部署新版本 @5，更新正式生產端點，並在全專案憲法（AGENTS.md）明訂「SSOT 試算表真理鎖」。
- **踩坑 / 失敗模式**:
  - 代理人未經名稱與頁籤結構驗證即盲連或盲寫 Sheet ID；容器綁定型 GAS 與獨立試算表混淆。
- **防禦手段 / 測試背書**:
  - 測試正式生產環境 GAS API `verify_password`、`list` 以及批次權限開放 `make_all_public_editable` 均 100% 成功通過。
  - 專案所有文檔與雙環境 AGENTS.md 均已完成防禦規則落盤。
