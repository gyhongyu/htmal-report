---
globs: "utils/reportsLoader.js"
trigger: model_decision
description: "當修改 utils/reportsLoader.js 或載入效能時"
---

# 🛡️ Swr Zero Block 規範

<RULE[swr_zero_block_invariant]>
1. ⛔【嚴禁行為 (Anti-Pattern)】：
   - 改回串行 await 阻塞等待 GAS 回傳，導致首頁白屏或卡住
2. ✅【標準做法 (Standard Practice)】：
   - 100% 維持 Promise.allSettled 並行拉取，本地快取 5ms 先行渲染，GAS 雲端並行無縫同步
</RULE[swr_zero_block_invariant]>
