---
name: html_report_publisher
description: 專案專屬 HTML 報告雲端極速發布大師與全域母港中樞 (Universal HTML Report Cloud Publisher & Base SSOT)。本專案為全域技能 html_report_publisher 的唯一母碼庫。當使用者或代理人需要「發布新 HTML 報告」、「將報告上傳至雲端」、「生成報告獨立連結」、「升級全域技能」、「發布全域技能」、「檢查全域同步狀態」、「母技能有更新嗎」、「查全域技能翻車工單」、「你在維護哪個全域技能」時自動強制觸發。
gateway_source: true
---

# HTML 報告雲端極速發布技能 (html_report_publisher v1.0 - 母港基地專用)

> [!IMPORTANT]
> **⚓ 本專案為全域技能 `html_report_publisher` 的唯一母港開發基地 (SSOT Base)**：
> 1. 本技能遵循 `agent_skill_architect` 之【雙生鏡像規範 (Twin-Skill Invariant)】。
> 2. 任何全新進場之 AI 代理人，看到本技能即確認**本專案負責維護全域 `html_report_publisher`**！
> 3. 母港專用管理哨兵位於：[`scripts/sentinel.py`](scripts/sentinel.py)。
>    - 自檢身分：`py .agents\skills\html_report_publisher\scripts\sentinel.py status`
>    - 母碼差異：`py .agents\skills\html_report_publisher\scripts\sentinel.py diff`
>    - 外部工單：`py .agents\skills\html_report_publisher\scripts\sentinel.py incidents`
>    - 一鍵發布：`py .agents\skills\html_report_publisher\scripts\sentinel.py deploy`
> 1. **大檔案無損突破**：大於 50KB 的 HTML 代碼一律儲存於 Google Drive (`HTML_Reports_Store`)，Google Sheet 僅儲存元數據索引與 `DriveFileID`，徹底規避 Google Sheet 單元格 50,000 字元長度限制。
> 2. **雙軌獨立網址防線**：
>    - **舊版 151 篇報告**：位於 `reports/report-xxx.html`，網址為 `https://html.foxlink.co.in/reports/report-xxx.html`，**嚴禁任何操作破壞既有路徑與檔案名稱**！
>    - **新版雲端報告**：位於 Google Drive，網址為 `https://html.foxlink.co.in/preview.html?id=rep_xxx`。其元數據之 `fileName` 固定為空字串 `""`，唯一識別為 `driveId` 與 `pageId`，此為正常契約，嚴禁視為缺失！
> 3. **原生滿版無損渲染**：`preview.html` 採用原生 `document.open/write/close` 滿版無損渲染，嚴禁額外包裝外層 React 外殼或標題列，確保圖表、字體與排版 100% 無損呈現。

---

## 🛠️ AI 代理人全生命週期雲端管理指令 (CLI Standard)

發布與管理工具位於技能專屬腳本目錄：[`gas_publisher.py`](scripts/gas_publisher.py)

### 1. 發布新報告 (Publish)
```powershell
py .agents\skills\html_report_publisher\scripts\gas_publisher.py --file "path/to/report.html" --title "XX 專案提案書" --categories "對外簡報,客戶KYC" --desc "簡要描述"
```

### 2. 查詢所有雲端報告台帳 (List)
```powershell
py .agents\skills\html_report_publisher\scripts\gas_publisher.py list
```

### 3. 原地更新雲端報告 (Update)
```powershell
py .agents\skills\html_report_publisher\scripts\gas_publisher.py update --id rep_xxx --file "new.html" --title "新標題"
```

### 4. 刪除雲端報告 (Delete)
```powershell
py .agents\skills\html_report_publisher\scripts\gas_publisher.py delete --id rep_xxx
```

### 5. 下載雲端報告原始碼 (Get)
```powershell
py .agents\skills\html_report_publisher\scripts\gas_publisher.py get --drive-id 1ab...xyz --output "saved.html"
```

### 2. 程式碼內建調用 (Python SDK Pattern)
```python
import sys
from pathlib import Path
sys.path.append(str(Path(".agents/skills/html_report_publisher/scripts").resolve()))
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
