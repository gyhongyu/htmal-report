import json
import urllib.request

GAS_URL = "https://script.google.com/macros/s/AKfycbxcSYXocdTxhvYRq0A5eXsJqYvOI0xImay63Au9FSmolEwlbJ0My5Gr0aWUcvVpx8AiIA/exec"

def publish_html_report(title: str, html_content: str, categories: list = None, description: str = "") -> dict:
    """
    AI 代理人專用：一鍵發布 HTML 報告至 Google Sheet / Drive 雲端資料庫
    
    :param title: 報告標題 (例如：'XX公司 KYC 徵信調查報告')
    :param html_content: 完整的 HTML 字串代碼 (含 CSS/JS/圖表)
    :param categories: 標籤分類列表 (例如：['KYC', '徵信'])
    :param description: 簡要摘要說明
    :return: dict (含 success, id, driveId)
    """
    payload = {
        "action": "save_report",
        "title": title,
        "categories": categories or ["未分類"],
        "description": description,
        "html": html_content
    }
    
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(GAS_URL, data=data, headers={"Content-Type": "application/json"})
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    # 範例測試
    sample_html = "<html><body><h1>AI 自動發布測試報告</h1><p>這是一份由 AI 代理人直接寫入 Google Sheet 雲端並秒開的測試報告。</p></body></html>"
    res = publish_html_report("AI Agent 即時發布測試", sample_html, ["AI測試", "自動化"], "測試 AI 直連發布")
    print("發布結果:", res)
