// Export of archived matches as QR codes with tab-separated text
// (see utils/export.js for the column contract). Scan with the phone
// camera, copy the text, paste into Google Sheets: tabs become columns.
//
// param: {}                      -> choose "Neue" / "Alle"
//        { mode, page }          -> QR page `page` of the export
// One QR per page; paging reloads this page (QR content cannot be
// changed after creation on Zepp OS 1.0).
//   lower key short / "Weiter" -> next page, upper key short -> previous
//   "Fertig" on the last page  -> remember export, back to the match list
import { exportEntries, buildExportPages } from "../../../utils/export";
import { loadIndex, loadExportState, saveExportState } from "../../../utils/storage";
import { PAGES, COLORS, text, tapArea, menuButton, parseParam, toast } from "../../../utils/ui";

// Bytes per QR code. ~650 bytes = QR version 17 (85x85 modules), about
// 3.3 px per module at 280 px. Lower it if the phone cannot scan the code.
const MAX_QR_BYTES = 650;

let cfg = {};
let pages = [];
let entries = [];

function go(next) {
  hmApp.reloadPage({ url: PAGES.export, param: JSON.stringify(next) });
}

function finish() {
  if (entries.length) {
    const newest = entries[entries.length - 1].date;
    const st = loadExportState();
    if (newest > st.lastDate) saveExportState({ lastDate: newest });
    toast(entries.length + (entries.length === 1 ? " Match exportiert" : " Matches exportiert"));
  }
  hmApp.goBack();
}

function buildChooser() {
  const index = loadIndex();
  const st = loadExportState();
  const nNew = exportEntries(index, "new", st.lastDate).length;
  text({ x: px(77), y: px(40), w: px(300), h: px(56), text: "Export", text_size: px(34) });
  text({
    x: px(67),
    y: px(96),
    w: px(320),
    h: px(40),
    text: "als QR-Code für Google Sheets",
    text_size: px(22),
    color: COLORS.dim,
  });
  menuButton(px(87), px(150), px(280), px(84), "Neue (" + nNew + ")", COLORS.skip, () => {
    if (!nNew) {
      toast("Keine neuen Matches");
      return;
    }
    go({ mode: "new", page: 0 });
  });
  menuButton(px(87), px(246), px(280), px(84), "Alle (" + index.length + ")", COLORS.slot, () => {
    if (!index.length) {
      toast("Keine Matches");
      return;
    }
    go({ mode: "all", page: 0 });
  });
  text({
    x: px(97),
    y: px(344),
    w: px(260),
    h: px(60),
    text: "Neue = seit dem letzten Export",
    text_size: px(20),
    color: COLORS.dim,
  });
}

function buildQrPage() {
  const st = loadExportState();
  entries = exportEntries(loadIndex(), cfg.mode, st.lastDate);
  // Header row for a full export and for the very first export.
  pages = buildExportPages(entries, cfg.mode === "all" || !st.lastDate, MAX_QR_BYTES);
  if (!pages.length) {
    text({ x: px(77), y: px(190), w: px(300), h: px(60), text: "Nichts zu exportieren" });
    return;
  }
  const page = Math.max(0, Math.min(cfg.page || 0, pages.length - 1));
  cfg.page = page;

  text({
    x: px(97),
    y: px(14),
    w: px(260),
    h: px(40),
    text: "Seite " + (page + 1) + "/" + pages.length,
    text_size: px(24),
    color: COLORS.dim,
  });

  hmUI.createWidget(hmUI.widget.QRCODE, {
    content: pages[page],
    x: px(87),
    y: px(62),
    w: px(280),
    h: px(280),
    bg_x: px(77),
    bg_y: px(52),
    bg_w: px(300),
    bg_h: px(300),
  });

  const last = page === pages.length - 1;
  tapArea(
    { x: px(137), y: px(362), w: px(180), h: px(64), radius: px(32), color: last ? COLORS.skip : COLORS.slot },
    { text: last ? "Fertig" : "Weiter", text_size: px(28) },
    () => (last ? finish() : go({ mode: cfg.mode, page: page + 1 }))
  );

  hmApp.registerKeyEvent((key, action) => {
    if (key !== hmApp.key.HOME && key !== hmApp.key.SHORTCUT) return false;
    if (action !== hmApp.action.CLICK) return false; // long press keeps default
    if (key === hmApp.key.SHORTCUT && !last) go({ mode: cfg.mode, page: page + 1 });
    if (key === hmApp.key.HOME && page > 0) go({ mode: cfg.mode, page: page - 1 });
    return true;
  });
  cfg.keys = true;
}

Page({
  onInit(param) {
    cfg = parseParam(param);
    // Keep the screen on while scanning.
    hmSetting.setBrightScreen(180);
  },

  build() {
    try {
      hmUI.setLayerScrolling(false);
    } catch (e) {
      // ignore
    }
    if (cfg.mode === "new" || cfg.mode === "all") buildQrPage();
    else buildChooser();
  },

  onDestroy() {
    if (cfg.keys) hmApp.unregisterKeyEvent();
    hmSetting.setBrightScreenCancel();
  },
});
