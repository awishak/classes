import React, { useState, useEffect, useCallback, useRef } from "react";
import { AssignmentsView, Gradebook, GradingInbox, DEFAULT_ASSIGNMENTS } from "./Comm2Grades.jsx";
import { GameAdmin, StudentAnswerView, Accolades } from "./Comm2Game.jsx";

const STORAGE_KEY = "comm2-v1";

const SUPABASE_URL = "https://ybuchgebudixbyrcxpik.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidWNoZ2VidWRpeGJ5cmN4cGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0Nzg3OTIsImV4cCI6MjA4ODA1NDc5Mn0.aF2M_fj6bVYKw-Tz1XxI9SiQB7lAtWzuhBRZbsai8QY";
const SUPABASE_BUCKET = "class-photos";

async function uploadPhoto(file, studentId) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `comm2/${studentId}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${path}`, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + SUPABASE_KEY,
      "apikey": SUPABASE_KEY,
      "Content-Type": file.type,
      "x-upsert": "true",
    },
    body: file,
  });
  if (!res.ok) throw new Error("Upload failed: " + res.status);
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${path}?t=${Date.now()}`;
}

const POINT_SOURCES = [
  "Why I Chose to Go to College","Does Character Matter in College?","Ethics Bowl",
  "Special Occasion","Wildcard","Preview","3 Things to Know",
  "A Good Change Rd 1","Improvements","A Good Change Rd 2",
  "Game","Participation","Bonus","Other"
];

const SPEECH_SLOTS = [
  { id: "speech_college", name: "Why I Chose to Go to College", due: "Mon Apr 6, noon" },
  { id: "speech_character", name: "Does Character Matter in College?", due: "Fri Apr 10, noon" },
  { id: "speech_ethics", name: "Ethics Bowl", due: "Fri Apr 17, noon" },
  { id: "speech_occasion", name: "Special Occasion", due: "Fri Apr 24, noon" },
  { id: "speech_wildcard", name: "Wildcard", due: "Fri May 1, noon" },
  { id: "speech_preview", name: "Preview", due: "Fri May 8, noon" },
  { id: "speech_3things", name: "3 Things to Know", due: "Fri May 15, noon" },
  { id: "speech_goodchange1", name: "A Good Change Rd 1", due: "Wed May 27" },
  { id: "speech_improvements", name: "Improvements", due: "Fri Jun 5, noon" },
  { id: "speech_goodchange2", name: "A Good Change Rd 2", due: "Wed Jun 10, 12:10 PM" },
];

const ALL_STUDENTS = [
  "Derek Bell","Lillie Brooks","Thierry Darlan","Colin Kneafsey",
  "Alexia Kuvshinikov","Maliah McKenna","Eloise Merlino","Lia O'Donovan",
  "Phoebe Young","Anne Sephora Pohan","Mikhail Popov","Anna Rahman",
  "Amanda Sargent","Celia Scharmer","Arianna Swett","Isabel Tang",
  "Huy Tran","Lucy Tull","Clara Ubl","Ava Wennerstrom","Ryan Zarnegar",
];

const DEFAULT_SCHEDULE = [
  { week: 1, label: "Foundations", theme: "What Makes a Good Presentation", dates: [
    { date: "Mar 30", day: "Mon", topic: "Intro, icebreaker", assignment: "", notes: "" },
    { date: "Apr 1", day: "Wed", topic: "What makes a good presentation", assignment: "", notes: "Student opinions, 3-part framework (stands out, relevant to me, easy to follow), ethical value" },
    { date: "Apr 3", day: "Fri", topic: "", assignment: "", notes: "Good Friday", holiday: true },
  ]},
  { week: 2, label: "Storytelling", theme: "Telling Stories", dates: [
    { date: "Apr 6", day: "Mon", topic: "", assignment: "Why I Chose to Go to College due noon", notes: "No class", holiday: true },
    { date: "Apr 8", day: "Wed", topic: "Storytelling", assignment: "", notes: "" },
    { date: "Apr 10", day: "Fri", topic: "", assignment: "Does Character Matter in College? due noon", notes: "Submit by noon" },
  ]},
  { week: 3, label: "Ethics", theme: "Logic & Reasoning", dates: [
    { date: "Apr 13", day: "Mon", topic: "Logic and reasoning", assignment: "", notes: "" },
    { date: "Apr 15", day: "Wed", topic: "Prep", assignment: "", notes: "" },
    { date: "Apr 17", day: "Fri", topic: "", assignment: "Ethics Bowl due noon", notes: "Submit by noon" },
  ]},
  { week: 4, label: "Delivery", theme: "Delivery & Language", dates: [
    { date: "Apr 20", day: "Mon", topic: "Delivery", assignment: "", notes: "" },
    { date: "Apr 22", day: "Wed", topic: "Language", assignment: "", notes: "" },
    { date: "Apr 24", day: "Fri", topic: "", assignment: "Special Occasion due noon", notes: "No class, submit by noon", holiday: true },
  ]},
  { week: 5, label: "In Class", theme: "Speeches & Organization", dates: [
    { date: "Apr 27", day: "Mon", topic: "Special Occasion speeches", assignment: "", notes: "In-class presentations" },
    { date: "Apr 29", day: "Wed", topic: "TBD", assignment: "", notes: "" },
    { date: "May 1", day: "Fri", topic: "Wildcard speeches", assignment: "Wildcard due noon", notes: "In class", fri: true },
  ]},
  { week: 6, label: "Information", theme: "Information & Citing Sources", dates: [
    { date: "May 4", day: "Mon", topic: "Information and citing sources", assignment: "", notes: "" },
    { date: "May 6", day: "Wed", topic: "Prep", assignment: "", notes: "" },
    { date: "May 8", day: "Fri", topic: "", assignment: "Preview due noon", notes: "Submit by noon" },
  ]},
  { week: 7, label: "Organization", theme: "Organization", dates: [
    { date: "May 11", day: "Mon", topic: "Organization", assignment: "", notes: "" },
    { date: "May 13", day: "Wed", topic: "TBD", assignment: "", notes: "" },
    { date: "May 15", day: "Fri", topic: "", assignment: "3 Things to Know due noon", notes: "No class, submit by noon" },
  ]},
  { week: 8, label: "Persuasion", theme: "Persuasion & Visual Aids", dates: [
    { date: "May 18", day: "Mon", topic: "Persuasion", assignment: "", notes: "" },
    { date: "May 20", day: "Wed", topic: "Visual aids", assignment: "", notes: "" },
    { date: "May 22", day: "Fri", topic: "Q&A", assignment: "", notes: "No speech this week" },
  ]},
  { week: 9, label: "A Good Change", theme: "Q&A & Presentations", dates: [
    { date: "May 25", day: "Mon", topic: "", assignment: "", notes: "MEMORIAL DAY", holiday: true },
    { date: "May 27", day: "Wed", topic: "A Good Change Rd 1 speeches", assignment: "", notes: "In-class presentations" },
    { date: "May 29", day: "Fri", topic: "Review", assignment: "", notes: "In class", fri: true },
  ]},
  { week: 10, label: "Wrap-up", theme: "Workshop & Improvements", dates: [
    { date: "Jun 1", day: "Mon", topic: "Presentation workshop", assignment: "", notes: "" },
    { date: "Jun 3", day: "Wed", topic: "", assignment: "", notes: "No class", holiday: true },
    { date: "Jun 5", day: "Fri", topic: "Improvements speeches", assignment: "Improvements due noon", notes: "In class", fri: true },
  ]},
  { week: 11, label: "Finals", theme: "", dates: [
    { date: "Jun 10", day: "Wed", topic: "A Good Change Rd 2", assignment: "A Good Change Rd 2 at 12:10 PM", notes: "Finals week" },
  ]},
];

const ACCENT = "#2563eb";
const ACCENT_LIGHT = "#dbeafe";
const BG = "#ffffff";
const BORDER = "#f3f4f6";
const BORDER_STRONG = "#e5e7eb";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#4b5563";
const TEXT_MUTED = "#9ca3af";
const GREEN = "#10b981";
const RED = "#ef4444";
const AMBER = "#f59e0b";
const PURPLE = "#8b5cf6";
const TEAL = "#14b8a6";
const F = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const CONTAINER_MAX = 960;

if (typeof document !== "undefined" && !document.getElementById("outfit-font")) {
  const link = document.createElement("link");
  link.id = "outfit-font";
  link.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);
  const style = document.createElement("style");
  style.textContent = "body { font-family: " + F + "; }";
  document.head.appendChild(style);
}
if (typeof document !== "undefined" && !document.getElementById("comm2-responsive")) {
  const style = document.createElement("style");
  style.id = "comm2-responsive";
  style.textContent = `
    .schedule-days-c2 { grid-template-columns: 1fr !important; }
    @media (min-width: 700px) { .schedule-days-c2 { grid-template-columns: repeat(3, 1fr) !important; } }
    @media (min-width: 700px) { .schedule-days-c2[data-cols="2"] { grid-template-columns: repeat(2, 1fr) !important; } }
    @media (min-width: 700px) { .schedule-days-c2[data-cols="1"] { grid-template-columns: 1fr !important; } }
    .home-grid-c2 { grid-template-columns: 1fr !important; }
    @media (min-width: 700px) { .home-grid-c2 { grid-template-columns: 1fr 1fr !important; } }
    @keyframes livePulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }
  `;
  document.head.appendChild(style);
}

const crd = { background: "#fff", borderRadius: 16, border: "1px solid " + BORDER_STRONG, overflow: "hidden", boxShadow: "0 1px 2px rgba(17, 24, 39, 0.04)" };
const pill = { padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F, border: "none", transition: "all 0.15s" };
const pillActive = { ...pill, background: TEXT_PRIMARY, color: "#fff" };
const pillInactive = { ...pill, background: "#f3f4f6", color: TEXT_SECONDARY };
const bt = { padding: "9px 18px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, cursor: "pointer", fontFamily: F, fontWeight: 700, fontSize: 13, transition: "all 0.15s", background: "#fff", color: TEXT_SECONDARY };
const linkPill = { padding: "6px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: F, border: "none", background: "#f3f4f6", color: TEXT_SECONDARY, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 };
const sectionLabel = { fontSize: 10, fontWeight: 800, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: F };
const inp = { background: "#fff", border: "1px solid " + BORDER_STRONG, borderRadius: 10, padding: "10px 12px", color: TEXT_PRIMARY, fontFamily: F, fontSize: 14, fontWeight: 500, outline: "none", width: "100%", boxSizing: "border-box" };
const sel = { ...inp, width: "auto" };

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

async function loadData() { try { const r = await window.storage.get(STORAGE_KEY, true); return r ? JSON.parse(r.value) : null; } catch { return null; } }

async function saveData(newData) {
  try {
    const current = await loadData();
    if (current && current.students && current.students.length > 0) {
      const curIds = new Set(current.students.map(s => s.id));
      const newIds = new Set((newData.students || []).map(s => s.id));
      const overlap = [...curIds].filter(id => newIds.has(id)).length;
      if (curIds.size > 5 && overlap < curIds.size * 0.5) {
        console.error("WRITE-LOCK: Blocked save. " + (curIds.size - overlap) + " of " + curIds.size + " students would be lost. Save rejected.");
        return false;
      }
      if ((current.log || []).length > 10 && (newData.log || []).length === 0) {
        console.error("WRITE-LOCK: Blocked save. Log went from " + current.log.length + " entries to 0. Save rejected.");
        return false;
      }
    }
    const r = await window.storage.set(STORAGE_KEY, JSON.stringify(newData), true);
    if (!r) console.error("saveData: storage.set returned null");
    return !!r;
  } catch(e) { console.error("saveData failed:", e); return false; }
}

function gp(log, sid) { return log.filter(e => e.studentId === sid).reduce((s, e) => s + e.amount, 0); }
function lastName(name) { if (name === "Anne Sephora Pohan") return "Pohan"; return name.split(" ").slice(-1)[0]; }
function lastSort(a, b) { return lastName(a).localeCompare(lastName(b)); }
function lastSortObj(a, b) { return lastName(a.name).localeCompare(lastName(b.name)); }
function rs(students, log) { return students.map(s => ({ ...s, points: gp(log, s.id) })).sort((a, b) => b.points - a.points); }

function Toast({ message }) { if (!message) return null; return <div style={{ position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)", background: "#18181b", color: "#fff", padding: "10px 24px", borderRadius: 12, fontWeight: 600, zIndex: 100, fontFamily: F, fontSize: 14, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>{message}</div>; }

function scrollToWithOffset(el, offset = 80) {
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({ top, behavior: "smooth" });
}

function PageHeader({ title, onBack, right }) {
  const goBack = () => {
    if (onBack) { onBack(); return; }
    try { window.history.back(); } catch(e) {}
  };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 8 }}>
      <button onClick={goBack} style={{
        display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px 6px 8px", borderRadius: 10,
        background: "#fff", border: "1px solid " + BORDER_STRONG, cursor: "pointer", fontFamily: F,
        fontSize: 13, color: TEXT_PRIMARY, fontWeight: 500,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        Back
      </button>
      {title && <div style={{ fontSize: 13, fontWeight: 500, color: TEXT_MUTED, letterSpacing: "0.05em", textTransform: "uppercase" }}>{title}</div>}
      <div>{right || <div style={{ width: 1 }} />}</div>
    </div>
  );
}

/* --- NAV --- */
const ADMIN_NAME = "Andrew Ishak";
const GUEST_NAME = "__guest__";
const TEST_STUDENT = "Bruce Willis";

function Nav({ view, setView, isAdmin, isGuest, userName, onLogout, studentView, setStudentView, courseTitle, testStudent, setTestStudent, allStudents, activitiesLive }) {
  // Student-visible (NO leaderboard for COMM 2)
  const studentTabs = [
    { id: "home", label: "Home", guest: false },
    { id: "schedule", label: "Schedule", guest: true },
    { id: "assignments", label: "Assignments", guest: false },
    { id: "more", label: "More", guest: false },
  ];
  const adminTabs = [
    { id: "pti", label: "PTI" },
    { id: "gradebook", label: "Gradebook" },
    { id: "todo", label: "To-Do" },
    { id: "admin", label: "Admin" },
  ];
  const visibleStudent = studentTabs.filter(t => !isGuest || t.guest);
  return (
    <div style={{ background: "#fff", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid " + BORDER }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ background: ACCENT, color: "#fff", padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 800, fontFamily: F, letterSpacing: "-0.01em" }}>{courseTitle || "Public Speaking"}</div>
        {studentView && <span style={{ fontSize: 11, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.05em" }}>Student View</span>}
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
        {visibleStudent.map(t => {
          const isActive = view === t.id;
          const isLiveDot = t.id === "activities" && activitiesLive;
          return (
            <button key={t.id} onClick={() => setView(t.id)} style={{
              ...pill,
              background: isActive ? TEXT_PRIMARY : "transparent",
              color: isActive ? "#fff" : TEXT_SECONDARY,
              position: "relative",
              fontWeight: 700,
            }}>
              {t.label}
              {isLiveDot && <span style={{ position: "absolute", top: 4, right: 4, width: 6, height: 6, borderRadius: "50%", background: GREEN, animation: "livePulse 1.6s ease-in-out infinite" }} />}
            </button>
          );
        })}
        {isAdmin && !isGuest && (
          <>
            <span style={{ width: 1, height: 18, background: BORDER_STRONG, margin: "0 4px" }} />
            {adminTabs.map(t => {
              const isActive = view === t.id;
              return (
                <button key={t.id} onClick={() => setView(t.id)} style={{
                  ...pill,
                  background: isActive ? TEXT_PRIMARY : "transparent",
                  color: isActive ? "#fff" : TEXT_MUTED,
                  fontSize: 11,
                  padding: "6px 10px",
                  fontWeight: 700,
                }}>{t.label}</button>
              );
            })}
          </>
        )}
        {setStudentView && !testStudent && (
          <button onClick={() => setStudentView(!studentView)} style={{
            padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
            fontFamily: F, border: studentView ? "1px solid #d97706" : "1px solid " + BORDER_STRONG,
            background: studentView ? "#fef3c7" : "#fff", color: studentView ? "#92400e" : TEXT_MUTED, transition: "all 0.15s",
          }}>{studentView ? "Exit" : "Student View"}</button>
        )}
        {setTestStudent && allStudents && (
          <select value={testStudent || ""} onChange={e => setTestStudent(e.target.value || null)} style={{
            padding: "5px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
            fontFamily: F, border: testStudent ? "1px solid " + RED : "1px solid " + BORDER_STRONG,
            background: testStudent ? "#fef2f2" : "#fff", color: testStudent ? RED : TEXT_MUTED,
            outline: "none", maxWidth: 140,
          }}>
            <option value="">Test as student...</option>
            {allStudents.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        )}
        <span style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: 4 }}>{userName}</span>
        <button onClick={onLogout} style={{
          padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
          fontFamily: F, border: "1px solid " + BORDER_STRONG,
          background: "#fff", color: TEXT_MUTED, transition: "all 0.15s",
        }}>Switch</button>
      </div>
    </div>
  );
}

/* --- NAME PICKER --- */
function NamePicker({ data, onSelect }) {
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(true);
  const pins = data?.pins || {};

  const names = data ? data.students.map(s => s.name).sort(lastSort) : [...ALL_STUDENTS].sort(lastSort);
  const sorted = [ADMIN_NAME, ...names.filter(n => n !== ADMIN_NAME && n !== TEST_STUDENT)];

  const tryLogin = () => {
    if (!selected) return;
    if (selected === ADMIN_NAME) {
      if (pin !== "118711") { setError("Wrong PIN"); setPin(""); return; }
      if (remember) { try { localStorage.setItem(STORAGE_KEY + "-user", selected); } catch(e) {} }
      onSelect(selected); return;
    }
    const student = data.students.find(s => s.name === selected);
    if (!student) return;
    const correctPin = pins[student.id];
    if (correctPin && pin !== String(correctPin)) { setError("Wrong PIN"); setPin(""); return; }
    if (remember) { try { localStorage.setItem(STORAGE_KEY + "-user", selected); } catch(e) {} }
    onSelect(selected);
  };

  if (selected) {
    return (
      <div style={{ minHeight: "100vh", background: "#fafaf9", color: TEXT_PRIMARY, fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ maxWidth: 360, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: ACCENT, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <span style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>2</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>{selected}</div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4 }}>Enter your PIN to continue</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid " + BORDER_STRONG, borderRadius: 14, padding: 18 }}>
            <input autoFocus type="password" inputMode="numeric" maxLength={6} value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }} onKeyDown={e => e.key === "Enter" && tryLogin()} placeholder="6-digit PIN" style={{ ...inp, textAlign: "center", fontSize: 22, fontWeight: 600, letterSpacing: "0.3em" }} />
            {error && <div style={{ fontSize: 13, color: RED, textAlign: "center", marginTop: 8, fontWeight: 500 }}>{error}</div>}
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, cursor: "pointer", fontSize: 13, color: TEXT_SECONDARY }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ width: 16, height: 16 }} />
              Remember me on this device
            </label>
            <button onClick={tryLogin} style={{ ...pill, background: ACCENT, color: "#fff", padding: "12px 0", width: "100%", marginTop: 14, fontSize: 14, fontWeight: 500 }}>Sign in</button>
            <button onClick={() => { setSelected(null); setPin(""); setError(""); }} style={{
              width: "100%", marginTop: 8, padding: "10px 0", background: "#fff",
              border: "1px solid " + BORDER_STRONG, borderRadius: 10, cursor: "pointer", fontFamily: F,
              fontSize: 13, fontWeight: 500, color: TEXT_SECONDARY,
            }}>Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf9", color: TEXT_PRIMARY, fontFamily: F, padding: "60px 20px 40px" }}>
      <div style={{ maxWidth: 420, width: "100%", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: ACCENT, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <span style={{ color: "#fff", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>2</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>COMM 2 · Spring 2026</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.02em", lineHeight: 1.15 }}>Public Speaking</div>
          <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 6 }}>MWF 9:15 to 10:20 am · Vari 128</div>
        </div>

        <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.55, textAlign: "center", marginBottom: 18, padding: "0 4px" }}>
          This app is our class hub. Please see Camino for official grades.
        </div>

        <div style={{ ...sectionLabel, marginBottom: 8, paddingLeft: 4 }}>Select your name</div>
        <div style={{ background: "#fff", border: "1px solid " + BORDER_STRONG, borderRadius: 14, padding: 4 }}>
          {sorted.map(name => {
            const student = data?.students?.find(s => s.name === name);
            const bio = student ? (data?.bios || {})[student.id] : null;
            const photoUrl = bio?.photo;
            const isAdmin = name === ADMIN_NAME;
            return (
              <button key={name} onClick={() => setSelected(name)} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 12px", textAlign: "left",
                fontFamily: F, fontSize: 14, fontWeight: isAdmin ? 600 : 400,
                background: "transparent",
                color: TEXT_PRIMARY,
                border: "none", borderRadius: 10, cursor: "pointer",
              }}>
                {photoUrl ? (
                  <img src={photoUrl} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <span style={{ width: 36, height: 36, borderRadius: "50%", background: isAdmin ? ACCENT : "#e4e4e7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: isAdmin ? "#fff" : TEXT_SECONDARY, flexShrink: 0 }}>
                    {name.split(" ").map(n => n[0]).join("")}
                  </span>
                )}
                <span style={{ flex: 1, minWidth: 0 }}>{name}</span>
                {isAdmin && <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 5, background: ACCENT + "12", color: ACCENT, textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>Instructor</span>}
              </button>
            );
          })}
        </div>

        <button onClick={() => onSelect(GUEST_NAME)} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "11px 16px",
          fontFamily: F, fontSize: 13, fontWeight: 500, color: TEXT_SECONDARY,
          background: "transparent", border: "1px dashed #d1d5db", borderRadius: 12, cursor: "pointer", marginTop: 12,
        }}>Continue as guest</button>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: TEXT_MUTED }}>aishak@scu.edu</div>
      </div>
    </div>
  );
}

/* ─── INSTRUCTOR CARD ─── */
const REBOUND_POLICY = `You can earn additional points after a low (or missing) score in some cases. Here are three different situations that might apply to you.

Rebound: You were present but scored below 80% on the grade scale. Submit a video within 48 hours explaining the material with a friend or family member. Points count for your grade only, not the in-class leaderboard.
  Under 50% -> can earn back to 60%
  50-65% -> can earn back to 70%
  66-79% -> can earn back to 80%

Planned Makeup: You told me about your absence ahead of time and I asked you to come to office hours for a makeup. Retake the activity live during office hours within one week. Full points available for both leaderboard and grade.

