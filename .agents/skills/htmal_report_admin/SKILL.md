---
name: htmal_report_admin
description: 專案專屬雙軌架構維護與全功能 Admin 管理手冊。專門用於指導 AI 代理人維護 htmal-report 專案、理解 GitHub 靜態歸檔與 Google 雲端動態報告的雙軌資產邊界、密碼防護機制 (Config 頁籤)、SWR 極速並行秒開架構以及原始左右雙欄即時預覽編輯器規範。當代理人需要「修改報告管理系統」、「優化加載效能」、「維護 Admin 後台」或「接手專案代碼維護」時自動觸發。
---

# HTML 報告中心雙軌架構與 Admin 維護手冊 (htmal_report_admin v1.0)

> [!IMPORTANT]
> **🌟 核心架構鐵律與防錯邊界 (Mandatory Guardrails)**：
> 1. **雙軌資產邊界隔離**：
>    - **GitHub 既有靜態檔案 (151 篇)**：元數據位於 `data/reports-index.json`，實體位於 `reports/`。**前端嚴禁提供刪除按鈕**；編輯時標題/分類反灰唯讀鎖定，HTML 代碼可自由編輯並透過 GAS 調用 GitHub REST API (`update_github_file`) 發起 Direct Commit 原地覆蓋，確保舊網址永恆不變！
>    - **Google 雲端動態報告**：元數據位於 Google Sheet，實體位於 Google Drive。前端提供完整「預覽 / 編輯 / 刪除」，0 秒即時生效。
> 2. **SWR 並行秒開架構 (Zero-Block Invariant)**：
>    - `utils/reportsLoader.js` 中的 `loadReportsIndex()` **必須 100% 採用 `Promise.allSettled` 並行異步拉取**。本地 5 毫秒瞬間先完成頁面渲染，嚴禁改回串行阻塞等待 GAS，徹底杜絕首頁卡在 30% 一分鐘的延遲！
> 3. **密碼鎖與記住我 (Auth SSOT)**：
>    - 密碼驗證優先讀取 Google Sheet 的 `Config` 工作表（A1: `Admin_Password` / B1: 密碼字串）。
>    - 若 `Config` 表未建立，系統自帶保底降級密碼 `10101010`，嚴禁破壞登入防護罩。
> 4. **左右雙欄即時預覽編輯器規範**：
>    - 編輯視圖必須維持原本 Admin Panel 標誌性的 **左側 HTML 代碼編輯（深色主題） ✕ 右側即時動態 iframe 滿版預覽 (`min-h-[520px]`)**，嚴禁退化為單一陽春彈窗！

---

## 🗺️ 代碼架構地圖 (Code Map)

- **`index.html`**：主應用入口，整合暗黑科技風密碼鎖、頂部連線狀態列與左右雙欄專業編輯器。
- **`preview.html`**：獨立報告原生滿版載入器，向 GAS/本地請求 HTML 後以原生 `document.write` 滿版無損渲染。
- **`utils/reportsLoader.js`**：雙軌極速合併載入器，並行讀取本地 JSON 與 Google Sheet，帶 6 秒逾時防禦。
- **`components/PageCard.js`**：卡片組件，智慧識別 `driveId`，動態顯示刪除按鈕與獨立複製連結。
- **`components/HTMLEditor.js`** & **`PreviewPanel.js`**：左右雙欄滿版即時預覽編輯器組件。
- **`gas_publisher.py`**：供 AI 代理人直接調用的免登入發布工具。

---

## 🔒 密碼管理指引 (Admin Password Guide)

在 Google Sheet《HTML代碼倉庫》中：
- 工作表名稱：`Config`
- 鍵值欄位：
  - A1: `Admin_Password`
  - B1: 您的自訂密碼（隨時修改即時生效）
