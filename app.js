// Device app entry. The MessageBuilder (from the official OS 1.0 template,
// see shared/) talks to the side service in the Zepp app over Bluetooth.
import "./shared/device-polyfill";
import { MessageBuilder } from "./shared/message";

App({
  globalData: {
    messageBuilder: null,
  },
  onCreate() {
    try {
      const appId = hmApp.packageInfo().appId;
      this.globalData.messageBuilder = new MessageBuilder({ appId });
      this.globalData.messageBuilder.connect();
    } catch (e) {
      // Without a phone connection the app still works; only the export fails.
      this.globalData.messageBuilder = null;
    }
  },

  onDestroy() {
    if (this.globalData.messageBuilder) this.globalData.messageBuilder.disConnect();
  },
});
