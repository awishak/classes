// The room's screen for Locker Room: /comm118/worksheets/locker-room?board.
// Andrew, 2026-11-04: "create a page i can put on the screen with who
// 'won' locker room. highest scores."
//
// Every handed-in season replayed from its file (engine.replay, the same
// read the student saw), then ranked. The game has no one score, so the
// chips at the top pick what counts: Success, the third bar, is the
// default, since it is what winning moved; Record is wins; Culture and
// Skills are the other two bars; Total is the three bars added. Ties break
// on wins, then culture. The top three are big; the rest are a table.
// Seasons that were not finished sit under the table with how far they
// got. In the game's own look, dark with the pixel face, asked again every
// half minute so a late hand-in appears. Nothing is written here.

import { useEffect, useState } from "react";
import { isLurker } from "../sections.js";
import { useAllSheets } from "../audiostory/control.jsx";
import * as E from "./engine.js";
import { loadFont } from "./game.jsx";

const lower = (s) => String(s || "").trim().toLowerCase();

export const SORTS = [
  { id: "success", say: "Success", of: (r) => r.state.success },
  { id: "record", say: "Record", of: (r) => r.state.wins },
  { id: "culture", say: "Culture", of: (r) => r.state.culture },
  { id: "skills", say: "Skills", of: (r) => r.state.skills },
  { id: "total", say: "Total", of: (r) => r.state.culture + r.state.skills + r.state.success },
];

/** Every season on file with a roster student behind it, replayed. */
export function seasonsOf(roster, sheets) {
  const people = new Map((roster || []).filter(s => s.email && !isLurker(s.name)).map(s => [lower(s.email), s]));
  return (sheets || []).map(sh => {
    const student = people.get(lower(sh.viewer_id));
    if (!student) return null;
    const a = sh.answers || {};
    const { state, results } = E.replay(a, student.name);
    const sport = E.sportOf(a[E.F.sport]);
    return { student, sheet: sh, state, results, done: results.length >= E.WEEKS, team: String(a[E.F.team] || "").trim(), sport: sport ? sport.name : "" };
  }).filter(Boolean);
}

/** The finished seasons in order under a sort, ties on wins then culture then name. */
export const ranked = (seasons, sortId) => {
  const sort = SORTS.find(s => s.id === sortId) || SORTS[0];
  return seasons.filter(s => s.done).sort((x, y) => sort.of(y) - sort.of(x) || y.state.wins - x.state.wins || y.state.culture - x.state.culture || x.student.name.localeCompare(y.student.name));
};

