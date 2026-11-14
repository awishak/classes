// Andrew's review of the final project preferences: /<class>/worksheets/
// final-prefs?review.
//
// Andrew, 2026-11-13: "I need a really good review page. I need it full of
// color. I need it indicating things really well. Don't give me a bunch of
// text." And then: "I want student faces ... when I match students to ideas
// or to pairs, I want them to go, wow, this is really beautiful."
//
// So the class is a ring of faces. Each face is ringed in the colour of the
// student's work preference, and a line runs between any two people who
// picked each other, brighter the stronger the tie. Pressing a face opens
// that student beside the ring: their topics to approve (two at most), their
// strengths, the sites they like, and who they picked. Dragging one face
// onto another pairs the two, and paired faces move to sit side by side.
// The panel beside the ring, with nobody picked, is the pairs suggested by
// model.js, each with its sentence of why.
//
// Nothing here reaches a student until Release. The decisions are one private
// file through /api/final-project; a student's page asks that route for
// their own part and gets nothing back before the release.
//
// ?review&demo draws the same page on made-up sheets, with the class's own
// faces, and keeps its decisions in the browser.

import { useEffect, useMemo, useRef, useState } from "react";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { useClassState } from "../store.js";
import { usePhotos } from "../photos.js";
import { sectionsOf, sectionOf, isLurker } from "../sections.js";
import { idOf, nameShown } from "../roster.js";
import { StudentLink } from "../StudentPage.jsx";
import { loadFont } from "../audiostory/bits.jsx";
import { StudentPicker, pickedStudent, pickStudent } from "../audiostory/control.jsx";
import * as M from "./model.js";

const lower = (s) => String(s || "").trim().toLowerCase();
const when = (iso) => new Date(iso).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" });
const isDemo = () => typeof window !== "undefined" && /[?&]demo\b/.test(window.location.search);
const hueOf = (name) => { let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const initials = (name) => String(name || "").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();

// Made-up classmates, so the template class's ring is as full as a real one.
const EXTRAS = ["Ada Quill", "Bo Larkin", "Cy Marsh", "Dee Okafor", "Eli Trent", "Fay Monroe", "Gus Abel", "Hana Lim", "Ike Soto", "Joy Park", "Kai Reyes", "Lux Navarro", "Moe Darcy", "Nia Bell"];

const postSheets = async (body) => {
  const r = await fetch("/api/worksheet-submits", { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ pin: savedPin(), ...body }) });
  const out = await r.json().catch(() => null);
  if (!r.ok || !out || !out.ok) throw new Error(out?.error || "The server did not answer.");
  return out;
};
const fileUrl = (classId) => "/api/final-project?class=" + encodeURIComponent(classId) + (savedPin() ? "&pin=" + encodeURIComponent(savedPin()) : "");

/** The people of the class, each with their sheet read: live, or made up. */
function usePeople(config, worksheetKey, roster, data, photos, demo) {
  const [sheets, setSheets] = useState(demo ? [] : null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (demo) return undefined;
    let alive = true;
    const ask = () => {
      if (document.visibilityState === "hidden") return;
      postSheets({ groupKey: config.id, key: worksheetKey, all: true }).then(out => { if (alive) { setSheets(out.sheets); setError(""); } }).catch(e => { if (alive) setError(e.message); });
    };
    ask();
    const t = setInterval(ask, 20000);
    return () => { alive = false; clearInterval(t); };
  }, [config.id, worksheetKey, demo]);

  const people = useMemo(() => {
    let list = (roster || []).filter(s => !isLurker(s.name) && (demo || s.email));
    if (demo && list.length < 16) list = [...list, ...EXTRAS.slice(0, 24 - list.length).map(name => ({ name }))];
    const base = list.map(s => ({
      id: lower(s.email) || idOf(s), rid: idOf(s), student: s, name: s.name, shown: s.email || !demo ? nameShown(data, s.name) : s.name,
      section: sectionOf(s), photo: (photos || {})[s.name] || data?.profiles?.[s.name]?.avatar || "",
    }));
    // First names, with a last initial where two share one.
    const firsts = base.map(p => p.shown.split(" ")[0]);
    base.forEach((p, i) => { p.first = firsts.filter(f => f === firsts[i]).length > 1 ? firsts[i] + " " + (p.shown.split(" ").slice(-1)[0][0] || "") : firsts[i]; });
    const byName = new Map(base.map(p => [p.name, p.id]));
    const made = demo ? M.demoSheets(base, config.id) : null;
    const byEmail = new Map((sheets || []).map(s => [lower(s.viewer_id), s]));
    return base.map(p => {
      const sheet = demo ? (made[p.id] ? { submitted_at: "2026-11-18T22:10:00Z", answers: made[p.id] } : null) : byEmail.get(p.id) || null;
      const a = M.readAnswers(sheet && sheet.submitted_at ? sheet.answers : {});
      return { ...p, state: sheet?.submitted_at ? "in" : sheet ? "started" : "none", at: sheet?.submitted_at || "", ...a, top: byName.get(a.top) || "", also: a.also.map(n => byName.get(n)).filter(Boolean) };
    });
  }, [roster, data, photos, sheets, demo, config.id]);
  return [people, sheets === null, error];
}

/** The decisions file, and a way to change the file that saves the change. */
function useFile(config, demo) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const timer = useRef(null);
  const key = "fp-demo:" + config.id;
  useEffect(() => {
    let alive = true;
    if (demo) { let got = null; try { got = JSON.parse(localStorage.getItem(key) || "null"); } catch { /* a fresh demo */ } setFile(M.tidyFile(got)); return undefined; }
    (async () => {
      try {
        const r = await fetch(fileUrl(config.id), { headers: await authHeaders() });
        const out = await r.json().catch(() => null);
        if (!alive) return;
        if (!r.ok || !out?.ok) { setStatus(out?.error || "The decisions could not be read."); return; }
        setFile(M.tidyFile(out.file));
      } catch { if (alive) setStatus("The decisions could not be read."); }
    })();
    return () => { alive = false; };
  }, [config.id, demo, key]);
  const push = async (next) => {
    if (demo) { try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* the demo keeps going unsaved */ } return; }
    setStatus("Saving");
    try {
      const r = await fetch(fileUrl(config.id), { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ pin: savedPin(), file: next }) });
      const out = await r.json().catch(() => null);
      setStatus(r.ok && out?.ok ? "Saved" : "Not saved: " + (out?.error || "the server did not answer"));
    } catch { setStatus("Not saved. Check the connection."); }
  };
  const change = (fn) => setFile(f => {
    const next = fn(f);
    if (!next || next === f) return f;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => push(next), 350);
    return next;
  });
  return [file, change, status];
}

