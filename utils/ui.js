// Small device-side UI helpers shared by the pages (Zepp OS 1.0 API).

export const PAGES = {
  home: "page/gtr3/home/index.page",
  setup: "page/gtr3/setup/index.page",
  match: "page/gtr3/match/index.page",
  stats: "page/gtr3/stats/index.page",
};

export const COLORS = {
  me: 0x1565c0,
  opp: 0xc62828,
  undo: 0x424242,
  slot: 0x37474f,
  skip: 0x2e7d32,
  label: 0xbdbdbd,
  server: 0xffd600,
  white: 0xffffff,
  black: 0x000000,
  dim: 0x9e9e9e,
};

export function text(opts) {
  return hmUI.createWidget(hmUI.widget.TEXT, {
    color: COLORS.white,
    text_size: px(28),
    align_h: hmUI.align.CENTER_H,
    align_v: hmUI.align.CENTER_V,
    text_style: hmUI.text_style.NONE,
    text: "",
    ...opts,
  });
}

// Rect + text on top. Both get the listener, since the topmost widget
// under the finger receives the touch. CLICK_DOWN = reacts on first contact.
export function tapArea(rect, textOpts, onTap) {
  const r = hmUI.createWidget(hmUI.widget.FILL_RECT, rect);
  const t = text({ x: rect.x, y: rect.y, w: rect.w, h: rect.h, ...textOpts });
  r.addEventListener(hmUI.event.CLICK_DOWN, onTap);
  t.addEventListener(hmUI.event.CLICK_DOWN, onTap);
  return { rect: r, text: t };
}

export function menuButton(x, y, w, h, label, color, onClick) {
  return hmUI.createWidget(hmUI.widget.BUTTON, {
    x,
    y,
    w,
    h,
    radius: Math.floor(h / 2),
    normal_color: color,
    press_color: COLORS.undo,
    text: label,
    text_size: px(30),
    color: COLORS.white,
    click_func: onClick,
  });
}

export function setVisible(widgets, visible) {
  for (let i = 0; i < widgets.length; i++) {
    widgets[i].setProperty(hmUI.prop.VISIBLE, visible);
  }
}

export function toast(msg) {
  try {
    hmUI.showToast({ text: msg });
  } catch (e) {
    // ignore
  }
}

export function createVibrator() {
  let v = null;
  try {
    v = hmSensor.createSensor(hmSensor.id.VIBRATE);
  } catch (e) {
    v = null;
  }
  return {
    // 23 light short, 24 medium short, 25 strong short, 28 strong 600ms
    buzz(scene) {
      if (!v) return;
      try {
        v.stop();
        v.scene = scene;
        v.start();
      } catch (e) {
        // ignore
      }
    },
    stop() {
      if (v) v.stop();
    },
  };
}

export function parseParam(param) {
  if (!param) return {};
  try {
    return JSON.parse(param) || {};
  } catch (e) {
    return {};
  }
}
