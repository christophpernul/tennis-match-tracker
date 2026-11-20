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

import {
  summarize,
  aggregate,
  filterEntries,
  upsertEntry,
  recentOpponents,
  appendLetter,
  formatDate,
} from "../utils/tennis.js";

test("summary of a complete and an aborted match", () => {
  const m = newMatch("bo1", true, "me", 1000, "Huber");
  play(m, games("me", 6));
  const sum = summarize(m);
  assert.equal(sum.status, "complete");
  assert.equal(sum.winner, "me");
  assert.equal(sum.opponent, "Huber");
  assert.equal(sum.setLine, "6:0");
  assert.equal(sum.me.points, 24);

  const a = newMatch("bo3", true, "me", 2000, "");
  play(a, games("me", 3) + "mm");
  a.aborted = true;
  const sa = summarize(a);
  assert.equal(sa.status, "aborted");
  assert.equal(sa.winner, null);
  assert.equal(sa.setLine, "3:0");
});

test("filter and aggregate", () => {
  const entries = [
    { id: 1, date: 1, status: "complete", winner: "me", me: { points: 10, ace: 2 }, opp: { points: 5 } },
    { id: 2, date: 2, status: "complete", winner: "opp", me: { points: 3 }, opp: { points: 9, df: 1 } },
    { id: 3, date: 3, status: "aborted", winner: null, me: { points: 4 }, opp: { points: 4 } },
  ];
  assert.equal(filterEntries(entries, "complete").length, 2);
  assert.equal(filterEntries(entries, "aborted").length, 1);
  assert.equal(filterEntries(entries, "all").length, 3);
  const agg = aggregate(entries);
  assert.deepEqual([agg.count, agg.wins, agg.losses, agg.aborted], [3, 1, 1, 1]);
  assert.equal(agg.me.points, 17);
  assert.equal(agg.me.ace, 2);
  assert.equal(agg.opp.df, 1);
});

test("upsert keeps newest first and replaces by id", () => {
  let list = [];
  list = upsertEntry(list, { id: 1, date: 10 });
  list = upsertEntry(list, { id: 2, date: 20 });
  list = upsertEntry(list, { id: 1, date: 10, x: 1 });
  assert.deepEqual(list.map((e) => e.id), [2, 1]);
  assert.equal(list[1].x, 1);
});

test("recent opponents are distinct, newest first", () => {
  const list = [{ opponent: "Huber" }, { opponent: "" }, { opponent: "Maier" }, { opponent: "Huber" }];
  assert.deepEqual(recentOpponents(list, 5), ["Huber", "Maier"]);
  assert.deepEqual(recentOpponents(list, 1), ["Huber"]);
});

test("letter picker capitalizes words and limits length", () => {
  let n = "";
  for (const ch of "HANS MAIER") n = appendLetter(n, ch, 16);
  assert.equal(n, "Hans Maier");
  assert.equal(appendLetter("", " ", 16), "");
  assert.equal(appendLetter("Ab ", " ", 16), "Ab ");
  assert.equal(appendLetter("abc", "D", 3), "abc");
});

test("date format dd.mm.yy", () => {
  assert.equal(formatDate(new Date(2026, 10, 5).getTime()), "05.11.26");
});

import { listScore } from "../utils/tennis.js";

test("list score: sets for complete, standing for aborted", () => {
  assert.equal(listScore({ status: "complete", setsWon: { me: 2, opp: 1 }, setLine: "6:4  3:6  [10:7]" }), "2:1");
  assert.equal(listScore({ status: "aborted", setsWon: { me: 0, opp: 0 }, setLine: "1:0" }), "1:0");
  assert.equal(listScore({ status: "aborted", setsWon: { me: 1, opp: 0 }, setLine: "6:4  3:2" }), "6:4 3:2");
  assert.equal(listScore({ status: "aborted", setsWon: { me: 0, opp: 0 }, setLine: "6:6 TB" }), "6:6");

  const m = newMatch("bo3", true, "me", 0, "X");
  play(m, game("me"));
  m.aborted = true;
  assert.equal(listScore(summarize(m)), "1:0");
});
