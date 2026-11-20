// Run: node --test test/
import { test } from "node:test";
import assert from "node:assert/strict";
import { newMatch, summarize } from "../utils/tennis.js";
import {
  EXPORT_COLUMNS,
  headerLine,
  rowLine,
  exportEntries,
  isoLocal,
  rowValues,
  columnNames,
  batches,
  exportPayload,
} from "../utils/export.js";

function sample(date, opponent, aborted) {
  const m = newMatch("bo2", true, "me", date, opponent);
  for (let i = 0; i < 4; i++) m.points.push({ w: "me", c: i === 0 ? "ace" : null });
  m.points.push({ w: "opp", c: "ue" });
  m.aborted = !!aborted;
  return summarize(m);
}

test("header has stable column names", () => {
  const h = headerLine().split("\t");
  assert.equal(h.length, EXPORT_COLUMNS.length);
  assert.deepEqual(h.slice(0, 10), [
    "id",
    "datum",
    "gegner",
    "format",
    "einstand",
    "status",
    "ergebnis",
    "stand",
    "saetze_ich",
    "saetze_geg",
  ]);
  assert.ok(h.includes("asse_ich") && h.includes("unforced_geg") && h.includes("ohne_kategorie_ich"));
  assert.equal(new Set(h).size, h.length);
});

test("row matches header and contains the values", () => {
  const date = new Date(2026, 10, 20, 14, 5).getTime();
  const e = sample(date, "Huber", true);
  const cells = rowLine(e).split("\t");
  const h = headerLine().split("\t");
  assert.equal(cells.length, h.length);
  const row = Object.fromEntries(h.map((k, i) => [k, cells[i]]));
  assert.equal(row.id, String(date));
  assert.equal(row.datum, "2026-11-20 14:05");
  assert.equal(row.gegner, "Huber");
  assert.equal(row.format, "2 Saetze + MTB");
  assert.equal(row.einstand, "Ad");
  assert.equal(row.status, "abgebrochen");
  assert.equal(row.ergebnis, "");
  assert.equal(row.stand, "1:0");
  assert.equal(row.asse_ich, "1");
  assert.equal(row.unforced_ich, "1");
  assert.equal(row.punkte_ich, "4");
  assert.equal(row.punkte_geg, "1");
});

test("tabs and newlines in text never break the row", () => {
  const e = sample(1, "A\tB\nC", false);
  assert.equal(rowLine(e).split("\t").length, EXPORT_COLUMNS.length);
  assert.ok(!rowLine(e).includes("\n"));
});

test("export entries: oldest first, 'new' only after last export", () => {
  const idx = [{ date: 30 }, { date: 20 }, { date: 10 }];
  assert.deepEqual(exportEntries(idx, "all", 0).map((e) => e.date), [10, 20, 30]);
  assert.deepEqual(exportEntries(idx, "new", 20).map((e) => e.date), [30]);
  assert.deepEqual(exportEntries(idx, "new", 0).map((e) => e.date), [10, 20, 30]);
});

test("payload: columns + rows of values, numbers stay numbers", () => {
  const e = sample(new Date(2026, 10, 20, 9, 0).getTime(), "Huber", false);
  const p = exportPayload([e]);
  assert.deepEqual(p.columns, columnNames());
  assert.equal(p.rows.length, 1);
  assert.equal(p.rows[0].length, p.columns.length);
  const row = Object.fromEntries(p.columns.map((k, i) => [k, p.rows[0][i]]));
  assert.equal(typeof row.id, "number");
  assert.equal(row.punkte_ich, 4);
  assert.equal(row.datum, "2026-11-20 09:00");
  assert.equal(row.gegner, "Huber");
  assert.deepEqual(rowValues(e).map(String), rowLine(e).split("\t"));
});

test("batches split evenly", () => {
  assert.deepEqual(batches([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(batches([], 2), []);
});

test("isoLocal pads", () => {
  assert.equal(isoLocal(new Date(2026, 0, 2, 3, 4).getTime()), "2026-01-02 03:04");
});
