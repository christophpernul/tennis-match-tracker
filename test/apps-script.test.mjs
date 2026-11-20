// Runs apps-script/Code.gs against an in-memory fake of the Sheets API.
// Run: node --test test/
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { newMatch, summarize } from "../utils/tennis.js";
import { exportPayload } from "../utils/export.js";

class FakeSheet {
  constructor() {
    this.cells = []; // rows of arrays, 0-based
    this.frozen = 0;
    this.maxRows = 1000;
  }
  getLastRow() {
    return this.cells.length;
  }
  getLastColumn() {
    return this.cells.reduce((m, r) => Math.max(m, r.length), 0);
  }
  getMaxRows() {
    return this.maxRows;
  }
  setFrozenRows(n) {
    this.frozen = n;
  }
  getRange(row, col, nRows = 1, nCols = 1) {
    const sheet = this;
    return {
      getValues() {
        const out = [];
        for (let r = 0; r < nRows; r++) {
          const line = sheet.cells[row - 1 + r] || [];
          const vals = [];
          for (let c = 0; c < nCols; c++) vals.push(line[col - 1 + c] ?? "");
          out.push(vals);
        }
        return out;
      },
      setValues(values) {
        assert.equal(values.length, nRows);
        values.forEach((vals, r) => {
          assert.equal(vals.length, nCols);
          const idx = row - 1 + r;
          while (sheet.cells.length <= idx) sheet.cells.push([]);
          vals.forEach((v, c) => (sheet.cells[idx][col - 1 + c] = v));
        });
      },
      setValue(v) {
        this.setValues([[v]]);
      },
      setNumberFormat() {},
    };
  }
}

function loadScript(sheet, token) {
  const src = fs.readFileSync(new URL("../apps-script/Code.gs", import.meta.url), "utf8");
  const ctx = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({ getSheetByName: () => sheet, insertSheet: () => sheet }),
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (s) => ({ setMimeType: () => ({ body: s }) }),
    },
  };
  vm.createContext(ctx);
  vm.runInContext(src.replace('var TOKEN = "HIER-GEHEIMES-WORT-EINTRAGEN";', `var TOKEN = ${JSON.stringify(token)};`), ctx);
  return (payload) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(payload) } }).body);
}

function entry(date, opponent, mePoints) {
  const m = newMatch("bo3", true, "me", date, opponent);
  for (let i = 0; i < mePoints; i++) m.points.push({ w: "me", c: null });
  m.aborted = true;
  return summarize(m);
}

test("creates header, appends rows, updates by id", () => {
  const sheet = new FakeSheet();
  const post = loadScript(sheet, "geheim");
  const p1 = exportPayload([entry(1000, "Huber", 4), entry(2000, "Maier", 2)]);

  let res = post({ token: "geheim", ...p1 });
  assert.deepEqual(res, { ok: true, added: 2, updated: 0 });
  assert.deepEqual(sheet.cells[0], p1.columns);
  assert.equal(sheet.cells.length, 3);
  assert.equal(sheet.frozen, 1);
  const col = (name) => p1.columns.indexOf(name);
  assert.equal(sheet.cells[1][col("gegner")], "Huber");

  // Same matches again (one changed) + a new one: no duplicates.
  const p2 = exportPayload([entry(1000, "Huber", 8), entry(3000, "Berger", 1)]);
  res = post({ token: "geheim", ...p2 });
  assert.deepEqual(res, { ok: true, added: 1, updated: 1 });
  assert.equal(sheet.cells.length, 4);
  assert.equal(sheet.cells[1][col("punkte_ich")], 8);
  assert.equal(sheet.cells[3][col("gegner")], "Berger");
});

test("wrong token is rejected and nothing is written", () => {
  const sheet = new FakeSheet();
  const post = loadScript(sheet, "geheim");
  const res = post({ token: "falsch", ...exportPayload([entry(1, "X", 1)]) });
  assert.deepEqual(res, { ok: false, error: "TOKEN" });
  assert.equal(sheet.cells.length, 0);
});

test("same match twice in one request gives one row", () => {
  const sheet = new FakeSheet();
  const post = loadScript(sheet, "t");
  const res = post({ token: "t", ...exportPayload([entry(5, "A", 1), entry(5, "A", 3)]) });
  assert.deepEqual(res, { ok: true, added: 1, updated: 0 });
  assert.equal(sheet.cells.length, 2);
});

test("new columns from a newer app version are appended to the header", () => {
  const sheet = new FakeSheet();
  const post = loadScript(sheet, "t");
  post({ token: "t", columns: ["id", "a"], rows: [[1, "x"]] });
  const res = post({ token: "t", columns: ["id", "a", "b"], rows: [[2, "y", "z"]] });
  assert.equal(res.ok, true);
  assert.deepEqual(sheet.cells[0], ["id", "a", "b"]);
  assert.deepEqual(sheet.cells[2], [2, "y", "z"]);
});
