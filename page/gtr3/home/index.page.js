import {
  TITLE_STYLE,
  SUBTITLE_STYLE,
  START_BUTTON_STYLE,
} from "./index.style";

const logger = DeviceRuntimeCore.HmLogger.getLogger("tennis-home");

Page({
  build() {
    logger.debug("home build");
    hmUI.createWidget(hmUI.widget.TEXT, TITLE_STYLE);
    hmUI.createWidget(hmUI.widget.TEXT, SUBTITLE_STYLE);
    hmUI.createWidget(hmUI.widget.BUTTON, {
      ...START_BUTTON_STYLE,
      click_func: () => {
        hmApp.gotoPage({ url: "page/gtr3/counter/index.page", param: "" });
      },
    });
  },
  onInit() {
    logger.debug("home onInit");
  },
  onDestroy() {
    logger.debug("home onDestroy");
  },
});
