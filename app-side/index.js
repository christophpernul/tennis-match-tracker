// Side service: runs inside the Zepp app on the phone (no UI).
// Receives match rows from the watch and POSTs them to the Google Apps
// Script web app configured in the app settings (setting/index.js).
import { MessageBuilder } from "../shared/message";

const messageBuilder = new MessageBuilder();

function getSetting(key) {
  return (settings.settingsStorage.getItem(key) || "").trim();
}

function remember(text) {
  const d = new Date();
  const pad = (n) => (n < 10 ? "0" + n : String(n));
  const stamp = pad(d.getDate()) + "." + pad(d.getMonth() + 1) + ". " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  settings.settingsStorage.setItem("lastResult", stamp + " " + text);
}

function parseBody(res) {
  if (!res) return null;
  const body = res.body;
  if (body && typeof body === "object") return body;
  try {
    return JSON.parse(body);
  } catch (e) {
    return null;
  }
}

function headerOf(res, name) {
  const h = (res && res.headers) || {};
  return h[name] || h[name.toLowerCase()] || h[name.charAt(0).toUpperCase() + name.slice(1)] || "";
}

// Apps Script answers a POST with a 302 redirect to the result. If fetch
// does not follow it by itself, follow it manually with a GET. The data
// is already written at that point.
async function postToScript(url, payload) {
  let res = await fetch({
    url,
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const location = headerOf(res, "location");
  if (res && res.status >= 300 && res.status < 400 && location) {
    res = await fetch({ url: location, method: "GET" });
  }
  return res;
}

async function handleExport(ctx, params) {
  const url = getSetting("scriptUrl");
  const token = getSetting("token");
  if (!url) {
    remember("Fehler: keine Script-URL");
    ctx.response({ data: { ok: false, error: "NO_URL" } });
    return;
  }
  try {
    const res = await postToScript(url, {
      token,
      version: params.version,
      columns: params.columns,
      rows: params.rows,
    });
    const body = parseBody(res);
    if (body && body.ok) {
      remember("OK: " + (body.added || 0) + " neu, " + (body.updated || 0) + " aktualisiert");
      ctx.response({ data: { ok: true, added: body.added || 0, updated: body.updated || 0 } });
    } else {
      const error = (body && body.error) || "HTTP " + (res && res.status);
      remember("Fehler: " + error);
      ctx.response({ data: { ok: false, error } });
    }
  } catch (e) {
    remember("Fehler: " + e);
    ctx.response({ data: { ok: false, error: "NETWORK: " + e } });
  }
}

AppSideService({
  onInit() {
    messageBuilder.listen(() => {});
    messageBuilder.on("request", (ctx) => {
      const req = messageBuilder.buf2Json(ctx.request.payload);
      if (req.method === "EXPORT") return handleExport(ctx, req.params || {});
      if (req.method === "PING") {
        ctx.response({ data: { ok: true, configured: !!getSetting("scriptUrl") } });
      }
    });
  },
  onRun() {},
  onDestroy() {},
});
