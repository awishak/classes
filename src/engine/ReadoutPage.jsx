// What the class wrote on a worksheet: /<class>/worksheets/<key>/readout.
//
// Andrew, 2026-09-29, after the COMM 118 stakeholder map: "i want this stuff
// on the worksheet page. like give me a link to this so i can share with the
// class", and "click on one of the connections in the worksheet and it will
// bring all this stuff up. but i want this page."
//
// So the page is the map, drawn once for the whole class, and under it the
// readout: across the whole sheet, then every box, card and connection with
// its themes, counts, answers worth reading aloud and gaps. A click on a line
// or a card in the map jumps to that one. No student names are on the page;
// the quotes are anonymous and exactly as written.
//
// The readout is a written analysis kept in src/readouts, one file per class
// and worksheet. Signing in is required, as it is for the worksheet itself.

import { useEffect, useRef, useState } from "react";
import { mountSheet, WORKSHEETS, BOX_LABELS } from "@ishak/worksheets";
import { useClassState } from "./store.js";
import { rosterOf } from "./roster.js";
import { useSession, studentFor } from "./session.js";
import * as TOKENS from "./tokens.js";
import { useStudentTheme, useDayNight, ThemeStyle } from "./ThemeShell.jsx";
import { hasNight } from "./themes.js";
import { setClassFavicon } from "./favicon.js";
import TopNav, { NAV_STUDENT } from "./TopNav.jsx";

// One file per class and worksheet, loaded only on this page.
const READOUTS = {
  "comm118/stakeholder-map": () => import("../readouts/comm118-stakeholder-map.json"),
};
export const hasReadout = (classId, key) => !!READOUTS[classId + "/" + key];

const sheetThemeOf = (theme, mode) => !hasNight(theme) ? "light" : mode === "night" ? "dark" : mode === "day" ? "light" : undefined;
const idOf = (field) => "r-" + field.replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");

// The class's map: each line and card carries its most common themes, so the
// words moving along a line are what the class said it carries.
function mapRows(r) {
  const rows = [];
  r.connections.filter(s => s.field.startsWith("line:")).forEach(s => (s.themes || []).slice(0, 3).forEach((t, i) => rows.push({ id: s.field + i, field: s.field, value: t.theme })));
  r.cards.forEach(s => (s.themes || []).slice(0, 2).forEach((t, i) => rows.push({ id: s.field + i, field: s.field, value: t.theme })));
  return rows;
}

