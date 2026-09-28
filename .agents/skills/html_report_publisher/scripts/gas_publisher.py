import argparse
import json
import os
import sys
import urllib.request

# Google Apps Script 萬能發布網關端點
GAS_URL = "https://script.google.com/macros/s/AKfycbxcSYXocdTxhvYRq0A5eXsJqYvOI0xImay63Au9FSmolEwlbJ0My5Gr0aWUcvVpx8AiIA/exec"
PREVIEW_BASE_URL = "https://html.foxlink.co.in/preview.html"

def publish_html_report(title: str, html_content: str, categories: list = None, description: str = "") -> dict:
    """
    AI 代理人專用核心函數：一鍵發布 HTML 報告至 Google Sheet / Drive 雲端資料庫
    
    :param title: 報告標題 (例如：'XX公司 KYC 徵信調查報告')
    :param html_content: 完整的 HTML 字串代碼 (含 CSS/JS/圖表)
    :param categories: 標籤分類列表 (例如：['對外簡報', '客戶KYC'])
    :param description: 簡要摘要說明
    :return: dict (含 success, id, driveId, url)
    """
    if not title or not html_content:
        return {"success": False, "error": "Title and HTML content cannot be empty"}

    payload = {
        "action": "save_report",
        "title": title.strip(),
        "categories": categories or ["未分類"],
        "description": description.strip() if description else "",
        "html": html_content
    }
    
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        GAS_URL, 
        data=data, 
        headers={"Content-Type": "text/plain;charset=utf-8"}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
            if res_data.get("success"):
                rep_id = res_data.get("id")
                res_data["url"] = f"{PREVIEW_BASE_URL}?id={rep_id}"
            return res_data
    except Exception as e:
        return {"success": False, "error": f"HTTP Request failed: {str(e)}"}

def main():
    parser = argparse.ArgumentParser(description="AI Agent HTML 報告一鍵發布至 Google 雲端工具")
    parser.add_argument("--file", "-f", type=str, help="欲上傳之本地 HTML 檔案路徑")
    parser.add_argument("--title", "-t", type=str, help="報告標題")
    parser.add_argument("--categories", "-c", type=str, default="對外簡報", help="分類標籤 (以逗號分隔，如 '客戶KYC,對外簡報')")
    parser.add_argument("--desc", "-d", type=str, default="", help="簡要摘要描述")

    args = parser.parse_args()

    if args.file:
        if not os.path.exists(args.file):
            print(f"❌ 錯誤: 找不到檔案 {args.file}")
            sys.exit(1)
        
        with open(args.file, "r", encoding="utf-8", errors="ignore") as fp:
            html_code = fp.read()
        
        title = args.title or os.path.splitext(os.path.basename(args.file))[0]
        categories = [c.strip() for c in args.categories.split(",") if c.strip()]
        
        print(f"🚀 正在發布【{title}】至 Google 雲端...")
        result = publish_html_report(title, html_code, categories, args.desc)
        
        if result.get("success"):
            print("\n🎉 發布成功！")
            print(f"📌 報告 ID: {result.get('id')}")
            print(f"☁️ Google Drive ID: {result.get('driveId')}")
            print(f"🌐 永久獨立預覽網址: {result.get('url')}\n")
        else:
            print(f"\n❌ 發布失敗: {result.get('error')}\n")
            sys.exit(1)
    else:
        # 無參數時展示範例調用說明
        print("💡 使用方式範例:")
        print('  py gas_publisher.py --file "reports/sample.html" --title "KYC報告" --categories "客戶KYC,對外簡報" --desc "簡介"')

if __name__ == "__main__":
    main()
