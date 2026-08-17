/**
 * =========================================================================
 * 🌐 HTML 報告專用 GAS 雲端萬能網關 v4 (Code.gs)
 * =========================================================================
 * 核心功能：
 * 1. 密碼驗證 (verify_password)：動態讀取 Config 頁籤 B1 格
 * 2. 報告清單 (list)：讀取《HTML代碼倉庫》
 * 3. 滿版 HTML 代碼取得 (get)：直接從 Google Drive 原生無損輸出
 * 4. 雲端報告 CRUD (save_report / update_report / delete_report)
 * 5. GitHub Direct Commit 原地覆蓋 (update_github_file)
 * =========================================================================
 */

const FOLDER_NAME = "HTML_Reports_Store";
// GITHUB_TOKEN 存放於 Google Sheet Config 表或由全域 github_manager 技能維護
const GITHUB_TOKEN = "READ_FROM_GLOBAL_GITHUB_MANAGER_SKILL";
const GITHUB_OWNER = "gyhongyu";
const GITHUB_REPO = "htmal-report";

function doGet(e) {
  const params = e.parameter || {};
  const action = params.action || "list";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. 密碼驗證 (優先讀取 Config 頁籤 B1)
  if (action === "verify_password") {
    const inputPassword = params.password || "";
    const configSheet = ss.getSheetByName("Config");
    let actualPassword = "";
    if (configSheet) {
      const configData = configSheet.getDataRange().getValues();
      for (let i = 0; i < configData.length; i++) {
        if (configData[i][0] === "Admin_Password") {
          actualPassword = String(configData[i][1]).trim();
          break;
        }
      }
    }
    if (!actualPassword) actualPassword = "10101010"; // 預設安全保底
    return jsonResponse({ valid: (inputPassword === actualPassword) });
  }

  // 2. 取得報告清單
  if (action === "list") {
    const sheet = ss.getSheetByName("工作表1") || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return jsonResponse({ reports: [] });
    const reports = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue;
      reports.push({
        id: String(row[0]),
        title: row[1],
        categories: row[2] ? String(row[2]).split(",") : ["未分類"],
        createdAt: row[3],
        description: row[4] || "",
        driveId: row[5]
      });
    }
    return jsonResponse({ reports: reports.reverse() });
  }
  
  // 3. 取得單篇完整 HTML 代碼 (Drive 原生無損)
  if (action === "get") {
    const driveId = params.driveId;
    if (!driveId) return jsonResponse({ error: "Missing driveId" });
    try {
      const file = DriveApp.getFileById(driveId);
      const html = file.getBlob().getDataAsString();
      return ContentService.createTextOutput(html).setMimeType(ContentService.MimeType.TEXT);
    } catch (err) {
      return jsonResponse({ error: "Failed to read file: " + err.message });
    }
  }

  return jsonResponse({ status: "ok" });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action || "save_report";
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("工作表1") || ss.getSheets()[0];

    // =========================================================================
    // A. 原地覆蓋修改 GitHub 倉庫實體檔案 (舊報告修改專用)
    // =========================================================================
    if (action === "update_github_file") {
      const fileName = body.fileName;
      const htmlContent = body.html;
      if (!fileName || !htmlContent) return jsonResponse({ success: false, error: "Missing fileName or html" });

      const getFileUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/reports/${fileName}`;
      const getOptions = {
        method: "GET",
        headers: { "Authorization": "token " + GITHUB_TOKEN, "Accept": "application/vnd.github.v3+json", "User-Agent": "GAS-Report-Manager" },
        muteHttpExceptions: true
      };
      const getResp = UrlFetchApp.fetch(getFileUrl, getOptions);
      if (getResp.getResponseCode() !== 200) return jsonResponse({ success: false, error: "GitHub 查無此檔" });

      const fileSha = JSON.parse(getResp.getContentText()).sha;
      const base64Content = Utilities.base64Encode(Utilities.newBlob(htmlContent).getBytes());
      const putPayload = { message: `Update report via Web Admin: ${fileName}`, content: base64Content, sha: fileSha };
      const putOptions = {
        method: "PUT",
        headers: { "Authorization": "token " + GITHUB_TOKEN, "Accept": "application/vnd.github.v3+json", "User-Agent": "GAS-Report-Manager", "Content-Type": "application/json" },
        payload: JSON.stringify(putPayload),
        muteHttpExceptions: true
      };
      const putResp = UrlFetchApp.fetch(getFileUrl, putOptions);
      if (putResp.getResponseCode() === 200 || putResp.getResponseCode() === 201) {
        return jsonResponse({ success: true, message: "GitHub File Updated" });
      } else {
        return jsonResponse({ success: false, error: putResp.getContentText() });
      }
    }

    // =========================================================================
    // B. 新增雲端報告 (Google Drive & Sheet)
    // =========================================================================
    if (action === "save_report") {
      const title = body.title || "未命名報告";
      const categories = Array.isArray(body.categories) ? body.categories.join(",") : (body.categories || "未分類");
      const description = body.description || "";
      const html = body.html || "<h1>空白內容</h1>";
      const id = "rep_" + new Date().getTime();
      const createdAt = new Date().toISOString().split("T")[0];

      const folders = DriveApp.getFoldersByName(FOLDER_NAME);
      const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(FOLDER_NAME);
      const file = folder.createFile(id + ".html", html, "text/html");
      const driveId = file.getId();

      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["ID", "Title", "Categories", "CreatedAt", "Description", "DriveFileID"]);
      }
      sheet.appendRow([id, title, categories, createdAt, description, driveId]);
      return jsonResponse({ success: true, id: id, driveId: driveId, title: title });
    }

    // =========================================================================
    // C. 原地覆蓋更新雲端報告 (Google Drive)
    // =========================================================================
    if (action === "update_report") {
      const id = body.id;
      const title = body.title;
      const categories = Array.isArray(body.categories) ? body.categories.join(",") : body.categories;
      const description = body.description || "";
      const html = body.html;

      const data = sheet.getDataRange().getValues();
      let rowIndex = -1, driveId = "";
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(id)) {
          rowIndex = i + 1; driveId = data[i][5]; break;
        }
      }
      if (driveId && html) {
        try { DriveApp.getFileById(driveId).setContent(html); } catch (fErr) {}
      }
      if (rowIndex > 0) {
        if (title) sheet.getRange(rowIndex, 2).setValue(title);
        if (categories) sheet.getRange(rowIndex, 3).setValue(categories);
        sheet.getRange(rowIndex, 5).setValue(description);
      }
      return jsonResponse({ success: true, message: "Cloud Report Updated" });
    }

    // =========================================================================
    // D. 刪除雲端報告
    // =========================================================================
    if (action === "delete_report") {
      const id = body.id, driveId = body.driveId;
      if (driveId) { try { DriveApp.getFileById(driveId).setTrashed(true); } catch (e) {} }
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(id)) {
          sheet.deleteRow(i + 1); break;
        }
      }
      return jsonResponse({ success: true, message: "Deleted" });
    }

    return jsonResponse({ error: "Unknown action: " + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
