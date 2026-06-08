// ============================================================
// MEMO 4 FRAME — Google Apps Script (Upload & Log Only)
// Deploy: Web App → Execute as: Me → Access: Anyone
// MIDTRANS TOKEN HANDLED BY VERCEL API (More Secure)
// ============================================================

var FOLDER_NAME      = "Memo4Frame_Photos";
var SHEET_NAME       = "Transactions";

// ─── CORS HELPER ─────────────────────────────────────────────
function setCorsHeaders(output) {
  return output; // GAS tidak support custom headers, tapi frontend tetap bisa hit
}

// ─── ENTRY POINT POST ────────────────────────────────────────
function doPost(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    var body   = JSON.parse(e.postData.contents);
    var action = body.action;
    var result;

    if      (action === "uploadPhoto")     result = uploadPhotoToDrive(body.orderId, body.image);
    else if (action === "logTransaction")  result = logTransactionToSheet(body);
    else result = { success: false, error: "Unknown action: " + action };

    output.setContent(JSON.stringify(result));
  } catch (err) {
    output.setContent(JSON.stringify({ success: false, error: err.message }));
  }

  return output;
}

// ─── ENTRY POINT GET (health check) ──────────────────────────
function doGet(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify({ status: "GAS aktif", version: "3.0 - Upload & Log Only" }));
  return output;
}

// ─── 1. UPLOAD FOTO KE GOOGLE DRIVE ──────────────────────────
function uploadPhotoToDrive(orderId, base64DataUrl) {
  var folder     = getOrCreateFolder(FOLDER_NAME);
  var base64Data = base64DataUrl.replace(/^data:image\/\w+;base64,/, "");
  var blob       = Utilities.newBlob(
    Utilities.base64Decode(base64Data),
    "image/jpeg",
    "Memo4Frame_" + orderId + "_" + Date.now() + ".jpg"
  );

  var file   = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var fileId      = file.getId();
  var downloadUrl = "https://drive.google.com/uc?export=download&id=" + fileId;
  var viewUrl     = "https://drive.google.com/file/d/" + fileId + "/view";

  return { success: true, fileId: fileId, downloadUrl: downloadUrl, viewUrl: viewUrl, orderId: orderId };
}

// ─── 4. LOG TRANSAKSI KE SHEETS ──────────────────────────────
function logTransactionToSheet(data) {
  var ss    = getOrCreateSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Order ID", "Amount", "Status", "Method", "File ID", "Download URL"]);
    sheet.getRange(1, 1, 1, 7).setFontWeight("bold");
  }

  sheet.appendRow([
    new Date().toISOString(),
    data.orderId     || "",
    data.amount      || 20000,
    data.status      || "paid",
    data.method      || "QRIS",
    data.fileId      || "",
    data.downloadUrl || ""
  ]);

  return { success: true };
}

// ─── HELPERS ─────────────────────────────────────────────────
function getOrCreateFolder(name) {
  var folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(name);
}

function getOrCreateSpreadsheet() {
  var files = DriveApp.getFilesByName("Memo4Frame_Log");
  if (files.hasNext()) return SpreadsheetApp.open(files.next());
  return SpreadsheetApp.create("Memo4Frame_Log");
}