const CSS = `
.ro{max-width:1180px;margin:0 auto;padding:24px 16px 64px;display:grid;gap:32px}
.ro .top{display:grid;gap:8px}
.ro .eyebrow{font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted)}
.ro h1{margin:0;font-family:var(--font-display);font-size:28px;font-weight:700;letter-spacing:-.02em;text-wrap:balance;color:var(--text-primary)}
.ro .facts{font-size:13px;color:var(--text-muted);font-variant-numeric:tabular-nums}
.ro .map{display:grid;gap:8px}
.ro .map .hint{font-size:15px;color:var(--text-secondary)}
.ro .over{display:grid;gap:12px}
.ro h2{margin:0;font-size:22px;font-weight:600;color:var(--text-primary)}
.ro .over ol{margin:0;padding:0;list-style:none;display:grid;gap:12px;counter-reset:o}
.ro .over li{display:grid;grid-template-columns:28px minmax(0,1fr);gap:8px;max-width:72ch;font-size:17px;line-height:1.5;counter-increment:o}
.ro .over li::before{content:counter(o);font-size:15px;font-weight:600;color:var(--text-muted);padding-top:2px}
.ro .body{display:grid;grid-template-columns:230px minmax(0,1fr);gap:32px}
.ro nav{position:sticky;top:72px;align-self:start;max-height:calc(100vh - 88px);overflow:auto}
.ro .ng{display:grid;gap:2px;padding-bottom:16px}
.ro .nt{font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);padding:8px 8px 4px}
.ro .ni{font:inherit;font-size:15px;display:flex;justify-content:space-between;gap:8px;min-height:36px;align-items:center;padding:4px 8px;border:0;border-radius:8px;background:transparent;color:var(--text-secondary);cursor:pointer;text-align:left;width:100%}
.ro .ni:hover,.ro .ni[aria-current="true"]{background:var(--surface-card);color:var(--text-primary)}
.ro .ni[aria-current="true"]{font-weight:600}
.ro .ni i{font-style:normal;font-size:13px;color:var(--text-muted);font-variant-numeric:tabular-nums}
.ro .grp{display:grid;gap:16px;padding-bottom:32px}
.ro .sec{background:var(--surface-card);border:1px solid var(--line-soft);border-radius:16px;padding:20px;display:grid;gap:12px;min-width:0;scroll-margin-top:80px;transition:box-shadow .3s}
.ro .sec.on{box-shadow:0 0 0 2px var(--accent)}
.ro .sh{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
.ro .sh h3{margin:0;font-size:20px;font-weight:600;color:var(--text-primary)}
.ro .meta{font-size:13px;color:var(--text-muted);font-variant-numeric:tabular-nums}
.ro .sum{margin:0;max-width:72ch;font-size:17px;line-height:1.5;color:var(--text-primary)}
.ro .themes{list-style:none;margin:0;padding:0;display:grid}
.ro .theme{display:grid;grid-template-columns:112px minmax(0,1fr);gap:16px;padding:12px 0;border-top:1px solid var(--line-soft)}
.ro .tc{display:grid;grid-template-columns:28px 1fr;gap:8px;align-items:center;align-self:start;padding-top:3px}
.ro .num{font-size:15px;font-weight:600;color:var(--text-primary);text-align:right;font-variant-numeric:tabular-nums}
.ro .bar{height:8px;background:var(--surface-sunk);border-radius:999px;overflow:hidden}
.ro .bar i{display:block;height:100%;background:var(--accent);border-radius:999px}
.ro .tb{display:grid;gap:4px;min-width:0}
.ro .tb h4{margin:0;font-size:17px;font-weight:600;color:var(--text-primary)}
.ro .note{margin:0;font-size:15px;color:var(--text-secondary);max-width:72ch}
.ro .ex{margin:4px 0 0;padding:0;list-style:none;display:grid;gap:4px}
.ro .ex li{font-size:15px;color:var(--text-secondary);padding-left:12px;border-left:2px solid var(--line-strong);overflow-wrap:anywhere;max-width:72ch}
.ro h5{margin:0;font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted)}
.ro .stand,.ro .gaps{display:grid;gap:8px;padding-top:12px;border-top:1px solid var(--line-soft)}
.ro blockquote{margin:0;font-size:17px;line-height:1.45;color:var(--text-primary);background:var(--surface-sunk);border-radius:12px;padding:12px 16px;overflow-wrap:anywhere;max-width:72ch}
.ro .gaps p{margin:0;font-size:15px;color:var(--text-secondary);max-width:72ch}
.ro .foot{font-size:13px;color:var(--text-muted)}
.ro .ni:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media (max-width:860px){.ro .body{grid-template-columns:1fr}.ro nav{display:none}.ro .theme{grid-template-columns:1fr;gap:8px}.ro .tc{grid-template-columns:28px 112px}.ro .sec{padding:16px}}
@media (prefers-reduced-motion: reduce){.ro .sec{transition:none}}
`;

