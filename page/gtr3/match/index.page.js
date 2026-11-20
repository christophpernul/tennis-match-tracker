// Match screen: score, point input, category overlay, undo.
//
// Input:
//   tap blue/red half or short press upper/lower key -> point me/opp
//   UNDO                                              -> remove last point
//   long press upper key                              -> statistics
//   long press lower key                              -> menu: continue /
//                                                        pause / end match
// After every point a category overlay opens; without a choice it closes
// after CAT_TIMEOUT_S and the point stays without category.
import {
  replay,
  currentServer,
  pointLabels,
  setLine,
  categoryOptions,
  opponentName,
  summarize,
} from "../../../utils/tennis";
import {
  saveMatch,
  loadMatch,
  archiveMatch,
  unarchiveMatch,
} from "../../../utils/storage";
import {
  PAGES,
  COLORS,
  text,
  tapArea,
  setVisible,
  createVibrator,
  toast,
} from "../../../utils/ui";

const logger = DeviceRuntimeCore.HmLogger.getLogger("tennis-match");

const BRIGHT_SECONDS = 1800;
const CAT_TIMEOUT_S = 6;

// Layout (454x454 round)
const L = {
  setLine: { x: px(87), y: px(18), w: px(280), h: px(38) },
  labelMe: { x: px(8), y: px(58), w: px(215), h: px(36) },
  labelOpp: { x: px(231), y: px(58), w: px(215), h: px(36) },
  areaMe: { x: px(8), y: px(96), w: px(215), h: px(236), radius: px(28), color: COLORS.me },
  areaOpp: { x: px(231), y: px(96), w: px(215), h: px(236), radius: px(28), color: COLORS.opp },
  undo: { x: px(117), y: px(342), w: px(220), h: px(84), radius: px(42), color: COLORS.undo },
  // overlay
  header: { x: px(77), y: px(30), w: px(300), h: px(52) },
  slotX: [px(52), px(230)],
  slotY: [px(86), px(170), px(254)],
  slotW: px(172),
  slotH: px(76),
  ovUndo: { x: px(96), y: px(338), w: px(126), h: px(70), radius: px(35), color: COLORS.undo },
  ovSkip: { x: px(232), y: px(338), w: px(126), h: px(70), radius: px(35), color: COLORS.skip },
  // menu
  menuHeader: { x: px(77), y: px(34), w: px(300), h: px(56) },
  menuSlotY: [px(104), px(200), px(296)],
  menuSlot: { x: px(77), w: px(300), h: px(84), radius: px(42) },
};

const MENU_RED = 0xef9a9a;

let match = null;
let s = null; // replayed state
let w = {}; // widgets
let vib = null;
let overlay = { open: false, cats: [], timer: null, left: 0 };
let menu = { open: false, mode: "main" };
let oppLabel = "GEGNER";

function keepAwake() {
  hmSetting.setBrightScreen(BRIGHT_SECONDS);
}

function persist() {
  if (!saveMatch(match)) toast("Speichern fehlgeschlagen");
}

function recompute() {
  s = replay(match);
  const done = !!s.winner || !!match.aborted;
  if (done !== match.finished) {
    match.finished = done;
    match.finishedAt = done ? Date.now() : null;
  }
}

// Keep the archive in line with the finished state: a finished match is
// stored in the match list, an undo of the winning point removes it again.
function syncArchive(wasFinished) {
  if (match.finished && match.points.length) archiveMatch(match, summarize(match));
  else if (wasFinished && !match.finished) unarchiveMatch(match.id);
}

function render() {
  w.setLine.setProperty(hmUI.prop.TEXT, (match.aborted ? "Abbruch " : "") + setLine(s));
  if (s.winner) {
    w.me.setProperty(hmUI.prop.TEXT, String(s.setsWon.me));
    w.opp.setProperty(hmUI.prop.TEXT, String(s.setsWon.opp));
    w.labelMe.setProperty(hmUI.prop.TEXT, s.winner === "me" ? "ICH - SIEG" : "ICH");
    w.labelOpp.setProperty(hmUI.prop.TEXT, s.winner === "opp" ? oppLabel + " - SIEG" : oppLabel);
    w.labelMe.setProperty(hmUI.prop.COLOR, COLORS.label);
    w.labelOpp.setProperty(hmUI.prop.COLOR, COLORS.label);
    return;
  }
  const p = pointLabels(s);
  w.me.setProperty(hmUI.prop.TEXT, p.me);
  w.opp.setProperty(hmUI.prop.TEXT, p.opp);
  const server = currentServer(s);
  w.labelMe.setProperty(hmUI.prop.TEXT, server === "me" ? "ICH (A)" : "ICH");
  w.labelOpp.setProperty(hmUI.prop.TEXT, server === "opp" ? oppLabel + " (A)" : oppLabel);
  w.labelMe.setProperty(hmUI.prop.COLOR, server === "me" ? COLORS.server : COLORS.label);
  w.labelOpp.setProperty(hmUI.prop.COLOR, server === "opp" ? COLORS.server : COLORS.label);
}

// ---------- category overlay ----------

