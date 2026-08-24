// Classroom View — the projector screen. One unlisted URL per class
// (/comm118/today). It holds the idle screen until the instructor casts
// something from the Dashboard, then swaps content with the chosen animation.
//
// Read-only: this surface never writes to the cast bus. Press F for fullscreen.

import { useEffect, useRef, useState } from "react";
import { useLive } from "./live.js";
import { useClassData } from "./store.js";
import { currentDay } from "./days.js";
import QRCode from "./QRCode.jsx";
import { usePoll, tally } from "./poll.js";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const STAGE = "#0f0d0c";
const INK = "#f6f2ec";
const DIM = "#a79c92";
const LINE = "#2b2622";

// Keyframes live in a style tag because the rest of the engine styles inline.
const CSS = `
@keyframes cv-rise{from{opacity:0;transform:translateY(3vh) scale(.99)}to{opacity:1;transform:none}}
@keyframes cv-riseOut{to{opacity:0;transform:translateY(-2vh)}}
@keyframes cv-pushIn{from{transform:translateX(100%)}to{transform:none}}
@keyframes cv-pushOut{to{transform:translateX(-32%);opacity:.3}}
@keyframes cv-spot{0%{opacity:0;clip-path:circle(0% at 50% 46%)}22%{opacity:1;clip-path:circle(9% at 50% 46%)}100%{opacity:1;clip-path:circle(98% at 50% 46%)}}
@keyframes cv-beam{0%{opacity:0}25%{opacity:1}100%{opacity:0}}
.cv-layer{position:absolute;inset:0;animation-fill-mode:both;animation-timing-function:cubic-bezier(.22,.9,.3,1);backface-visibility:hidden}
.cv-in-cut{animation:none}
.cv-in-rise{animation:cv-rise .46s}
.cv-out-rise{animation:cv-riseOut .3s forwards}
.cv-in-push{animation:cv-pushIn .5s}
.cv-out-push{animation:cv-pushOut .5s forwards}
.cv-in-spot{animation:cv-spot 1.15s ease-out}
.cv-out-spot{animation:cv-riseOut .2s forwards}
.cv-beam{position:absolute;inset:0;z-index:4;pointer-events:none;animation:cv-beam 1.15s ease-out forwards;
  background:radial-gradient(circle at 50% 46%, rgba(255,241,243,.16), transparent 46%)}
@media (prefers-reduced-motion:reduce){
  .cv-layer{animation:none !important}
  [class*="cv-out-"]{display:none}
  .cv-beam{display:none}
}
`;

const eyebrow = { fontFamily: MONO, fontSize: "clamp(11px,1.1vw,15px)", letterSpacing: ".16em", textTransform: "uppercase", color: DIM };

