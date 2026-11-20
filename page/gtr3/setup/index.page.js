// Match setup wizard:
//   Gegner (recent names / new name / none) -> [Name picker] -> Format
//   -> Einstand (Ad/No-Ad) -> Aufschlag
// Each step reloads this page with the choices so far in `param`,
// so the page stack stays home -> setup -> match.
import {
  FORMATS,
  FORMAT_ORDER,
  newMatch,
  summarize,
  recentOpponents,
  appendLetter,
} from "../../../utils/tennis";
import { saveMatch, loadMatch, loadIndex, archiveMatch } from "../../../utils/storage";
import {
  PAGES,
  COLORS,
  text,
  tapArea,
  menuButton,
  parseParam,
  toast,
} from "../../../utils/ui";

const BTN_X = px(87);
const BTN_W = px(280);
const BTN_H = px(76);
const BTN_GAP = px(10);
const FIRST_Y = px(104);

const NAME_MAX = 16;
const KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").concat([" ", "<"]);

let cfg = {};

function goStep(next) {
  hmApp.reloadPage({ url: PAGES.setup, param: JSON.stringify(next) });
}

// An unfinished match with points is archived as "aborted" instead of
// being overwritten.
function archiveOpenMatch() {
  const old = loadMatch();
  if (!old || old.finished || !old.points.length) return;
  old.aborted = true;
  old.finished = true;
  old.finishedAt = Date.now();
  archiveMatch(old, summarize(old));
}

function startMatch(firstServer) {
  archiveOpenMatch();
  const m = newMatch(cfg.format, cfg.ad, firstServer, Date.now(), cfg.opponent || "");
  if (!saveMatch(m)) toast("Speichern fehlgeschlagen");
  hmApp.reloadPage({ url: PAGES.match, param: "" });
}

function stepDef() {
  if (cfg.step === "opponent") {
    const recent = recentOpponents(loadIndex(), 6);
    const options = [{ label: "Neuer Name", pick: () => goStep({ ...cfg, step: "name" }) }];
    recent.forEach((n) =>
      options.push({ label: n, pick: () => goStep({ ...cfg, step: "format", opponent: n }) })
    );
    options.push({ label: "Ohne Name", pick: () => goStep({ ...cfg, step: "format", opponent: "" }) });
    return { title: "Gegner", options };
  }
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
        { label: cfg.opponent || "Gegner", pick: () => startMatch("opp") },
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
            ? { ...cfg, step: "server", format: key, ad: true }
            : { ...cfg, step: "ad", format: key }
        ),
    })),
  };
}

function buildList() {
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
}

// Letter grid 7x4: A-Z, space ("_"), delete ("<").
function buildNamePicker() {
  try {
    hmUI.setLayerScrolling(false);
  } catch (e) {
    // ignore
  }
  let name = "";
  const nameText = text({
    x: px(67),
    y: px(36),
    w: px(320),
    h: px(56),
    text: "Name...",
    text_size: px(32),
    color: COLORS.dim,
  });
  const show = () => {
    nameText.setProperty(hmUI.prop.TEXT, name.length ? name : "Name...");
    nameText.setProperty(hmUI.prop.COLOR, name.length ? COLORS.server : COLORS.dim);
  };

  const cols = 7;
  const cw = px(50);
  const ch = px(58);
  const gx = px(3);
  const gy = px(4);
  const x0 = Math.floor((px(454) - (cols * cw + (cols - 1) * gx)) / 2);
  const y0 = px(98);
  KEYS.forEach((k, i) => {
    const rect = {
      x: x0 + (i % cols) * (cw + gx),
      y: y0 + Math.floor(i / cols) * (ch + gy),
      w: cw,
      h: ch,
      radius: px(10),
      color: k === "<" ? COLORS.opp : k === " " ? COLORS.undo : COLORS.slot,
    };
    const label = k === " " ? "_" : k;
    tapArea(rect, { text: label, text_size: px(30) }, () => {
      if (k === "<") name = name.slice(0, -1);
      else name = appendLetter(name, k, NAME_MAX);
      show();
    });
  });

  tapArea(
    { x: px(127), y: px(352), w: px(200), h: px(68), radius: px(34), color: COLORS.skip },
    { text: "Fertig", text_size: px(30) },
    () => goStep({ ...cfg, step: "format", opponent: name.trim() })
  );
}

Page({
  onInit(param) {
    cfg = parseParam(param);
    if (!cfg.step) cfg.step = "opponent";
  },

  build() {
    if (cfg.step === "name") buildNamePicker();
    else buildList();
  },
});