function Disc({ p, size }) {
  const h = hueOf(p.name);
  return (
    <span className="fp-disc" style={{ width: size, height: size, fontSize: Math.round(size * 0.36), background: `linear-gradient(135deg, hsl(${h} 72% 58%), hsl(${(h + 48) % 360} 68% 38%))` }}>
      {p.photo ? <img src={p.photo} alt="" draggable={false} /> : initials(p.shown)}
    </span>
  );
}
const workClass = (p) => (p.state === "in" && p.work ? " fp-w-" + p.work : " fp-w-none");

// ─── the ring ───

// Pairs first, each two side by side; then the suggested pairs, each two
// side by side as well, so a tie is a short line and not a chord across the
// class (Andrew, 2026-11-13: "the ring should be organized by your suggested
// pairs"); then the people not placed yet; then the people working alone. A change of place is a change of order, and the
// faces slide to it.
function orderOf(people, file, suggested) {
  const byId = new Map(people.map(p => [p.id, p]));
  const name = (x, y) => x.shown.localeCompare(y.shown);
  const pairs = file.pairs.filter(([a, b]) => byId.has(a) && byId.has(b)).map(([a, b]) => [byId.get(a), byId.get(b)].sort(name)).sort((x, y) => name(x[0], y[0]));
  const inPair = new Set(pairs.flat().map(p => p.id));
  const solo = people.filter(p => !inPair.has(p.id) && file.solo.includes(p.id)).sort(name);
  const sug = suggested.filter(s => byId.has(s.a) && byId.has(s.b) && !inPair.has(s.a) && !inPair.has(s.b)).map(s => [byId.get(s.a), byId.get(s.b)]);
  const inSug = new Set(sug.flat().map(p => p.id));
  const open = people.filter(p => !inPair.has(p.id) && !inSug.has(p.id) && !file.solo.includes(p.id)).sort(name);
  return { order: [...pairs.flat(), ...sug.flat(), ...open, ...solo.filter(p => !inSug.has(p.id))], inPair };
}

function Ring({ people, file, who, lit, burst, suggested, onPick, onDrop }) {
  const box = useRef(null);
  const [size, setSize] = useState(720);
  const [drag, setDrag] = useState(null);
  const dragRef = useRef(null);
  useEffect(() => {
    const fit = () => { if (box.current) setSize(Math.max(420, Math.min(box.current.clientWidth, window.innerHeight - 190))); };
    fit();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    if (ro && box.current) ro.observe(box.current);
    window.addEventListener("resize", fit);
    return () => { if (ro) ro.disconnect(); window.removeEventListener("resize", fit); };
  }, []);

  const { order, inPair } = useMemo(() => orderOf(people, file, suggested), [people, file, suggested]);
  const n = Math.max(order.length, 1);
  const c = size / 2;
  const gutter = 62;
  const face = Math.round(Math.max(34, Math.min(88, ((2 * Math.PI * (c - gutter - 30)) / n) * 0.68)));
  const R = c - gutter - face / 2;
  const step = (2 * Math.PI) / n;
  const pos = new Map();
  order.forEach((p, i) => {
    let t = -Math.PI / 2 + i * step;
    if (inPair.has(p.id)) { const firstOfPair = file.pairs.some(pr => pr.includes(p.id)) && order[i + 1] && M.partnerOf(file, p.id) === order[i + 1].id; t += (firstOfPair ? 1 : -1) * step * 0.16; }
    pos.set(p.id, { x: c + R * Math.cos(t), y: c + R * Math.sin(t), t });
  });
  const byId = new Map(people.map(p => [p.id, p]));

  // The lines. With nobody picked: every tie, the suggested ones bright, the
  // made pairs brightest. With a student picked: that student's picks and the
  // picks of them, and nothing else.
  const lines = [];
  const add = (a, b, cls, arrow) => {
    const p = pos.get(a), q = pos.get(b);
    if (!p || !q) return;
    // Two faces side by side are joined straight across, under the faces.
    if (!arrow && Math.hypot(p.x - q.x, p.y - q.y) < face * 2.4) {
      const nx = (p.x + q.x) / 2, ny = (p.y + q.y) / 2, dn = Math.hypot(c - nx, c - ny) || 1;
      const bow = cls.includes("fp-l-pair") ? 0 : face * 1.25;
      lines.push({ key: a + ">" + b + cls + Math.round(p.x) + Math.round(q.x), d: `M${p.x.toFixed(1)},${p.y.toFixed(1)} Q${(nx + ((c - nx) / dn) * bow).toFixed(1)},${(ny + ((c - ny) / dn) * bow).toFixed(1)} ${q.x.toFixed(1)},${q.y.toFixed(1)}`, cls: cls + " fp-l-near" });
      return;
    }
    const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
    const cx = c + (mx - c) * 0.32, cy = c + (my - c) * 0.32;
    const trim = (from, pad) => { const dx = cx - from.x, dy = cy - from.y, d = Math.hypot(dx, dy) || 1; return { x: from.x + (dx / d) * pad, y: from.y + (dy / d) * pad }; };
    const s = trim(p, face / 2 + 4), e = trim(q, face / 2 + (arrow ? 9 : 4));
    lines.push({ key: a + ">" + b + cls + Math.round(p.x) + Math.round(q.x), d: `M${s.x.toFixed(1)},${s.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${e.x.toFixed(1)},${e.y.toFixed(1)}`, cls, arrow });
  };
  const sugKeys = new Set(suggested.map(s => M.pairKey(s.a, s.b)));
  const focus = who && byId.get(who);
  const linked = new Set();
  if (focus) {
    people.forEach(q => {
      if (q.id === focus.id) return;
      const out = M.pickOf(focus, q), back = M.pickOf(q, focus);
      if (!out && !back) return;
      linked.add(q.id);
      if (out && back) add(focus.id, q.id, "fp-l-t" + M.tieOf(focus, q) + " fp-l-strong");
      else if (out) add(focus.id, q.id, "fp-l-out" + (out === "top" ? " fp-l-outtop" : ""), true);
      else add(q.id, focus.id, "fp-l-in", true);
    });
    const partner = M.partnerOf(file, focus.id);
    if (partner) { linked.add(partner); add(focus.id, partner, "fp-l-pair"); }
  } else {
    for (let i = 0; i < people.length; i++) for (let j = i + 1; j < people.length; j++) {
      const a = people[i], b = people[j];
      const key = M.pairKey(a.id, b.id);
      if (M.partnerOf(file, a.id) === b.id) { add(a.id, b.id, "fp-l-pair"); continue; }
      const tie = M.tieOf(a, b);
      if (!tie || a.section !== b.section) continue;
      const placed = M.placeOf(file, a.id) || M.placeOf(file, b.id);
      add(a.id, b.id, "fp-l-t" + tie + (lit === key ? " fp-l-strong fp-l-lit" : sugKeys.has(key) && !placed ? " fp-l-sug" : " fp-l-faint") + (lit && lit !== key ? " fp-l-hush" : ""));
    }
  }
  const litIds = lit ? lit.split("+") : [];

  const start = (e, id) => {
    if (e.button) return;
    const sx = e.clientX, sy = e.clientY;
    let moved = false;
    const rect = box.current.querySelector(".fp-stage").getBoundingClientRect();
    const move = (ev) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return;
      moved = true;
      const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
      let over = "", best = face * 0.8;
      pos.forEach((pt, pid) => { if (pid === id) return; const d = Math.hypot(pt.x - x, pt.y - y); if (d < best) { best = d; over = pid; } });
      dragRef.current = { id, x, y, over };
      setDrag(dragRef.current);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const d = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!moved) onPick(id === who ? "" : id);
      else if (d && d.over) onDrop(id, d.over);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const dragging = drag && byId.get(drag.id);
  const over = drag && drag.over && byId.get(drag.over);
  const clean = dragging && over ? !M.blockOf(dragging, over) : false;

  return (
    <div className="fp-ringbox" ref={box}>
      <div className={"fp-stage" + (focus ? " fp-focused" : "") + (drag ? " fp-dragging" : "")} style={{ width: size, height: size }}>
        <svg className="fp-lines" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <defs>
            <marker id="fp-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke" /></marker>
          </defs>
          <circle cx={c} cy={c} r={R} className="fp-orbit" />
          {lines.map(l => <path key={l.key} d={l.d} className={"fp-l " + l.cls} markerEnd={l.arrow ? "url(#fp-arrow)" : undefined} />)}
          {dragging ? <line x1={pos.get(drag.id).x} y1={pos.get(drag.id).y} x2={over ? pos.get(over.id).x : drag.x} y2={over ? pos.get(over.id).y : drag.y} className={"fp-l fp-l-drag" + (over ? (clean ? " fp-l-clean" : " fp-l-warn") : "")} /> : null}
        </svg>
        {order.map(p => {
          const pt = pos.get(p.id);
          const dim = (focus && p.id !== focus.id && !linked.has(p.id)) || (litIds.length && !litIds.includes(p.id));
          const lx = pt.x + Math.cos(pt.t) * (face / 2 + 14 + 20 * Math.abs(Math.cos(pt.t))), ly = pt.y + Math.sin(pt.t) * (face / 2 + 14 + 2 * Math.abs(Math.cos(pt.t)));
          const placed = M.placeOf(file, p.id);
          return (
            <div key={p.id}>
              <button type="button" className={"fp-face" + workClass(p) + (p.id === who ? " fp-sel" : "") + (dim ? " fp-dim" : "") + (placed ? " fp-" + placed : "") + (burst.includes(p.id) ? " fp-burst" : "") + (drag && drag.over === p.id ? (clean ? " fp-target" : " fp-target fp-warn") : "") + (drag && drag.id === p.id ? " fp-lift" : "")}
                style={{ left: pt.x - face / 2, top: pt.y - face / 2, width: face, height: face }}
                aria-label={p.shown} aria-pressed={p.id === who}
                onPointerDown={e => start(e, p.id)} onClick={e => { if (e.detail === 0) onPick(p.id === who ? "" : p.id); }}>
                <Disc p={p} size={face - 8} />
                {M.approvedOf(file, p.id).length ? <span className="fp-tick" aria-hidden="true">{M.approvedOf(file, p.id).length}</span> : null}
              </button>
              <span className={"fp-label" + (dim ? " fp-dim" : "") + (p.id === who ? " fp-sel" : "")} style={{ left: lx, top: ly }}>{p.first}</span>
            </div>
          );
        })}
        {dragging ? <span className="fp-ghost" style={{ left: drag.x, top: drag.y }}><Disc p={dragging} size={face} /></span> : null}
      </div>
    </div>
  );
}

