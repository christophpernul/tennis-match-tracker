import { gettext } from "i18n";

export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } =
  hmSetting.getDeviceInfo();

export const TITLE_STYLE = {
  text: gettext("appName"),
  x: px(42),
  y: px(110),
  w: DEVICE_WIDTH - px(42) * 2,
  h: px(70),
  color: 0xffffff,
  text_size: px(40),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
};

export const SUBTITLE_STYLE = {
  text: "Hello World - Zepp OS 1.0",
  x: px(42),
  y: px(180),
  w: DEVICE_WIDTH - px(42) * 2,
  h: px(40),
  color: 0x9e9e9e,
  text_size: px(24),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
};

export const START_BUTTON_STYLE = {
  x: px(97),
  y: px(260),
  w: px(260),
  h: px(100),
  radius: px(50),
  normal_color: 0x2e7d32,
  press_color: 0x1b5e20,
  text: "Zähler",
  text_size: px(36),
  color: 0xffffff,
};
