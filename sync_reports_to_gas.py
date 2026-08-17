import os
import json
import time
import urllib.request

# 1. 配置參數
GAS_URL = "https://script.google.com/macros/s/AKfycbxcSYXocdTxhvYRq0A5eXsJqYvOI0xImay63Au9FSmolEwlbJ0My5Gr0aWUcvVpx8AiIA/exec"
INDEX_FILE = os.path.join(os.path.dirname(__file__), "data", "reports-index.json")
REPORTS_DIR = os.path.join(os.path.dirname(__file__), "reports")

def sync_report(report_meta):
    file_name = report_meta.get("fileName")
    file_path = os.path.join(REPORTS_DIR, file_name)
    
    if not os.path.exists(file_path):
        print(f"❌ 找不到檔案: {file_name}")
        return False

    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        html_content = f.read()

    payload = {
        "action": "save_report",
        "title": report_meta.get("title", "未命名報告"),
        "categories": report_meta.get("categories", ["未分類"]),
        "description": report_meta.get("description", ""),
        "html": html_content
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(GAS_URL, data=data, headers={"Content-Type": "application/json"})
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            res_json = json.loads(resp.read().decode("utf-8"))
            if res_json.get("success"):
                print(f"✅ 同步成功: {report_meta.get('title')[:30]} -> DriveId: {res_json.get('driveId')}")
                return True
            else:
                print(f"⚠️ 同步失敗 ({report_meta.get('title')}):", res_json.get("error"))
                return False
    except Exception as e:
        print(f"💥 請求異常 ({file_name}):", e)
        return False

def main():
    if not os.path.exists(INDEX_FILE):
        print("❌ 找不到 data/reports-index.json")
        return

    with open(INDEX_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    reports = data.get("reports", [])
    total = len(reports)
    print(f"🚀 開始同步 {total} 份報告到 Google Sheet / Drive...")

    success_count = 0
    for idx, report in enumerate(reports, 1):
        print(f"[{idx}/{total}] 正在處理: {report.get('title')[:30]}...")
        if sync_report(report):
            success_count += 1
        time.sleep(0.5) # 平滑發送，避免頻率限制

    print(f"\n🎉 全部同步完成！成功: {success_count}/{total}")

if __name__ == "__main__":
    main()