// ─── the content types a cast can be ───
function Content({ cast, config, plan }) {
  const pad = "clamp(28px,5vw,80px)";
  const wrap = { position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: pad, color: INK, fontFamily: F };

  if (!cast) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const base = origin + config.path;
    return (
      <div style={{ ...wrap, alignItems: "center", justifyContent: "center", textAlign: "center", gap: "2.2vh" }}>
        <div style={eyebrow}>{config.code} &middot; {todayLabel()}</div>
        <div style={{ fontSize: "clamp(30px,4.6vw,68px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.08 }}>
          {plan?.topic || config.name}
        </div>
        {plan?.notes ? (
          <div style={{ color: DIM, fontSize: "clamp(15px,1.7vw,24px)", maxWidth: "34ch", lineHeight: 1.45 }}>{plan.notes}</div>
        ) : null}
        <AskBlock base={base} />
      </div>
    );
  }

  if (cast.type === "black") {
    return <div style={{ position: "absolute", inset: 0, background: "#000" }} />;
  }

  if (cast.type === "board") {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const count = cast.count || 0;
    return (
      <div style={{ ...wrap, justifyContent: "center", gap: "2.4vh" }}>
        <div style={eyebrow}>{cast.tag || todayLabel()}</div>
        <div style={{ fontSize: "clamp(20px,2.4vw,34px)", fontWeight: 500, color: DIM, letterSpacing: "-.01em" }}>
          {cast.title}
        </div>
        <div style={{ fontSize: "clamp(26px,4vw,58px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.16, maxWidth: "24ch" }}>
          {cast.idea}
        </div>
        {count > 1 ? (
          <div style={{ display: "flex", gap: 8, marginTop: "1vh" }}>
            {Array.from({ length: count }).map((_, i) => (
              <span key={i} style={{ width: "clamp(6px,.7vw,10px)", height: "clamp(6px,.7vw,10px)", borderRadius: "50%",
                background: i === cast.at ? "#e11d48" : LINE }} />
            ))}
          </div>
        ) : null}
        {cast.showAsk ? <AskBlock base={origin + config.path} compact /> : null}
      </div>
    );
  }

  if (cast.type === "feature") {
    return (
      <div style={{ ...wrap, alignItems: "center", justifyContent: "center", textAlign: "center", gap: "2.2vh" }}>
        <div style={{ ...eyebrow, color: "#e11d48" }}>Right now</div>
        <div style={{ fontSize: "clamp(38px,6.4vw,104px)", fontWeight: 700, letterSpacing: "-.04em", lineHeight: 1 }}>
          {cast.title}
        </div>
        {cast.body ? <div style={{ color: DIM, fontSize: "clamp(15px,1.9vw,28px)", maxWidth: "34ch", lineHeight: 1.4 }}>{cast.body}</div> : null}
      </div>
    );
  }

  if (cast.type === "poll") {
    return <PollScreen config={config} />;
  }

  if (cast.mode === "embed" && cast.url) {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#000" }}>
        <iframe
          src={cast.url}
          title={cast.title || "Cast"}
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          allow="autoplay; fullscreen; picture-in-picture"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  if (cast.type === "reveal") {
    return (
      <div style={{ ...wrap, alignItems: "center", justifyContent: "center", textAlign: "center", gap: "2vh" }}>
        <div style={{ ...eyebrow, color: "#e11d48", border: "1px solid rgba(225,29,72,.45)", borderRadius: 8, padding: "6px 14px" }}>
          {cast.stamp || "New assignment"}
        </div>
        <div style={{ fontSize: "clamp(34px,5.6vw,84px)", fontWeight: 700, letterSpacing: "-.035em", lineHeight: 1.06, maxWidth: "17ch" }}>
          {cast.title}
        </div>
        {cast.due ? <div style={{ fontFamily: MONO, fontSize: "clamp(15px,1.8vw,26px)", color: DIM }}>{cast.due}</div> : null}
      </div>
    );
  }

  if (cast.type === "quote" || cast.type === "question") {
    return (
      <div style={{ ...wrap, alignItems: "center", justifyContent: "center", textAlign: "center", gap: "2.4vh" }}>
        {cast.tag ? <div style={eyebrow}>{cast.tag}</div> : null}
        <div style={{ fontSize: "clamp(28px,4.4vw,64px)", fontWeight: 500, letterSpacing: "-.025em", lineHeight: 1.24, maxWidth: "21ch" }}>
          {cast.title}
        </div>
        {cast.cite ? <div style={{ ...eyebrow, color: "#e11d48" }}>{cast.cite}</div> : null}
      </div>
    );
  }

  // Default: a title card for a link we cannot or should not embed. The claim
  // and where it came from — never the URL, which is unreadable at ten feet and
  // is my problem, not theirs.
  return (
    <div style={{ ...wrap, justifyContent: "center", gap: "2.4vh" }}>
      {cast.kind ? <div style={{ ...eyebrow, color: "#e11d48" }}>{cast.kind}</div> : null}
      <div style={{ fontSize: "clamp(30px,4.6vw,70px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.1, maxWidth: "20ch" }}>
        {cast.title}
      </div>
      {cast.body ? (
        <div style={{ color: DIM, fontSize: "clamp(15px,1.8vw,26px)", maxWidth: "42ch", lineHeight: 1.45 }}>{cast.body}</div>
      ) : null}
    </div>
  );
}

function todayLabel(d) {
  const day = d || new Date();
  return day.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export default function ClassroomView({ config }) {
  const [live] = useLive(config.storageKey);
  const [data] = useClassData(config.storageKey);

  // The idle screen shows today's topic, so it needs the class data too.
  const weeks = data?.schedule || config.scheduleWeeks || [];
  const day = currentDay(weeks);
  const dayPlan = day ? (data?.dayPlans || {})[day.date] : null;
  const plan = day ? { topic: day.topic || config.name, notes: dayPlan?.notes || "" } : null;
  const [layers, setLayers] = useState([]); // [{ key, cast, anim, phase }]
  const seen = useRef(-1);
  const stageRef = useRef(null);
  const [beam, setBeam] = useState(0);

  useEffect(() => { document.title = config.code + " — Today"; }, [config.code]);

  // Swap layers whenever the cast counter moves.
  useEffect(() => {
    if (!live) return;
    if (live.n === seen.current) return;
    const first = seen.current === -1;
    seen.current = live.n;
    // Fall back if stored state still names an animation we have retired.
    const KEEP = ["cut", "rise", "push", "spot"];
    const want = live.cast?.big ? (live.bigAnim || "spot") : (live.anim || "rise");
    const anim = KEEP.includes(want) ? want : (live.cast?.big ? "spot" : "rise");
    const use = first ? "cut" : anim;
    setLayers(prev => [
      ...prev.map(l => ({ ...l, phase: "out", anim: use })),
      { key: "l" + live.n + "-" + live.at, cast: live.cast, anim: use, phase: "in" },
    ]);
    if (use === "spot") setBeam(b => b + 1);
    // Drop outgoing layers once their exit has had time to run.
    const t = setTimeout(() => setLayers(prev => prev.filter(l => l.phase !== "out")), 1300);
    return () => clearTimeout(t);
  }, [live]);

  const reduced = typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

  // F toggles fullscreen so the room screen can be driven from the room machine.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "f" && e.key !== "F") return;
      const el = document.documentElement;
      if (document.fullscreenElement) document.exitFullscreen?.();
      else el.requestFullscreen?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div ref={stageRef} style={{ position: "fixed", inset: 0, background: STAGE, overflow: "hidden", fontFamily: F }}>
      <style>{CSS}</style>
      {live === null ? (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: DIM, fontFamily: MONO, fontSize: 13, letterSpacing: ".12em", textTransform: "uppercase" }}>
          Connecting
        </div>
      ) : layers.map(l => (
        <div key={l.key} className={"cv-layer cv-" + (l.phase === "in" ? "in-" : "out-") + (reduced ? "cut" : l.anim)}>
          <Content cast={l.cast} config={config} plan={plan} />
        </div>
      ))}
      {beam > 0 && !reduced ? <div key={"beam" + beam} className="cv-beam" /> : null}
    </div>
  );
}
