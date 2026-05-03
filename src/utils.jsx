// ─── SHARED UTILITY MODULE ────────────────────────────────────────────
// Pure functions and tiny components shared across all three classes.
// No state, no side effects, no class-specific behavior. Things that
// vary per class (like lastName overrides for multi-word last names)
// stay in the class file.

import React from "react";
import { F } from "./styles.jsx";

// ─── ID GENERATION ────────────────────────────────────────────────────
export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── ARRAY UTILITIES ──────────────────────────────────────────────────
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── POINT CALCULATIONS ───────────────────────────────────────────────
// Total points for a student from the log entries.
export function gp(log, sid) {
  return log.filter(e => e.studentId === sid).reduce((s, e) => s + e.amount, 0);
}

// ─── DUE DATE PARSING + FORMATTING ────────────────────────────────────
// Parses strings like "Apr 17" using the current year and returns a
// Date set to end-of-day. Returns null if the string is empty/invalid.
export function parseDueDate(dueStr) {
  if (!dueStr) return null;
  const year = new Date().getFullYear();
  const parsed = new Date(dueStr + ", " + year);
  if (isNaN(parsed.getTime())) return null;
  // Set to end of day so "due Apr 17" means midnight at the end of Apr 17
  parsed.setHours(23, 59, 59, 999);
  return parsed;
}

// Formats a due date for display. Appends time-of-day (defaults to 11:59 PM).
// Example: fmtDue("Apr 17", "11:59 PM") -> "Thu, Apr 17, 11:59 PM"
export function fmtDue(dueStr, dueTime) {
  if (!dueStr) return "";
  const d = parseDueDate(dueStr);
  const datePart = d
    ? d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : dueStr;
  const timePart = dueTime || "11:59 PM";
  return datePart + ", " + timePart;
}

// ─── TOAST COMPONENT ──────────────────────────────────────────────────
// Tiny notification banner pinned to the top of the page. Shows nothing
// when message is empty. Auto-dismiss is the caller's responsibility.
export function Toast({ message }) {
  if (!message) return null;
  return (
    <div style={{
      position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)",
      background: "#18181b", color: "#fff", padding: "10px 24px", borderRadius: 12,
      fontWeight: 600, zIndex: 100, fontFamily: F, fontSize: 14,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    }}>
      {message}
    </div>
  );
}
