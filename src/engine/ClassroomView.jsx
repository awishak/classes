// Classroom View — the projector screen. One unlisted URL per class
// (/comm118/today). It holds the idle screen until the instructor casts
// something from the Dashboard, then swaps content with the chosen animation.
//
// Read-only: this surface never writes to the cast bus. Press F for fullscreen.

import { useEffect, useRef, useState } from "react";
import { useLive } from "./live.js";
import { useClassData } from "./store.js";
import { currentDay } from "./days.js";

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
@keyframes cv-iris{from{clip-path:circle(0% at 50% 50%)}to{clip-path:circle(80% at 50% 50%)}}
@keyframes cv-hold{to{opacity:1}}
@keyframes cv-flipIn{from{transform:perspective(1600px) rotateY(88deg);opacity:0}60%{opacity:1}to{transform:perspective(1600px) rotateY(0);opacity:1}}
@keyframes cv-flipOut{to{transform:perspective(1600px) rotateY(-88deg);opacity:0}}
@keyframes cv-drop{0%{opacity:0;transform:scale(2.1);filter:blur(10px)}55%{opacity:1;filter:blur(0)}70%{transform:scale(.955)}85%{transform:scale(1.018)}100%{transform:scale(1)}}
@keyframes cv-shake{10%,90%{transform:translateX(-3px)}20%,80%{transform:translateX(5px)}30%,50%,70%{transform:translateX(-8px)}40%,60%{transform:translateX(8px)}100%{transform:none}}
@keyframes cv-spot{0%{opacity:0;clip-path:circle(0% at 50% 46%)}22%{opacity:1;clip-path:circle(9% at 50% 46%)}100%{opacity:1;clip-path:circle(98% at 50% 46%)}}
@keyframes cv-beam{0%{opacity:0}25%{opacity:1}100%{opacity:0}}
.cv-layer{position:absolute;inset:0;animation-fill-mode:both;animation-timing-function:cubic-bezier(.22,.9,.3,1);backface-visibility:hidden}
.cv-in-cut{animation:none}
.cv-in-rise{animation:cv-rise .46s}
.cv-out-rise{animation:cv-riseOut .3s forwards}
.cv-in-push{animation:cv-pushIn .5s}
.cv-out-push{animation:cv-pushOut .5s forwards}
.cv-in-iris{animation:cv-iris .62s}
.cv-out-iris{animation:cv-hold .62s forwards}
.cv-in-flip{animation:cv-flipIn .58s}
.cv-out-flip{animation:cv-flipOut .34s forwards}
.cv-in-drop{animation:cv-drop .78s cubic-bezier(.16,1.1,.3,1)}
.cv-out-drop{animation:cv-riseOut .22s forwards}
.cv-in-spot{animation:cv-spot 1.15s ease-out}
.cv-out-spot{animation:cv-riseOut .2s forwards}
.cv-shake{animation:cv-shake .42s .42s cubic-bezier(.36,.07,.19,.97)}
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
        <div style={{ display: "flex", gap: "clamp(28px,5vw,72px)", marginTop: "3vh", flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: "clamp(15px,1.6vw,22px)", fontWeight: 500 }}>Ask me anything</div>
            <div style={{ ...eyebrow, marginTop: 4, letterSpacing: ".06em" }}>{base.replace(/^https?:\/\//, "")}/ask</div>
            <div style={{ color: DIM, fontSize: "clamp(12px,1.1vw,15px)", marginTop: 6 }}>Confidential. Anonymous if you want.</div>
          </div>
          <div style={{ textAlign: "left", borderLeft: "1px solid " + LINE, paddingLeft: "clamp(20px,3vw,44px)" }}>
            <div style={{ fontSize: "clamp(15px,1.6vw,22px)", fontWeight: 500 }}>Class homepage</div>
            <div style={{ ...eyebrow, marginTop: 4, letterSpacing: ".06em" }}>{base.replace(/^https?:\/\//, "")}</div>
          </div>
        </div>
      </div>
    );
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

  // Default: a title card for a link we cannot or should not embed.
  return (
    <div style={{ ...wrap, justifyContent: "center", gap: "1.8vh" }}>
      {cast.kind ? <div style={{ ...eyebrow, color: "#e11d48" }}>{cast.kind}</div> : null}
      <div style={{ fontSize: "clamp(28px,4.2vw,62px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.12, maxWidth: "20ch" }}>
        {cast.title}
      </div>
      {cast.body ? (
        <div style={{ color: DIM, fontSize: "clamp(15px,1.8vw,26px)", maxWidth: "42ch", lineHeight: 1.45 }}>{cast.body}</div>
      ) : null}
      {cast.url ? <div style={{ ...eyebrow, marginTop: "2vh", letterSpacing: ".06em" }}>{cast.url.replace(/^https?:\/\//, "")}</div> : null}
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
    const anim = live.cast?.big ? (live.bigAnim || "drop") : (live.anim || "rise");
    const use = first ? "cut" : anim;
    setLayers(prev => [
      ...prev.map(l => ({ ...l, phase: "out", anim: use })),
      { key: "l" + live.n + "-" + live.at, cast: live.cast, anim: use, phase: "in" },
    ]);
    if (use === "drop" && stageRef.current) {
      const el = stageRef.current;
      el.classList.remove("cv-shake");
      void el.offsetWidth;
      el.classList.add("cv-shake");
      setTimeout(() => el && el.classList.remove("cv-shake"), 900);
    }
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
