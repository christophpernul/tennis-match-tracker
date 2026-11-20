// Match setup wizard: format -> Einstand (Ad/No-Ad) -> Aufschlag.
// Each step reloads this page with the choices so far in `param`,
// so the page stack stays home -> setup -> match.
import { FORMATS, FORMAT_ORDER, newMatch } from "../../../utils/tennis";
import { saveMatch } from "../../../utils/storage";
import { PAGES, COLORS, text, menuButton, parseParam, toast } from "../../../utils/ui";

const BTN_X = px(87);
const BTN_W = px(280);
const BTN_H = px(76);
const BTN_GAP = px(10);
const FIRST_Y = px(104);

let cfg = {};

function goStep(next) {
  hmApp.reloadPage({ url: PAGES.setup, param: JSON.stringify(next) });
}

function startMatch(firstServer) {
  const m = newMatch(cfg.format, cfg.ad, firstServer, Date.now());
  if (!saveMatch(m)) toast("Speichern fehlgeschlagen");
  hmApp.reloadPage({ url: PAGES.match, param: "" });
}

function stepDef() {
  if (cfg.step === "ad") {
    return {
      title: "Einstand",
      options: [
        { label: "Mit Vorteil", pick: () => goStep({ ...cfg, step: "server", ad: true }) },
        { label: "No-Ad", pick: () => goStep({ ...cfg, step: "server", ad: false }) },
      ],
    };
  }
  if (cfg.step === "server") {
    return {
      title: "Wer schlägt auf?",
      options: [
        { label: "Ich", pick: () => startMatch("me") },
        { label: "Gegner", pick: () => startMatch("opp") },
      ],
    };
  }
  return {
    title: "Format",
    options: FORMAT_ORDER.map((key) => ({
      label: FORMATS[key].label,
      pick: () =>
        // Ad/No-Ad is irrelevant for a pure match tiebreak.
        goStep(
          FORMATS[key].mtbOnly
            ? { step: "server", format: key, ad: true }
            : { step: "ad", format: key }
        ),
    })),
  };
}

Page({
  onInit(param) {
    cfg = parseParam(param);
    if (!cfg.step) cfg.step = "format";
  },

  build() {
    // The match screen disables scrolling; make sure it is on again here.
    try {
      hmUI.setLayerScrolling(true);
    } catch (e) {
      // ignore
    }
    const def = stepDef();
    text({ x: px(77), y: px(40), w: px(300), h: px(56), text: def.title, text_size: px(32) });

    def.options.forEach((opt, i) => {
      const y = FIRST_Y + i * (BTN_H + BTN_GAP);
      menuButton(BTN_X, y, BTN_W, BTN_H, opt.label, i % 2 ? COLORS.undo : COLORS.slot, opt.pick);
    });

    // Spacer below the list so the last entry can be scrolled up into the
    // wide middle part of the round screen.
    const last = FIRST_Y + def.options.length * (BTN_H + BTN_GAP);
    text({ x: px(77), y: last + px(100), w: px(300), h: px(20), text: "" });
  },
});
