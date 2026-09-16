// Retreat: two open questions about AI, read for themes, on one projector screen.
//
// The answers and the themes live in retreat-answers.js. This page only counts
// and draws. Every size is in `u`, a hundredth of the largest 16:9 box that
// fits the window, so the page fills a projector at any resolution and never
// scrolls.

import { SAMPLE, QUESTIONS } from "./retreat-answers.js";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const INK = "#1c1917";
const INK2 = "#57534e";
const MUTED = "#6b655f";
const LINE = "#e3ded8";
const SOFT = "#ebe7e2";
const PAGE = "#fafaf9";
const CARD = "#ffffff";
const WARN = "#b45309";
const TONES = ["#9f1239", "#0f766e"];

const u = (n) => `calc(${n} * min(1vw, 1.7778vh))`;

// A theme's count comes from the tags. Its quote must come from an answer
// carrying the tag, and must appear in that answer exactly.
function read(q) {
  const themes = q.themes.map((t) => {
    const from = q.answers[t.quote.answer];
    if (!from || !from.tags.includes(t.id)) throw new Error(`Retreat: quote for "${t.label}" is not from an answer tagged ${t.id}`);
    if (!from.text.includes(t.quote.text)) throw new Error(`Retreat: quote for "${t.label}" is not word for word`);
    return { ...t, count: q.answers.filter((a) => a.tags.includes(t.id)).length, quote: t.quote.text };
  });
  return { ...q, total: q.answers.length, themes: themes.sort((a, b) => b.count - a.count) };
}

function Panel({ q, tone }) {
  const top = Math.max(...q.themes.map((t) => t.count));
  return (
    <section style={{ background: CARD, borderRadius: u(1.4), boxShadow: `0 0 0 1px ${LINE}`, padding: `${u(2)} ${u(2.6)}`,
      display: "flex", flexDirection: "column", gap: u(1.6), minHeight: 0 }}>
      <div>
        <div style={{ fontSize: u(1), fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: tone }}>{q.total} answers</div>
        <h2 style={{ margin: `${u(0.5)} 0 0`, fontSize: u(2.1), fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em", color: INK }}>{q.question}</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, gap: u(1) }}>
        {q.themes.map((t) => (
          <div key={t.id} style={{ display: "grid", gridTemplateColumns: `${u(4.6)} 1fr`, columnGap: u(1.4), alignItems: "start" }}>
            <div style={{ textAlign: "center", lineHeight: 1 }}>
              <div style={{ fontSize: u(3.4), fontWeight: 700, color: tone, letterSpacing: "-0.03em" }}>{t.count}</div>
              <div style={{ fontSize: u(0.95), color: MUTED, marginTop: u(0.3) }}>of {q.total}</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: u(1.6), fontWeight: 600, color: INK, lineHeight: 1.2 }}>{t.label}</div>
              <div style={{ height: u(0.55), borderRadius: 999, background: SOFT, margin: `${u(0.6)} 0 ${u(0.7)}` }}>
                <div style={{ width: `${(t.count / top) * 100}%`, height: "100%", borderRadius: 999, background: tone }} />
              </div>
              <div style={{ fontSize: u(1.25), lineHeight: 1.35, color: INK, fontStyle: "italic", borderLeft: `${u(0.25)} solid ${tone}`, paddingLeft: u(0.9) }}>
                “{t.quote}”
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function RetreatPage() {
  const questions = QUESTIONS.map(read);
  return (
    <div style={{ height: "100vh", overflow: "hidden", background: PAGE, fontFamily: F, color: INK, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" />
      <div style={{ width: u(100), height: u(56.25), boxSizing: "border-box", padding: `${u(2)} ${u(3)}`, display: "flex", flexDirection: "column", gap: u(1.6) }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: u(1.2), fontWeight: 600, color: INK2 }}>Department Retreat - Questions about AI Usage</div>
          {SAMPLE ? (
            <div style={{ fontSize: u(1.1), fontWeight: 600, color: WARN, background: "#fdf5ea", borderRadius: 999, padding: `${u(0.3)} ${u(1)}` }}>Sample answers</div>
          ) : null}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: u(2), flex: 1, minHeight: 0 }}>
          {questions.map((q, i) => <Panel key={q.id} q={q} tone={TONES[i % TONES.length]} />)}
        </div>
      </div>
    </div>
  );
}
