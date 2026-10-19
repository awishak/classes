// Where the student's pre-production topic stands, put where they look.
//
// Andrew, 2026-10-19, asked where students see that their pre-production
// assignment has been approved. Only on the pre-production page itself and on
// the builder's door, which a student who had submitted had no reason to open.
// "i want it where they will actually see it. of course." So the review goes
// on the home under My work, on the My work page, on the challenge's row, and
// on the challenge's card, all from the one read below.
//
// The read is the student's own: their sheet and its review, under the rules
// pre.jsx already reads by. Once per class and email per page load.

import { useState, useEffect } from "react";
import { gameClient } from "../gameClient.js";
import { useSession } from "../session.js";
import { localWorksheet, listedFor } from "../localWorksheets.js";
import { standing, VISUAL_PRE_KEY, VISUAL_PRE_2_KEY } from "./pre.jsx";
import { Row, Io } from "../portal/bits.jsx";

export const preHref = (config, key = VISUAL_PRE_KEY) => "/" + config.id + "/worksheets/" + key;
const hasPre = (config, key) => { const w = localWorksheet(key); return !!(w && config && listedFor(w, config.id)); };
export const PRE_KEYS = [VISUAL_PRE_KEY, VISUAL_PRE_2_KEY];

const asked = new Map();   // class id + email -> the standing, as a promise

export function preStandingFor(config, email, key = VISUAL_PRE_KEY) {
  const id = String(email || "").trim().toLowerCase();
  if (!id || !hasPre(config, key)) return Promise.resolve(null);
  const k = config.id + ":" + key + ":" + id;
  if (!asked.has(k)) asked.set(k, (async () => {
    try {
      const s = await gameClient.from("worksheet_sheets").select("id,submitted_at").eq("worksheet_key", key).eq("group_key", config.id).eq("viewer_id", id);
      const sheet = s.data && s.data[0];
      if (!sheet) return null;
      const r = await gameClient.from("worksheet_reviews").select("status,note,reviewed_at").eq("sheet_id", sheet.id);
      return standing(sheet.submitted_at, (r.data && r.data[0]) || null);
    } catch { return null; }
  })());
  return asked.get(k);
}

/** The signed-in student's standing on a pre-production page: null with no sheet or while unknown. */
export function usePreStanding(config, key = VISUAL_PRE_KEY) {
  const { email } = useSession();
  const [where, setWhere] = useState(null);
  useEffect(() => {
    let alive = true;
    preStandingFor(config, email, key).then(w => { if (alive) setWhere(w); });
    return () => { alive = false; };
  }, [config?.id, email, key]);
  return where;
}

// What each standing says. Waiting says nothing new here: the row already reads Turned in.
const WORDS = {
  approved: { title: "Your pre-production topic is approved", second: "Your second pre-production topic is approved", tint: "done", short: "Approved" },
  needs: { title: "Your pre-production topic needs work", second: "Your second pre-production topic needs work", tint: "late", short: "Needs work" },
};
const titleOf = (w, key) => (key === VISUAL_PRE_2_KEY ? w.second : w.title);
const fixLine = (key) => "Fix it on your " + (key === VISUAL_PRE_2_KEY ? "second pre-production page" : "pre-production page") + ", then press Submit again.";
/** A few words for a row's line: "Approved" or "Needs work", or "". */
export const preShort = (where) => (where && WORDS[where.kind] ? WORDS[where.kind].short : "");

function OneRow({ config, k }) {
  const where = usePreStanding(config, k);
  const w = where && WORDS[where.kind];
  if (!w) return null;
  const href = preHref(config, k);
  const open = () => { window.location.href = href; };
  const note = String(where.review?.note || "").trim();
  return (
    <Row tint={w.tint} onOpen={open} side={<Io kind="go" href={href}>Open</Io>}>
      <p className="pt-title">{titleOf(w, k)}</p>
      {note ? <p className="pt-text">{note}</p> : null}
      <p className={"pt-when " + w.tint}><span>{where.kind === "approved" ? "Go build your story." : fixLine(k)}</span></p>
    </Row>
  );
}
/** Rows under My work, on the home and on the My work page, once a topic is reviewed. One per page the student has. */
export function PreRow({ config }) {
  return <>{PRE_KEYS.map(k => <OneRow key={k} config={config} k={k} />)}</>;
}

function OneStanding({ config, k }) {
  const where = usePreStanding(config, k);
  const w = where && WORDS[where.kind];
  if (!w) return null;
  const note = String(where.review?.note || "").trim();
  return (
    <div className={"pt-row " + w.tint} style={{ flexDirection: "column", alignItems: "stretch", gap: 6, padding: "14px 16px" }}>
      <p className="pt-title">{titleOf(w, k)}</p>
      {note ? <p className="pt-text">{note}</p> : null}
      {where.kind === "needs" ? <p className="pt-meta">{fixLine(k)}</p> : null}
    </div>
  );
}
/** The standing on the challenge's card, above the buttons to the pages. */
export function PreStanding({ config }) {
  return <>{PRE_KEYS.map(k => <OneStanding key={k} config={config} k={k} />)}</>;
}