function catLabel(cat, winner) {
  const errBy = winner === "me" ? "Gegner" : "Ich";
  switch (cat) {
    case "ace":
      return "Ass";
    case "sw":
      return "Service-W.";
    case "df":
      return "Doppelf.";
    case "winner":
      return "Winner";
    case "ue":
      return "UE " + errBy;
    case "fe":
      return "FE " + errBy;
  }
  return cat;
}

function overlayWidgets() {
  const list = [w.ovBackdrop, w.ovHeader, w.ovUndo.rect, w.ovUndo.text, w.ovSkip.rect, w.ovSkip.text];
  for (let i = 0; i < w.slots.length; i++) list.push(w.slots[i].rect, w.slots[i].text);
  return list;
}

function stopTimer() {
  if (overlay.timer !== null) {
    timer.stopTimer(overlay.timer);
    overlay.timer = null;
  }
}

function openOverlay(winner, server) {
  overlay.open = true;
  overlay.cats = categoryOptions(winner, server);
  overlay.left = CAT_TIMEOUT_S;

  w.ovHeader.setProperty(hmUI.prop.TEXT, "Punkt " + (winner === "me" ? "ICH" : oppLabel));
  w.ovHeader.setProperty(hmUI.prop.COLOR, winner === "me" ? 0x64b5f6 : 0xef9a9a);
  w.ovSkip.text.setProperty(hmUI.prop.TEXT, "OK " + overlay.left);
  setVisible([w.ovBackdrop, w.ovHeader, w.ovUndo.rect, w.ovUndo.text, w.ovSkip.rect, w.ovSkip.text], true);
  for (let i = 0; i < w.slots.length; i++) {
    const cat = overlay.cats[i];
    if (cat) w.slots[i].text.setProperty(hmUI.prop.TEXT, catLabel(cat, winner));
    setVisible([w.slots[i].rect, w.slots[i].text], !!cat);
  }

  stopTimer();
  overlay.timer = timer.createTimer(1000, 1000, () => {
    overlay.left -= 1;
    if (overlay.left <= 0) closeOverlay();
    else w.ovSkip.text.setProperty(hmUI.prop.TEXT, "OK " + overlay.left);
  }, {});
}

// Hide without the jump to the statistics.
function hideOverlay() {
  stopTimer();
  if (!overlay.open) return;
  overlay.open = false;
  setVisible(overlayWidgets(), false);
}

function closeOverlay() {
  if (!overlay.open) return;
  hideOverlay();
  if (match.finished) showStats();
}

function pickCategory(i) {
  if (!overlay.open) return;
  const cat = overlay.cats[i];
  if (!cat) return;
  match.points[match.points.length - 1].c = cat;
  persist();
  if (match.finished) syncArchive(true); // update stats of the archived match
  vib.buzz(24);
  closeOverlay();
}

// ---------- actions ----------

function addPoint(who) {
  if (menu.open) return;
  hideOverlay();
  if (match.finished) {
    vib.buzz(23);
    return;
  }
  const was = match.finished;
  match.points.push({ w: who, c: null });
  recompute();
  persist();
  syncArchive(was);
  render();
  vib.buzz(25);
  keepAwake();
  openOverlay(who, s.log[s.log.length - 1].server);
}

function undo() {
  if (menu.open) return;
  hideOverlay();
  if (!match.points.length || match.aborted) {
    vib.buzz(23);
    return;
  }
  const was = match.finished;
  match.points.pop();
  recompute();
  persist();
  syncArchive(was);
  render();
  vib.buzz(28);
  keepAwake();
}

function showStats() {
  hmApp.reloadPage({ url: PAGES.stats, param: JSON.stringify({ from: "match" }) });
}

// ---------- menu: continue / pause / end ----------

const MENU = {
  main: {
    header: "Match",
    slots: [
      { label: "Weiterspielen", act: () => closeMenu() },
      { label: "Pausieren", act: () => pauseMatch() },
      { label: "Match beenden", red: true, act: () => showMenu("confirm") },
    ],
  },
  // "Ja" sits at a different spot than "Match beenden", so a double tap
  // cannot end the match by accident.
  confirm: {
    header: "Wirklich beenden?",
    slots: [
      { label: "Ja, beenden", red: true, act: () => abortMatch() },
      null,
      { label: "Nein", act: () => closeMenu() },
    ],
  },
};

function menuWidgets() {
  const list = [w.menuBackdrop, w.menuHeader];
  for (let i = 0; i < w.menuSlots.length; i++) list.push(w.menuSlots[i].rect, w.menuSlots[i].text);
  return list;
}

function showMenu(mode) {
  hideOverlay();
  menu.open = true;
  menu.mode = mode;
  const def = MENU[mode];
  w.menuHeader.setProperty(hmUI.prop.TEXT, def.header);
  setVisible([w.menuBackdrop, w.menuHeader], true);
  for (let i = 0; i < w.menuSlots.length; i++) {
    const slot = def.slots[i];
    if (slot) {
      w.menuSlots[i].text.setProperty(hmUI.prop.TEXT, slot.label);
      w.menuSlots[i].text.setProperty(hmUI.prop.COLOR, slot.red ? MENU_RED : COLORS.white);
    }
    setVisible([w.menuSlots[i].rect, w.menuSlots[i].text], !!slot);
  }
}

