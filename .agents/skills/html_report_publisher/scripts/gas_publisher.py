import argparse
import json
import os
import sys
import urllib.request
import urllib.parse

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Google Apps Script 萬能發布網關端點
GAS_URL = "https://script.google.com/macros/s/AKfycbxcSYXocdTxhvYRq0A5eXsJqYvOI0xImay63Au9FSmolEwlbJ0My5Gr0aWUcvVpx8AiIA/exec"
PREVIEW_BASE_URL = "https://html.foxlink.co.in/preview.html"


def send_post_request(payload: dict) -> dict:
    """發送 POST 請求至 GAS 網關"""
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        GAS_URL,
        data=data,
        headers={"Content-Type": "text/plain;charset=utf-8"}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return {"success": False, "error": f"POST Request failed: {str(e)}"}


def send_get_request(params: dict) -> dict:
    """發送 GET 請求至 GAS 網關"""
    query_str = urllib.parse.urlencode(params)
    req_url = f"{GAS_URL}?{query_str}"
    try:
        with urllib.request.urlopen(req_url, timeout=30) as resp:
            content = resp.read().decode("utf-8")
            try:
                return json.loads(content)
            except Exception:
                return {"success": True, "raw": content}
    except Exception as e:
        return {"success": False, "error": f"GET Request failed: {str(e)}"}


def publish_html_report(title: str, html_content: str, description: str = "", categories: list = None) -> dict:
    """一鍵發布 HTML 報告至 Google Sheet / Drive 雲端資料庫 (免標籤純淨發布)"""
    if not title or not html_content:
        return {"success": False, "error": "Title and HTML content cannot be empty"}

    payload = {
        "action": "save_report",
        "title": title.strip(),
        "categories": categories or [],
        "description": description.strip() if description else "",
        "html": html_content
    }

    res_data = send_post_request(payload)
    if res_data.get("success"):
        rep_id = res_data.get("id")
        res_data["url"] = f"{PREVIEW_BASE_URL}?id={rep_id}"
    return res_data


def list_cloud_reports() -> list:
    """列出 Google Sheet 雲端所有動態報告台帳"""
    res = send_get_request({"action": "list"})
    return res.get("reports", []) if isinstance(res, dict) else []


def get_cloud_report_html(drive_id: str) -> str:
    """從 Google Drive 下載指定報告的原始 HTML 代碼"""
    if not drive_id:
        return None
    req_url = f"{GAS_URL}?action=get&driveId={drive_id}"
    try:
        with urllib.request.urlopen(req_url, timeout=30) as resp:
            return resp.read().decode("utf-8")
    except Exception as e:
        print(f"❌ 讀取報告失敗: {e}", file=sys.stderr)
        return None


def update_cloud_report(report_id: str, title: str = None, html_content: str = None, categories: list = None, description: str = None) -> dict:
    """原地更新 Google 雲端報告的標題、分類、摘要或 HTML 代碼"""
    if not report_id:
        return {"success": False, "error": "Missing report id"}

    payload = {
        "action": "update_report",
        "id": report_id
    }
    if title:
        payload["title"] = title.strip()
    if categories is not None:
        payload["categories"] = categories
    if description is not None:
        payload["description"] = description.strip()
    if html_content:
        payload["html"] = html_content

    return send_post_request(payload)


def delete_cloud_report(report_id: str, drive_id: str = None) -> dict:
    """從 Google Drive 與 Google Sheet 雙向刪除雲端報告"""
    if not report_id:
        return {"success": False, "error": "Missing report id"}

    # 若未提供 drive_id，自動從 list 尋找對應 driveId
    if not drive_id:
        reports = list_cloud_reports()
        for r in reports:
            if r.get("id") == report_id:
                drive_id = r.get("driveId")
                break

    payload = {
        "action": "delete_report",
        "id": report_id,
        "driveId": drive_id or ""
    }
    return send_post_request(payload)


