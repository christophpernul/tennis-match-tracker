// Statistics. Scrollable table: label | ICH | GEGNER.
//
// param.from:
//   "match"   current match, opened from the match screen (replaces it);
//             swipe right or a key press goes back to the match screen.
//   "ended"   current match right after "Match beenden"; back leads home.
//   "history" opened from the match list; with param.id one archived
//             match, with param.filter the sum over the filtered matches.
import {
  FORMATS,
  summarize,
  aggregate,
  filterEntries,
  formatDate,
} from "../../../utils/tennis";
import { loadMatch, loadIndex } from "../../../utils/storage";
import { PAGES, COLORS, FILTER_LABELS, text, parseParam } from "../../../utils/ui";

const ROW_H = px(44);
const COL_LABEL = { x: px(52), w: px(200) };
const COL_ME = { x: px(252), w: px(75) };
const COL_OPP = { x: px(327), w: px(75) };

let cfg = {};

function pct(won, total) {
  return total ? Math.round((won * 100) / total) + "%" : "-";
}

function backToMatch() {
  hmApp.reloadPage({ url: PAGES.match, param: "" });
}

function singleView(e) {
  let title = "Laufendes Match";
  if (e.status === "aborted") title = "Abgebrochen";
  else if (e.winner === "me") title = "Sieg";
  else if (e.winner === "opp") title = "Niederlage";
  const fmt = FORMATS[e.format] ? FORMATS[e.format].label : "";
  return {
    title,
    line1: e.setLine,
    line2: formatDate(e.date) + "  " + (e.opponent || "Gegner"),
    line3: fmt + (e.ad ? "" : ", No-Ad"),
    oppHead: "GEG",
    me: e.me,
    opp: e.opp,
  };
}

function aggregateView(filter) {
  const list = filterEntries(loadIndex(), filter);
  const a = aggregate(list);
  return {
    title: "Summe: " + (FILTER_LABELS[filter] || "Alle"),
    line1: a.count + (a.count === 1 ? " Match" : " Matches"),
    line2: a.wins + " S / " + a.losses + " N / " + a.aborted + " abgebr.",
    line3: "",
    oppHead: "GEG",
    me: a.me,
    opp: a.opp,
  };
}

function loadView() {
  if (cfg.from === "history") {
    if (cfg.filter) return aggregateView(cfg.filter);
    const e = loadIndex().filter((x) => x.id === cfg.id)[0];
    return e ? singleView(e) : null;
  }
  const m = loadMatch();
  return m ? singleView(summarize(m)) : null;
}

Page({
  onInit(param) {
    cfg = parseParam(param);
    if (!cfg.from) cfg.from = "history";
    if (cfg.from === "match") {
      hmApp.registerGestureEvent((event) => {
        if (event === hmApp.gesture.RIGHT) {
          backToMatch();
          return true;
        }
        return false;
      });
      hmApp.registerKeyEvent((key, action) => {
        if (key !== hmApp.key.HOME && key !== hmApp.key.SHORTCUT) return false;
        if (action === hmApp.action.CLICK) backToMatch();
        return true;
      });
    }
  },

  build() {
    // The match screen disables scrolling; make sure it is on again here.
    try {
      hmUI.setLayerScrolling(true);
    } catch (e) {
      // ignore
    }
    const v = loadView();
    if (!v) {
      text({ x: px(77), y: px(190), w: px(300), h: px(60), text: "Keine Daten" });
      return;
    }

    text({ x: px(77), y: px(30), w: px(300), h: px(50), text: v.title, text_size: px(32) });
    text({ x: px(57), y: px(80), w: px(340), h: px(40), text: v.line1, text_size: px(28), color: COLORS.server });
    text({ x: px(47), y: px(120), w: px(360), h: px(34), text: v.line2, text_size: px(24) });
    if (v.line3) {
      text({ x: px(47), y: px(152), w: px(360), h: px(30), text: v.line3, text_size: px(22), color: COLORS.dim });
    }

    const me = v.me;
    const op = v.opp;
    const rows = [
      ["", "ICH", v.oppHead],
      ["Punkte", me.points, op.points],
      ["Aufschlag gew.", pct(me.serveWon, me.servePts), pct(op.serveWon, op.servePts)],
      ["Return gew.", pct(me.returnWon, me.returnPts), pct(op.returnWon, op.returnPts)],
      ["Asse", me.ace, op.ace],
      ["Doppelfehler", me.df, op.df],
      ["Service-Winner", me.sw, op.sw],
      ["Winner", me.winner, op.winner],
      ["Unforced Err.", me.ue, op.ue],
      ["Forced Err.", me.fe, op.fe],
      ["Ohne Kategorie", me.none, op.none],
    ];

    let y = px(188);
    rows.forEach((r, i) => {
      const color = i === 0 ? COLORS.dim : COLORS.white;
      text({ ...COL_LABEL, y, h: ROW_H, text: r[0], text_size: px(24), color, align_h: hmUI.align.LEFT });
      text({ ...COL_ME, y, h: ROW_H, text: String(r[1]), text_size: px(26), color: i ? 0x64b5f6 : color });
      text({ ...COL_OPP, y, h: ROW_H, text: String(r[2]), text_size: px(26), color: i ? 0xef9a9a : color });
      y += ROW_H;
    });

    if (cfg.from === "match") {
      text({
        x: px(77),
        y: y + px(16),
        w: px(300),
        h: px(60),
        text: "Taste/Wischen: zurück",
        text_size: px(22),
        color: COLORS.dim,
      });
      y += px(76);
    }
    // Spacer so the last rows can be scrolled into the wide screen middle.
    text({ x: px(77), y: y + px(100), w: px(300), h: px(20), text: "" });
  },

  onDestroy() {
    if (cfg.from === "match") {
      hmApp.unregisterKeyEvent();
      hmApp.unregisterGestureEvent();
    }
  },
});
