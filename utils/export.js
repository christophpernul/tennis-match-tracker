// Export of archived matches as tab-separated text (TSV).
//
// TSV because Google Sheets splits pasted text into columns on tabs.
// The column names are a stable contract: a future Google Apps Script
// (side service -> HTTP) will send/append exactly these columns, keyed by
// `id` so a match is never written twice. Only append new columns at the
// end; never rename or reorder existing ones.
//
// Pure JS, no hm* APIs (tested in Node).

import { FORMATS } from "./tennis.js";

export const EXPORT_VERSION = 1;

const FORMAT_EXPORT = {
  bo1: "1 Satz",
  bo2: "2 Saetze + MTB",
  bo3: "Best of 3",
  mtb: "Match-TB",
};

// [suffix of column name, key in summary.me / summary.opp]
const STAT_COLUMNS = [
  ["punkte", "points"],
  ["aufschlag_pkt", "servePts"],
  ["aufschlag_gew", "serveWon"],
  ["return_pkt", "returnPts"],
  ["return_gew", "returnWon"],
  ["asse", "ace"],
  ["doppelfehler", "df"],
  ["servicewinner", "sw"],
  ["winner", "winner"],
  ["unforced", "ue"],
  ["forced", "fe"],
  ["ohne_kategorie", "none"],
];

function pad2(n) {
  return n < 10 ? "0" + n : String(n);
}

// Local time "2026-11-20 14:30" - Google Sheets parses this as date/time.
export function isoLocal(ms) {
  const d = new Date(ms);
  return (
    d.getFullYear() +
    "-" +
    pad2(d.getMonth() + 1) +
    "-" +
    pad2(d.getDate()) +
    " " +
    pad2(d.getHours()) +
    ":" +
    pad2(d.getMinutes())
  );
}

function clean(v) {
  return String(v === undefined || v === null ? "" : v).replace(/[\t\r\n]+/g, " ");
}

function stat(side, key) {
  return (side && side[key]) || 0;
}

export const EXPORT_COLUMNS = (() => {
  const cols = [
    ["id", (e) => e.id],
    ["datum", (e) => isoLocal(e.date)],
    ["gegner", (e) => e.opponent || ""],
    ["format", (e) => FORMAT_EXPORT[e.format] || (FORMATS[e.format] ? FORMATS[e.format].label : e.format)],
    ["einstand", (e) => (e.ad ? "Ad" : "No-Ad")],
    ["status", (e) => (e.status === "aborted" ? "abgebrochen" : "vollstaendig")],
    ["ergebnis", (e) => (e.status === "aborted" ? "" : e.winner === "me" ? "Sieg" : e.winner === "opp" ? "Niederlage" : "")],
    ["stand", (e) => String(e.setLine || "").replace(/\s+/g, " ").trim()],
    ["saetze_ich", (e) => (e.setsWon ? e.setsWon.me : 0)],
    ["saetze_geg", (e) => (e.setsWon ? e.setsWon.opp : 0)],
  ];
  STAT_COLUMNS.forEach(([name, key]) => {
    cols.push([name + "_ich", (e) => stat(e.me, key)]);
    cols.push([name + "_geg", (e) => stat(e.opp, key)]);
  });
  return cols;
})();

export function headerLine() {
  return EXPORT_COLUMNS.map((c) => c[0]).join("\t");
}

export function rowLine(entry) {
  return EXPORT_COLUMNS.map((c) => clean(c[1](entry))).join("\t");
}

// Matches to export, oldest first (so pasted rows are chronological).
// mode "new": only matches started after `lastDate`.
export function exportEntries(index, mode, lastDate) {
  const list = index.filter((e) => mode !== "new" || e.date > (lastDate || 0));
  return list.sort((a, b) => a.date - b.date);
}

function byteLen(str) {
  let n = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    n += c < 0x80 ? 1 : c < 0x800 ? 2 : 3;
  }
  return n;
}

// Split lines into QR pages of at most maxBytes (a single longer line
// gets its own page). Lines within a page are joined with "\n".
export function paginate(lines, maxBytes) {
  const pages = [];
  let cur = [];
  let size = 0;
  lines.forEach((line) => {
    const add = byteLen(line) + (cur.length ? 1 : 0);
    if (cur.length && size + add > maxBytes) {
      pages.push(cur.join("\n"));
      cur = [];
      size = 0;
    }
    size += byteLen(line) + (cur.length ? 1 : 0);
    cur.push(line);
  });
  if (cur.length) pages.push(cur.join("\n"));
  return pages;
}

// Whole export as QR page texts. The header row is included when
// `withHeader` (full export, or first export ever).
export function buildExportPages(entries, withHeader, maxBytes) {
  const lines = entries.map(rowLine);
  if (withHeader && lines.length) lines.unshift(headerLine());
  return paginate(lines, maxBytes);
}