def main():
    parser = argparse.ArgumentParser(description="AI Agent HTML 報告一鍵發布與全生命週期雲端管理工具")
    subparsers = parser.add_subparsers(dest="command", help="子命令 (list / delete / update / get / publish)")

    # 1. list 子命令
    subparsers.add_parser("list", help="列出 Google 雲端所有動態報告")

    # 2. delete 子命令
    del_parser = subparsers.add_parser("delete", help="從雲端刪除指定報告")
    del_parser.add_argument("--id", required=True, help="報告 ID (例如: rep_1792323623987)")
    del_parser.add_argument("--drive-id", help="可選 Google Drive 檔案 ID")

    # 3. update 子命令
    up_parser = subparsers.add_parser("update", help="原地更新雲端報告內容或資訊")
    up_parser.add_argument("--id", required=True, help="報告 ID")
    up_parser.add_argument("--file", "-f", help="新的 HTML 檔案路徑")
    up_parser.add_argument("--title", "-t", help="新的報告標題")
    up_parser.add_argument("--categories", "-c", help="新的分類標籤 (以逗點分隔)")
    up_parser.add_argument("--desc", "-d", help="新的摘要描述")

    # 4. get 子命令
    get_parser = subparsers.add_parser("get", help="下載指定報告原始 HTML 代碼")
    get_parser.add_argument("--drive-id", required=True, help="Google Drive 檔案 ID")
    get_parser.add_argument("--output", "-o", help="輸出之本地檔案路徑")

    # 5. publish 子命令 (也可直接傳 --file 兼容舊語法)
    pub_parser = subparsers.add_parser("publish", help="發布新報告至 Google 雲端")
    pub_parser.add_argument("--file", "-f", required=True, help="欲上傳之本地 HTML 檔案路徑")
    pub_parser.add_argument("--title", "-t", help="報告標題")
    pub_parser.add_argument("--categories", "-c", default="", help="分類標籤 (以逗點分隔)")
    pub_parser.add_argument("--desc", "-d", default="", help="簡要摘要描述")

    # 頂層參數支援（100% 向下兼容原有: py gas_publisher.py --file ...）
    parser.add_argument("--file", "-f", type=str, help="欲上傳之本地 HTML 檔案路徑 (相容語法)")
    parser.add_argument("--title", "-t", type=str, help="報告標題 (相容語法)")
    parser.add_argument("--categories", "-c", type=str, default="", help="分類標籤 (相容語法)")
    parser.add_argument("--desc", "-d", type=str, default="", help="簡要摘要描述 (相容語法)")

    args = parser.parse_args()

    # A. 執行 list
    if args.command == "list":
        reports = list_cloud_reports()
        print(f"\n📊 Google 雲端目前共有 {len(reports)} 篇動態報告：")
        print("-" * 80)
        for idx, r in enumerate(reports, 1):
            categories = ",".join(r.get("categories", []))
            print(f"{idx:02d}. [{r.get('id')}] {r.get('title')}")
            print(f"    分類: {categories} | 建立時間: {r.get('createdAt')}")
            print(f"    DriveID: {r.get('driveId')}")
            print(f"    預覽網址: {PREVIEW_BASE_URL}?id={r.get('id')}")
            print("-" * 80)
        return

    # B. 執行 delete
    if args.command == "delete":
        print(f"🗑️ 正在從 Google 雲端刪除報告 [{args.id}]...")
        result = delete_cloud_report(args.id, args.drive_id)
        if result.get("success"):
            print(f"✅ 成功刪除報告: {args.id}")
        else:
            print(f"❌ 刪除失敗: {result.get('error')}")
            sys.exit(1)
        return

    # C. 執行 update
    if args.command == "update":
        html_code = None
        if args.file:
            if not os.path.exists(args.file):
                print(f"❌ 錯誤: 找不到檔案 {args.file}")
                sys.exit(1)
            with open(args.file, "r", encoding="utf-8", errors="ignore") as fp:
                html_code = fp.read()

        cats = [c.strip() for c in args.categories.split(",") if c.strip()] if args.categories else None
        print(f"🔄 正在更新 Google 雲端報告 [{args.id}]...")
        result = update_cloud_report(
            report_id=args.id,
            title=args.title,
            html_content=html_code,
            categories=cats,
            description=args.desc
        )
        if result.get("success"):
            print(f"✅ 報告更新成功！網址: {PREVIEW_BASE_URL}?id={args.id}")
        else:
            print(f"❌ 更新失敗: {result.get('error')}")
            sys.exit(1)
        return

    # D. 執行 get
    if args.command == "get":
        print(f"📥 正在下載 Drive 檔案 [{args.drive_id}]...")
        html_content = get_cloud_report_html(args.drive_id)
        if html_content:
            output_file = args.output or f"{args.drive_id}.html"
            with open(output_file, "w", encoding="utf-8") as fp:
                fp.write(html_content)
            print(f"✅ 成功下載並保存至: {output_file} ({len(html_content)} 字元)")
        else:
            print("❌ 下載失敗")
            sys.exit(1)
        return

    # E. 執行 publish (相容 publish 子命令 或 原有頂層 --file 模式)
    file_path = getattr(args, "file", None)
    if not file_path and args.command == "publish":
        file_path = args.file

    if file_path:
        if not os.path.exists(file_path):
            print(f"❌ 錯誤: 找不到檔案 {file_path}")
            sys.exit(1)

        with open(file_path, "r", encoding="utf-8", errors="ignore") as fp:
            html_code = fp.read()

        title = args.title or os.path.splitext(os.path.basename(file_path))[0]
        categories = [c.strip() for c in args.categories.split(",") if c.strip()] if args.categories else []

        print(f"🚀 正在發布【{title}】至 Google 雲端...")
        result = publish_html_report(title, html_code, description=args.desc, categories=categories)

        if result.get("success"):
            print("\n🎉 發布成功！")
            print(f"📌 報告 ID: {result.get('id')}")
            print(f"☁️ Google Drive ID: {result.get('driveId')}")
            print(f"🌐 永久獨立預覽網址: {result.get('url')}\n")
        else:
            print(f"\n❌ 發布失敗: {result.get('error')}\n")
            sys.exit(1)
    else:
        # 無參數提示
        print("💡 使用方式範例:")
        print('  1. 發布新報告: py gas_publisher.py --file "path/to.html" --title "KYC報告" --desc "簡要描述"')
        print("  2. 查看雲端報告: py gas_publisher.py list")
        print("  3. 刪除雲端報告: py gas_publisher.py delete --id rep_xxx")
        print('  4. 更新雲端報告: py gas_publisher.py update --id rep_xxx --file "new.html"')
        print('  5. 下載雲端報告: py gas_publisher.py get --drive-id 1ab...xyz --output "save.html"')


if __name__ == "__main__":
    main()
