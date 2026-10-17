// The way from My work to the classmates' stories.
//
// Andrew, 2026-10-16: "i want to know how students will access it! that's
// the important part. so it needs to be a link under My work when
// appropriate." Appropriate is the student's section having moved past
// building: once Andrew opens a section for reading, a row appears under My
// work on the home and on the My work page, and a link on the visual story's
// own page. In building there is nothing to open, so nothing is drawn.
//
// The stage is one light read from the story route, as the signed-in
// student, once per page load. The words are the app's labels, in step with
// the stories page's own lines for each stage.

import { useState, useEffect } from "react";
import { authHeaders } from "../session.js";
import { Row, Io, Lnk } from "../portal/bits.jsx";

// The classes with a stories page, the same list App.jsx routes /<class>/stories for.
export const STORIES_CLASSES = ["comm3", "comm999"];
export const storiesHref = (config) => "/" + config.id + "/stories";

const asked = new Map();   // class id -> the stage, as a promise

export function storiesStage(config) {
  if (!config || !STORIES_CLASSES.includes(config.id)) return Promise.resolve("");
  if (!asked.has(config.id)) asked.set(config.id, (async () => {
    try {
      // No PIN goes along: the door is the student's, and the route answers
      // for the session's own email.
      const r = await fetch("/api/visual-story", {
        method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ groupKey: config.id, action: "status" }),
      });
      const out = await r.json().catch(() => null);
      return r.ok && out && out.ok ? String(out.stage || "") : "";
    } catch { return ""; }
  })());
  return asked.get(config.id);
}

export function useStoriesStage(config) {
  const [stage, setStage] = useState("");
  useEffect(() => {
    let alive = true;
    storiesStage(config).then(s => { if (alive) setStage(s); });
    return () => { alive = false; };
  }, [config?.id]);
  return stage;
}

// What the row says at each stage; nothing in building.
const WORDS = {
  reading: { title: "Read your classmates' stories", line: "Comments are open.", tint: "due" },
  closed: { title: "Your classmates' stories", line: "Comments are closed.", tint: "done" },
  released: { title: "Your classmates' stories", line: "The names are out.", tint: "done" },
};

// A row under My work, on the home and on the My work page.
export function StoriesRow({ config }) {
  const stage = useStoriesStage(config);
  const w = WORDS[stage];
  if (!w) return null;
  const href = storiesHref(config);
  const open = () => { window.location.href = href; };
  return (
    <Row tint={w.tint} onOpen={open} side={<Io kind="go" href={href}>Open</Io>}>
      <p className="pt-title">{w.title}</p>
      <p className={"pt-when " + w.tint}><span>{w.line}</span></p>
    </Row>
  );
}

// A link on the visual story's own page, beside the one to the builder.
export function StoriesLink({ config }) {
  const stage = useStoriesStage(config);
  const w = WORDS[stage];
  if (!w) return null;
  return <div><Lnk href={storiesHref(config)}>{w.title}</Lnk></div>;
}
