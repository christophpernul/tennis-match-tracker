// Match list with filter (Alle / Vollständig / Abgebrochen).
// Tap "Summe" for the summed statistics of the filtered matches, or a
// match for its own statistics. Newest match first.
import { filterEntries, formatDate, listScore } from "../../../utils/tennis";
import { loadIndex } from "../../../utils/storage";
import { PAGES, COLORS, FILTER_LABELS, FILTER_ORDER, text, parseParam } from "../../../utils/ui";

const BTN_X = px(77);
const BTN_W = px(300);
// Match entries are wider: they scroll through the wide middle of the screen.
const ENTRY_X = px(57);
const ENTRY_W = px(340);

let filter = "all";

function button(y, h, label, color, size, onClick, x, w) {
  return hmUI.createWidget(hmUI.widget.BUTTON, {
    x: x || BTN_X,
    y,
    w: w || BTN_W,
    h,
    radius: Math.floor(h / 2),
    normal_color: color,
    press_color: COLORS.undo,
    text: label,
    text_size: size,
    color: COLORS.white,
    click_func: onClick,
  });
}

// "20.11. Huber 2:1" (complete: sets) or "20.11. Huber 6:4 3:2" (aborted:
// actual standing). Aborted entries are grey.
function entryLabel(e) {
  const day = formatDate(e.date).slice(0, 6); // "20.11."
  const name = (e.opponent || "Gegner").slice(0, 10);
  return day + " " + name + " " + listScore(e);
}

function entryColor(e) {
  if (e.status === "aborted") return COLORS.undo;
  return e.winner === "me" ? COLORS.skip : COLORS.opp;
}

Page({
  onInit(param) {
    const f = parseParam(param).filter;
    filter = FILTER_LABELS[f] ? f : "all";
  },

  build() {
    try {
      hmUI.setLayerScrolling(true);
    } catch (e) {
      // ignore
    }
    const list = filterEntries(loadIndex(), filter);

    text({ x: px(77), y: px(26), w: px(300), h: px(52), text: "Matches", text_size: px(32) });

    // Cycles through the filters by reloading this page.
    button(px(84), px(70), "Filter: " + FILTER_LABELS[filter], COLORS.slot, px(28), () => {
      const next = FILTER_ORDER[(FILTER_ORDER.indexOf(filter) + 1) % FILTER_ORDER.length];
      hmApp.reloadPage({ url: PAGES.history, param: JSON.stringify({ filter: next }) });
    });

    // Export always covers all matches (the status column tells them apart).
    button(px(164), px(70), "Export (QR)", COLORS.skip, px(28), () => {
      hmApp.gotoPage({ url: PAGES.export, param: "" });
    });

    if (!list.length) {
      text({ x: px(77), y: px(256), w: px(300), h: px(60), text: "Keine Matches", color: COLORS.dim });
      return;
    }

    button(px(244), px(70), "Summe (" + list.length + ")", COLORS.me, px(28), () => {
      hmApp.gotoPage({ url: PAGES.stats, param: JSON.stringify({ from: "history", filter }) });
    });

    let y = px(330);
    list.forEach((e) => {
      button(
        y,
        px(72),
        entryLabel(e),
        entryColor(e),
        px(24),
        () => {
          hmApp.gotoPage({ url: PAGES.stats, param: JSON.stringify({ from: "history", id: e.id }) });
        },
        ENTRY_X,
        ENTRY_W
      );
      y += px(82);
    });

    // Spacer so the last entry can be scrolled into the wide screen middle.
    text({ x: px(77), y: y + px(100), w: px(300), h: px(20), text: "" });
  },
});
