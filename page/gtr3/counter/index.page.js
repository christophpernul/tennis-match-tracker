import {
  DEBUG_STYLE,
  LABEL_ME_STYLE,
  LABEL_OPP_STYLE,
  AREA_ME,
  AREA_OPP,
  AREA_UNDO,
  UNDO_TEXT_STYLE,
  scoreTextStyle,
} from "./index.style";

const logger = DeviceRuntimeCore.HmLogger.getLogger("tennis-counter");

// Keep the screen on for up to 30 min; refreshed on every input.
const BRIGHT_SECONDS = 1800;

// Step 2: raw point counter only. No tennis scoring, no persistence yet.
const state = {
  me: 0,
  opp: 0,
  history: [], // "me" | "opp", newest last, used for undo
};

let widgets = {};
let vibrate = null;

function buzz(scene) {
  if (!vibrate) return;
  try {
    vibrate.stop();
    vibrate.scene = scene;
    vibrate.start();
  } catch (e) {
    logger.debug("vibrate failed " + e);
  }
}

function keepAwake() {
  hmSetting.setBrightScreen(BRIGHT_SECONDS);
}

function render() {
  widgets.me.setProperty(hmUI.prop.TEXT, String(state.me));
  widgets.opp.setProperty(hmUI.prop.TEXT, String(state.opp));
}

function addPoint(who) {
  state[who] += 1;
  state.history.push(who);
  render();
  buzz(25); // short, strong
  keepAwake();
}

function undo() {
  const last = state.history.pop();
  if (!last) {
    buzz(23); // light tick: nothing to undo
    return;
  }
  state[last] -= 1;
  render();
  buzz(28); // longer buzz so undo feels different from a point
  keepAwake();
}

function showDebug(text) {
  if (widgets.debug) widgets.debug.setProperty(hmUI.prop.TEXT, text);
}

// A rect plus the text drawn on top of it. Both get the listener because
// the topmost widget under the finger receives the touch.
function tapArea(rectStyle, textStyle, onTap) {
  const rect = hmUI.createWidget(hmUI.widget.FILL_RECT, rectStyle);
  const text = hmUI.createWidget(hmUI.widget.TEXT, textStyle);
  // CLICK_DOWN: the point counts the moment the finger touches.
  rect.addEventListener(hmUI.event.CLICK_DOWN, onTap);
  text.addEventListener(hmUI.event.CLICK_DOWN, onTap);
  return text;
}

function onKey(key, action) {
  showDebug("key " + key + " / act " + action);

  const isOurKey = key === hmApp.key.HOME || key === hmApp.key.SHORTCUT;
  if (!isOurKey) return false;

  // Long press on either key leaves the counter (our own exit path,
  // since swipe-right is blocked to avoid accidental exits).
  if (action === hmApp.action.LONG_PRESS) {
    hmApp.goBack();
    return true;
  }
  if (action === hmApp.action.CLICK) {
    // Assumption: HOME = upper button (me), SHORTCUT = lower (opponent).
    // Check on the device via the debug line and swap if needed.
    addPoint(key === hmApp.key.HOME ? "me" : "opp");
  }
  // Swallow press/release/click so the system does not exit the app.
  return true;
}

function onGesture(event) {
  // Block swipe-right (default: goBack) so a sweaty swipe does not
  // throw away the score. Other gestures keep their default.
  return event === hmApp.gesture.RIGHT;
}

Page({
  onInit() {
    logger.debug("counter onInit");
    state.me = 0;
    state.opp = 0;
    state.history = [];

    // Problem 1: without this the app is killed ~10s after screen-off.
    hmApp.setScreenKeep(true);
    keepAwake();

    try {
      vibrate = hmSensor.createSensor(hmSensor.id.VIBRATE);
    } catch (e) {
      vibrate = null;
    }

    hmApp.registerKeyEvent(onKey);
    hmApp.registerGestureEvent(onGesture);
  },

  build() {
    widgets.debug = hmUI.createWidget(hmUI.widget.TEXT, DEBUG_STYLE);
    hmUI.createWidget(hmUI.widget.TEXT, LABEL_ME_STYLE);
    hmUI.createWidget(hmUI.widget.TEXT, LABEL_OPP_STYLE);

    widgets.me = tapArea(AREA_ME, scoreTextStyle(AREA_ME), () =>
      addPoint("me")
    );
    widgets.opp = tapArea(AREA_OPP, scoreTextStyle(AREA_OPP), () =>
      addPoint("opp")
    );
    tapArea(AREA_UNDO, UNDO_TEXT_STYLE, undo);

    render();
  },

  onDestroy() {
    logger.debug("counter onDestroy");
    hmApp.unregisterKeyEvent();
    hmApp.unregisterGestureEvent();
    hmSetting.setBrightScreenCancel();
    if (vibrate) vibrate.stop();
    widgets = {};
  },
});
