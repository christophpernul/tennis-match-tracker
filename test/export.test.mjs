// Run: node --test test/
import { test } from "node:test";
import assert from "node:assert/strict";
import { newMatch, summarize } from "../utils/tennis.js";
import {
  EXPORT_COLUMNS,
  headerLine,
  rowLine,
  exportEntries,
  paginate,
  buildExportPages,
  isoLocal,
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

test("paginate respects the byte limit and keeps every line", () => {
  const lines = ["a".repeat(100), "b".repeat(100), "c".repeat(100), "d".repeat(250)];
  const pages = paginate(lines, 210);
  assert.deepEqual(pages, ["a".repeat(100) + "\n" + "b".repeat(100), "c".repeat(100), "d".repeat(250)]);
});

test("export pages: header only when requested, all rows present", () => {
  const entries = [sample(1, "A"), sample(2, "B"), sample(3, "C"), sample(4, "D")];
  const withH = buildExportPages(entries, true, 600).join("\n").split("\n");
  assert.equal(withH[0], headerLine());
  assert.equal(withH.length, 5);
  const noH = buildExportPages(entries, false, 600).join("\n").split("\n");
  assert.equal(noH.length, 4);
  assert.deepEqual(buildExportPages([], true, 600), []);
  for (const p of buildExportPages(entries, true, 600)) assert.ok(Buffer.byteLength(p) <= 600 || !p.includes("\n"));
});

test("isoLocal pads", () => {
  assert.equal(isoLocal(new Date(2026, 0, 2, 3, 4).getTime()), "2026-01-02 03:04");
});
