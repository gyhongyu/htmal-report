# -*- coding: utf-8 -*-
"""
html_report_publisher 專案母港哨兵 (Base Sentinel & Global Deployer)
遵循 agent_skill_architect 之雙生鏡像規範 (Twin-Skill Invariant)

職責：
1. status   : 自檢母港身分、全域錨點快照 (~/.gemini/config/html_report_publisher_host.json)、全域技能存在狀態
2. diff     : 比對專案母碼與全域投影 (~/.gemini/config/skills/html_report_publisher/) 之代碼差異
3. incidents: 主動向 agent_skill_manager 查詢外部專案提報之翻車工單
4. deploy   : 執行標準三件套發布，推播至全域技能庫並接受門禁審計
"""

import os
import sys
import json
import shutil
import filecmp
import subprocess
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SKILL_NAME = "html_report_publisher"
# __file__ = e:\Projects\htmal-report\.agents\skills\html_report_publisher\scripts\sentinel.py
# parent = scripts, parent.parent = html_report_publisher, parent^3 = skills, parent^4 = .agents, parent^5 = htmal-report
BASE_DIR = Path(__file__).resolve().parents[4]  # e:\Projects\htmal-report
CONFIG_DIR = Path.home() / ".gemini" / "config"
GLOBAL_SKILL_DIR = CONFIG_DIR / "skills" / SKILL_NAME
HOST_JSON_PATH = CONFIG_DIR / f"{SKILL_NAME}_host.json"
INCIDENT_SCRIPT = CONFIG_DIR / "skills" / "agent_skill_manager" / "scripts" / "incident.py"
AUDIT_SCRIPT = CONFIG_DIR / "skills" / "agent_skill_manager" / "scripts" / "audit.py"

