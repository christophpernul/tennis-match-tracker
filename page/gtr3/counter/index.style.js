export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } =
  hmSetting.getDeviceInfo();

// GTR 3: 454x454, round. Areas are kept inside the visible circle.
const GAP = px(8);
const HALF_W = (DEVICE_WIDTH - GAP * 3) / 2;

export const COLORS = {
  me: 0x1565c0,
  opp: 0xc62828,
  undo: 0x424242,
  label: 0xbdbdbd,
  debug: 0x757575,
  white: 0xffffff,
};

// Small debug line at the very top: shows the last key code/action.
export const DEBUG_STYLE = {
  x: px(127),
  y: px(18),
  w: px(200),
  h: px(30),
  color: COLORS.debug,
  text_size: px(20),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text: "",
};

const LABEL_Y = px(52);
const LABEL_H = px(40);

export const LABEL_ME_STYLE = {
  x: GAP,
  y: LABEL_Y,
  w: HALF_W,
  h: LABEL_H,
  color: COLORS.label,
  text_size: px(28),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text: "ICH",
};

export const LABEL_OPP_STYLE = {
  ...LABEL_ME_STYLE,
  x: GAP * 2 + HALF_W,
  text: "GEGNER",
};

const AREA_Y = px(96);
const AREA_H = px(236);

export const AREA_ME = {
  x: GAP,
  y: AREA_Y,
  w: HALF_W,
  h: AREA_H,
  radius: px(28),
  color: COLORS.me,
};

export const AREA_OPP = {
  ...AREA_ME,
  x: GAP * 2 + HALF_W,
  color: COLORS.opp,
};

export function scoreTextStyle(area) {
  return {
    x: area.x,
    y: area.y,
    w: area.w,
    h: area.h,
    color: COLORS.white,
    text_size: px(120),
    align_h: hmUI.align.CENTER_H,
    align_v: hmUI.align.CENTER_V,
    text: "0",
  };
}

export const AREA_UNDO = {
  x: px(117),
  y: px(342),
  w: px(220),
  h: px(84),
  radius: px(42),
  color: COLORS.undo,
};

export const UNDO_TEXT_STYLE = {
  x: AREA_UNDO.x,
  y: AREA_UNDO.y,
  w: AREA_UNDO.w,
  h: AREA_UNDO.h,
  color: COLORS.white,
  text_size: px(34),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text: "UNDO",
};
