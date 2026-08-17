# 🌟 HTML Reports 現代化雲端報告中心 (AI-Native Dual-Track Hub v2.0)

> 專為 **AI 代理人自動發布** 與 **人類專業管理** 打造的現代化 HTML 報告管理中心。  
> 融合 **Google Sheet / Drive 萬能雲端 SSOT** 與 **GitHub Pages 靜態歸檔**，實現零伺服器、秒級秒開、永久獨立網址與密碼防護！

**🌐 線上正式訪問網址**：[https://html.foxlink.co.in](https://html.foxlink.co.in)

---

## ✨ 核心架構亮點

- ⚡ **5 毫秒極速秒開 (Zero-Block SWR)**：採用 `Promise.allSettled` 並行通道，本地 151 篇歷史索引與 Google 雲端 API 並行非同步拉取，徹底杜絕首頁卡頓。
- ☁️ **大檔案無損突破**：大於 50KB 的 HTML 代碼自動存入 Google Drive (`HTML_Reports_Store`)，完全突破 Google Sheet 50,000 字元長度限制。
- 🛡️ **雙軌向後相容保護**：
  - **151 篇歷史舊報告**：位於 `reports/report-xxx.html`，既有網址永恆不壞；前端編輯時標題唯讀，HTML 代碼透過 GAS 調用 GitHub REST API 原地 Direct Commit 覆蓋！
  - **全新雲端報告**：自動進入 Google Drive & Sheet，支援秒增、秒改、秒刪。
- 🎨 **左右雙欄即時動態預覽編輯器**：深色代碼編輯器 ✕ 滿版 iframe 即時連動預覽 ✕ 多標籤點選。
- 🔒 **密碼鎖與記住我**：動態讀取 Google Sheet `Config` 工作表密碼，首頁支援本機永久記住登入狀態。
- 🤖 **AI 代理人原生直連**：AI Agent 產出報告後，只需調用 `gas_publisher.py` 一鍵上線並取得獨立永久預覽網址！

---

## 🤖 AI 代理人一鍵發布指引 (AI Agent Fast Publish)

本專案根目錄內建 Python 發布工具 [`gas_publisher.py`](file:///e:/Projects/htmal-report/gas_publisher.py)，任何 AI 代理人皆可一行指令發布：

### 1. 命令列調用 (CLI)
```powershell
py gas_publisher.py --file "reports/my_report.html" --title "XX專案 KYC 徵信調查報告" --categories "客戶KYC,對外簡報" --desc "Aisin專案供應鏈調查"
```
發布成功後，終端將直接輸出該報告的專屬永久獨立預覽網址：  
👉 `https://html.foxlink.co.in/preview.html?id=rep_1786988344233`

### 2. Python 腳本內建調用 (SDK Pattern)
```python
from gas_publisher import publish_html_report

res = publish_html_report(
    title="Aisin AVM 專案 PCBA 雙軌製造提案書",
    html_content="<!DOCTYPE html><html>...</html>",
    categories=["對外簡報", "客戶KYC", "客戶攻略"],
    description="車載全球客戶實績簡介"
)

if res["success"]:
    print("發布成功！網址:", res["url"])
```

---

## 🔑 密碼與配置管理 (Password & Config)

- **預設安全密碼**：`10101010`
- **動態修改密碼**：
  1. 打開 Google Sheet **《HTML代碼倉庫》**（[點此開啟試算表](https://docs.google.com/spreadsheets/d/1YgwlA-f5Iq487-0FVU2ChOckNVLb3h1ejbrUNkUr4WQ/edit)）。
  2. 切換到底部的 **`Config`** 頁籤。
  3. 修改 **B1** 格的密碼，全系統即時生效！

| 工作表 | A 欄 (Key) | B 欄 (Value) |
|---|---|---|
| **Config** | `Admin_Password` | `您的自訂密碼` |

---

## 📁 目錄結構

```
htmal-report/
├── .agents/skills/              # 專案專屬 AI 技能庫
│   ├── html_report_publisher/   # AI 報告極速發布大師
│   └── htmal_report_admin/      # 雙軌架構與 Admin 維護手冊
├── AGENTS.md                    # 專案最高守則與 AI 開發鐵律
├── NEXT_AGENT_HANDOVER_ROADMAP.md # AI 代理人工作交接藍圖
│
├── index.html                   # 主系統首頁 (密碼鎖 + 卡片管理 + 左右雙欄編輯器)
├── preview.html                 # 獨立報告原生滿版無損渲染頁面
├── app.js                       # 前端核心應用邏輯
│
├── components/                  # React 模組化組件
│   ├── HomePage.js              # 首頁網格與分類導航
│   ├── PageCard.js              # 智慧雙軌卡片 (雲端刪除 / 舊卡唯讀)
│   ├── HTMLEditor.js            # 左側代碼編輯器
│   ├── PreviewPanel.js          # 右側滿版即時預覽視窗
│   └── ...
│
├── utils/
│   └── reportsLoader.js         # SWR 並行秒開雙軌載入器
│
├── gas_publisher.py             # 🌟 AI 代理人一鍵發布 CLI 工具
├── sync_reports_to_gas.py       # 歷史舊報告批次雲端遷移工具
│
├── reports/                     # 151 篇 GitHub 歷史靜態報告 (只讀保護)
└── data/
    └── reports-index.json       # 歷史報告元數據索引
```

---

## 🌿 分支管理策略 (Branch Strategy)

- **`main`**：最新主分支（已上線，現代化雲端雙軌架構，零依賴本地後端）。
- **`backup-legacy-20260818`**：**舊架構永久安全備份分支**（包含舊版 Node.js `admin/` 與 `start.bat`，安全封存）。

---

## 📜 授權與維護
- **維護者**：Foxlink / gyhongyu
- **AI 協作架構**：Google Antigravity Agentic Framework
