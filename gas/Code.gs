// ============================================================
// MEMO 4 FRAME — Google Apps Script (Full Backend)
// Deploy: Web App → Execute as: Me → Access: Anyone
// ============================================================

var FOLDER_NAME      = "Memo4Frame_Photos";
var SHEET_NAME       = "Transactions";
var MIDTRANS_SERVER_KEY = "SB-Mid-server-GANTI_DENGAN_KEY_KAMU"; // ← ganti ini
var MIDTRANS_API_URL = "https://app.sandbox.midtrans.com/snap/v1/transactions";
var MIDTRANS_STATUS_URL = "https://api.sandbox.midtrans.com/v2/";

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

    if      (action === "createToken")     result = createMidtransToken();
    else if (action === "checkStatus")     result = checkPaymentStatus(body.orderId);
    else if (action === "uploadPhoto")     result = uploadPhotoToDrive(body.orderId, body.image);
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
  output.setContent(JSON.stringify({ status: "GAS aktif", version: "2.0" }));
  return output;
}

// ─── 1. BUAT MIDTRANS SNAP TOKEN ─────────────────────────────
function createMidtransToken() {
  var orderId = "MEMO4-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();

  var authHeader = "Basic " + Utilities.base64Encode(MIDTRANS_SERVER_KEY + ":");

  var payload = {
    transaction_details: {
      order_id:     orderId,
      gross_amount: 20000
    },
    enabled_payments: ["qris"],
    expiry: { unit: "minute", duration: 15 }
  };

  var options = {
    method:  "post",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": authHeader
    },
    payload:          JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(MIDTRANS_API_URL, options);
  var data     = JSON.parse(response.getContentText());

  if (data.token) {
    return { success: true, snapToken: data.token, orderId: orderId };
  } else {
    return { success: false, error: "Midtrans error: " + JSON.stringify(data) };
  }
}

// ─── 2. CEK STATUS PEMBAYARAN ─────────────────────────────────
function checkPaymentStatus(orderId) {
  if (!orderId) return { success: false, error: "orderId kosong" };

  var authHeader = "Basic " + Utilities.base64Encode(MIDTRANS_SERVER_KEY + ":");

  var options = {
    method:  "get",
    headers: { "Authorization": authHeader },
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(MIDTRANS_STATUS_URL + orderId + "/status", options);
  var data     = JSON.parse(response.getContentText());

  var txStatus    = data.transaction_status;
  var fraudStatus = data.fraud_status;
  var isPaid      = txStatus === "settlement" ||
                    (txStatus === "capture" && fraudStatus === "accept");

  return {
    success: true,
    orderId: orderId,
    status:  isPaid ? "paid" : "pending",
    raw:     txStatus
  };
}

// ─── 3. UPLOAD FOTO KE GOOGLE DRIVE ──────────────────────────
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
