// Sit-Down 1, the role each student plays at their table:
// /<class>/worksheets/worktopia/roles. The instructor's, behind the gate.
//
// Andrew, 2026-10-13: "we should figure out their roles. if they have a first
// role they want that works, let's do that. if you have questions about which
// role to choose, ask me. i'd like you to make me an html page to make these
// decisions." And: "role will eventually go to students and their pod."
//
// One card per session, in session order. Each student shows their three
// Worktopia positions with the suggestion marked; a click on another one
// makes it theirs and saves it to the plan row as `sitdownRoles`. Under the
// people, the pull between every two roles at the table, drawn from the
// fields in worktopia/roles.js, so a switch redraws the lines. The ideas for
// how a field changes are Andrew's prompts; the students work it out.

import { useEffect, useMemo, useState } from "react";
import { useClassData } from "./store.js";
import { rosterOf } from "./roster.js";
import { authHeaders } from "./session.js";
import { savedPin } from "../InstructorGate.jsx";
import { QUESTIONS } from "./worktopia/terminal.js";
import { SESSIONS, rosterName } from "./worktopia/sitdown.js";
import { FIELDS, CHANGES, pullOf, pickOf, roleAt } from "./worktopia/roles.js";
import * as TOKENS from "./tokens.js";
import { useStudentTheme, useDayNight, ThemeStyle } from "./ThemeShell.jsx";
import { setClassFavicon } from "./favicon.js";
import TopNav, { NAV_STUDENT } from "./TopNav.jsx";

const LETTERS = ["a", "b", "c"];
const emailOf = (s) => String(s?.email || "").trim().toLowerCase();
const same = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();

// The role a student holds: Andrew's letter if he set one, else the suggestion.
function chosen(name, saved) {
  const letter = saved?.[name] || pickOf(name)?.pick || "a";
  return { letter, set: !!saved?.[name], role: roleAt(name, letter) };
}

export default function SitdownRolesPage({ config }) {
  const [data, update] = useClassData(config.storageKey);
  const [theme] = useStudentTheme(config);
  const [mode] = useDayNight(config);
  const [out, setOut] = useState(null);
  const [failed, setFailed] = useState("");

  useEffect(() => {
    document.title = config.code + " · Sit-Down roles";
    setClassFavicon(config);
  }, [config]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/worktopia-answers", {
          method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
          body: JSON.stringify({ pin: savedPin(), groupKey: config.id, storageKey: config.storageKey }),
        });
        const body = await r.json().catch(() => null);
        if (!alive) return;
        if (body?.ok && body.named) setOut(body); else setFailed(body?.error || "The files need the instructor's sign-in.");
      } catch { if (alive) setFailed("Could not read the files."); }
    })();
    return () => { alive = false; };
  }, [config.id, config.storageKey]);

  const roster = rosterOf(config, data);
  const saved = data?.sitdownRoles || {};
  // A student's file, by the roster name the sessions use.
  const fileOf = useMemo(() => {
    const nameOf = new Map(roster.map(s => [emailOf(s), s.name]));
    const by = new Map();
    (out?.sheets || []).forEach(f => { const n = nameOf.get(f.viewer) || f.answers.name || ""; if (n) by.set(n.trim().toLowerCase(), f); });
    return (name) => by.get(name.trim().toLowerCase()) || by.get(rosterName(name).trim().toLowerCase()) || null;
  }, [out, roster]);

  const setRole = (name, letter) => update(d => ({ ...d, sitdownRoles: { ...(d.sitdownRoles || {}), [name]: letter } }));
  const clearRole = (name) => update(d => { const next = { ...(d.sitdownRoles || {}) }; delete next[name]; return { ...d, sitdownRoles: next }; });
  const all = SESSIONS.flatMap(s => s.names);
  const setCount = all.filter(n => saved[n]).length;
  const keepAll = () => update(d => {
    const next = { ...(d.sitdownRoles || {}) };
    all.forEach(n => { if (!next[n]) next[n] = pickOf(n)?.pick || "a"; });
    return { ...d, sitdownRoles: next };
  });

  return (
    <div data-theme={theme} data-mode={mode} style={{ minHeight: "100vh", background: TOKENS.SURFACE.page, color: TOKENS.TEXT.primary, fontFamily: TOKENS.FONT.body, "--accent": config.accent }}>
      <ThemeStyle theme={theme} />
      <style>{CSS}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 30 }}>
        <TopNav config={config} tabs={NAV_STUDENT} active="assignments" />
      </div>
      <div className="sr">
        <header className="top">
          <div className="eyebrow">{config.code}</div>
          <h1>Sit-Down 1 roles</h1>
          <p className="facts">Each student plays one of their three Worktopia positions. The marked one is the suggestion. Click another position to switch, and the lines at the table redraw. Students do not see this page.</p>
          <div className="bar">
            <span className="meta">{setCount + " of " + all.length + " set"}</span>
            {setCount < all.length ? <button type="button" className="btn" onClick={keepAll}>Keep every suggestion</button> : null}
          </div>
          {failed ? <p className="warn">{failed + " The suggestions still show; the positions as written need the files."}</p> : !out ? <p className="meta">Reading the files.</p> : null}
        </header>
        {SESSIONS.map(s => (
          <Table key={s.key} session={s} saved={saved} fileOf={fileOf} onSet={setRole} onClear={clearRole} />
        ))}
      </div>
    </div>
  );
}