export default function LockerRoomBoard({ config, worksheetKey, roster }) {
  const [sheets, error] = useAllSheets(config, worksheetKey);
  const [sortId, setSortId] = useState("success");
  useEffect(() => { loadFont(); }, []);
  const sort = SORTS.find(s => s.id === sortId) || SORTS[0];
  const body = () => {
    if (error && !sheets) return <p className="tkb-p">Could not read the sheets: {error}</p>;
    if (!sheets) return <p className="tkb-p">Loading the seasons.</p>;
    const seasons = seasonsOf(roster, sheets);
    const list = ranked(seasons, sortId);
    const unfinished = seasons.filter(s => !s.done && s.results.length).sort((x, y) => y.results.length - x.results.length || x.student.name.localeCompare(y.student.name));
    const top = list.slice(0, 3), rest = list.slice(3);
    const nums = (s) => <span className="tkb-nums"><b>{s.state.wins}-{s.state.losses}</b> · culture {s.state.culture} · skills {s.state.skills} · success {s.state.success}</span>;
    return (
      <>
        <div className="tkb-podium">
          {top.map((s, i) => (
            <div key={s.student.email} className={"tkb-place tkb-" + (i + 1)}>
              <span className="px tkb-rank">{["1ST", "2ND", "3RD"][i]}</span>
              <span className="tkb-name">{s.student.name}</span>
              <span className="tkb-team">{[s.team, s.sport].filter(Boolean).join(" · ")}</span>
              <span className="px tkb-big">{sort.of(s)}{sortId === "record" ? "-" + s.state.losses : ""}</span>
              {nums(s)}
            </div>
          ))}
        </div>
        {rest.length ? (
          <table className="tkb-table">
            <tbody>
              {rest.map((s, i) => (
                <tr key={s.student.email}>
                  <td className="px tkb-n">{i + 4}</td>
                  <td className="tkb-who"><b>{s.student.name}</b><span className="tkb-team">{[s.team, s.sport].filter(Boolean).join(" · ")}</span></td>
                  <td className="px tkb-score">{sort.of(s)}{sortId === "record" ? "-" + s.state.losses : ""}</td>
                  <td className="tkb-cell">{nums(s)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {!list.length ? <p className="tkb-p">No finished seasons yet.</p> : null}
        {unfinished.length ? <p className="tkb-muted">Season not finished: {unfinished.map(s => s.student.name + " (" + s.results.length + " of " + E.WEEKS + " weeks)").join(", ")}.</p> : null}
      </>
    );
  };
  return (
    <div className="tk tkb">
      <style>{CSS}</style>
      <div className="tkb-in">
        <div className="tkb-bar">
          <h1 className="px tkb-title">LOCKER ROOM</h1>
          <div className="tkb-sorts" role="tablist" aria-label="Ranked by">
            {SORTS.map(s => <button key={s.id} type="button" role="tab" aria-selected={s.id === sortId} className={"px tkb-sort" + (s.id === sortId ? " on" : "")} onClick={() => setSortId(s.id)}>{s.say}</button>)}
          </div>
        </div>
        {body()}
      </div>
    </div>
  );
}

const CSS = `
.tk.tkb{--ink:#0f0f1a;--panel:#141428;--deep:#0a0a16;--line:#e0e0e0;--text:#e8e8f0;--dim:#a0a0b8;--gold:#f8e020;--silver:#c8ccd8;--bronze:#d08848;--green:#38b838;--mono:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace;--pixel:'Press Start 2P',monospace;box-sizing:border-box;background:var(--ink);color:var(--text);font-family:var(--mono);font-size:20px;line-height:1.5;padding:28px 24px 64px;min-height:100vh}
.tkb *{box-sizing:border-box}
.tkb .px{font-family:var(--pixel);line-height:1.6}
.tkb-in{max-width:1280px;margin:0 auto;display:grid;gap:28px}
.tkb-bar{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}
.tkb-title{margin:0;font-size:28px;color:var(--gold);text-shadow:4px 4px 0 var(--deep)}
.tkb-sorts{display:flex;gap:10px;flex-wrap:wrap}
.tkb-sort{font-size:11px;color:var(--text);background:#1c1c3a;border:3px solid var(--line);padding:10px 14px;cursor:pointer;box-shadow:4px 4px 0 var(--deep)}
.tkb-sort.on{background:var(--gold);color:var(--ink);border-color:var(--gold)}
.tkb-p{margin:0;font-size:20px}
.tkb-muted{margin:0;font-size:17px;color:var(--dim)}
.tkb-podium{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;align-items:end}
.tkb-place{display:grid;gap:8px;justify-items:center;text-align:center;background:var(--panel);border:4px solid var(--line);padding:24px 18px;box-shadow:8px 8px 0 var(--deep)}
.tkb-place.tkb-1{order:2;border-color:var(--gold);padding-block:36px}
.tkb-place.tkb-2{order:1;border-color:var(--silver)}
.tkb-place.tkb-3{order:3;border-color:var(--bronze)}
.tkb-rank{font-size:14px;color:var(--dim)}
.tkb-1 .tkb-rank{color:var(--gold)}.tkb-2 .tkb-rank{color:var(--silver)}.tkb-3 .tkb-rank{color:var(--bronze)}
.tkb-name{font-size:30px;font-weight:600;line-height:1.2}
.tkb-1 .tkb-name{font-size:36px}
.tkb-team{display:block;font-size:16px;color:var(--dim)}
.tkb-big{font-size:40px;color:var(--text);margin-top:6px}
.tkb-1 .tkb-big{font-size:52px;color:var(--gold)}
.tkb-nums{font-size:16px;color:var(--dim)}
.tkb-nums b{color:var(--text)}
.tkb-table{width:100%;border-collapse:collapse;font-size:20px}
.tkb-table td{padding:10px 14px;border-bottom:2px solid #1c1c3a;vertical-align:middle}
.tkb-n{width:56px;font-size:14px;color:var(--dim)}
.tkb-who{display:grid;gap:2px}
.tkb-score{font-size:18px;text-align:right;white-space:nowrap}
.tkb-cell{text-align:right;white-space:nowrap}
@media (max-width:900px){.tkb-podium{grid-template-columns:1fr}.tkb-place.tkb-1,.tkb-place.tkb-2,.tkb-place.tkb-3{order:0}.tkb-cell{display:none}}
`;
