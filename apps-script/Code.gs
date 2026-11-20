/**
 * Tennis Tracker -> Google Sheets
 *
 * Receives match rows from the Tennis Tracker watch app (via the side
 * service in the Zepp app) and writes them into the sheet "Matches".
 * One row per match, identified by the column "id": a match that is
 * already in the sheet is updated, never duplicated.
 *
 * Setup: see README of the project ("Export nach Google Sheets").
 *   1. In the Google Sheet: Erweiterungen -> Apps Script, paste this file.
 *   2. Change TOKEN below to a secret word of your choice.
 *   3. Bereitstellen -> Neue Bereitstellung -> Web-App,
 *      Ausführen als: Ich, Zugriff: Jeder -> URL (…/exec) kopieren.
 *   4. URL and token into the Zepp app settings of Tennis Tracker.
 */

var TOKEN = "HIER-GEHEIMES-WORT-EINTRAGEN";
var SHEET_NAME = "Matches";

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (TOKEN && data.token !== TOKEN) return json_({ ok: false, error: "TOKEN" });
    if (!data.columns || !data.rows) return json_({ ok: false, error: "BAD_REQUEST" });
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var result = upsertRows_(getSheet_(), data.columns, data.rows);
      return json_({ ok: true, added: result.added, updated: result.updated });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Open the /exec URL in a browser to check the deployment.
function doGet() {
  return json_({ ok: true, info: "Tennis Tracker Export bereit" });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

/**
 * Writes rows (arrays in the order of `columns`) into the sheet.
 * Header row is created on first use; unknown columns are appended at the
 * end, so newer app versions with more columns keep working.
 */
function upsertRows_(sheet, columns, rows) {
  var lastCol = sheet.getLastColumn();
  var header = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  header = header.filter(function (h) {
    return h !== "";
  });
  if (!header.length) {
    header = columns.slice();
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
    sheet.setFrozenRows(1);
  }
  columns.forEach(function (c) {
    if (header.indexOf(c) < 0) {
      header.push(c);
      sheet.getRange(1, header.length).setValue(c);
    }
  });

  var idCol = header.indexOf("id");
  // Long ids would otherwise be shown as 1.79517E+12.
  if (sheet.getMaxRows() > 1) {
    sheet.getRange(2, idCol + 1, sheet.getMaxRows() - 1, 1).setNumberFormat("0");
  }

  var rowById = {};
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var ids = sheet.getRange(2, idCol + 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) rowById[String(ids[i][0])] = i + 2;
  }

  var appended = [];
  var appendedById = {};
  var updated = 0;
  rows.forEach(function (r) {
    var obj = {};
    columns.forEach(function (c, i) {
      obj[c] = r[i];
    });
    var values = header.map(function (h) {
      return obj.hasOwnProperty(h) ? obj[h] : "";
    });
    var key = String(obj.id);
    if (rowById[key]) {
      sheet.getRange(rowById[key], 1, 1, header.length).setValues([values]);
      updated++;
    } else if (appendedById.hasOwnProperty(key)) {
      appended[appendedById[key]] = values; // same match twice in one request
    } else {
      appendedById[key] = appended.length;
      appended.push(values);
    }
  });
  if (appended.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, appended.length, header.length).setValues(appended);
  }
  return { added: appended.length, updated: updated };
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
