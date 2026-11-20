// Export of archived matches to a Google Sheet:
// watch --Bluetooth--> side service in the Zepp app --HTTPS--> Apps Script.
// Column contract: utils/export.js. Script: apps-script/Code.gs.
//
// "Neue senden": matches started after the last successful export.
// "Alle senden": all matches; the script updates rows it already has
// (by id), so sending everything again never creates duplicates.
import { exportEntries, exportPayload, batches } from "../../../utils/export";
import { loadIndex, loadExportState, saveExportState } from "../../../utils/storage";
import { COLORS, text, menuButton, toast } from "../../../utils/ui";

const BATCH_SIZE = 10; // matches per Bluetooth request
const REQUEST_TIMEOUT_MS = 30000;

let busy = false;
let status = null;

function setStatus(msg, color) {
  if (!status) return; // page already left while a request was running
  status.setProperty(hmUI.prop.TEXT, msg);
  status.setProperty(hmUI.prop.COLOR, color || COLORS.white);
}

function errorText(err) {
  const e = String(err || "");
  if (e === "NO_URL") return "Keine Script-URL in der Zepp App eingestellt";
  if (e === "TOKEN") return "Token falsch (Zepp App / Script)";
  if (e.indexOf("Timed out") >= 0) return "Keine Antwort vom Handy. Zepp App offen?";
  if (e.indexOf("NETWORK") === 0) return "Handy ohne Internet?";
  return "Fehler: " + e.slice(0, 60);
}

function messageBuilder() {
  try {
    return getApp()._options.globalData.messageBuilder;
  } catch (e) {
    return null;
  }
}

function send(mode) {
  if (busy) return;
  const mb = messageBuilder();
  if (!mb) {
    setStatus("Keine Verbindung zum Handy", COLORS.opp);
    return;
  }
  const st = loadExportState();
  const entries = exportEntries(loadIndex(), mode, st.lastDate);
  if (!entries.length) {
    toast(mode === "new" ? "Keine neuen Matches" : "Keine Matches");
    return;
  }
  busy = true;
  hmSetting.setBrightScreen(120);
  const parts = batches(entries, BATCH_SIZE);
  let added = 0;
  let updated = 0;

  const next = (i) => {
    if (i >= parts.length) {
      busy = false;
      setStatus(
        "Fertig: " + added + " neu, " + updated + " aktualisiert",
        COLORS.skip
      );
      return;
    }
    setStatus("Sende " + (i + 1) + "/" + parts.length + " ...", COLORS.white);
    mb.request({ method: "EXPORT", params: exportPayload(parts[i]) }, { timeout: REQUEST_TIMEOUT_MS })
      .then((res) => {
        if (!res || !res.ok) throw new Error((res && res.error) || "unbekannt");
        added += res.added || 0;
        updated += res.updated || 0;
        // Remember progress after every batch (entries are oldest first).
        const newest = parts[i][parts[i].length - 1].date;
        if (newest > loadExportState().lastDate) saveExportState({ lastDate: newest });
        next(i + 1);
      })
      .catch((err) => {
        busy = false;
        setStatus(errorText(err && err.message ? err.message : err), COLORS.opp);
      });
  };
  next(0);
}

Page({
  onInit() {
    busy = false;
  },

  build() {
    try {
      hmUI.setLayerScrolling(false);
    } catch (e) {
      // ignore
    }
    const index = loadIndex();
    const nNew = exportEntries(index, "new", loadExportState().lastDate).length;

    text({ x: px(77), y: px(34), w: px(300), h: px(52), text: "Export", text_size: px(34) });
    text({
      x: px(67),
      y: px(84),
      w: px(320),
      h: px(36),
      text: "an Google Sheet",
      text_size: px(24),
      color: COLORS.dim,
    });
    menuButton(px(87), px(130), px(280), px(80), "Neue senden (" + nNew + ")", COLORS.skip, () => send("new"));
    menuButton(px(87), px(222), px(280), px(80), "Alle senden (" + index.length + ")", COLORS.slot, () =>
      send("all")
    );
    status = text({
      x: px(77),
      y: px(314),
      w: px(300),
      h: px(90),
      text: "Zepp App auf dem Handy muss laufen",
      text_size: px(22),
      color: COLORS.dim,
      text_style: hmUI.text_style.WRAP,
    });
  },

  onDestroy() {
    hmSetting.setBrightScreenCancel();
    status = null;
  },
});
