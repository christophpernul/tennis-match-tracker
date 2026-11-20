// Export format of archived matches.
//
// The column names are a stable contract with the Google Apps Script
// (apps-script/Code.gs): the watch sends { columns, rows } via the side
// service, the script writes one sheet row per match, keyed by `id` so a
// match is never written twice. Only append new columns at the end; never
// rename or reorder existing ones. headerLine()/rowLine() give the same
// data as tab-separated text (pastes into Google Sheets as columns).
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

export function columnNames() {
  return EXPORT_COLUMNS.map((c) => c[0]);
}

// Values of one match in column order (numbers stay numbers).
export function rowValues(entry) {
  return EXPORT_COLUMNS.map((c) => {
    const v = c[1](entry);
    return typeof v === "number" ? v : clean(v);
  });
}

// Split into batches for the Bluetooth transfer (one request each).
export function batches(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

// Request payload for the side service -> Apps Script.
export function exportPayload(entries) {
  return { version: EXPORT_VERSION, columns: columnNames(), rows: entries.map(rowValues) };
}
