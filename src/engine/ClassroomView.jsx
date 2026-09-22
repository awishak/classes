// Classroom View — the projector screen. One unlisted URL per class
// (/comm118/today). It holds the idle screen until the instructor casts
// something from the Dashboard, then swaps content with the chosen animation.
//
// Read-only: this surface never writes to the cast bus. Press F for fullscreen,
// right and left for the next slide and back, space for black; those three
// reach the dashboard in another window of the same browser.

import { useEffect, useRef, useState } from "react";
import { useLive } from "./live.js";
import { useClassData } from "./store.js";
import { currentDay, dayTitles } from "./days.js";
import RoomSlide, { ROOM_FONTS_HREF } from "./RoomSlide.jsx";
import { ENGINE_LIST } from "../config/registry.js";
import { mediaLabel } from "./media.js";
import { useSurround } from "./imageColor.js";
import { savedPin, rememberPin, checkPin, PinForm } from "../InstructorGate.jsx";
import { authHeaders } from "./session.js";
import PickMark from "./Pick.jsx";
import * as TOKENS from "./tokens.js";
import { setClassFavicon } from "./favicon.js";
import { useStudentTheme, useDayNight, ThemeStyle } from "./ThemeShell.jsx";
import { ThemeChrome, ThemeTopper, Tubey } from "./ThemeChrome.jsx";

// The theme's face. Outfit on Clean and Business, Nunito on Snapchat,
// Fredoka on Crashing Out. One declaration, and every use below follows.
const F = TOKENS.FONT.body;
const MONO = TOKENS.FONT.label;
const STAGE = TOKENS.ROOM.stage;
const INK = TOKENS.ROOM.ink;
const DIM = TOKENS.ROOM.dim;
const LINE = TOKENS.ROOM.line;

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

/* The class switcher. This screen is a projector, so a permanent dropdown would
   be a dropdown on the wall in front of thirty people. It behaves like video
   player controls instead: it appears when the podium mouse moves and goes away
   three seconds later. */
.cv-controls{position:fixed;top:0;right:0;z-index:9;padding:14px 18px;display:flex;gap:10px;align-items:center;
  opacity:0;transition:opacity .35s;pointer-events:none}
.cv-controls.on{opacity:1;pointer-events:auto}
.cv-controls select{font-family:${MONO};font-size:12px;letter-spacing:.08em;color:${DIM};
  background:rgba(20,17,15,.9);border:1px solid ${LINE};border-radius:8px;padding:7px 9px;min-height:34px;cursor:pointer}
