---
trigger: model_decision
description: "當涉及 HTML 報告預覽、編輯、刪除、下載、分享或處理報告物件時"
---

# 🛡️ Dual Track Reports 規範

<RULE[dual_track_reports_invariant]>
1. ⛔【嚴禁行為 (Anti-Pattern)】：
   - 嚴禁單軌假設 page.fileName 必有值而攔截雲端報告，嚴禁在本地搜索 rep_xxx 或在 reports/ 寫入新報告
2. ✅【標準做法 (Standard Practice)】：
   - 強制雙軌識別 isDrive = Boolean(page.driveId || (!page.fileName && page.pageId))，雲端走 GAS/Drive，本地走 reports/；系統全面採純關鍵字檢索，不依賴分類標籤
</RULE[dual_track_reports_invariant]>
