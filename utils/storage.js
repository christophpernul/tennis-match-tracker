// Persistence of the current/last match as JSON in the app's /data folder.
// hmFS uses /data as root for relative paths.

const FILE = "match.json";

function utf8Encode(str) {
  const out = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
      const d = str.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) {
        c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00);
        i++;
      }
    }
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else
      out.push(
        0xf0 | (c >> 18),
        0x80 | ((c >> 12) & 63),
        0x80 | ((c >> 6) & 63),
        0x80 | (c & 63)
      );
  }
  return new Uint8Array(out);
}

function utf8Decode(bytes) {
  let s = "";
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i++];
    let c;
    if (b < 0x80) c = b;
    else if (b < 0xe0) c = ((b & 31) << 6) | (bytes[i++] & 63);
    else if (b < 0xf0) c = ((b & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
    else {
      c =
        ((b & 7) << 18) |
        ((bytes[i++] & 63) << 12) |
        ((bytes[i++] & 63) << 6) |
        (bytes[i++] & 63);
      c -= 0x10000;
      s += String.fromCharCode(0xd800 + (c >> 10), 0xdc00 + (c & 1023));
      continue;
    }
    s += String.fromCharCode(c);
  }
  return s;
}

function writeJson(file, obj) {
  try {
    const bytes = utf8Encode(JSON.stringify(obj));
    const fd = hmFS.open(file, hmFS.O_WRONLY | hmFS.O_CREAT | hmFS.O_TRUNC);
    if (fd < 0) return false;
    hmFS.write(fd, bytes.buffer, 0, bytes.length);
    hmFS.close(fd);
    return true;
  } catch (e) {
    return false;
  }
}

function readJson(file) {
  try {
    const [st, err] = hmFS.stat(file);
    if (err !== 0 || !st || !st.size) return null;
    const buf = new Uint8Array(st.size);
    const fd = hmFS.open(file, hmFS.O_RDONLY);
    if (fd < 0) return null;
    hmFS.read(fd, buf.buffer, 0, st.size);
    hmFS.close(fd);
    return JSON.parse(utf8Decode(buf));
  } catch (e) {
    return null;
  }
}

// ---------- current match ----------

export function saveMatch(match) {
  return writeJson(FILE, match);
}

export function loadMatch() {
  const m = readJson(FILE);
  if (!m || !Array.isArray(m.points)) return null;
  return m;
}

// ---------- archive ----------
// matches.json: array of summaries (see summarize() in tennis.js), newest first.
// m_<id>.json:  full match incl. point log, for later analysis.

const INDEX = "matches.json";

function matchFile(id) {
  return "m_" + id + ".json";
}

export function loadIndex() {
  const list = readJson(INDEX);
  return Array.isArray(list) ? list : [];
}

export function archiveMatch(match, summary) {
  const okFile = writeJson(matchFile(match.id), match);
  const list = loadIndex().filter((e) => e.id !== summary.id);
  list.push(summary);
  list.sort((a, b) => b.date - a.date);
  return writeJson(INDEX, list) && okFile;
}

export function unarchiveMatch(id) {
  const list = loadIndex();
  const rest = list.filter((e) => e.id !== id);
  if (rest.length !== list.length) writeJson(INDEX, rest);
  try {
    hmFS.remove(matchFile(id));
  } catch (e) {
    // ignore
  }
}
