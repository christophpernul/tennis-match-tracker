// Statistics for the saved match. Scrollable list: label | ICH | GEGNER.
// Opened from the match screen it replaces it (reloadPage); swipe right or
// a key press brings the match screen back. Opened from home it behaves
// like a normal sub page.
import { computeStats, setLine, FORMATS } from "../../../utils/tennis";
import { loadMatch } from "../../../utils/storage";
import { PAGES, COLORS, text, parseParam } from "../../../utils/ui";

const ROW_H = px(44);
const COL_LABEL = { x: px(52), w: px(200) };
const COL_ME = { x: px(252), w: px(75) };
const COL_OPP = { x: px(327), w: px(75) };

let from = "home";

function pct(won, total) {
  return total ? Math.round((won * 100) / total) + "%" : "-";
}

function backToMatch() {
  hmApp.reloadPage({ url: PAGES.match, param: "" });
}

Page({
  onInit(param) {
    from = parseParam(param).from || "home";
    if (from === "match") {
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
    const m = loadMatch();
    if (!m) {
      text({ x: px(77), y: px(190), w: px(300), h: px(60), text: "Keine Daten" });
      return;
    }
    const st = computeStats(m);
    const s = st.state;

    let title = "Statistik";
    if (s.winner) title = s.winner === "me" ? "Sieg" : "Niederlage";
    text({ x: px(77), y: px(36), w: px(300), h: px(50), text: title, text_size: px(34) });
    text({
      x: px(57),
      y: px(86),
      w: px(340),
      h: px(40),
      text: setLine(s),
      text_size: px(28),
      color: COLORS.server,
    });
    text({
      x: px(77),
      y: px(126),
      w: px(300),
      h: px(32),
      text: (FORMATS[m.format] ? FORMATS[m.format].label : "") + (m.ad ? "" : ", No-Ad"),
      text_size: px(22),
      color: COLORS.dim,
    });

    const rows = [
      ["", "ICH", "GEG"],
      ["Punkte", st.me.points, st.opp.points],
      ["Aufschlag gew.", pct(st.me.serveWon, st.me.servePts), pct(st.opp.serveWon, st.opp.servePts)],
      ["Return gew.", pct(st.me.returnWon, st.me.returnPts), pct(st.opp.returnWon, st.opp.returnPts)],
      ["Asse", st.me.ace, st.opp.ace],
      ["Doppelfehler", st.me.df, st.opp.df],
      ["Service-Winner", st.me.sw, st.opp.sw],
      ["Winner", st.me.winner, st.opp.winner],
      ["Unforced Err.", st.me.ue, st.opp.ue],
      ["Forced Err.", st.me.fe, st.opp.fe],
      ["Ohne Kategorie", st.me.none, st.opp.none],
    ];

    let y = px(170);
    rows.forEach((r, i) => {
      const color = i === 0 ? COLORS.dim : COLORS.white;
      text({
        ...COL_LABEL,
        y,
        h: ROW_H,
        text: r[0],
        text_size: px(24),
        color,
        align_h: hmUI.align.LEFT,
      });
      text({ ...COL_ME, y, h: ROW_H, text: String(r[1]), text_size: px(26), color: i ? 0x64b5f6 : color });
      text({ ...COL_OPP, y, h: ROW_H, text: String(r[2]), text_size: px(26), color: i ? 0xef9a9a : color });
      y += ROW_H;
    });

    if (from === "match") {
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
    if (from === "match") {
      hmApp.unregisterKeyEvent();
      hmApp.unregisterGestureEvent();
    }
  },
});
