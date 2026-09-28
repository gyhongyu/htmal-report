# ADR-0002: Google Sheet 台帳真理鎖與容器防護規範

## 狀態 (Status)
**已接受 (Accepted)** - 2026-09-29 固化

## 背景與問題 (Context & Incident Background)
- **關聯事故**: `INCIDENT-20260929-01`
- **事故現象**:
  先前多位 AI 代理人在維護文檔時，誤將外部業務試算表（`1YgwlA-f5Iq487-0FVU2ChOckNVLb3h1ejbrUNkUr4WQ`）誤記為《HTML代碼倉庫》，並在多處文檔與交接筆記中互相抄錄傳播。當工程師查驗時發現該試算表為「2026 印度案件滙總-個人流水帳」，引發嚴重資安誤連風險與開發阻礙。
- **根本原因 (Root Cause)**:
  1. 專案採用容器綁定型 GAS（Container-bound Script），由 `SpreadsheetApp.getActiveSpreadsheet()` 獲取當前試算表，代碼層面無寫死 ID。
  2. 代理人在缺少真值查驗工具時，未執行名稱核對與結構校驗，隨意採信歷史文檔中錯誤的 Sheet ID。

## 決策 (Decision)
1. **確立唯一單一真理 (SSOT)**：
   - 本專案唯一合法試算表名稱：**《HTML代碼倉庫》**
   - 唯一合法試算表 ID：`1Fs921osBAcxuF45alc0IG20u5u_E6OIyCaL91qOKafY`
   - 線上查閱網址：`https://docs.google.com/spreadsheets/d/1Fs921osBAcxuF45alc0IG20u5u_E6OIyCaL91qOKafY/edit`
2. **入憲門禁 (AGENTS.md Guardrail)**：
   - 任何代理人嚴禁自作聰明替換或在文檔傳播其他 Sheet ID。
   - 任何連線或校驗前，必須強制檢驗試算表名稱是否為《HTML代碼倉庫》且具備 `工作表1` 與 `Config` 頁籤。
3. **版本與端點同步**：
   - 將包含真值註記與 GitHub REST API 直連覆蓋引擎之 `Code.gs` 推送至專案並發布版本 `@5`。
   - 正式生產端點（`.../AKfycbxcSYXocdTxhvYRq0A5eXsJqYvOI0xImay63Au9FSmolEwlbJ0My5Gr0aWUcvVpx8AiIA/exec`）即時切換至 `@5`。

## 後果與防護 (Consequences)
- **正面效益**：杜絕後續代理人產生知識劇毒，確保代碼庫、文檔與雲端資產 100% 保持一致。
- **防禦手段**：後續排查時禁止直接盲連 ID，必須執行名稱與頁籤真值雙重比對。
