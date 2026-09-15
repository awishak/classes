// The room screen during and after a game, drawn from the Game Panel canvas.
//
// Anonymous on the wall: no student's name ever goes up. Team names can.
//   During: time left and how many submitted, calm and far apart.
//   Spread of scores, with its axes labelled.
//   All questions: each question's percent right and Please review count.
//   Clicking a question opens it: each answer, how many picked it, and how
//   many of those asked for review.
//   Teams: the standings, when the game was played in teams.
//
// The payloads come from gameCast.js, which reads the same scoring the game
// panel shows, so the wall and the panel cannot disagree.

import { useEffect, useState } from "react";

const MONO = "'IBM Plex Mono', ui-monospace, monospace";
const LETTERS = "ABCDEFGHIJ";

const Tick = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" style={{ flex: "none" }}>
    <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const minutesOrSeconds = (sec) => {
  const s = Math.max(0, Math.ceil(sec));
  return s > 60 ? [Math.ceil(s / 60), "min"] : [s, "sec"];
};

export function GameDuring({ s, g }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!s.endsAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [s.endsAt]);
  const fact = (label, big, small) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <span style={{ fontSize: 30, color: g.dim }}>{label}</span>
      <span style={{ fontSize: 96, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.02em" }}>
        {big}<span style={{ fontSize: 44, color: g.dim, marginLeft: 12, letterSpacing: 0 }}>{small}</span>
      </span>
    </div>
  );
  const [n, unit] = s.endsAt ? minutesOrSeconds((s.endsAt - now) / 1000) : [null, null];
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 120 }}>
      {s.endsAt ? fact("Time left", n, unit) : null}
      {s.endsAt ? <div style={{ width: 2, height: 180, background: g.rule }} /> : null}
      {fact("Submitted", s.submitted ?? 0, s.of ? `/ ${s.of}` : "")}
    </div>
  );
}

export function GameSpread({ s, g }) {
  const buckets = s.buckets || [];
  const max = Math.max(2, ...buckets.map(b => b.count));
  const top = max % 2 ? max + 1 : max;
  const ticks = Array.from({ length: 5 }, (_, i) => Math.round((top * i) / 4));
  const plotH = 380;
  return (
    <div style={{ position: "absolute", left: 96, right: 96, top: 56, bottom: 40, display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 52, fontWeight: 600, letterSpacing: "-0.03em" }}>Spread of scores</div>
      <div style={{ marginTop: 76, display: "grid", gridTemplateColumns: "110px minmax(0, 1fr)", columnGap: 20 }}>
        <div style={{ position: "relative", height: plotH }}>
          <span style={{ position: "absolute", right: 0, top: -44, fontSize: 24, color: g.dim }}>Students</span>
          {ticks.map(t => <span key={t} style={{ position: "absolute", right: 0, bottom: (plotH * t) / top - 14, fontFamily: MONO, fontSize: 24, color: g.dim }}>{t}</span>)}
        </div>
        <div style={{ position: "relative", height: plotH, boxShadow: `0 2px 0 ${g.dim}` }}>
          {ticks.slice(1).map(t => <div key={t} style={{ position: "absolute", left: 0, right: 0, bottom: (plotH * t) / top, height: 1, background: g.rule }} />)}
          <div style={{ position: "absolute", inset: 0, display: "flex", gap: 28, padding: "0 12px" }}>
            {buckets.map(b => (
              <div key={b.from} style={{ flex: 1, position: "relative", height: "100%" }}>
                <span style={{ position: "absolute", left: 0, right: 0, bottom: (plotH * b.count) / top + 8, textAlign: "center", fontFamily: MONO, fontSize: 28 }}>{b.count}</span>
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: (plotH * b.count) / top, borderRadius: "10px 10px 0 0", background: g.bar }} />
              </div>
            ))}
          </div>
        </div>
        <div />
        <div style={{ display: "flex", gap: 28, padding: "12px 12px 0" }}>
          {buckets.map(b => <span key={b.from} style={{ flex: 1, textAlign: "center", fontFamily: MONO, fontSize: 24, color: g.dim }}>{b.from}%</span>)}
        </div>
        <div />
        <div style={{ textAlign: "center", fontSize: 24, color: g.dim, paddingTop: 6 }}>Score</div>
      </div>
    </div>
  );
}

