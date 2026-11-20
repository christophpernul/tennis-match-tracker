import { PAGES, COLORS, text, menuButton, toast } from "../../../utils/ui";
import { loadMatch, loadIndex } from "../../../utils/storage";

const logger = DeviceRuntimeCore.HmLogger.getLogger("tennis-home");

const BTN_X = px(77);
const BTN_W = px(300);
const BTN_H = px(84);

Page({
  build() {
    logger.debug("home build");
    text({ x: px(77), y: px(46), w: px(300), h: px(60), text: "Tennis", text_size: px(40) });

    // Buttons are always shown; the click handler checks storage, because
    // this page is not rebuilt when the user comes back to it.
    menuButton(BTN_X, px(120), BTN_W, BTN_H, "Fortsetzen", COLORS.me, () => {
      const m = loadMatch();
      if (!m || m.finished) {
        toast("Kein offenes Match");
        return;
      }
      hmApp.gotoPage({ url: PAGES.match, param: "" });
    });

    menuButton(BTN_X, px(216), BTN_W, BTN_H, "Neues Match", COLORS.skip, () => {
      hmApp.gotoPage({ url: PAGES.setup, param: JSON.stringify({ step: "opponent" }) });
    });

    menuButton(BTN_X, px(312), BTN_W, BTN_H, "Statistik", COLORS.undo, () => {
      if (!loadIndex().length) {
        toast("Noch keine Matches");
        return;
      }
      hmApp.gotoPage({ url: PAGES.history, param: JSON.stringify({ filter: "all" }) });
    });
  },
});
