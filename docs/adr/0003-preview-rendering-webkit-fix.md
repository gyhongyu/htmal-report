# ADR-0003: 報告預覽引擎跨平台渲染與 WebKit 跨域防護架構

## 狀態 (Status)
**已接受 (Accepted)** - 2026-09-29 固化

## 背景與問題 (Context & Incident Background)
- **關聯事故**: `INCIDENT-20260929-02`
- **事故現象**:
  報告在 Windows PC (Chrome/Edge) 與 Android 均能完美呈現，但在 iOS Safari / iPhone 實機上，主體雖然加載，但報告頂部第三方外鏈 Logo（如 Foxlink 官方 Logo）卻破圖顯示藍色問號或空白。
- **根本原因 (Root Cause)**:
  1. 先前淘汰 `document.write()` 後，改採 `Blob URL`（`URL.createObjectURL(new Blob([html]))`）賦值給 `iframe.src`。
  2. Chromium (Android/PC) 寬容處理 blob 頁面的跨域子資源請求；
  3. 但 iOS WebKit / Safari 的安全防護機制將 `blob:` 劃為特殊沙盒隔離環境，當內部 HTML 引用第三方域名（`www.foxlink.com`）之圖片時，判定為未經授權的跨站子資源（Subresource Cross-Origin Request），在底層靜默攔截阻斷。

## 決策 (Decision)
1. **升級為 `srcdoc` 優先雙軌渲染策略**：
   - 在 [`preview.html`](preview.html) 中改以 `frame.srcdoc = html` 為第一優先路徑。
   - `srcdoc` 在 DOM 規範與 WebKit 實現中，**100% 繼承父頁面的源上下文（Origin: `https://html.foxlink.co.in`）**。
   - 瀏覽器不再將報告視為孤立沙盒，第三方外鏈圖片、圖床與樣式獲取均通行無阻。
2. **極端環境無縫降級**：
   - 檢測 `'srcdoc' in frame`，若遇極端不支援 `srcdoc` 的歷史老舊瀏覽器，則自動降級走 `Blob URL`，確保 100% 永遠不白屏。

## 後果與防護 (Consequences)
- **正面效益**：
  - 一次性解決所有歷史 151 篇靜態舊報告與雲端所有新報告的跨平台相容性，徹底擺脫逐篇修改圖片的繁重維護負擔。
  - 在 iPhone 16 (iOS 18) 實機測試確認：Logo 高畫質秒開、全無破圖。