// ─── the panel ───

function Duo({ a, b, size = 44 }) {
  return <span className="fp-duo"><span className={"fp-mini" + workClass(a)}><Disc p={a} size={size} /></span><span className={"fp-mini fp-second" + workClass(b)}><Disc p={b} size={size} /></span></span>;
}

function Overview({ people, file, sug, onLit, onPair, onPass, onSplit, onPick, onPairAll }) {
  const byId = new Map(people.map(p => [p.id, p]));
  const made = file.pairs.filter(([a, b]) => byId.has(a) && byId.has(b));
  const solo = file.solo.filter(id => byId.has(id) && !M.partnerOf(file, id));
  const inCount = people.filter(p => p.state === "in").length;
  const notIn = people.filter(p => p.state !== "in");
  const counts = M.WORK.map(w => ({ ...w, n: people.filter(p => p.state === "in" && p.work === w.id).length }));
  return (
    <div className="fp-over">
      <div className="fp-block">
        <div className="fp-workbar" role="img" aria-label={counts.map(w => w.short + " " + w.n).join(", ")}>
          {counts.filter(w => w.n).map(w => <span key={w.id} className={"fp-seg fp-w-" + w.id} style={{ flexGrow: w.n }}>{w.n}</span>)}
        </div>
        <ul className="fp-legend">
          {counts.map(w => <li key={w.id}><i className={"fp-dot fp-w-" + w.id} />{w.short}<b>{w.n}</b></li>)}
          <li><i className="fp-dot fp-w-none" />Not submitted<b>{people.length - inCount}</b></li>
        </ul>
      </div>

      {sug.pairs.length ? (
        <div className="fp-block">
          <div className="fp-bhead"><h2>Suggested pairs</h2><button type="button" className="fp-btn fp-go" onClick={onPairAll}>Pair all {sug.pairs.length}</button></div>
          {sug.pairs.map(s => {
            const a = byId.get(s.a), b = byId.get(s.b), key = M.pairKey(s.a, s.b);
            return (
              <div key={key} className={"fp-sug fp-tie" + s.tie} onMouseEnter={() => onLit(key)} onMouseLeave={() => onLit("")}>
                <Duo a={a} b={b} />
                <div className="fp-sugmain">
                  <p className="fp-names">{a.shown} <span>+</span> {b.shown}</p>
                  <p className="fp-why">{s.why}</p>
                  <div className="fp-acts">
                    <button type="button" className="fp-btn fp-go" onClick={() => onPair(s.a, s.b)}>Pair</button>
                    <button type="button" className="fp-btn" onClick={() => onPass(s.a, s.b)}>Pass</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {sug.maybe.length ? (
        <div className="fp-block">
          <div className="fp-bhead"><h2>One-way picks</h2></div>
          {sug.maybe.map(s => {
            const a = byId.get(s.a), b = byId.get(s.b), key = M.pairKey(s.a, s.b);
            return (
              <div key={key} className="fp-sug fp-oneway">
                <Duo a={a} b={b} size={36} />
                <div className="fp-sugmain">
                  <p className="fp-why">{s.why}</p>
                  <div className="fp-acts">
                    <button type="button" className="fp-btn" onClick={() => onPair(s.a, s.b)}>Pair anyway</button>
                    <button type="button" className="fp-btn" onClick={() => onPass(s.a, s.b)}>Pass</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {made.length ? (
        <div className="fp-block">
          <div className="fp-bhead"><h2>Pairs</h2></div>
          {made.map(([x, y]) => {
            const a = byId.get(x), b = byId.get(y);
            const n = M.approvedOf(file, x).length + M.approvedOf(file, y).length;
            return (
              <div key={x + y} className="fp-sug fp-made">
                <Duo a={a} b={b} size={36} />
                <div className="fp-sugmain">
                  <p className="fp-names"><button type="button" className="fp-link" onClick={() => onPick(a.id)}>{a.shown}</button> <span>+</span> <button type="button" className="fp-link" onClick={() => onPick(b.id)}>{b.shown}</button></p>
                  <p className="fp-why">{n ? n + (n === 1 ? " topic approved" : " topics approved") : "No topic approved yet"}</p>
                </div>
                <button type="button" className="fp-btn" onClick={() => onSplit(x)}>Split</button>
              </div>
            );
          })}
        </div>
      ) : null}

      {solo.length ? (
        <div className="fp-block">
          <div className="fp-bhead"><h2>Individual</h2></div>
          <div className="fp-chips">{solo.map(id => <button key={id} type="button" className="fp-person" onClick={() => onPick(id)}><Disc p={byId.get(id)} size={26} />{byId.get(id).shown}</button>)}</div>
        </div>
      ) : null}

      {notIn.length ? (
        <div className="fp-block">
          <div className="fp-bhead"><h2>Not submitted</h2></div>
          <div className="fp-chips">{notIn.map(p => <span key={p.id} className="fp-person fp-off"><Disc p={p} size={26} />{p.shown}</span>)}</div>
        </div>
      ) : null}
    </div>
  );
}

function Reasons({ all, on, onPress }) {
  const [typed, setTyped] = useState("");
  const isOn = (r) => on.some(x => x.toLowerCase() === r.toLowerCase());
  const add = () => { const r = typed.replace(/\s+/g, " ").trim().slice(0, 140); if (!r) return; setTyped(""); if (!isOn(r)) onPress(all.find(x => x.toLowerCase() === r.toLowerCase()) || r); };
  return (
    <div className="fp-reasons">
      {all.map(r => <button key={r} type="button" className={"fp-reason" + (isOn(r) ? " fp-set" : "")} aria-pressed={isOn(r)} onClick={() => onPress(r)}>{r}</button>)}
      <form onSubmit={e => { e.preventDefault(); add(); }}>
        <input type="text" value={typed} maxLength={140} placeholder="add a reason" aria-label="Add a reason" onChange={e => setTyped(e.target.value)} />
      </form>
    </div>
  );
}

const hostOf = (site) => String(site || "").replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[/?#]/)[0];
const hrefOf = (site) => (/^https?:\/\//i.test(site) ? site : "https://" + site);

function Student({ config, p, people, file, change, onPick, onPair, flash }) {
  const [open, setOpen] = useState("");
  const [full, setFull] = useState("");
  const byId = new Map(people.map(x => [x.id, x]));
  const partner = byId.get(M.partnerOf(file, p.id));
  const place = M.placeOf(file, p.id);
  const approved = M.approvedOf(file, p.id);
  const reasons = M.reasonsOf(file);
  const picks = [p.top, ...p.also].map(id => byId.get(id)).filter(Boolean);
  const pickedBy = people.filter(q => q.id !== p.id && M.pickOf(q, p) && !M.pickOf(p, q));
  const press = (slot) => change(f => {
    const next = M.toggleTopic(f, p.id, slot);
    if (!next) { setFull(slot); setTimeout(() => setFull(""), 1600); return f; }
    return next;
  });
  const w = M.workOf(p.work);
  if (p.state !== "in") return (
    <div className="fp-student">
      <div className="fp-hero"><span className={"fp-mini fp-big" + workClass(p)}><Disc p={p} size={84} /></span><div><h2 className="fp-name">{p.shown}</h2><p className="fp-sub">{p.state === "started" ? "Started, not submitted" : "Not opened"}</p></div></div>
    </div>
  );
  return (
    <div className="fp-student" key={p.id}>
      <div className="fp-hero">
        <span className={"fp-mini fp-big" + workClass(p)}><Disc p={p} size={84} /></span>
        <div>
          <h2 className="fp-name">{p.student.email ? <StudentLink config={config} student={p.student} /> : p.shown}</h2>
          <p className="fp-sub">{w ? <span className={"fp-pill fp-w-" + w.id}>{w.short}</span> : null}{p.at ? <span>Submitted {when(p.at)}</span> : null}</p>
        </div>
      </div>

      <div className="fp-block">
        {partner ? (
          <div className="fp-sug fp-made">
            <Duo a={p} b={partner} size={40} />
            <div className="fp-sugmain"><p className="fp-names">Paired with <button type="button" className="fp-link" onClick={() => onPick(partner.id)}>{partner.shown}</button></p><p className="fp-why">{M.blockOf(p, partner) || M.whyOf(p, partner)}</p></div>
            <button type="button" className="fp-btn" onClick={() => change(f => M.splitUp(f, p.id))}>Split</button>
          </div>
        ) : (
          <div className="fp-placer">
            <button type="button" className={"fp-btn fp-solo" + (place === "solo" ? " fp-set" : "")} aria-pressed={place === "solo"} onClick={() => change(f => M.setSolo(f, p.id, place !== "solo"))}>{place === "solo" ? "Working individually" : "Set to individual"}</button>
          </div>
        )}
        {picks.map((q, i) => {
          const back = M.pickOf(q, p), block = M.blockOf(p, q), theirs = byId.get(M.partnerOf(file, q.id));
          return (
            <div key={q.id} className={"fp-pick" + (back ? " fp-mutual" : "")}>
              <button type="button" className={"fp-mini" + workClass(q)} onClick={() => onPick(q.id)} aria-label={q.shown}><Disc p={q} size={38} /></button>
              <div className="fp-sugmain">
                <p className="fp-names">{q.shown}{i === 0 && p.top === q.id ? <span className="fp-star">top choice</span> : null}</p>
                <p className="fp-why">{back ? (back === "top" ? "Picked " + p.first + " as top choice" : "Picked " + p.first + " back") : "Did not pick " + p.first}{theirs && theirs.id !== p.id ? ". Paired with " + theirs.first : ""}{block && back ? ". " + block : ""}</p>
              </div>
              {partner && partner.id === q.id ? null : <button type="button" className={"fp-btn" + (block ? "" : " fp-go")} onClick={() => onPair(p.id, q.id)}>{block ? "Pair anyway" : "Pair"}</button>}
            </div>
          );
        })}
        {pickedBy.length ? <div className="fp-chips fp-by"><span className="fp-k">Picked by</span>{pickedBy.map(q => <button key={q.id} type="button" className="fp-person" onClick={() => onPick(q.id)}><Disc p={q} size={24} />{q.first}</button>)}</div> : null}
      </div>

      <div className="fp-block">
        <div className="fp-bhead"><h2>Topics</h2><span className={"fp-count" + (full ? " fp-shake" : "")}>{approved.length} of {M.MAX_TOPICS} approved</span></div>
        {p.topics.map(t => {
          const on = approved.includes(t.slot), says = file.says?.[p.id]?.[t.slot] || [];
          return (
            <div key={t.slot} className={"fp-topic" + (on ? " fp-on" : "") + (full === t.slot ? " fp-shake" : "")}>
              {on ? <span className="fp-stamp">Approved</span> : null}
              <p className="fp-ttl">{t.topic || "Nothing written"}</p>
              {t.asks.length ? <ul className="fp-asks">{t.asks.map((q, i) => <li key={i}>{q}</li>)}</ul> : null}
              {says.length && open !== t.slot ? <p className="fp-said">{says.join(" · ")}</p> : null}
              <div className="fp-acts">
                <button type="button" className={"fp-btn" + (on ? "" : " fp-go")} disabled={!t.topic} onClick={() => press(t.slot)}>{on ? "Take back" : "Approve"}</button>
                <button type="button" className="fp-btn" aria-expanded={open === t.slot} onClick={() => setOpen(o => (o === t.slot ? "" : t.slot))}>Reasons</button>
              </div>
              {open === t.slot ? <Reasons all={reasons} on={says} onPress={r => change(f => M.toggleReason(f, p.id, t.slot, r))} /> : null}
            </div>
          );
        })}
        {partner && M.approvedOf(file, partner.id).length ? (
          <div className="fp-theirs">
            <span className="fp-k">{partner.first}'s approved topics</span>
            {M.approvedOf(file, partner.id).map(s => <p key={s} className="fp-ttl fp-small">{partner.topics.find(t => t.slot === s)?.topic}</p>)}
          </div>
        ) : null}
      </div>

      {p.strengths.length ? (
        <div className="fp-block">
          <div className="fp-bhead"><h2>Strengths</h2></div>
          <div className="fp-chips">{p.strengths.map(s => <span key={s} className="fp-strength" style={{ "--h": (M.STRENGTHS.indexOf(s) + 1) * 36 }}>{s}</span>)}</div>
        </div>
      ) : null}

      {p.sites.some(s => s.site) ? (
        <div className="fp-block">
          <div className="fp-bhead"><h2>Sites</h2></div>
          {p.sites.filter(s => s.site).map(s => (
            <div key={s.slot} className="fp-site">
              <span className="fp-sitemark" style={{ "--h": hueOf(hostOf(s.site)) }}>{(hostOf(s.site)[0] || "?").toUpperCase()}</span>
              <div className="fp-sugmain">
                <a className="fp-link" href={hrefOf(s.site)} target="_blank" rel="noreferrer">{hostOf(s.site)}</a>
                {s.like ? <p className="fp-why">{s.like}</p> : null}
                {s.build ? <p className="fp-why fp-build">{s.build}</p> : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {flash}
    </div>
  );
}

// ─── the page ───

export default function FinalReview({ config, worksheetKey, roster }) {
  const demo = isDemo();
  const [data] = useClassState(config.storageKey);
  const [photos] = usePhotos(config.storageKey);
  const [all, loading, error] = usePeople(config, worksheetKey, roster, data, photos, demo);
  const [file, change, status] = useFile(config, demo);
  const sections = sectionsOf(config);
  const [section, setSection] = useState(sections[0] || "");
  const [who, setWho] = useState(() => (typeof window !== "undefined" ? pickedStudent() : ""));
  const [lit, setLit] = useState("");
  const [burst, setBurst] = useState([]);
  const [ask, setAsk] = useState(null);
  const [releasing, setReleasing] = useState(false);
  useEffect(() => { loadFont(); }, []);

  const people = useMemo(() => all.filter(p => sections.length < 2 || !section || p.section === section), [all, section, sections.length]);
  const sug = useMemo(() => {
    if (!file) return { pairs: [], maybe: [] };
    const taken = new Set(people.filter(p => M.placeOf(file, p.id)).map(p => p.id));
    return M.suggest(people.filter(p => p.state === "in"), { taken, passed: new Set(file.passed) });
  }, [people, file]);

  if (error && loading) return <Shell><p className="fp-say">Could not read the sheets: {error}</p></Shell>;
  if (loading || !file) return <Shell><p className="fp-say">{status || "Loading the sheets."}</p></Shell>;

  const byId = new Map(people.map(p => [p.id, p]));
  const byRid = new Map(people.map(p => [p.rid, p]));
  const chosen = byRid.get(who) || null;
  const pick = (id) => { const p = byId.get(id); const rid = p ? p.rid : ""; setWho(rid); pickStudent(rid); setAsk(null); };
  const celebrate = (ids) => { setBurst(ids); setTimeout(() => setBurst([]), 1100); };
  const pair = (a, b) => { change(f => M.pairUp(f, a, b)); celebrate([a, b]); setAsk(null); setLit(""); };
  // A drop pairs two people outright when the pair is clean; otherwise the
  // page says why not and waits for him.
  const drop = (a, b) => { const why = M.blockOf(byId.get(a), byId.get(b)); if (why) setAsk({ a, b, why }); else pair(a, b); };
  const pairAll = () => { change(f => sug.pairs.reduce((g, s) => M.pairUp(g, s.a, s.b), f)); celebrate(sug.pairs.flatMap(s => [s.a, s.b])); };

  const inPairs = people.filter(p => M.placeOf(file, p.id) === "pair").length;
  const solo = people.filter(p => M.placeOf(file, p.id) === "solo").length;
  const open = people.filter(p => p.state === "in" && !M.placeOf(file, p.id)).length;
  const out = people.length - inPairs - solo - open;
  const decided = people.filter(p => M.decidedOf(file, p.id)).length;
  const menu = [...people].sort((x, y) => x.shown.localeCompare(y.shown)).map(p => ({ id: p.rid, name: p.shown, status: p.state !== "in" ? "Not submitted" : M.decidedOf(file, p.id) ? "Decided" : M.placeOf(file, p.id) ? "No topic yet" : "To place" }));

  return (
    <Shell>
      <header className="fp-top">
        <div className="fp-titles">
          <h1>{M.FINAL_PREFS_TITLE}{demo ? <span className="fp-pill fp-demo">Demo</span> : null}</h1>
          {sections.length > 1 ? <div className="fp-tabs" role="tablist">{sections.map(s => <button key={s} type="button" role="tab" aria-selected={s === section} className={"fp-tab" + (s === section ? " fp-set" : "")} onClick={() => { setSection(s); pick(""); }}>{s}</button>)}</div> : null}
        </div>
        <div className="fp-progress">
          <div className="fp-pbar" role="img" aria-label={inPairs + " in pairs, " + solo + " individual, " + open + " to place, " + out + " not submitted"}>
            {inPairs ? <span className="fp-p-pair" style={{ flexGrow: inPairs }} /> : null}
            {solo ? <span className="fp-p-solo" style={{ flexGrow: solo }} /> : null}
            {open ? <span className="fp-p-open" style={{ flexGrow: open }} /> : null}
            {out ? <span className="fp-p-out" style={{ flexGrow: out }} /> : null}
          </div>
          <ul className="fp-legend fp-row">
            <li><i className="fp-dot fp-p-pair" />In pairs<b>{inPairs}</b></li>
            <li><i className="fp-dot fp-p-solo" />Individual<b>{solo}</b></li>
            <li><i className="fp-dot fp-p-open" />To place<b>{open}</b></li>
            <li><i className="fp-dot fp-p-out" />Not submitted<b>{out}</b></li>
          </ul>
        </div>
        <div className="fp-tools">
          <StudentPicker people={menu} value={chosen ? chosen.rid : ""} onPick={(rid) => { setWho(rid); pickStudent(rid); }} />
          {file.released
            ? <button type="button" className="fp-btn fp-released" onClick={() => change(f => ({ ...f, released: false }))}>Released. Take back</button>
            : releasing
            ? <span className="fp-confirm">{decided} of {people.length} decided.<button type="button" className="fp-btn fp-go" onClick={() => { change(f => ({ ...f, released: true })); setReleasing(false); }}>Release to students</button><button type="button" className="fp-btn" onClick={() => setReleasing(false)}>Cancel</button></span>
            : <button type="button" className="fp-btn fp-release" onClick={() => setReleasing(true)}>Release</button>}
          <span className="fp-status" aria-live="polite">{demo ? "" : status}</span>
        </div>
      </header>

      <div className="fp-main">
        <div className="fp-left">
          <Ring people={people} file={file} who={chosen ? chosen.id : ""} lit={lit} burst={burst} suggested={sug.pairs} onPick={pick} onDrop={drop} />
          {ask ? (
            <div className="fp-ask" role="alertdialog" aria-label="Pair anyway">
              <Duo a={byId.get(ask.a)} b={byId.get(ask.b)} size={36} />
              <p>{ask.why}</p>
              <button type="button" className="fp-btn fp-go" onClick={() => pair(ask.a, ask.b)}>Pair anyway</button>
              <button type="button" className="fp-btn" onClick={() => setAsk(null)}>Cancel</button>
            </div>
          ) : null}
          <ul className="fp-legend fp-row fp-key">
            <li><i className="fp-line fp-l-t3" />Each other's top choice</li>
            <li><i className="fp-line fp-l-t2" />One top choice, picked back</li>
            <li><i className="fp-line fp-l-t1" />On each other's lists</li>
            <li><i className="fp-line fp-l-pair" />Paired</li>
          </ul>
        </div>
        <aside className="fp-panel">
          {chosen ? (
            <>
              <button type="button" className="fp-btn fp-back" onClick={() => pick("")}>Whole class</button>
              <Student config={config} p={chosen} people={people} file={file} change={change} onPick={pick} onPair={(a, b) => pair(a, b)} />
            </>
          ) : (
            <Overview people={people} file={file} sug={sug} onLit={setLit} onPair={pair} onPass={(a, b) => { change(f => M.passOn(f, a, b)); setLit(""); }} onSplit={(id) => change(f => M.splitUp(f, id))} onPick={pick} onPairAll={pairAll} />
          )}
        </aside>
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return <div className="fp"><style>{CSS}</style><div className="fp-in">{children}</div></div>;
}

// The page keeps its own night palette whatever theme the class wears: the
// faces and the lines are the colour, and they read best on a dark ground.
const CSS = `
.fp{--bg:#0a0f1f;--bg2:#141c3a;--panel:#121934;--card:#1a2346;--card2:#222d58;--line:#2c3866;--ink:#f5f7ff;--dim:#b4bee0;--mute:#8793bd;
  --pair2:#34d399;--pair1:#60a5fa;--solo1:#fbbf24;--solo2:#fb7185;--none:#56618c;
  --t3:#ffd75e;--t2:#c4b5fd;--t1:#7dd3fc;--made:#ffffff;--go:#34d399;--go-ink:#052e1f;--warn:#fb923c;
  font-family:'Outfit',-apple-system,BlinkMacSystemFont,sans-serif;color:var(--ink);
  background:radial-gradient(1100px 720px at 28% 18%,var(--bg2) 0%,var(--bg) 62%);min-height:calc(100vh - 60px);padding:18px 20px 60px;box-sizing:border-box}
.fp *{box-sizing:border-box}
.fp-in{max-width:1560px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
.fp-say{font-size:17px;color:var(--dim);margin:40px 0}
.fp-top{display:grid;grid-template-columns:auto minmax(220px,1fr) auto;gap:14px 28px;align-items:center}
.fp-titles{display:flex;flex-direction:column;gap:8px}
.fp h1{margin:0;font-size:26px;font-weight:600;letter-spacing:-.01em;display:flex;align-items:center;gap:12px}
.fp h2{margin:0;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}
.fp-tabs{display:flex;gap:6px}
.fp-tab,.fp-btn{font:inherit;font-size:14px;font-weight:600;min-height:34px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;transition:transform .12s,background .15s,border-color .15s}
.fp-btn:hover,.fp-tab:hover{border-color:var(--dim)}
.fp-btn:active{transform:scale(.96)}
.fp-btn[disabled]{opacity:.35;cursor:default}
.fp-tab.fp-set{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.fp-btn.fp-go{background:var(--go);border-color:var(--go);color:var(--go-ink)}
.fp-btn.fp-go:hover{filter:brightness(1.08)}
.fp-btn.fp-release{background:linear-gradient(135deg,#ffd75e,#fb923c);border:0;color:#2a1600;padding:0 20px}
.fp-btn.fp-released{border-color:var(--go);color:var(--go)}
.fp-btn.fp-solo.fp-set{background:var(--solo1);border-color:var(--solo1);color:#2a1a00}
.fp-btn:focus-visible,.fp-tab:focus-visible,.fp-face:focus-visible,.fp-link:focus-visible,.fp-person:focus-visible,.fp-reason:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.fp-pill{display:inline-flex;align-items:center;font-size:12px;font-weight:600;border-radius:999px;padding:3px 10px;background:var(--w,var(--card2));color:#0a0f1f}
.fp-pill.fp-demo{background:var(--t2)}
.fp-tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.fp-tools .stp select,.fp-tools .stp button{background:var(--card);color:var(--ink);border-color:var(--line);min-height:34px;font-size:14px;border-radius:999px}
.fp-status{font-size:13px;color:var(--mute);min-width:44px}
.fp-confirm{display:inline-flex;align-items:center;gap:8px;font-size:14px;color:var(--dim)}
.fp-progress{display:flex;flex-direction:column;gap:7px;min-width:0}
.fp-pbar,.fp-workbar{display:flex;height:12px;border-radius:999px;overflow:hidden;background:var(--card);gap:2px}
.fp-pbar span{transition:flex-grow .6s cubic-bezier(.2,.8,.2,1);min-width:4px}
.fp-p-pair{background:var(--go)}.fp-p-solo{background:var(--solo1)}.fp-p-open{background:var(--pair1)}.fp-p-out{background:var(--none)}
.fp-workbar{height:26px;border-radius:9px}
.fp-seg{display:grid;place-items:center;font-size:13px;font-weight:600;color:#0a0f1f;background:var(--w);min-width:22px}
.fp-legend{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:5px 16px;font-size:13px;color:var(--dim)}
.fp-legend.fp-row{display:flex;flex-wrap:wrap;gap:4px 18px}
.fp-legend li{display:flex;align-items:center;gap:7px}
.fp-legend b{color:var(--ink);font-weight:600;margin-left:auto;font-variant-numeric:tabular-nums}
.fp-legend.fp-row b{margin-left:2px}
.fp-dot{width:10px;height:10px;border-radius:50%;background:var(--w);flex:none}
.fp-dot.fp-p-pair{background:var(--go)}.fp-dot.fp-p-solo{background:var(--solo1)}.fp-dot.fp-p-open{background:var(--pair1)}.fp-dot.fp-p-out{background:var(--none)}
.fp-w-pair2{--w:var(--pair2)}.fp-w-pair1{--w:var(--pair1)}.fp-w-solo1{--w:var(--solo1)}.fp-w-solo2{--w:var(--solo2)}.fp-w-none{--w:var(--none)}
.fp-key{justify-content:center;padding-top:2px}
.fp-line{width:26px;height:0;border-top:3px solid var(--c);border-radius:2px;flex:none}
.fp-line.fp-l-t3{--c:var(--t3)}.fp-line.fp-l-t2{--c:var(--t2)}.fp-line.fp-l-t1{--c:var(--t1)}.fp-line.fp-l-pair{--c:var(--made);border-top-width:5px}

.fp-main{display:grid;grid-template-columns:minmax(0,1fr) minmax(380px,460px);gap:22px;align-items:start}
.fp-left{display:flex;flex-direction:column;gap:8px;position:sticky;top:70px}
.fp-ringbox{display:flex;justify-content:center;min-width:0}
.fp-stage{position:relative;flex:none;user-select:none;-webkit-user-select:none}
.fp-lines{position:absolute;inset:0;pointer-events:none;overflow:visible}
.fp-orbit{fill:none;stroke:var(--line);stroke-width:1;stroke-dasharray:2 7;opacity:.7}
.fp-l{fill:none;stroke:var(--c);stroke-linecap:round;animation:fp-draw .7s ease both}
.fp-l-t3{--c:var(--t3);stroke-width:3}.fp-l-t2{--c:var(--t2);stroke-width:2.2}.fp-l-t1{--c:var(--t1);stroke-width:1.6}
.fp-l-faint{opacity:.2}
.fp-l-sug{opacity:.95;filter:drop-shadow(0 0 5px var(--c))}
.fp-l-strong{opacity:1;stroke-width:3.6;filter:drop-shadow(0 0 7px var(--c))}
.fp-l-lit{stroke-width:5}
.fp-l-hush{opacity:.06}
.fp-l-pair{--c:var(--made);stroke-width:5;filter:drop-shadow(0 0 8px var(--go))}
.fp-l-pair.fp-l-near{stroke-width:14;opacity:.9}
.fp-l-out{--c:var(--dim);stroke-width:1.8;stroke-dasharray:5 6}
.fp-l-outtop{--c:var(--t3)}
.fp-l-in{--c:var(--mute);stroke-width:1.4;stroke-dasharray:2 6}
.fp-l-drag{--c:var(--dim);stroke-width:3;stroke-dasharray:6 7;animation:none}
.fp-l-clean{--c:var(--go);stroke-dasharray:none;filter:drop-shadow(0 0 8px var(--go))}
.fp-l-warn{--c:var(--warn)}
@keyframes fp-draw{from{opacity:0}}
.fp-face{position:absolute;border-radius:50%;padding:0;border:0;background:var(--w);cursor:grab;display:grid;place-items:center;touch-action:none;
  box-shadow:0 0 0 0 transparent,0 6px 18px rgba(0,0,0,.45);transition:left .75s cubic-bezier(.2,.85,.2,1),top .75s cubic-bezier(.2,.85,.2,1),transform .18s,opacity .3s,box-shadow .25s}
.fp-face:hover{transform:scale(1.1);z-index:3}
.fp-face.fp-w-none{background:transparent;box-shadow:inset 0 0 0 2px var(--none)}
.fp-face.fp-w-none .fp-disc{filter:grayscale(1) brightness(.6)}
.fp-face.fp-sel{transform:scale(1.22);z-index:4;box-shadow:0 0 0 4px var(--bg),0 0 0 7px var(--w),0 0 34px var(--w)}
.fp-face.fp-pair{box-shadow:0 0 0 3px var(--bg),0 0 0 5px var(--made),0 0 18px var(--go)}
.fp-face.fp-solo{box-shadow:0 0 0 3px var(--bg),0 0 0 5px var(--solo1)}
.fp-face.fp-dim,.fp-label.fp-dim{opacity:.2}
.fp-face.fp-target{transform:scale(1.25);box-shadow:0 0 0 4px var(--bg),0 0 0 8px var(--go),0 0 40px var(--go);z-index:4}
.fp-face.fp-target.fp-warn{box-shadow:0 0 0 4px var(--bg),0 0 0 8px var(--warn),0 0 40px var(--warn)}
.fp-face.fp-lift{opacity:.35}
.fp-face.fp-burst{animation:fp-burst 1s cubic-bezier(.2,.9,.2,1)}
@keyframes fp-burst{0%{transform:scale(1)}25%{transform:scale(1.45);box-shadow:0 0 0 6px var(--bg),0 0 0 12px var(--go),0 0 70px 10px var(--go)}100%{transform:scale(1)}}
.fp-disc{border-radius:50%;overflow:hidden;display:grid;place-items:center;font-weight:600;color:#fff;flex:none;pointer-events:none}
.fp-disc img{width:100%;height:100%;object-fit:cover;display:block}
.fp-tick{position:absolute;right:-3px;bottom:-3px;min-width:20px;height:20px;border-radius:999px;background:var(--go);color:var(--go-ink);font-size:12px;font-weight:700;display:grid;place-items:center;box-shadow:0 0 0 2px var(--bg)}
.fp-label{position:absolute;transform:translate(-50%,-50%);font-size:12.5px;font-weight:500;color:var(--dim);white-space:nowrap;pointer-events:none;transition:left .75s cubic-bezier(.2,.85,.2,1),top .75s cubic-bezier(.2,.85,.2,1),opacity .3s}
.fp-label.fp-sel{color:var(--ink);font-weight:600}
.fp-ghost{position:absolute;transform:translate(-50%,-50%) scale(1.1);pointer-events:none;z-index:9;border-radius:50%;box-shadow:0 16px 40px rgba(0,0,0,.6);opacity:.95}
.fp-ask{position:absolute;left:0;right:0;bottom:44px;margin:0 auto;width:fit-content;max-width:92%;z-index:8;box-shadow:0 18px 50px rgba(0,0,0,.6);display:flex;align-items:center;gap:12px;background:var(--card2);border:1px solid var(--warn);border-radius:16px;padding:10px 14px;animation:fp-rise .25s ease both}
.fp-ask p{margin:0;font-size:15px}
@keyframes fp-rise{from{opacity:0;transform:translateY(8px)}}

.fp-panel{background:color-mix(in srgb,var(--panel) 88%,transparent);border:1px solid var(--line);border-radius:22px;padding:18px;display:flex;flex-direction:column;gap:14px;backdrop-filter:blur(8px);min-width:0}
.fp-over,.fp-student{display:flex;flex-direction:column;gap:16px;animation:fp-rise .3s ease both}
.fp-block{display:flex;flex-direction:column;gap:9px}
.fp-bhead{display:flex;justify-content:space-between;align-items:center;gap:10px;min-height:30px}
.fp-count{font-size:13px;color:var(--dim)}
.fp-back{align-self:flex-start}
.fp-sug{display:flex;gap:12px;align-items:center;background:var(--card);border-radius:16px;padding:12px;border-left:4px solid var(--c,var(--line));transition:background .15s,transform .15s}
.fp-sug:hover{background:var(--card2)}
.fp-tie3{--c:var(--t3)}.fp-tie2{--c:var(--t2)}.fp-tie1{--c:var(--t1)}
.fp-made{--c:var(--go)}
.fp-oneway{--c:var(--none)}
.fp-sugmain{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}
.fp-names{margin:0;font-size:16px;font-weight:600;line-height:1.25;display:flex;flex-wrap:wrap;gap:0 6px;align-items:baseline}
.fp-names>span{color:var(--mute);font-weight:400}
.fp-names>span.fp-star,.fp-star{font-size:11.5px;font-weight:600;color:#2a1a00;background:var(--t3);border-radius:999px;padding:2px 8px}
.fp-why{margin:0;font-size:14px;line-height:1.4;color:var(--dim)}
.fp-build{color:var(--t1)}
.fp-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:3px}
.fp-duo{display:inline-flex;flex:none}
.fp-mini{display:inline-grid;place-items:center;border-radius:50%;padding:3px;background:var(--w);border:0;flex:none;cursor:default}
button.fp-mini{cursor:pointer}
.fp-mini.fp-second{margin-left:-12px;box-shadow:-3px 0 0 var(--card)}
.fp-mini.fp-big{padding:4px;box-shadow:0 0 30px color-mix(in srgb,var(--w) 55%,transparent)}
.fp-link{font:inherit;color:var(--ink);background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;text-decoration-color:var(--line);text-underline-offset:3px;font-weight:600}
.fp-link:hover{text-decoration-color:var(--ink)}
.fp-chips{display:flex;flex-wrap:wrap;gap:7px;align-items:center}
.fp-person{font:inherit;font-size:13.5px;color:var(--ink);display:inline-flex;align-items:center;gap:7px;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:3px 12px 3px 3px;cursor:pointer}
.fp-person.fp-off{color:var(--mute);cursor:default}
.fp-person.fp-off .fp-disc{filter:grayscale(1) brightness(.7)}
.fp-k{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--mute)}
.fp-hero{display:flex;gap:16px;align-items:center}
.fp-name{font-size:25px!important;font-weight:600!important;letter-spacing:-.01em!important;text-transform:none!important;color:var(--ink)!important;margin:0 0 6px}
.fp-name a{color:inherit}
.fp-sub{margin:0;display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:13.5px;color:var(--dim)}
.fp-pick{display:flex;gap:11px;align-items:center;padding:8px 10px;border-radius:14px;border:1px dashed var(--line)}
.fp-pick.fp-mutual{border:1px solid color-mix(in srgb,var(--t3) 60%,transparent);background:color-mix(in srgb,var(--t3) 7%,transparent)}
.fp-by{padding-top:2px}
.fp-topic{position:relative;background:var(--card);border:1.5px solid var(--line);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:8px;transition:background .3s,border-color .3s}
.fp-topic.fp-on{background:color-mix(in srgb,var(--go) 16%,var(--card));border-color:var(--go)}
.fp-ttl{margin:0;font-size:18px;font-weight:600;line-height:1.3;overflow-wrap:anywhere;padding-right:96px}
.fp-ttl.fp-small{font-size:15px;padding:0}
.fp-asks{margin:0;padding-left:18px;font-size:14px;line-height:1.45;color:var(--dim)}
.fp-said{margin:0;font-size:13px;color:var(--warn)}
.fp-stamp{position:absolute;top:12px;right:12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--go);border:2px solid var(--go);border-radius:8px;padding:2px 8px;transform:rotate(-6deg);animation:fp-stamp .45s cubic-bezier(.2,1.6,.4,1) both}
@keyframes fp-stamp{from{opacity:0;transform:rotate(-18deg) scale(2.4)}}
.fp-shake{animation:fp-shake .4s}
@keyframes fp-shake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.fp-theirs{display:flex;flex-direction:column;gap:5px;padding:10px 14px;border-radius:14px;border:1px dashed var(--go)}
.fp-reasons{display:flex;flex-wrap:wrap;gap:6px}
.fp-reason{font:inherit;font-size:13px;color:var(--dim);background:transparent;border:1px solid var(--line);border-radius:999px;padding:4px 11px;cursor:pointer}
.fp-reason.fp-set{background:var(--warn);border-color:var(--warn);color:#2a1200;font-weight:600}
.fp-reasons input{font:inherit;font-size:13px;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:999px;padding:4px 12px;min-width:150px}
.fp-reasons input::placeholder{color:var(--mute)}
.fp-strength{font-size:13.5px;font-weight:600;border-radius:999px;padding:5px 13px;color:hsl(var(--h) 90% 82%);background:hsl(var(--h) 60% 22%);border:1px solid hsl(var(--h) 60% 38%)}
.fp-site{display:flex;gap:12px;align-items:flex-start;padding:4px 0}
.fp-sitemark{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;font-weight:700;font-size:17px;color:#fff;background:linear-gradient(135deg,hsl(var(--h) 70% 52%),hsl(calc(var(--h) + 50) 70% 36%));flex:none}
@media (max-width:1080px){.fp-main{grid-template-columns:1fr}.fp-left{position:relative;top:0}.fp-top{grid-template-columns:1fr}.fp-tools{justify-content:flex-start}}
@media (prefers-reduced-motion:reduce){.fp *{animation:none!important;transition:none!important}}
`;