function Table({ session, saved, fileOf, onSet, onClear }) {
  const people = session.names.map(n => ({ name: n, ...chosen(n, saved) }));
  const pairs = [];
  people.forEach((a, i) => people.slice(i + 1).forEach(b => pairs.push([a, b])));
  return (
    <section className="sec">
      <header className="sh"><h2>{session.day + ", " + session.time}</h2></header>
      <div className="people">
        {people.map(p => <Person key={p.name} p={p} file={fileOf(p.name)} clash={people.some(o => o !== p && o.role?.field && o.role.field === p.role?.field)} onSet={onSet} onClear={onClear} />)}
      </div>
      <div className="pulls">
        <h3>How the roles pull on each other</h3>
        {pairs.map(([a, b]) => {
          const fa = a.role?.field, fb = b.role?.field;
          const line = fa && fb && fa === fb ? "Same field at one table. One of them should move to another position." : pullOf(fa, fb) || "No line written for these two yet.";
          return (
            <div key={a.name + b.name} className="pull">
              <div className="pair">{short(a) + " and " + short(b)}</div>
              <div className={"line" + (fa && fa === fb ? " bad" : "")}>{line}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const first = (name) => name.split(" ")[0];
const short = (p) => first(p.name) + " (" + (p.role?.role || "no role yet") + ")";

function Person({ p, file, clash, onSet, onClear }) {
  const [open, setOpen] = useState(false);
  const pick = pickOf(p.name);
  const titleAt = (l) => file?.answers["title:" + l] || roleAt(p.name, l)?.title || "";
  const field = p.role?.field;
  return (
    <div className={"person" + (clash ? " clash" : "")}>
      <div className="ph">
        <h3>{p.name}</h3>
        <span className={"tag" + (p.set ? " on" : "")}>{p.set ? "set" : "suggested"}</span>
      </div>
      <div className="role">{p.role ? p.role.role : "No role yet"}{field ? <span className="field">{FIELDS[field]}</span> : null}</div>
      <div className="opts">
        {LETTERS.map(l => (
          <button key={l} type="button" className={"opt" + (p.letter === l ? " on" : "")} aria-pressed={p.letter === l} onClick={() => onSet(p.name, l)}>
            <span className="l">{l.toUpperCase()}</span>
            <span>{titleAt(l) || "unnamed"}</span>
            {roleAt(p.name, l) && !same(roleAt(p.name, l).role, titleAt(l)) ? <span className="as">{"as " + roleAt(p.name, l).role}</span> : null}
          </button>
        ))}
      </div>
      {pick?.why ? <p className="why">{pick.why}</p> : null}
      {pick?.ask ? <p className="ask">{pick.ask}</p> : null}
      {p.set && differs(p, pick) ? <button type="button" className="lnk" onClick={() => onClear(p.name)}>Back to the suggestion</button> : null}
      {field && CHANGES[field] ? (
        <div className="ideas">
          <div className="q">How it might change, for prompting</div>
          <ul>{CHANGES[field].map(c => <li key={c}>{c}</li>)}</ul>
        </div>
      ) : null}
      {file ? <button type="button" className="lnk" onClick={() => setOpen(o => !o)}>{open ? "Hide what they wrote" : "What they wrote for " + p.letter.toUpperCase()}</button> : null}
      {open && file ? ["duties", "value", "why"].map(q => file.answers[q + ":" + p.letter] ? (
        <div key={q} className="qa"><div className="q">{QUESTIONS[q]}</div><div className="a">{file.answers[q + ":" + p.letter]}</div></div>
      ) : null) : null}
    </div>
  );
}

// Whether Andrew's letter differs from the suggestion, so going back means something.
const differs = (p, pick) => !!pick && p.letter !== pick.pick;

const CSS = `
.sr{max-width:1180px;margin:0 auto;padding:24px 16px 64px;display:grid;gap:24px}
.sr .top{display:grid;gap:8px}
.sr .eyebrow{font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted)}
.sr h1{margin:0;font-family:var(--font-display);font-size:28px;font-weight:700;letter-spacing:-.02em;color:var(--text-primary)}
.sr .facts{margin:0;font-size:15px;color:var(--text-secondary);max-width:72ch}
.sr .bar{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.sr .meta{font-size:13px;color:var(--text-muted);font-variant-numeric:tabular-nums}
.sr .warn{margin:0;font-size:15px;color:var(--text-primary)}
.sr .btn{font:inherit;font-size:14px;font-weight:600;color:var(--accent);background:transparent;border:1px solid var(--accent);border-radius:999px;padding:6px 14px;min-height:36px;cursor:pointer}
.sr .lnk{font:inherit;font-size:14px;font-weight:600;color:var(--accent);background:transparent;border:0;padding:0;cursor:pointer;min-height:32px;justify-self:start;text-align:left}
.sr .sec{background:var(--surface-card);border:1px solid var(--line-soft);border-radius:16px;padding:20px;display:grid;gap:16px;min-width:0}
.sr h2{margin:0;font-size:20px;font-weight:600;color:var(--text-primary)}
.sr .people{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.sr .person{border:1px solid var(--line-soft);border-radius:12px;padding:14px;display:grid;gap:10px;align-content:start;min-width:0}
.sr .person.clash{border-color:var(--accent)}
.sr .ph{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.sr .ph h3{margin:0;font-size:17px;font-weight:600;color:var(--text-primary)}
.sr .tag{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted)}
.sr .tag.on{color:var(--accent)}
.sr .role{font-size:18px;font-weight:600;color:var(--text-primary);display:grid;gap:2px}
.sr .field{font-size:13px;font-weight:500;color:var(--text-secondary)}
.sr .opts{display:grid;gap:6px}
.sr .opt{font:inherit;font-size:14px;text-align:left;color:var(--text-primary);background:transparent;border:1px solid var(--line-soft);border-radius:10px;padding:8px 10px;min-height:44px;cursor:pointer;display:grid;grid-template-columns:20px minmax(0,1fr);column-gap:8px;overflow-wrap:anywhere}
.sr .opt .l{font-weight:700;color:var(--text-muted)}
.sr .opt .as{grid-column:2;font-size:12px;color:var(--text-secondary)}
.sr .opt.on{border-color:var(--accent);background:var(--surface-sunk)}
.sr .opt.on .l{color:var(--accent)}
.sr .why,.sr .ask{margin:0;font-size:14px;line-height:1.45;color:var(--text-secondary)}
.sr .ask{color:var(--text-primary);font-weight:600}
.sr .ideas{display:grid;gap:4px}
.sr .ideas ul{margin:0;padding-left:18px;font-size:14px;line-height:1.45;color:var(--text-secondary)}
.sr .q{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted)}
.sr .qa{display:grid;gap:2px}
.sr .a{font-size:14px;line-height:1.45;color:var(--text-primary);white-space:pre-wrap;overflow-wrap:anywhere}
.sr .pulls{display:grid;gap:10px}
.sr .pulls h3{margin:0;font-size:16px;font-weight:600;color:var(--text-primary)}
.sr .pull{display:grid;grid-template-columns:minmax(0,260px) minmax(0,1fr);gap:12px;padding-top:10px;border-top:1px solid var(--line-soft)}
.sr .pair{font-size:14px;font-weight:600;color:var(--text-primary)}
.sr .line{font-size:15px;line-height:1.45;color:var(--text-secondary);max-width:72ch}
.sr .line.bad{color:var(--text-primary);font-weight:600}
@media (max-width:640px){.sr .pull{grid-template-columns:1fr;gap:4px}}
`;
