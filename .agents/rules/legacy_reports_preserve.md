---
globs: "reports/**"
trigger: model_decision
description: "當涉及 reports/ 目錄或歷史 151 篇報告時"
---

# 🛡️ Legacy Reports Preserve 規範

<RULE[legacy_reports_preserve_invariant]>
1. ⛔【嚴禁行為 (Anti-Pattern)】：
   - 刪除、移動或重命名既有 reports/ 底下的任何報告檔案
2. ✅【標準做法 (Standard Practice)】：
   - 歷史舊報告前端嚴禁刪除按鈕，標題分類唯讀，HTML 走 GAS Direct Commit 原地覆蓋
</RULE[legacy_reports_preserve_invariant]>