def check_status():
    print(f"\n==================================================")
    print(f"⚓ 專案母港身分哨兵: {SKILL_NAME}")
    print(f"==================================================")
    print(f"📍 本地母港目錄: {BASE_DIR}")
    
    # 檢查全域 Host Snapshot
    if HOST_JSON_PATH.exists():
        try:
            with open(HOST_JSON_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            print(f"✅ 全域 Host 錨點存在: {HOST_JSON_PATH}")
            print(f"   - 登記母港: {data.get('base_project_dir')}")
            print(f"   - 發布時間: {data.get('deployed_at')}")
        except Exception as e:
            print(f"⚠️ 全域 Host 錨點讀取失敗: {e}")
    else:
        print(f"⚠️ 全域 Host 錨點不存在 ({HOST_JSON_PATH})，尚未建立全域投影！")

    # 檢查全域技能
    if GLOBAL_SKILL_DIR.exists():
        print(f"✅ 全域技能投影存在: {GLOBAL_SKILL_DIR}")
        skill_md = GLOBAL_SKILL_DIR / "SKILL.md"
        if skill_md.exists():
            print(f"   - 全域 SKILL.md 大小: {skill_md.stat().st_size} bytes")
    else:
        print(f"⚠️ 全域技能尚未部署到 ~/.gemini/config/skills/{SKILL_NAME}")

    print(f"==================================================\n")

def check_diff():
    print(f"\n🔍 比對專案母碼與全域投影差異...")
    if not GLOBAL_SKILL_DIR.exists():
        print(f"❌ 全域技能不存在，無法比對。請先執行 deploy！")
        return

    # 比對關鍵檔案
    local_skill_dir = BASE_DIR / ".agents" / "skills" / SKILL_NAME
    local_publisher = local_skill_dir / "scripts" / "gas_publisher.py"
    global_publisher = GLOBAL_SKILL_DIR / "scripts" / "gas_publisher.py"

    if not global_publisher.exists():
        print(f"⚠️ 全域缺少 scripts/gas_publisher.py")
        return

    is_same = filecmp.cmp(str(local_publisher), str(global_publisher), shallow=False)
    if is_same:
        print(f"✅ gas_publisher.py: 本地母碼與全域投影 100% 一致！")
    else:
        print(f"⚠️ gas_publisher.py: 本地母碼與全域投影有差異！請執行 deploy 刷新全域。")

def check_incidents():
    print(f"\n📋 查詢外部代理人提報之【{SKILL_NAME}】翻車工單...")
    incident_dir = GLOBAL_SKILL_DIR / "docs" / "incident_reports"
    if not incident_dir.exists():
        print(f"ℹ️ 尚無工單目錄或工單記錄（目錄正常）。")
        return

    incidents = list(incident_dir.glob("*.json"))
    if not incidents:
        print(f"🎉 乾淨！目前零未結案工單。")
        return

    print(f"🚨 發現 {len(incidents)} 筆工單：")
    for inc in incidents:
        try:
            with open(inc, "r", encoding="utf-8") as f:
                d = json.load(f)
            status = d.get("status", "OPEN")
            title = d.get("title", inc.name)
            print(f"   [{status}] {inc.stem}: {title}")
        except Exception:
            print(f"   - {inc.name}")

def deploy_global():
    print(f"\n🚀 開始將 {SKILL_NAME} 發布至全域技能庫...")
    
    local_skill_dir = Path(__file__).resolve().parent.parent
    local_scripts_dir = local_skill_dir / "scripts"

    if not local_skill_dir.exists():
        print(f"❌ 錯誤: 找不到母港專案技能目錄 {local_skill_dir}")
        return False

    # 1. 建立全域目標目錄
    GLOBAL_SKILL_DIR.mkdir(parents=True, exist_ok=True)
    global_scripts_dir = GLOBAL_SKILL_DIR / "scripts"
    global_scripts_dir.mkdir(parents=True, exist_ok=True)
    (GLOBAL_SKILL_DIR / "docs" / "incident_reports").mkdir(parents=True, exist_ok=True)

    # 2. 複製核心管理腳本 gas_publisher.py
    src_publisher = local_scripts_dir / "gas_publisher.py"
    dst_publisher = global_scripts_dir / "gas_publisher.py"
    shutil.copy2(src_publisher, dst_publisher)
    print(f"✅ 已同步核心發布腳本: {dst_publisher}")

    # 3. 產生全域適用的 client.py (提供給外部專案標準固定命令)
    client_content = f'''# -*- coding: utf-8 -*-
"""
{SKILL_NAME} 全域客戶端中轉 (Global Dispatcher)
由母港基地專案 ({BASE_DIR.as_posix()}) 自動投影生成，請勿手動編輯！
"""
import sys
import subprocess
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

TARGET_SCRIPT = Path(__file__).resolve().parent / "gas_publisher.py"

def main():
    cmd = [sys.executable, str(TARGET_SCRIPT)] + sys.argv[1:]
    res = subprocess.run(cmd)
    sys.exit(res.returncode)

if __name__ == "__main__":
    main()
'''
    with open(global_scripts_dir / "client.py", "w", encoding="utf-8") as f:
        f.write(client_content)
    print(f"✅ 已建立全域轉發客戶端: {global_scripts_dir / 'client.py'}")

    # 4. 產生全域 doctor.py
    doctor_content = f'''# -*- coding: utf-8 -*-
"""
{SKILL_NAME} 全域健康度自檢
"""
import sys
import subprocess
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

def main():
    print("🏥 正在自檢 {SKILL_NAME} 網關連線與 GAS 端點...")
    target = Path(__file__).resolve().parent / "gas_publisher.py"
    res = subprocess.run([sys.executable, str(target), "list"])
    if res.returncode == 0:
        print("✅ {SKILL_NAME} 雲端連線 100% 正常！")
    else:
        print("❌ {SKILL_NAME} 連線異常，請檢查網路或 GAS 網關。")
    sys.exit(res.returncode)

if __name__ == "__main__":
    main()
'''
    with open(global_scripts_dir / "doctor.py", "w", encoding="utf-8") as f:
        f.write(doctor_content)
    print(f"✅ 已建立健康檢查探針: {global_scripts_dir / 'doctor.py'}")

    description = (
        "全域 HTML 商業報告雲端極速發布大師與台帳總管 (Universal HTML Report Cloud Publisher & Gateway)。"
        "支援將任何 AI 代理人生成的商業簡報、客戶 KYC、技術報告一鍵直傳 Google Drive 與 Google Sheet，秒獲全網永久獨立預覽網址 (preview.html?id=rep_xxx)。"
        "當使用者或代理人提到「發布HTML報告」、「HTML報告上傳」、「生成報告連結」、「查詢HTML報告台帳」、「更新HTML報告」、「刪除HTML報告」、「下載HTML報告」、「html_report_publisher」時自動強制觸發。"
        "嚴禁用於修改本地 reports/ 目錄歷史報告、嚴禁用於常規純文字 Markdown 轉檔（請調用 md_conversion）。"
    )
    global_skill_md = f"""---
name: {SKILL_NAME}
description: {description}
gateway_source: true
---

# 全域 HTML 報告雲端發布與管理大師 ({SKILL_NAME})

> [!WARNING]
> **母港基地唯一真理庫守則 (Base Project SSOT Invariant)**：
> 1. 本技能為**全域投影網關**，其母港開發基地為：`{BASE_DIR.as_posix()}`。
> 2. **外部專案代理人 100% 嚴禁手動修改本全域技能之代碼**！
> 3. 若調用遇阻、發生報錯或需擴充功能，請執行翻車工單提報：
>    `py %USERPROFILE%\\.gemini\\config\\skills\\agent_skill_manager\\scripts\\incident.py inject --skill {SKILL_NAME} --summary "問題描述"`

---

## 全域代理人指令速查 (CLI Standards)

本技能提供固定簽名命令，外部任何專案的 AI 代理人皆可隨時呼叫：

### 1. 一鍵發布新 HTML 報告 (Publish)
```powershell
py %USERPROFILE%\\.gemini\\config\\skills\\{SKILL_NAME}\\scripts\\client.py --file "path/to/report.html" --title "XX專案分析報告" --desc "簡要說明"
```

### 2. 查詢雲端所有報告台帳 (List)
```powershell
py %USERPROFILE%\\.gemini\\config\\skills\\{SKILL_NAME}\\scripts\\client.py list
```

### 3. 原地更新已有報告內容 (Update)
```powershell
py %USERPROFILE%\\.gemini\\config\\skills\\{SKILL_NAME}\\scripts\\client.py update --id rep_xxx --file "new.html" --title "新標題"
```

### 4. 刪除雲端報告 (Delete)
```powershell
py %USERPROFILE%\\.gemini\\config\\skills\\{SKILL_NAME}\\scripts\\client.py delete --id rep_xxx
```

### 5. 下載雲端報告原始碼 (Get)
```powershell
py %USERPROFILE%\\.gemini\\config\\skills\\{SKILL_NAME}\\scripts\\client.py get --drive-id 1ab...xyz --output "saved.html"
```

### 6. 健康自檢 (Doctor)
```powershell
py %USERPROFILE%\\.gemini\\config\\skills\\{SKILL_NAME}\\scripts\\doctor.py
```
"""
    with open(GLOBAL_SKILL_DIR / "SKILL.md", "w", encoding="utf-8") as f:
        f.write(global_skill_md)
    print(f"✅ 已生成全域規格手冊: {GLOBAL_SKILL_DIR / 'SKILL.md'}")

    # 6. 寫入全域 Host Snapshot (~/.gemini/config/html_report_publisher_host.json)
    from datetime import datetime
    host_info = {
        "skill_name": SKILL_NAME,
        "base_project_dir": str(BASE_DIR).replace("\\", "/"),
        "gateway_path": str(GLOBAL_SKILL_DIR).replace("\\", "/"),
        "deployed_at": datetime.now().isoformat(),
        "status": "active"
    }
    with open(HOST_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(host_info, f, indent=2, ensure_ascii=False)
    print(f"✅ 已登記全域 Host 錨點: {HOST_JSON_PATH}")

    # 7. 執行 agent_skill_manager 審計驗收
    if AUDIT_SCRIPT.exists():
        print(f"\n🧪 正在調用 agent_skill_manager 執行全域門禁審計...")
        audit_res = subprocess.run([sys.executable, str(AUDIT_SCRIPT), "--skill", SKILL_NAME])
        if audit_res.returncode == 0:
            print(f"🎉 門禁審計通過！{SKILL_NAME} 已成功全域上線！")
        else:
            print(f"⚠️ 審計有未達標項目，請依指示修正。")

    print(f"\n🏁 發布完成！\n")
    return True

def main():
    if len(sys.argv) < 2:
        print("使用方式: py sentinel.py [status | diff | incidents | deploy]")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    if cmd == "status":
        check_status()
    elif cmd == "diff":
        check_diff()
    elif cmd == "incidents":
        check_incidents()
    elif cmd == "deploy":
        deploy_global()
    else:
        print(f"未知指令: {cmd}。支援: status, diff, incidents, deploy")
        sys.exit(1)

if __name__ == "__main__":
    main()