function Section({ s, on }) {
  const max = Math.max(1, ...(s.themes || []).map(t => t.count));
  return (
    <section id={idOf(s.field)} className={"sec" + (on ? " on" : "")}>
      <header className="sh">
        <h3>{s.label}</h3>
        <span className="meta">{[s.students != null ? plural(s.students, "student") : "", s.answers != null ? plural(s.answers, "answer") : ""].filter(Boolean).join(" · ")}</span>
      </header>
      <p className="sum">{s.summary}</p>
      {(s.themes || []).length ? (
        <ol className="themes">
          {s.themes.map(t => (
            <li className="theme" key={t.theme}>
              <div className="tc"><span className="num">{t.count}</span><span className="bar"><i style={{ width: Math.round(t.count / max * 100) + "%" }} /></span></div>
              <div className="tb">
                <h4>{t.theme}</h4>
                {t.note ? <p className="note">{t.note}</p> : null}
                {(t.examples || []).length ? <ul className="ex">{t.examples.map((e, i) => <li key={i}>{e}</li>)}</ul> : null}
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      {(s.standouts || []).length ? <div className="stand"><h5>Worth reading aloud</h5>{s.standouts.map((q, i) => <blockquote key={i}>{q}</blockquote>)}</div> : null}
      {s.gaps ? <div className="gaps"><h5>Gaps</h5><p>{s.gaps}</p></div> : null}
    </section>
  );
}

export default function ReadoutPage({ config, worksheetKey }) {
  const [data] = useClassState(config.storageKey);
  const { session, email, instructor } = useSession();
  const [theme] = useStudentTheme(config);
  const [mode] = useDayNight(config);
  const sheet = WORKSHEETS.find(w => w.key === worksheetKey);
  const [r, setR] = useState(null);
  const [pick, setPick] = useState("");
  const mapRef = useRef(null);
  const load = READOUTS[config.id + "/" + worksheetKey];

  useEffect(() => {
    document.title = config.code + " · " + (sheet ? sheet.title : "Worksheet");
    setClassFavicon(config);
  }, [config, sheet]);
  useEffect(() => { if (load) load().then(m => setR(m.default || m)); }, [load]);

  const roster = rosterOf(config, data);
  const allowed = session && (instructor || studentFor(email, roster));

  // The map, once the readout and the page are here. A click jumps to the section.
  useEffect(() => {
    if (!r || !allowed || !mapRef.current) return undefined;
    const rows = mapRows(r);
    const own = (sheet && sheet.theme) || {};
    const m = mountSheet(mapRef.current, {
      store: { async load() { return { answers: rows, submitted_at: null }; } },
      readOnly: true, mapOnly: true, still: true, theme: sheetThemeOf(theme, mode),
      accent: own.accent || config.accent, accentLight: own.accentLight, vars: own.vars, dark: own.dark || { accent: config.accentDark },
      onPick: (field) => go(field),
    });
    return () => m.destroy();
  }, [r, allowed, theme, mode]);   // eslint-disable-line react-hooks/exhaustive-deps

  const go = (field) => {
    const known = r && [...r.boxes, ...r.cards, ...r.connections].some(s => s.field === field);
    const target = known ? field : "other";
    setPick(target);
    const el = document.getElementById(idOf(target));
    if (el) el.scrollIntoView({ behavior: TOKENS.REDUCED ? "auto" : "smooth", block: "start" });
  };

  const next = typeof window !== "undefined" ? window.location.pathname : config.path;
  let gate = null;
  if (!load || !sheet) gate = <p style={{ fontSize: 17, margin: 0 }}>There is no readout at this address.</p>;
  else if (!session) gate = (<>
    <p style={{ fontSize: 17, margin: "0 0 12px" }}>This page runs on your email sign-in.</p>
    <a className="ca-focus" href={"/login?next=" + encodeURIComponent(next)} style={{ fontSize: 17, fontWeight: 600, color: config.accent }}>Sign in</a>
  </>);
  else if (!allowed) gate = data === null
    ? <p style={{ fontSize: 17, margin: 0 }}>Loading the roster.</p>
    : <p style={{ fontSize: 17, margin: 0 }}>{email} is not on the roster for {config.code} yet.</p>;
  else if (!r) gate = <p style={{ fontSize: 17, margin: 0 }}>Loading.</p>;

  const navGroup = (title, list) => (
    <div className="ng">
      <div className="nt">{title}</div>
      {list.map(s => (
        <button type="button" key={s.field} className="ni" aria-current={pick === s.field ? "true" : undefined} onClick={() => go(s.field)}>
          <span>{s.label}</span><i>{s.answers ?? ""}</i>
        </button>
      ))}
    </div>
  );

  return (
    <div data-theme={theme} data-mode={mode} style={{ minHeight: "100vh", background: TOKENS.SURFACE.page, color: TOKENS.TEXT.primary, fontFamily: TOKENS.FONT.body, "--accent": config.accent }}>
      <ThemeStyle theme={theme} />
      <style>{CSS}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 30 }}>
        <TopNav config={config} tabs={NAV_STUDENT} active="assignments" />
      </div>
      {gate ? <div style={{ padding: 32 }}>{gate}</div> : (
        <div className="ro">
          <header className="top">
            <div className="eyebrow">{config.code}</div>
            <h1>{sheet.title}</h1>
            <div className="facts">{plural(r.students, "student")} · {r.answers.toLocaleString("en-US")} answers</div>
          </header>
          <div className="map">
            <div className="hint">Click a line or a card to read what the class wrote on that line or card.</div>
            <div ref={mapRef} />
          </div>
          <section className="over">
            <h2>Across the whole sheet</h2>
            <ol>{r.overview.map((o, i) => <li key={i}><span>{o}</span></li>)}</ol>
          </section>
          <div className="body">
            <nav aria-label="Sections">
              {navGroup(Object.values(BOX_LABELS).join(", "), r.boxes)}
              {navGroup("Cards", r.cards)}
              {navGroup("Connections", r.connections)}
            </nav>
            <main>
              <div className="grp">{r.boxes.map(s => <Section key={s.field} s={s} on={pick === s.field} />)}</div>
              <div className="grp"><h2>Cards</h2>{r.cards.map(s => <Section key={s.field} s={s} on={pick === s.field} />)}</div>
              <div className="grp"><h2>Connections</h2>{r.connections.map(s => <Section key={s.field} s={s} on={pick === s.field} />)}</div>
              <p className="foot">Counts are answers, not students. Quotes are exactly as students wrote each answer, without names.</p>
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
