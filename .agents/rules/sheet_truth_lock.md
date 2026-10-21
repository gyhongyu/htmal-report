---
trigger: model_decision
description: "當涉及 Google Sheet、GAS 網關、資料庫連線或密碼配置時"
---

# 🛡️ Sheet Truth Lock 規範

<RULE[sheet_truth_lock_invariant]>
1. ⛔【嚴禁行為 (Anti-Pattern)】：
   - 私自替換 Sheet ID 或改連個人流水帳，或繞過密碼認證機制
2. ✅【標準做法 (Standard Practice)】：
   - 唯一綁定《HTML代碼倉庫》(1Fs921osBAcxuF45alc0IG20u5u_E6OIyCaL91qOKafY)，密碼讀取 Config 表 B1 (保底 10101010)
</RULE[sheet_truth_lock_invariant]>
