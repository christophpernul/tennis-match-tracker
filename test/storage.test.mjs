// Run: node --test test/
import { test } from "node:test";
import assert from "node:assert/strict";

// Minimal in-memory fake of the Zepp OS 1.0 hmFS API.
const files = new Map();
const open = new Map();
let nextFd = 3;
globalThis.hmFS = {
  O_RDONLY: 0, O_WRONLY: 1, O_RDWR: 2, O_CREAT: 64, O_TRUNC: 512,
  open(name, flags) {
    if (!files.has(name)) {
      if (!(flags & 64)) return -4;
      files.set(name, new Uint8Array(0));
    }
    if (flags & 512) files.set(name, new Uint8Array(0));
    const fd = nextFd++;
    open.set(fd, name);
    return fd;
  },
  write(fd, buffer, pos, len) {
    files.set(open.get(fd), new Uint8Array(buffer.slice(pos, pos + len)));
    return 0;
  },
  read(fd, buffer, pos, len) {
    new Uint8Array(buffer).set(files.get(open.get(fd)).subarray(0, len), pos);
    return 0;
  },
  close(fd) { open.delete(fd); },
  remove(name) { files.delete(name); return 0; },
  stat(name) {
    return files.has(name) ? [{ size: files.get(name).length, mtime: 0 }, 0] : [null, -4];
  },
};

const { saveMatch, loadMatch, loadIndex, archiveMatch, unarchiveMatch } = await import("../utils/storage.js");

test("load returns null when nothing saved", () => {
  assert.equal(loadMatch(), null);
});

test("save/load roundtrip incl. umlauts and emoji", () => {
  const m = { v: 1, format: "bo2", note: "Satz gewonnen – Ärger 🎾", points: [{ w: "me", c: "ace" }] };
  assert.equal(saveMatch(m), true);
  assert.deepEqual(loadMatch(), m);
  m.points.pop();
  saveMatch(m);
  assert.deepEqual(loadMatch().points, []);
});

test("archive: upsert into index, newest first, unarchive removes", () => {
  assert.deepEqual(loadIndex(), []);
  archiveMatch({ id: 1, points: [] }, { id: 1, date: 100, status: "complete" });
  archiveMatch({ id: 2, points: [] }, { id: 2, date: 200, status: "aborted" });
  archiveMatch({ id: 1, points: [] }, { id: 1, date: 100, status: "aborted" });
  const idx = loadIndex();
  assert.deepEqual(idx.map((e) => e.id), [2, 1]);
  assert.equal(idx[1].status, "aborted");
  assert.ok(files.has("m_1.json"));
  unarchiveMatch(1);
  assert.deepEqual(loadIndex().map((e) => e.id), [2]);
  assert.ok(!files.has("m_1.json"));
});
