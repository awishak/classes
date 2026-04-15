import React, { useState, useEffect, useCallback, useRef } from "react";
import { AssignmentsView, Gradebook, DEFAULT_ASSIGNMENTS } from "./Comm2Grades.jsx";
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
const BG = "#f7f7f8";
const BORDER = "#e8e8ec";
const TEXT_PRIMARY = "#18181b";
const TEXT_SECONDARY = "#52525b";
const TEXT_MUTED = "#a1a1aa";
const GREEN = "#059669";
const RED = "#dc2626";
const AMBER = "#d97706";
const PURPLE = "#7c3aed";
const F = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";

if (typeof document !== "undefined" && !document.getElementById("dm-sans-font")) {
  const link = document.createElement("link");
  link.id = "dm-sans-font";
  link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900;1,9..40,400&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);
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
  `;
  document.head.appendChild(style);
}

const crd = { background: "#fff", borderRadius: 14, border: "1px solid " + BORDER, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" };
const pill = { padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, border: "none", transition: "all 0.15s" };
const pillActive = { ...pill, background: "#18181b", color: "#fff" };
const pillInactive = { ...pill, background: "#f4f4f5", color: "#52525b" };
const bt = { padding: "9px 18px", borderRadius: 10, border: "1px solid " + BORDER, cursor: "pointer", fontFamily: F, fontWeight: 600, fontSize: 13, transition: "all 0.15s", background: "#fff", color: "#52525b" };
const sectionLabel = { fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: F };
const inp = { background: "#fff", border: "1.5px solid " + BORDER, borderRadius: 10, padding: "10px 14px", color: TEXT_PRIMARY, fontFamily: F, fontSize: 15, fontWeight: 400, outline: "none", width: "100%", boxSizing: "border-box" };
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

/* --- NAV --- */
const ADMIN_NAME = "Andrew Ishak";
const GUEST_NAME = "__guest__";
const TEST_STUDENT = "Bruce Willis";

function Nav({ view, setView, isAdmin, isGuest, userName, onLogout, studentView, setStudentView, courseTitle, testStudent, setTestStudent, allStudents }) {
  const tabs = [
    { id: "home", label: "Home", admin: false, guest: false },
    { id: "leaderboard", label: "Leaderboard", admin: false, guest: true },
    { id: "todo", label: "To-Do", admin: true, guest: false },
    { id: "schedule", label: "Schedule", admin: false, guest: true },
    { id: "assignments", label: "Assignments", admin: false, guest: false },
    { id: "gradebook", label: "Gradebook", admin: true, guest: false },
    { id: "media", label: "Media", admin: false, guest: false },
    { id: "boards", label: "Boards", admin: false, guest: false },
    { id: "mynotes", label: "My Notes", admin: false, guest: false },
    { id: "submit", label: "Submit", admin: false, guest: false },
    { id: "accolades", label: "Accolades", admin: false, guest: false },
    { id: "pti", label: "PTI", admin: true, guest: false },
    { id: "roster", label: "Roster", admin: false, guest: false },
    { id: "admin", label: "Admin", admin: true, guest: false },
  ];
  const visibleTabs = tabs.filter(t => {
    if (t.admin && !isAdmin) return false;
    if (isGuest && !t.guest) return false;
    return true;
  });
  return (
    <div style={{ background: studentView ? "#334155" : ACCENT, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: F, letterSpacing: "-0.01em" }}>{courseTitle || "Public Speaking"}</div>
        {studentView && <span style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.05em" }}>Student View</span>}
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
        {visibleTabs.map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={view === t.id
            ? { ...pill, background: "#fff", color: studentView ? "#334155" : ACCENT, fontWeight: 700, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
            : { ...pill, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" }
          }>{t.label}</button>
        ))}
        {setStudentView && !testStudent && (
          <button onClick={() => setStudentView(!studentView)} style={{
            padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            fontFamily: F, border: studentView ? "1px solid #fbbf24" : "1px solid rgba(255,255,255,0.2)",
            background: studentView ? "#fbbf24" : "transparent", color: studentView ? "#18181b" : "rgba(255,255,255,0.6)", transition: "all 0.15s",
          }}>{studentView ? "Exit Student View" : "Student View"}</button>
        )}
        {setTestStudent && allStudents && (
          <select value={testStudent || ""} onChange={e => setTestStudent(e.target.value || null)} style={{
            padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            fontFamily: F, border: testStudent ? "1px solid #f87171" : "1px solid rgba(255,255,255,0.2)",
            background: testStudent ? "#f87171" : "transparent", color: testStudent ? "#fff" : "rgba(255,255,255,0.6)",
            outline: "none", maxWidth: 160,
          }}>
            <option value="" style={{ color: "#000" }}>Test as student...</option>
            {allStudents.map(s => <option key={s.id} value={s.name} style={{ color: "#000" }}>{s.name}</option>)}
          </select>
        )}
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginLeft: 4 }}>{userName}</span>
        <button onClick={onLogout} style={{
          padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
          fontFamily: F, border: "1px solid rgba(255,255,255,0.2)",
          background: "transparent", color: "rgba(255,255,255,0.6)", transition: "all 0.15s",
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
      <div style={{ minHeight: "100vh", background: BG, color: TEXT_PRIMARY, fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ maxWidth: 360, width: "100%" }}>
          <div style={{ background: ACCENT, borderRadius: 16, padding: "32px 24px", marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{selected}</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>Enter your PIN</div>
          </div>
          <div style={{ ...crd, padding: 20 }}>
            <input autoFocus type="password" inputMode="numeric" maxLength={6} value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }} onKeyDown={e => e.key === "Enter" && tryLogin()} placeholder="6-digit PIN" style={{ ...inp, textAlign: "center", fontSize: 24, fontWeight: 800, letterSpacing: "0.3em" }} />
            {error && <div style={{ fontSize: 13, color: RED, textAlign: "center", marginTop: 8, fontWeight: 600 }}>{error}</div>}
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, cursor: "pointer", fontSize: 13, color: TEXT_SECONDARY }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ width: 16, height: 16 }} />
              Remember me on this device
            </label>
            <button onClick={tryLogin} style={{ ...pill, background: ACCENT, color: "#fff", padding: "12px 0", width: "100%", marginTop: 12, fontSize: 15 }}>Sign In</button>
            <button onClick={() => { setSelected(null); setPin(""); setError(""); }} style={{ ...pillInactive, width: "100%", marginTop: 8, padding: "10px 0" }}>Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT_PRIMARY, fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 420, width: "100%" }}>
        <div style={{ background: ACCENT, borderRadius: 16, padding: "36px 24px", marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>COMM 2: Public Speaking</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: 500, marginTop: 6 }}>Ishak / Santa Clara University</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>MWF 9:15 to 10:20 am / Vari 128</div>
        </div>
        <div style={{ ...crd, padding: "14px 18px", marginBottom: 12 }}>
          <div style={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.6, textAlign: "center" }}>This app is our class hub: schedule, leaderboard, and more. Please see Camino for official grades. Select your name.</div>
        </div>
        <div style={{ ...crd, padding: 4 }}>
          {sorted.map(name => {
            const student = data?.students?.find(s => s.name === name);
            const bio = student ? (data?.bios || {})[student.id] : null;
            const photoUrl = bio?.photo;
            return (
            <button key={name} onClick={() => setSelected(name)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 14px", textAlign: "left",
              fontFamily: F, fontSize: 15, fontWeight: name === ADMIN_NAME ? 700 : 400,
              background: name === ADMIN_NAME ? "#eff6ff" : "transparent",
              color: name === ADMIN_NAME ? ACCENT : TEXT_PRIMARY,
              border: "none", borderRadius: 10, cursor: "pointer", transition: "background 0.1s",
            }}>
              {photoUrl ? (
                <img src={photoUrl} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <span style={{ width: 36, height: 36, borderRadius: "50%", background: name === ADMIN_NAME ? ACCENT : "#e4e4e7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: name === ADMIN_NAME ? "#fff" : TEXT_SECONDARY, flexShrink: 0 }}>
                  {name.split(" ").map(n => n[0]).join("")}
                </span>
              )}
              {name}
            </button>
            );
          })}
        </div>
        <button onClick={() => onSelect(GUEST_NAME)} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px 16px",
          fontFamily: F, fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY,
          background: "transparent", border: "1px dashed #d1d5db", borderRadius: 12, cursor: "pointer", marginTop: 12,
        }}>Continue as Guest</button>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: TEXT_MUTED }}>Questions? Contact aishak@scu.edu</div>
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
function ScheduleCardEditor({ d, wi, realDi, data, setData, onDone }) {
  const [local, setLocal] = useState({
    date: d.date, day: d.day, topic: d.topic || "", holiday: !!d.holiday,
    assignment: d.assignment || "", notes: d.notes || "", adminNotes: d.adminNotes || "",
  });
  const set = (field, value) => setLocal(prev => ({ ...prev, [field]: value }));
  const handleDone = async () => {
    const patch = { date: local.date, day: local.day, topic: local.topic, holiday: local.holiday, assignment: local.assignment, notes: local.notes, adminNotes: local.adminNotes };
    const updated = { ...data, schedule: data.schedule.map((w, i) => i === wi ? { ...w, dates: w.dates.map((dt, di) => di === realDi ? { ...dt, ...patch } : dt) } : w) };
    await saveData(updated); setData(updated); onDone();
  };
  const removeDate = async () => {
    const updated = { ...data, schedule: data.schedule.map((w, i) => i === wi ? { ...w, dates: w.dates.filter((_, di) => di !== realDi) } : w) };
    await saveData(updated); setData(updated); onDone();
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }} onClick={e => e.stopPropagation()}>
      <div style={{ display: "flex", gap: 4 }}>
        <input value={local.date} onChange={e => set("date", e.target.value)} style={{ ...inp, padding: "3px 6px", fontSize: 11, width: 60 }} />
        <input value={local.day} onChange={e => set("day", e.target.value)} style={{ ...inp, padding: "3px 6px", fontSize: 11, width: 40 }} />
        <label style={{ fontSize: 11, color: TEXT_MUTED, display: "flex", alignItems: "center", gap: 2 }}><input type="checkbox" checked={local.holiday} onChange={e => set("holiday", e.target.checked)} />Off</label>
      </div>
      <textarea value={local.topic} onChange={e => set("topic", e.target.value)} placeholder="Topic" rows={2} style={{ ...inp, padding: "4px 6px", fontSize: 12, resize: "vertical" }} />
      <input value={local.assignment} onChange={e => set("assignment", e.target.value)} placeholder="Assignment due" style={{ ...inp, padding: "3px 6px", fontSize: 11 }} />
      <textarea value={local.notes} onChange={e => set("notes", e.target.value)} placeholder="Notes (students see)" rows={2} style={{ ...inp, padding: "3px 6px", fontSize: 11, resize: "vertical" }} />
      <textarea value={local.adminNotes} onChange={e => set("adminNotes", e.target.value)} placeholder="Admin notes (hidden)" rows={2} style={{ ...inp, padding: "3px 6px", fontSize: 11, resize: "vertical", borderColor: "#f59e0b", background: "#fffbeb" }} />
      <div style={{ display: "flex", gap: 4 }}>
        <button onClick={handleDone} style={{ ...bt, fontSize: 11, padding: "3px 10px", background: ACCENT, color: "#fff" }}>Done</button>
        <button onClick={removeDate} style={{ ...bt, fontSize: 11, padding: "3px 10px", background: "transparent", color: RED, border: "1px solid " + RED + "33" }}>X</button>
      </div>
    </div>
  );
}

function ScheduleView({ data, setData, isAdmin }) {
  const schedule = data.schedule || DEFAULT_SCHEDULE;
  const [editCell, setEditCell] = useState(null);
  const [editWeek, setEditWeek] = useState(null);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const addDate = async (weekIdx) => {
    const updated = { ...data, schedule: data.schedule.map((w, wi) => wi === weekIdx ? { ...w, dates: [...w.dates, { date: "TBD", day: "Mon", topic: "", assignment: "", notes: "" }] } : w) };
    await saveData(updated); setData(updated); showMsg("Added");
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
  const saveWeekHeader = async (wi, label, theme) => {
    const updated = { ...data, schedule: data.schedule.map((w, i) => i === wi ? { ...w, label, theme } : w) };
    await saveData(updated); setData(updated); setEditWeek(null);
  };

  return (
    <div style={{ padding: "20px 16px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ ...sectionLabel }}>Schedule</div>
          {isAdmin && (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={addWeek} style={pillInactive}>+ Week</button>
              <button onClick={() => { if (window.confirm("Reset schedule to defaults?")) resetSchedule(); }} style={{ ...pill, background: "#fef2f2", color: RED }}>Reset</button>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {schedule.map((week, wi) => {
            const mon = week.dates.find(d => d.day === "Mon");
            const wed = week.dates.find(d => d.day === "Wed");
            const fri = week.dates.find(d => d.day === "Fri");
            const other = week.dates.filter(d => !["Mon", "Wed", "Fri"].includes(d.day));
            const days = [mon, wed, fri, ...other].filter(Boolean);
            const colCount = days.length > 3 ? 3 : days.length;

            return (
              <div key={wi}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  {week.week <= 10 && <div style={{ width: 36, height: 36, borderRadius: 10, background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 15, fontWeight: 800, fontFamily: F, flexShrink: 0 }}>{week.week}</div>}
                  {editWeek === wi && isAdmin ? (
                    <WeekHeaderInline week={week} onSave={(l, t) => saveWeekHeader(wi, l, t)} onCancel={() => setEditWeek(null)} />
                  ) : (
                    <div style={{ flex: 1, cursor: isAdmin ? "pointer" : "default" }} onClick={() => isAdmin && setEditWeek(wi)}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.25 }}>{week.label}{week.theme ? " \u2014 " + week.theme : ""}</div>
                      <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{days.map(d => d.date).join("  /  ")}</div>
                    </div>
                  )}
                  {isAdmin && <button onClick={() => removeWeek(wi)} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, fontSize: 16, padding: 4 }}>x</button>}
                </div>

                <div className="schedule-days-c2" data-cols={colCount} style={{ display: "grid", gap: 8 }}>
                  {days.map((d, di) => {
                    const realDi = week.dates.indexOf(d);
                    const isHoliday = d.holiday;
                    const isFri = d.fri || d.day === "Fri";
                    const isEdit = editCell && editCell.w === wi && editCell.d === realDi;

                    return (
                      <div key={di} onClick={() => isAdmin && !isEdit && setEditCell({ w: wi, d: realDi })} style={{
                        padding: "14px 16px", borderRadius: 14, minHeight: 60,
                        background: "#fff",
                        border: isFri ? "2px solid #c4b5fd" : "1px solid " + BORDER,
                        cursor: isAdmin && !isEdit ? "pointer" : "default",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: isFri ? PURPLE : TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>{d.day}</span>
                          <span style={{ fontSize: 12, fontWeight: 500, color: TEXT_MUTED }}>{d.date}</span>
                        </div>

                        {isEdit && isAdmin ? (
                          <ScheduleCardEditor d={d} wi={wi} realDi={realDi} data={data} setData={setData} onDone={() => setEditCell(null)} />
                        ) : (
                          <div>
                            {isHoliday && <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: RED, background: "#fef2f2", padding: "3px 8px", borderRadius: 6, marginBottom: d.topic ? 6 : 0 }}>No in-person class</div>}
                            {d.topic && <div style={{ fontSize: 15, color: TEXT_PRIMARY, lineHeight: 1.45, fontWeight: 400 }}>{d.topic}</div>}
                            {!isHoliday && !d.topic && <div style={{ fontSize: 15, color: TEXT_MUTED, fontStyle: "italic" }}>\u2014</div>}
                            {d.assignment && <div style={{ fontSize: 13, color: "#c2410c", marginTop: 6, fontWeight: 600 }}>{d.assignment}</div>}
                            {d.notes && <div style={{ fontSize: 13, color: isHoliday ? TEXT_SECONDARY : TEXT_MUTED, marginTop: 6, whiteSpace: "pre-wrap", lineHeight: 1.4 }}>{d.notes}</div>}
                            {isAdmin && d.adminNotes && <div style={{ fontSize: 12, color: AMBER, marginTop: 6, padding: "6px 10px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fef3c7", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>{d.adminNotes}</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {isAdmin && <button onClick={() => addDate(wi)} style={{ ...pill, background: "transparent", border: "1px dashed " + BORDER, color: TEXT_MUTED, width: "100%", marginTop: 8, fontSize: 12 }}>+</button>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeekHeaderInline({ week, onSave, onCancel }) {
  const [label, setLabel] = useState(week.label || "");
  const [theme, setTheme] = useState(week.theme || "");
  return (
    <div style={{ display: "flex", gap: 4, flex: 1, alignItems: "center" }}>
      <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label" style={{ ...inp, padding: "4px 8px", fontSize: 12, width: 90 }} />
      <input value={theme} onChange={e => setTheme(e.target.value)} placeholder="Theme" style={{ ...inp, padding: "4px 8px", fontSize: 12, flex: 1 }} />
      <button onClick={() => onSave(label, theme)} style={{ ...bt, fontSize: 11, padding: "3px 10px", background: ACCENT, color: "#fff" }}>Done</button>
      <button onClick={onCancel} style={{ ...bt, fontSize: 11, padding: "3px 10px" }}>Cancel</button>
    </div>
  );
}

/* --- LEADERBOARD --- */
function Leaderboard({ students, log, isAdmin, userName, data, setData }) {
  const ranked = rs(students, log);
  const bios = data?.bios || {};
  const mx = ranked.length > 0 ? Math.max(ranked[0].points, 1) : 1;
  const [showAll, setShowAll] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [editingExplain, setEditingExplain] = useState(false);
  const [explainText, setExplainText] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const visible = showAll ? ranked : ranked.slice(0, 10);
  const myRank = ranked.findIndex(s => s.name === userName);
  const meInVisible = myRank >= 0 && myRank < visible.length;
  const meData = myRank >= 0 ? ranked[myRank] : null;

  // This week (Mon-Sun)
  const now = new Date();
  const day = now.getDay();
  const daysFromMon = day === 0 ? 6 : day - 1;
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - daysFromMon); weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
  const weekLog = log.filter(e => e.ts >= weekStart.getTime() && e.ts < weekEnd.getTime());
  const weekRanked = students.map(s => ({ ...s, points: weekLog.filter(e => e.studentId === s.id).reduce((t, e) => t + e.amount, 0) })).filter(s => s.points > 0).sort((a, b) => b.points - a.points).slice(0, 10);

  const customExplain = data?.leaderboardExplain;
  const defaultExplain = "Earn points through speeches, in-class participation, and bonus activities.";
  const explainContent = customExplain || defaultExplain;

  const saveExplain = async () => {
    const updated = { ...data, leaderboardExplain: explainText };
    await saveData(updated); if (setData) setData(updated);
    setEditingExplain(false);
  };

  return (
    <div style={{ padding: "20px 16px 40px", fontFamily: F }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Explanation */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...crd, padding: "10px 14px" }}>
            {editingExplain ? (
              <div>
                <textarea value={explainText} onChange={e => setExplainText(e.target.value)} rows={8} style={{ ...inp, fontSize: 13, resize: "vertical", lineHeight: 1.6 }} />
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <button onClick={saveExplain} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", flex: 1 }}>Save</button>
                  <button onClick={() => setEditingExplain(false)} style={pillInactive}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <button onClick={() => setShowExplain(!showExplain)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F, width: "100%", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>{explainContent.split("\n")[0]}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2" style={{ transform: showExplain ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginLeft: 8 }}><path d="M6 9l6 6 6-6"/></svg>
                </button>
                {showExplain && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f3f4f6", fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {explainContent}
                    {isAdmin && (
                      <div style={{ marginTop: 10 }}>
                        <button onClick={() => { setExplainText(explainContent); setEditingExplain(true); }} style={{ ...pillInactive, fontSize: 11 }}>Edit Explanation</button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ ...sectionLabel }}>Class Leaderboard</div>
              {isAdmin && <button onClick={() => setShowAll(!showAll)} style={pillInactive}>{showAll ? "Top 10" : "Show All"}</button>}
            </div>
            <div style={{ ...crd, padding: 0 }}>
              {visible.map((s, i) => {
                const isMe = s.name === userName;
                const isExpanded = expandedId === s.id;
                const bio = bios[s.id] || {};
                const initials = s.name.split(" ").map(n => n[0]).join("");
                const entries = log.filter(e => e.studentId === s.id);
                const bySrc = {};
                entries.forEach(e => { bySrc[e.source] = (bySrc[e.source] || 0) + e.amount; });

                return (
                  <div key={s.id}>
                    <div onClick={() => setExpandedId(isExpanded ? null : s.id)} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                      borderBottom: "1px solid #f4f4f5", cursor: "pointer",
                      background: isMe ? "#eff6ff" : "transparent",
                    }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: "#e4e4e7", display: "flex", alignItems: "center", justifyContent: "center", color: TEXT_SECONDARY, fontSize: 14, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                      {bio.photo ? (
                        <img src={bio.photo} alt="" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "3px solid #f4f4f5" }} />
                      ) : (
                        <div style={{ width: 60, height: 60, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff", flexShrink: 0, border: "3px solid #f4f4f5" }}>{initials}</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: TEXT_PRIMARY }}>{s.name}{isMe && <span style={{ fontSize: 11, color: ACCENT, marginLeft: 6, fontWeight: 600 }}>You</span>}</div>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: TEXT_PRIMARY, fontVariantNumeric: "tabular-nums" }}>{s.points}</div>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: "8px 16px 12px 60px", background: "#fafafa", borderBottom: "1px solid #f4f4f5" }}>
                        {Object.entries(bySrc).sort((a, b) => b[1] - a[1]).map(([src, pts]) => (
                          <div key={src} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: TEXT_SECONDARY, padding: "2px 0" }}>
                            <span>{src}</span><span style={{ fontWeight: 700 }}>{pts}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {!meInVisible && meData && myRank >= 0 && (
              <div style={{ ...crd, marginTop: 12, padding: "12px 16px", background: "#eff6ff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "#e4e4e7", display: "flex", alignItems: "center", justifyContent: "center", color: TEXT_SECONDARY, fontSize: 14, fontWeight: 800 }}>{myRank + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>{meData.name} <span style={{ fontSize: 11, color: ACCENT, fontWeight: 600 }}>You</span></div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED }}>Only visible to you</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: TEXT_PRIMARY }}>{meData.points}</div>
                </div>
              </div>
            )}
          </div>

          <div>
            <div style={{ ...sectionLabel, marginBottom: 8 }}>This Week</div>
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 8 }}>{weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} to {new Date(weekEnd.getTime() - 1).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
            {weekRanked.length === 0 && <div style={{ ...crd, padding: 20, textAlign: "center", color: TEXT_MUTED, fontSize: 13 }}>No points yet this week</div>}
            {weekRanked.map((s, i) => {
              const isMe = s.name === userName;
              return (
                <div key={s.id} style={{ ...crd, padding: "10px 14px", marginBottom: 6, display: "flex", alignItems: "center", gap: 10, border: isMe ? "2px solid " + ACCENT : "1px solid " + BORDER }}>
                  <div style={{ width: 24, textAlign: "center", fontSize: 14, fontWeight: 800, color: i < 3 ? "#d4a017" : TEXT_MUTED }}>{i + 1}</div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}{isMe && <span style={{ fontSize: 10, color: ACCENT, marginLeft: 6, fontWeight: 700 }}>YOU</span>}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: TEXT_PRIMARY }}>{s.points}</div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}

/* --- TO-DO --- */
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
  const sorted = [...data.students].filter(s => s.name !== ADMIN_NAME).sort(lastSortObj);

  if (selectedId) {
    const student = data.students.find(s => s.id === selectedId);
    if (!student) { setSelectedId(null); return null; }
    return <BioView student={student} data={data} setData={setData} userName={userName} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 12 }}>Roster ({sorted.length} students)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {sorted.map(s => {
            const bio = (data.bios || {})[s.id] || {};
            const initials = s.name.split(" ").map(n => n[0]).join("");
            return (
              <button key={s.id} onClick={() => setSelectedId(s.id)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                background: "#fff", border: "1px solid #f3f4f6", borderRadius: 12,
                cursor: "pointer", textAlign: "left", fontFamily: F, width: "100%", transition: "all 0.1s",
              }}>
                {bio.photo ? (
                  <img src={bio.photo} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#fff", flexShrink: 0 }}>{initials}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>{s.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2, flexWrap: "wrap", fontSize: 13 }}>
                    {bio.major && <span style={{ color: TEXT_SECONDARY, fontWeight: 600 }}>{bio.major}</span>}
                    {bio.major && bio.hometown && <span style={{ color: "#d4d4d8" }}>/</span>}
                    {bio.hometown && <span style={{ color: TEXT_SECONDARY }}>{bio.hometown}</span>}
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            );
          })}
        </div>
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
        <button onClick={onBack} style={pillInactive}>Back to Roster</button>

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

function HomeTodoSummary({ data, setData, studentId, setView }) {
  const todos = data.todos || [];
  const todoChecks = data.todoChecks || {};
  const rebounds = data.rebounds || {};
  const hiddenTodos = data.hiddenTodos || {};

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
          reboundTodos.push({ id: "rebound-" + rKey, title: "Submit rebound: " + label + " Wk " + w, due: hoursLeft + "h left", dueTs: deadline, linkTab: "inclass", auto: true });
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

  // Filter manual todos for this student, parse dueTs from due string
  const myManualTodos = todos.filter(t => !t.targetStudents || t.targetStudents.includes(studentId)).filter(t => !hiddenTodos[studentId + "-" + t.id]).map(t => {
    let dueTs = null;
    if (t.due) {
      try {
        const parsed = new Date(t.due + ", 2026");
        if (!isNaN(parsed.getTime())) dueTs = parsed.getTime();
      } catch {}
    }
    return { ...t, dueTs };
  });
  const allTodos = [...reboundTodos, ...myManualTodos];

  // Filter out checked
  const unchecked = allTodos.filter(t => {
    if (t.auto) return true;
    return !todoChecks[studentId + "-" + t.id];
  });
  const checked = allTodos.filter(t => !t.auto && todoChecks[studentId + "-" + t.id]);

  if (unchecked.length === 0 && checked.length === 0) return null;

  const isPastDue = (t) => t.dueTs && Date.now() > t.dueTs + (t.auto ? 0 : 24 * 60 * 60 * 1000);

  return (
    <div style={{ ...crd, padding: 14, marginBottom: 12, borderLeft: "3px solid " + ACCENT }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>To-Do ({unchecked.length})</div>
      {unchecked.map(t => {
        const pastDue = isPastDue(t);
        return (
          <div key={t.id} style={{ padding: "6px 0", borderBottom: "1px solid #f4f4f5" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {!t.auto && (
                <button onClick={() => toggleCheck(t.id)} style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, cursor: "pointer",
                  border: "1px solid " + BORDER, background: "#fff", fontFamily: F, fontSize: 11, fontWeight: 600, color: TEXT_MUTED, flexShrink: 0,
                }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, border: "2px solid " + BORDER, background: "#fff" }} />
                  Mark done
                </button>
              )}
              {t.auto && <div style={{ width: 6, height: 6, borderRadius: 3, background: "#f59e0b", flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }}>{t.title}</span>
                {t.due && <span style={{ fontSize: 11, color: pastDue ? RED : TEXT_SECONDARY, fontWeight: pastDue ? 700 : 500, marginLeft: 6 }}>{pastDue ? "Past due" : t.due}</span>}
              </div>
              {t.linkTab && <button onClick={() => setView(t.linkTab)} style={{ fontSize: 11, color: ACCENT, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontWeight: 600 }}>Go</button>}
            </div>
            {pastDue && !t.auto && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, paddingLeft: 22 }}>
                <span style={{ fontSize: 11, color: RED }}>Remove from to-do list?</span>
                <button onClick={() => hideTodo(t.id)} style={{ fontSize: 11, color: RED, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontWeight: 700, padding: 0 }}>Remove</button>
              </div>
            )}
          </div>
        );
      })}
      {checked.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 4 }}>Completed</div>
          {checked.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", opacity: 0.5 }}>
              <button onClick={() => toggleCheck(t.id)} style={{
                display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, cursor: "pointer",
                border: "1px solid " + GREEN, background: GREEN + "10", fontFamily: F, fontSize: 11, fontWeight: 600, color: GREEN, flexShrink: 0,
              }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, border: "2px solid " + GREEN, background: GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                Done
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

function HomeView({ data, setData, userName, isAdmin, setView }) {
  const [newNewsText, setNewNewsText] = useState("");
  const [newNewsType, setNewNewsType] = useState("info");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [composing, setComposing] = useState(false);
  const [composeText, setComposeText] = useState("");
  const [composeRecipients, setComposeRecipients] = useState("all");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editMsgText, setEditMsgText] = useState("");
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const news = data.news || [];
  const boards = data.boards || [];
  const schedule = data.schedule || [];
  const assignments = data.assignments || [];
  const grades = data.grades || {};
  const todoChecks = data.todoChecks || {};
  const student = data.students.find(s => s.name === userName);
  const studentId = student?.id;

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

  // Featured posts from boards
  const featuredPosts = [];
  boards.forEach(board => {
    Object.entries(board.posts || {}).forEach(([author, post]) => {
      if (post.featured) featuredPosts.push({ author, text: post.text, boardTitle: board.title, ts: post.ts });
    });
  });
  featuredPosts.sort((a, b) => b.ts - a.ts);

  // Mini leaderboard
  const ranked = data.students.map(s => ({ ...s, points: data.log.filter(e => e.studentId === s.id).reduce((t, e) => t + e.amount, 0) })).sort((a, b) => b.points - a.points);
  const top5 = ranked.slice(0, 5);
  const mx = top5.length > 0 ? Math.max(top5[0].points, 1) : 1;
  const myRank = ranked.findIndex(s => s.name === userName);
  const meData = myRank >= 0 ? ranked[myRank] : null;

  // Next 3 upcoming classes
  const today = new Date();
  const upcomingDates = [];
  schedule.forEach(week => {
    (week.dates || []).forEach(d => {
      if (d.day === "Finals") return;
      const year = today.getFullYear();
      const parsed = new Date(d.date + ", " + year);
      if (!isNaN(parsed) && parsed >= new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
        upcomingDates.push({ ...d, weekLabel: week.label, weekNum: week.week, parsedDate: parsed });
      }
    });
  });
  upcomingDates.sort((a, b) => a.parsedDate - b.parsedDate);
  const next3 = upcomingDates.slice(0, 3);

  // Assignment checklist
  const todoDue = assignments.filter(a => a.due && a.id !== "participation").map(a => {
    const g = studentId ? grades[studentId + "-" + a.id] : null;
    const completed = g && g.score !== undefined && g.score !== "";
    const todoKey = userName + "-assignment-" + a.id;
    const checked = todoChecks[todoKey];
    return { ...a, completed: completed || checked };
  });

  const checkTodo = async (assignmentId) => {
    const key = userName + "-assignment-" + assignmentId;
    const updated = { ...data, todoChecks: { ...todoChecks, [key]: !todoChecks[key] } };
    await saveData(updated); setData(updated);
  };

  // This week's media
  const currentWeek = schedule.find(w => {
    return (w.dates || []).some(d => {
      if (d.day === "Finals") return false;
      const year = today.getFullYear();
      const parsed = new Date(d.date + ", " + year);
      const dayDiff = (parsed - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / (1000 * 60 * 60 * 24);
      return dayDiff >= -3 && dayDiff <= 4;
    });
  });

  const newsColors = { info: { bg: "#eff6ff", color: "#2563eb", label: "Info" }, assignment: { bg: "#fffbeb", color: "#d97706", label: "Assignment" }, alert: { bg: "#fef2f2", color: "#dc2626", label: "Alert" } };

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

                {/* To-do summary + Rebound box */}
        {studentId && !isAdmin && <HomeTodoSummary data={data} setData={setData} studentId={studentId} setView={(v) => { const ev = new CustomEvent("nav", { detail: v }); window.dispatchEvent(ev); }} />}
        {studentId && !isAdmin && <HomeReboundBox data={data} setData={setData} studentId={studentId} />}

        {/* Admin: post news */}
        {isAdmin && (
          <div style={{ ...crd, padding: 14, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <select value={newNewsType} onChange={e => setNewNewsType(e.target.value)} style={{ ...sel, width: 110, fontSize: 13 }}>
                <option value="info">Info</option>
                <option value="assignment">Assignment</option>
                <option value="alert">Alert</option>
              </select>
              <input value={newNewsText} onChange={e => setNewNewsText(e.target.value)} placeholder="Post an update..." style={{ ...inp, flex: 1 }} onKeyDown={e => e.key === "Enter" && addNews()} />
              <button onClick={addNews} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff" }}>Post</button>
            </div>
          </div>
        )}

        {/* News feed */}
        {news.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            {news.slice(0, 5).map(item => {
              const nc = newsColors[item.type] || newsColors.info;
              return (
                <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid " + BORDER }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: nc.color, background: nc.bg, padding: "3px 8px", borderRadius: 6, flexShrink: 0, marginTop: 2, textTransform: "uppercase" }}>{nc.label}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.45 }}>{item.text}</div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{new Date(item.ts).toLocaleDateString()}</div>
                  </div>
                  {isAdmin && <button onClick={() => removeNews(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, fontSize: 14 }}>x</button>}
                </div>
              );
            })}
          </div>
        )}

        {/* Two-column grid: Coming Up + Mini Leaderboard */}
        <div className="home-grid-c2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {/* Upcoming classes */}
          <div style={{ ...crd, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>Coming Up</div>
              <button onClick={() => setView("schedule")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: ACCENT, fontWeight: 600, fontFamily: F }}>Full schedule</button>
            </div>
            {next3.length === 0 && <div style={{ fontSize: 13, color: TEXT_MUTED }}>No upcoming classes</div>}
            {next3.map((d, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: i < next3.length - 1 ? "1px solid " + BORDER : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: d.holiday ? RED : ACCENT }}>{d.day} {d.date}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: TEXT_MUTED }}>{d.weekLabel}</span>
                </div>
                {d.topic && <div style={{ fontSize: 13, color: TEXT_PRIMARY, marginTop: 2, lineHeight: 1.35 }}>{d.topic}</div>}
                {d.holiday && <div style={{ fontSize: 12, color: RED, marginTop: 2 }}>No in-person class</div>}
                {d.assignment && <div style={{ fontSize: 12, color: "#c2410c", marginTop: 2, fontWeight: 600 }}>{d.assignment}</div>}
                {d.notes && !d.holiday && <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>{d.notes}</div>}
              </div>
            ))}
          </div>

          {/* Mini leaderboard */}
          <div style={{ ...crd, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>Leaderboard</div>
              <button onClick={() => setView("leaderboard")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: ACCENT, fontWeight: 600, fontFamily: F }}>See all</button>
            </div>
            {top5.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: s.name === userName ? "4px 6px" : "4px 0", background: s.name === userName ? ACCENT + "08" : "transparent", borderRadius: 6, margin: s.name === userName ? "0 -6px" : 0 }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: i < 5 ? "#d4a017" : TEXT_MUTED, width: 18 }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: s.name === userName ? 700 : 500, color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name.split(" ")[0]} {lastName(s.name)}</div>
                  {s.name === userName && <span style={{ fontSize: 9, fontWeight: 800, color: ACCENT, background: ACCENT + "15", padding: "1px 5px", borderRadius: 4, flexShrink: 0 }}>YOU</span>}
                </div>
                <div style={{ width: 60, height: 6, borderRadius: 3, background: "#f4f4f5", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: (s.points / mx * 100) + "%", background: i < 5 ? "#d4a017" : ACCENT, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY, width: 28, textAlign: "right" }}>{s.points}</span>
              </div>
            ))}
            {meData && myRank >= 5 && (
              <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px dashed " + BORDER, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: TEXT_MUTED, width: 18 }}>{myRank + 1}</span>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>{meData.name.split(" ")[0]} (you)</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY }}>{meData.points}</span>
              </div>
            )}
          </div>
        </div>

        {/* This week's media */}
        {(() => {
          const weekMedia = (data.media || []).filter(m => {
            if (!currentWeek) return false;
            return m.week === currentWeek.week;
          });
          if (weekMedia.length === 0) return null;
          return (
            <div style={{ ...crd, padding: 14, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>Week {currentWeek.week} Media</div>
                <button onClick={() => setView("media")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: ACCENT, fontWeight: 600, fontFamily: F }}>All media</button>
              </div>
              {weekMedia.map(m => (
                <div key={m.id} style={{ padding: "4px 0" }}>
                  {m.url ? (
                    <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>{m.title}</a>
                  ) : (
                    <span style={{ fontSize: 13, color: TEXT_PRIMARY, fontWeight: 500 }}>{m.title}</span>
                  )}
                  {m.notes && <div style={{ fontSize: 11, color: TEXT_MUTED }}>{m.notes}</div>}
                </div>
              ))}
            </div>
          );
        })()}

        {/* Messages + Instructor Card side by side */}
        <div className="home-grid-c2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16, alignItems: "start" }}>
          {/* Messages / Notes */}
          {(() => {
            const messages = data.messages || [];
            const archived = data.archivedMessages || [];
            const myMessages = isAdmin
              ? messages.filter(m => !archived.includes(m.id))
              : messages.filter(m => m.to === "all" || (Array.isArray(m.to) && m.to.includes(userName)) || m.to === userName || m.from === userName);
            if (myMessages.length === 0 && !isAdmin && !composing) return <div />;

          const sendReply = async (msgId) => {
            if (!replyText.trim()) return;
            const updated = { ...data, messages: messages.map(m => m.id === msgId ? { ...m, replies: [...(m.replies || []), { from: userName, text: replyText.trim(), ts: Date.now() }] } : m) };
            await saveData(updated); setData(updated);
            setReplyingTo(null); setReplyText(""); showMsg("Reply sent");
          };

          const sendMessage = async () => {
            if (!composeText.trim()) return;
            let to;
            if (isAdmin) {
              to = composeRecipients === "all" ? "all" : selectedStudents;
              if (composeRecipients !== "all" && selectedStudents.length === 0) return;
            } else {
              to = ADMIN_NAME;
            }
            const m = { id: genId(), from: userName, to, text: composeText.trim(), ts: Date.now(), replies: [] };
            const updated = { ...data, messages: [m, ...(data.messages || [])] };
            await saveData(updated); setData(updated);
            setComposeText(""); setSelectedStudents([]); setComposing(false); showMsg("Message sent");
          };

          const archiveMessage = async (msgId) => {
            const updated = { ...data, archivedMessages: [...archived, msgId] };
            await saveData(updated); setData(updated); showMsg("Archived");
          };

          const deleteMessage = async (msgId) => {
            const updated = { ...data, messages: messages.filter(m => m.id !== msgId) };
            await saveData(updated); setData(updated); showMsg("Deleted");
          };

          const editMessage = async (msgId) => {
            if (!editMsgText.trim()) return;
            const updated = { ...data, messages: messages.map(m => m.id === msgId ? { ...m, text: editMsgText.trim(), edited: true } : m) };
            await saveData(updated); setData(updated);
            setEditingMsg(null); setEditMsgText(""); showMsg("Edited");
          };

          const deleteReply = async (msgId, replyIdx) => {
            const updated = { ...data, messages: messages.map(m => m.id === msgId ? { ...m, replies: (m.replies || []).filter((_, i) => i !== replyIdx) } : m) };
            await saveData(updated); setData(updated); showMsg("Reply deleted");
          };

          const toggleStudent = (name) => {
            setSelectedStudents(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
          };

          return (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>Messages</div>
                <button onClick={() => setComposing(!composing)} style={composing ? pillActive : pillInactive}>{composing ? "Cancel" : isAdmin ? "New Message" : "Message Instructor"}</button>
              </div>

              {composing && isAdmin && (
                <div style={{ ...crd, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    <button onClick={() => { setComposeRecipients("all"); setSelectedStudents([]); }} style={composeRecipients === "all" ? pillActive : pillInactive}>All Students</button>
                    <button onClick={() => setComposeRecipients("select")} style={composeRecipients === "select" ? pillActive : pillInactive}>Select Students</button>
                  </div>
                  {composeRecipients === "select" && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8, maxHeight: 120, overflowY: "auto", padding: 4 }}>
                      {[...data.students].sort(lastSortObj).map(s => (
                        <button key={s.id} onClick={() => toggleStudent(s.name)} style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, cursor: "pointer", fontFamily: F, border: "1px solid " + (selectedStudents.includes(s.name) ? ACCENT : BORDER), background: selectedStudents.includes(s.name) ? ACCENT + "15" : "transparent", color: selectedStudents.includes(s.name) ? ACCENT : TEXT_PRIMARY }}>{s.name.split(" ")[0]}</button>
                      ))}
                    </div>
                  )}
                  <textarea value={composeText} onChange={e => setComposeText(e.target.value)} placeholder="Write your message..." rows={3} style={{ ...inp, resize: "vertical", fontSize: 14, marginBottom: 8 }} />
                  <button onClick={sendMessage} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", width: "100%" }}>
                    Send{composeRecipients === "all" ? " to All" : selectedStudents.length > 0 ? " to " + selectedStudents.length + " student" + (selectedStudents.length !== 1 ? "s" : "") : ""}
                  </button>
                </div>
              )}

              {composing && !isAdmin && (
                <div style={{ ...crd, padding: 14, marginBottom: 10 }}>
                  <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 8 }}>Send a message to your instructor</div>
                  <textarea value={composeText} onChange={e => setComposeText(e.target.value)} placeholder="Write your message..." rows={3} style={{ ...inp, resize: "vertical", fontSize: 14, marginBottom: 8 }} />
                  <button onClick={sendMessage} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", width: "100%" }}>Send to Instructor</button>
                </div>
              )}

              {myMessages.slice(0, 10).map(msgItem => {
                const isFromAdmin = msgItem.from === ADMIN_NAME;
                const isOwn = msgItem.from === userName;
                const recipientLabel = msgItem.to === "all" ? "All students" : Array.isArray(msgItem.to) ? msgItem.to.map(n => n.split(" ")[0]).join(", ") : msgItem.to;
                const isReplying = replyingTo === msgItem.id;
                const isEditingThis = editingMsg === msgItem.id;
                return (
                  <div key={msgItem.id} style={{ ...crd, padding: 14, marginBottom: 8, borderLeft: isFromAdmin ? "3px solid " + ACCENT : "3px solid " + GREEN }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>{msgItem.from}</span>
                        {isAdmin && <span style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: 6 }}>to {recipientLabel}</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: TEXT_SECONDARY }}>{new Date(msgItem.ts).toLocaleDateString()}</span>
                        {msgItem.edited && <span style={{ fontSize: 10, color: TEXT_MUTED, fontStyle: "italic" }}>edited</span>}
                      </div>
                    </div>

                    {isEditingThis ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                        <textarea value={editMsgText} onChange={e => setEditMsgText(e.target.value)} rows={3} style={{ ...inp, resize: "vertical", fontSize: 14 }} />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => editMessage(msgItem.id)} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", flex: 1 }}>Save</button>
                          <button onClick={() => { setEditingMsg(null); setEditMsgText(""); }} style={pillInactive}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{msgItem.text}</div>
                    )}

                    {(msgItem.replies || []).length > 0 && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid " + BORDER }}>
                        {msgItem.replies.map((r, ri) => (
                          <div key={ri} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "4px 0", fontSize: 13 }}>
                            <div>
                              <span style={{ fontWeight: 700, color: r.from === ADMIN_NAME ? ACCENT : TEXT_PRIMARY }}>{r.from.split(" ")[0]}:</span>
                              <span style={{ color: TEXT_PRIMARY, marginLeft: 4 }}>{r.text}</span>
                              <span style={{ fontSize: 10, color: TEXT_MUTED, marginLeft: 6 }}>{new Date(r.ts).toLocaleDateString()}</span>
                            </div>
                            {(isAdmin || r.from === userName) && <button onClick={() => deleteReply(msgItem.id, ri)} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, fontSize: 11, flexShrink: 0 }}>x</button>}
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {!isEditingThis && (
                        <button onClick={() => { setReplyingTo(replyingTo === msgItem.id ? null : msgItem.id); setReplyText(""); }} style={{ ...pillInactive, fontSize: 11 }}>{isReplying ? "Cancel" : "Reply"}</button>
                      )}
                      {(isOwn || isAdmin) && !isEditingThis && (
                        <button onClick={() => { setEditingMsg(msgItem.id); setEditMsgText(msgItem.text); }} style={{ ...pillInactive, fontSize: 11 }}>Edit</button>
                      )}
                      {(isOwn || isAdmin) && (
                        <button onClick={() => { if (window.confirm("Delete this message?")) deleteMessage(msgItem.id); }} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11 }}>Delete</button>
                      )}
                      {isAdmin && !isOwn && (
                        <button onClick={() => archiveMessage(msgItem.id)} style={{ ...pillInactive, fontSize: 11 }}>Archive</button>
                      )}
                    </div>

                    {isReplying && !isEditingThis && (
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Your reply..." style={{ ...inp, flex: 1, fontSize: 13 }} onKeyDown={e => e.key === "Enter" && sendReply(msgItem.id)} />
                        <button onClick={() => sendReply(msgItem.id)} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", fontSize: 12 }}>Send</button>
                      </div>
                    )}
                  </div>
                );
              })}
              {myMessages.length === 0 && isAdmin && !composing && <div style={{ ...crd, padding: 16, textAlign: "center", color: TEXT_MUTED, fontSize: 13 }}>No messages yet</div>}
            </div>
          );
        })()}

        {/* Instructor Card */}
        <InstructorCard data={data} setData={setData} isAdmin={isAdmin} />
        </div>

        {/* Active Discussion Boards */}
        {boards.filter(b => b.active).length > 0 && (
          <div style={{ ...crd, padding: 14, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>Active Discussion Boards</div>
              <button onClick={() => setView("boards")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: ACCENT, fontWeight: 600, fontFamily: F }}>All boards</button>
            </div>
            {boards.filter(b => b.active).map(board => {
              const postCount = Object.keys(board.posts || {}).filter(k => !(board.posts[k].archived)).length;
              const myPost = (board.posts || {})[userName];
              return (
                <div key={board.id} onClick={() => setView("boards")} style={{ padding: "8px 0", borderBottom: "1px solid " + BORDER, cursor: "pointer" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{board.title}</div>
                  <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2, lineHeight: 1.35 }}>{board.prompt.length > 80 ? board.prompt.slice(0, 80) + "..." : board.prompt}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4, fontSize: 11 }}>
                    <span style={{ color: TEXT_MUTED }}>{postCount} response{postCount !== 1 ? "s" : ""}</span>
                    {myPost && !myPost.archived ? <span style={{ color: GREEN, fontWeight: 600 }}>You responded</span> : <span style={{ color: ACCENT, fontWeight: 600 }}>Respond now</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Assignments checklist */}
        <div style={{ ...crd, padding: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>Assignments</div>
            <button onClick={() => setView("assignments")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: ACCENT, fontWeight: 600, fontFamily: F }}>Details</button>
          </div>
          {todoDue.map(a => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid " + BORDER }}>
              <button onClick={() => checkTodo(a.id)} style={{ width: 22, height: 22, borderRadius: 6, border: "2px solid " + (a.completed ? GREEN : "#d4d4d8"), background: a.completed ? GREEN : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, padding: 0 }}>
                {a.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: a.completed ? TEXT_MUTED : TEXT_PRIMARY, textDecoration: a.completed ? "line-through" : "none" }}>{a.name}</div>
                {a.due && <div style={{ fontSize: 11, color: TEXT_MUTED }}>{a.due}</div>}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: TEXT_MUTED }}>{a.weight}%</span>
            </div>
          ))}
        </div>


        {/* Featured posts */}
        {featuredPosts.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Featured Posts</div>
            {featuredPosts.slice(0, 3).map((fp, i) => (
              <div key={i} style={{ ...crd, padding: 14, marginBottom: 8, borderLeft: "3px solid #d97706" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#d97706", marginBottom: 4 }}>{fp.boardTitle}</div>
                <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.5 }}>{fp.text.length > 200 ? fp.text.slice(0, 200) + "..." : fp.text}</div>
                <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4 }}>{fp.author}</div>
              </div>
            ))}
          </div>
        )}

        {/* Admin quick links */}
        {isAdmin && (
          <div style={{ ...crd, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Quick Links</div>
            {(data.adminLinks || []).map((link, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid " + BORDER }}>
                <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", fontWeight: 500, flex: 1 }}>{link.label}</a>
                <button onClick={async () => { const updated = { ...data, adminLinks: (data.adminLinks || []).filter((_, j) => j !== i) }; await saveData(updated); setData(updated); }} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, fontSize: 12 }}>x</button>
              </div>
            ))}
            {(!data.adminLinks || data.adminLinks.length === 0) && <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 6 }}>No links yet</div>}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <input id="c2-admin-link-label" placeholder="Label" style={{ ...inp, flex: 1, fontSize: 12 }} />
              <input id="c2-admin-link-url" placeholder="URL" style={{ ...inp, flex: 2, fontSize: 12 }} />
              <button onClick={async () => {
                const label = document.getElementById("c2-admin-link-label").value.trim();
                const url = document.getElementById("c2-admin-link-url").value.trim();
                if (!label || !url) return;
                const updated = { ...data, adminLinks: [...(data.adminLinks || []), { label, url }] };
                await saveData(updated); setData(updated);
                document.getElementById("c2-admin-link-label").value = "";
                document.getElementById("c2-admin-link-url").value = "";
              }} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", fontSize: 12 }}>Add</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── MY NOTES ─── */
function MyNotesView({ data, setData, isAdmin, userName }) {
  const studentNotes = data.studentNotes || {};
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [viewingStudent, setViewingStudent] = useState(null);
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

  // Admin: view all students' notes
  if (isAdmin && !viewingStudent) {
    const studentsWithNotes = data.students.filter(s => {
      const notes = studentNotes[s.name];
      return notes && notes.entries && notes.entries.length > 0;
    }).sort(lastSortObj);

    const studentsWithout = data.students.filter(s => {
      const notes = studentNotes[s.name];
      return !notes || !notes.entries || notes.entries.length === 0;
    }).sort(lastSortObj);

    return (
      <div style={{ padding: "24px 20px 40px", fontFamily: F }}>
        <Toast message={msg} />
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ ...sectionLabel, marginBottom: 16 }}>Student Notes</div>

          {studentsWithNotes.length === 0 && <div style={{ ...crd, padding: 20, textAlign: "center", color: TEXT_MUTED, fontSize: 14 }}>No students have written notes yet</div>}

          {studentsWithNotes.map(s => {
            const notes = studentNotes[s.name];
            const latest = notes.entries[0];
            return (
              <div key={s.id} onClick={() => setViewingStudent(s.name)} style={{ ...crd, padding: 14, marginBottom: 8, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: TEXT_MUTED }}>{notes.entries.length} note{notes.entries.length !== 1 ? "s" : ""}</span>
                </div>
                <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.4 }}>{latest.text.length > 100 ? latest.text.slice(0, 100) + "..." : latest.text}</div>
                <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>Last updated {new Date(latest.ts).toLocaleDateString()}</div>
              </div>
            );
          })}

          {studentsWithout.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 6 }}>No notes yet:</div>
              <div style={{ fontSize: 12, color: TEXT_MUTED, lineHeight: 1.6 }}>{studentsWithout.map(s => s.name.split(" ")[0]).join(", ")}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin viewing a specific student's notes
  if (isAdmin && viewingStudent) {
    const notes = studentNotes[viewingStudent] || { entries: [] };
    return (
      <div style={{ padding: "24px 20px 40px", fontFamily: F }}>
        <Toast message={msg} />
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <button onClick={() => setViewingStudent(null)} style={{ ...pillInactive, marginBottom: 16 }}>Back to All Notes</button>
          <div style={{ ...sectionLabel, marginBottom: 16 }}>{viewingStudent}'s Notes</div>
          {notes.entries.length === 0 && <div style={{ ...crd, padding: 20, textAlign: "center", color: TEXT_MUTED, fontSize: 14 }}>No notes yet</div>}
          {notes.entries.map(entry => (
            <div key={entry.id} style={{ ...crd, padding: 14, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: TEXT_SECONDARY }}>{new Date(entry.ts).toLocaleDateString()}</span>
                <button onClick={() => { if (window.confirm("Delete this note?")) deleteNote(viewingStudent, entry.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, fontSize: 12 }}>x</button>
              </div>
              <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{entry.text}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Student view: their own notes
  const myNotes = studentNotes[userName] || { entries: [] };

  return (
    <div style={{ padding: "24px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ ...sectionLabel }}>My Notes</div>
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
    </div>
  );
}


/* --- DISCUSSION BOARDS --- */
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

        {isAdmin && (creating || editingSurvey) && (
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
            <div key={board.id} onClick={() => { setViewingBoard(board.id); if (!myPost) setEditText(""); }} style={{ ...crd, padding: 16, marginBottom: 10, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>{board.title}</div>
                  <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4, lineHeight: 1.4 }}>{board.prompt.length > 100 ? board.prompt.slice(0, 100) + "..." : board.prompt}</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 6, fontSize: 12, color: TEXT_MUTED }}>
                    <span>{postCount} response{postCount !== 1 ? "s" : ""}</span>
                    {myPost && <span style={{ color: GREEN, fontWeight: 600 }}>You responded</span>}
                    {!myPost && <span style={{ color: ACCENT, fontWeight: 600 }}>Not yet responded</span>}
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2" style={{ flexShrink: 0, marginTop: 4 }}><path d="M9 18l6-6-6-6"/></svg>
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
export default function Comm2() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home");

  useEffect(() => {
    const handler = (e) => setView(e.detail);
    window.addEventListener("nav", handler);
    return () => window.removeEventListener("nav", handler);
  }, []);
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
        if (d && !d.submissions) { d.submissions = {}; await saveData(d); }
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
      <Nav view={view} setView={setView} isAdmin={effectiveAdmin} isGuest={isGuest} userName={testStudent || displayName} onLogout={() => { if (testStudent) { setTestStudent(null); return; } try { localStorage.removeItem(STORAGE_KEY + "-user"); } catch(e) {} setUserName(null); setView("home"); setStudentView(false); }} studentView={studentView} setStudentView={isAdmin ? setStudentView : null} courseTitle={data?.courseTitle} testStudent={testStudent} setTestStudent={isAdmin ? setTestStudent : null} allStudents={data ? data.students.filter(s => s.name !== "Andrew Ishak" && s.name !== "Bruce Willis").sort((a, b) => { const al = a.name.split(" ").slice(-1)[0]; const bl = b.name.split(" ").slice(-1)[0]; return al.localeCompare(bl); }) : []} />

      {view === "home" && !isGuest && <HomeView data={data} setData={setData} userName={effectiveUserName} isAdmin={effectiveAdmin} setView={setView} />}

      {view === "leaderboard" && <Leaderboard students={students} log={log} isAdmin={effectiveAdmin} userName={userName} data={data} setData={setData} />}
      {view === "todo" && !isGuest && <ToDoView data={data} setData={setData} userName={effectiveUserName} isAdmin={effectiveAdmin} />}
      {view === "schedule" && <ScheduleView data={data} setData={setData} isAdmin={effectiveAdmin} />}
      {view === "assignments" && <AssignmentsView data={data} setData={setData} isAdmin={effectiveAdmin} userName={effectiveUserName} />}
      {view === "media" && <MediaView data={data} setData={setData} isAdmin={effectiveAdmin} />}
      {view === "submit" && <SubmitView data={data} setData={setData} userName={effectiveUserName} />}
      {view === "answer" && <StudentAnswerView data={data} setData={setData} userName={effectiveUserName} />}
      {view === "accolades" && <Accolades data={data} />}
      {view === "survey" && <SurveyView data={data} setData={setData} isAdmin={effectiveAdmin} userName={effectiveUserName} />}
      {view === "mynotes" && <MyNotesView data={data} setData={setData} isAdmin={effectiveAdmin} userName={effectiveUserName} />}
      {view === "boards" && <BoardsView data={data} setData={setData} isAdmin={effectiveAdmin} userName={effectiveUserName} />}
      {view === "pti" && effectiveAdmin && <PTIView data={data} setData={setData} />}
      {view === "activities" && effectiveAdmin && <GameAdmin data={data} setData={setData} />}
      {view === "roster" && <RosterView data={data} setData={setData} userName={effectiveUserName} />}
      {view === "admin" && effectiveAdmin && <AdminPanel data={data} setData={setData} />}
      {view === "gradebook" && effectiveAdmin && <Gradebook data={data} setData={setData} isAdmin={true} userName={effectiveUserName} />}
    </div>
  );
}
