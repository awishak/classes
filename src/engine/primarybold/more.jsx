// More, in Primary Bold: the class, who he is viewing as, the look, his card,
// what students have asked for, and the account.
//
// Andrew, 2026-11-24, on the live More page: "fix this page. add primarybold
// as a theme. remove the tools stuff. make it prettier." So the tools are not
// here, the look is picked here, and each thing is a panel of faces and pills
// in place of a column of select boxes.
//
// Everything arrives in `more`, which ClassApp fills (the session, the
// roster, the theme and the two forms are its to own). His card and the
// requests are the live site's forms inside a plain card until they are
// redrawn.

import { nameShown } from "../roster.js";
import { THEMES, THEME_LABELS } from "../themes.js";
import { Cell, Pill, GROUNDS } from "./bits.jsx";
import { photoOf } from "./data.js";

export function More({ config, data, more, instructor, ground, setGround }) {
  const m = more || {};
  const sessionHis = !!m.sessionInstructor;
  const toClass = (c) => { if (c.id === config.id) return; window.history.pushState({}, "", c.path + "/more"); window.dispatchEvent(new PopStateEvent("popstate")); };
  const roster = m.roster || [];
  return <div className="body">
    <div className="rowx"><p className="t1">More</p></div>
    <div className="main" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
      <div className="zones">
        {sessionHis ? <div className="panel" style={{ animation: "none" }}>
          <p style={{ fontWeight: 600 }}>Class</p>
          <div className="rowx">{(m.classes || []).map(c => <Pill key={c.id} kind={c.id === config.id ? "on" : ""} onClick={() => toClass(c)}>{c.code}</Pill>)}</div>
        </div> : null}
        <div className="panel" style={{ animation: "none" }}>
          <p style={{ fontWeight: 600 }}>Look</p>
          <div className="rowx" role="group" aria-label="Primary Bold">{GROUNDS.map(([id, say]) => <Pill key={id} kind={ground === id ? "on" : ""} onClick={() => setGround(id)}>{say}</Pill>)}</div>
          {m.pickTheme ? <><p className="t3">The looks before Primary Bold</p>
            <div className="rowx" role="group" aria-label="The looks before Primary Bold">{THEMES.map(t => <Pill key={t} onClick={() => m.pickTheme(t)}>{THEME_LABELS[t]}</Pill>)}</div></> : null}
        </div>
        <div className="panel" style={{ animation: "none" }}>
          <p style={{ fontWeight: 600 }}>Account</p>
          {sessionHis && m.pickRole ? <div className="rowx" role="group" aria-label="View">{["student", "instructor"].map(r => <Pill key={r} kind={m.role === r ? "on" : ""} onClick={() => m.pickRole(r)}>{r === "student" ? "Student" : "Instructor"}</Pill>)}</div> : null}
          {m.ownCode ? <div className="rowx"><span className="t3">Your sign-in code</span><span style={{ fontWeight: 600, letterSpacing: ".14em" }}>{m.ownCode}</span></div> : null}
          {m.signOut ? <div className="rowx"><Pill onClick={m.signOut}>{instructor || !m.signedIn ? "Sign out" : "Sign out " + m.signedIn}</Pill></div> : null}
        </div>
      </div>
      <div className="zones">
        {sessionHis && roster.length ? <div className="panel" style={{ animation: "none" }}>
          <div className="rowx"><p style={{ fontWeight: 600 }}>View as a student</p><span className="sp" />{m.viewing ? <Pill onClick={() => m.viewAs("")}>Stop viewing as {nameShown(data, m.viewing)}</Pill> : null}</div>
          <div className="zb" style={{ display: "flex", flexWrap: "wrap", gap: "10px 6px" }}>
            {roster.map(s => <Cell key={s.name} name={nameShown(data, s.name)} photo={photoOf(data, s.name)} ring="c118" on={m.viewing === s.name} dim={!!m.viewing && m.viewing !== s.name} onClick={() => m.viewAs(s.name)} />)}
          </div>
        </div> : null}
        {m.requests ? <div className="old ca-root pt-root">{m.requests}</div> : null}
      </div>
    </div>
    {m.profile ? <div className="old ca-root pt-root">{m.profile}</div> : null}
  </div>;
}
