// The poll panel. Runs the Peer Instruction cycle from the dashboard while the
// room screen shows the question and, at the end, what moved between rounds.

import { useState } from "react";
import { tally, written, isFreeForm } from "./poll.js";
import * as TOKENS from "./tokens.js";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const INK = TOKENS.TEXT.primary;
const INK2 = TOKENS.TEXT.secondary;
const MUTED = TOKENS.TEXT.muted; // 4.85:1 at worst, on every background we use. #9ca3af was 2.54:1 and failed AA.
const LINE = TOKENS.LINE.soft;
const LINE2 = TOKENS.LINE.strong;
const SURFACE_2 = TOKENS.SURFACE.sunk;
const OK = TOKENS.STATE.ok;

const label = { fontFamily: MONO, fontSize: 12, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: ".12em" };
const mini = { minHeight: 34, padding: "0 12px", borderRadius: 8, border: "1px solid " + LINE2, background: "#fff", color: INK2, fontFamily: F, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const solid = (a) => ({ ...mini, background: a, borderColor: a, color: "#fff" });
const inputStyle = { width: "100%", padding: "9px 11px", borderRadius: 9, border: "1px solid " + LINE2, fontFamily: F, fontSize: 16, minHeight: 40, background: "#fff", color: INK };
const LETTERS = ["A", "B", "C", "D", "E"];

// A spread of votes as bars. `compare` draws the first round behind as a ghost
// so the shift between rounds is the thing you actually see.
export function Wrote({ votes }) {
  const rows = written(votes);
  if (!rows.length) return <div style={{ fontSize: 15, color: MUTED }}>Nothing in yet.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ padding: "8px 10px", borderRadius: 9, background: "#f4f3f1" }}>
          <div style={{ fontSize: 14.5, lineHeight: 1.4, color: INK, wordBreak: "break-word" }}>{r.text}</div>
          <div style={{ ...label, fontSize: 11, marginTop: 3 }}>{r.who}</div>
        </div>
      ))}
      <div style={{ ...label, fontSize: 11 }}>{rows.length} in</div>
    </div>
  );
}

export function Spread({ votes, options, accent, correct, compare }) {
  const { counts, total } = tally(votes, options.length);
  const base = compare ? tally(compare, options.length) : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {options.map((o, i) => {
        const pct = total ? Math.round((counts[i] / total) * 100) : 0;
        const wasPct = base && base.total ? Math.round((base.counts[i] / base.total) * 100) : null;
        const right = correct === i;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ ...label, width: 14, color: right ? OK : MUTED }}>{LETTERS[i]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: INK, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o}</div>
              <div style={{ position: "relative", height: 8, borderRadius: 4, background: SURFACE_2, overflow: "hidden" }}>
                {wasPct != null ? <i style={{ position: "absolute", inset: 0, width: wasPct + "%", background: LINE2 }} /> : null}
                <i style={{ position: "absolute", inset: 0, width: pct + "%", background: right ? OK : accent, opacity: right ? 1 : .85 }} />
              </div>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 12, color: MUTED, width: 62, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              {wasPct != null ? wasPct + "→" : ""}{pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Enforced everywhere a headline is written: one sentence, nothing after it.
export function oneSentence(text) {
  const t = (text || "").trim().replace(/\s+/g, " ");
  if (!t) return "";
  const m = t.match(/^[^.!?]*[.!?]/);
  const first = (m ? m[0] : t).trim();
  return /[.!?]$/.test(first) ? first : first + ".";
}

export default function PollPanel({ poll, start, setPhase, setCorrect, clear, roster, accent, onCast }) {
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState(["", "", ""]);
  // Peer Instruction wants options, because the second vote only means
  // something if there is something to move between. "What was the muddiest
  // point" wants their words instead.
  const [freeForm, setFreeForm] = useState(false);

  if (!poll) return <div style={{ fontSize: 15, color: MUTED }}>Loading…</div>;

  const setOpt = (i, v) => setOpts(o => o.map((x, j) => j === i ? v : x));
  const clean = opts.map(o => o.trim()).filter(Boolean);
  const canStart = q.trim().length > 3 && (freeForm || clean.length >= 2);

  const begin = () => {
    start(oneSentence(q), freeForm ? [] : clean);
    onCast();
    setQ(""); setOpts(["", "", ""]);
  };

  // ─── nothing running: write one ───
  if (poll.phase === "idle") {
    return (
      <>
        <div style={{ fontSize: 15, color: MUTED, lineHeight: 1.5 }}>
          Ask, let them commit alone, let them argue, ask again. Aim for a question a third to two thirds get right the first time.
        </div>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="The question, in one sentence" style={inputStyle} />
        {opts.map((o, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ ...label, width: 14 }}>{LETTERS[i]}</span>
            <input value={o} onChange={e => setOpt(i, e.target.value)} placeholder={i < 2 ? "Answer" : "Answer (optional)"} style={inputStyle} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 7 }}>
          <button onClick={begin} disabled={!canStart} style={canStart ? solid(accent) : { ...mini, opacity: .45 }}>Open the floor</button>
          {opts.length < 5 ? <button style={mini} onClick={() => setOpts(o => [...o, ""])}>+ Answer</button> : null}
        </div>
      </>
    );
  }

  const voting = poll.phase === "vote1" || poll.phase === "vote2";
  const round = poll.phase === "vote2" || poll.phase === "done" ? "r2" : "r1";
  const votes = poll[round] || {};
  const inCount = Object.keys(votes).length;

  return (
    <>
      <div style={{ fontSize: 15, fontWeight: 500, color: INK, lineHeight: 1.4 }}>{poll.question}</div>

      {poll.phase === "done" ? (
        <>
          <div style={label}>{isFreeForm(poll) ? "What they wrote" : "Second vote, with the first vote behind"}</div>
          {isFreeForm(poll)
            ? <Wrote votes={{ ...poll.r1, ...poll.r2 }} />
            : <Spread votes={poll.r2} compare={poll.r1} options={poll.options} accent={accent} correct={poll.correct} />}
        </>
      ) : (
        isFreeForm(poll) ? <Wrote votes={votes} /> : <Spread votes={votes} options={poll.options} accent={accent}
          correct={poll.phase === "discuss" ? poll.correct : null} />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: MONO, fontSize: 12, color: voting ? accent : MUTED, fontVariantNumeric: "tabular-nums" }}>
          {inCount} of {roster || "—"} in{voting ? "" : " · floor closed"}
        </span>
      </div>

      {poll.phase === "discuss" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <span style={label}>Which one is right?</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {poll.options.map((o, i) => (
              <button key={i} onClick={() => setCorrect(poll.correct === i ? null : i)}
                style={poll.correct === i ? { ...mini, background: OK, borderColor: OK, color: "#fff" } : mini}>{LETTERS[i]}</button>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {poll.phase === "vote1" ? <button style={solid(accent)} onClick={() => setPhase("discuss")}>Close it · let them argue</button> : null}
        {poll.phase === "discuss" ? <button style={solid(accent)} onClick={() => setPhase("vote2")}>Ask again</button> : null}
        {poll.phase === "vote2" ? <button style={solid(accent)} onClick={() => setPhase("done")}>Show what moved</button> : null}
        {poll.phase === "done" ? <button style={solid(accent)} onClick={clear}>New question</button> : null}
        {poll.phase !== "done" ? <button style={mini} onClick={clear}>Drop the poll</button> : null}
      </div>
    </>
  );
}
