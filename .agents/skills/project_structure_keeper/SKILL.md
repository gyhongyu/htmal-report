---
name: project_structure_keeper
description: 專案專屬結構活地圖、模組職責守護與交接/Git前夕目錄審計員 (Project Structure, Topology Keeper & Pre-Flight Auditor for htmal-report)。專門用於以 0-Token 極速為進場 AI 代理人提供本專案最新目錄職責清單、代碼模組化邊界與架構真理。當使用者或代理人提到「專案架構」、「目錄結構」、「模組放在哪」、「代碼拆分重構」、「新增核心模組」、「交接工作」、「準備交接」、「本地git」、「提交git」、「推送倉庫」或在重大架構調整後需要同步/審計拓撲時強制喚醒。
---

# 🛡️ 專案專屬拓撲守護員 (project_structure_keeper)

> 📌 **核心使命**：本技能常駐於 `htmal-report`，為所有進場之 AI 代理人提供最權威的「房間地圖與模組責任邊界」，並在「交接工作」與「Git 代碼封箱」前夕把關目錄衛生，杜絕盲目掃描全庫代碼與在根目錄亂扔檔案！

---

## 🗺️ 專案核心模組分工與責任邊界

詳細架構活地圖請查閱：[docs/TOPOLOGY.md](file:///docs/TOPOLOGY.md)

---

## 🧭 常駐雙輪驅動操作手冊 (Standard Commands)

### 1. 🛡️ 交接與 Git 封箱前目錄衛生審計 (Pre-Flight Audit)
- **觸發時機**：當使用者提到**「交接工作」、「交接給下一棒」、「本地git」、「提交git」、「推送倉庫」**時，在執行操作前夕自動調用進行極速審計（<50ms）：
  ```bash
  py .agents/skills/project_structure_keeper/scripts/keeper.py audit
  ```
- **核心價值**：自動嗅探 Git Untracked 根目錄孤兒雜檔與未登記模組，主動提示，絕不阻斷常規業務。

### 2. 🔄 粗粒度重大架構增量維護 (Living Sync)
- **日常開發**：微調 CSS、修復小 Bug、常規功能編寫，**嚴禁**觸發拓撲更新，保持開發敏捷。
- **重大架構變更**：當單一超大檔案進行**模組化拆分**，或**新增頂層核心資料夾**時，執行同步指令：
  ```bash
  py .agents/skills/project_structure_keeper/scripts/keeper.py sync
  ```

---

## 🚫 終端命令規範 (Command Hygiene)
- 調用 CLI 採用固定命令簽名，嚴禁在終端拼接長參數或動態字串。
