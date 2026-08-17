---
name: html_report_publisher
description: 專案專屬 HTML 報告雲端極速發布大師。專門用於指導 AI 代理人將生成的商業簡報、客戶 KYC、會議紀要等 HTML 文件，透過 GAS 萬能網關一鍵發布至 Google Drive (HTML_Reports_Store) 與 Google Sheet (HTML代碼倉庫)，自動獲取獨立永久預覽網址 (preview.html?id=rep_xxx)。當使用者或代理人需要「發布新 HTML 報告」、「將報告上傳至雲端」、「生成報告獨立連結」時自動觸發。
---

# HTML 報告雲端極速發布技能 (html_report_publisher v1.0)

> [!IMPORTANT]
> **🌟 單一真理庫 (SSOT) 與核心邊界守則**：
> 1. **大檔案無損突破**：大於 50KB 的 HTML 代碼一律儲存於 Google Drive (`HTML_Reports_Store`)，Google Sheet 僅儲存元數據索引與 `DriveFileID`，徹底規避 Google Sheet 單元格 50,000 字元長度限制。
> 2. **雙軌獨立網址防線**：
>    - **舊版 151 篇報告**：位於 `reports/report-xxx.html`，網址為 `https://html.foxlink.co.in/reports/report-xxx.html`，**嚴禁任何操作破壞既有路徑與檔案名稱**！
>    - **新版雲端報告**：位於 Google Drive，網址為 `https://html.foxlink.co.in/preview.html?id=rep_xxx`。
> 3. **原生滿版無損渲染**：`preview.html` 採用原生 `document.open/write/close` 滿版無損渲染，嚴禁額外包裝外層 React 外殼或標題列，確保圖表、字體與排版 100% 無損呈現。

---

## 🛠️ AI 代理人一鍵發布指令 (CLI Standard)

專案根目錄內建 Python 發布工具：[`gas_publisher.py`](file:///e:/Projects/htmal-report/gas_publisher.py)

### 1. 發布本地 HTML 檔案至雲端
```powershell
py gas_publisher.py --file "path/to/report.html" --title "XX 專案提案書" --categories "對外簡報,客戶KYC" --desc "簡要描述"
```

### 2. 程式碼內建調用 (Python SDK Pattern)
```python
from gas_publisher import publish_html_report

result = publish_html_report(
    html_content=html_string,
    title="Aisin AVM 專案 PCBA 雙軌製造與靈活代工提案書",
    categories=["對外簡報", "客戶KYC", "客戶攻略"],
    description="Aisin AVM Camera PCBA 靈活製造與越南廠代工服務方案提案書。"
)

if result["success"]:
    print(f"發布成功！獨立預覽網址: {result['url']}")
```

---

## 📋 發布驗收三步黃金儀軌 (3-Step Verification)

1. **Step 1: 發布並取得 ID**：確認回傳 JSON 包含 `success: true`、`id` (格式為 `rep_timestamp`) 與 `driveId`。
2. **Step 2: 雲端台帳核對**：確認 Google Sheet《HTML代碼倉庫》已新增該筆資料列，Google Drive `HTML_Reports_Store` 資料夾已存在實體 `.html` 檔案。
3. **Step 3: 獨立網址實測**：訪問 `preview.html?id=rep_xxx`，確認渲染正常、無白邊、無白條外殼。
