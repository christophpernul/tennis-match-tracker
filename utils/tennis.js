// Pure tennis scoring engine. No hm* APIs here, so it runs in Node tests.
//
// A match is stored as config + list of points (event log). The score is
// always derived by replaying the points, so undo is just "pop".
//
// match = {
//   v: 1, id, opponent, format, ad, firstServer, startedAt, finishedAt,
//   finished, aborted,
//   points: [{ w: "me" | "opp", c: null | "ace" | "df" | "sw" | "winner" | "ue" | "fe" }]
// }
// finished = match won by someone OR aborted by the user.

export const FORMATS = {
  bo1: { label: "1 Satz", setsToWin: 1, decidingMtb: false, mtbOnly: false },
  bo2: { label: "2 Sätze + MTB", setsToWin: 2, decidingMtb: true, mtbOnly: false },
  bo3: { label: "Best of 3", setsToWin: 2, decidingMtb: false, mtbOnly: false },
  mtb: { label: "Nur Match-TB", setsToWin: 1, decidingMtb: false, mtbOnly: true },
};

export const FORMAT_ORDER = ["bo1", "bo2", "bo3", "mtb"];

export const CATEGORIES = ["ace", "df", "sw", "winner", "ue", "fe"];

export function other(p) {
  return p === "me" ? "opp" : "me";
}

export function newMatch(format, ad, firstServer, now, opponent) {
  return {
    v: 1,
    id: now,
    opponent: opponent || "",
    format,
    ad: !!ad,
    firstServer,
    startedAt: now,
    finishedAt: null,
    finished: false,
    aborted: false,
    points: [],
  };
}

export function opponentName(match) {
  return (match && match.opponent) || "Gegner";
}

function zero() {
  return { me: 0, opp: 0 };
}

// Server of the next point.
export function currentServer(s) {
  if (!s.tiebreak) return s.gameServer;
  // Tiebreak: first point by A, then B serves 2, A serves 2, ...
  const n = s.pts.me + s.pts.opp;
  return ((n + 1) >> 1) % 2 === 0 ? s.tiebreak.first : other(s.tiebreak.first);
}

function winSet(s, fmt, w, tbScore) {
  s.sets.push({ me: s.games.me, opp: s.games.opp, tb: tbScore || null, mtb: false });
  s.games = zero();
  s.setsWon[w] += 1;
  if (s.setsWon[w] >= fmt.setsToWin) {
    s.winner = w;
    return;
  }
  const decider = fmt.setsToWin - 1;
  if (fmt.decidingMtb && s.setsWon.me === decider && s.setsWon.opp === decider) {
    s.tiebreak = { target: 10, first: s.gameServer, match: true };
  }
}

function winTiebreak(s, fmt, w) {
  const tb = s.tiebreak;
  const tbScore = { me: s.pts.me, opp: s.pts.opp };
  s.pts = zero();
  s.tiebreak = null;
  // The player who received first in the tiebreak serves the next game.
  s.gameServer = other(tb.first);
  if (tb.match) {
    s.sets.push({ me: tbScore.me, opp: tbScore.opp, tb: null, mtb: true });
    s.setsWon[w] += 1;
    s.winner = w;
    return;
  }
  s.games[w] += 1;
  winSet(s, fmt, w, tbScore);
}

function winGame(s, fmt, w) {
  s.games[w] += 1;
  s.pts = zero();
  s.gameServer = other(s.gameServer);
  const g = s.games[w];
  const h = s.games[other(w)];
  if ((g >= 6 && g - h >= 2) || g === 7) {
    winSet(s, fmt, w, null);
    return;
  }
  if (g === 6 && h === 6) {
    s.tiebreak = { target: 7, first: s.gameServer, match: false };
  }
}

function applyPoint(s, fmt, ad, p) {
  if (s.winner) return;
  const server = currentServer(s);
  s.log.push({ w: p.w, c: p.c || null, server });
  s.pts[p.w] += 1;
  const a = s.pts[p.w];
  const b = s.pts[other(p.w)];
  if (s.tiebreak) {
    if (a >= s.tiebreak.target && a - b >= 2) winTiebreak(s, fmt, p.w);
  } else if (ad ? a >= 4 && a - b >= 2 : a >= 4) {
    winGame(s, fmt, p.w);
  }
}

export function replay(match) {
  const fmt = FORMATS[match.format] || FORMATS.bo3;
  const s = {
    sets: [],
    games: zero(),
    pts: zero(),
    setsWon: zero(),
    tiebreak: fmt.mtbOnly ? { target: 10, first: match.firstServer, match: true } : null,
    gameServer: match.firstServer,
    winner: null,
    log: [],
  };
  for (let i = 0; i < match.points.length; i++) {
    applyPoint(s, fmt, match.ad, match.points[i]);
  }
  return s;
}

const GAME_NAMES = ["0", "15", "30", "40"];

// Labels for the big numbers on the score screen.
export function pointLabels(s) {
  const { me, opp } = s.pts;
  if (s.tiebreak) return { me: String(me), opp: String(opp) };
  if (me >= 3 && opp >= 3) {
    if (me === opp) return { me: "40", opp: "40" };
    return me > opp ? { me: "AD", opp: "40" } : { me: "40", opp: "AD" };
  }
  return { me: GAME_NAMES[me], opp: GAME_NAMES[opp] };
}