Unannounced Absence: You missed without notice. By default, no makeup is available.`;

const HOME_GRADE_PTS = { on_topic: 10, general: 10 };

function InstructorCard({ data, setData, isAdmin }) {
  const ic = data.instructorCard || {};
  const rm = data.requiredMedia || [];
  const [editing, setEditing] = useState(false);
  const [editIC, setEditIC] = useState(null);
  const [editRM, setEditRM] = useState(null);
  const [editCourseTitle, setEditCourseTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  // Set favicon on mount and when data changes
  React.useEffect(() => {
    if (data?.favicon) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
      link.href = data.favicon;
    }
  }, [data?.favicon]);

  const startEdit = () => {
    setEditIC({ name: ic.name || "Andrew Ishak", title: ic.title || "Teaching Professor, Communication", motto: ic.motto || "", description: ic.description || "", officeHours: ic.officeHours || "", bookingLabel: ic.bookingLabel || "Book a Meeting", bookingUrl: ic.bookingUrl || "", caminoUrl: ic.caminoUrl || "", syllabusUrl: ic.syllabusUrl || "", photo: ic.photo || "" });
    setEditRM(JSON.parse(JSON.stringify(rm)));
    setEditCourseTitle(data.courseTitle || "Public Speaking");
    setEditing(true);
  };

  const saveEdit = async () => {
    const updated = { ...data, instructorCard: editIC, requiredMedia: editRM, courseTitle: editCourseTitle };
    await saveData(updated); setData(updated);
    setEditing(false); showMsg("Saved");
  };

  const handlePhotoUpload = async (file) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = "instructor-" + STORAGE_KEY + "." + ext;
      const formData = new FormData();
      formData.append("", file);
      await fetch(SUPABASE_URL + "/storage/v1/object/class-photos/" + path, { method: "POST", headers: { "Authorization": "Bearer " + SUPABASE_KEY, "x-upsert": "true" }, body: formData });
      const url = SUPABASE_URL + "/storage/v1/object/public/class-photos/" + path + "?t=" + Date.now();
      setEditIC({ ...editIC, photo: url });
    } catch(e) { console.error(e); }
    setUploading(false);
  };

  const handleFaviconUpload = async (file) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = "favicon-" + STORAGE_KEY + "." + ext;
      const formData = new FormData(); formData.append("", file);
      await fetch(SUPABASE_URL + "/storage/v1/object/class-photos/" + path, { method: "POST", headers: { "Authorization": "Bearer " + SUPABASE_KEY, "x-upsert": "true" }, body: formData });
      const url = SUPABASE_URL + "/storage/v1/object/public/class-photos/" + path + "?t=" + Date.now();
      const updated = { ...data, favicon: url };
      await saveData(updated); setData(updated); showMsg("Favicon updated");
    } catch(e) { console.error(e); }
    setUploading(false);
  };

  const addMedia = () => setEditRM([...editRM, { id: genId(), title: "", description: "", url: "" }]);
  const removeMedia = (id) => setEditRM(editRM.filter(m => m.id !== id));
  const updateMedia = (id, field, value) => setEditRM(editRM.map(m => m.id === id ? { ...m, [field]: value } : m));

  const photo = editing ? editIC?.photo : ic.photo;
  const name = editing ? editIC?.name : (ic.name || "Andrew Ishak");
  const titleText = editing ? editIC?.title : (ic.title || "Teaching Professor, Communication");
  const motto = editing ? editIC?.motto : ic.motto;
  const description = editing ? editIC?.description : ic.description;
  const officeHours = editing ? editIC?.officeHours : ic.officeHours;
  const bookingLabel = editing ? editIC?.bookingLabel : (ic.bookingLabel || "Book a Meeting");
  const bookingUrl = editing ? editIC?.bookingUrl : ic.bookingUrl;
  const caminoUrl = editing ? editIC?.caminoUrl : ic.caminoUrl;
  const syllabusUrl = editing ? editIC?.syllabusUrl : ic.syllabusUrl;
  const mediaList = editing ? editRM : rm;

  return (
    <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
      {msg && <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#111", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 999 }}>{msg}</div>}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>Your Instructor</div>
        {isAdmin && !editing && <button onClick={startEdit} style={{ ...pillInactive, fontSize: 11, padding: "4px 10px" }}>Edit</button>}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        {photo ? (
          <img src={photo} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#fff", flexShrink: 0 }}>AI</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <>
              <input value={editIC.name} onChange={e => setEditIC({ ...editIC, name: e.target.value })} style={{ ...inp, fontSize: 15, fontWeight: 700, padding: "4px 8px", marginBottom: 4 }} />
              <input value={editIC.title} onChange={e => setEditIC({ ...editIC, title: e.target.value })} style={{ ...inp, fontSize: 13, padding: "4px 8px" }} />
            </>
          ) : (
            <>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>{name}</div>
              <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>{titleText}</div>
            </>
          )}
        </div>
      </div>

      {editing && (
        <label style={{ ...pillInactive, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "8px 0", cursor: "pointer", fontSize: 12, marginBottom: 6, width: "100%" }}>
          {uploading ? "Uploading..." : "Upload Photo"}
          <input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) handlePhotoUpload(e.target.files[0]); e.target.value = ""; }} style={{ display: "none" }} disabled={uploading} />
        </label>
      )}

      {/* Motto and description */}
      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase" }}>Motto</div>
          <input value={editIC.motto} onChange={e => setEditIC({ ...editIC, motto: e.target.value })} placeholder="e.g. Stay curious" style={{ ...inp, fontSize: 13, padding: "6px 10px" }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", marginTop: 4 }}>Description (links auto-detected)</div>
          <textarea value={editIC.description} onChange={e => setEditIC({ ...editIC, description: e.target.value })} placeholder="What you're watching, reading, thinking about..." rows={3} style={{ ...inp, fontSize: 13, padding: "6px 10px", resize: "vertical" }} />
        </div>
      ) : (
        <div style={{ marginBottom: (motto || description) ? 12 : 0 }}>
          {motto && <div style={{ fontSize: 14, fontStyle: "italic", color: TEXT_SECONDARY, marginBottom: description ? 6 : 0 }}>"{motto}"</div>}
          {description && <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{description.split(/(https?:\/\/[^\s]+)/g).map((part, i) => part.match(/^https?:\/\//) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>{part}</a> : part)}</div>}
        </div>
      )}

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase" }}>Course Title (nav bar)</div>
          <input value={editCourseTitle} onChange={e => setEditCourseTitle(e.target.value)} placeholder="e.g. Comm and Sport" style={{ ...inp, fontSize: 13, padding: "6px 10px" }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", marginTop: 4 }}>Favicon</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {data.favicon && <img src={data.favicon} alt="" style={{ width: 24, height: 24, borderRadius: 4 }} />}
            <label style={{ ...pillInactive, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "6px 12px", cursor: "pointer", fontSize: 12, flex: 1 }}>
              {uploading ? "Uploading..." : "Upload Favicon"}
              <input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) handleFaviconUpload(e.target.files[0]); e.target.value = ""; }} style={{ display: "none" }} disabled={uploading} />
            </label>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", marginTop: 4 }}>Office Hours</div>
          <input value={editIC.officeHours} onChange={e => setEditIC({ ...editIC, officeHours: e.target.value })} placeholder="e.g. Tue/Thu 2-4pm, St. Joseph's 215" style={{ ...inp, fontSize: 13, padding: "6px 10px" }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", marginTop: 4 }}>Links</div>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={editIC.bookingLabel} onChange={e => setEditIC({ ...editIC, bookingLabel: e.target.value })} placeholder="Booking label" style={{ ...inp, fontSize: 13, padding: "6px 10px", flex: 1 }} />
            <input value={editIC.bookingUrl} onChange={e => setEditIC({ ...editIC, bookingUrl: e.target.value })} placeholder="Booking URL" style={{ ...inp, fontSize: 13, padding: "6px 10px", flex: 2 }} />
          </div>
          <input value={editIC.caminoUrl} onChange={e => setEditIC({ ...editIC, caminoUrl: e.target.value })} placeholder="Camino URL" style={{ ...inp, fontSize: 13, padding: "6px 10px" }} />
          <input value={editIC.syllabusUrl} onChange={e => setEditIC({ ...editIC, syllabusUrl: e.target.value })} placeholder="Syllabus URL" style={{ ...inp, fontSize: 13, padding: "6px 10px" }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: officeHours || caminoUrl || syllabusUrl || bookingUrl ? 12 : 0 }}>
          {officeHours && <div style={{ fontSize: 13, color: TEXT_SECONDARY }}><span style={{ fontWeight: 600, color: TEXT_PRIMARY }}>Office Hours:</span> {officeHours}</div>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {caminoUrl && <a href={caminoUrl} target="_blank" rel="noopener noreferrer" style={{ ...pillInactive, fontSize: 12, textDecoration: "none", color: ACCENT }}>Camino</a>}
            {syllabusUrl && <a href={syllabusUrl} target="_blank" rel="noopener noreferrer" style={{ ...pillInactive, fontSize: 12, textDecoration: "none", color: ACCENT }}>Syllabus</a>}
            {bookingUrl && <a href={bookingUrl} target="_blank" rel="noopener noreferrer" style={{ ...pillInactive, fontSize: 12, textDecoration: "none", color: ACCENT }}>{bookingLabel}</a>}
          </div>
        </div>
      )}

      {(mediaList.length > 0 || editing) && (
        <div style={{ borderTop: "1px solid " + BORDER, paddingTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Required Media</div>
          {mediaList.map(m => editing ? (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8, padding: 8, background: "#f9fafb", borderRadius: 8 }}>
              <input value={m.title} onChange={e => updateMedia(m.id, "title", e.target.value)} placeholder="Title" style={{ ...inp, fontSize: 13, padding: "4px 8px" }} />
              <input value={m.description} onChange={e => updateMedia(m.id, "description", e.target.value)} placeholder="Description" style={{ ...inp, fontSize: 13, padding: "4px 8px" }} />
              <input value={m.url} onChange={e => updateMedia(m.id, "url", e.target.value)} placeholder="URL (optional)" style={{ ...inp, fontSize: 13, padding: "4px 8px" }} />
              <button onClick={() => removeMedia(m.id)} style={{ ...pillInactive, fontSize: 11, color: RED, alignSelf: "flex-start" }}>Remove</button>
            </div>
          ) : (
            <div key={m.id} style={{ marginBottom: 6 }}>
              {m.url ? (
                <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>{m.title}</a>
              ) : (
                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{m.title}</div>
              )}
              {m.description && <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>{m.description}</div>}
            </div>
          ))}
          {editing && <button onClick={addMedia} style={{ ...pillInactive, fontSize: 12, width: "100%" }}>+ Add Item</button>}
        </div>
      )}

      {editing && (
        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          <button onClick={saveEdit} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", flex: 1 }}>Save</button>
          <button onClick={() => setEditing(false)} style={{ ...pillInactive, flex: 1 }}>Cancel</button>
        </div>
      )}
    </div>
  );
}

/* --- SCHEDULE --- */
function WeekHeaderEditor({ week, wi, data, setData, onDone, onSaveAndBack }) {
  const [local, setLocal] = useState({ label: week.label || "", theme: week.theme || "", question: week.question || "" });
  const set = (field, value) => setLocal(prev => ({ ...prev, [field]: value }));
  const save = async () => {
    const updated = { ...data, schedule: data.schedule.map((w, i) => i === wi ? { ...w, label: local.label, theme: local.theme, question: local.question } : w) };
    await saveData(updated); setData(updated);
    if (onDone) onDone();
  };
  const saveAndBack = async () => {
    await save();
    if (onSaveAndBack) onSaveAndBack();
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={local.label} onChange={e => set("label", e.target.value)} placeholder="Label" style={{ ...inp, padding: "4px 8px", fontSize: 12, width: 90 }} />
        <input value={local.theme} onChange={e => set("theme", e.target.value)} placeholder="Theme" style={{ ...inp, padding: "4px 8px", fontSize: 12, flex: 1 }} />
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <input value={local.question} onChange={e => set("question", e.target.value)} placeholder="Driving question" style={{ ...inp, padding: "4px 8px", fontSize: 12, flex: 1 }} />
        <button onClick={save} style={{ ...bt, fontSize: 11, padding: "3px 10px", background: ACCENT, color: "#fff" }}>Save</button>
        {onSaveAndBack && <button onClick={saveAndBack} style={{ ...bt, fontSize: 11, padding: "3px 10px" }}>Go back</button>}
      </div>
    </div>
  );
}

function ScheduleCardEditor({ d, wi, realDi, data, setData, updateDate, removeDate, onDone, onSaveAndBack }) {
  const [local, setLocal] = useState({
    date: d.date, day: d.day, topic: d.topic || "", holiday: !!d.holiday,
    activities: (d.activities || []).join(", "), assignment: d.assignment || "",
    notes: d.notes || "", adminNotes: d.adminNotes || "",
  });
  const set = (field, value) => setLocal(prev => ({ ...prev, [field]: value }));

  const save = async () => {
    const patch = {
      date: local.date, day: local.day, topic: local.topic, holiday: local.holiday,
      activities: local.activities.split(",").map(s => s.trim()).filter(Boolean),
      assignment: local.assignment, notes: local.notes, adminNotes: local.adminNotes,
    };
    const updated = { ...data, schedule: data.schedule.map((w, i) => i === wi ? { ...w, dates: w.dates.map((dt, di) => di === realDi ? { ...dt, ...patch } : dt) } : w) };
    await saveData(updated); setData(updated);
    if (onDone) onDone();
  };
  const saveAndBack = async () => {
    await save();
    if (onSaveAndBack) onSaveAndBack();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }} onClick={e => e.stopPropagation()}>
      <div style={{ display: "flex", gap: 4 }}>
        <input value={local.date} onChange={e => set("date", e.target.value)} style={{ ...inp, padding: "3px 6px", fontSize: 11, width: 60 }} />
        <input value={local.day} onChange={e => set("day", e.target.value)} style={{ ...inp, padding: "3px 6px", fontSize: 11, width: 40 }} />
        <label style={{ fontSize: 11, color: TEXT_MUTED, display: "flex", alignItems: "center", gap: 2 }}><input type="checkbox" checked={local.holiday} onChange={e => set("holiday", e.target.checked)} />Off</label>
      </div>
      <textarea value={local.topic} onChange={e => set("topic", e.target.value)} placeholder="Topic" rows={2} style={{ ...inp, padding: "4px 6px", fontSize: 12, resize: "vertical" }} />
      <input value={local.activities} onChange={e => set("activities", e.target.value)} placeholder="Activities (comma-separated: Game, Fishbowl, etc.)" style={{ ...inp, padding: "3px 6px", fontSize: 11, fontWeight: 700 }} />
      <select value={local.assignment} onChange={e => set("assignment", e.target.value)} style={{ ...sel, width: "100%", fontSize: 11, padding: "3px 6px" }}>
        <option value="">No assignment due</option>
        {(data.assignments || []).filter(a => a.id !== "participation").map(a => (
          <option key={a.id} value={a.name + " due"}>{a.name}</option>
        ))}
      </select>
      <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>Readings</div>
      {(d.readings || []).map((r, ri) => {
        const rdg = (data.readings || []).find(x => x.id === r.readingId);
        return (
          <div key={ri} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, padding: "3px 6px", background: r.type === "required" ? "#fef2f2" : "#f0fdf4", borderRadius: 6 }}>
            <span style={{ flex: 1, color: "#374151", fontWeight: 500 }}>{rdg?.title || "Unknown"}</span>
            <select value={r.type} onChange={e => {
              const upd = [...(d.readings || [])]; upd[ri] = { ...upd[ri], type: e.target.value };
              updateDate(wi, realDi, "readings", upd);
            }} style={{ fontSize: 11, border: "none", background: "transparent", color: r.type === "fishbowl" ? "#7c3aed" : r.type === "required" ? "#b45309" : r.type === "additional" ? TEXT_MUTED : GREEN, fontWeight: 700, cursor: "pointer" }}>
              <option value="fishbowl">Fishbowl</option>
              <option value="required">Required</option>
              <option value="recommended">Recommended</option>
              <option value="additional">Additional</option>
            </select>
            <button onClick={() => {
              const upd = (d.readings || []).filter((_, i) => i !== ri);
              updateDate(wi, realDi, "readings", upd);
            }} style={{ background: "none", border: "none", cursor: "pointer", color: RED, fontSize: 12, padding: "0 2px" }}>x</button>
          </div>
        );
      })}
      {(data.readings || []).length > 0 ? (
        <select value="" onChange={e => {
          if (!e.target.value) return;
          const existing = d.readings || [];
          if (existing.some(r => r.readingId === e.target.value)) return;
          updateDate(wi, realDi, "readings", [...existing, { readingId: e.target.value, type: "required" }]);
        }} style={{ ...sel, width: "100%", fontSize: 11, padding: "3px 6px" }}>
          <option value="">+ Add reading...</option>
          {(data.readings || []).filter(r => !(d.readings || []).some(dr => dr.readingId === r.id)).map(r => (
            <option key={r.id} value={r.id}>{r.title}</option>
          ))}
        </select>
      ) : (
        <div style={{ fontSize: 11, color: TEXT_MUTED, fontStyle: "italic" }}>No readings in repository yet</div>
      )}
      <textarea value={local.notes} onChange={e => set("notes", e.target.value)} placeholder="Notes (students see this)" rows={2} style={{ ...inp, padding: "3px 6px", fontSize: 11, resize: "vertical" }} />
      <textarea value={local.adminNotes} onChange={e => set("adminNotes", e.target.value)} placeholder="Admin notes (students can't see)" rows={2} style={{ ...inp, padding: "3px 6px", fontSize: 11, resize: "vertical", borderColor: "#f59e0b", background: "#fffbeb" }} />
      <div style={{ display: "flex", gap: 4 }}>
        <button onClick={save} style={{ ...bt, fontSize: 11, padding: "3px 10px", background: ACCENT, color: "#fff" }}>Save</button>
        {onSaveAndBack && <button onClick={saveAndBack} style={{ ...bt, fontSize: 11, padding: "3px 10px" }}>Go back</button>}
        <button onClick={() => { if (window.confirm("Remove this day?")) { removeDate(wi, realDi); if (onDone) onDone(); } }} style={{ ...bt, fontSize: 11, padding: "3px 10px", background: "transparent", color: RED, border: "1px solid " + RED + "33", marginLeft: "auto" }}>Remove day</button>
      </div>
    </div>
  );
}

function ReadingsList({ d, readings }) {
  const [expanded, setExpanded] = useState(false);
  const items = (d.readings || []).filter(r => r.type === "fishbowl" || r.type === "required" || r.type === "recommended");
  if (items.length === 0) return null;
  const showCollapse = items.length > 5;
  const visible = showCollapse && !expanded ? items.slice(0, 5) : items;
  const hidden = items.length - visible.length;
  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid " + BORDER, display: "flex", flexDirection: "column", gap: 4 }}>
      {visible.map((r, ri) => {
        const rdg = readings.find(x => x.id === r.readingId);
        if (!rdg) return null;
        const link = rdg.pdfUrl || rdg.url;
        const tColor = r.type === "fishbowl" ? PURPLE : r.type === "required" ? "#b45309" : GREEN;
        const tLabel = r.type === "fishbowl" ? "Fish" : r.type === "required" ? "Req" : "Rec";
        const isReq = r.type === "required";
        return (
          <div key={ri} style={{ display: "flex", alignItems: "flex-start", gap: 6, background: isReq ? "#fffbeb" : "transparent", padding: isReq ? "4px 8px" : "2px 0", borderRadius: isReq ? 6 : 0 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: tColor, textTransform: "uppercase", marginTop: 2, flexShrink: 0, width: 28, letterSpacing: "0.05em" }}>{tLabel}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              {link ? (
                <a href={link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", fontWeight: 600, lineHeight: 1.35 }}>{rdg.title}</a>
              ) : (
                <span style={{ fontSize: 13, color: TEXT_PRIMARY, fontWeight: 600, lineHeight: 1.35 }}>{rdg.title}</span>
              )}
              {rdg.pdfUrl && <span style={{ fontSize: 9, fontWeight: 800, color: RED, background: "#fef2f2", padding: "1px 4px", borderRadius: 3, marginLeft: 4 }}>PDF</span>}
            </div>
          </div>
        );
      })}
      {showCollapse && (
        <button onClick={e => { e.stopPropagation(); setExpanded(!expanded); }} style={{ ...linkPill, alignSelf: "flex-start", marginTop: 2 }}>
          {expanded ? "Show fewer" : "Show " + hidden + " more"}
        </button>
      )}
    </div>
  );
}

function ScheduleView({ data, setData, isAdmin }) {
  const schedule = data.schedule || DEFAULT_SCHEDULE;
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  // Auto-jump on mount: try to land on today's date card; fall back to current-week header.
  React.useEffect(() => {
    const t = setTimeout(() => {
      const today = new Date();
      const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const year = today.getFullYear();
      let exactDayId = null;
      let nearestWeekIdx = -1;
      let smallestPositiveDiff = Infinity;
      schedule.forEach((week, wi) => {
        (week.dates || []).forEach((d, di) => {
          if (d.day === "Finals") return;
          const parsed = new Date(d.date + ", " + year);
          if (isNaN(parsed)) return;
          const diff = (parsed.getTime() - today0) / (1000 * 60 * 60 * 24);
          if (diff === 0 && exactDayId === null) {
            exactDayId = "view-" + wi + "-" + di;
          }
          if (diff >= -3 && diff <= 4 && nearestWeekIdx === -1) {
            nearestWeekIdx = wi;
          }
          if (diff > 0 && diff < smallestPositiveDiff) {
            smallestPositiveDiff = diff;
            if (nearestWeekIdx === -1) nearestWeekIdx = wi;
          }
        });
      });
      const id = exactDayId || (nearestWeekIdx >= 0 ? "view-week-" + nearestWeekIdx : null);
      if (id) {
        const el = document.getElementById(id);
        scrollToWithOffset(el);
      }
    }, 250);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  const updateDate = async (weekIdx, dateIdx, field, value) => {
    const updated = { ...data, schedule: data.schedule.map((w, wi) => wi === weekIdx ? { ...w, dates: w.dates.map((d, di) => di === dateIdx ? { ...d, [field]: value } : d) } : w) };
    await saveData(updated); setData(updated);
  };
  const addDate = async (weekIdx) => {
    const w = data.schedule[weekIdx];
    const existingDays = (w?.dates || []).map(d => d.day);
    const defaultDay = !existingDays.includes("Mon") ? "Mon" : !existingDays.includes("Wed") ? "Wed" : !existingDays.includes("Fri") ? "Fri" : "Fri";
    const updated = { ...data, schedule: data.schedule.map((w, wi) => wi === weekIdx ? { ...w, dates: [...w.dates, { date: "TBD", day: defaultDay, topic: "", assignment: "", notes: "" }] } : w) };
    await saveData(updated); setData(updated); showMsg("Added");
  };
  const removeDate = async (weekIdx, dateIdx) => {
    const updated = { ...data, schedule: data.schedule.map((w, wi) => wi === weekIdx ? { ...w, dates: w.dates.filter((_, di) => di !== dateIdx) } : w) };
    await saveData(updated); setData(updated); showMsg("Removed");
  };
  const addWeek = async () => {
    const newWeek = { week: schedule.length + 1, label: "", theme: "", dates: [{ date: "TBD", day: "Mon", topic: "" }, { date: "TBD", day: "Wed", topic: "" }] };
    const updated = { ...data, schedule: [...data.schedule, newWeek] };
    await saveData(updated); setData(updated); showMsg("Week added");
  };
  const removeWeek = async (weekIdx) => {
    const updated = { ...data, schedule: data.schedule.filter((_, i) => i !== weekIdx) };
    await saveData(updated); setData(updated); showMsg("Week removed");
  };
  const resetSchedule = async () => {
    const updated = { ...data, schedule: JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)) };
    await saveData(updated); setData(updated); showMsg("Reset");
  };

  const [editLinks, setEditLinks] = useState(false);
  const [docUrl, setDocUrl] = useState(data.scheduleDocUrl || "");
  const [canvaUrl, setCanvaUrl] = useState(data.scheduleCanvaUrl || "");
  const saveLinks = async () => {
    const updated = { ...data, scheduleDocUrl: docUrl.trim(), scheduleCanvaUrl: canvaUrl.trim() };
    await saveData(updated); setData(updated); setEditLinks(false); showMsg("Saved");
  };

  // Match a day's free-text assignment field to an entry in data.assignments by name
  const matchAssignment = (txt) => {
    if (!txt) return null;
    const lower = txt.toLowerCase();
    const candidates = (data.assignments || []).filter(a => a.id !== "participation");
    // Prefer longest matching name
    let best = null;
    candidates.forEach(a => {
      const n = (a.name || "").toLowerCase();
      if (!n) return;
      if (lower.includes(n)) {
        if (!best || n.length > best.name.toLowerCase().length) best = a;
      }
    });
    return best;
  };

  // Trigger a "switch view" event toward AssignmentsView; used elsewhere via the App's nav listener
  const goToAssignment = (assignmentId) => {
    const ev = new CustomEvent("nav", { detail: "assignments" });
    window.dispatchEvent(ev);
    // Optionally: store the target assignment in sessionStorage so AssignmentsView can scroll
    try { sessionStorage.setItem("comm118-jump-assignment", assignmentId); } catch(e) {}
  };

  // Scroll to a specific day's edit block in the admin panel
  const scrollToEdit = (wi, di) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById("edit-" + wi + "-" + di);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top, behavior: "smooth" });
        el.style.outline = "2px solid " + ACCENT;
        setTimeout(() => { if (el) el.style.outline = ""; }, 1500);
      });
    });
  };

  // Scroll back up to the pretty-list view of a day or week
  // Wrap in requestAnimationFrame so we wait for React re-render after save
  const scrollToView = (wi, di) => {
    const id = di === undefined ? "view-week-" + wi : "view-" + wi + "-" + di;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (!el) return;
        // Account for sticky nav height (~60px)
        const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top, behavior: "smooth" });
        el.style.outline = "2px solid " + ACCENT;
        setTimeout(() => { if (el) el.style.outline = ""; }, 1500);
      });
    });
  };

  // Render a reading row (used in both pretty list and admin display)
  const renderReadings = (d) => {
    if (!(d.readings || []).length) return null;
    return <ReadingsList d={d} readings={data.readings || []} />;
  };

  return (
    <div style={{ padding: "20px 16px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: CONTAINER_MAX, margin: "0 auto" }}>

        <PageHeader title="Schedule" right={
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {isAdmin && data.scheduleDocUrl && !editLinks && (
              <a href={data.scheduleDocUrl} target="_blank" rel="noopener noreferrer" style={{ ...linkPill, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Doc
              </a>
            )}
            {isAdmin && data.scheduleCanvaUrl && !editLinks && (
              <a href={data.scheduleCanvaUrl} target="_blank" rel="noopener noreferrer" style={{ ...linkPill, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Canva
              </a>
            )}
            {isAdmin && <button onClick={() => setEditLinks(!editLinks)} style={linkPill}>{editLinks ? "Cancel" : "Links"}</button>}
          </div>
        } />
        {isAdmin && editLinks && (
          <div style={{ ...crd, padding: 12, marginBottom: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            <input value={docUrl} onChange={e => setDocUrl(e.target.value)} placeholder="Google Doc URL" style={{ ...inp, fontSize: 12, padding: "6px 8px" }} />
            <input value={canvaUrl} onChange={e => setCanvaUrl(e.target.value)} placeholder="Canva URL" style={{ ...inp, fontSize: 12, padding: "6px 8px" }} />
            <button onClick={saveLinks} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", padding: "8px 0", width: "100%" }}>Save</button>
          </div>
        )}

        {/* Week jump pills */}
        {(() => {
          const today = new Date();
          const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
          const year = today.getFullYear();
          const hiddenWeeks = data.hiddenWeeks || [];
          let currentWeekIdx = -1;
          schedule.forEach((week, wi) => {
            (week.dates || []).forEach(d => {
              if (d.day === "Finals") return;
              const parsed = new Date(d.date + ", " + year);
              if (isNaN(parsed)) return;
              const diff = (parsed.getTime() - today0) / (1000 * 60 * 60 * 24);
              if (diff >= -3 && diff <= 4 && currentWeekIdx === -1) currentWeekIdx = wi;
            });
          });
          if (currentWeekIdx === -1) {
            for (let wi = 0; wi < schedule.length; wi++) {
              const hasFuture = (schedule[wi].dates || []).some(d => {
                if (d.day === "Finals") return false;
                const parsed = new Date(d.date + ", " + year);
                return !isNaN(parsed) && parsed.getTime() >= today0;
              });
              if (hasFuture) { currentWeekIdx = wi; break; }
            }
          }
          const jumpToWeek = (wi) => {
            const el = document.getElementById("view-week-" + wi);
            scrollToWithOffset(el);
          };
          return (
            <div style={{ background: "#fafaf9", borderRadius: 12, padding: "10px 12px", marginBottom: 18, display: "flex", gap: 6, alignItems: "center", overflowX: "auto", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: TEXT_SECONDARY, flexShrink: 0, fontWeight: 500 }}>Jump to:</span>
              {schedule.map((week, wi) => {
                const isCurrent = wi === currentWeekIdx;
                const isHidden = hiddenWeeks.includes(week.week);
                if (isHidden && !isAdmin) return null;
                return (
                  <button key={wi} onClick={() => jumpToWeek(wi)} style={{
                    fontSize: 12, padding: "4px 11px", borderRadius: 7, cursor: "pointer", fontFamily: F,
                    background: isCurrent ? ACCENT : "#fff",
                    color: isCurrent ? "#fff" : (isHidden ? TEXT_MUTED : TEXT_SECONDARY),
                    fontWeight: isCurrent ? 600 : 500,
                    fontStyle: isHidden ? "italic" : "normal",
                    border: isCurrent ? "1px solid " + ACCENT : "1px solid " + BORDER_STRONG,
                    opacity: isHidden ? 0.6 : 1,
                    flexShrink: 0,
                  }}>
                    Wk {week.week}
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* ====== PRETTY LIST (everyone) ====== */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {schedule.map((week, wi) => {
            const tc = TOPIC_COLORS[week.label] || TEXT_SECONDARY;
            const hiddenWeeks = data.hiddenWeeks || [];
            const isHidden = hiddenWeeks.includes(week.week);
            // Sort dates within the week chronologically by day order
            const dayOrder = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7, Finals: 8 };
            const orderedDates = [...week.dates].map((d, idx) => ({ d, realDi: idx })).sort((a, b) => (dayOrder[a.d.day] || 9) - (dayOrder[b.d.day] || 9));

            // Detect if this is the current week
            const today = new Date();
            const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
            const year = today.getFullYear();
            const isCurrent = orderedDates.some(({ d }) => {
              if (d.day === "Finals") return false;
              const parsed = new Date(d.date + ", " + year);
              if (isNaN(parsed)) return false;
              const diff = (parsed.getTime() - today0) / (1000 * 60 * 60 * 24);
              return diff >= -3 && diff <= 4;
            });

            return (
              <div key={wi} id={"view-week-" + wi} style={{
                background: "#fff",
                border: "1px solid " + (isCurrent ? ACCENT + "33" : BORDER_STRONG),
                borderRadius: 14,
                overflow: "hidden",
                opacity: isHidden ? 0.6 : 1,
                boxShadow: isCurrent ? "0 0 0 1px " + ACCENT + "1a, 0 1px 3px rgba(17, 24, 39, 0.05)" : "0 1px 2px rgba(17, 24, 39, 0.04)",
              }}>
                {/* Topic color stripe */}
                <div style={{ height: 3, background: isHidden ? TEXT_MUTED : tc }} />

                {/* Week header */}
                <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid " + BORDER }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {week.week <= 10 && (
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: isHidden ? TEXT_MUTED : tc, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: F, flexShrink: 0 }}>{week.week}</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 17, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>{week.label || "TBD"}</span>
                        {week.theme && <span style={{ fontSize: 13, color: TEXT_SECONDARY, fontWeight: 400 }}>{week.theme}</span>}
                      </div>
                      {week.question && <div style={{ fontSize: 13, fontStyle: "italic", color: TEXT_SECONDARY, marginTop: 3, lineHeight: 1.4 }}>"{week.question}"</div>}
                    </div>
                    {isCurrent && <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: ACCENT + "1a", color: ACCENT, textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>This week</span>}
                  </div>
                </div>

                {/* Days */}
                {isHidden ? (
                  <div style={{ padding: "14px 16px" }}>
                    {orderedDates.filter(({ d }) => d.holiday).map(({ d }, di) => (
                      <div key={di} style={{ fontSize: 13, color: RED, fontWeight: 600, padding: "4px 0" }}>{d.day} {d.date}, no in-person class</div>
                    ))}
                    {orderedDates.filter(({ d }) => d.holiday).length === 0 && <div style={{ fontSize: 13, color: TEXT_MUTED, fontStyle: "italic" }}>Details coming soon</div>}
                  </div>
                ) : (
                  <div>
                    {orderedDates.map(({ d, realDi }, idx) => {
                      const isHoliday = d.holiday;
                      const isFri = d.fri || d.day === "Fri";
                      const matched = matchAssignment(d.assignment);
                      const isLast = idx === orderedDates.length - 1;
                      // Is this day today?
                      const parsed = new Date(d.date + ", " + year);
                      const isToday = !isNaN(parsed) && Math.round((parsed.getTime() - today0) / (1000 * 60 * 60 * 24)) === 0;

                      return (
                        <div key={realDi} id={"view-" + wi + "-" + realDi} onClick={() => isAdmin && scrollToEdit(wi, realDi)} style={{
                          padding: "14px 16px",
                          borderBottom: !isLast ? "1px solid " + BORDER : "none",
                          background: isToday ? ACCENT + "08" : "#fff",
                          borderLeft: isFri ? "3px solid #c4b5fd" : "none",
                          paddingLeft: isFri ? 13 : 16,
                          cursor: isAdmin ? "pointer" : "default",
                          display: "flex", gap: 14, alignItems: "flex-start",
                        }}>
                          {/* Left column: date + day */}
                          <div style={{ flexShrink: 0, width: 56 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? ACCENT : (isFri ? PURPLE : TEXT_MUTED), textTransform: "uppercase", letterSpacing: "0.08em" }}>{d.day}</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: isToday ? ACCENT : TEXT_PRIMARY, marginTop: 2 }}>{d.date}</div>
                            {isToday && <div style={{ fontSize: 9, fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3 }}>Today</div>}
                          </div>

                          {/* Right column: content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {isHoliday && <div style={{ display: "inline-block", fontSize: 10, fontWeight: 700, color: "#92400e", background: "#fef3c7", padding: "2px 8px", borderRadius: 6, marginBottom: d.topic || d.notes ? 6 : 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>No in-person class</div>}
                            {!isHoliday && d.topic && <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.45, fontWeight: 500 }}>{d.topic}</div>}
                            {!isHoliday && !d.topic && <div style={{ fontSize: 14, color: TEXT_MUTED, fontStyle: "italic" }}>TBD</div>}
                            {isHoliday && d.topic && <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.45, fontWeight: 500, marginTop: 4 }}>{d.topic}</div>}

                            {(d.activities || []).length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                                {(d.activities || []).map((act, ai) => (
                                  <span key={ai} style={{ fontSize: 10, fontWeight: 700, color: TEXT_PRIMARY, background: "#f3f4f6", padding: "3px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{act}</span>
                                ))}
                              </div>
                            )}

                            {d.assignment && (
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 13, color: "#c2410c", fontWeight: 600 }}>{d.assignment}</span>
                                {matched && (
                                  <button onClick={e => { e.stopPropagation(); goToAssignment(matched.id); }} style={{ fontSize: 11, fontWeight: 500, padding: "4px 10px", borderRadius: 7, border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_PRIMARY, cursor: "pointer", fontFamily: F }}>Open</button>
                                )}
                              </div>
                            )}

                            {renderReadings(d)}

                            {d.notes && <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 6, whiteSpace: "pre-wrap", lineHeight: 1.4 }}>{d.notes}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ====== ADMIN PANEL (admin only) ====== */}
        {isAdmin && (
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: "2px solid " + BORDER_STRONG }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ ...sectionLabel, marginBottom: 2 }}>Admin Panel</div>
                <div style={{ fontSize: 12, color: TEXT_MUTED }}>Edit anything below; the list above updates immediately.</div>
              </div>
              <button onClick={() => { if (window.confirm("Reset entire schedule to defaults?")) resetSchedule(); }} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11 }}>Reset</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {schedule.map((week, wi) => {
                const tc = TOPIC_COLORS[week.label] || TEXT_SECONDARY;
                const hiddenWeeks = data.hiddenWeeks || [];
                const isHidden = hiddenWeeks.includes(week.week);
                const toggleHidden = async () => {
                  const newHidden = isHidden ? hiddenWeeks.filter(w => w !== week.week) : [...hiddenWeeks, week.week];
                  const updated = { ...data, hiddenWeeks: newHidden };
                  await saveData(updated); setData(updated);
                };
                return (
                  <div key={wi} style={{ ...crd, padding: 14, background: "#fafafa" }}>
                    {/* Week divider */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid " + BORDER }}>
                      {week.week <= 10 && <div style={{ width: 28, height: 28, borderRadius: 8, background: tc, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{week.week}</div>}
                      <div style={{ flex: 1 }}>
                        <WeekHeaderEditor week={week} wi={wi} data={data} setData={setData} onDone={() => {}} onSaveAndBack={() => scrollToView(wi)} />
                      </div>
                      <button onClick={toggleHidden} style={{ ...pill, background: isHidden ? "#fef2f2" : "#ecfdf5", color: isHidden ? RED : GREEN, fontSize: 11, padding: "4px 10px" }}>{isHidden ? "Hidden" : "Visible"}</button>
                      <button onClick={() => { if (window.confirm("Remove week " + week.week + "?")) removeWeek(wi); }} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, fontSize: 18, padding: 4, lineHeight: 1 }}>x</button>
                    </div>

                    {/* Day edit blocks */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {week.dates.map((d, realDi) => (
                        <div key={realDi} id={"edit-" + wi + "-" + realDi} style={{ ...crd, padding: 12, background: "#fff", transition: "outline 0.2s" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" }}>{d.day}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY }}>{d.date}</span>
                          </div>
                          <ScheduleCardEditor d={d} wi={wi} realDi={realDi} data={data} setData={setData} updateDate={updateDate} removeDate={removeDate} onDone={() => {}} onSaveAndBack={() => scrollToView(wi, realDi)} />
                        </div>
                      ))}
                      <button onClick={() => addDate(wi)} style={{ ...pill, background: "transparent", border: "1px dashed " + BORDER_STRONG, color: TEXT_MUTED, fontSize: 11, padding: "6px 0" }}>+ Add day</button>
                    </div>
                  </div>
                );
              })}

              <button onClick={addWeek} style={{ ...pill, background: "#fff", border: "1px dashed " + BORDER_STRONG, color: TEXT_PRIMARY, fontSize: 12, padding: "10px 0", fontWeight: 700 }}>+ Add week</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function ToDoView({ data, setData, userName, isAdmin }) {
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: "", due: "", linkTab: "", target: "all" });
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const todos = data.todos || [];

  const tabLinks = [
    { id: "", label: "No link" },
    { id: "home", label: "Home" },
    { id: "assignments", label: "Assignments" },
    { id: "readings", label: "Readings" },
    { id: "inclass", label: "In-Class Activities" },
    { id: "leaderboard", label: "Leaderboard" },
    { id: "schedule", label: "Schedule" },
    { id: "boards", label: "Boards" },
    { id: "roster", label: "Roster" },
  ];

  const startAdd = () => {
    setForm({ title: "", due: "", linkTab: "", target: "all" });
    setSelectedStudents([]);
    setAdding(true); setEditId(null);
  };

  const startEdit = (todo) => {
    setForm({ title: todo.title, due: todo.due || "", linkTab: todo.linkTab || "", target: todo.targetStudents ? "select" : "all" });
    setSelectedStudents(todo.targetStudents || []);
    setEditId(todo.id); setAdding(false);
  };

  const saveTodo = async () => {
    if (!form.title.trim()) return;
    const target = form.target === "all" ? null : selectedStudents;
    if (form.target === "select" && selectedStudents.length === 0) return;

    if (editId) {
      const updated = { ...data, todos: todos.map(t => t.id === editId ? { ...t, title: form.title.trim(), due: form.due.trim(), linkTab: form.linkTab, targetStudents: target } : t) };
      await saveData(updated); setData(updated);
      setEditId(null); showMsg("Updated");
    } else {
      const todo = { id: genId(), title: form.title.trim(), due: form.due.trim(), linkTab: form.linkTab, targetStudents: target, ts: Date.now() };
      const updated = { ...data, todos: [...todos, todo] };
      await saveData(updated); setData(updated);
      setAdding(false); showMsg("Added");
    }
    setForm({ title: "", due: "", linkTab: "", target: "all" }); setSelectedStudents([]);
  };

  const removeTodo = async (todoId) => {
    const updated = { ...data, todos: todos.filter(t => t.id !== todoId) };
    await saveData(updated); setData(updated); showMsg("Removed");
  };

  const handleDragStart = (idx) => setDragIdx(idx);
  const handleDragOver = (e, idx) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop = async (idx) => {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
    const newTodos = [...todos];
    const [moved] = newTodos.splice(dragIdx, 1);
    newTodos.splice(idx, 0, moved);
    const updated = { ...data, todos: newTodos };
    await saveData(updated); setData(updated);
    setDragIdx(null); setDragOverIdx(null);
  };

  const renderForm = () => (
    <div style={{ ...crd, padding: 14, marginBottom: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" style={{ ...inp, fontSize: 14, fontWeight: 600 }} />
        <div style={{ display: "flex", gap: 6 }}>
          <input value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} placeholder="Due date (e.g. Apr 10)" style={{ ...inp, fontSize: 13, flex: 1 }} />
          <select value={form.linkTab} onChange={e => setForm({ ...form, linkTab: e.target.value })} style={{ ...sel, fontSize: 13, flex: 1 }}>
            {tabLinks.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          <button onClick={() => setForm({ ...form, target: "all" })} style={form.target === "all" ? pillActive : pillInactive}>All Students</button>
          <button onClick={() => setForm({ ...form, target: "select" })} style={form.target === "select" ? pillActive : pillInactive}>Select Students</button>
        </div>
        {form.target === "select" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 120, overflowY: "auto", padding: 4 }}>
            {[...data.students].filter(s => s.name !== ADMIN_NAME && s.name !== TEST_STUDENT).sort(lastSortObj).map(s => (
              <button key={s.id} onClick={() => setSelectedStudents(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])} style={{
                fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, cursor: "pointer", fontFamily: F,
                border: "1px solid " + (selectedStudents.includes(s.id) ? ACCENT : BORDER),
                background: selectedStudents.includes(s.id) ? ACCENT + "15" : "transparent",
                color: selectedStudents.includes(s.id) ? ACCENT : TEXT_PRIMARY,
              }}>{s.name.split(" ")[0]}</button>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={saveTodo} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", flex: 1 }}>{editId ? "Save Changes" : "Add To-Do"}</button>
          <button onClick={() => { setAdding(false); setEditId(null); setForm({ title: "", due: "", linkTab: "", target: "all" }); }} style={pillInactive}>Cancel</button>
        </div>
      </div>
    </div>
  );

  // Auto rebound/makeup todos for admin view
  const reboundTodos = [];
  const activityTypes = [
    { type: "game", store: "weeklyGames", label: "Weekly Game" },
    { type: "tot", store: "weeklyToT", label: "This or That" },
    { type: "fishbowl", store: "weeklyFishbowl", label: "Fishbowl" },
  ];
  activityTypes.forEach(({ type, store, label }) => {
    const activities = data[store] || {};
    Object.keys(activities).forEach(w => {
      const act = activities[w];
      const scored = type === "fishbowl" ? act?.confirmed : act?.scored;
      if (!scored) return;
      const rKey = type + "-" + w;
      const rd = (data.rebounds || {})[rKey] || {};
      const scoredTs = rd.scoredTs || 0;
      Object.entries(rd.studentStatuses || {}).forEach(([sid, ss]) => {
        if (ss.approved) return;
        // Hide if a rebound grade has already been entered for this student/week
        if (type === "game" && (data.reboundGrades || {})[sid + "-game-" + w]) return;
        const status = ss.status || "";
        if (status === "rebound" || status === "unannounced_override") {
          const deadline = scoredTs + 48 * 60 * 60 * 1000;
          if (Date.now() > deadline) return;
          const sName = data.students.find(s => s.id === sid)?.name || sid;
          reboundTodos.push({ id: "r-" + rKey + "-" + sid, title: "Rebound: " + label + " Wk " + w + " (" + sName.split(" ")[0] + ")", due: Math.max(0, Math.round((deadline - Date.now()) / (1000 * 60 * 60))) + "h left", submitted: !!ss.link });
        }
        if (status === "planned_makeup") {
          const mDeadline = scoredTs + 7 * 24 * 60 * 60 * 1000;
          if (Date.now() > mDeadline) return;
          const sName = data.students.find(s => s.id === sid)?.name || sid;
          reboundTodos.push({ id: "m-" + rKey + "-" + sid, title: "Makeup: " + label + " Wk " + w + " (" + sName.split(" ")[0] + ")", due: Math.max(0, Math.round((mDeadline - Date.now()) / (1000 * 60 * 60 * 24))) + "d left" });
        }
      });
    });
  });

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ ...sectionLabel }}>To-Do Manager</div>
          <button onClick={startAdd} style={adding ? pillActive : pillInactive}>{adding ? "Cancel" : "+ Add To-Do"}</button>
        </div>

        {(adding || editId) && renderForm()}

        {reboundTodos.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Auto-generated</div>
            {reboundTodos.map(t => (
              <div key={t.id} style={{ ...crd, padding: 12, marginBottom: 4, borderLeft: "3px solid #f59e0b", opacity: t.submitted ? 0.5 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }}>{t.title}</span>
                    {t.submitted && <span style={{ fontSize: 11, color: GREEN, fontWeight: 600, marginLeft: 6 }}>Submitted</span>}
                  </div>
                  <span style={{ fontSize: 12, color: TEXT_SECONDARY, fontWeight: 500 }}>{t.due}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {todos.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Your To-Dos (drag to reorder)</div>
            {todos.map((todo, idx) => {
              const targetLabel = todo.targetStudents
                ? (todo.targetStudents.length === 1 ? (data.students.find(s => s.id === todo.targetStudents[0])?.name || "1 student") : todo.targetStudents.length + " students")
                : "All students";
              const isDragOver = dragOverIdx === idx;
              return (
                <div key={todo.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                  style={{
                    ...crd, padding: 12, marginBottom: 4, borderLeft: "3px solid " + ACCENT, cursor: "grab",
                    borderTop: isDragOver ? "2px solid " + ACCENT : undefined,
                    opacity: dragIdx === idx ? 0.4 : 1,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{todo.title}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                        {todo.due && <span style={{ fontSize: 12, color: TEXT_SECONDARY, fontWeight: 500 }}>Due: {todo.due}</span>}
                        <span style={{ fontSize: 12, color: TEXT_MUTED }}>{targetLabel}</span>
                        {todo.linkTab && <span style={{ fontSize: 11, color: ACCENT, fontWeight: 500 }}>{tabLinks.find(t => t.id === todo.linkTab)?.label || todo.linkTab}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button onClick={() => startEdit(todo)} style={{ ...pillInactive, fontSize: 11 }}>Edit</button>
                      <button onClick={() => { if (window.confirm("Remove?")) removeTodo(todo.id); }} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11 }}>X</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {todos.length === 0 && reboundTodos.length === 0 && !adding && (
          <div style={{ ...crd, padding: 20, textAlign: "center", color: TEXT_MUTED, fontSize: 14 }}>No to-dos yet. Click "+ Add To-Do" to create one.</div>
        )}
      </div>
    </div>
  );
}


/* --- SUBMIT (Video Links) --- */
function SubmitView({ data, setData, userName }) {
  const student = data.students.find(s => s.name === userName);
  const sid = student?.id;
  const submissions = data.videoSubmissions || {};
  const [editing, setEditing] = useState(null);
  const [linkVal, setLinkVal] = useState("");
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  if (!sid) return <div style={{ padding: 40, textAlign: "center", fontFamily: F, color: TEXT_MUTED }}>Sign in to submit video links.</div>;

  const submit = async (speechId) => {
    if (!linkVal.trim()) return;
    const key = sid + "-" + speechId;
    const updated = { ...data, videoSubmissions: { ...submissions, [key]: { url: linkVal.trim(), ts: Date.now() } } };
    await saveData(updated); setData(updated);
    setEditing(null); setLinkVal(""); showMsg("Submitted");
  };

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 12 }}>Submit Video Links</div>
        <div style={{ ...crd, padding: "14px 18px", marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.6 }}>Paste the link to your video for each speech. You can replace a submission at any time. Make sure the video is accessible (not private).</div>
        </div>
        {SPEECH_SLOTS.map(slot => {
          const key = sid + "-" + slot.id;
          const sub = submissions[key];
          const isEditing = editing === slot.id;

          return (
            <div key={slot.id} style={{ ...crd, padding: 16, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: sub || isEditing ? 8 : 0 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>{slot.name}</div>
                  <div style={{ fontSize: 12, color: TEXT_MUTED }}>{slot.due}</div>
                </div>
                {sub && !isEditing && <div style={{ width: 24, height: 24, borderRadius: "50%", background: GREEN, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                </div>}
              </div>
              {sub && !isEditing && (
                <div style={{ background: "#f0fdf4", padding: "8px 12px", borderRadius: 8, marginBottom: 6 }}>
                  <a href={sub.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: ACCENT, wordBreak: "break-all", textDecoration: "none" }}>{sub.url}</a>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>Submitted {new Date(sub.ts).toLocaleString()}</div>
                </div>
              )}
              {isEditing ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input autoFocus value={linkVal} onChange={e => setLinkVal(e.target.value)} onKeyDown={e => e.key === "Enter" && submit(slot.id)} placeholder="Paste video URL" style={{ ...inp, fontSize: 13, flex: 1 }} />
                  <button onClick={() => submit(slot.id)} style={{ ...pill, background: ACCENT, color: "#fff" }}>Submit</button>
                  <button onClick={() => { setEditing(null); setLinkVal(""); }} style={pillInactive}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => { setEditing(slot.id); setLinkVal(sub?.url || ""); }} style={{ ...pillInactive, fontSize: 12 }}>{sub ? "Replace" : "Add Link"}</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --- MEDIA TAB --- */
function MediaView({ data, setData, isAdmin }) {
  const media = data.media || [];
  const [editing, setEditing] = useState(null);
  const [local, setLocal] = useState(null);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const add = async () => {
    const newItem = { id: genId(), title: "New Media", url: "", category: "Video", notes: "", week: null };
    const updated = { ...data, media: [...media, newItem] };
    await saveData(updated); setData(updated);
    setEditing(newItem.id); setLocal({ title: newItem.title, url: newItem.url, category: newItem.category, notes: newItem.notes, week: newItem.week });
  };

  const save = async () => {
    if (!editing || !local) return;
    const updated = { ...data, media: media.map(m => m.id === editing ? { ...m, ...local, week: local.week ? parseInt(local.week) : null } : m) };
    await saveData(updated); setData(updated);
    setEditing(null); setLocal(null); showMsg("Saved");
  };

  const remove = async (id) => {
    const updated = { ...data, media: media.filter(m => m.id !== id) };
    await saveData(updated); setData(updated); showMsg("Removed");
  };

  const categories = [...new Set(media.map(m => m.category || "Uncategorized"))].sort();

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ ...sectionLabel }}>Media</div>
          {isAdmin && <button onClick={add} style={pillInactive}>+ Add</button>}
        </div>

        {media.length === 0 && <div style={{ ...crd, padding: 24, textAlign: "center", color: TEXT_MUTED }}>No media added yet.</div>}

        {categories.map(cat => {
          const items = media.filter(m => (m.category || "Uncategorized") === cat);
          return (
            <div key={cat} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 8 }}>{cat}</div>
              {items.map(m => {
                const isEdit = editing === m.id;
                return (
                  <div key={m.id} style={{ ...crd, padding: 14, marginBottom: 6 }}>
                    {isEdit && isAdmin ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <input value={local.title} onChange={e => setLocal({ ...local, title: e.target.value })} placeholder="Title" style={{ ...inp, fontSize: 13 }} />
                        <input value={local.url} onChange={e => setLocal({ ...local, url: e.target.value })} placeholder="URL" style={{ ...inp, fontSize: 13 }} />
                        <div style={{ display: "flex", gap: 6 }}>
                          <input value={local.category} onChange={e => setLocal({ ...local, category: e.target.value })} placeholder="Category" style={{ ...inp, fontSize: 13, flex: 1 }} />
                          <select value={local.week || ""} onChange={e => setLocal({ ...local, week: e.target.value })} style={{ ...sel, fontSize: 13, width: 100 }}>
                            <option value="">No week</option>
                            {Array.from({ length: 10 }).map((_, i) => <option key={i + 1} value={i + 1}>Week {i + 1}</option>)}
                          </select>
                        </div>
                        <textarea value={local.notes} onChange={e => setLocal({ ...local, notes: e.target.value })} placeholder="Notes" rows={2} style={{ ...inp, fontSize: 13, resize: "vertical" }} />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={save} style={{ ...pill, background: "#18181b", color: "#fff", flex: 1 }}>Save</button>
                          <button onClick={() => { setEditing(null); setLocal(null); }} style={pillInactive}>Cancel</button>
                          <button onClick={() => remove(m.id)} style={{ ...pill, background: "#fef2f2", color: RED }}>Delete</button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => isAdmin && (setEditing(m.id), setLocal({ title: m.title, url: m.url, category: m.category, notes: m.notes, week: m.week || "" }))} style={{ cursor: isAdmin ? "pointer" : "default" }}>
                        {m.url ? (
                          <a href={m.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 15, fontWeight: 600, color: ACCENT, textDecoration: "none" }}>{m.title}</a>
                        ) : (
                          <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY }}>{m.title}</div>
                        )}
                        {m.week && <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, background: ACCENT + "12", padding: "2px 6px", borderRadius: 4, marginLeft: 6 }}>Wk {m.week}</span>}
                        {m.notes && <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 4 }}>{m.notes}</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --- PTI (Culture Points) --- */
function PTIView({ data, setData }) {
  const [msg, setMsg] = useState("");
  const [popup, setPopup] = useState(null);
  const draggingIdRef = React.useRef(null);
  const [hideScores, setHideScores] = useState(false);
  const [, forceRender] = useState(0);
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 1500); };

  const ranked = rs(data.students, data.log);
  const rankMap = {};
  ranked.forEach((s, i) => { rankMap[s.id] = i + 1; });
  const bios = data.bios || {};

  const ROWS = 5;
  const COLS = 8;
  const TOTAL = ROWS * COLS;

  const allStudents = [...data.students].filter(s => s.name !== ADMIN_NAME && s.name !== "Bruce Willis").sort(lastSortObj);

  // Initialize seats on first load
  React.useEffect(() => {
    const seats = data.athSeats || {};
    const needsInit = allStudents.some(s => seats[s.id] === undefined);
    if (!needsInit) return;
    const newSeats = { ...seats };
    const usedPositions = new Set(Object.values(seats));
    let nextPos = 0;
    allStudents.forEach(s => {
      if (newSeats[s.id] === undefined) {
        while (usedPositions.has(nextPos) && nextPos < TOTAL) nextPos++;
        if (nextPos < TOTAL) {
          newSeats[s.id] = nextPos;
          usedPositions.add(nextPos);
          nextPos++;
        }
      }
    });
    (async () => {
      const updated = { ...data, athSeats: newSeats };
      await saveData(updated); setData(updated);
    })();
    // eslint-disable-next-line
  }, [allStudents.length]);

  const seats = data.athSeats || {};
  const posToStudent = {};
  allStudents.forEach(s => {
    const p = seats[s.id];
    if (p !== undefined && p < TOTAL) posToStudent[p] = s;
  });

  const award = async (sid, amount) => {
    const student = data.students.find(s => s.id === sid);
    const entry = { id: genId(), studentId: sid, amount, source: "Participation", ts: Date.now() };
    const updated = { ...data, log: [...data.log, entry] };
    await saveData(updated); setData(updated);
    showMsg((amount > 0 ? "+" : "") + amount + " " + (student?.name?.split(" ")[0] || ""));
    setPopup(null);
  };

  const handleDrop = async (targetPos) => {
    const draggingId = draggingIdRef.current;
    if (draggingId === null) return;
    draggingIdRef.current = null;
    const targetStudent = posToStudent[targetPos];
    if (targetStudent && targetStudent.id === draggingId) {
      forceRender(n => n + 1);
      return;
    }
    const draggedFromPos = seats[draggingId];
    const newSeats = { ...seats };
    if (targetStudent) {
      newSeats[targetStudent.id] = draggedFromPos;
    }
    newSeats[draggingId] = targetPos;
    const updated = { ...data, athSeats: newSeats };
    await saveData(updated); setData(updated);
  };

  const resetSeats = async () => {
    if (!window.confirm("Reset all seats to alphabetical?")) return;
    const newSeats = {};
    allStudents.forEach((s, i) => { if (i < TOTAL) newSeats[s.id] = i; });
    const updated = { ...data, athSeats: newSeats };
    await saveData(updated); setData(updated);
  };

  return (
    <div style={{ padding: "20px 16px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ ...sectionLabel }}>PTI - Culture Points</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: TEXT_MUTED }}>Drag to rearrange seats</span>
            <button onClick={() => setHideScores(!hideScores)} style={hideScores ? pillActive : pillInactive}>{hideScores ? "Show Scores" : "Hide Scores"}</button>
            <button onClick={resetSeats} style={pillInactive}>Reset Seats</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(" + COLS + ", 1fr)", gap: 6 }}>
          {Array.from({ length: TOTAL }).map((_, pos) => {
            const s = posToStudent[pos];
            if (!s) {
              return (
                <div key={pos}
                  onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                  onDrop={e => { e.preventDefault(); e.stopPropagation(); handleDrop(pos); }}
                  style={{
                    minHeight: 110, borderRadius: 10, border: "2px dashed #e5e5e4",
                    background: "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#d4d4d8", fontSize: 10,
                  }}
                >drop here</div>
              );
            }
            const pts = gp(data.log, s.id);
            const ptiPts = data.log.filter(e => e.studentId === s.id && e.source === "Participation").reduce((sum, e) => sum + e.amount, 0);
            const rank = rankMap[s.id] || "-";
            const isOpen = popup === s.id;
            const initials = s.name.split(" ").map(n => n[0]).join("");
            const photo = bios[s.id]?.photo;
            return (
              <div key={pos} style={{ position: "relative" }}
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                onDrop={e => { e.preventDefault(); e.stopPropagation(); handleDrop(pos); }}
              >
                <div
                  draggable
                  onDragStart={e => { draggingIdRef.current = s.id; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", s.id); }}
                  onDragEnd={() => { draggingIdRef.current = null; }}
                  onClick={() => setPopup(isOpen ? null : s.id)}
                  style={{
                    width: "100%", padding: "6px 4px", borderRadius: 10, background: "#fff",
                    border: isOpen ? "2px solid " + ACCENT : "1px solid " + BORDER,
                    cursor: "grab", textAlign: "center", transition: "all 0.1s",
                  }}>
                  {!hideScores && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3, padding: "0 2px" }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: rank <= 5 ? "#d4a017" : TEXT_MUTED }}>#{rank}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: ptiPts > 0 ? GREEN : TEXT_MUTED }}>PTI: {ptiPts}</span>
                    </div>
                  )}
                  {photo ? (
                    <img src={photo} alt={s.name} draggable={false} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", display: "block", margin: "0 auto 4px", border: "2px solid " + ACCENT }} />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px", fontSize: 20, fontWeight: 900, color: "#fff", border: "2px solid " + ACCENT }}>{initials}</div>
                  )}
                  <div style={{ fontSize: 12, fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1.15 }}>{s.name.split(" ")[0]}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: TEXT_SECONDARY, lineHeight: 1.15 }}>{s.name.split(" ").slice(1).join(" ")}</div>
                  {!hideScores && <div style={{ fontSize: 13, fontWeight: 900, color: ACCENT, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{pts}</div>}
                </div>
                {isOpen && (
                  <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", zIndex: 20, marginTop: 4, display: "flex", gap: 4, background: "#fff", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "1px solid " + BORDER, padding: 6, borderRadius: 12 }}>
                    <button onClick={(e) => { e.stopPropagation(); award(s.id, -1); }} style={{ ...pill, background: "#fef2f2", color: RED, minWidth: 44, fontSize: 14, fontWeight: 900 }}>-1</button>
                    <button onClick={(e) => { e.stopPropagation(); award(s.id, 1); }} style={{ ...pill, background: "#ecfdf5", color: GREEN, minWidth: 44, fontSize: 14, fontWeight: 900 }}>+1</button>
                    <button onClick={(e) => { e.stopPropagation(); award(s.id, 5); }} style={{ ...pill, background: "#ecfdf5", color: GREEN, minWidth: 44, fontSize: 14, fontWeight: 900 }}>+5</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* --- SURVEY --- */
function SurveyView({ data, setData, isAdmin, userName }) {
  const surveys = data.surveys || [];
  const student = data.students.find(s => s.name === userName);
  const sid = student?.id;
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  if (isAdmin) {
    const [newQ, setNewQ] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");
    const addSurvey = async () => {
      if (!newQ.trim()) return;
      const updated = { ...data, surveys: [...surveys, { id: genId(), question: newQ.trim(), responses: {}, active: true }] };
      await saveData(updated); setData(updated); setNewQ(""); showMsg("Added");
    };
    const toggleActive = async (id) => {
      const updated = { ...data, surveys: surveys.map(s => s.id === id ? { ...s, active: !s.active } : s) };
      await saveData(updated); setData(updated);
    };
    const deleteSurvey = async (id) => {
      const updated = { ...data, surveys: surveys.filter(s => s.id !== id) };
      await saveData(updated); setData(updated); showMsg("Deleted");
    };
    const saveEdit = async (id) => {
      if (!editText.trim()) return;
      const updated = { ...data, surveys: surveys.map(s => s.id === id ? { ...s, question: editText.trim() } : s) };
      await saveData(updated); setData(updated); setEditingId(null); setEditText(""); showMsg("Updated");
    };
    return (
      <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
        <Toast message={msg} />
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ ...sectionLabel, marginBottom: 12 }}>Surveys (Admin)</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            <input value={newQ} onChange={e => setNewQ(e.target.value)} onKeyDown={e => e.key === "Enter" && addSurvey()} placeholder="New survey question" style={{ ...inp, flex: 1, fontSize: 13 }} />
            <button onClick={addSurvey} style={{ ...pill, background: ACCENT, color: "#fff" }}>Add</button>
          </div>
          {surveys.map(s => (
            <div key={s.id} style={{ ...crd, padding: 14, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                {editingId === s.id ? (
                  <div style={{ display: "flex", gap: 6, flex: 1, marginRight: 8 }}>
                    <input value={editText} onChange={e => setEditText(e.target.value)} style={{ ...inp, flex: 1, fontSize: 13 }} />
                    <button onClick={() => saveEdit(s.id)} style={{ ...pill, background: ACCENT, color: "#fff", fontSize: 11 }}>Save</button>
                    <button onClick={() => { setEditingId(null); setEditText(""); }} style={pillInactive}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>{s.question}</div>
                )}
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  {editingId !== s.id && <button onClick={() => { setEditingId(s.id); setEditText(s.question); }} style={{ ...pillInactive, fontSize: 11 }}>Edit</button>}
                  <button onClick={() => toggleActive(s.id)} style={{ ...pill, fontSize: 11, padding: "3px 8px", background: s.active ? "#ecfdf5" : "#f4f4f5", color: s.active ? GREEN : TEXT_MUTED }}>{s.active ? "Open" : "Closed"}</button>
                  <button onClick={() => { if (window.confirm("Delete this survey?")) deleteSurvey(s.id); }} style={{ ...pill, fontSize: 11, padding: "3px 8px", background: "#fef2f2", color: RED }}>X</button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: TEXT_MUTED }}>{Object.keys(s.responses || {}).length} responses</div>
              {Object.entries(s.responses || {}).map(([respSid, resp]) => {
                const st = data.students.find(x => x.id === respSid);
                return <div key={respSid} style={{ fontSize: 13, color: TEXT_SECONDARY, padding: "4px 0", borderTop: "1px solid #f4f4f5" }}><strong>{st?.name || "Unknown"}:</strong> {resp}</div>;
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Student view
  const [answers, setAnswers] = useState({});
  const submitSurvey = async (surveyId) => {
    if (!sid || !answers[surveyId]?.trim()) return;
    const survey = surveys.find(s => s.id === surveyId);
    if (!survey) return;
    const updated = { ...data, surveys: surveys.map(s => s.id === surveyId ? { ...s, responses: { ...(s.responses || {}), [sid]: answers[surveyId].trim() } } : s) };
    await saveData(updated); setData(updated); showMsg("Submitted");
  };

  const activeSurveys = surveys.filter(s => s.active);
  if (activeSurveys.length === 0) return <div style={{ padding: 40, textAlign: "center", fontFamily: F, color: TEXT_MUTED }}>No surveys right now.</div>;

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 12 }}>Survey</div>
        {activeSurveys.map(s => {
          const myResp = sid ? s.responses?.[sid] : null;
          return (
            <div key={s.id} style={{ ...crd, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 8 }}>{s.question}</div>
              {myResp ? (
                <div>
                  <div style={{ fontSize: 14, color: GREEN, fontWeight: 600, marginBottom: 6 }}>Your answer: {myResp}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input value={answers[s.id] || ""} onChange={e => setAnswers({ ...answers, [s.id]: e.target.value })} onKeyDown={e => e.key === "Enter" && submitSurvey(s.id)} placeholder="Change your answer" style={{ ...inp, flex: 1, fontSize: 13 }} />
                    <button onClick={() => submitSurvey(s.id)} style={{ ...pill, background: ACCENT, color: "#fff" }}>Update</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={answers[s.id] || ""} onChange={e => setAnswers({ ...answers, [s.id]: e.target.value })} onKeyDown={e => e.key === "Enter" && submitSurvey(s.id)} placeholder="Your answer" style={{ ...inp, flex: 1, fontSize: 13 }} />
                  <button onClick={() => submitSurvey(s.id)} style={{ ...pill, background: ACCENT, color: "#fff" }}>Submit</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --- ROSTER --- */
function RosterView({ data, setData, userName }) {
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const sorted = [...data.students].filter(s => s.name !== ADMIN_NAME && s.name !== "Bruce Willis").sort(lastSortObj);
  const q = search.trim().toLowerCase();
  const filtered = q ? sorted.filter(s => s.name.toLowerCase().includes(q)) : sorted;

  if (selectedId) {
    const student = data.students.find(s => s.id === selectedId);
    if (!student) { setSelectedId(null); return null; }
    return <BioView student={student} data={data} setData={setData} userName={userName} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 10 }}>Class roster</div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search classmates" style={{ ...inp, fontSize: 13, padding: "8px 12px", marginBottom: 12, width: "100%", boxSizing: "border-box" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {filtered.length === 0 && <div style={{ fontSize: 13, color: TEXT_MUTED, textAlign: "center", padding: 20 }}>No matches.</div>}
          {filtered.map(s => {
            const team = (data.teams || []).find(t => t.id === s.teamId);
            const tc = { accent: ACCENT, bg: ACCENT + "12" };
            const bio = (data.bios || {})[s.id] || {};
            const initials = s.name.split(" ").map(n => n[0]).join("");
            const hasPhoto = !!bio.photo;
            const isMe = s.name === userName;
            return (
              <button key={s.id} onClick={() => setSelectedId(s.id)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                background: isMe ? ACCENT + "0d" : "#fff", border: "1px solid " + (isMe ? ACCENT + "40" : BORDER),
                borderRadius: 12,
                cursor: "pointer", textAlign: "left", fontFamily: F, width: "100%",
              }}>
                {hasPhoto ? (
                  <img src={bio.photo} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#fff", flexShrink: 0 }}>{initials}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY, display: "flex", alignItems: "center", gap: 6 }}>
                    {s.name}
                    {isMe && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", background: ACCENT + "1a", color: ACCENT, borderRadius: 4, letterSpacing: "0.06em" }}>YOU</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2, flexWrap: "wrap", fontSize: 11 }}>
                    {team && <span style={{ color: tc.accent, fontWeight: 500 }}>{team.name}</span>}
                    {team && (bio.year || bio.hometown) && <span style={{ color: "#d4d4d8" }}>·</span>}
                    {bio.year && <span style={{ color: TEXT_SECONDARY }}>{bio.year}</span>}
                    {bio.year && bio.hometown && <span style={{ color: "#d4d4d8" }}>·</span>}
                    {bio.hometown && <span style={{ color: TEXT_SECONDARY }}>{bio.hometown}</span>}
                  </div>
                  {bio.motto && <div style={{ fontSize: 11, color: TEXT_MUTED, fontStyle: "italic", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bio.motto}</div>}
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: TEXT_MUTED }}>{sorted.length} students</div>
      </div>
    </div>
  );
}

function BioView({ student, data, setData, userName, onBack }) {
  const isOwn = student.name === userName;
  const isAdmin = userName === ADMIN_NAME;
  const canEdit = isOwn || isAdmin;
  const bio = (data.bios || {})[student.id] || {};
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...bio });
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const initials = student.name.split(" ").map(n => n[0]).join("");

  const saveBio = async () => {
    const updated = { ...data, bios: { ...(data.bios || {}), [student.id]: form } };
    await saveData(updated); setData(updated);
    setEditing(false); showMsg("Saved");
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showMsg("Max 2MB"); return; }
    setUploading(true);
    try {
      const url = await uploadPhoto(file, student.id);
      const newForm = { ...form, photo: url };
      setForm(newForm);
      const updated = { ...data, bios: { ...(data.bios || {}), [student.id]: newForm } };
      await saveData(updated); setData(updated);
      showMsg("Photo uploaded");
    } catch (err) { showMsg("Upload failed"); }
    setUploading(false);
  };

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        {onBack && <button onClick={onBack} style={pillInactive}>Back to Roster</button>}

        <div style={{ background: "linear-gradient(135deg, #1e293b, #334155)", borderRadius: 16, padding: "24px 20px", marginTop: 12, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative" }}>
            {bio.photo ? (
              <img src={bio.photo} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.2)" }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#fff", border: "3px solid rgba(255,255,255,0.2)" }}>{initials}</div>
            )}
            {canEdit && (
              <label style={{ position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TEXT_SECONDARY} strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
              </label>
            )}
            {uploading && <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10 }}>...</div>}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{student.name}</div>
            {bio.major && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{bio.major}</div>}
          </div>
        </div>

        {editing ? (
          <div style={{ ...crd, padding: 16, marginTop: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input value={form.major || ""} onChange={e => setForm({ ...form, major: e.target.value })} placeholder="Major / Year" style={{ ...inp, fontSize: 14 }} />
              <input value={form.hometown || ""} onChange={e => setForm({ ...form, hometown: e.target.value })} placeholder="Hometown" style={{ ...inp, fontSize: 14 }} />
              <textarea value={form.about || ""} onChange={e => setForm({ ...form, about: e.target.value })} placeholder="About you..." rows={3} style={{ ...inp, resize: "vertical", fontSize: 14 }} />
              {isAdmin && <input value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" style={{ ...inp, fontSize: 14 }} />}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={saveBio} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", flex: 1, padding: "10px 0" }}>Save</button>
              <button onClick={() => { setForm({ ...bio }); setEditing(false); }} style={{ ...pillInactive, flex: 1, padding: "10px 0" }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ ...crd, padding: 16, marginTop: 12 }}>
            {bio.about || bio.major || bio.hometown ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {bio.hometown && <div style={{ fontSize: 13, color: TEXT_SECONDARY }}><strong>Hometown:</strong> {bio.hometown}</div>}
                {bio.about && <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{bio.about}</div>}
                {isAdmin && bio.email && <div style={{ fontSize: 13, color: TEXT_MUTED }}>{bio.email}</div>}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 12, color: TEXT_MUTED, fontSize: 14 }}>
                {canEdit ? "No bio yet. Click edit to add one." : "This person hasn't filled out their bio yet."}
              </div>
            )}
            {canEdit && <button onClick={() => { setForm({ ...bio }); setEditing(true); }} style={{ ...pillInactive, width: "100%", marginTop: 12, padding: "10px 0" }}>Edit Bio</button>}
          </div>
        )}
      </div>
    </div>
  );
}

/* --- ADMIN PANEL --- */
function AdminPanel({ data, setData }) {
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };
  const [source, setSource] = useState(POINT_SOURCES[0]);
  const [awardSid, setAwardSid] = useState("");
  const [awardAmt, setAwardAmt] = useState("");
  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const sorted = [...data.students].filter(s => s.name !== ADMIN_NAME).sort(lastSortObj);
  const pins = data.pins || {};

  const loadBackups = async () => {
    setLoadingBackups(true);
    try {
      const r = await window.storage.list(STORAGE_KEY + "-bak-", true);
      setBackups((r?.keys || []).sort().reverse());
    } catch(e) { console.error(e); }
    setLoadingBackups(false);
  };

  const restoreBackup = async (backupKey) => {
    if (!window.confirm("Restore from " + backupKey.replace(STORAGE_KEY + "-bak-", "") + "? This will replace ALL current data with the backup.")) return;
    try {
      const r = await window.storage.get(backupKey, true);
      if (!r) { showMsg("Backup not found"); return; }
      const backupData = JSON.parse(r.value);
      await window.storage.set(STORAGE_KEY, JSON.stringify(backupData), true);
      setData(backupData);
      showMsg("Restored from " + backupKey.replace(STORAGE_KEY + "-bak-", ""));
    } catch(e) { console.error(e); showMsg("Restore failed"); }
  };

  const awardPoints = async () => {
    if (!awardSid || !awardAmt) return;
    const entry = { id: genId(), studentId: awardSid, amount: parseFloat(awardAmt), source, ts: Date.now() };
    const updated = { ...data, log: [...data.log, entry] };
    await saveData(updated); setData(updated); setAwardAmt(""); showMsg("Awarded " + awardAmt + " pts");
  };

  const undoLast = async () => {
    if (data.log.length === 0) return;
    const updated = { ...data, log: data.log.slice(0, -1) };
    await saveData(updated); setData(updated); showMsg("Undone");
  };

  const recentLog = [...data.log].reverse().slice(0, 20);

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 12 }}>Admin Panel</div>

        {/* Award points */}
        <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 8 }}>Award Points</div>
          <select value={awardSid} onChange={e => setAwardSid(e.target.value)} style={{ ...sel, width: "100%", marginBottom: 6 }}>
            <option value="">Select student</option>
            {sorted.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <input type="number" value={awardAmt} onChange={e => setAwardAmt(e.target.value)} placeholder="Points" style={{ ...inp, width: 100 }} />
            <select value={source} onChange={e => setSource(e.target.value)} style={{ ...sel, flex: 1 }}>
              {POINT_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={awardPoints} style={{ ...pill, background: ACCENT, color: "#fff", width: "100%" }}>Award</button>
        </div>

        {/* Undo */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={undoLast} style={{ ...pill, background: "#fef2f2", color: RED, flex: 1 }}>Undo Last</button>
        </div>

        {/* Add / Remove Students */}
        <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 8 }}>Students</div>
          {sorted.map(s => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", fontSize: 13, borderBottom: "1px solid #f4f4f5" }}>
              <span style={{ color: TEXT_PRIMARY }}>{s.name}</span>
              <button onClick={async () => { const updated = { ...data, students: data.students.filter(st => st.id !== s.id), log: data.log.filter(e => e.studentId !== s.id) }; await saveData(updated); setData(updated); showMsg("Removed"); }} style={{ background: "none", border: "1px solid #fecaca", borderRadius: 4, color: RED, fontSize: 11, padding: "1px 6px", cursor: "pointer" }}>X</button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <input id="comm2-add-name" placeholder="New student name" style={{ ...inp, flex: 1 }} />
            <button onClick={async () => {
              const name = document.getElementById("comm2-add-name").value.trim();
              if (!name) return;
              const sid = genId();
              const pin = String(Math.floor(100000 + Math.random() * 900000));
              const updated = { ...data, students: [...data.students, { id: sid, name }], pins: { ...(data.pins || {}), [sid]: pin } };
              const ok = await saveData(updated);
              if (ok) { setData(updated); document.getElementById("comm2-add-name").value = ""; showMsg("Added (PIN: " + pin + ")"); }
              else { showMsg("Save failed, try again"); }
            }} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", fontSize: 12 }}>Add</button>
          </div>
        </div>

        {/* PINs */}
        <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 8 }}>Student PINs</div>
          <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 8 }}>Click a PIN to edit it.</div>
          {sorted.map(s => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", fontSize: 13, borderBottom: "1px solid #f4f4f5" }}>
              <span style={{ color: TEXT_PRIMARY }}>{s.name}</span>
              <input
                defaultValue={pins[s.id] || "none"}
                onBlur={async (e) => {
                  const val = e.target.value.trim();
                  if (val && val !== (pins[s.id] || "none")) {
                    const updated = { ...data, pins: { ...(data.pins || {}), [s.id]: val } };
                    await saveData(updated); setData(updated); showMsg("PIN updated");
                  }
                }}
                onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
                style={{ fontFamily: "monospace", color: TEXT_MUTED, background: "transparent", border: "1px solid transparent", borderRadius: 4, padding: "1px 4px", textAlign: "right", width: 80, fontSize: 13 }}
                onFocus={e => { e.target.style.borderColor = BORDER; e.target.style.background = "#fff"; }}
              />
            </div>
          ))}
        </div>

        {/* Recent log */}
        <div style={{ ...crd, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 8 }}>Recent Point Log</div>
          {recentLog.length === 0 && <div style={{ fontSize: 13, color: TEXT_MUTED }}>No entries yet.</div>}
          {recentLog.map(e => {
            const st = data.students.find(s => s.id === e.studentId);
            return (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: "1px solid #f4f4f5" }}>
                <span style={{ color: TEXT_SECONDARY }}>{st?.name || "?"} - {e.source}</span>
                <span style={{ fontWeight: 700, color: e.amount > 0 ? GREEN : RED }}>{e.amount > 0 ? "+" : ""}{e.amount}</span>
              </div>
            );
          })}
        </div>

        {/* Video Submissions Admin View */}
        <div style={{ ...crd, padding: 16, marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 8 }}>Video Submissions</div>
          {SPEECH_SLOTS.map(slot => {
            const submitters = sorted.filter(s => (data.videoSubmissions || {})[s.id + "-" + slot.id]);
            return (
              <div key={slot.id} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_SECONDARY }}>{slot.name} <span style={{ fontWeight: 400, color: TEXT_MUTED }}>({submitters.length}/{sorted.length})</span></div>
                {submitters.map(s => {
                  const sub = data.videoSubmissions[s.id + "-" + slot.id];
                  return (
                    <div key={s.id} style={{ fontSize: 12, color: TEXT_SECONDARY, padding: "2px 0 2px 12px" }}>
                      {s.name}: <a href={sub.url} target="_blank" rel="noopener noreferrer" style={{ color: ACCENT, textDecoration: "none" }}>{sub.url.substring(0, 50)}...</a>
                      <span style={{ color: TEXT_MUTED, marginLeft: 6 }}>{new Date(sub.ts).toLocaleDateString()}</span>
                    </div>
                  );
                })}
                {submitters.length === 0 && <div style={{ fontSize: 12, color: TEXT_MUTED, paddingLeft: 12 }}>No submissions</div>}
              </div>
            );
          })}
        </div>

        {/* Backups */}
        <div style={{ ...crd, padding: 16, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Daily Backups</div>
            <button onClick={loadBackups} style={{ ...pill, background: "transparent", color: ACCENT, border: "1px solid " + ACCENT, fontSize: 11 }}>Load Backups</button>
          </div>
          <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 8 }}>Backups are created automatically once per day. Click Restore to roll back.</div>
          {loadingBackups && <div style={{ color: TEXT_MUTED, textAlign: "center", padding: 12 }}>Loading...</div>}
          {!loadingBackups && backups.length === 0 && <div style={{ color: TEXT_MUTED, fontSize: 12 }}>Click "Load Backups" to check for available backups.</div>}
          {backups.map(bk => {
            const dateStr = bk.replace(STORAGE_KEY + "-bak-", "");
            return (
              <div key={bk} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f4f4f5" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{dateStr}</span>
                <button onClick={() => restoreBackup(bk)} style={{ ...pill, background: "#fffbeb", color: "#d97706", fontSize: 11 }}>Restore</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
function InClassView({ data, setData, isAdmin, userName }) {
  const [sub, setSub] = useState("answer");
  const studentSubs = [
    { id: "answer", label: "Answer" },
    { id: "classtools", label: "Headlines" },
    { id: "survey", label: "Survey" },
  ];
  const adminSubs = [
    { id: "answer", label: "Answer" },
    { id: "classtools", label: "Headlines" },
    { id: "survey", label: "Survey" },
    { id: "activities", label: "Activities" },
  ];
  const subs = isAdmin ? adminSubs : studentSubs;
  return (
    <div>
      <div style={{ display: "flex", gap: 4, padding: "12px 20px", background: "#f4f4f5", borderBottom: "1px solid " + BORDER, overflowX: "auto" }}>
        {subs.map(s => (
          <button key={s.id} onClick={() => setSub(s.id)} style={{
            ...pill, fontSize: 13,
            background: sub === s.id ? TEXT_PRIMARY : "transparent",
            color: sub === s.id ? "#fff" : TEXT_SECONDARY,
            border: sub === s.id ? "none" : "1px solid " + BORDER,
          }}>{s.label}</button>
        ))}
      </div>
      {sub === "answer" && <StudentAnswerView data={data} setData={setData} userName={userName} />}
      {sub === "classtools" && <ClassTools data={data} setData={setData} isAdmin={isAdmin} userName={userName} />}
      {sub === "survey" && <SurveyView data={data} setData={setData} isAdmin={isAdmin} userName={userName} />}
      {sub === "activities" && isAdmin && <GameAdmin data={data} setData={setData} />}
    </div>
  );
}

function HomeTodoSummary({ data, setData, studentId, setView, classDays, nextAssignment }) {
  const todos = data.todos || [];
  const todoChecks = data.todoChecks || {};
  const rebounds = data.rebounds || {};
  const hiddenTodos = data.hiddenTodos || {};
  const grades = data.grades || {};
  const schedule = data.schedule || [];
  const assignments = data.assignments || [];
  const readings = data.readings || [];

  const toggleCheck = async (todoId) => {
    const key = studentId + "-" + todoId;
    const updated = { ...data, todoChecks: { ...(data.todoChecks || {}), [key]: !todoChecks[key] } };
    await saveData(updated); setData(updated);
  };

  const hideTodo = async (todoId) => {
    const key = studentId + "-" + todoId;
    const updated = { ...data, hiddenTodos: { ...hiddenTodos, [key]: true } };
    await saveData(updated); setData(updated);
  };

  // Build auto rebound to-dos
  const reboundTodos = [];
  const activityTypes = [
    { type: "game", store: "weeklyGames", label: "Weekly Game" },
    { type: "tot", store: "weeklyToT", label: "This or That" },
    { type: "fishbowl", store: "weeklyFishbowl", label: "Fishbowl" },
  ];
  activityTypes.forEach(({ type, store, label }) => {
    const activities = data[store] || {};
    Object.keys(activities).forEach(w => {
      const act = activities[w];
      const scored = type === "fishbowl" ? act?.confirmed : act?.scored;
      if (!scored) return;
      const rKey = type + "-" + w;
      // Skip if student hid this rebound box
      if ((data.hiddenRebounds || {})[studentId + "-" + rKey]) return;
      // Skip if a rebound grade has already been entered for this student/week
      if (type === "game" && (data.reboundGrades || {})[studentId + "-game-" + w]) return;
      const rd = rebounds[rKey] || {};
      const scoredTs = rd.scoredTs || 0;
      const deadline = scoredTs + 72 * 60 * 60 * 1000;
      const ss = (rd.studentStatuses || {})[studentId] || {};
      if (ss.approved || ss.link) return;
      const status = ss.status || "";
      if ((status === "rebound" || status === "unannounced_override") && Date.now() < deadline) {
        const optedIn = todoChecks["optin-" + rKey + "-" + studentId];
        if (optedIn) {
          const hoursLeft = Math.max(0, Math.round((deadline - Date.now()) / (1000 * 60 * 60)));
          reboundTodos.push({ id: "rebound-" + rKey, title: "Submit rebound: " + label + " Wk " + w, due: hoursLeft + "h left", dueTs: deadline, linkTab: "activities", auto: true });
        }
      }
      if (status === "planned_makeup") {
        const mDeadline = scoredTs + 7 * 24 * 60 * 60 * 1000;
        if (Date.now() < mDeadline) {
          const optedIn = todoChecks["optin-" + rKey + "-" + studentId];
          if (optedIn) {
            const daysLeft = Math.max(0, Math.round((mDeadline - Date.now()) / (1000 * 60 * 60 * 24)));
            reboundTodos.push({ id: "makeup-" + rKey, title: "Office hours makeup: " + label + " Wk " + w, due: daysLeft + "d left", dueTs: mDeadline, auto: true });
          }
        }
      }
    });
  });

  // ── Smarter auto-todos: readings within next 5 days, assignments due within next 7 days
  const now = new Date();
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const FIVE_DAYS = 5 * 24 * 60 * 60 * 1000;
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  // Readings attached to schedule days in next 5 days
  const readingTodos = [];
  const seenReadingKeys = new Set();
  schedule.forEach(week => {
    (week.dates || []).forEach(d => {
      if (!d.readings || d.readings.length === 0) return;
      if (d.day === "Finals") return;
      const year = now.getFullYear();
      const parsed = new Date(d.date + ", " + year);
      if (isNaN(parsed)) return;
      const ts = parsed.getTime();
      if (ts < today0) return;
      if (ts - today0 > FIVE_DAYS) return;
      d.readings.forEach(r => {
        if (r.type !== "required" && r.type !== "fishbowl") return;
        const rdg = readings.find(x => x.id === r.readingId);
        if (!rdg) return;
        const key = "reading-" + r.readingId + "-" + d.date;
        if (seenReadingKeys.has(key)) return;
        seenReadingKeys.add(key);
        const link = rdg.pdfUrl || rdg.url || null;
        const daysLeft = Math.round((ts - today0) / (1000 * 60 * 60 * 24));
        const dueLabel = daysLeft === 0 ? "Due today" : daysLeft === 1 ? "Due tomorrow" : "Due in " + daysLeft + "d (" + d.day + ")";
        readingTodos.push({
          id: key,
          title: (r.type === "fishbowl" ? "Fishbowl reading: " : "Reading: ") + rdg.title,
          due: dueLabel,
          dueTs: ts,
          link,
          linkTab: link ? null : "more",
          auto: true,
        });
      });
    });
  });

  // Assignments due within next 7 days, not yet graded for this student
  const assignmentTodos = [];
  assignments.forEach(a => {
    if (!a.due || a.id === "participation") return;
    // Skip if already graded
    const g = grades[studentId + "-" + a.id];
    if (g && g.score !== undefined && g.score !== "") return;
    // Parse due
    const year = now.getFullYear();
    const parsed = new Date(a.due + ", " + year);
    if (isNaN(parsed)) return;
    const ts = parsed.getTime();
    if (ts < today0) return;
    if (ts - today0 > SEVEN_DAYS) return;
    const daysLeft = Math.round((ts - today0) / (1000 * 60 * 60 * 24));
    const dueLabel = daysLeft === 0 ? "Due today" : daysLeft === 1 ? "Due tomorrow" : "Due in " + daysLeft + "d";
    assignmentTodos.push({
      id: "assignment-" + a.id,
      title: a.name,
      due: dueLabel,
      dueTs: ts,
      linkTab: "assignments",
      auto: true,
    });
  });

  // Filter manual todos for this student, parse dueTs from due string
  const myManualTodos = todos.filter(t => !t.targetStudents || t.targetStudents.includes(studentId)).filter(t => !hiddenTodos[studentId + "-" + t.id]).map(t => {
    let dueTs = null;
    if (t.due) {
      try {
        const parsed = new Date(t.due + ", 2026");
        if (!isNaN(parsed.getTime())) dueTs = parsed.getTime();
      } catch {}
    }
    // Migrate old linkTab values
    let linkTab = t.linkTab;
    if (linkTab === "leaderboard") linkTab = "more";
    if (linkTab === "readings") linkTab = "more";
    if (linkTab === "inclass") linkTab = "activities";
    if (linkTab === "boards") linkTab = "activities";
    if (linkTab === "classtools") linkTab = "activities";
    if (linkTab === "roster") linkTab = "more";
    return { ...t, dueTs, linkTab, kind: "todo", category: "To-do" };
  });

  // Tag categories on each list of items
  const taggedRebound = reboundTodos.map(t => ({ ...t, kind: "rebound", category: t.id.startsWith("makeup-") ? "Office hours makeup" : "Rebound" }));
  const taggedReading = readingTodos.map(t => ({ ...t, kind: "reading", category: t.title.startsWith("Fishbowl reading:") ? "Fishbowl reading" : "Reading" }));
  const taggedAssignment = assignmentTodos.map(t => ({ ...t, kind: "assignment", category: "Assignment" }));

  // Class days from props (chronologically merged in)
  const classTodos = (classDays || []).map(d => {
    const year = new Date().getFullYear();
    const parsed = new Date(d.date + ", " + year);
    const ts = parsed.getTime();
    return {
      id: "class-" + d.date,
      title: d.holiday ? "No in-person class" : (d.topic || "Class"),
      due: d.day + " " + d.date,
      dueTs: ts,
      linkTab: "schedule",
      kind: "class",
      category: d.holiday ? "No class" : "Class",
      classMeta: d, // pass through for richer rendering if needed
      auto: true, // never check-able
    };
  });

  // Next assignment from props (only if not already in assignmentTodos for next 7 days)
  // The assignmentTodos picks up assignments due within 7 days. If nextAssignment is further out
  // (e.g. due in 14 days), it won't be in assignmentTodos. Add it as its own entry to keep the
  // "Next assignment, due in N days" callout visible.
  const nextAssignmentTodos = [];
  if (nextAssignment) {
    const alreadyIn = taggedAssignment.some(t => t.id === "assignment-" + nextAssignment.id);
    if (!alreadyIn) {
      nextAssignmentTodos.push({
        id: "assignment-" + nextAssignment.id,
        title: nextAssignment.name,
        due: nextAssignment.dueLabel,
        dueTs: nextAssignment.dueTs,
        linkTab: "assignments",
        kind: "assignment",
        category: "Next assignment",
        auto: true,
      });
    }
  }

  const allTodos = [
    ...classTodos,
    ...taggedRebound,
    ...taggedReading,
    ...taggedAssignment,
    ...nextAssignmentTodos,
    ...myManualTodos,
  ];

  // Filter out checked / hidden
  const unchecked = allTodos.filter(t => {
    if (t.auto) {
      if (hiddenTodos[studentId + "-" + t.id]) return false;
      return true;
    }
    return !todoChecks[studentId + "-" + t.id];
  });
  const checked = allTodos.filter(t => !t.auto && todoChecks[studentId + "-" + t.id]);

  // Sort chronologically by dueTs (items without dueTs sink to bottom)
  unchecked.sort((a, b) => {
    if (a.dueTs == null && b.dueTs == null) return 0;
    if (a.dueTs == null) return 1;
    if (b.dueTs == null) return -1;
    return a.dueTs - b.dueTs;
  });

  if (unchecked.length === 0 && checked.length === 0) return null;

  const isPastDue = (t) => t.dueTs && Date.now() > t.dueTs + (t.kind === "class" ? 24 * 60 * 60 * 1000 : (t.auto ? 0 : 24 * 60 * 60 * 1000));

  // Build a "due in N days" or "due today" / "due tomorrow" label from dueTs (for the small category header)
  const _todayMidnight = new Date();
  _todayMidnight.setHours(0, 0, 0, 0);
  const _today0 = _todayMidnight.getTime();
  const fmtDueLabel = (t) => {
    // For items that already provide a due string, use it directly
    if (t.due) return t.due;
    if (!t.dueTs) return "";
    const diff = t.dueTs - _today0;
    const days = Math.round(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return "Past due";
    if (days === 0) return "today";
    if (days === 1) return "tomorrow";
    return "in " + days + " days";
  };

  // Color the small category line based on urgency
  const categoryColor = (t) => {
    if (!t.dueTs) return TEXT_MUTED;
    const diff = t.dueTs - _today0;
    const days = Math.round(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return RED;
    if (days <= 2) return AMBER;
    return TEXT_MUTED;
  };

  return (
    <div>
      {unchecked.map(t => {
        const pastDue = isPastDue(t);
        const label = t.kind === "class" ? t.category + " " + t.due : (t.category + ", " + (t.due ? t.due : fmtDueLabel(t)).replace(/^Due /, "due "));
        const catColor = categoryColor(t);
        return (
          <div key={t.id} style={{ padding: "10px 0", borderBottom: "1px solid " + BORDER, display: "flex", alignItems: "center", gap: 10 }}>
            {!t.auto && (
              <button onClick={() => toggleCheck(t.id)} style={{
                display: "flex", alignItems: "center", padding: 0, borderRadius: 4, cursor: "pointer",
                border: "2px solid " + BORDER_STRONG, background: "#fff", flexShrink: 0, width: 18, height: 18,
              }} aria-label="Mark done" />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: pastDue ? RED : catColor, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {pastDue ? t.category + ", past due" : label}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {t.link ? (
                  <a href={t.link} target="_blank" rel="noopener noreferrer" style={{ color: TEXT_PRIMARY, textDecoration: "none" }}>{t.title}</a>
                ) : (
                  <span>{t.title}</span>
                )}
              </div>
            </div>
            {t.linkTab && <button onClick={() => setView(t.linkTab)} style={linkPill}>Open</button>}
            {t.auto && (t.id.startsWith("reading-") || t.id.startsWith("assignment-")) && (
              <button onClick={() => hideTodo(t.id)} title="Dismiss" style={{ fontSize: 14, color: TEXT_MUTED, background: "none", border: "none", cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>x</button>
            )}
          </div>
        );
      })}
      {checked.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: TEXT_MUTED, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>Completed</div>
          {checked.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", opacity: 0.5 }}>
              <button onClick={() => toggleCheck(t.id)} style={{
                display: "flex", alignItems: "center", justifyContent: "center", padding: 0, borderRadius: 4, cursor: "pointer",
                border: "2px solid " + GREEN, background: GREEN, flexShrink: 0, width: 18, height: 18,
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
              </button>
              <span style={{ fontSize: 13, color: TEXT_MUTED, textDecoration: "line-through" }}>{t.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function HomeReboundBox({ data, setData, studentId }) {
  const [links, setLinks] = useState({});
  const [showPolicy, setShowPolicy] = useState(false);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const rebounds = data.rebounds || {};
  const todoChecks = data.todoChecks || {};
  const pendingItems = [];
  const activityTypes = [
    { type: "game", store: "weeklyGames", label: "Weekly Game", max: 100 },
    { type: "tot", store: "weeklyToT", label: "This or That", max: 20 },
    { type: "fishbowl", store: "weeklyFishbowl", label: "Fishbowl", max: 20 },
  ];

  activityTypes.forEach(({ type, store, label, max }) => {
    const activities = data[store] || {};
    Object.keys(activities).forEach(w => {
      const act = activities[w];
      const scored = type === "fishbowl" ? act?.confirmed : act?.scored;
      if (!scored) return;
      const rKey = type + "-" + w;
      const rd = rebounds[rKey] || {};
      const ss = (rd.studentStatuses || {})[studentId] || {};
      if (ss.approved) return;
      const status = ss.status || "";
      if (!status || status === "present") return;
      const scoredTs = rd.scoredTs || 0;
      const reboundDeadline = scoredTs + 48 * 60 * 60 * 1000;
      const makeupDeadline = scoredTs + 7 * 24 * 60 * 60 * 1000;

      let gradePercent = 0;
      if (type === "game") {
        const game = act;
        let gp = 0;
        for (let q = 0; q < (game.questions || []).length; q++) {
          if (game.responses?.[studentId + "-" + q] === game.questions[q].correct) gp += (HOME_GRADE_PTS[game.questions[q].category] || 0);
        }
        gradePercent = Math.round(gp / max * 1000) / 10;
      } else if (type === "tot") {
        const ptsEach = act.questions?.length > 0 ? max / act.questions.length : max;
        let pts = 0;
        (act.questions || []).forEach((q, qi) => { if (act.responses?.[studentId + "-" + qi] === q.correct) pts += ptsEach; });
        gradePercent = Math.round(pts / max * 1000) / 10;
      } else {
        gradePercent = Math.round((act.scores?.[studentId] ?? 0) / max * 1000) / 10;
      }

      const targetPercent = gradePercent < 50 ? 60 : gradePercent <= 65 ? 70 : gradePercent <= 79 ? 80 : null;
      const optedIn = todoChecks["optin-" + rKey + "-" + studentId];

      if (status === "planned_makeup" && Date.now() < makeupDeadline) {
        pendingItems.push({ rKey, status, label: label + " Wk " + w, daysLeft: Math.max(0, Math.round((makeupDeadline - Date.now()) / (1000 * 60 * 60 * 24))), type, week: w });
      }
      if ((status === "rebound" || status === "unannounced_override") && Date.now() < reboundDeadline && !ss.link) {
        pendingItems.push({ rKey, status, label: label + " Wk " + w, gradePercent, targetPercent, hoursLeft: Math.max(0, Math.round((reboundDeadline - Date.now()) / (1000 * 60 * 60))), optedIn, type, week: w });
      }
      if ((status === "rebound" || status === "unannounced_override") && ss.link && !ss.approved) {
        pendingItems.push({ rKey, status: "submitted", label: label + " Wk " + w, type, week: w });
      }
      if (status === "unannounced") {
        pendingItems.push({ rKey, status, label: label + " Wk " + w, type, week: w });
      }
    });
  });

  if (pendingItems.length === 0) return null;

  const submitLink = async (rKey) => {
    const link = (links[rKey] || "").trim();
    if (!link) return;
    const rd = rebounds[rKey] || {};
    const ss = { ...(rd.studentStatuses || {}), [studentId]: { ...((rd.studentStatuses || {})[studentId] || {}), link, linkTs: Date.now() } };
    const updated = { ...data, rebounds: { ...rebounds, [rKey]: { ...rd, studentStatuses: ss } } };
    await saveData(updated); setData(updated);
    setLinks(prev => ({ ...prev, [rKey]: "" }));
    showMsg("Submitted! Your instructor will review.");
  };

  const optIn = async (rKey) => {
    const key = "optin-" + rKey + "-" + studentId;
    const updated = { ...data, todoChecks: { ...todoChecks, [key]: true } };
    await saveData(updated); setData(updated);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {msg && <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#111", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 999 }}>{msg}</div>}
      {pendingItems.map((item, i) => {
        const isRebound = item.status === "rebound" || item.status === "unannounced_override";
        const sc = item.status === "planned_makeup" ? { bg: "#ecfdf5", border: "#10b981", color: "#065f46" }
          : item.status === "unannounced" ? { bg: "#fef2f2", border: "#ef4444", color: "#991b1b" }
          : item.status === "submitted" ? { bg: "#ecfdf5", border: "#10b981", color: "#065f46" }
          : { bg: "#fffbeb", border: "#f59e0b", color: "#92400e" };
        return (
          <div key={i} style={{ ...crd, padding: 14, marginBottom: 8, borderLeft: "4px solid " + sc.border, background: sc.bg }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: sc.color }}>
                  {item.status === "planned_makeup" ? "Planned Makeup" : item.status === "unannounced" ? "Makeup Unavailable" : item.status === "submitted" ? "Rebound Submitted" : "Rebound Available"}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginTop: 2 }}>{item.label}</div>
              </div>
              {isRebound && !item.optedIn && (
                <button onClick={() => optIn(item.rKey)} style={{ ...pill, background: "#f59e0b", color: "#fff", fontSize: 11, flexShrink: 0 }}>Add to my to-do list</button>
              )}
            </div>

            {isRebound && (
              <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.6, marginTop: 6, marginBottom: 8 }}>
                You earned a <strong>{item.gradePercent}%</strong>. I want you to get a strong grade in this class, so for this assignment, you can earn up to <strong>{item.targetPercent}%</strong> by submitting a video of you explaining the material with a friend or family member. Look at the questions you got incorrect, understand them better, and then explain the concept or situation to a friend. Please do this for all the incorrect questions.
                {"\n\n"}These points count for <strong>your grade only</strong>, not the in-class leaderboard. You have <strong>{item.hoursLeft} hours</strong> left to submit.
              </div>
            )}

            {isRebound && (
              <div style={{ marginBottom: 6 }}>
                <button onClick={() => { const ev = new CustomEvent("nav", { detail: "inclass" }); window.dispatchEvent(ev); }} style={{ fontSize: 12, color: ACCENT, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontWeight: 600, padding: 0, marginBottom: 8, display: "block" }}>View your answers and the correct answers</button>
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={links[item.rKey] || ""} onChange={e => setLinks(prev => ({ ...prev, [item.rKey]: e.target.value }))} placeholder="Paste your video link here..." style={{ ...inp, flex: 1, fontSize: 13 }} />
                  <button onClick={() => submitLink(item.rKey)} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", fontSize: 12 }}>Submit</button>
                </div>
              </div>
            )}

            {item.status === "submitted" && <div style={{ fontSize: 13, color: GREEN, fontWeight: 600 }}>Your rebound video has been submitted. Waiting for instructor review.</div>}
            {item.status === "planned_makeup" && <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.6, marginTop: 4 }}>Come to office hours to retake this activity. You have <strong>{item.daysLeft} days</strong> remaining. Full points available for both leaderboard and grade.</div>}
            {item.status === "unannounced" && <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.6, marginTop: 4 }}>Your absence was unannounced. Contact your instructor if you believe this is an error.</div>}

            <button onClick={() => setShowPolicy(!showPolicy)} style={{ fontSize: 11, color: ACCENT, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontWeight: 600, padding: 0, marginTop: 6 }}>{showPolicy ? "Hide Policy" : "View Rebound Policy"}</button>
            {showPolicy && <div style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.6, whiteSpace: "pre-wrap", padding: 10, background: "rgba(255,255,255,0.7)", borderRadius: 8, marginTop: 6, border: "1px solid " + BORDER }}>{REBOUND_POLICY}</div>}
          </div>
        );
      })}
    </div>
  );
}

function HomeGradedNotifications({ data, setData, studentId }) {
  const assignments = data.assignments || [];
  const grades = data.grades || {};
  const notifications = data.gradeNotifications || {};

  const items = [];
  assignments.forEach(a => {
    if (a.id === "participation") return;
    const key = studentId + "-" + a.id;
    const notif = notifications[key];
    if (!notif) return;
    const g = grades[key] || {};
    if (g.score === undefined || g.score === "") return;
    items.push({ key, assignment: a, grade: g, ts: notif.ts });
  });

  if (items.length === 0) return null;
  items.sort((a, b) => b.ts - a.ts);

  const dismiss = async (key) => {
    const newNotifs = { ...(data.gradeNotifications || {}) };
    delete newNotifs[key];
    const updated = { ...data, gradeNotifications: newNotifs };
    await window.storage.set(STORAGE_KEY, JSON.stringify(updated), true);
    setData(updated);
  };

  const dismissAll = async () => {
    const newNotifs = { ...(data.gradeNotifications || {}) };
    items.forEach(i => delete newNotifs[i.key]);
    const updated = { ...data, gradeNotifications: newNotifs };
    await window.storage.set(STORAGE_KEY, JSON.stringify(updated), true);
    setData(updated);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 500, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.1em" }}>Recently Graded</div>
        {items.length > 1 && (
          <button onClick={dismissAll} style={{ fontSize: 11, color: TEXT_SECONDARY, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontWeight: 600, padding: 0 }}>Dismiss all</button>
        )}
      </div>
      {items.map(item => {
        const isZero = parseFloat(item.grade.score) === 0;
        return (
          <div key={item.key} style={{ ...crd, padding: 14, marginBottom: 6, borderLeft: "4px solid " + (isZero ? RED : GREEN), background: isZero ? "#fef2f2" : "#ecfdf5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: isZero ? "#991b1b" : "#065f46" }}>
                  {item.assignment.name} has been graded
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: isZero ? RED : "#111827", marginTop: 4 }}>
                  {item.grade.score}<span style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500 }}> / {item.grade.outOf || 100}</span>
                </div>
                {item.grade.comment && (
                  <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 6, padding: "6px 8px", background: "rgba(255,255,255,0.7)", borderRadius: 6, lineHeight: 1.4 }}>
                    {item.grade.comment}
                  </div>
                )}
                {isZero && (
                  <div style={{ fontSize: 12, color: RED, marginTop: 6, fontWeight: 600 }}>This assignment needs attention. Check the requirements and resubmit.</div>
                )}
              </div>
              <button onClick={() => dismiss(item.key)} style={{ fontSize: 20, color: TEXT_MUTED, background: "none", border: "none", cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>x</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HomeView({ data, setData, userName, isAdmin, setView }) {
  const [msg, setMsg] = useState("");
  const [newsExpanded, setNewsExpanded] = useState(false);
  const [newNewsText, setNewNewsText] = useState("");
  const [newNewsType, setNewNewsType] = useState("info");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const news = data.news || [];
  const boards = data.boards || [];
  const schedule = data.schedule || [];
  const assignments = data.assignments || [];
  const grades = data.grades || {};
  const submissions = data.submissions || {};
  const student = data.students.find(s => s.name === userName);
  const studentId = student?.id;
  const isStudent = !!studentId && !isAdmin;

  // Admin: post news
  const addNews = async () => {
    if (!newNewsText.trim()) return;
    const item = { id: genId(), text: newNewsText.trim(), type: newNewsType, ts: Date.now() };
    const updated = { ...data, news: [item, ...news] };
    await saveData(updated); setData(updated);
    setNewNewsText(""); showMsg("Posted");
  };
  const removeNews = async (id) => {
    const updated = { ...data, news: news.filter(n => n.id !== id) };
    await saveData(updated); setData(updated); showMsg("Removed");
  };

  const today = new Date();
  const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const year = today.getFullYear();

  // ─── Live activity detection ───
  const isLiveSlot = (s) => !!(s && s.phase === "live");
  let liveActivity = null;
  Object.keys(data.weeklyGames || {}).forEach(w => {
    if (isLiveSlot(data.weeklyGames[w])) liveActivity = { type: "Weekly Game", week: w, label: "Weekly Game, Wk " + w };
  });
  Object.keys(data.weeklyToT || {}).forEach(w => {
    if (isLiveSlot(data.weeklyToT[w])) liveActivity = { type: "This or That", week: w, label: "This or That, Wk " + w };
  });
  (data.headlines?.sessions || []).forEach(s => {
    if (s.activeHeadlineId && s.phase !== "done") liveActivity = { type: "Headlines", label: "Headlines: " + (s.weekLabel || "live") };
  });
  (data.surveys || []).forEach(s => {
    if (s.active) liveActivity = { type: "Survey", label: s.question || "Class survey" };
  });

  // ─── Rebound detection ───
  let activeRebound = null;
  if (studentId) {
    const rebounds = data.rebounds || {};
    Object.keys(rebounds).forEach(rk => {
      const rd = rebounds[rk];
      if (!rd) return;
      const ss = (rd.studentStatuses || {})[studentId];
      if (!ss) return;
      // Active rebound: student opted in, not yet completed
      if (ss.status === "planned_makeup" || ss.status === "rebound" || ss.status === "unannounced") {
        const reboundGrades = data.reboundGrades || {};
        if (reboundGrades[studentId + "-" + rk]) return; // already completed
        const deadline = ss.deadline || rd.deadline;
        // Hide card if deadline is missing or has passed
        if (!deadline) return;
        const ms = deadline - Date.now();
        if (ms <= 0) return;
        const hrs = Math.floor(ms / (1000 * 60 * 60));
        const days = Math.floor(hrs / 24);
        const timeLeft = days >= 1 ? days + "d left" : hrs + "h left";
        const m = rk.match(/^(game|tot)-(\w+)$/);
        const activityLabel = m ? (m[1] === "game" ? "Weekly Game Wk " + m[2] : "This or That Wk " + m[2]) : rk;
        const log = data.log || [];
        const earnedSrc = m ? (m[1] === "game" ? "Game Wk" + m[2] : "ToT Wk" + m[2]) : "";
        const earnedEntries = log.filter(e => e.studentId === studentId && e.source === earnedSrc);
        const earned = earnedEntries.reduce((a, e) => a + e.amount, 0);
        if (!activeRebound) activeRebound = { activityLabel, timeLeft, scoreLine: earned > 0 ? "You scored " + earned + "/100. Submit a rebound to improve your grade." : "Submit a rebound to improve your grade." };
      }
    });
  }

  // ─── Assignments context lines ───
  const assignmentLines = [];
  if (studentId) {
    const gradedAssignments = assignments.filter(a => a.id !== "participation");

    // Chip helper: returns { label, bg, color } for a line based on state.
    const chipFor = (a) => {
      const sub = submissions[studentId + "-" + a.id];
      const g = grades[studentId + "-" + a.id] || {};
      const hasGrade = g.score !== undefined && g.score !== "";
      if (hasGrade) return { label: "Graded " + g.score, bg: "#ecfdf5", color: "#047857" };
      if (sub) return { label: "Submitted", bg: "#eff6ff", color: "#2563eb" };
      return { label: "Upcoming", bg: "#fffbeb", color: "#92400e" };
    };

    // Overdue (not yet submitted, past due) — no chip needed; the text "past due" is the signal
    gradedAssignments.forEach(a => {
      if (!a.due) return;
      const sub = submissions[studentId + "-" + a.id];
      const g = grades[studentId + "-" + a.id] || {};
      if (g.score !== undefined && g.score !== "") return;
      if (sub) return;
      const parsed = new Date(a.due + ", " + year);
      if (isNaN(parsed)) return;
      if (parsed.getTime() < today0) {
        assignmentLines.push({ kind: "overdue", color: "#dc2626", textColor: "#991b1b", text: a.name + " past due", chip: { label: "Missing", bg: "#fef2f2", color: "#991b1b" } });
      }
    });
    // Due today / tomorrow — shows regardless of submission/grade state
    gradedAssignments.forEach(a => {
      if (!a.due) return;
      const parsed = new Date(a.due + ", " + year);
      if (isNaN(parsed)) return;
      const ts = parsed.getTime();
      if (ts < today0) return;
      const days = Math.round((ts - today0) / (1000 * 60 * 60 * 24));
      if (days !== 0 && days !== 1) return;
      const when = days === 0 ? " due today" : " due tomorrow";
      assignmentLines.push({ kind: "due", color: "#f59e0b", textColor: "#92400e", text: a.name + when, chip: chipFor(a) });
    });
    // Next assignment (prominent, dark) — anything coming up, regardless of submission/graded state.
    // Skip if already covered by due today/tomorrow.
    const nextA = (() => {
      const candidates = gradedAssignments.filter(a => {
        if (!a.due) return false;
        const parsed = new Date(a.due + ", " + year);
        if (isNaN(parsed)) return false;
        return parsed.getTime() >= today0;
      }).map(a => ({ ...a, ts: new Date(a.due + ", " + year).getTime() })).sort((a, b) => a.ts - b.ts);
      return candidates[0] || null;
    })();
    if (nextA) {
      const days = Math.round((nextA.ts - today0) / (1000 * 60 * 60 * 24));
      if (days >= 2) {
        const dayLabel = "Next: " + nextA.name + " due in " + days + " days";
        assignmentLines.push({ kind: "next", color: ACCENT, textColor: TEXT_PRIMARY, text: dayLabel, chip: chipFor(nextA) });
      }
    }
    // Last graded (quieter — single line, only most recent, no time limit)
    const lastGraded = (() => {
      let best = null;
      gradedAssignments.forEach(a => {
        const g = grades[studentId + "-" + a.id] || {};
        if (g.score === undefined || g.score === "") return;
        if (!g.ts) return;
        if (!best || g.ts > best.ts) best = { a, score: g.score, ts: g.ts };
      });
      return best;
    })();
    if (lastGraded) {
      assignmentLines.push({ kind: "lastgraded", color: "#d1d5db", textColor: TEXT_SECONDARY, text: "Last graded: " + lastGraded.a.name, chip: { label: "Graded " + lastGraded.score, bg: "#ecfdf5", color: "#047857" } });
    }
  }

  // ─── This week schedule data ───
  const upcomingDates = [];
  schedule.forEach(week => {
    (week.dates || []).forEach(d => {
      if (d.day === "Finals") return;
      const parsed = new Date(d.date + ", " + year);
      if (!isNaN(parsed) && parsed.getTime() >= today0) {
        upcomingDates.push({ ...d, weekLabel: week.label, weekNum: week.week, parsedDate: parsed });
      }
    });
  });
  upcomingDates.sort((a, b) => a.parsedDate - b.parsedDate);
  const nextClass = upcomingDates[0];
  const followingClasses = upcomingDates.slice(1, 3);
  // Readings + assignments for next class
  const nextClassReadings = [];
  if (nextClass) {
    (nextClass.readings || []).forEach(r => {
      const rdg = (data.readings || []).find(x => x.id === r.readingId);
      if (rdg) nextClassReadings.push({ title: rdg.title, type: r.type, url: rdg.pdfUrl || rdg.url || null });
    });
  }
  const nextClassAssignmentDue = nextClass && nextClass.assignment ? nextClass.assignment : null;

  // ─── Discussion boards data ───
  const activeBoards = boards.filter(b => b.active);
  const latestBoard = activeBoards.sort((a, b) => (b.ts || 0) - (a.ts || 0))[0] || boards[0];
  const latestReplyCount = latestBoard ? Object.keys(latestBoard.posts || {}).length : 0;

  // ─── Leaderboard data ───
  const ranked = data.students.map(s => ({ ...s, points: data.log.filter(e => e.studentId === s.id).reduce((t, e) => t + e.amount, 0) })).sort((a, b) => b.points - a.points);
  const myRank = ranked.findIndex(s => s.name === userName);
  const totalStudents = data.students.filter(s => s.name !== ADMIN_NAME && s.name !== "Bruce Willis").length;

  // ─── Roster count ───
  const rosterCount = totalStudents;

  // News colors
  const newsColors = {
    info: { bg: "#eff6ff", border: "#bfdbfe", textColor: "#1e40af", labelBg: "#dbeafe", label: "Info" },
    assignment: { bg: "#fffbeb", border: "#fcd34d", textColor: "#92400e", labelBg: "#fef3c7", label: "Assignment" },
    alert: { bg: "#fef2f2", border: "#fca5a5", textColor: "#991b1b", labelBg: "#fee2e2", label: "Alert" },
  };

  // Build the card list in the right order
  const cards = [];
  if (activeRebound) cards.push("rebound");
  cards.push("assignments", "schedule", "boards");
  cards.push("roster");

  const renderCard = (name) => {
    if (name === "rebound" && activeRebound) {
      return (
        <button key="rebound" onClick={() => setView("assignments")} style={{ width: "100%", textAlign: "left", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer", fontFamily: F }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ display: "inline-block", width: 6, height: 6, background: "#dc2626", borderRadius: "50%" }} />
                <div style={{ fontSize: 18, fontWeight: 500, color: "#7f1d1d", letterSpacing: "-0.01em" }}>Rebound</div>
              </div>
              <div style={{ fontSize: 13, color: "#991b1b", fontWeight: 500, marginBottom: 4 }}>{activeRebound.activityLabel}</div>
              <div style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.4 }}>{activeRebound.scoreLine}</div>
            </div>
            {activeRebound.timeLeft && <span style={{ fontSize: 11, color: "#991b1b", fontWeight: 500, flexShrink: 0 }}>{activeRebound.timeLeft}</span>}
          </div>
        </button>
      );
    }
    if (name === "live") {
      const live = !!liveActivity;
      const openBtnStyle = {
        fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 8,
        border: "1px solid " + (live ? "#6ee7b7" : BORDER_STRONG),
        background: "#fff", color: live ? "#065f46" : TEXT_PRIMARY,
        cursor: "pointer", fontFamily: F, flexShrink: 0,
      };
      return (
        <button key="live" onClick={() => setView("activities")} style={{ width: "100%", textAlign: "left", background: live ? "#ecfdf5" : "#fff", border: live ? "1px solid #6ee7b7" : "1px solid " + BORDER_STRONG, borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer", fontFamily: F }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                {live && <span style={{ display: "inline-block", width: 6, height: 6, background: "#10b981", borderRadius: "50%", animation: "livePulse 1.6s ease-in-out infinite" }} />}
                <div style={{ fontSize: 18, fontWeight: 500, color: live ? "#065f46" : TEXT_PRIMARY, letterSpacing: "-0.01em" }}>Live</div>
              </div>
              <div style={{ fontSize: 13, color: live ? "#047857" : TEXT_SECONDARY, fontWeight: 500, marginBottom: 4 }}>{live ? liveActivity.label : "Past activities"}</div>
              <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.4 }}>{live ? "Tap to answer questions in real time." : "Nothing live right now. Browse past activities."}</div>
            </div>
            <span style={openBtnStyle}>Open</span>
          </div>
        </button>
      );
    }
    if (name === "assignments") {
      const openBtnStyle = {
        fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 8,
        border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_PRIMARY,
        cursor: "pointer", fontFamily: F, flexShrink: 0,
      };
      return (
        <button key="assignments" onClick={() => setView("assignments")} style={{ width: "100%", textAlign: "left", background: "#fff", border: "1px solid " + BORDER_STRONG, borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer", fontFamily: F, boxShadow: "0 1px 2px rgba(17, 24, 39, 0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: assignmentLines.length > 0 ? 10 : 0 }}>
            <div style={{ fontSize: 18, fontWeight: 500, color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>Assignments</div>
            <span style={openBtnStyle}>Open</span>
          </div>
          {assignmentLines.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {assignmentLines.map((l, i) => {
                const isLastGraded = l.kind === "lastgraded";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, opacity: isLastGraded ? 0.85 : 1 }}>
                    <span style={{ display: "inline-block", width: 5, height: 5, background: l.color, borderRadius: "50%", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: l.textColor, lineHeight: 1.4, flex: 1, minWidth: 0, fontWeight: l.kind === "next" ? 500 : 400 }}>{l.text}</span>
                    {l.chip && <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 5, background: l.chip.bg, color: l.chip.color, textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>{l.chip.label}</span>}
                  </div>
                );
              })}
            </div>
          )}
          {assignmentLines.length === 0 && (
            <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>Open to view your assignments and grades.</div>
          )}
        </button>
      );
    }
    if (name === "schedule") {
      const openBtnStyle = {
        fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 8,
        border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_PRIMARY,
        cursor: "pointer", fontFamily: F, flexShrink: 0,
      };
      return (
        <button key="schedule" onClick={() => setView("schedule")} style={{ width: "100%", textAlign: "left", background: "#fff", border: "1px solid " + BORDER_STRONG, borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer", fontFamily: F, boxShadow: "0 1px 2px rgba(17, 24, 39, 0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 500, color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>Schedule</div>
            <span style={openBtnStyle}>Open</span>
          </div>
          {nextClass ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY, marginBottom: 4 }}>{nextClass.day} {nextClass.date}: {nextClass.topic || "Class"}</div>
              {(nextClassReadings.length > 0 || nextClassAssignmentDue) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingLeft: 2, marginBottom: followingClasses.length > 0 ? 8 : 0 }}>
                  {nextClassReadings.map((r, i) => (
                    r.url ? (
                      <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 13, color: "#2563eb", textDecoration: "none" }}>Reading: {r.title}</a>
                    ) : (
                      <div key={i} style={{ fontSize: 13, color: TEXT_SECONDARY }}>Reading: {r.title}</div>
                    )
                  ))}
                  {nextClassAssignmentDue && <div style={{ fontSize: 13, color: "#b45309", fontWeight: 500 }}>{nextClassAssignmentDue}</div>}
                </div>
              )}
              {followingClasses.length > 0 && (
                <div style={{ borderTop: "1px solid " + BORDER, paddingTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                  {followingClasses.map((d, i) => <div key={i} style={{ fontSize: 12, color: TEXT_SECONDARY }}>{d.day} {d.date}: {d.topic || "Class"}</div>)}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>No upcoming classes scheduled.</div>
          )}
        </button>
      );
    }
    if (name === "boards") {
      const openBtnStyle = {
        fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 8,
        border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_PRIMARY,
        cursor: "pointer", fontFamily: F, flexShrink: 0,
      };
      return (
        <button key="boards" onClick={() => setView("boards")} style={{ width: "100%", textAlign: "left", background: "#fff", border: "1px solid " + BORDER_STRONG, borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer", fontFamily: F, boxShadow: "0 1px 2px rgba(17, 24, 39, 0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 18, fontWeight: 500, color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>Boards</div>
            <span style={openBtnStyle}>Open</span>
          </div>
          {latestBoard ? (
            <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>Latest: "{latestBoard.title}" · {latestReplyCount} {latestReplyCount === 1 ? "reply" : "replies"}</div>
          ) : (
            <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>No active boards.</div>
          )}
        </button>
      );
    }
    if (name === "roster") {
      const openBtnStyle = {
        fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 8,
        border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_PRIMARY,
        cursor: "pointer", fontFamily: F, flexShrink: 0,
      };
      return (
        <button key="roster" onClick={() => setView("roster")} style={{ width: "100%", textAlign: "left", background: "#fff", border: "1px solid " + BORDER_STRONG, borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer", fontFamily: F, boxShadow: "0 1px 2px rgba(17, 24, 39, 0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 18, fontWeight: 500, color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>Roster</div>
            <span style={openBtnStyle}>Open</span>
          </div>
          <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>{rosterCount} students</div>
        </button>
      );
    }
    return null;
  };

  // News banner
  const renderNewsBanner = () => {
    if (news.length === 0 && !isAdmin) return null;
    if (news.length === 0 && isAdmin) {
      // Admin sees compose box even when empty
      return (
        <div style={{ ...crd, padding: 12, marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <select value={newNewsType} onChange={e => setNewNewsType(e.target.value)} style={{ ...sel, fontSize: 12, padding: "6px 8px", width: 110 }}>
              <option value="info">Info</option>
              <option value="assignment">Assignment</option>
              <option value="alert">Alert</option>
            </select>
            <input value={newNewsText} onChange={e => setNewNewsText(e.target.value)} placeholder="Post an announcement..." style={{ ...inp, flex: 1, fontSize: 13, padding: "6px 10px" }} onKeyDown={e => e.key === "Enter" && addNews()} />
            <button onClick={addNews} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff" }}>Post</button>
          </div>
        </div>
      );
    }
    const visible = newsExpanded ? news : news.slice(0, 2);
    const more = news.length - visible.length;
    return (
      <div style={{ marginBottom: 14 }}>
        {visible.map((item, idx) => {
          const nc = newsColors[item.type] || newsColors.info;
          return (
            <div key={item.id} style={{ background: nc.bg, border: "1px solid " + nc.border, borderRadius: 12, padding: "10px 12px", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 500, color: nc.textColor, background: nc.labelBg, padding: "3px 7px", borderRadius: 5, letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0, marginTop: 2 }}>{nc.label}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "#1f2937", lineHeight: 1.45 }}>{item.text}</div>
                  <div style={{ fontSize: 10, color: nc.textColor, marginTop: 4 }}>
                    {new Date(item.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {idx === visible.length - 1 && more > 0 && !newsExpanded && (
                      <> · <span onClick={(e) => { e.stopPropagation(); setNewsExpanded(true); }} style={{ textDecoration: "underline", cursor: "pointer" }}>{more} more</span></>
                    )}
                    {idx === visible.length - 1 && newsExpanded && news.length > 2 && (
                      <> · <span onClick={(e) => { e.stopPropagation(); setNewsExpanded(false); }} style={{ textDecoration: "underline", cursor: "pointer" }}>show less</span></>
                    )}
                  </div>
                </div>
                {isAdmin && <button onClick={() => removeNews(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, fontSize: 14, lineHeight: 1, padding: "0 4px" }}>x</button>}
              </div>
            </div>
          );
        })}
        {isAdmin && (
          <div style={{ ...crd, padding: 10, marginTop: 4 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <select value={newNewsType} onChange={e => setNewNewsType(e.target.value)} style={{ ...sel, fontSize: 12, padding: "6px 8px", width: 110 }}>
                <option value="info">Info</option>
                <option value="assignment">Assignment</option>
                <option value="alert">Alert</option>
              </select>
              <input value={newNewsText} onChange={e => setNewNewsText(e.target.value)} placeholder="Post another..." style={{ ...inp, flex: 1, fontSize: 13, padding: "6px 10px" }} onKeyDown={e => e.key === "Enter" && addNews()} />
              <button onClick={addNews} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff" }}>Post</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {renderNewsBanner()}
        {cards.map(renderCard)}
        <InstructorCard data={data} setData={setData} isAdmin={isAdmin} />
      </div>
    </div>
  );
}

const TOPIC_COLORS = {
  "Gambling": "#16a34a",
  "Value": "#2563eb",
  "Athletes & Corps": "#d97706",
  "Media": "#dc2626",
  "Identity": "#7c3aed",
  "Community": "#0891b2",
  "OJ": "#dc2626",
  "Leadership": "#57534e",
  "Final Project": ACCENT,
  "Finals": TEXT_MUTED,
};

function MyNotesView({ data, setData, isAdmin, userName }) {
  const studentNotes = data.studentNotes || {};
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const saveNote = async (studentName, text) => {
    const existing = studentNotes[studentName] || { entries: [] };
    const newEntry = { id: genId(), text: text.trim(), ts: Date.now() };
    const updated = { ...data, studentNotes: { ...studentNotes, [studentName]: { ...existing, entries: [newEntry, ...existing.entries] } } };
    await saveData(updated); setData(updated);
    setEditing(false); setEditText(""); showMsg("Note saved");
  };

  const deleteNote = async (studentName, noteId) => {
    const existing = studentNotes[studentName] || { entries: [] };
    const updated = { ...data, studentNotes: { ...studentNotes, [studentName]: { ...existing, entries: existing.entries.filter(e => e.id !== noteId) } } };
    await saveData(updated); setData(updated); showMsg("Deleted");
  };

  // Admin: view all students' notes inline, sorted by last edited, all students shown
  if (isAdmin) {
    const allStudents = [...data.students]
      .filter(s => s.name !== ADMIN_NAME && s.name !== TEST_STUDENT)
      .map(s => {
        const notes = studentNotes[s.name];
        const entries = (notes && notes.entries) || [];
        const lastTs = entries.length > 0 ? Math.max(...entries.map(e => e.ts || 0)) : 0;
        return { student: s, entries, lastTs };
      })
      .sort((a, b) => {
        // Last-edited descending; students with no notes go to the bottom
        if (a.lastTs === 0 && b.lastTs === 0) return a.student.name.localeCompare(b.student.name);
        if (a.lastTs === 0) return 1;
        if (b.lastTs === 0) return -1;
        return b.lastTs - a.lastTs;
      });

    return (
      <div style={{ padding: "0 0 20px", fontFamily: F }}>
        <Toast message={msg} />
        {allStudents.map(({ student: s, entries, lastTs }) => (
          <div key={s.id} style={{ ...crd, padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: entries.length > 0 ? 10 : 0 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: TEXT_PRIMARY }}>{s.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {lastTs > 0 && <span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600 }}>Last edited {new Date(lastTs).toLocaleDateString()}</span>}
                <span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600 }}>{entries.length} note{entries.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
            {entries.length === 0 ? (
              <div style={{ fontSize: 12, color: TEXT_MUTED, fontStyle: "italic" }}>No notes yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {entries.map(entry => (
                  <div key={entry.id} style={{ padding: "10px 12px", background: "#fafafa", borderRadius: 8, border: "1px solid " + BORDER }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: TEXT_SECONDARY, fontWeight: 600 }}>{new Date(entry.ts).toLocaleDateString()}</span>
                      <button onClick={() => { if (window.confirm("Delete this note?")) deleteNote(s.name, entry.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, fontSize: 12 }}>x</button>
                    </div>
                    <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{entry.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Student view: their own notes
  const myNotes = studentNotes[userName] || { entries: [] };

  return (
    <div style={{ fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 10 }}>
        <button onClick={() => { setEditing(!editing); setEditText(""); }} style={editing ? pillActive : pillInactive}>{editing ? "Cancel" : "+ New Note"}</button>
      </div>

      <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 12 }}>Your notes are private, visible only to you and your instructor.</div>

      {editing && (
        <div style={{ ...crd, padding: 14, marginBottom: 12 }}>
          <textarea value={editText} onChange={e => setEditText(e.target.value)} placeholder="Write a note..." rows={4} style={{ ...inp, resize: "vertical", fontSize: 14, lineHeight: 1.6, marginBottom: 8 }} />
          <button onClick={() => { if (editText.trim()) saveNote(userName, editText); }} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", width: "100%" }}>Save Note</button>
        </div>
      )}

      {myNotes.entries.length === 0 && !editing && <div style={{ ...crd, padding: 20, textAlign: "center", color: TEXT_MUTED, fontSize: 14 }}>No notes yet. Click "+ New Note" to start.</div>}

      {myNotes.entries.map(entry => (
        <div key={entry.id} style={{ ...crd, padding: 14, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: TEXT_SECONDARY }}>{new Date(entry.ts).toLocaleDateString()}</span>
            <button onClick={() => { if (window.confirm("Delete this note?")) deleteNote(userName, entry.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, fontSize: 12 }}>x</button>
          </div>
          <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{entry.text}</div>
        </div>
      ))}
    </div>
  );
}

function BoardsView({ data, setData, isAdmin, userName }) {
  const boards = data.boards || [];
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [editingPost, setEditingPost] = useState(null);
  const [editText, setEditText] = useState("");
  const [viewingBoard, setViewingBoard] = useState(null);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const createBoard = async () => {
    if (!newTitle.trim() || !newPrompt.trim()) return;
    const board = { id: genId(), title: newTitle.trim(), prompt: newPrompt.trim(), posts: {}, active: true, ts: Date.now() };
    const updated = { ...data, boards: [...boards, board] };
    await saveData(updated); setData(updated);
    setNewTitle(""); setNewPrompt(""); setCreating(false); showMsg("Board created");
  };

  const submitPost = async (boardId, text) => {
    if (!text.trim()) return;
    const updated = { ...data, boards: boards.map(b => b.id === boardId ? { ...b, posts: { ...b.posts, [userName]: { text: text.trim(), ts: Date.now() } } } : b) };
    await saveData(updated); setData(updated); showMsg("Posted");
  };

  const closeBoard = async (boardId) => {
    const updated = { ...data, boards: boards.map(b => b.id === boardId ? { ...b, active: false } : b) };
    await saveData(updated); setData(updated); showMsg("Board closed");
  };

  const deleteBoard = async (boardId) => {
    const updated = { ...data, boards: boards.filter(b => b.id !== boardId) };
    await saveData(updated); setData(updated); showMsg("Deleted"); if (viewingBoard === boardId) setViewingBoard(null);
  };

  const linkify = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => urlRegex.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: "#2563eb", textDecoration: "none", wordBreak: "break-all" }}>{part}</a>
      : part
    );
  };

  const snap = async (boardId, postAuthor) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    const post = (board.posts || {})[postAuthor];
    if (!post) return;
    const snaps = post.snaps || [];
    if (snaps.includes(userName)) return;
    const updatedPost = { ...post, snaps: [...snaps, userName] };
    const updated = { ...data, boards: boards.map(b => b.id === boardId ? { ...b, posts: { ...b.posts, [postAuthor]: updatedPost } } : b) };
    await saveData(updated); setData(updated);
  };

  const featurePost = async (boardId, postAuthor) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    const post = (board.posts || {})[postAuthor];
    if (!post || post.featured) return;
    const updatedPost = { ...post, featured: true };
    const student = data.students.find(s => s.name === postAuthor);
    let updatedData = { ...data, boards: boards.map(b => b.id === boardId ? { ...b, posts: { ...b.posts, [postAuthor]: updatedPost } } : b) };
    if (student) {
      const entry = { id: genId(), studentId: student.id, amount: 5, source: "Featured Post", ts: Date.now() };
      updatedData = { ...updatedData, log: [...updatedData.log, entry] };
    }
    await saveData(updatedData); setData(updatedData); showMsg("Featured! +5 pts to " + postAuthor);
  };

  const deletePost = async (boardId, postAuthor) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    const newPosts = { ...board.posts };
    delete newPosts[postAuthor];
    const updated = { ...data, boards: boards.map(b => b.id === boardId ? { ...b, posts: newPosts } : b) };
    await saveData(updated); setData(updated); showMsg("Post deleted");
  };

  const archivePost = async (boardId, postAuthor) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    const post = (board.posts || {})[postAuthor];
    if (!post) return;
    const updatedPost = { ...post, archived: true };
    const updated = { ...data, boards: boards.map(b => b.id === boardId ? { ...b, posts: { ...b.posts, [postAuthor]: updatedPost } } : b) };
    await saveData(updated); setData(updated); showMsg("Archived");
  };

  const unarchivePost = async (boardId, postAuthor) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    const post = (board.posts || {})[postAuthor];
    if (!post) return;
    const updatedPost = { ...post, archived: false };
    const updated = { ...data, boards: boards.map(b => b.id === boardId ? { ...b, posts: { ...b.posts, [postAuthor]: updatedPost } } : b) };
    await saveData(updated); setData(updated); showMsg("Restored");
  };

  const archiveBoard = async (boardId) => {
    const updated = { ...data, boards: boards.map(b => b.id === boardId ? { ...b, active: false, archived: true } : b) };
    await saveData(updated); setData(updated); showMsg("Board archived");
  };

  // Board detail view
  if (viewingBoard) {
    const board = boards.find(b => b.id === viewingBoard);
    if (!board) { setViewingBoard(null); return null; }
    const posts = board.posts || {};
    const allPostList = Object.entries(posts).sort((a, b) => a[1].ts - b[1].ts);
    const postList = allPostList.filter(([_, p]) => !p.archived);
    const archivedPostList = allPostList.filter(([_, p]) => p.archived);
    const myPost = posts[userName];
    const myPostVisible = myPost && !myPost.archived;
    const isEditing = editingPost === board.id;

    return (
      <div style={{ padding: "24px 20px 40px", fontFamily: F }}>
        <Toast message={msg} />
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <button onClick={() => { setViewingBoard(null); setEditingPost(null); }} style={{ ...pillInactive, marginBottom: 16 }}>Back to Boards</button>
          <div style={{ ...crd, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>{board.title}</div>
            <div style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.5 }}>{board.prompt}</div>
            <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 8 }}>{postList.length} response{postList.length !== 1 ? "s" : ""}</div>
            {isAdmin && (
              <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                <button onClick={() => closeBoard(board.id)} style={pillInactive}>{board.active ? "Close" : "Closed"}</button>
                <button onClick={() => archiveBoard(board.id)} style={pillInactive}>Archive</button>
                <button onClick={() => { if (window.confirm("Delete this board and all responses?")) deleteBoard(board.id); }} style={{ ...pill, background: "#fef2f2", color: RED }}>Delete</button>
              </div>
            )}
          </div>

          {board.active && (
            <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
              {isEditing || !myPostVisible ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase" }}>{myPostVisible ? "Edit Your Response" : "Your Response"}</div>
                  <textarea value={editText} onChange={e => setEditText(e.target.value)} placeholder="Write your response..." rows={4} style={{ ...inp, resize: "vertical", fontSize: 14, lineHeight: 1.6 }} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => { submitPost(board.id, editText); setEditingPost(null); }} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", flex: 1 }}>
                      {myPostVisible ? "Save Changes" : "Post"}
                    </button>
                    {myPostVisible && <button onClick={() => { setEditingPost(null); setEditText(""); }} style={pillInactive}>Cancel</button>}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 6 }}>Your Response</div>
                  <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{linkify(myPost.text)}</div>
                  <button onClick={() => { setEditingPost(board.id); setEditText(myPost.text); }} style={{ ...pillInactive, marginTop: 8, fontSize: 12 }}>Edit</button>
                </div>
              )}
            </div>
          )}

          {postList.length === 0 && <div style={{ ...crd, padding: 20, textAlign: "center", color: TEXT_MUTED, fontSize: 14 }}>No responses yet</div>}
          {postList.map(([name, post]) => {
            const snaps = post.snaps || [];
            const hasSnapped = snaps.includes(userName);
            const snapCount = snaps.length;
            return (
              <div key={name} style={{ ...crd, padding: 14, marginBottom: 8, border: name === userName ? "2px solid " + ACCENT : "1px solid " + BORDER }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>{name}{name === userName ? " (you)" : ""}</span>
                  <span style={{ fontSize: 11, color: TEXT_SECONDARY }}>{new Date(post.ts).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{linkify(post.text)}</div>
                {post.featured && <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: "#d97706", background: "#fffbeb", padding: "2px 8px", borderRadius: 6, marginTop: 6 }}>Featured</div>}
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  {name !== userName && (
                    <button onClick={() => snap(board.id, name)} disabled={hasSnapped} style={{ background: hasSnapped ? "#f4f4f5" : "transparent", border: "1px solid " + (hasSnapped ? "#e4e4e7" : BORDER), borderRadius: 8, padding: "4px 10px", cursor: hasSnapped ? "default" : "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: hasSnapped ? TEXT_MUTED : TEXT_PRIMARY, fontFamily: F, fontWeight: 600, transition: "all 0.15s" }}>
                      <span style={{ fontSize: 15 }}>&#x1F44F;</span>
                      {snapCount > 0 && <span>{snapCount}</span>}
                    </button>
                  )}
                  {isAdmin && !post.featured && <button onClick={() => featurePost(board.id, name)} style={{ ...pillInactive, fontSize: 11, padding: "4px 10px" }}>Feature (+5 pts)</button>}
                  {isAdmin && <button onClick={() => archivePost(board.id, name)} style={{ ...pillInactive, fontSize: 11, padding: "4px 10px" }}>Archive</button>}
                  {isAdmin && <button onClick={() => { if (window.confirm("Delete " + name + "'s post?")) deletePost(board.id, name); }} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11, padding: "4px 10px" }}>Delete</button>}
                  {name === userName && snapCount > 0 && <span style={{ fontSize: 12, color: TEXT_MUTED }}>{snapCount} snap{snapCount !== 1 ? "s" : ""}</span>}
                </div>
              </div>
            );
          })}

          {isAdmin && archivedPostList.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ ...sectionLabel, marginBottom: 8 }}>Archived Posts ({archivedPostList.length})</div>
              {archivedPostList.map(([name, post]) => (
                <div key={name} style={{ ...crd, padding: 12, marginBottom: 6, opacity: 0.6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>{name}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => unarchivePost(board.id, name)} style={{ ...pillInactive, fontSize: 11, padding: "3px 8px" }}>Restore</button>
                      <button onClick={() => { if (window.confirm("Permanently delete?")) deletePost(board.id, name); }} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11, padding: "3px 8px" }}>Delete</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.4 }}>{post.text.length > 100 ? post.text.slice(0, 100) + "..." : post.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const activeBoards = boards.filter(b => b.active && !b.archived);
  const archivedBoards = boards.filter(b => b.archived);
  const closedBoards = boards.filter(b => !b.active && !b.archived);

  return (
    <div style={{ padding: "24px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ ...sectionLabel }}>Discussion Boards</div>
          {isAdmin && <button onClick={() => setCreating(!creating)} style={creating ? pillActive : pillInactive}>{creating ? "Cancel" : "+ New Board"}</button>}
        </div>

        {isAdmin && creating && (
          <div style={{ ...crd, padding: 18, marginBottom: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Board title (e.g. Week 1 Discussion)" style={{ ...inp, fontWeight: 700, fontSize: 16 }} />
              <textarea value={newPrompt} onChange={e => setNewPrompt(e.target.value)} placeholder="Prompt or question for students" rows={3} style={{ ...inp, resize: "vertical", fontSize: 14 }} />
              <button onClick={createBoard} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", padding: "12px 0" }}>Create Board</button>
            </div>
          </div>
        )}

        {activeBoards.length === 0 && !creating && <div style={{ ...crd, padding: 24, textAlign: "center", color: TEXT_MUTED, fontSize: 14 }}>No active boards</div>}
        {activeBoards.map(board => {
          const postCount = Object.keys(board.posts || {}).length;
          const myPost = (board.posts || {})[userName];
          return (
            <div key={board.id} onClick={() => { setViewingBoard(board.id); if (!myPost) setEditText(""); }} style={{ ...crd, padding: 14, marginBottom: 8, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY, lineHeight: 1.3, flex: 1, minWidth: 0 }}>{board.title}</div>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 5, background: "#ecfdf5", color: "#047857", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>Active</span>
              </div>
              <div style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.4, marginBottom: 6 }}>{board.prompt.length > 120 ? board.prompt.slice(0, 120) + "..." : board.prompt}</div>
              <div style={{ display: "flex", gap: 10, fontSize: 11, color: TEXT_MUTED }}>
                <span>{postCount} {postCount === 1 ? "reply" : "replies"}</span>
                {myPost && <><span>·</span><span style={{ color: GREEN, fontWeight: 500 }}>You responded</span></>}
                {!myPost && <><span>·</span><span style={{ color: ACCENT, fontWeight: 500 }}>Not yet responded</span></>}
              </div>
            </div>
          );
        })}

        {closedBoards.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ ...sectionLabel, marginBottom: 10 }}>Closed Boards</div>
            {closedBoards.map(board => {
              const postCount = Object.keys(board.posts || {}).length;
              return (
                <div key={board.id} style={{ ...crd, padding: 14, marginBottom: 8, opacity: 0.7, cursor: "pointer" }} onClick={() => setViewingBoard(board.id)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{board.title}</div>
                      <div style={{ fontSize: 12, color: TEXT_MUTED }}>{postCount} responses</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {isAdmin && <button onClick={e => { e.stopPropagation(); archiveBoard(board.id); }} style={{ ...pillInactive, fontSize: 11 }}>Archive</button>}
                      {isAdmin && <button onClick={e => { e.stopPropagation(); if (window.confirm("Delete?")) deleteBoard(board.id); }} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11 }}>Delete</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isAdmin && archivedBoards.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ ...sectionLabel, marginBottom: 10 }}>Archived Boards</div>
            {archivedBoards.map(board => {
              const postCount = Object.keys(board.posts || {}).length;
              return (
                <div key={board.id} style={{ ...crd, padding: 14, marginBottom: 8, opacity: 0.5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{board.title}</div>
                      <div style={{ fontSize: 12, color: TEXT_MUTED }}>{postCount} responses</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setViewingBoard(board.id)} style={{ ...pillInactive, fontSize: 11 }}>View</button>
                      <button onClick={() => { if (window.confirm("Permanently delete?")) deleteBoard(board.id); }} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11 }}>Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* --- MAIN EXPORT --- */
function GameReviewDetail({ activity, type, week, data, studentId, onBack }) {
  const qs = activity.questions || [];
  const responses = activity.responses || {};
  const allStudents = (data.students || []).filter(s => s.name !== "Andrew Ishak" && s.name !== "Bruce Willis");
  const playedStudents = allStudents.filter(s => {
    return qs.some((_, qi) => responses[s.id + "-" + qi] !== undefined);
  });
  const totalPlayers = playedStudents.length;
  const letters = ["A", "B", "C", "D", "E", "F"];

  return (
    <div style={{ ...crd, padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase" }}>{type === "game" ? "Weekly Game" : "This or That"}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY }}>Week {week}</div>
        </div>
        <button onClick={onBack} style={pillInactive}>Close</button>
      </div>
      {qs.map((q, qi) => {
        const myAnswer = responses[studentId + "-" + qi];
        const correctIdx = q.correct;
        // Compute % per option
        const counts = (q.options || []).map(() => 0);
        let totalAnswered = 0;
        playedStudents.forEach(s => {
          const ans = responses[s.id + "-" + qi];
          if (ans !== undefined && ans !== null && counts[ans] !== undefined) {
            counts[ans]++;
            totalAnswered++;
          }
        });
        return (
          <div key={qi} style={{ padding: 14, marginBottom: 10, background: "#fafafa", borderRadius: 10, border: "1px solid " + BORDER }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: ACCENT + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: ACCENT, flexShrink: 0 }}>{qi + 1}</div>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.4 }}>{q.text || q.prompt || "(no text)"}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(q.options || []).map((opt, oi) => {
                const isCorrect = oi === correctIdx;
                const isMine = oi === myAnswer;
                const pct = totalAnswered > 0 ? Math.round(counts[oi] / totalAnswered * 100) : 0;
                let bg = "#fff";
                let borderColor = BORDER;
                let textColor = TEXT_PRIMARY;
                if (isCorrect) { bg = "#ecfdf5"; borderColor = GREEN; textColor = "#065f46"; }
                if (isMine && !isCorrect) { bg = "#fef2f2"; borderColor = RED; textColor = "#991b1b"; }
                return (
                  <div key={oi} style={{ position: "relative", padding: "10px 14px", borderRadius: 8, background: bg, border: "2px solid " + borderColor, overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: pct + "%", background: isCorrect ? "rgba(16,185,129,0.1)" : isMine && !isCorrect ? "rgba(220,38,38,0.1)" : "rgba(0,0,0,0.04)", transition: "width 0.3s" }} />
                    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: textColor, minWidth: 16 }}>{letters[oi]}.</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: textColor, flex: 1 }}>{opt}</span>
                      {isMine && <span style={{ fontSize: 10, fontWeight: 700, color: textColor, padding: "2px 6px", borderRadius: 4, background: "rgba(0,0,0,0.05)" }}>YOU</span>}
                      {isCorrect && <span style={{ fontSize: 10, fontWeight: 700, color: "#065f46", padding: "2px 6px", borderRadius: 4, background: GREEN + "30" }}>CORRECT</span>}
                      <span style={{ fontSize: 12, fontWeight: 700, color: textColor }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {myAnswer === undefined && <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 6, fontStyle: "italic" }}>You did not answer this question</div>}
          </div>
        );
      })}
    </div>
  );
}

function PastGamesReview({ data, studentId, filter }) {
  const [openKey, setOpenKey] = useState(null);
  const games = data.weeklyGames || {};
  const tots = data.weeklyToT || {};

  const items = [];
  if (filter !== "tot") {
    Object.keys(games).forEach(w => {
      const g = games[w];
      if (!g?.scored) return;
      const responses = g.responses || {};
      const played = (g.questions || []).some((_, qi) => responses[studentId + "-" + qi] !== undefined);
      items.push({ type: "game", week: w, label: "Weekly Game / Week " + w, activity: g, played });
    });
  }
  if (filter !== "game") {
    Object.keys(tots).forEach(w => {
      const t = tots[w];
      if (!t?.scored) return;
      const responses = t.responses || {};
      const played = (t.questions || []).some((_, qi) => responses[studentId + "-" + qi] !== undefined);
      items.push({ type: "tot", week: w, label: "This or That / Week " + w, activity: t, played });
    });
  }

  // Sort by week descending
  items.sort((a, b) => parseInt(b.week) - parseInt(a.week));

  if (items.length === 0) return <div style={{ ...crd, padding: 20, textAlign: "center", color: TEXT_MUTED, fontSize: 14 }}>No past {filter === "tot" ? "This or That activities" : filter === "game" ? "weekly games" : "games"} yet</div>;

  return (
    <div>
      {items.map((item) => {
        const key = item.type + "-" + item.week;
        const isOpen = openKey === key;
        if (isOpen) {
          return <GameReviewDetail key={key} activity={item.activity} type={item.type} week={item.week} data={data} studentId={studentId} onBack={() => setOpenKey(null)} />;
        }
        return (
          <button key={key} onClick={() => item.played && setOpenKey(key)} disabled={!item.played} style={{
            ...crd, padding: 14, marginBottom: 8, width: "100%", textAlign: "left", fontFamily: F,
            cursor: item.played ? "pointer" : "not-allowed", opacity: item.played ? 1 : 0.5,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase" }}>{item.type === "game" ? "Weekly Game" : "This or That"}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>Week {item.week}</div>
            </div>
            {item.played ? (
              <span style={{ fontSize: 12, color: ACCENT, fontWeight: 600 }}>Review &rarr;</span>
            ) : (
              <span style={{ fontSize: 11, color: TEXT_MUTED, fontStyle: "italic" }}>You did not play</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ActivitiesView({ data, setData, isAdmin, userName }) {
  const student = data.students.find(s => s.name === userName);
  const studentId = student?.id;
  const [openEventKey, setOpenEventKey] = useState(null);
  const [showAdminTools, setShowAdminTools] = useState(false);

  // Detect what's live
  // GameSystem signals live state with phase: "live" + active: true.
  // phase: "done" means closed (with or without scoring).
  const isSlotLive = (slot) => !!(slot && slot.phase === "live");
  const liveGameWeeks = Object.keys(data?.weeklyGames || {}).filter(w => isSlotLive(data.weeklyGames[w]));
  const liveToTWeeks = Object.keys(data?.weeklyToT || {}).filter(w => isSlotLive(data.weeklyToT[w]));
  const liveItems = [];
  if (liveGameWeeks.length > 0) liveItems.push({ id: "weekly-game", label: "Weekly Game", anchor: "live-now-section" });
  if (liveToTWeeks.length > 0) liveItems.push({ id: "tot", label: "This or That", anchor: "live-now-section" });
  const liveHeadlineSession = (data?.headlines?.sessions || []).find(s => s.activeHeadlineId && s.phase !== "done");
  if (liveHeadlineSession) liveItems.push({ id: "headlines", label: "Headlines", anchor: "live-now-section" });
  const openSurveys = (data?.surveys || []).filter(s => s.active);
  if (openSurveys.length > 0) liveItems.push({ id: "surveys", label: openSurveys.length === 1 ? "Survey" : openSurveys.length + " Surveys", anchor: "live-now-section" });
  const anythingLive = liveItems.length > 0;

  // Default: when something is live, hide the past events list; show a "See past events" toggle
  const [showPast, setShowPast] = useState(!anythingLive);

  // Build unified event list (reverse chronological)
  const rebounds = data.rebounds || {};
  const events = [];

  Object.keys(data.weeklyGames || {}).forEach(w => {
    const g = data.weeklyGames[w];
    if (!g) return;
    // Past = either scored, or closed (phase === "done"). Skip live and pre-launch slots.
    const isPast = g.scored || g.phase === "done";
    if (!isPast) return;
    const ts = (rebounds["game-" + w]?.scoredTs) || 0;
    const responses = g.responses || {};
    const played = (g.questions || []).some((_, qi) => responses[studentId + "-" + qi] !== undefined);
    events.push({ key: "game-" + w, type: "game", typeLabel: "Weekly Game", ts, week: w, activity: g, played });
  });

  Object.keys(data.weeklyToT || {}).forEach(w => {
    const t = data.weeklyToT[w];
    if (!t) return;
    const isPast = t.scored || t.phase === "done";
    if (!isPast) return;
    const ts = (rebounds["tot-" + w]?.scoredTs) || 0;
    const responses = t.responses || {};
    const played = (t.questions || []).some((_, qi) => responses[studentId + "-" + qi] !== undefined);
    events.push({ key: "tot-" + w, type: "tot", typeLabel: "This or That", ts, week: w, activity: t, played });
  });

  const headlineSessions = data?.headlines?.sessions || [];
  const headlineItems = data?.headlines?.items || [];
  headlineSessions.forEach(s => {
    if (s.activeHeadlineId && s.phase !== "done") return; // skip live ones (shown in live section above)
    const sessionHeadlines = headlineItems.filter(it => it.sessionId === s.id);
    if (sessionHeadlines.length === 0) return;
    events.push({ key: "headlines-" + s.id, type: "headlines", typeLabel: "Headlines", ts: s.ts || 0, session: s, sessionHeadlines });
  });

  (data?.surveys || []).forEach(s => {
    if (s.active) return;
    events.push({ key: "survey-" + s.id, type: "survey", typeLabel: "Survey", ts: s.ts || 0, survey: s });
  });

  events.sort((a, b) => (b.ts || 0) - (a.ts || 0));

  // Format ts as "Wed, Apr 23"
  const fmtDayDate = (ts) => {
    if (!ts) return "Date unknown";
    return new Date(ts).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const scrollToLive = () => {
    const el = document.getElementById("live-now-section");
    scrollToWithOffset(el);
  };

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Live banner */}
        {anythingLive && (
          <div style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: 14, padding: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN, animation: "livePulse 1.6s ease-in-out infinite", display: "inline-block" }} />
                <div style={{ fontSize: 18, fontWeight: 500, color: "#065f46", letterSpacing: "-0.01em" }}>Live now</div>
              </div>
              <div style={{ fontSize: 13, color: "#047857", fontWeight: 500 }}>
                {liveItems.map(i => i.label).join(", ")}
              </div>
            </div>
            <button onClick={scrollToLive} style={{ fontSize: 11, padding: "5px 12px", borderRadius: 8, border: "1px solid #6ee7b7", background: "#fff", color: "#065f46", cursor: "pointer", fontFamily: F, fontWeight: 500 }}>Open</button>
          </div>
        )}

        {/* Currently Live section: always render StudentAnswerView so students can play whenever a live game/ToT is open. The component handles its own empty state. */}
        <div id="live-now-section" style={{ marginBottom: anythingLive ? 32 : 24 }}>
          <StudentAnswerView data={data} setData={setData} userName={userName} />
          {liveHeadlineSession && (
            <div style={{ marginTop: 20 }}>
              <ClassTools data={data} setData={setData} isAdmin={isAdmin} userName={userName} />
            </div>
          )}
          {openSurveys.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <SurveyView data={data} setData={setData} isAdmin={isAdmin} userName={userName} />
            </div>
          )}
        </div>

        {/* Past events list */}
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => setShowPast(!showPast)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: F }}>
            <div style={sectionLabel}>{anythingLive ? "Past events" : "Live"}</div>
            <span style={{ fontSize: 11, color: TEXT_MUTED }}>{showPast ? "Hide" : "Show"}</span>
          </button>
          {isAdmin && (
            <button onClick={() => setShowAdminTools(!showAdminTools)} style={linkPill}>
              {showAdminTools ? "Hide admin tools" : "Admin tools"}
            </button>
          )}
        </div>

        {showPast && events.length === 0 && <div style={{ ...crd, padding: 20, textAlign: "center", color: TEXT_MUTED, fontSize: 13 }}>No past events yet</div>}

        {showPast && events.map(ev => {
          const isOpen = openEventKey === ev.key;
          const cantOpen = (ev.type === "game" || ev.type === "tot") && !ev.played;
          // Compute student's score for this game/ToT from the log
          let scoreDisplay = null;
          if ((ev.type === "game" || ev.type === "tot") && ev.played && studentId) {
            const src = (ev.type === "game" ? "Game Wk" : "ToT Wk") + ev.week;
            const earned = (data.log || []).filter(e => e.studentId === studentId && e.source === src).reduce((s, e) => s + e.amount, 0);
            const totalQ = (ev.activity?.questions || []).length;
            const outOf = ev.type === "game" ? totalQ * 10 : totalQ * 10; // both score 10 per Q
            const pct = outOf > 0 ? Math.round((earned / outOf) * 100) : 0;
            const sc = pct >= 90 ? GREEN : pct >= 80 ? TEXT_PRIMARY : pct >= 70 ? AMBER : RED;
            scoreDisplay = { earned, outOf, pct, color: sc };
          }
          return (
            <div key={ev.key} style={{ marginBottom: 8 }}>
              <button onClick={() => { if (!cantOpen) setOpenEventKey(isOpen ? null : ev.key); }} disabled={cantOpen} style={{
                background: "#fff", border: "1px solid " + BORDER_STRONG, borderRadius: 14,
                padding: 14, width: "100%", textAlign: "left", fontFamily: F,
                cursor: cantOpen ? "not-allowed" : "pointer",
                opacity: cantOpen ? 0.55 : 1,
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 500, color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>{ev.typeLabel}</div>
                  <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>{fmtDayDate(ev.ts)}</div>
                </div>
                {scoreDisplay && (
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 500, color: scoreDisplay.color, lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>{scoreDisplay.earned}</div>
                    <div style={{ fontSize: 9, color: TEXT_MUTED, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>/ {scoreDisplay.outOf}</div>
                  </div>
                )}
                <div style={{ flexShrink: 0 }}>
                  {cantOpen ? (
                    <span style={{ fontSize: 11, color: TEXT_MUTED, fontStyle: "italic" }}>You did not play</span>
                  ) : (
                    <span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 500 }}>{isOpen ? "Close" : "Open ›"}</span>
                  )}
                </div>
              </button>

              {isOpen && (ev.type === "game" || ev.type === "tot") && (
                <div style={{ marginTop: 8 }}>
                  <GameReviewDetail activity={ev.activity} type={ev.type} week={ev.week} data={data} studentId={studentId} onBack={() => setOpenEventKey(null)} />
                </div>
              )}

              {isOpen && ev.type === "headlines" && (
                <div style={{ ...crd, padding: 14, marginTop: 8 }}>
                  {ev.sessionHeadlines.length === 0 ? (
                    <div style={{ fontSize: 13, color: TEXT_MUTED, fontStyle: "italic" }}>No headlines were used in this session.</div>
                  ) : ev.sessionHeadlines.map(h => (
                    <div key={h.id} style={{ padding: "10px 0", borderBottom: "1px solid " + BORDER }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ flex: 1, fontSize: 14, color: TEXT_PRIMARY, fontWeight: 600, lineHeight: 1.4 }}>{h.text}</div>
                        {h.url && <a href={h.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#2563eb", textDecoration: "none", flexShrink: 0 }}>Source</a>}
                      </div>
                      {(h.realCategories || []).length > 0 && (
                        <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 4 }}>
                          <span style={{ fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.08em" }}>Surface: </span>
                          {(h.realCategories || []).join(", ")}
                        </div>
                      )}
                      {(h.realConcepts || []).length > 0 && (
                        <div style={{ fontSize: 12, color: ACCENT, fontWeight: 700, marginTop: 2 }}>
                          <span style={{ fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.08em" }}>Concept: </span>
                          {(h.realConcepts || []).map(id => (data?.headlines?.concepts || []).find(c => c.id === id)?.name || id).join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {isOpen && ev.type === "survey" && (
                <div style={{ ...crd, padding: 14, marginTop: 8 }}>
                  <ClosedSurveyDetail survey={ev.survey} data={data} userName={userName} isAdmin={isAdmin} />
                </div>
              )}
            </div>
          );
        })}

        {/* Admin tools (admin only, toggleable) */}
        {isAdmin && showAdminTools && (
          <div style={{ marginTop: 32, paddingTop: 16, borderTop: "2px dashed " + BORDER_STRONG }}>
            <div style={{ ...sectionLabel, marginBottom: 10 }}>Admin Tools</div>
            <div style={{ marginBottom: 24 }}>
              <ClassTools data={data} setData={setData} isAdmin={isAdmin} userName={userName} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <SurveyView data={data} setData={setData} isAdmin={isAdmin} userName={userName} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function ClosedSurveyDetail({ survey, data, userName, isAdmin }) {
  const sid = data.students.find(s => s.name === userName)?.id;
  const myResp = sid ? (survey.responses || {})[sid] : null;
  const showAggregate = isAdmin || survey.showResults;
  const responses = survey.responses || {};
  const totalResponded = Object.keys(responses).length;

  return (
    <div>
      {(survey.questions || []).map((q, qi) => {
        const myAnswer = myResp ? myResp[q.id] : null;
        // Aggregate by option for multiple_choice / true_false / likert
        let aggregate = null;
        if (showAggregate && (q.type === "multiple_choice" || q.type === "true_false" || q.type === "likert")) {
          const counts = {};
          Object.values(responses).forEach(r => {
            const v = r[q.id];
            if (v === undefined || v === null || v === "") return;
            counts[v] = (counts[v] || 0) + 1;
          });
          const total = Object.values(counts).reduce((s, n) => s + n, 0);
          aggregate = { counts, total };
        }
        const opts = q.type === "true_false" ? ["True", "False"] : q.type === "likert" ? ["1", "2", "3", "4", "5"] : (q.options || []);
        return (
          <div key={q.id} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: qi < survey.questions.length - 1 ? "1px solid " + BORDER : "none" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 8 }}>{qi + 1}. {q.text}</div>

            {q.type === "short_answer" || q.type === "number" ? (
              <div>
                {myAnswer && <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}><span style={{ fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", fontSize: 10 }}>Your answer: </span>{myAnswer}</div>}
                {showAggregate && (
                  <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>{Object.keys(responses).filter(k => responses[k][q.id]).length} responded</div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {opts.map(opt => {
                  const isMine = myAnswer == opt;
                  const cnt = aggregate ? (aggregate.counts[opt] || 0) : 0;
                  const pct = aggregate && aggregate.total > 0 ? Math.round((cnt / aggregate.total) * 100) : 0;
                  return (
                    <div key={opt} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", borderRadius: 8, background: isMine ? ACCENT + "0d" : "transparent" }}>
                      <span style={{ fontSize: 13, color: TEXT_PRIMARY, fontWeight: isMine ? 700 : 500, flex: 1 }}>{opt}{isMine && <span style={{ fontSize: 9, fontWeight: 800, color: ACCENT, background: ACCENT + "1a", padding: "1px 5px", borderRadius: 4, marginLeft: 6 }}>YOU</span>}</span>
                      {aggregate && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <div style={{ width: 60, height: 6, borderRadius: 3, background: "#f3f4f6", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: pct + "%", background: ACCENT, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: TEXT_SECONDARY, width: 32, textAlign: "right" }}>{pct}%</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                {!myAnswer && !showAggregate && <div style={{ fontSize: 12, color: TEXT_MUTED, fontStyle: "italic" }}>You did not respond</div>}
                {showAggregate && <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>{aggregate?.total || 0} responses</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── MORE ─── */
function MoreView({ data, setData, isAdmin, userName }) {
  const me = data?.students.find(s => s.name === userName);
  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Your info */}
        {me && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ ...sectionLabel, marginBottom: 10 }}>Your Info</div>
            <BioView student={me} data={data} setData={setData} userName={userName} onBack={null} />
          </div>
        )}

        {/* Class roster */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ ...sectionLabel, marginBottom: 10 }}>Class Roster</div>
          <RosterView data={data} setData={setData} userName={userName} />
        </div>

        {/* Media */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ ...sectionLabel, marginBottom: 10 }}>Media</div>
          <MediaView data={data} setData={setData} isAdmin={isAdmin} />
        </div>

        {/* Discussion Boards */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ ...sectionLabel, marginBottom: 10 }}>Discussion Boards</div>
          <BoardsView data={data} setData={setData} isAdmin={isAdmin} userName={userName} />
        </div>

        {/* My Notes */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ ...sectionLabel, marginBottom: 10 }}>My Notes</div>
          <MyNotesView data={data} setData={setData} isAdmin={isAdmin} userName={userName} />
        </div>

      </div>
    </div>
  );
}

export default function Comm2() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, _setView] = useState("home");

  const setView = useCallback((next) => {
    _setView(prev => {
      if (prev === next) return prev;
      try { window.history.pushState({ view: next }, "", "#" + next); } catch(e) {}
      return next;
    });
  }, []);

  useEffect(() => {
    const onPop = (e) => {
      const v = (e.state && e.state.view) || (window.location.hash || "").replace(/^#/, "") || "home";
      _setView(v);
    };
    window.addEventListener("popstate", onPop);
    try {
      const hash = (window.location.hash || "").replace(/^#/, "");
      if (hash) _setView(hash);
      window.history.replaceState({ view: hash || "home" }, "", "#" + (hash || "home"));
    } catch(e) {}
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const handler = (e) => setView(e.detail);
    window.addEventListener("nav", handler);
    return () => window.removeEventListener("nav", handler);
  }, [setView]);
  const [userName, setUserName] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY + "-user"); } catch(e) { return null; }
  });

  const isAdmin = userName === ADMIN_NAME;
  const isGuest = userName === GUEST_NAME;
  const displayName = isGuest ? "Guest" : userName;
  const [studentView, setStudentView] = useState(false);
  const [testStudent, setTestStudent] = useState(null);
  const effectiveUserName = testStudent || userName;
  const effectiveAdmin = isAdmin && !studentView && !testStudent;
  const visibleStudents = data ? data.students.filter(s => effectiveAdmin || testStudent || s.name !== TEST_STUDENT) : [];

  const refresh = useCallback(async () => { try { const d = await loadData(); if (d) setData(d); } catch(e) { console.error(e); } }, []);

  useEffect(() => {
    (async () => {
      try {
        let d = await loadData();
        if (!d) {
          await new Promise(r => setTimeout(r, 2000));
          d = await loadData();
        }
        if (!d) {
          console.error("loadData returned null. Refusing to create fresh data to protect existing data.");
          setLoading(false);
          return;
        }
        // Migrations
        if (d && !d.schedule) { d.schedule = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)); await saveData(d); }
        if (d && !d.assignments) { d.assignments = JSON.parse(JSON.stringify(DEFAULT_ASSIGNMENTS)); await saveData(d); }
        if (d && !d.grades) { d.grades = {}; await saveData(d); }
        if (d && !d.participation) { d.participation = {}; await saveData(d); }
        if (d && !d.weeklyGames) { d.weeklyGames = {}; await saveData(d); }
        if (d && !d.weeklyToT) { d.weeklyToT = {}; await saveData(d); }
        if (d && !d.weeklyFishbowl) { d.weeklyFishbowl = {}; await saveData(d); }
        if (d && !d.fishbowlStars) { d.fishbowlStars = {}; await saveData(d); }
        if (d && !d.todoChecks) { d.todoChecks = {}; await saveData(d); }
        if (d && !d.videoSubmissions) { d.videoSubmissions = {}; await saveData(d); }
        if (d && !d.media) { d.media = []; await saveData(d); }
        if (d && !d.surveys) { d.surveys = []; await saveData(d); }
        if (d && !d.boards) { d.boards = []; await saveData(d); }
        if (d && !d.news) { d.news = []; await saveData(d); }
        if (d && !d.messages) { d.messages = []; await saveData(d); }
        if (d && !d.studentNotes) { d.studentNotes = {}; await saveData(d); }
        if (d && !d.rebounds) { d.rebounds = {}; await saveData(d); }
        if (d && !d.reboundGrades) { d.reboundGrades = {}; await saveData(d); }
        // Rebound system V2 migration: strip leftover gradeOnly log entries from old system
        if (d && !d._reboundSystemV2) {
          const beforeCount = (d.log || []).length;
          d.log = (d.log || []).filter(e => !e.gradeOnly);
          const stripped = beforeCount - d.log.length;
          if (stripped > 0) console.log("Rebound V2 migration: stripped " + stripped + " gradeOnly log entries");
          d._reboundSystemV2 = true;
          await saveData(d);
        }
        if (d && !d.submissions) { d.submissions = {}; await saveData(d); }
        // Migration: backfill dueTime "11:59 PM" on assignments with a due date but no dueTime
        if (d && d.assignments && !d._dueTimeMigV1) {
          let changed = false;
          d.assignments = d.assignments.map(a => {
            if (a.due && !a.dueTime) { changed = true; return { ...a, dueTime: "11:59 PM" }; }
            return a;
          });
          d._dueTimeMigV1 = true;
          if (changed) await saveData(d);
        }
        if (d && !d.students.find(s => s.name === TEST_STUDENT)) {
          const tsId = genId();
          d.students.push({ id: tsId, name: TEST_STUDENT, teamId: d.teams?.[0]?.id || "" });
          d.pins[tsId] = "118711";
          await saveData(d);
        }
        if (d && !d.bios) { d.bios = {}; await saveData(d); }
        if (d && !d.adminLinks) { d.adminLinks = []; await saveData(d); }
        if (d && !d.pins) { const pins = {}; d.students.forEach(s => { pins[s.id] = String(Math.floor(100000 + Math.random() * 900000)); }); d.pins = pins; await saveData(d); }
        setData(d);
      } catch(e) { console.error("Init error:", e); }
      setLoading(false);
    })();
  }, []);

  // Real-time polling
  useEffect(() => {
    if (!data) return;
    const iv = setInterval(refresh, 5000);
    return () => clearInterval(iv);
  }, [data, refresh]);

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, color: TEXT_MUTED }}>Loading...</div>;
  if (!userName) return <NamePicker data={data} onSelect={setUserName} />;

  const students = data.students || [];
  const log = data.log || [];

  // Detect anything live (drives green dot in nav)
  const isLiveSlot = (slot) => !!(slot && slot.phase === "live");
  const activitiesLive = !!(
    Object.keys(data?.weeklyGames || {}).some(w => isLiveSlot(data.weeklyGames[w])) ||
    Object.keys(data?.weeklyToT || {}).some(w => isLiveSlot(data.weeklyToT[w])) ||
    (data?.surveys || []).some(s => s.active) ||
    (data?.boards || []).some(b => b.active)
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT_PRIMARY, fontFamily: F }}>
      {isAdmin && (
        <div style={{ background: "#111", display: "flex", justifyContent: "center", gap: 4, padding: "5px 12px" }}>
          <a href="/comm118" style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: F, textDecoration: "none", color: "#9ca3af", background: "transparent" }}>118</a>
          <a href="/comm2" style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: F, textDecoration: "none", color: STORAGE_KEY === "comm2-v1" ? "#fff" : "#9ca3af", background: STORAGE_KEY === "comm2-v1" ? "#333" : "transparent" }}>COMM 2</a>
          <a href="/comm4" style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: F, textDecoration: "none", color: "#9ca3af", background: "transparent" }}>COMM 4</a>
          <a href="/dashboard" style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: F, textDecoration: "none", color: "#9ca3af", background: "transparent" }}>Dash</a>
        </div>
      )}
      <Nav view={view} setView={setView} isAdmin={effectiveAdmin} isGuest={isGuest} userName={testStudent || displayName} onLogout={() => { if (testStudent) { setTestStudent(null); return; } try { localStorage.removeItem(STORAGE_KEY + "-user"); } catch(e) {} setUserName(null); setView("home"); setStudentView(false); }} studentView={studentView} setStudentView={isAdmin ? setStudentView : null} courseTitle={data?.courseTitle} testStudent={testStudent} setTestStudent={isAdmin ? setTestStudent : null} allStudents={data ? data.students.filter(s => s.name !== "Andrew Ishak" && s.name !== "Bruce Willis").sort((a, b) => { const al = a.name.split(" ").slice(-1)[0]; const bl = b.name.split(" ").slice(-1)[0]; return al.localeCompare(bl); }) : []} activitiesLive={activitiesLive} />

      {view === "home" && !isGuest && <HomeView data={data} setData={setData} userName={effectiveUserName} isAdmin={effectiveAdmin} setView={setView} />}
      {view === "schedule" && <ScheduleView data={data} setData={setData} isAdmin={effectiveAdmin} />}
      {view === "assignments" && <AssignmentsView data={data} setData={setData} isAdmin={effectiveAdmin} userName={effectiveUserName} setView={setView} />}
      {view === "more" && !isGuest && <MoreView data={data} setData={setData} isAdmin={effectiveAdmin} userName={effectiveUserName} />}
      {view === "todo" && !isGuest && <ToDoView data={data} setData={setData} userName={effectiveUserName} isAdmin={effectiveAdmin} />}
      {view === "pti" && effectiveAdmin && <PTIView data={data} setData={setData} />}
      {view === "gradebook" && effectiveAdmin && <Gradebook data={data} setData={setData} isAdmin={true} userName={effectiveUserName} setView={setView} />}
      {view === "grading" && effectiveAdmin && <GradingInbox data={data} setData={setData} userName={effectiveUserName} />}
      {view === "admin" && effectiveAdmin && <AdminPanel data={data} setData={setData} />}
      {/* Backwards-compat redirects */}
      {view === "leaderboard" && <ScheduleView data={data} setData={setData} isAdmin={effectiveAdmin} />}
      {view === "media" && <MoreView data={data} setData={setData} isAdmin={effectiveAdmin} userName={effectiveUserName} />}
      {view === "boards" && <MoreView data={data} setData={setData} isAdmin={effectiveAdmin} userName={effectiveUserName} />}
      {view === "mynotes" && <MoreView data={data} setData={setData} isAdmin={effectiveAdmin} userName={effectiveUserName} />}
      {view === "roster" && <MoreView data={data} setData={setData} isAdmin={effectiveAdmin} userName={effectiveUserName} />}
      {view === "answer" && <ActivitiesView data={data} setData={setData} isAdmin={effectiveAdmin} userName={effectiveUserName} />}
      {view === "accolades" && <Accolades data={data} />}
      {view === "survey" && <ActivitiesView data={data} setData={setData} isAdmin={effectiveAdmin} userName={effectiveUserName} />}
    </div>
  );
}
