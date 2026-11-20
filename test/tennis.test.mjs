// Run: node --test test/
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newMatch,
  replay,
  pointLabels,
  setLine,
  currentServer,
  computeStats,
  categoryOptions,
} from "../utils/tennis.js";

function play(match, seq) {
  for (const ch of seq) {
    if (ch === "m") match.points.push({ w: "me", c: null });
    else if (ch === "o") match.points.push({ w: "opp", c: null });
  }
  return match;
}
const game = (who) => (who === "me" ? "mmmm" : "oooo");
const games = (who, n) => game(who).repeat(n);

test("game points 0/15/30/40/AD with deuce", () => {
  const m = newMatch("bo3", true, "me", 0);
  play(m, "mo");
  assert.deepEqual(pointLabels(replay(m)), { me: "15", opp: "15" });
  play(m, "momo");
  assert.deepEqual(pointLabels(replay(m)), { me: "40", opp: "40" });
  play(m, "m");
  assert.deepEqual(pointLabels(replay(m)), { me: "AD", opp: "40" });
  play(m, "o");
  assert.deepEqual(pointLabels(replay(m)), { me: "40", opp: "40" });
  play(m, "mm");
  const s = replay(m);
  assert.deepEqual(s.games, { me: 1, opp: 0 });
  assert.deepEqual(s.pts, { me: 0, opp: 0 });
});

test("no-ad: deciding point at 40:40", () => {
  const m = newMatch("bo3", false, "me", 0);
  play(m, "mmmooo");
  play(m, "o");
  assert.deepEqual(replay(m).games, { me: 0, opp: 1 });
});

test("server alternates every game", () => {
  const m = newMatch("bo3", true, "opp", 0);
  assert.equal(currentServer(replay(m)), "opp");
  play(m, game("me"));
  assert.equal(currentServer(replay(m)), "me");
  play(m, game("me"));
  assert.equal(currentServer(replay(m)), "opp");
});

test("set won 6:4, 7:5 needs two games lead", () => {
  const m = newMatch("bo3", true, "me", 0);
  play(m, games("me", 5) + games("opp", 4) + game("me"));
  let s = replay(m);
  assert.equal(s.sets.length, 1);
  assert.deepEqual([s.sets[0].me, s.sets[0].opp], [6, 4]);

  const m2 = newMatch("bo3", true, "me", 0);
  play(m2, games("me", 5) + games("opp", 5) + game("me"));
  s = replay(m2);
  assert.equal(s.sets.length, 0);
  assert.deepEqual(s.games, { me: 6, opp: 5 });
  play(m2, game("me"));
  s = replay(m2);
  assert.deepEqual([s.sets[0].me, s.sets[0].opp], [7, 5]);
});

test("tiebreak at 6:6 to 7, server rotation, next set server", () => {
  const m = newMatch("bo3", true, "me", 0);
  // 12 games alternate: me serves games 1,3,..; tiebreak first server = me
  play(m, games("me", 5) + games("opp", 5) + game("me") + game("opp"));
  let s = replay(m);
  assert.ok(s.tiebreak && s.tiebreak.target === 7);
  assert.equal(s.tiebreak.first, "me");
  assert.equal(setLine(s), "6:6 TB");
  // TB serve order: A, B, B, A, A, B, B ...
  const order = [];
  for (let i = 0; i < 7; i++) {
    order.push(currentServer(replay(m)));
    play(m, i % 2 ? "o" : "m");
  }
  assert.deepEqual(order, ["me", "opp", "opp", "me", "me", "opp", "opp"]);
  // now 4:3 for me -> win 7:3
  play(m, "mmm");
  s = replay(m);
  assert.equal(s.sets.length, 1);
  assert.deepEqual([s.sets[0].me, s.sets[0].opp], [7, 6]);
  assert.deepEqual(s.sets[0].tb, { me: 7, opp: 3 });
  // receiver of first TB point serves first game of next set
  assert.equal(currentServer(s), "opp");
});

test("tiebreak needs two points lead", () => {
  const m = newMatch("bo3", true, "me", 0);
  play(m, games("me", 5) + games("opp", 5) + game("me") + game("opp"));
  play(m, "mo".repeat(6) + "m");
  assert.equal(replay(m).sets.length, 0);
  play(m, "m");
  assert.equal(replay(m).sets.length, 1);
});

test("best of 1: one set wins the match", () => {
  const m = newMatch("bo1", true, "me", 0);
  play(m, games("me", 6));
  const s = replay(m);
  assert.equal(s.winner, "me");
  assert.equal(setLine(s), "6:0");
});

test("best of 2: 1:1 in sets -> match tiebreak to 10", () => {
  const m = newMatch("bo2", true, "me", 0);
  play(m, games("me", 6) + games("opp", 6));
  let s = replay(m);
  assert.ok(s.tiebreak && s.tiebreak.match && s.tiebreak.target === 10);
  assert.equal(setLine(s), "6:0  0:6  MTB");
  play(m, "m".repeat(9) + "o".repeat(9));
  assert.equal(replay(m).winner, null);
  play(m, "mm");
  s = replay(m);
  assert.equal(s.winner, "me");
  assert.equal(setLine(s), "6:0  0:6  [11:9]");
});

test("best of 3: third set is a full set", () => {
  const m = newMatch("bo3", true, "me", 0);
  play(m, games("me", 6) + games("opp", 6));
  let s = replay(m);
  assert.equal(s.tiebreak, null);
  play(m, games("opp", 6));
  s = replay(m);
  assert.equal(s.winner, "opp");
});

test("match tiebreak only", () => {
  const m = newMatch("mtb", true, "opp", 0);
  let s = replay(m);
  assert.equal(currentServer(s), "opp");
  play(m, "o".repeat(10));
  s = replay(m);
  assert.equal(s.winner, "opp");
  assert.equal(setLine(s), "[0:10]");
});

test("points after match end are ignored", () => {
  const m = newMatch("bo1", true, "me", 0);
  play(m, games("me", 6) + "oooo");
  const s = replay(m);
  assert.equal(s.log.length, 24);
});

test("category options depend on server", () => {
  assert.deepEqual(categoryOptions("me", "me"), ["ace", "sw", "winner", "ue", "fe"]);
  assert.deepEqual(categoryOptions("me", "opp"), ["df", "winner", "ue", "fe"]);
});

test("stats attribute categories to the right player", () => {
  const m = newMatch("bo3", true, "me", 0);
  m.points.push({ w: "me", c: "ace" }); // me serves
  m.points.push({ w: "opp", c: "ue" }); // my unforced error
  m.points.push({ w: "opp", c: "winner" });
  m.points.push({ w: "me", c: "fe" }); // opp forced error
  m.points.push({ w: "me", c: null });
  m.points.push({ w: "me", c: "sw" }); // game me 5:? -> 4:2 wins game
  m.points.push({ w: "me", c: "df" }); // opp serving, opp double fault
  const st = computeStats(m);
  assert.equal(st.me.ace, 1);
  assert.equal(st.me.sw, 1);
  assert.equal(st.me.ue, 1);
  assert.equal(st.opp.winner, 1);
  assert.equal(st.opp.fe, 1);
  assert.equal(st.opp.df, 1);
  assert.equal(st.me.none, 1);
  assert.equal(st.me.points, 5);
  assert.equal(st.opp.points, 2);
  assert.equal(st.me.servePts, 6);
  assert.equal(st.me.serveWon, 4);
  assert.equal(st.me.returnPts, 1);
  assert.equal(st.me.returnWon, 1);
});
