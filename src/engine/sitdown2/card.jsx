// The card in front of the site on the morning of a student's sit-down: the
// time, the room, a button to the guide. Once per device per day, the way the
// due card is once per deadline, held in this browser rather than written to
// the class, because nothing about it needs to follow the student to another
// device. It reads the slot off the class row, so a moved student gets the
// moved time.

import * as TOKENS from "../tokens.js";
import { SITDOWN2, SITDOWN2_CLASSES, slotFor, isToday, guideHref } from "./facts.js";

const seenKey = (config, name, slot) => "sd2-card:" + config.id + ":" + String(name || "").toLowerCase() + ":" + slot.key;

/** The slot to show a card for right now, or null. */
export function sitdownToday(config, data, name, now = Date.now()) {
  if (!SITDOWN2_CLASSES.includes(config.id) || !name) return null;
  const slot = slotFor(data, name);
  if (!slot || !isToday(slot, now) || slot.ms + SITDOWN2.minutes * 60000 < now) return null;
  try { if (localStorage.getItem(seenKey(config, name, slot))) return null; } catch { /* show it */ }
  return slot;
}
export const dismissSitdown = (config, name, slot) => { try { localStorage.setItem(seenKey(config, name, slot), String(Date.now())); } catch { /* fine */ } };

const F = TOKENS.FONT.body;
export default function Sitdown2Card({ config, slot, onDone }) {
  const a = config.accent;
  const got = () => onDone?.();
  const open = () => { onDone?.(); window.location.href = guideHref(config); };
  return (
    <div aria-label="Your sit-down is today" style={{ minHeight: "100vh", background: TOKENS.SURFACE.page, fontFamily: F, color: TOKENS.TEXT.primary, display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: TOKENS.TEXT.muted, textTransform: "uppercase", letterSpacing: "0.08em", minHeight: TOKENS.TAP, display: "flex", alignItems: "center" }}>{config.code + " · Today"}</div>
        <section style={{ background: TOKENS.SURFACE.card, border: "1px solid " + TOKENS.LINE.soft, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 12px 32px -20px rgba(23,19,16,.35)" }}>
          <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>Your sit-down is today.</div>
          <div style={{ fontSize: 34, fontWeight: 700, color: a, lineHeight: 1.1, letterSpacing: "-0.01em" }}>{slot.say}</div>
          <div style={{ fontSize: 17, lineHeight: 1.5 }}>{SITDOWN2.room + ", Dr. Ishak's office, " + SITDOWN2.minutes + " minutes. Please be five minutes early."}</div>
        </section>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
          <button onClick={got} style={{ minHeight: 52, padding: "0 20px", borderRadius: 12, background: TOKENS.SURFACE.card, border: "1px solid " + TOKENS.LINE.strong, fontFamily: F, fontSize: 18, fontWeight: 600, color: TOKENS.TEXT.primary, cursor: "pointer" }}>Got it</button>
          <button onClick={open} style={{ flex: 1, minHeight: 52, padding: "0 20px", borderRadius: 12, background: a, color: "#fff", border: "none", fontFamily: F, fontSize: 18, fontWeight: 600, cursor: "pointer" }}>Open my Culture Guide</button>
        </div>
      </div>
    </div>
  );
}