export function GameQuestions({ s, g }) {
  const [open, setOpen] = useState(null);
  const rows = s.rows || [];
  if (open !== null && rows[open]) {
    return <GameQuestion s={{ ...rows[open], back: () => setOpen(null) }} g={g} />;
  }
  const cols = "36px minmax(0, 1fr) 360px 84px 56px";
  const barLeft = 36 + 20 + (1088 - 36 - 360 - 84 - 56 - 80) + 20;
  return (
    <div style={{ position: "absolute", left: 96, right: 96, top: 48, bottom: 36, display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 46, fontWeight: 600, letterSpacing: "-0.03em" }}>All questions</div>
      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: cols, gap: 20, fontSize: 20, color: g.dim, height: 28 }}>
        <span /><span>Question</span><span /><span style={{ textAlign: "right" }}>Right</span>
        <span style={{ display: "flex", justifyContent: "flex-end" }}><Tick size={18} color={g.dim} /></span>
      </div>
      <div style={{ position: "relative", marginTop: 6, display: "flex", flexDirection: "column", gap: rows.length > 10 ? 2 : 6 }}>
        {[0, 25, 50, 75, 100].map(t => <div key={t} style={{ position: "absolute", top: 0, bottom: 0, left: barLeft + (360 * t) / 100, width: 1, background: g.rule }} />)}
        {rows.map((q, i) => (
          <button key={q.n} type="button" onClick={() => setOpen(i)}
            style={{ position: "relative", display: "grid", gridTemplateColumns: cols, alignItems: "center", gap: 20, height: rows.length > 10 ? 36 : 40, padding: 0, border: "none", background: "transparent", color: "inherit", fontFamily: "inherit", textAlign: "left", cursor: "pointer" }}>
            <span style={{ fontFamily: MONO, fontSize: 22, color: g.dim }}>{q.n}</span>
            <span style={{ fontSize: 22, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{q.text}</span>
            <span style={{ display: "block", height: 16 }}><span style={{ display: "block", width: `${q.pct}%`, height: 16, borderRadius: "0 999px 999px 0", background: g.ok }} /></span>
            <span style={{ fontFamily: MONO, fontSize: 24, textAlign: "right" }}>{q.answered ? `${q.pct}%` : ""}</span>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: 6, fontFamily: MONO, fontSize: 22, color: g.accent }}>
              {q.reviews ? <><Tick size={20} color={g.accent} />{q.reviews}</> : null}
            </span>
          </button>
        ))}
      </div>
      <div style={{ position: "relative", height: 34, marginTop: 8, boxShadow: `0 -2px 0 ${g.dim}`, marginLeft: barLeft, width: 360 }}>
        {[0, 25, 50, 75, 100].map(t => <span key={t} style={{ position: "absolute", top: 6, left: (360 * t) / 100, transform: "translateX(-50%)", fontFamily: MONO, fontSize: 20, color: g.dim }}>{t}%</span>)}
      </div>
    </div>
  );
}

export function GameQuestion({ s, g }) {
  const n = Math.max(1, s.answered || 0);
  const cols = "44px minmax(0, 1fr) 110px 150px";
  const back = s.back ? (
    <button type="button" onClick={s.back}
      style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 22, color: g.dim, padding: 0, border: "none", background: "transparent", fontFamily: "inherit", cursor: "pointer" }}>
      <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" fill="none" stroke={g.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      All questions
    </button>
  ) : null;
  const answers = s.typed ? (s.groups || []) : (s.options || []).map((o, i) => ({ text: o, picked: s.counts?.[i] || 0, reviews: s.reviewBy?.[i] || 0, right: (s.correct || []).includes(i), letter: LETTERS[i] }));
  const long = answers.length > 5 || (s.text || "").length > 110;
  return (
    <div style={{ position: "absolute", left: 96, right: 96, top: 40, bottom: 40, display: "flex", flexDirection: "column" }}>
      {back}
      <div style={{ marginTop: back ? 18 : 0, fontSize: long ? 36 : 44, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, textWrap: "balance" }}>{s.text}</div>
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: cols, gap: 24, padding: "0 24px", fontSize: 20, color: g.dim }}>
        <span /><span /><span style={{ textAlign: "right" }}>Picked</span><span style={{ textAlign: "right" }}>Please review</span>
      </div>
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: long ? 8 : 14 }}>
        {answers.map((a, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: cols, alignItems: "center", gap: 24, position: "relative", padding: long ? "10px 24px" : "16px 24px", borderRadius: 14, background: g.card, overflow: "hidden", boxShadow: `inset 0 0 0 2px ${a.right ? g.ok : g.rule}` }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(100 * a.picked) / n}%`, background: a.right ? g.ok : g.bar, opacity: 0.18 }} />
            <span style={{ position: "relative", fontFamily: MONO, fontSize: 28, color: a.right ? g.ok : g.dim }}>{a.letter || ""}</span>
            <span style={{ position: "relative", fontSize: long ? 22 : 26, lineHeight: 1.25 }}>{a.text}</span>
            <span style={{ position: "relative", fontFamily: MONO, fontSize: 28, textAlign: "right" }}>{a.picked}</span>
            <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, fontFamily: MONO, fontSize: 28, color: a.reviews ? g.accent : g.dim }}>
              {a.reviews ? <Tick size={22} color={g.accent} /> : null}{a.reviews}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GameTeams({ s, g }) {
  const teams = s.teams || [];
  return (
    <div style={{ position: "absolute", left: 96, right: 96, top: 64, bottom: 56, display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ fontSize: 56, fontWeight: 600, letterSpacing: "-0.03em" }}>{s.title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: teams.length > 8 ? 4 : 12 }}>
        {teams.map((t, i) => (
          <div key={t.name} style={{ display: "grid", gridTemplateColumns: "44px 1fr 420px 100px", alignItems: "center", gap: 24, height: teams.length > 8 ? 46 : 60 }}>
            <span style={{ fontFamily: MONO, fontSize: 28, color: g.dim }}>{i + 1}</span>
            <span style={{ fontSize: 34, fontWeight: i === 0 ? 600 : 500 }}>{t.name}</span>
            <span style={{ display: "block", height: 18, borderRadius: 999, background: g.rule }}><span style={{ display: "block", width: `${t.pct}%`, height: 18, borderRadius: 999, background: g.ink }} /></span>
            <span style={{ fontFamily: MONO, fontSize: 30, textAlign: "right" }}>{t.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