function closeMenu() {
  menu.open = false;
  setVisible(menuWidgets(), false);
}

function menuTap(i) {
  if (!menu.open) return;
  const slot = MENU[menu.mode].slots[i];
  if (slot) slot.act();
}

// Leave the match; it stays in match.json and can be resumed from home.
function pauseMatch() {
  closeMenu();
  hmApp.goBack();
}

function abortMatch() {
  closeMenu();
  match.aborted = true;
  recompute();
  persist();
  if (!match.points.length) {
    toast("Match ohne Punkte verworfen");
    hmApp.goBack();
    return;
  }
  syncArchive(false);
  vib.buzz(28);
  // Replaces the match screen: back from the statistics leads home.
  hmApp.reloadPage({ url: PAGES.stats, param: JSON.stringify({ from: "ended" }) });
}

// ---------- keys ----------

function onKey(key, action) {
  const upper = key === hmApp.key.HOME; // verified: 36 = upper
  const lower = key === hmApp.key.SHORTCUT; // verified: 93 = lower
  if (!upper && !lower) return false;
  if (action === hmApp.action.LONG_PRESS) {
    hideOverlay();
    if (upper) {
      showStats();
    } else if (match.finished) {
      hmApp.goBack();
    } else if (menu.open) {
      closeMenu();
    } else {
      showMenu("main");
    }
    return true;
  }
  if (action === hmApp.action.CLICK && !menu.open) addPoint(upper ? "me" : "opp");
  return true;
}

function onGesture(event) {
  // Block swipe-right (default goBack) to avoid accidental exits.
  return event === hmApp.gesture.RIGHT;
}

// ---------- page ----------

Page({
  onInit() {
    match = loadMatch();
    if (!match) {
      toast("Kein Match gefunden");
      hmApp.goBack();
      return;
    }
    recompute();
    oppLabel = match.opponent ? opponentName(match).slice(0, 12) : "GEGNER";
    hmApp.setScreenKeep(true);
    keepAwake();
    vib = createVibrator();
    hmApp.registerKeyEvent(onKey);
    hmApp.registerGestureEvent(onGesture);
  },

  build() {
    if (!match) return;
    try {
      hmUI.setLayerScrolling(false);
    } catch (e) {
      // ignore
    }

    w.setLine = text({ ...L.setLine, text_size: px(26) });
    w.labelMe = text({ ...L.labelMe, color: COLORS.label });
    w.labelOpp = text({ ...L.labelOpp, color: COLORS.label });
    w.me = tapArea(L.areaMe, { text_size: px(110) }, () => addPoint("me")).text;
    w.opp = tapArea(L.areaOpp, { text_size: px(110) }, () => addPoint("opp")).text;
    tapArea(L.undo, { text: "UNDO", text_size: px(34) }, undo);

    // Overlay, created last so it lies on top; hidden until a point is scored.
    w.ovBackdrop = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 0,
      w: px(454),
      h: px(454),
      color: COLORS.black,
    });
    w.ovBackdrop.addEventListener(hmUI.event.CLICK_DOWN, () => {});
    w.ovHeader = text({ ...L.header, text_size: px(30) });
    w.slots = [];
    for (let i = 0; i < 6; i++) {
      const rect = {
        x: L.slotX[i % 2],
        y: L.slotY[Math.floor(i / 2)],
        w: L.slotW,
        h: L.slotH,
        radius: px(20),
        color: COLORS.slot,
      };
      w.slots.push(tapArea(rect, { text_size: px(26) }, () => pickCategory(i)));
    }
    w.ovUndo = tapArea(L.ovUndo, { text: "UNDO", text_size: px(28) }, undo);
    w.ovSkip = tapArea(L.ovSkip, { text: "OK", text_size: px(28) }, () => closeOverlay());
    setVisible(overlayWidgets(), false);

    // Menu, on top of everything; hidden until long press on the lower key.
    w.menuBackdrop = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 0,
      w: px(454),
      h: px(454),
      color: COLORS.black,
    });
    w.menuBackdrop.addEventListener(hmUI.event.CLICK_DOWN, () => {});
    w.menuHeader = text({ ...L.menuHeader, text_size: px(32) });
    w.menuSlots = [];
    for (let i = 0; i < 3; i++) {
      const rect = { ...L.menuSlot, y: L.menuSlotY[i], color: COLORS.slot };
      w.menuSlots.push(tapArea(rect, { text_size: px(32) }, () => menuTap(i)));
    }
    setVisible(menuWidgets(), false);

    render();
  },

  onDestroy() {
    stopTimer();
    hmApp.unregisterKeyEvent();
    hmApp.unregisterGestureEvent();
    hmSetting.setBrightScreenCancel();
    if (vib) vib.stop();
    w = {};
    overlay = { open: false, cats: [], timer: null, left: 0 };
    menu = { open: false, mode: "main" };
  },
});
