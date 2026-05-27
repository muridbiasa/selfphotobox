// ============================================================
// MEMO 4 FRAME — Google Apps Script Backend
// Deploy sebagai: Web App → Execute as: Me → Access: Anyone
// ============================================================

var FOLDER_NAME = "Memo4Frame_Photos";
var SHEET_NAME  = "Transactions";

// ─── ENTRY POINT ────────────────────────────────────────────
function doPost(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;

    if (action === "uploadPhoto") {
      var result = uploadPhotoToDrive(body.orderId, body.image);
      output.setContent(JSON.stringify(result));

    } else if (action === "logTransaction") {
      var result = logTransactionToSheet(body);
      output.setContent(JSON.stringify(result));

    } else {
      output.setContent(JSON.stringify({ success: false, error: "Unknown action: " + action }));
    }
  } catch (err) {
    output.setContent(JSON.stringify({ success: false, error: err.message }));
  }

  return output;
}

function doGet(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify({ status: "GAS backend aktif", version: "1.0" }));
  return output;
}

// ─── UPLOAD FOTO KE GOOGLE DRIVE ────────────────────────────
function uploadPhotoToDrive(orderId, base64DataUrl) {
  var folder = getOrCreateFolder(FOLDER_NAME);

  var base64Data = base64DataUrl.replace(/^data:image\/\w+;base64,/, "");
  var blob = Utilities.newBlob(
    Utilities.base64Decode(base64Data),
    "image/jpeg",
    "Memo4Frame_" + orderId + "_" + Date.now() + ".jpg"
  );

  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var fileId = file.getId();
  var downloadUrl = "https://drive.google.com/uc?export=download&id=" + fileId;
  var viewUrl     = "https://drive.google.com/file/d/" + fileId + "/view";

  return {
    success:     true,
    fileId:      fileId,
    downloadUrl: downloadUrl,
    viewUrl:     viewUrl,
    orderId:     orderId
  };
}

// ─── LOG TRANSAKSI KE GOOGLE SHEETS ─────────────────────────
function logTransactionToSheet(data) {
  var ss = getOrCreateSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Order ID", "Amount", "Status", "Payment Method", "File ID", "Download URL"]);
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

// ─── HELPERS ────────────────────────────────────────────────
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