// e.g. "6:4  3:2" or "6:4  4:6  MTB" or "6:4  7:6"
export function setLine(s) {
  const parts = s.sets.map((x) => (x.mtb ? "[" + x.me + ":" + x.opp + "]" : x.me + ":" + x.opp));
  if (!s.winner) {
    if (s.tiebreak && s.tiebreak.match) parts.push("MTB");
    else parts.push(s.games.me + ":" + s.games.opp + (s.tiebreak ? " TB" : ""));
  }
  return parts.join("  ");
}

// Which categories make sense for a point won by `winner` while `server` served.
export function categoryOptions(winner, server) {
  return winner === server ? ["ace", "sw", "winner", "ue", "fe"] : ["df", "winner", "ue", "fe"];
}

function blankStats() {
  return {
    points: 0,
    servePts: 0,
    serveWon: 0,
    returnPts: 0,
    returnWon: 0,
    ace: 0,
    df: 0,
    sw: 0,
    winner: 0,
    ue: 0,
    fe: 0,
    none: 0, // points won without a category
  };
}

// Per-player stats. Errors are counted for the player who made them
// (the loser of the point), aces/DF/service winners for the server.
export function computeStats(match) {
  const s = replay(match);
  const st = { me: blankStats(), opp: blankStats() };
  for (let i = 0; i < s.log.length; i++) {
    const p = s.log[i];
    const loser = other(p.w);
    const recv = other(p.server);
    st[p.w].points += 1;
    st[p.server].servePts += 1;
    if (p.w === p.server) st[p.server].serveWon += 1;
    st[recv].returnPts += 1;
    if (p.w === recv) st[recv].returnWon += 1;
    switch (p.c) {
      case "ace":
        st[p.server].ace += 1;
        break;
      case "sw":
        st[p.server].sw += 1;
        break;
      case "df":
        st[p.server].df += 1;
        break;
      case "winner":
        st[p.w].winner += 1;
        break;
      case "ue":
        st[loser].ue += 1;
        break;
      case "fe":
        st[loser].fe += 1;
        break;
      default:
        st[p.w].none += 1;
    }
  }
  return { state: s, me: st.me, opp: st.opp };
}

// ---------- archive summaries ----------

export const STAT_KEYS = [
  "points",
  "servePts",
  "serveWon",
  "returnPts",
  "returnWon",
  "ace",
  "df",
  "sw",
  "winner",
  "ue",
  "fe",
  "none",
];

// Compact record stored in the match index (list + stats without
// having to load and replay every match file).
export function summarize(match) {
  const st = computeStats(match);
  const s = st.state;
  return {
    id: match.id,
    date: match.startedAt,
    opponent: match.opponent || "",
    format: match.format,
    ad: match.ad,
    status: match.aborted ? "aborted" : "complete",
    winner: match.aborted ? null : s.winner,
    setsWon: { me: s.setsWon.me, opp: s.setsWon.opp },
    setLine: setLine(s),
    nPoints: match.points.length,
    me: st.me,
    opp: st.opp,
  };
}

export function filterEntries(entries, filter) {
  if (filter === "complete") return entries.filter((e) => e.status === "complete");
  if (filter === "aborted") return entries.filter((e) => e.status === "aborted");
  return entries.slice();
}

// Sum of stats over several summaries.
export function aggregate(entries) {
  const me = blankStats();
  const opp = blankStats();
  let wins = 0;
  let losses = 0;
  let aborted = 0;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    for (let k = 0; k < STAT_KEYS.length; k++) {
      const key = STAT_KEYS[k];
      me[key] += (e.me && e.me[key]) || 0;
      opp[key] += (e.opp && e.opp[key]) || 0;
    }
    if (e.status === "aborted") aborted += 1;
    else if (e.winner === "me") wins += 1;
    else if (e.winner === "opp") losses += 1;
  }
  return { count: entries.length, wins, losses, aborted, me, opp };
}

// Insert or replace by id, newest first.
export function upsertEntry(entries, entry) {
  const rest = entries.filter((e) => e.id !== entry.id);
  rest.push(entry);
  rest.sort((a, b) => b.date - a.date);
  return rest;
}

// Distinct opponent names, most recent first.
export function recentOpponents(entries, max) {
  const seen = {};
  const out = [];
  for (let i = 0; i < entries.length && out.length < max; i++) {
    const n = entries[i].opponent;
    if (n && !seen[n]) {
      seen[n] = true;
      out.push(n);
    }
  }
  return out;
}

function pad2(n) {
  return n < 10 ? "0" + n : String(n);
}

// "20.11.26"
export function formatDate(ms) {
  const d = new Date(ms);
  return pad2(d.getDate()) + "." + pad2(d.getMonth() + 1) + "." + pad2(d.getFullYear() % 100);
}

// Letter picker: capitalize the first letter of every word.
export function appendLetter(name, letter, maxLen) {
  if (name.length >= maxLen) return name;
  if (letter === " ") {
    if (!name.length || name[name.length - 1] === " ") return name;
    return name + " ";
  }
  const startOfWord = !name.length || name[name.length - 1] === " ";
  return name + (startOfWord ? letter.toUpperCase() : letter.toLowerCase());
}

// Score shown in the match list: sets for complete matches ("2:1"),
// the actual standing for aborted ones ("1:0", "6:4 3:2").
export function listScore(entry) {
  if (entry.status === "aborted") {
    return String(entry.setLine || "")
      .replace(/ TB$/, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  return entry.setsWon ? entry.setsWon.me + ":" + entry.setsWon.opp : "";
}