`;

// A photo on the wall: the picture fit to the screen, on the average of its
// own edge, with nothing written over it. `imageColor.js` does the reading,
// and a picture it cannot read stands on black the way it always did.
function Photo({ src }) {
  const bg = useSurround(src) || "#000";
  return (
    <div style={{ position: "absolute", inset: 0, background: bg }}>
      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
    </div>
  );
}

const eyebrow = { fontFamily: TOKENS.FONT.label, fontSize: "clamp(11px,1.1vw,15px)", letterSpacing: ".16em", textTransform: "uppercase", color: DIM };

// ─── the content types a cast can be ───
// Exported so the build can render each kind of cast on its own. The room
// screen reads what is live off the store, which server-side is nothing, so a
// test that mounts the whole screen proves only that the empty screen draws.
export function Content({ cast, config, plan, data }) {
  const pad = "clamp(28px,5vw,80px)";
  const wrap = { position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: pad, color: INK, fontFamily: F };

  if (!cast) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const base = origin + config.path;
    return (
      <div style={{ ...wrap, alignItems: "center", justifyContent: "center", textAlign: "center", gap: "2.2vh" }}>
        <div style={eyebrow}>{config.code} &middot; {todayLabel()}</div>
        <div style={{ fontFamily: TOKENS.FONT.display, fontSize: "clamp(30px,4.6vw,68px)", fontWeight: TOKENS.FONT.displayWeight, letterSpacing: "-.03em", lineHeight: 1.08 }}>
          {plan?.topic || config.name}
        </div>
        {plan?.notes ? (
          <div style={{ color: DIM, fontSize: "clamp(15px,1.7vw,24px)", maxWidth: "34ch", lineHeight: 1.45 }}>{plan.notes}</div>
        ) : null}
        <HomeLine base={base} />
      </div>
    );
  }

  // A slide template, on the class's own ground: paper or slate.
  if (cast.type === "slide") {
    return <RoomSlide slide={cast} ground={data?.roomGround} fit />;
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
        <div style={{ fontFamily: TOKENS.FONT.display, fontSize: "clamp(20px,2.4vw,34px)", fontWeight: TOKENS.FONT.displayWeight, color: DIM, letterSpacing: "-.01em" }}>
          {cast.title}
        </div>
        <div style={{ fontFamily: TOKENS.FONT.display, fontSize: "clamp(26px,4vw,58px)", fontWeight: TOKENS.FONT.displayWeight, letterSpacing: "-.03em", lineHeight: 1.16, maxWidth: "24ch" }}>
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
        {cast.join === "board" ? <JoinBlock base={origin + config.path} /> : null}
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



  if (cast.mode === "read" && (cast.openUrl || cast.url)) {
    return <ReadScreen url={cast.openUrl || cast.url} claim={cast.title} kind={cast.kind} pick={cast.pick} />;
  }

  if (cast.mode === "embed" && cast.url) {
    return <PageScreen url={cast.url} openUrl={cast.openUrl || cast.url} claim={cast.title} kind={cast.kind} pick={cast.pick} />;
  }

  if (cast.mode === "card" && (cast.openUrl || cast.url)) {
    return <CardScreen url={cast.openUrl || cast.url} claim={cast.title} kind={cast.kind} pick={cast.pick} />;
  }

  // A file rather than a link: a clip, a photo or a voice memo that came up
  // from a phone. The headline sits in the corner while the file has the
  // wall, so the room knows what the clip is about without a second cast.
  // autoPlay needs one click on this page first, and F for fullscreen is that
  // click.
  if (cast.type === "media" && cast.src) {
    const corner = { position: "absolute", left: pad, bottom: pad, right: pad, ...eyebrow, color: "rgba(250,246,240,.8)",
      textShadow: "0 1px 6px rgba(0,0,0,.7)", pointerEvents: "none" };
    if (cast.media === "audio") {
      return (
        <div style={{ ...wrap, alignItems: "center", justifyContent: "center", textAlign: "center", gap: "3vh" }}>
          <div style={eyebrow}>{cast.tag || "Listen"}</div>
          <div style={{ fontSize: "clamp(28px,4.4vw,64px)", fontWeight: 500, letterSpacing: "-.025em", lineHeight: 1.24, maxWidth: "21ch" }}>
            {cast.title}
          </div>
          <audio src={cast.src} autoPlay controls style={{ width: "min(640px,80vw)" }} />
        </div>
      );
    }
    // A document dropped on the day: a PDF the browser draws, an Office file
    // through Microsoft's viewer. The file's own link waits in the corner for
    // the day the viewer stays blank. Anything with no viewer at all is a
    // title card and that link.
    const isDoc = ["pdf", "deck", "doc", "sheet", "file"].includes(cast.media);
    if (isDoc) {
      const open = (
        <a href={cast.src} target="_blank" rel="noopener noreferrer" style={openPill}>{"Open " + (cast.name || mediaLabel(cast.media)) + " ↗"}</a>
      );
      if (!cast.view) {
        return (
          <div style={{ ...wrap, alignItems: "center", justifyContent: "center", textAlign: "center", gap: "3vh" }}>
            <div style={eyebrow}>{cast.tag || mediaLabel(cast.media)}</div>
            <div style={{ fontSize: "clamp(28px,4.4vw,64px)", fontWeight: 500, letterSpacing: "-.025em", lineHeight: 1.24, maxWidth: "21ch" }}>
              {cast.title}
            </div>
            {open}
          </div>
        );
      }
      return (
        <div style={{ position: "absolute", inset: 0, background: "#000" }}>
          <iframe src={cast.view} title={cast.title || mediaLabel(cast.media)}
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            allow="fullscreen" referrerPolicy="no-referrer" />
          <div style={{ ...corner, pointerEvents: "none", display: "flex", alignItems: "center", gap: "clamp(12px,1.5vw,24px)" }}>
            <span>{cast.title}</span>
            <span style={{ pointerEvents: "auto" }}>{open}</span>
          </div>
        </div>
      );
    }
    // A photo is the photo. Andrew, 2026-09-22: "i dont know why we have
    // corner title. if i have an image, all i want is the image." A clip
    // keeps its headline, because a clip is playing and the room wants to
    // know what it is watching.
    if (cast.media === "image") return <Photo src={cast.src} />;
    return (
      <div style={{ position: "absolute", inset: 0, background: "#000" }}>
        <video src={cast.src} autoPlay playsInline controls poster={cast.poster}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", background: "#000" }} />
        {cast.title ? <div style={corner}>{cast.title}</div> : null}
      </div>
    );
  }

  if (cast.type === "reveal") {
    return (
      <div style={{ ...wrap, alignItems: "center", justifyContent: "center", textAlign: "center", gap: "2vh" }}>
        <div style={{ ...eyebrow, color: "#e11d48", border: "1px solid rgba(225,29,72,.45)", borderRadius: 8, padding: "6px 14px" }}>
          {cast.stamp || "New challenge"}
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
        {cast.pick ? <PickMark size={80} label /> : null}
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
      {cast.pick ? <PickMark size={80} label /> : null}
      <div style={{ fontSize: "clamp(30px,4.6vw,70px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.1, maxWidth: "20ch" }}>
        {cast.title}
      </div>
      {cast.body ? (
        <div style={{ color: DIM, fontSize: "clamp(15px,1.8vw,26px)", maxWidth: "42ch", lineHeight: 1.45 }}>{cast.body}</div>
      ) : null}
    </div>
  );
}

// ─── an article on the wall ───
//
// Three ways to put a link up, and one rule under all of them: the headline
// Andrew wrote goes first and biggest, because the room reads the wall from a
// distance and the article's own title is somebody else's headline.
//
//   Read   the page fetched and set for the back row: headline, then the
//          first paragraphs and the picture, then where it came from.
//   Page   the page itself in a frame, for the few sites that allow it. Most
//          refuse, and a refused frame is a black rectangle with no error, so
//          the reader API says in advance whether a site will frame and the
//          wall shows the card with a reason instead.
//   Card   the headline over the article's picture. The title card.
//
// All three read the same endpoint, /api/read, which is cached for ten minutes
// so switching between them costs one fetch.

function useArticle(url) {
  const [state, setState] = useState({ loading: !!url });
  useEffect(() => {
    if (!url) return undefined;
    let alive = true;
    setState({ loading: true });
    fetch("/api/read?url=" + encodeURIComponent(url))
      .then(r => r.json())
      .then(d => { if (alive) setState({ loading: false, ...d }); })
      .catch(() => { if (alive) setState({ loading: false, ok: false, reason: "Could not reach that page." }); });
    return () => { alive = false; };
  }, [url]);
  return state;
}

const openPill = {
  flex: "none", fontFamily: F, fontSize: "clamp(14px,1.4vw,21px)", fontWeight: 600, color: INK,
  textDecoration: "none", border: "2px solid " + DIM, borderRadius: 999,
  padding: "0.5vh clamp(14px,1.5vw,24px)", whiteSpace: "nowrap", minHeight: 34, display: "inline-flex", alignItems: "center",
};

// The last line of every article screen: where the page came from, and the
// way out to the real thing. The host, never the URL, which is unreadable at
// ten feet.
function SourceLine({ url, site, title, claim }) {
  const sub = title && title !== claim ? title : "";
  return (
    <div style={{ borderTop: "1px solid " + LINE, paddingTop: "1.6vh", display: "flex", alignItems: "center", gap: "clamp(14px,2vw,32px)" }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.4vh" }}>
        <div style={{ ...eyebrow, color: TOKENS.ROOM.live || "#e11d48" }}>{site || hostOf(url)}</div>
        {sub ? <div style={{ fontSize: "clamp(15px,1.5vw,23px)", color: DIM, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div> : null}
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" style={openPill}>{"Open " + hostOf(url) + " \u2197"}</a>
    </div>
  );
}

const headlineStyle = { fontSize: "clamp(30px,4.4vw,66px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.08, maxWidth: "22ch" };

// Read: the headline, then the first paragraphs beside the picture. Three
// paragraphs at a size the back row can read beat six at a size nobody can,
// and the fade at the bottom says there is more without cutting a line in
// half.
function ReadScreen({ url, claim, kind, pick }) {
  const a = useArticle(url);
  const wrap = { position: "absolute", inset: 0, display: "flex", flexDirection: "column",
    padding: "clamp(28px,4.4vw,72px)", color: INK, fontFamily: F, gap: "2vh" };

  if (a.loading) {
    return <div style={{ ...wrap, alignItems: "center", justifyContent: "center" }}><div style={eyebrow}>Reading the page</div></div>;
  }
  if (!a.ok) return <CardScreen url={url} claim={claim} kind={kind} pick={pick} article={a} note={a.reason} />;

  const paras = (a.paragraphs || []).slice(0, 3);
  return (
    <div style={{ ...wrap, overflow: "hidden" }}>
      {pick ? <PickMark size={64} label /> : null}
      <div style={headlineStyle}>{claim || a.title}</div>
      <div style={{ display: "flex", gap: "clamp(20px,2.8vw,48px)", minHeight: 0, flex: 1, alignItems: "stretch" }}>
        <div style={{ flex: 1, minWidth: 0, position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.6vh" }}>
            {paras.map((t, i) => (
              <p key={i} style={{ margin: 0, fontSize: "clamp(17px,1.65vw,26px)", lineHeight: 1.42, color: i === 0 ? INK : DIM, maxWidth: "60ch" }}>{t}</p>
            ))}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "14%", pointerEvents: "none",
            background: "linear-gradient(to bottom, rgba(15,13,12,0), " + STAGE + ")" }} />
        </div>
        {a.image ? (
          <img src={a.image} alt="" style={{ width: "36%", maxWidth: "36%", flex: "none", objectFit: "cover", borderRadius: 16, alignSelf: "stretch", background: LINE }} />
        ) : null}
      </div>
      <SourceLine url={url} site={a.site} title={a.title} claim={claim} />
    </div>
  );
}

// Page: the site itself, when the site allows framing. When the reader says
// the site refuses, the card goes up with a line saying so, which beats a
// black rectangle and a podium wondering what went wrong.
function PageScreen({ url, openUrl, claim, kind, pick }) {
  const a = useArticle(openUrl);
  if (!a.loading && a.framable === false) {
    return <CardScreen url={openUrl} claim={claim} kind={kind} pick={pick} article={a}
      note={(a.site || hostOf(openUrl)) + " does not let its pages show inside another site. Open the page instead."} />;
  }
  // A site that blocks the reader outright (ESPN answers a server with an
  // empty page) tells us nothing about framing, and the frame may still come
  // up black. So a line waits in the corner for that case, and the way out
  // with it.
  const blind = !a.loading && a.ok === false;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000" }}>
      <iframe
        src={url}
        title={claim || "Cast"}
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        allow="autoplay; fullscreen; picture-in-picture"
        referrerPolicy="no-referrer"
      />
      {blind ? (
        <div style={{ position: "absolute", left: "clamp(20px,3vw,48px)", bottom: "clamp(20px,3vw,48px)", display: "flex", alignItems: "center", gap: "clamp(12px,1.5vw,24px)",
          padding: "clamp(10px,1.2vw,18px) clamp(14px,1.8vw,28px)", borderRadius: 16, background: "rgba(15,13,12,.92)", color: DIM, fontFamily: F,
          fontSize: "clamp(14px,1.4vw,21px)", lineHeight: 1.35, maxWidth: "min(60ch, 80vw)" }}>
          <span>If the wall stays black, {hostOf(openUrl)} refuses to be shown inside another site.</span>
          <a href={openUrl} target="_blank" rel="noopener noreferrer" style={openPill}>{"Open " + hostOf(openUrl) + " \u2197"}</a>
        </div>
      ) : null}
    </div>
  );
}

// Card: the headline over the article's own picture, dimmed enough to read
// through. No picture, no fetch yet, or nothing readable: the headline on the
// stage, with the source under it, which is the title card the room had before
// and is still a fine thing to project.
function CardScreen({ url, claim, kind, pick, article, note }) {
  const fetched = useArticle(article ? "" : url);
  const a = article || fetched;
  const image = a && a.ok && a.image;
  const pad = "clamp(28px,4.4vw,72px)";
  const wrap = { position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end",
    padding: pad, color: INK, fontFamily: F, gap: "2vh" };
  return (
    <div style={{ position: "absolute", inset: 0, background: STAGE }}>
      {image ? (
        <>
          <img src={image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(15,13,12,.96) 0%, rgba(15,13,12,.72) 45%, rgba(15,13,12,.25) 100%)" }} />
        </>
      ) : null}
      <div style={wrap}>
        {pick ? <PickMark size={64} label /> : null}
        <div style={{ ...headlineStyle, fontSize: "clamp(34px,5vw,76px)", textShadow: image ? "0 2px 18px rgba(0,0,0,.5)" : "none" }}>
          {claim || (a && a.title) || hostOf(url)}
        </div>
        {note ? <div style={{ fontSize: "clamp(15px,1.5vw,23px)", color: DIM, maxWidth: "50ch", lineHeight: 1.4 }}>{note}</div> : null}
        <SourceLine url={url} site={(a && a.site) || kind} title={a && a.ok ? a.title : ""} claim={claim} />
      </div>
    </div>
  );
}

const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return "the page"; } };

// Where to answer a discussion prompt. Andrew, 2026-09-20: "I don't want the
// QR code or the ask page on the slides at all." So the address, said plainly
// and big enough to read from the back, and no code to scan.
function JoinBlock({ base }) {
  return (
    <div style={{ marginTop: "2.5vh", textAlign: "center" }}>
      <div style={{ fontSize: "clamp(15px,1.6vw,22px)", fontWeight: 500 }}>Answer on your phone</div>
      <div style={{ ...eyebrow, marginTop: 4, letterSpacing: ".06em" }}>{base.replace(/^https?:\/\//, "")}/board</div>
      <div style={{ color: DIM, fontSize: "clamp(12px,1.1vw,15px)", marginTop: 6 }}>Everyone reads what everyone writes.</div>
    </div>
  );
}

// The class's address, on the wall. Andrew, 2026-09-20: "remove the QR code,
// forget about headlines for now." The code sent a phone to the ask page, and
// the ask page is gone; the address is worth saying anyway, because the idle
// screen is up while the room fills.
function HomeLine({ base }) {
  return (
    <div style={{ marginTop: "2.5vh", textAlign: "center" }}>
      <div style={{ fontSize: "clamp(15px,1.6vw,22px)", fontWeight: 500 }}>Class homepage</div>
      <div style={{ ...eyebrow, marginTop: 4, letterSpacing: ".06em" }}>{base.replace(/^https?:\/\//, "")}</div>
    </div>
  );
}

function todayLabel(d) {
  const day = d || new Date();
  return day.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

// Appears on movement at the podium, gone three seconds later.
function Controls({ config }) {
  const [on, setOn] = useState(false);
  const timer = useRef(null);
  useEffect(() => {
    const wake = () => {
      setOn(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setOn(false), 3000);
    };
    window.addEventListener("mousemove", wake);
    window.addEventListener("keydown", wake);
    return () => {
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("keydown", wake);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className={"cv-controls" + (on ? " on" : "")}>
      <select value={config.id} aria-label="Class"
        onChange={e => {
          const next = ENGINE_LIST.find(c => c.id === e.target.value);
          if (!next) return;
          window.history.pushState({}, "", next.path + "/today");
          window.dispatchEvent(new PopStateEvent("popstate"));
        }}>
        {ENGINE_LIST.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
      </select>
    </div>
  );
}

export default function ClassroomView({ config }) {
  const [theme] = useStudentTheme(config);
  const [mode] = useDayNight(config);
  const [live] = useLive(config.storageKey);
  const [data] = useClassData(config.storageKey);

  // The idle screen shows today's topic, so it needs the class data too.
  const weeks = data?.schedule || config.scheduleWeeks || [];
  const day = currentDay(weeks);
  const dayPlan = day ? (data?.dayPlans || {})[day.date] : null;
  // What the day is called, the way every other surface calls it: the title
  // written on the day wins, and carries forward until the next one. Andrew,
  // 2026-09-20: "why is the screen showing 'identifying stories and framing'
  // for today if that is no longer the topic for the day?" Because this read
  // the week's topic and nothing else, so renaming the day on the dashboard
  // left the wall saying the old words.
  const titles = day ? dayTitles(weeks, data?.dayPlans) : null;
  const plan = day
    ? { topic: (titles?.[day.date]?.title || "").trim() || day.topic || config.name, notes: dayPlan?.notes || "" }
    : null;
  const [layers, setLayers] = useState([]); // [{ key, cast, anim, phase }]
  const seen = useRef(-1);
  const stageRef = useRef(null);
  const [beam, setBeam] = useState(0);

  useEffect(() => { document.title = config.code + " — Today"; setClassFavicon(config); }, [config.code, config.accent]);

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
  // Right and left go to the next slide and back, and space goes to black.
  // This screen never writes to the cast bus with the key in the bundle, so
  // a student with /today open cannot drive the class. A key pressed here
  // goes two ways at once: on a channel only this browser can hear, for a
  // dashboard open in another window of it, and to the server with the
  // instructor PIN, which writes the request onto the live row for a
  // dashboard open on any machine. Both carry the same id, so the move is
  // made once. Andrew, 2026-09-22: "yeah need a pin check."
  const [asking, setAsking] = useState(null);   // the key waiting on a PIN
  const send = useRef(null);
  send.current = async (what) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    try { new BroadcastChannel("classes-room-keys").postMessage({ room: config.storageKey, what, id }); } catch { /* no channel here */ }
    const pin = savedPin();
    const auth = await authHeaders();
    if (!pin && !auth.Authorization) { setAsking(what); return; }
    fetch("/api/room-key", {
      method: "POST", headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ pin, room: config.storageKey, what, id }),
    }).then(async r => {
      // A PIN this machine remembered that no longer matches: ask again.
      if (r.status === 401) { rememberPin(""); setAsking(what); }
    }).catch(() => {});
  };
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "f" || e.key === "F") {
        const el = document.documentElement;
        if (document.fullscreenElement) document.exitFullscreen?.();
        else el.requestFullscreen?.();
        return;
      }
      if (e.key === "Escape") { setAsking(null); return; }
      const what = e.key === "ArrowRight" ? "next" : e.key === "ArrowLeft" ? "prev" : e.key === " " ? "black" : "";
      if (!what) return;
      e.preventDefault();
      send.current(what);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [config.storageKey]);

  return (
    <div ref={stageRef} data-theme={theme} data-mode={mode} style={{ position: "fixed", inset: 0, background: STAGE, overflow: "hidden", fontFamily: F }}>
      <ThemeStyle theme={theme} />
      <ThemeChrome theme={theme} />
      <style>{CSS}</style>
      <link rel="stylesheet" href={ROOM_FONTS_HREF} />
      {/* The wall gets the theme's furniture too, at the size a room reads.
          Crashing Out runs its marquee across the top and stands Tubey in the
          corner; every other theme leaves the wall to whatever is cast. */}
      <ThemeTopper theme={theme} lines={[config.code, "ANSWER ON YOUR PHONE"]} fixed />
      {asking ? (
        <div style={{ position: "absolute", right: "clamp(20px,3vw,48px)", bottom: "clamp(20px,3vw,48px)", zIndex: 30, padding: 20, borderRadius: 16,
          background: TOKENS.SURFACE.card, color: TOKENS.TEXT.primary, boxShadow: "0 24px 60px -20px rgba(0,0,0,.6)" }}>
          <PinForm compact title="Drive the screen from here" note="The PIN, once; this machine remembers it."
            onDone={async (pin) => {
              const r = await checkPin(pin);
              if (r.ok) { rememberPin(pin); const what = asking; setAsking(null); send.current(what); }
              return r;
            }} />
        </div>
      ) : null}
      {theme === "crashing" ? (
        <div style={{ position: "absolute", left: "2.5vw", bottom: "3vh", zIndex: 5, pointerEvents: "none",
          display: "flex", alignItems: "flex-end", gap: "1.2vw" }}>
          <Tubey size={140} />
          <span style={{ fontFamily: "'Bangers', cursive", fontSize: "clamp(18px,1.8vw,26px)",
            color: "var(--room-dim)", paddingBottom: "1.4vh" }}>SAY THE THING YOU ACTUALLY THINK</span>
        </div>
      ) : null}
      {live === null ? (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: DIM, fontFamily: MONO, fontSize: 13, letterSpacing: ".12em", textTransform: "uppercase" }}>
          Connecting
        </div>
      ) : layers.map(l => (
        <div key={l.key} className={"cv-layer cv-" + (l.phase === "in" ? "in-" : "out-") + (reduced ? "cut" : l.anim)}>
          <Content cast={l.cast} config={config} plan={plan} data={data} />
        </div>
      ))}
      {beam > 0 && !reduced ? <div key={"beam" + beam} className="cv-beam" /> : null}
      <Controls config={config} />
    </div>
  );
}
