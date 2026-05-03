import React, { useState, useEffect, useCallback, useRef } from "react";
import { AssignmentsView, Gradebook, GradingInbox, DEFAULT_ASSIGNMENTS as _DA } from "./Grades4.jsx";
import { GameAdmin, StudentAnswerView, Accolades } from "./GameSystem4.jsx";
import {
  useTheme, THEMES, THEME_LABELS, THEME_DESCS,
  themedPageBg, themedHeadingFont, themedAccent,
  themedInteriorCrd, CRASHING_PALETTE,
  PixelStar, PixelArrow, PixelHeart, PixelMushroom, PixelCoin, PixelLightning,
  TRASH_TALK, ENCOURAGEMENT, randomChampionshipLine,
  THEME_KEYFRAMES_CSS,
} from "./theme.jsx";

const STORAGE_KEY = "comm4-v1";

const DEFAULT_ASSIGNMENTS = [
  { id: "idea_gen", name: "Group Project #1: Idea Generation", weight: 10, due: "Apr 24", link: "", notes: "" },
  { id: "references", name: "Group Project #2: References", weight: 10, due: "May 1", link: "", notes: "" },
  { id: "synthesis", name: "Group Project #3: Article Synthesis", weight: 10, due: "May 22", link: "", notes: "" },
  { id: "presentation", name: "Final Presentation/Project", weight: 25, due: "Jun 1", link: "", notes: "" },
  { id: "peer_eval", name: "Peer Evaluation", weight: 10, due: "Jun 8", link: "", notes: "" },
  { id: "final_reflection", name: "Final Reflection", weight: 10, due: "Jun 8", link: "", notes: "" },
  { id: "participation", name: "Participation", weight: 25, due: "", link: "", notes: "Weekly Game, Around the Horn, Rotating Fishbowl" },
];

const POINT_SOURCES = ["Weekly Game","Assignment","Participation","Bonus","Other"];

const TEAM_COLORS = [
  { accent: "#2563eb", bg: "#eff6ff" },
  { accent: "#dc2626", bg: "#fef2f2" },
  { accent: "#059669", bg: "#ecfdf5" },
  { accent: "#d97706", bg: "#fffbeb" },
  { accent: "#7c3aed", bg: "#f5f3ff" },
  { accent: "#0891b2", bg: "#ecfeff" },
  { accent: "#db2777", bg: "#fdf2f8" },
  { accent: "#65a30d", bg: "#f7fee7" },
];

const MISMATCHED_NAMES = ["New York Cowboys","Dallas Sharks","Miami Penguins","Phoenix Mariners","Detroit Flamingos","Las Vegas Moose","Oakland Sports Team"];

const ALL_STUDENTS = [
  "Zoe Alpert","Vianna Alvarez","Charlotte Arvia","Drew Barreto",
  "Carter Bussi","Lola Byrnes","Elizabeth Cerrato","Kelly Cho",
  "Ava da Cunha","Santino Rafael Diaz","Adrieana Diokno","Destin Emmert",
  "Adriana Esguerra","Junhao Fei","Aleksandar Gavalyugov","Sienna Gilbert",
  "Angelina Graf","Fiona Hanley","Finn Ingalls","Penelope Legnani",
  "Addison Marshak","August Mendell","Marissa Miller","Phoebe Young",
  "Mikey Purtell","Kalia Schempp","Diego Silva","Nogbou Chris Junior Tadjo",
  "Jiesi Tong","Andreas Wanebo","Edward Yardley",
];

const DEFAULT_SCHEDULE = [
  { week: 1, label: "What Do You Know?", theme: "Introduction to Research", question: "How do we know what we know?", dates: [
    { date: "Mar 30", day: "Mon", topic: "Introduction. In-class survey activity.", assignment: "", notes: "" },
    { date: "Apr 1", day: "Wed", topic: "What is research? How do we know what we know?", assignment: "", notes: "" },
    { date: "Apr 3", day: "Fri", topic: "Conduct your own mini-studies", assignment: "", notes: "ASYNC", fri: true },
  ]},
  { week: 2, label: "Epistemology", theme: "Practices & Foundations", question: "What is truth?", dates: [
    { date: "Apr 6", day: "Mon", topic: "Epistemology, what is truth", assignment: "", notes: "Read: Chapter 1" },
    { date: "Apr 8", day: "Wed", topic: "Discuss student studies in class", assignment: "", notes: "", activities: ["Game"] },
    { date: "Apr 10", day: "Fri", topic: "", assignment: "", notes: "ASYNC. Read: Chapter 2", fri: true },
  ]},
  { week: 3, label: "Quant & Qual", theme: "Understanding Studies", question: "What's the difference between quantitative and qualitative research?", dates: [
    { date: "Apr 13", day: "Mon", topic: "How to read a quantitative article", assignment: "", notes: "Read: Chapter 4 (part 1)" },
    { date: "Apr 15", day: "Wed", topic: "How to read a qualitative article", assignment: "", notes: "Read: Chapter 5 (part 1)", activities: ["Game"] },
    { date: "Apr 17", day: "Fri", topic: "", assignment: "", notes: "Good Friday", holiday: true },
  ]},
  { week: 4, label: "Finding Research", theme: "Library & APA Style", question: "How do you find and evaluate research?", dates: [
    { date: "Apr 20", day: "Mon", topic: "Library workshop. Finding and evaluating articles.", assignment: "", notes: "" },
    { date: "Apr 22", day: "Wed", topic: "Exploring different types of articles. APA style.", assignment: "", notes: "", activities: ["Game"] },
    { date: "Apr 24", day: "Fri", topic: "", assignment: "Group Project #1: Idea Generation due", notes: "ASYNC", fri: true },
  ]},
  { week: 5, label: "Critical Methods", theme: "Rhetorical Analysis", question: "How do we analyze messages and meaning?", dates: [
    { date: "Apr 27", day: "Mon", topic: "How to read a critical/rhetorical article", assignment: "", notes: "Read: Chapter 6 (part 1)" },
    { date: "Apr 29", day: "Wed", topic: "Discuss: Neugarten, Ted Lasso article", assignment: "", notes: "", activities: ["Game"] },
    { date: "May 1", day: "Fri", topic: "Workshop / activity", assignment: "Group Project #2: References due", notes: "IN PERSON" },
  ]},
  { week: 6, label: "Connecting", theme: "Methods & Synthesis", question: "How do different methods connect?", dates: [
    { date: "May 4", day: "Mon", topic: "Research synthesis, argument building, triangulation", assignment: "", notes: "Read: Boylorn article" },
    { date: "May 6", day: "Wed", topic: "Connecting methods", assignment: "", notes: "Read: Rea Cottom article", activities: ["Game"] },
    { date: "May 8", day: "Fri", topic: "", assignment: "", notes: "ASYNC", fri: true },
  ]},
  { week: 7, label: "Creative Work", theme: "TBD", question: "", dates: [
    { date: "May 11", day: "Mon", topic: "TBD", assignment: "", notes: "" },
    { date: "May 13", day: "Wed", topic: "TBD", assignment: "", notes: "", activities: ["Game"] },
    { date: "May 15", day: "Fri", topic: "", assignment: "", notes: "ASYNC", fri: true },
  ]},
  { week: 8, label: "Ethics", theme: "Ethics in Research", question: "What are our responsibilities as researchers?", dates: [
    { date: "May 18", day: "Mon", topic: "Ethics, studying humans", assignment: "", notes: "Read: Chapter 3" },
    { date: "May 20", day: "Wed", topic: "APA style and plagiarism", assignment: "", notes: "", activities: ["Game"] },
    { date: "May 22", day: "Fri", topic: "", assignment: "Group Project #3: Article Synthesis due", notes: "ASYNC. Long weekend, no Friday assignment.", fri: true },
  ]},
  { week: 9, label: "Communicating", theme: "About Research", question: "How do you present findings?", dates: [
    { date: "May 25", day: "Mon", topic: "", assignment: "", notes: "MEMORIAL DAY", holiday: true },
    { date: "May 27", day: "Wed", topic: "How to present findings", assignment: "", notes: "Read: Chapter 7", activities: ["Game"] },
    { date: "May 29", day: "Fri", topic: "Group prep / workshop", assignment: "", notes: "IN PERSON" },
  ]},
  { week: 10, label: "Presentations", theme: "Demonstrating Your Knowledge", question: "", dates: [
    { date: "Jun 1", day: "Mon", topic: "Group presentations", assignment: "", notes: "" },
    { date: "Jun 3", day: "Wed", topic: "Group presentations", assignment: "", notes: "" },
    { date: "Jun 5", day: "Fri", topic: "Final presentations or wrap-up", assignment: "", notes: "IN PERSON" },
  ]},
  { week: 11, label: "Finals", theme: "", question: "", dates: [
    { date: "Jun 8+", day: "Finals", topic: "Peer Evaluations and Final Reflection due", assignment: "Peer Evaluation due, Final Reflection due", notes: "" },
  ]},
];

const ACCENT = "#059669";
const ACCENT_LIGHT = "#d1fae5";
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

// Load Outfit
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
// Responsive grid + animations
if (typeof document !== "undefined" && !document.getElementById("comm4-responsive")) {
  const style = document.createElement("style");
  style.id = "comm4-responsive";
  style.textContent = `
    .schedule-days { grid-template-columns: 1fr !important; }
    .home-grid { grid-template-columns: 1fr !important; }
    @media (min-width: 700px) { .schedule-days { grid-template-columns: repeat(3, 1fr) !important; } }
    @media (min-width: 700px) { .schedule-days[data-cols="2"] { grid-template-columns: repeat(2, 1fr) !important; } }
    @media (min-width: 700px) { .home-grid { grid-template-columns: 1fr 1fr !important; } }
    @keyframes tickerPulse { 0% { transform: scale(1.15); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
    @keyframes livePulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }
  `;
  document.head.appendChild(style);
}

const crd = { background: "#fff", borderRadius: 14, border: "1px solid #d1d5db", overflow: "hidden", boxShadow: "0 1px 3px rgba(17, 24, 39, 0.08), 0 1px 2px rgba(17, 24, 39, 0.04)" };
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
function lastName(name) { if (name === "Ava da Cunha") return "da Cunha"; if (name === "Nogbou Chris Junior Tadjo") return "Tadjo"; if (name === "Anne Sephora Pohan") return "Pohan"; if (name === "Santino Rafael Diaz") return "Diaz"; return name.split(" ").slice(-1)[0]; }
function lastSort(a, b) { return lastName(a).localeCompare(lastName(b)); }
function lastSortObj(a, b) { return lastName(a.name).localeCompare(lastName(b.name)); }
function tp(team, students, log) { const ids = students.filter(s => s.teamId === team.id).map(s => s.id); return log.filter(e => ids.includes(e.studentId)).reduce((s, e) => s + e.amount, 0); }
function rs(students, log) { return students.map(s => ({ ...s, points: gp(log, s.id) })).sort((a, b) => b.points - a.points); }
function rt(teams, students, log) { return teams.map(t => ({ ...t, points: tp(t, students, log) })).sort((a, b) => b.points - a.points); }

// Weekly snake draft: round 1 forward, rounds 2+ reverse
function shuffleTeams(students, log, teams) {
  if (!teams || teams.length === 0) return students;
  const ranked = rs(students, log);
  const numTeams = teams.length;
  const assignments = {};
  teams.forEach(t => { assignments[t.id] = []; });
  const teamOrder = teams.map(t => t.id);

  ranked.forEach((s, idx) => {
    const round = Math.floor(idx / numTeams);
    const pos = idx % numTeams;
    const teamIdx = round === 0 ? pos : (numTeams - 1 - pos);
    assignments[teamOrder[teamIdx]].push(s.id);
  });

  return students.map(s => {
    const tid = Object.keys(assignments).find(tid => assignments[tid].includes(s.id));
    return { ...s, teamId: tid || s.teamId };
  });
}

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

/* ─── NAV ─── */
function Nav({ view, setView, isAdmin, isGuest, userName, onLogout, studentView, setStudentView, courseTitle, testStudent, setTestStudent, allStudents, activitiesLive }) {
  // Student-visible
  const studentTabs = [
    { id: "home", label: "Home", guest: false },
    { id: "schedule", label: "Schedule", guest: true },
    { id: "assignments", label: "Assignments", guest: false },
    { id: "activities", label: "Live", guest: false },
    { id: "more", label: "More", guest: false },
  ];
  // Admin extras (after More)
  const adminTabs = [
    { id: "pti", label: "Around the Horn" },
    { id: "inclassadmin", label: "In-Class Admin" },
    { id: "grades", label: "Gradebook" },
    { id: "grading", label: "Grading" },
    { id: "todo", label: "To-Do" },
    { id: "admin", label: "Admin" },
  ];
  const visibleStudent = studentTabs.filter(t => !isGuest || t.guest);
  return (
    <div style={{ background: "#fff", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid " + BORDER }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ background: ACCENT, color: "#fff", padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 800, fontFamily: F, letterSpacing: "-0.01em" }}>{courseTitle || "Comm Research"}</div>
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
        <a href="https://camino.instructure.com/courses/117721" target="_blank" rel="noopener noreferrer" style={{ ...linkPill, fontSize: 11 }}>
          Camino <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
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

/* ─── NAME PICKER (front page) ─── */
const ADMIN_NAME = "Andrew Ishak";
const GUEST_NAME = "__guest__";
const TEST_STUDENT = "Bruce Willis";

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
      onSelect(selected);
      return;
    }
    const student = data.students.find(s => s.name === selected);
    if (!student) return;
    const correctPin = pins[student.id];
    if (correctPin && pin !== String(correctPin)) {
      setError("Wrong PIN"); setPin(""); return;
    }
    if (remember) { try { localStorage.setItem(STORAGE_KEY + "-user", selected); } catch(e) {} }
    onSelect(selected);
  };

  if (selected) {
    return (
      <div style={{ minHeight: "100vh", background: "#fafaf9", color: TEXT_PRIMARY, fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ maxWidth: 360, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: ACCENT, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <span style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>4</span>
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
            <span style={{ color: "#fff", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>4</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>COMM 4 · Spring 2026</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.02em", lineHeight: 1.15 }}>{data?.courseTitle || "Approaches to Communication Research"}</div>
          <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 6 }}>MWF 11:45 am to 12:50 pm · Lucas 207</div>
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
        }}>
          Continue as guest
        </button>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: TEXT_MUTED }}>aishak@scu.edu</div>
      </div>
    </div>
  );
}

/* ─── INSTRUCTOR CARD ─── */
const REBOUND_POLICY = `You can earn additional points after a low (or missing) score in some cases. Here are three different situations that might apply to you.

Rebound: You were present but scored below 80% on the grade scale. Submit a video within 72 hours explaining the material with a friend or family member. Points count for your grade only, not the in-class leaderboard.
  Under 50% -> can earn back to 60%
  50-65% -> can earn back to 70%
  66-79% -> can earn back to 80%

Planned Makeup: You told me about your absence ahead of time and I asked you to come to office hours for a makeup. Retake the activity live during office hours within one week. Full points available for both leaderboard and grade.

Unannounced Absence: You missed without notice. By default, no makeup is available.`;

const HOME_GRADE_PTS = { on_topic: 15, extra: 2.5 };

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
    setEditCourseTitle(data.courseTitle || "Approaches to Communication Research");
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
      await fetch("https://ybuchgebudixbyrcxpik.supabase.co" + "/storage/v1/object/class-photos/" + path, { method: "POST", headers: { "Authorization": "Bearer " + "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidWNoZ2VidWRpeGJ5cmN4cGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0Nzg3OTIsImV4cCI6MjA4ODA1NDc5Mn0.aF2M_fj6bVYKw-Tz1XxI9SiQB7lAtWzuhBRZbsai8QY", "x-upsert": "true" }, body: formData });
      const url = "https://ybuchgebudixbyrcxpik.supabase.co" + "/storage/v1/object/public/class-photos/" + path + "?t=" + Date.now();
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
      await fetch("https://ybuchgebudixbyrcxpik.supabase.co" + "/storage/v1/object/class-photos/" + path, { method: "POST", headers: { "Authorization": "Bearer " + "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidWNoZ2VidWRpeGJ5cmN4cGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0Nzg3OTIsImV4cCI6MjA4ODA1NDc5Mn0.aF2M_fj6bVYKw-Tz1XxI9SiQB7lAtWzuhBRZbsai8QY", "x-upsert": "true" }, body: formData });
      const url = "https://ybuchgebudixbyrcxpik.supabase.co" + "/storage/v1/object/public/class-photos/" + path + "?t=" + Date.now();
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

/* ─── SCHEDULE ─── */

/* ─── HOME DASHBOARD ─── */
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

function InClassView({ data, setData, isAdmin, userName }) {
  const student = data.students.find(s => s.name === userName);
  const studentId = student?.id;
  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Weekly Game (live + past games) */}
        <div style={{ marginBottom: 32 }}>
          <StudentAnswerView data={data} setData={setData} userName={userName} />
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 8 }}>Past Weekly Games</div>
            <PastGamesReview data={data} studentId={studentId} filter="game" />
          </div>
        </div>

        {/* Headlines */}
        <div style={{ marginBottom: 32 }}>
          <ClassTools data={data} setData={setData} isAdmin={isAdmin} userName={userName} />
        </div>

        {/* Survey */}
        <div style={{ marginBottom: 32 }}>
          <SurveyView data={data} setData={setData} isAdmin={isAdmin} userName={userName} />
        </div>

        {/* This or That - past activities only */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...sectionLabel, marginBottom: 10 }}>This or That</div>
          <PastGamesReview data={data} studentId={studentId} filter="tot" />
        </div>
      </div>
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
      // Hide if a rebound grade has already been entered for this student/week
      if (type === "game" && (data.reboundGrades || {})[studentId + "-game-" + w]) return;
      // Skip if student has hidden this rebound
      if ((data.hiddenRebounds || {})[studentId + "-" + rKey]) return;
      const scoredTs = rd.scoredTs || 0;
      const reboundDeadline = scoredTs + 72 * 60 * 60 * 1000;
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

      // Determine effective status: explicit status wins, otherwise auto-rebound for weekly games where student played and scored below 80%
      let status = ss.status || "";
      if (!status && type === "game" && gradePercent > 0 && gradePercent < 80) {
        status = "rebound";
      }
      if (!status || status === "present") return;

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
    showMsg("Added to your to-do list");
  };

  const hideBox = async (rKey) => {
    const hKey = studentId + "-" + rKey;
    const newHidden = { ...(data.hiddenRebounds || {}), [hKey]: true };
    // Also remove the opt-in todo if it exists
    const newChecks = { ...todoChecks };
    delete newChecks["optin-" + rKey + "-" + studentId];
    const updated = { ...data, hiddenRebounds: newHidden, todoChecks: newChecks };
    await saveData(updated); setData(updated);
    showMsg("Removed");
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: sc.color }}>
                  {item.status === "planned_makeup" ? "Planned Makeup" : item.status === "unannounced" ? "Makeup Unavailable" : item.status === "submitted" ? "Rebound Submitted" : "Rebound Available"}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginTop: 2 }}>{item.label}</div>
              </div>
              {/* Prominent time badge */}
              {isRebound && (
                <div style={{ background: sc.border, color: "#fff", padding: "8px 14px", borderRadius: 10, textAlign: "center", flexShrink: 0, minWidth: 80 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{item.hoursLeft}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>hours left</div>
                </div>
              )}
              {item.status === "planned_makeup" && (
                <div style={{ background: sc.border, color: "#fff", padding: "8px 14px", borderRadius: 10, textAlign: "center", flexShrink: 0, minWidth: 80 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{item.daysLeft}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>days left</div>
                </div>
              )}
            </div>

            {isRebound && (
              <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.6, marginTop: 6, marginBottom: 8 }}>
                <p style={{ margin: 0, marginBottom: 8, fontWeight: 600, color: TEXT_PRIMARY }}>You have an opportunity to earn back some of the points that you did not earn during this week's game.</p>
                <p style={{ margin: 0, marginBottom: 8 }}>You earned a <strong>{item.gradePercent}%</strong>. I want you to get a strong grade in this class, so for this assignment, you can earn up to <strong>{item.targetPercent}%</strong> by submitting a video of you explaining material.</p>
                <p style={{ margin: 0, marginBottom: 8 }}>Here are the instructions: find the On Topic or Reading questions that you did not answer correctly. Go back and make sure you understand them, and then record yourself teaching the material behind these questions to a friend, roommate, teacher, or family member. Your video should show that you have good understanding of this material. Then, submit your url at the link below.</p>
                <p style={{ margin: 0 }}>These points count for <strong>your grade only</strong>, not the in-class leaderboard. You have <strong>{item.hoursLeft} hours</strong> left to submit.</p>
              </div>
            )}

            {isRebound && (
              <div style={{ marginBottom: 8 }}>
                <button onClick={() => { const ev = new CustomEvent("nav", { detail: "inclass" }); window.dispatchEvent(ev); }} style={{ fontSize: 12, color: ACCENT, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontWeight: 600, padding: 0, marginBottom: 8, display: "block" }}>View your answers and the correct answers</button>
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={links[item.rKey] || ""} onChange={e => setLinks(prev => ({ ...prev, [item.rKey]: e.target.value }))} placeholder="Paste your video link here..." style={{ ...inp, flex: 1, fontSize: 13 }} />
                  <button onClick={() => submitLink(item.rKey)} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", fontSize: 12 }}>Submit</button>
                </div>
              </div>
            )}

            {/* Action buttons: rebound */}
            {isRebound && (
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                {!item.optedIn && (
                  <button onClick={() => optIn(item.rKey)} style={{ ...pill, background: "#f59e0b", color: "#fff", fontSize: 12, flex: 1 }}>Add to my to-do list</button>
                )}
                <button onClick={() => { if (window.confirm("Decline this rebound opportunity? The box will be removed.")) hideBox(item.rKey); }} style={{ ...pill, background: "#fff", color: TEXT_SECONDARY, border: "1px solid " + BORDER, fontSize: 12, flex: 1 }}>Decline opportunity</button>
              </div>
            )}

            {/* Action buttons: planned makeup */}
            {item.status === "planned_makeup" && (
              <div>
                <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.6, marginTop: 4, marginBottom: 8 }}>Come to office hours to retake this activity. Full points available for both leaderboard and grade.</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {!item.optedIn && (
                    <button onClick={() => optIn(item.rKey)} style={{ ...pill, background: "#10b981", color: "#fff", fontSize: 12, flex: 1 }}>Add to my to-do list</button>
                  )}
                  <button onClick={() => { if (window.confirm("Mark this makeup as completed? The box will be removed.")) hideBox(item.rKey); }} style={{ ...pill, background: "#fff", color: TEXT_SECONDARY, border: "1px solid " + BORDER, fontSize: 12, flex: 1 }}>Completed</button>
                </div>
              </div>
            )}

            {item.status === "submitted" && <div style={{ fontSize: 13, color: GREEN, fontWeight: 600 }}>Your rebound video has been submitted. Waiting for instructor review.</div>}
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
  const { theme, cycleTheme } = useTheme(STORAGE_KEY);

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
  if (liveActivity) cards.push("live");
  cards.push("assignments", "schedule", "boards");
  if (!liveActivity) cards.push("live"); // Live appears at position 4 when nothing's live
  cards.push("leaderboard", "roster");

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
        <button key="live" onClick={() => setView("activities")} style={{ width: "100%", textAlign: "left", background: live ? "#ecfdf5" : "#fff", border: live ? "1px solid #6ee7b7" : "1px solid #d1d5db", borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer", fontFamily: F, boxShadow: "0 1px 3px rgba(17, 24, 39, 0.08), 0 1px 2px rgba(17, 24, 39, 0.04)" }}>
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
        <button key="assignments" onClick={() => setView("assignments")} style={{ width: "100%", textAlign: "left", background: "#fff", border: "1px solid #d1d5db", borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer", fontFamily: F, boxShadow: "0 1px 3px rgba(17, 24, 39, 0.08), 0 1px 2px rgba(17, 24, 39, 0.04)" }}>
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
        <button key="schedule" onClick={() => setView("schedule")} style={{ width: "100%", textAlign: "left", background: "#fff", border: "1px solid #d1d5db", borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer", fontFamily: F, boxShadow: "0 1px 3px rgba(17, 24, 39, 0.08), 0 1px 2px rgba(17, 24, 39, 0.04)" }}>
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
        <button key="boards" onClick={() => setView("boards")} style={{ width: "100%", textAlign: "left", background: "#fff", border: "1px solid #d1d5db", borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer", fontFamily: F, boxShadow: "0 1px 3px rgba(17, 24, 39, 0.08), 0 1px 2px rgba(17, 24, 39, 0.04)" }}>
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
    if (name === "leaderboard") {
      const openBtnStyle = {
        fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 8,
        border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_PRIMARY,
        cursor: "pointer", fontFamily: F, flexShrink: 0,
      };
      return (
        <button key="leaderboard" onClick={() => setView("leaderboard")} style={{ width: "100%", textAlign: "left", background: "#fff", border: "1px solid #d1d5db", borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer", fontFamily: F, boxShadow: "0 1px 3px rgba(17, 24, 39, 0.08), 0 1px 2px rgba(17, 24, 39, 0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 18, fontWeight: 500, color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>Leaderboard</div>
            <span style={openBtnStyle}>Open</span>
          </div>
          {isStudent && myRank >= 0 ? (
            <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>You're #{myRank + 1} of {totalStudents}</div>
          ) : (
            <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>Class standings</div>
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
        <button key="roster" onClick={() => setView("roster")} style={{ width: "100%", textAlign: "left", background: "#fff", border: "1px solid #d1d5db", borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer", fontFamily: F, boxShadow: "0 1px 3px rgba(17, 24, 39, 0.08), 0 1px 2px rgba(17, 24, 39, 0.04)" }}>
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
    <div style={{ padding: "20px 20px 40px", fontFamily: themedHeadingFont(theme, F) }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {renderNewsBanner()}
        {cards.map(renderCard)}
        <InstructorCard data={data} setData={setData} isAdmin={isAdmin} />

        {/* Theme picker — bottom of home */}
        <button onClick={cycleTheme} style={(() => {
          const base = { width: "100%", textAlign: "left", marginTop: 20, cursor: "pointer", fontFamily: themedHeadingFont(theme, F), padding: 14 };
          if (theme === "locked") {
            return { ...base, background: "#1f2937", color: "#fff", border: "2px solid #1f2937", borderRadius: 12, boxShadow: "inset 0 -4px 0 #dc2626, 0 6px 16px rgba(17, 24, 39, 0.25)" };
          }
          if (theme === "crashing") {
            return { ...base, background: "linear-gradient(135deg, #ec4899, #f59e0b, #0ea5e9, #a855f7)", color: "#fff", border: "4px solid #1f2937", borderRadius: 14, boxShadow: "6px 6px 0 #1f2937", transform: "rotate(-1deg)", padding: 18 };
          }
          return { ...base, background: "#fff", color: TEXT_PRIMARY, border: "1px solid #d1d5db", borderRadius: 14, boxShadow: "0 1px 3px rgba(17, 24, 39, 0.08), 0 1px 2px rgba(17, 24, 39, 0.04)" };
        })()}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.75, marginBottom: 4 }}>Theme</div>
              <div style={{
                fontSize: theme === "crashing" ? 24 : (theme === "locked" ? 22 : 18),
                fontWeight: theme === "crashing" ? 400 : (theme === "locked" ? 400 : 500),
                letterSpacing: theme === "locked" ? "0.04em" : "-0.01em",
                lineHeight: 1.1,
                textTransform: theme === "locked" ? "uppercase" : "none",
              }}>{THEME_LABELS[theme]}</div>
            </div>
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              {THEMES.map(t => (
                <span key={t} style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: t === theme ? (theme === "crashing" ? "#fff" : (theme === "locked" ? "#fff" : ACCENT)) : "rgba(0,0,0,0.15)",
                  border: t === theme ? "none" : (theme === "clean" ? "1px solid #d1d5db" : "none"),
                }} />
              ))}
            </div>
          </div>
        </button>
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
                border: "1px solid " + (isCurrent ? ACCENT + "55" : "#d1d5db"),
                borderRadius: 14,
                overflow: "hidden",
                opacity: isHidden ? 0.6 : 1,
                boxShadow: isCurrent ? "0 0 0 1px " + ACCENT + "33, 0 2px 6px rgba(17, 24, 39, 0.08)" : "0 1px 3px rgba(17, 24, 39, 0.08), 0 1px 2px rgba(17, 24, 39, 0.04)",
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
function getWeekBounds() {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 7);
  return { start: mon.getTime(), end: sun.getTime() };
}

function Leaderboard({ students, log, teams, isAdmin, userName, data, setData }) {
  const ranked = rs(students, log);
  const mx = ranked.length > 0 ? Math.max(ranked[0].points, 1) : 1;
  const [showAll, setShowAll] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [editingExplain, setEditingExplain] = useState(false);
  const [explainText, setExplainText] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  // Use fixed team assignments (project groups)
  const visible = showAll ? ranked : ranked.slice(0, 10);
  const myRank = ranked.findIndex(s => s.name === userName);
  const meInVisible = myRank >= 0 && myRank < visible.length;
  const meData = myRank >= 0 ? ranked[myRank] : null;

  // This week's leaderboard data computed below from existing weekPoints

  const customExplain = data?.leaderboardExplain;
  const defaultExplain = "Earn points through the weekly game, Around the Horn, and Rotating Fishbowl.";
  const explainContent = customExplain || defaultExplain;

  const saveExplain = async () => {
    const updated = { ...data, leaderboardExplain: explainText };
    await saveData(updated); if (setData) setData(updated);
    setEditingExplain(false);
  };

  const stars = data?.fishbowlStars || {};
  const starCounts = {};
  Object.values(stars).forEach(sid => { if (sid) starCounts[sid] = (starCounts[sid] || 0) + 1; });
  const bios = data?.bios || {};

  // Animation: track previous order
  const prevOrderRef = useRef([]);
  const [animOffsets, setAnimOffsets] = useState({});
  const ROW_HEIGHT = 108;

  useEffect(() => {
    const prevOrder = prevOrderRef.current;
    const currOrder = ranked.map(s => s.id);
    if (prevOrder.length > 0 && prevOrder.length === currOrder.length) {
      const offsets = {};
      let hasChange = false;
      currOrder.forEach((id, newIdx) => {
        const oldIdx = prevOrder.indexOf(id);
        if (oldIdx !== -1 && oldIdx !== newIdx) {
          offsets[id] = (oldIdx - newIdx) * ROW_HEIGHT;
          hasChange = true;
        }
      });
      if (hasChange) {
        setAnimOffsets(offsets);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { setAnimOffsets({}); });
        });
      }
    }
    prevOrderRef.current = currOrder;
  }, [ranked.map(s => s.id + s.points).join(",")]); // eslint-disable-line

  // Weekly stats
  const { start: weekStart, end: weekEnd } = getWeekBounds();
  const weekLog = log.filter(e => e.ts >= weekStart && e.ts < weekEnd);
  const weekPoints = {};
  weekLog.forEach(e => { weekPoints[e.studentId] = (weekPoints[e.studentId] || 0) + e.amount; });
  const weekRanked = students.map(s => ({ ...s, points: weekPoints[s.id] || 0 })).filter(s => s.points > 0).sort((a, b) => b.points - a.points).slice(0, 10);

  // Last week's rankings for movement
  const lastWeekLog = log.filter(e => e.ts < weekStart);
  const lastWeekRanked = students.map(s => ({ ...s, points: lastWeekLog.filter(e => e.studentId === s.id).reduce((t, e) => t + e.amount, 0) })).sort((a, b) => b.points - a.points);
  const lastWeekRankMap = {};
  lastWeekRanked.forEach((s, i) => { lastWeekRankMap[s.id] = i; });

  const getMotto = (sid) => {
    const bio = bios[sid];
    if (bio?.favTeam) return bio.favTeam;
    let hash = 0;
    for (let i = 0; i < sid.length; i++) hash = ((hash << 5) - hash) + sid.charCodeAt(i);
    return DEFAULT_MOTTOS[Math.abs(hash) % DEFAULT_MOTTOS.length];
  };

  const renderRow = (s, i, isMe, isGhost) => {
    const shuffled = shuffledStudents.find(st => st.id === s.id);
    const team = teams.find(t => t.id === (shuffled?.teamId || s.teamId));
    const tc = team ? TEAM_COLORS[team.colorIdx] : TEAM_COLORS[0];
    const inA = i < 5;
    const bio = bios[s.id] || {};
    const initials = s.name.split(" ").map(n => n[0]).join("");
    const wp = weekPoints[s.id] || 0;
    const lastRank = lastWeekRankMap[s.id];
    const movement = lastRank !== undefined ? lastRank - i : 0;
    const offset = animOffsets[s.id] || 0;
    const isExpanded = expandedId === s.id;

    const breakdown = {};
    log.filter(e => e.studentId === s.id).forEach(e => {
      const src = e.source || "Other";
      breakdown[src] = (breakdown[src] || 0) + e.amount;
    });
    const breakdownEntries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

    const rankColor = inA ? "#d4a017" : TEXT_MUTED;

    return (
      <div key={s.id + (isGhost ? "-ghost" : "")} style={{
        borderRadius: 12, marginBottom: 6, background: isMe ? ACCENT + "0d" : "#fff",
        border: isGhost ? "2px dashed #93c5fd" : "1px solid " + (isMe ? ACCENT + "40" : BORDER),
        transform: offset ? "translateY(" + offset + "px)" : "none",
        transition: offset ? "none" : "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        zIndex: offset > 0 ? 10 : offset < 0 ? 0 : 1,
      }}>
        <button onClick={() => setExpandedId(isExpanded ? null : s.id)} style={{
          width: "100%", textAlign: "left", background: "transparent", border: "none",
          display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer", fontFamily: F,
        }}>
          <div style={{ width: 22, textAlign: "right", fontSize: 13, fontWeight: 600, color: rankColor, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{i + 1}</div>
          {bio.photo ? (
            <img src={bio.photo} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, color: "#fff", flexShrink: 0 }}>{initials}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY }}>{s.name}</span>
              {starCounts[s.id] > 0 && <span style={{ fontSize: 11, color: "#d97706" }}>{Array(starCounts[s.id]).fill("\u2733").join("")}</span>}
              {isMe && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", background: ACCENT + "1a", color: ACCENT, borderRadius: 4, letterSpacing: "0.06em" }}>YOU</span>}
              {inA && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", background: "#fef3c7", color: "#854d0e", borderRadius: 4, letterSpacing: "0.06em" }}>A ZONE</span>}
            </div>
            {(team || wp > 0 || movement !== 0) && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                {team && !data?.teamsHidden && <span style={{ fontSize: 11, color: tc.accent, fontWeight: 500 }}>{team.name}</span>}
                {wp > 0 && <span style={{ fontSize: 11, color: GREEN, fontWeight: 500 }}>+{wp} this wk</span>}
                {movement > 0 && <span style={{ fontSize: 11, color: GREEN, fontWeight: 500 }}>&#9650;{movement}</span>}
                {movement < 0 && <span style={{ fontSize: 11, color: RED, fontWeight: 500 }}>&#9660;{Math.abs(movement)}</span>}
              </div>
            )}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 4 }}>
            <div style={{ fontSize: 18, fontWeight: 500, color: TEXT_PRIMARY, fontVariantNumeric: "tabular-nums", lineHeight: 1, letterSpacing: "-0.01em" }}>{s.points}</div>
            <div style={{ fontSize: 9, color: TEXT_MUTED, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>pts</div>
          </div>
        </button>
        {isExpanded && (
          <div style={{ padding: "0 14px 12px 44px", borderTop: "1px solid " + BORDER }}>
            <div style={{ ...sectionLabel, marginTop: 8, marginBottom: 4 }}>Breakdown</div>
            {breakdownEntries.length === 0 && <div style={{ fontSize: 12, color: TEXT_MUTED, fontStyle: "italic" }}>No points yet.</div>}
            {breakdownEntries.map(([src, pts]) => (
              <div key={src} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", fontSize: 12 }}>
                <span style={{ color: TEXT_SECONDARY }}>{src}</span>
                <span style={{ fontWeight: 500, color: pts > 0 ? TEXT_PRIMARY : RED, fontVariantNumeric: "tabular-nums" }}>{pts > 0 ? "+" : ""}{pts}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
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

        {/* Side-by-side leaderboards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>

          <div>
            <div style={{ ...sectionLabel, marginBottom: 8 }}>Class Leaderboard</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#d4a017", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, paddingLeft: 2 }}>A Zone</div>
            {visible.map((s, i) => renderRow(s, i, s.name === userName, false))}
            {!meInVisible && meData && !showAll && (
              <div style={{ marginTop: 12 }}>
                <div style={{ ...sectionLabel, textAlign: "center", marginBottom: 6 }}>Only visible to you</div>
                {renderRow(meData, myRank, true, true)}
              </div>
            )}
            {isAdmin && ranked.length > 10 && (
              <div style={{ textAlign: "center", marginTop: 12 }}>
                <button onClick={() => setShowAll(!showAll)} style={showAll ? pillActive : pillInactive}>
                  {showAll ? "Show Top 10" : "Show All (" + ranked.length + ")"}
                </button>
              </div>
            )}
          </div>

          <div>
            <div style={{ ...sectionLabel, marginBottom: 8 }}>This Week</div>
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 8 }}>{new Date(weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} to {new Date(weekEnd - 1).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
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

/* ─── TEAMS ─── */
const DEFAULT_TEAM_BLURBS = {
  "team-1": {
    description: "Eddie, you're interested in the restaurant industry. Andreas, you left your topic open but you're flexible. Sash, you want to explore player/coach relationships.",
    suggestion: "You might consider looking at how communication shapes professional relationships in competitive environments. There's an overlap between how coaches communicate with players and how leaders communicate in fast-paced industries like restaurants. You could explore what effective leadership communication looks like across different high-pressure settings.",
    questions: ["How does communication between coaches and players affect team performance?", "What communication strategies do leaders use in high-pressure service industries?", "How do professional relationships in sports compare to other competitive industries?"],
  },
  "team-2": {
    description: "Destin, you're interested in linguistic trends, neurodivergence, adaptations/remakes, and how music artists brand themselves. Mikey, you want to explore emotion and language, codeswitching between native and secondary languages, and what makes a horror movie horror. Chris, you're looking at why college athletes enter the transfer portal. Adrieana, you want to explore music artist branding.",
    suggestion: "You might consider exploring how language and communication shape identity and decision-making across different contexts. Destin and Mikey both care about linguistics and how language works differently across cultures and communities. Adrieana and Destin both touch on music artist branding. Chris's transfer portal interest connects through how athletes communicate their decisions. The thread is how people use communication to define who they are and what they do.",
    questions: ["How does codeswitching affect identity and belonging in multilingual communities?", "How do music artists use communication to build and reshape their brand?", "What role does media framing play in how audiences understand athlete decisions like transfers?"],
  },
  "team-3": {
    description: "Lola, you're interested in Gen Z and Snapchat. Elizabeth, you want to explore Gen Z's use of social media, specifically Snapchat. Fiona, you're also interested in Gen Z and social media with a Snapchat focus.",
    suggestion: "You might consider going deep on how Snapchat specifically shapes Gen Z communication differently than other platforms. All three of you landed on the same thing, which means you can really narrow your focus and do something specific. You could look at how Snapchat changes friendship, self-presentation, or information sharing compared to other platforms.",
    questions: ["How does Snapchat's disappearing content model change the way Gen Z communicates compared to permanent platforms?", "What role does Snapchat play in maintaining vs. forming friendships among college students?", "How does Gen Z's relationship with Snapchat differ from their use of Instagram or TikTok?"],
  },
  "team-4": {
    description: "Ava, you're interested in trendsetting communication, marketing and branding, and relationships. Zoe, you want to explore how brand campaigns and ads work, fashion trends, and social media's effects on eating habits. Penelope, you're looking at why fashion trends spread across campuses and how social media affects eating habits. Kalia, you've listed sports communication, NIL deals, parent involvement in youth sports, fashion communication, crisis communication, and PR.",
    suggestion: "You might consider focusing on how trends and branding influence real behavior. Ava, Zoe, and Penelope all touch on how marketing and social media shape what people buy, wear, and eat. Kalia brings a unique angle with sports communication and crisis PR that could connect through how brands manage public perception. The overlap is persuasion, influence, and how communication drives decisions.",
    questions: ["How do social media platforms influence college students' fashion and spending choices?", "What role does branding play in shaping wellness and eating habits among young women?", "How do crisis communication strategies differ between fashion brands and sports organizations?"],
  },
  "team-5": {
    description: "Charlotte, you're interested in gender differences in college classroom participation. Addison, you said you want to do whatever Charlotte is doing. Adriana, you're looking at music preferences and shopping trends. Gus, you're interested in music preferences, friendships, patient/doctor interactions, and deception.",
    suggestion: "You might consider exploring how identity shapes communication in everyday settings. Charlotte and Addison are anchored to gender and the classroom. Adriana and Gus both listed music preferences, and Gus also mentioned friendships and deception, which connect to how people present themselves. You could explore how identity (gender, social role, taste) affects how people communicate in classrooms, social settings, and consumer behavior.",
    questions: ["How do gender dynamics affect participation and communication in college classrooms?", "How do music preferences function as a form of identity communication among college students?", "How does deception play a role in everyday interpersonal communication?"],
  },
  "team-6": {
    description: "Tim, you're interested in communication in critical positions, specifically how ER staff, paramedics, dispatchers, police, pilots, and air traffic controllers speak, coordinate, and manage emergencies. Finn, you want to explore interpersonal communication in healthcare. Drew, you're thinking about sports broadcasting, communication between teams, PR, and healthcare. Diego, you're interested in healthcare communication between facilities, doctors, patients, and families.",
    suggestion: "You might consider exploring how communication works in high-stakes environments where clarity can be life-or-death. Tim, Finn, and Diego all touch healthcare from different angles. Tim's emergency communication focus is the most specific and urgent. Drew brings a media/PR angle that connects through how healthcare stories get communicated publicly. This is a strong group with tight overlap.",
    questions: ["How do communication failures in emergency settings contribute to medical errors?", "How does interpersonal communication between doctors and patients affect health outcomes?", "How does sports broadcasting communicate injury and health information to audiences?"],
  },
  "team-7": {
    description: "Santi, you're interested in how foreign film communicates, plus sports and trends. Marissa, you want to explore trendsetting communication, marketing and branding, and relationships. Kelly, you're looking at social media influence on wellness habits, romantic partners, and spending. Carter, you're interested in use of AI in school and interpersonal communication.",
    suggestion: "You might consider exploring how communication works differently depending on context and medium. Santi's foreign film interest is about how culture shapes storytelling. Kelly's social media focus is about how platforms shape behavior. Carter's AI interest is about how technology changes interpersonal communication. Marissa's trendsetting focus connects to how messages spread across contexts. The thread is how the medium and the setting change the way people communicate.",
    questions: ["How does foreign film communicate cultural values differently than American media?", "How does social media influence college students' lifestyle decisions and relationship choices?", "How is AI changing the way students communicate in academic settings?"],
  },
  "team-8": {
    description: "Emma, you're interested in marketing and branding, either with music artists or brands. Sienna, you want to explore branding and something about sports. Angelina, you're interested in science communication. Phoebe, you're interested in fashion and health.",
    suggestion: "You might consider exploring how different types of communication shape public perception and self-image. Emma and Sienna both care about branding and how organizations present themselves. Angelina's science communication interest is about making complex information accessible. Phoebe's fashion and health focus connects to how media influences how people see themselves. The overlap is how communication shapes what people believe, buy, and value.",
    questions: ["How do brands use social media to shape consumer identity and loyalty?", "What makes science communication effective and trustworthy for general audiences?", "How does fashion media influence college students' self-image and health decisions?"],
  },
};

function TeamsView({ teams, students, log, data, setData, userName, isAdmin }) {
  const [editingTeam, setEditingTeam] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  if (data?.teamsHidden) {
    return (
      <div style={{ padding: "60px 20px", fontFamily: F, textAlign: "center" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ ...sectionLabel, marginBottom: 8 }}>Teams</div>
          <div style={{ ...crd, padding: 32 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>No teams this week</div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.6 }}>Team play is paused. Check back next week.</div>
          </div>
        </div>
      </div>
    );
  }

  const bios = data.bios || {};
  const teamBlurbs = data.teamBlurbs || {};
  const currentStudent = students.find(s => s.name === userName);
  const myTeamId = currentStudent?.teamId;

  const startEdit = (teamId) => {
    const blurb = teamBlurbs[teamId] || DEFAULT_TEAM_BLURBS[teamId] || {};
    const team = teams.find(t => t.id === teamId);
    setEditingTeam(teamId);
    setEditForm({
      name: team?.name || "",
      description: blurb.description || "",
      suggestion: blurb.suggestion || "",
      questions: (blurb.questions || []).join("\n"),
    });
  };

  const saveEdit = async () => {
    if (!editingTeam || !editForm) return;
    const newBlurbs = { ...teamBlurbs, [editingTeam]: {
      description: editForm.description.trim(),
      suggestion: editForm.suggestion.trim(),
      questions: editForm.questions.split("\n").map(q => q.trim()).filter(q => q),
    }};
    const newTeams = teams.map(t => t.id === editingTeam ? { ...t, name: editForm.name.trim() || t.name } : t);
    const updated = { ...data, teamBlurbs: newBlurbs, teams: newTeams };
    await saveData(updated); setData(updated);
    setEditingTeam(null); setEditForm(null); showMsg("Saved");
  };

  const teamData = teams.map(t => {
    const members = students.filter(s => s.teamId === t.id);
    return { ...t, members };
  });

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      {msg && <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#18181b", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 999 }}>{msg}</div>}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 4 }}>Project Groups</div>
        <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 12, lineHeight: 1.5 }}>Your group for the quarter. Each group has suggested research directions and questions to get you started.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {teamData.map((team, i) => {
            const tc = TEAM_COLORS[team.colorIdx];
            const blurb = teamBlurbs[team.id] || DEFAULT_TEAM_BLURBS[team.id] || {};
            const canEdit = isAdmin || myTeamId === team.id;
            const isEditing = editingTeam === team.id;
            return (
              <div key={team.id} style={{ borderRadius: 16, border: "1px solid #f3f4f6", overflow: "hidden", background: "#fff" }}>
                {/* Header */}
                <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, background: tc.accent + "08", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    {isEditing ? (
                      <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ ...inp, fontSize: 16, fontWeight: 800, padding: "4px 8px" }} />
                    ) : (
                      <div style={{ fontSize: 16, fontWeight: 800, color: TEXT_PRIMARY }}>{team.name}</div>
                    )}
                    <div style={{ fontSize: 11, color: TEXT_MUTED }}>{team.members.length} members</div>
                  </div>
                  {canEdit && !isEditing && (
                    <button onClick={() => startEdit(team.id)} style={{ ...pillInactive, fontSize: 11 }}>Edit</button>
                  )}
                </div>

                {/* Members with photos and hometowns */}
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    {team.members.map(m => {
                      const bio = bios[m.id] || {};
                      return (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 180 }}>
                          {bio.photo ? (
                            <img src={bio.photo} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid " + tc.accent + "30" }} />
                          ) : (
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: tc.accent + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: tc.accent, flexShrink: 0 }}>{m.name[0]}</div>
                          )}
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>{m.name}</div>
                            {bio.hometown && <div style={{ fontSize: 11, color: TEXT_MUTED }}>{bio.hometown}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Blurb - editable or display */}
                {isEditing ? (
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 4 }}>Description</div>
                    <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={4} style={{ ...inp, fontSize: 13, padding: "8px 10px", resize: "vertical", marginBottom: 10 }} />
                    <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 4 }}>Suggested Direction</div>
                    <textarea value={editForm.suggestion} onChange={e => setEditForm({ ...editForm, suggestion: e.target.value })} rows={3} style={{ ...inp, fontSize: 13, padding: "8px 10px", resize: "vertical", marginBottom: 10 }} />
                    <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 4 }}>Research Questions (one per line)</div>
                    <textarea value={editForm.questions} onChange={e => setEditForm({ ...editForm, questions: e.target.value })} rows={4} style={{ ...inp, fontSize: 13, padding: "8px 10px", resize: "vertical", marginBottom: 10 }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={saveEdit} style={{ ...pill, background: "#18181b", color: "#fff", flex: 1 }}>Save</button>
                      <button onClick={() => { setEditingTeam(null); setEditForm(null); }} style={pillInactive}>Cancel</button>
                    </div>
                  </div>
                ) : (blurb.description || blurb.suggestion) ? (
                  <div style={{ padding: "14px 16px" }}>
                    {blurb.description && <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.7, marginBottom: 10 }}>{blurb.description}</div>}
                    {blurb.suggestion && <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.7, marginBottom: 10 }}>{blurb.suggestion}</div>}
                    {blurb.questions && blurb.questions.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Suggested Research Questions</div>
                        {blurb.questions.map((q, qi) => (
                          <div key={qi} style={{ fontSize: 12, color: "#52525b", lineHeight: 1.6, padding: "4px 0 4px 10px", borderLeft: "2px solid " + tc.accent + "40" }}>{q}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── TEAM BUILDER ─── */
function TeamBuilder({ data, setData }) {
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const movePlayer = async (sid, toTid) => { const updated = { ...data, students: data.students.map(s => s.id === sid ? { ...s, teamId: toTid } : s) }; await saveData(updated); setData(updated); };
  const renameTeam = async (tid, name) => { if (!name.trim()) return; const updated = { ...data, teams: data.teams.map(t => t.id === tid ? { ...t, name: name.trim() } : t) }; await saveData(updated); setData(updated); setEditing(null); };
  const reshuffleTeams = async () => { const shuffled = shuffle(data.students); const tids = data.teams.map(t => t.id); const updated = { ...data, students: shuffled.map((s, i) => ({ ...s, teamId: tids[i % tids.length] })) }; await saveData(updated); setData(updated); showMsg("Reshuffled"); };

  return (
    <div style={{ padding: "20px 20px 40px" }}>
      <Toast message={msg} />
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ ...sectionLabel }}>Team Draft</div>
        <div style={{ color: TEXT_SECONDARY, fontSize: 13, marginTop: 4 }}>Drag players. Click team name to rename.</div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 10 }}>
          <button onClick={reshuffleTeams} style={pillInactive}>Reshuffle</button>
          <button onClick={async () => { const updated = { ...data, teamsHidden: !data.teamsHidden }; await saveData(updated); setData(updated); showMsg(data.teamsHidden ? "Teams enabled" : "Teams hidden this week"); }} style={data.teamsHidden ? { ...pill, background: "#f59e0b", color: "#fff" } : pillInactive}>{data.teamsHidden ? "Re-enable Teams" : "Hide Teams This Week"}</button>
        </div>
        {data.teamsHidden && <div style={{ marginTop: 10, padding: "8px 14px", background: "#fffbeb", borderRadius: 8, fontSize: 12, color: "#92400e", fontWeight: 600 }}>Teams are currently hidden from students.</div>}
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, paddingTop: 12 }}>
        {data.teams.map(team => {
          const tc = TEAM_COLORS[team.colorIdx]; const members = data.students.filter(s => s.teamId === team.id);
          return (
            <div key={team.id} onDragOver={e => { e.preventDefault(); setDragOver(team.id); }} onDragLeave={() => setDragOver(null)} onDrop={e => { e.preventDefault(); if (dragging) movePlayer(dragging.id, team.id); setDragging(null); setDragOver(null); }}
              style={{ ...crd, borderColor: dragOver === team.id ? tc.accent : BORDER, padding: 0, overflow: "hidden", minHeight: 180, transition: "border-color 0.15s" }}>
              <div style={{ height: 4, background: tc.accent }} />
              <div style={{ padding: "14px 16px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {editing === team.id ? (
                  <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)} onBlur={() => renameTeam(team.id, editVal)} onKeyDown={e => e.key === "Enter" && renameTeam(team.id, editVal)}
                    style={{ background: "#f5f5f4", border: "1px solid " + tc.accent, borderRadius: 6, padding: "6px 10px", color: tc.accent, fontWeight: 700, fontFamily: F, fontSize: 15, outline: "none", width: "100%" }} />
                ) : (
                  <div onClick={() => { setEditing(team.id); setEditVal(team.name); }} style={{ fontSize: 15, fontWeight: 700, color: tc.accent, fontFamily: F, cursor: "pointer" }}>{team.name}</div>
                )}
                <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, marginLeft: 8 }}>{members.length}</div>
              </div>
              <div style={{ padding: "8px 12px 16px" }}>
                {members.map(m => (
                  <div key={m.id} draggable onDragStart={() => setDragging(m)} onDragEnd={() => { setDragging(null); setDragOver(null); }}
                    style={{ padding: "10px 14px", marginBottom: 4, borderRadius: 8, background: dragging?.id === m.id ? tc.accent + "15" : tc.bg, border: "1px solid " + (dragging?.id === m.id ? tc.accent : "transparent"), cursor: "grab", fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY, opacity: dragging?.id === m.id ? 0.5 : 1, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 5, height: 14, borderRadius: 2, background: tc.accent + "40", flexShrink: 0 }} />
                    {m.name}
                  </div>
                ))}
                {members.length === 0 && <div style={{ padding: 20, textAlign: "center", color: TEXT_MUTED, fontSize: 13, fontStyle: "italic" }}>Drop here</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── ADMIN ─── */
function AdminPanel({ data, setData }) {
  const [mode, setMode] = useState("roster");
  const [msg, setMsg] = useState("");
  const [newName, setNewName] = useState("");
  const [newTeamId, setNewTeamId] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2500); };

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

  const undo = async () => { if (!data.log.length) return; const lastTs = data.log[data.log.length - 1].ts; const updated = { ...data, log: data.log.filter(e => e.ts !== lastTs) }; await saveData(updated); setData(updated); showMsg("Undone"); };
  const resetAll = async () => { const updated = { ...data, log: [], participation: {}, grades: {}, weeklyGames: {}, weeklyToT: {}, weeklyFishbowl: {}, fishbowlStars: {}, weeklyTeamWins: {}, todoChecks: {} }; await saveData(updated); setData(updated); showMsg("Everything reset"); };
  const addStudent = async () => { if (!newName.trim()) return; const sid = genId(); const pin = String(Math.floor(100000 + Math.random() * 900000)); const updated = { ...data, students: [...data.students, { id: sid, name: newName.trim(), teamId: newTeamId || "" }], pins: { ...(data.pins || {}), [sid]: pin } }; const ok = await saveData(updated); if (ok) { setData(updated); setNewName(""); setNewTeamId(""); showMsg("Added (PIN: " + pin + ")"); } else { showMsg("Save failed, try again"); } };
  const removeStudent = async id => { const updated = { ...data, students: data.students.filter(s => s.id !== id), log: data.log.filter(e => e.studentId !== id) }; await saveData(updated); setData(updated); showMsg("Removed"); };
  const addTeam = async () => { if (!newTeamName.trim()) return; const updated = { ...data, teams: [...data.teams, { id: genId(), name: newTeamName.trim(), colorIdx: data.teams.length % TEAM_COLORS.length }] }; await saveData(updated); setData(updated); setNewTeamName(""); showMsg("Team added"); };
  const removeTeam = async id => { const updated = { ...data, teams: data.teams.filter(t => t.id !== id), students: data.students.map(s => s.teamId === id ? { ...s, teamId: "" } : s) }; await saveData(updated); setData(updated); showMsg("Team removed"); };

  const recent = [...data.log].reverse().slice(0, 30);

  // Weekly dashboard
  const weekStart = new Date();
  const wd = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (wd === 0 ? 6 : wd - 1));
  weekStart.setHours(0, 0, 0, 0);
  const weekLog = data.log.filter(e => e.ts >= weekStart.getTime());
  const weekBySource = {};
  weekLog.forEach(e => {
    const src = e.source || "Other";
    if (!weekBySource[src]) weekBySource[src] = { count: 0, total: 0 };
    weekBySource[src].count++;
    weekBySource[src].total += e.amount;
  });
  const sourceEntries = Object.entries(weekBySource).sort((a, b) => b[1].total - a[1].total);

  const allBySource = {};
  data.log.forEach(e => {
    const src = e.source || "Other";
    if (!allBySource[src]) allBySource[src] = { count: 0, total: 0 };
    allBySource[src].count++;
    allBySource[src].total += e.amount;
  });
  const allSourceEntries = Object.entries(allBySource).sort((a, b) => b[1].total - a[1].total);

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ ...sectionLabel, marginBottom: 12 }}>Admin</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ ...crd, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>This Week</div>
          {sourceEntries.length === 0 && <div style={{ fontSize: 13, color: TEXT_MUTED }}>No points this week</div>}
          {sourceEntries.map(([src, d]) => (
            <div key={src} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", fontSize: 13 }}>
              <span style={{ color: TEXT_PRIMARY, fontWeight: 500 }}>{src}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: TEXT_MUTED }}>{d.count} entries</span>
                <span style={{ fontWeight: 700, color: d.total >= 0 ? GREEN : RED, minWidth: 36, textAlign: "right" }}>{d.total > 0 ? "+" : ""}{d.total}</span>
              </div>
            </div>
          ))}
          {sourceEntries.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0 0", marginTop: 4, borderTop: "1px solid " + BORDER, fontSize: 13, fontWeight: 700 }}>
              <span style={{ color: TEXT_PRIMARY }}>Total</span>
              <span style={{ color: TEXT_PRIMARY }}>{weekLog.reduce((s, e) => s + e.amount, 0)} pts / {weekLog.length} entries</span>
            </div>
          )}
        </div>
        <div style={{ ...crd, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>All Time</div>
          {allSourceEntries.length === 0 && <div style={{ fontSize: 13, color: TEXT_MUTED }}>No points yet</div>}
          {allSourceEntries.map(([src, d]) => (
            <div key={src} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", fontSize: 13 }}>
              <span style={{ color: TEXT_PRIMARY, fontWeight: 500 }}>{src}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: TEXT_MUTED }}>{d.count}</span>
                <span style={{ fontWeight: 700, color: d.total >= 0 ? GREEN : RED, minWidth: 36, textAlign: "right" }}>{d.total > 0 ? "+" : ""}{d.total}</span>
              </div>
            </div>
          ))}
          {allSourceEntries.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0 0", marginTop: 4, borderTop: "1px solid " + BORDER, fontSize: 13, fontWeight: 700 }}>
              <span style={{ color: TEXT_PRIMARY }}>Total</span>
              <span style={{ color: TEXT_PRIMARY }}>{data.log.reduce((s, e) => s + e.amount, 0)} pts / {data.log.length} entries</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {["roster", "pins", "log"].map(m => (
          <button key={m} onClick={() => setMode(m)} style={mode === m ? pillActive : pillInactive}>{m === "roster" ? "Roster" : m === "pins" ? "PINs" : "Log"}</button>
        ))}
        <button onClick={() => { setMode("backups"); loadBackups(); }} style={mode === "backups" ? pillActive : pillInactive}>Backups</button>
        <div style={{ flex: 1 }} />
        <button onClick={undo} style={pillInactive}>Undo</button>
        <button onClick={() => {
          const emails = data.students.map(s => {
            const bio = (data.bios || {})[s.id];
            return bio?.email;
          }).filter(Boolean);
          if (emails.length === 0) { showMsg("No emails found"); return; }
          navigator.clipboard.writeText(emails.join(", ")).then(() => showMsg(emails.length + " emails copied"));
        }} style={pillInactive}>Copy Emails</button>
        <button onClick={() => { if (window.confirm("FULL RESET: This will zero out ALL points, participation, grades, game data, and to-do progress. Are you sure?")) resetAll(); }} style={{ ...pill, background: "#fef2f2", color: RED }}>Full Reset</button>
      </div>

      {mode === "roster" && (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
          <div style={{ ...crd, padding: 16 }}>
            <div style={{ ...sectionLabel, marginBottom: 14 }}>Teams</div>
            {data.teams.map(t => { const tc = TEAM_COLORS[t.colorIdx]; return (<div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid " + BORDER }}><span style={{ color: tc.accent, fontWeight: 600 }}>{t.name}</span><button onClick={() => removeTeam(t.id)} style={{ ...bt, fontSize: 11, padding: "2px 8px", background: "transparent", color: RED, border: "1px solid " + RED + "33" }}>X</button></div>); })}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}><input placeholder="New team" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} style={{ ...inp, flex: 1 }} /><button onClick={addTeam} style={{ ...bt, background: TEXT_PRIMARY, color: "#fff", fontSize: 12 }}>Add</button></div>
          </div>
          <div style={{ ...crd, padding: 16 }}>
            <div style={{ ...sectionLabel, marginBottom: 14 }}>Students</div>
            {[...data.students].sort(lastSortObj).map(s => { const team = data.teams.find(t => t.id === s.teamId); return (<div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid " + BORDER, fontSize: 13 }}><div><span style={{ color: TEXT_PRIMARY }}>{s.name}</span>{team && <span style={{ color: TEXT_MUTED, marginLeft: 8, fontSize: 11 }}>{team.name}</span>}</div><button onClick={() => removeStudent(s.id)} style={{ ...bt, fontSize: 11, padding: "2px 8px", background: "transparent", color: RED, border: "1px solid " + RED + "33" }}>X</button></div>); })}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}><input placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} style={{ ...inp, flex: 1 }} /><select value={newTeamId} onChange={e => setNewTeamId(e.target.value)} style={{ ...sel, minWidth: 90 }}><option value="">Team</option>{data.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><button onClick={addStudent} style={{ ...bt, background: TEXT_PRIMARY, color: "#fff", fontSize: 12 }}>Add</button></div>
          </div>
        </div>
      )}

      {mode === "pins" && (
        <div style={{ ...crd, padding: 16 }}>
          <div style={{ ...sectionLabel, marginBottom: 14 }}>Student PINs</div>
          <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 12 }}>Share these with students so they can log in. Click a PIN to edit it.</div>
          {[...data.students].sort(lastSortObj).map(s => {
            const studentPin = (data.pins || {})[s.id] || "------";
            return (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid " + BORDER }}>
                <span style={{ fontSize: 13, color: TEXT_PRIMARY, fontWeight: s.name === ADMIN_NAME ? 700 : 500 }}>{s.name}</span>
                <input
                  defaultValue={studentPin}
                  onBlur={async (e) => {
                    const val = e.target.value.trim();
                    if (val && val !== studentPin) {
                      const updated = { ...data, pins: { ...(data.pins || {}), [s.id]: val } };
                      await saveData(updated); setData(updated); showMsg("PIN updated");
                    }
                  }}
                  onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
                  style={{ fontSize: 15, fontWeight: 900, color: TEXT_PRIMARY, fontVariantNumeric: "tabular-nums", letterSpacing: "0.15em", fontFamily: F, background: "transparent", border: "1px solid transparent", borderRadius: 6, padding: "2px 6px", textAlign: "right", width: 100 }}
                  onFocus={e => { e.target.style.borderColor = BORDER; e.target.style.background = "#fff"; }}
                />
              </div>
            );
          })}
        </div>
      )}

      {mode === "log" && (
        <div style={{ ...crd, padding: 16 }}>
          <div style={{ ...sectionLabel, marginBottom: 14 }}>Recent</div>
          {recent.length === 0 && <div style={{ color: TEXT_MUTED, textAlign: "center", padding: 20 }}>No points yet</div>}
          {recent.map(e => { const s = data.students.find(x => x.id === e.studentId); return (<div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid " + BORDER, fontSize: 13 }}><div><span style={{ color: TEXT_PRIMARY, fontWeight: 500 }}>{s?.name || "?"}</span><span style={{ color: TEXT_MUTED, marginLeft: 8 }}>{e.source}</span></div><div style={{ display: "flex", gap: 12, alignItems: "center" }}><span style={{ color: e.amount >= 0 ? GREEN : RED, fontWeight: 600 }}>{e.amount > 0 ? "+" : ""}{e.amount}</span><span style={{ color: TEXT_MUTED, fontSize: 11 }}>{new Date(e.ts).toLocaleDateString()}</span></div></div>); })}
        </div>
      )}

      {mode === "backups" && (
        <div style={{ ...crd, padding: 16 }}>
          <div style={{ ...sectionLabel, marginBottom: 14 }}>Daily Backups</div>
          <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 12 }}>Backups are created automatically once per day. Click Restore to roll back to that day's data.</div>
          {loadingBackups && <div style={{ color: TEXT_MUTED, textAlign: "center", padding: 20 }}>Loading...</div>}
          {!loadingBackups && backups.length === 0 && <div style={{ color: TEXT_MUTED, textAlign: "center", padding: 20 }}>No backups found yet. A backup is created the first time data is saved each day.</div>}
          {backups.map(bk => {
            const dateStr = bk.replace(STORAGE_KEY + "-bak-", "");
            return (
              <div key={bk} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid " + BORDER }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{dateStr}</span>
                <button onClick={() => restoreBackup(bk)} style={{ ...pill, background: "#fffbeb", color: AMBER, fontSize: 12 }}>Restore</button>
              </div>
            );
          })}
          <button onClick={loadBackups} style={{ ...pillInactive, width: "100%", marginTop: 12 }}>Refresh</button>
        </div>
      )}
    </div>
  );
}

/* ─── QUIZ ─── */
function QuizMode({ data, setData }) {
  const [phase, setPhase] = useState("setup");
  const [questions, setQuestions] = useState(["", "", "", "", ""]);
  const [currentQ, setCurrentQ] = useState(0);
  const [teamAnswers, setTeamAnswers] = useState({});
  const [ptsPerQ, setPtsPerQ] = useState("2");

  const start = () => { if (questions.some(q => q.trim())) { setPhase("live"); setCurrentQ(0); setTeamAnswers({}); } };
  const toggleCorrect = tid => { const key = currentQ + "-" + tid; setTeamAnswers(p => ({ ...p, [key]: !p[key] })); };
  const next = async () => {
    const p = parseInt(ptsPerQ) || 2; const entries = [];
    data.teams.forEach(team => { if (teamAnswers[currentQ + "-" + team.id]) { data.students.filter(s => s.teamId === team.id).forEach(m => { entries.push({ id: genId(), studentId: m.id, amount: p, source: "Quiz Q" + (currentQ + 1), ts: Date.now() }); }); } });
    if (entries.length) { const updated = { ...data, log: [...data.log, ...entries] }; await saveData(updated); setData(updated); }
    const valid = questions.filter(q => q.trim());
    if (currentQ < valid.length - 1) setCurrentQ(currentQ + 1); else setPhase("done");
  };

  if (phase === "done") return (<div style={{ padding: 40, textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 900, color: TEXT_PRIMARY, marginBottom: 16 }}>Quiz Complete</div><div style={{ color: TEXT_SECONDARY, marginBottom: 24 }}>Points awarded.</div><button onClick={() => { setPhase("setup"); setQuestions(["", "", "", "", ""]); }} style={{ ...bt, background: TEXT_PRIMARY, color: "#fff", border: "1px solid " + TEXT_PRIMARY }}>New Quiz</button></div>);

  if (phase === "live") {
    const valid = questions.filter(q => q.trim());
    return (
      <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}><div style={{ ...sectionLabel }}>Question {currentQ + 1} / {valid.length}</div></div>
        <div style={{ ...crd, textAlign: "center", padding: 40, marginBottom: 20 }}><div style={{ fontSize: 20, fontWeight: 900, color: TEXT_PRIMARY, lineHeight: 1.3 }}>{valid[currentQ]}</div></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
          {data.teams.map(team => { const tc = TEAM_COLORS[team.colorIdx]; const correct = teamAnswers[currentQ + "-" + team.id]; return (<button key={team.id} onClick={() => toggleCorrect(team.id)} style={{ ...crd, cursor: "pointer", textAlign: "center", padding: 20, background: correct ? GREEN + "15" : "#fff", borderColor: correct ? GREEN : BORDER }}><div style={{ fontSize: 14, fontWeight: 700, color: correct ? GREEN : tc.accent }}>{team.name}</div><div style={{ fontSize: 11, fontWeight: 700, color: correct ? GREEN : TEXT_MUTED, marginTop: 4 }}>{correct ? "CORRECT" : "\u2014"}</div></button>); })}
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}><button onClick={next} style={{ ...bt, background: TEXT_PRIMARY, color: "#fff", fontSize: 14, padding: "12px 36px", border: "1px solid " + TEXT_PRIMARY, fontWeight: 700 }}>{currentQ < valid.length - 1 ? "Next" : "Finish"}</button></div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 560, margin: "0 auto" }}>
      <div style={{ ...sectionLabel, textAlign: "center", marginBottom: 20 }}>Weekly Quiz</div>
      <div style={{ ...crd, padding: 16 }}>
        {questions.map((q, i) => (<div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}><span style={{ fontSize: 13, fontWeight: 900, color: TEXT_MUTED, width: 24 }}>{i + 1}</span><input placeholder={"Question " + (i + 1)} value={q} onChange={e => { const u = [...questions]; u[i] = e.target.value; setQuestions(u); }} style={inp} /></div>))}
        <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "16px 0" }}><span style={{ color: TEXT_SECONDARY, fontSize: 13 }}>Points per correct:</span><input type="number" value={ptsPerQ} onChange={e => setPtsPerQ(e.target.value)} style={{ ...inp, width: 60 }} /></div>
        <button onClick={start} style={{ ...bt, background: TEXT_PRIMARY, color: "#fff", width: "100%", fontSize: 14, padding: 12, border: "1px solid " + TEXT_PRIMARY, fontWeight: 700 }}>Start</button>
      </div>
    </div>
  );
}

/* ─── PTI MODE (iPad) ─── */
function PTIMode({ data, setData }) {
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

  // Get all real students (excluding Andrew Ishak and test student)
  const allStudents = [...data.students].filter(s => s.name !== "Andrew Ishak" && s.name !== "Bruce Willis").sort(lastSortObj);

  // Initialize seats on first load: assign every student an explicit seat
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

  // Build position -> student from the saved seats (no auto-fill)
  const posToStudent = {};
  allStudents.forEach(s => {
    const p = seats[s.id];
    if (p !== undefined && p < TOTAL) {
      posToStudent[p] = s;
    }
  });

  const awardPTI = async (sid, amount) => {
    const student = data.students.find(s => s.id === sid);
    const entry = { id: genId(), studentId: sid, amount, source: "Around the Horn", ts: Date.now() };
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
          <div style={{ ...sectionLabel }}>Around the Horn</div>
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
            const team = data.teams.find(t => t.id === s.teamId);
            const tc = team ? TEAM_COLORS[team.colorIdx] : TEAM_COLORS[0];
            const pts = gp(data.log, s.id);
            const ptiPts = data.log.filter(e => e.studentId === s.id && (e.source === "Around the Horn" || e.source === "PTI")).reduce((sum, e) => sum + e.amount, 0);
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
                    border: isOpen ? "2px solid " + tc.accent : "1px solid " + BORDER,
                    cursor: "grab", textAlign: "center", transition: "all 0.1s",
                  }}>
                  {!hideScores && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3, padding: "0 2px" }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: rank <= 5 ? "#d4a017" : TEXT_MUTED }}>#{rank}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: ptiPts > 0 ? GREEN : TEXT_MUTED }}>ATH: {ptiPts}</span>
                    </div>
                  )}
                  {photo ? (
                    <img src={photo} alt={s.name} draggable={false} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", display: "block", margin: "0 auto 4px", border: "2px solid " + tc.accent }} />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px", fontSize: 20, fontWeight: 900, color: "#fff", border: "2px solid " + tc.accent }}>{initials}</div>
                  )}
                  <div style={{ fontSize: 12, fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1.15 }}>{s.name.split(" ")[0]}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: TEXT_SECONDARY, lineHeight: 1.15 }}>{s.name.split(" ").slice(1).join(" ")}</div>
                  {!hideScores && <div style={{ fontSize: 13, fontWeight: 900, color: tc.accent, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{pts}</div>}
                </div>
                {isOpen && (
                  <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", zIndex: 20, marginTop: 4, display: "flex", gap: 4, background: "#fff", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "1px solid " + BORDER, padding: 6, borderRadius: 12 }}>
                    <button onClick={(e) => { e.stopPropagation(); awardPTI(s.id, -1); }} style={{ ...pill, background: "#fef2f2", color: RED, minWidth: 44, fontSize: 14, fontWeight: 900 }}>-1</button>
                    <button onClick={(e) => { e.stopPropagation(); awardPTI(s.id, 1); }} style={{ ...pill, background: "#ecfdf5", color: GREEN, minWidth: 44, fontSize: 14, fontWeight: 900 }}>+1</button>
                    <button onClick={(e) => { e.stopPropagation(); awardPTI(s.id, 5); }} style={{ ...pill, background: "#fef2f2", color: ACCENT, minWidth: 44, fontSize: 14, fontWeight: 900 }}>+5</button>
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

/* ─── LIVE QUIZ (Admin: manage quiz slots) ─── */
const CATS = [
  { id: "on_topic", label: "On topic", gameW: 0.3, gradeW: 0.4 },
  { id: "reading", label: "From reading", gameW: 0.4, gradeW: 0.5 },
  { id: "sports_world", label: "Sports world", gameW: 0.4, gradeW: 0.1 },
];

function LiveQuizAdmin({ data, setData }) {
  const [slot, setSlot] = useState(null);
  const [answers, setAnswers] = useState(Array(10).fill(""));
  const [categories, setCategories] = useState(Array(10).fill("on_topic"));
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2500); };

  const quizzes = data.quizSlots || {};

  const loadSlot = (n) => {
    const existing = quizzes[n];
    if (existing) {
      setAnswers(existing.answers || Array(10).fill(""));
      setCategories(existing.categories || Array(10).fill("on_topic"));
    } else {
      setAnswers(Array(10).fill(""));
      setCategories(Array(10).fill("on_topic"));
    }
    setSlot(n);
  };

  const saveSlot = async () => {
    const updated = { ...data, quizSlots: { ...quizzes, [slot]: { answers, categories, active: true } } };
    await saveData(updated); setData(updated);
    showMsg("Quiz " + slot + " saved");
  };

  const scoreSlot = async () => {
    const quiz = quizzes[slot];
    if (!quiz) return;
    const responses = quiz.responses || {};
    const entries = [];
    data.students.forEach(s => {
      let gameTotal = 0;
      for (let q = 0; q < 10; q++) {
        const key = s.id + "-" + q;
        const resp = responses[key];
        const correct = resp && quiz.answers[q] && resp.toUpperCase() === quiz.answers[q].toUpperCase();
        if (correct) {
          const cat = CATS.find(c => c.id === quiz.categories[q]) || CATS[0];
          gameTotal += cat.gameW * 10;
        }
      }
      if (gameTotal > 0) {
        entries.push({ id: genId(), studentId: s.id, amount: Math.round(gameTotal), source: "Quiz #" + slot, ts: Date.now() });
      }
    });
    const updated = { ...data, log: [...data.log, ...entries], quizSlots: { ...quizzes, [slot]: { ...quiz, active: false, scored: true } } };
    await saveData(updated); setData(updated);
    showMsg("Scored! " + entries.length + " students earned points.");
  };

  const deleteSlot = async () => {
    const { [slot]: _, ...rest } = quizzes;
    const updated = { ...data, quizSlots: rest };
    await saveData(updated); setData(updated);
    setSlot(null); showMsg("Deleted");
  };

  if (slot !== null) {
    const quiz = quizzes[slot];
    const responseCount = quiz?.responses ? Object.keys(quiz.responses).length : 0;
    const uniqueStudents = quiz?.responses ? new Set(Object.keys(quiz.responses).map(k => k.split("-")[0])).size : 0;
    return (
      <div style={{ padding: 20, maxWidth: 560, margin: "0 auto" }}>
        <Toast message={msg} />
        <button onClick={() => setSlot(null)} style={{ ...pillInactive, marginBottom: 16 }}>Back</button>
        <div style={{ ...sectionLabel, textAlign: "center", marginBottom: 4 }}>Quiz #{slot}</div>
        {quiz?.scored && <div style={{ textAlign: "center", fontSize: 12, color: GREEN, fontWeight: 600, marginBottom: 12 }}>Already scored</div>}
        <div style={{ textAlign: "center", fontSize: 13, color: TEXT_MUTED, marginBottom: 16 }}>{uniqueStudents} students responded</div>
        <div style={{ ...crd, padding: 16 }}>
          <div style={{ ...sectionLabel, marginBottom: 8 }}>Answer key</div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: TEXT_MUTED, width: 22 }}>{i + 1}</span>
              <div style={{ display: "flex", gap: 3 }}>
                {["A", "B", "C", "D"].map(opt => (
                  <button key={opt} onClick={() => { const u = [...answers]; u[i] = opt; setAnswers(u); }}
                    style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", minWidth: 36, fontFamily: F, cursor: "pointer", borderRadius: 8,
                      background: answers[i]?.toUpperCase() === opt ? GREEN : "transparent",
                      color: answers[i]?.toUpperCase() === opt ? "#fff" : TEXT_SECONDARY,
                      border: "1px solid " + (answers[i]?.toUpperCase() === opt ? GREEN : BORDER),
                    }}>{opt}</button>
                ))}
              </div>
              <select value={categories[i]} onChange={e => { const u = [...categories]; u[i] = e.target.value; setCategories(u); }} style={{ ...sel, flex: 1, fontSize: 11, padding: "4px 8px" }}>
                {CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={saveSlot} style={{ ...bt, background: TEXT_PRIMARY, color: "#fff", flex: 1, border: "1px solid " + TEXT_PRIMARY }}>Save</button>
            {quiz && !quiz.scored && <button onClick={scoreSlot} style={{ ...bt, background: GREEN, color: "#fff", flex: 1, border: "1px solid " + GREEN }}>Score</button>}
            <button onClick={() => { if (window.confirm("Delete quiz " + slot + "?")) deleteSlot(); }} style={{ ...bt, background: "#fff", color: RED, border: "1px solid #fecaca" }}>Delete</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <Toast message={msg} />
      <div style={{ ...sectionLabel, textAlign: "center", marginBottom: 16 }}>Quiz Manager</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4 }}>
        {Array.from({ length: 100 }).map((_, i) => {
          const n = i + 1;
          const exists = !!quizzes[n];
          const scored = quizzes[n]?.scored;
          return (
            <button key={n} onClick={() => loadSlot(n)} style={{
              fontSize: 13, padding: "8px 0", fontFamily: F, fontWeight: 700, cursor: "pointer", borderRadius: 8,
              background: scored ? GREEN + "15" : exists ? ACCENT + "10" : "transparent",
              color: scored ? GREEN : exists ? ACCENT : TEXT_MUTED,
              border: "1px solid " + (scored ? GREEN + "30" : exists ? ACCENT + "25" : BORDER),
            }}>{n}</button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── STUDENT QUIZ VIEW (phone) ─── */
function StudentAnswer({ data, setData, userName }) {
  const [slot, setSlot] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 1500); };

  const student = data.students.find(s => s.name === userName);
  const studentId = student?.id;
  const quizzes = data.quizSlots || {};

  const submitAnswer = async () => {
    if (!studentId || !selected || slot === null) return;
    const quiz = quizzes[slot] || {};
    const key = studentId + "-" + currentQ;
    const responses = { ...(quiz.responses || {}), [key]: selected };
    const updated = { ...data, quizSlots: { ...quizzes, [slot]: { ...quiz, responses } } };
    await saveData(updated); setData(updated);
    showMsg("Locked in: " + selected);
    setSelected(null);
    if (currentQ < 9) {
      setCurrentQ(currentQ + 1);
    }
  };

  if (slot === null) {
    return (
      <div style={{ padding: 20, maxWidth: 500, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, textAlign: "center", marginBottom: 16 }}>Game</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4 }}>
          {Array.from({ length: 100 }).map((_, i) => {
            const n = i + 1;
            return (
              <button key={n} onClick={() => { setSlot(n); setCurrentQ(0); setSelected(null); }} style={{
                fontSize: 13, padding: "10px 0", fontFamily: F, fontWeight: 700, cursor: "pointer", borderRadius: 8,
                background: "#f4f4f5", color: TEXT_MUTED, border: "1px solid #f3f4f6",
              }}>{n}</button>
            );
          })}
        </div>
      </div>
    );
  }

  const quiz = quizzes[slot];
  const myAnswer = studentId && quiz?.responses?.[studentId + "-" + currentQ];
  const OPT_COLORS = [
    { bg: "#dc2626", light: "#fef2f2" },
    { bg: "#2563eb", light: "#eff6ff" },
    { bg: "#d97706", light: "#fffbeb" },
    { bg: "#059669", light: "#ecfdf5" },
  ];

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
      <Toast message={msg} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={() => setSlot(null)} style={{ ...pillInactive }}>Back</button>
        <span style={{ fontSize: 14, fontWeight: 700, color: ACCENT }}>Quiz #{slot}</span>
        <span style={{ fontSize: 12, color: TEXT_MUTED }}>{currentQ + 1}/10</span>
      </div>

      <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
        {Array.from({ length: 10 }).map((_, i) => {
          const answered = studentId && quiz?.responses?.[studentId + "-" + i];
          return (
            <button key={i} onClick={() => { setCurrentQ(i); setSelected(null); }} style={{
              width: 28, height: 28, borderRadius: 6, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
              background: i === currentQ ? TEXT_PRIMARY : answered ? GREEN + "20" : "#f5f5f4",
              color: i === currentQ ? "#fff" : answered ? GREEN : TEXT_MUTED,
            }}>{i + 1}</button>
          );
        })}
      </div>

      <div style={{ fontSize: 48, fontWeight: 900, color: TEXT_PRIMARY, marginBottom: 24 }}>Q{currentQ + 1}</div>

      {myAnswer ? (
        <div style={{ padding: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: GREEN }}>{myAnswer.toUpperCase()}</div>
          <div style={{ color: TEXT_SECONDARY, fontSize: 14, marginTop: 8 }}>Locked in</div>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 300, margin: "0 auto", marginBottom: 20 }}>
            {["A", "B", "C", "D"].map((opt, i) => {
              const c = OPT_COLORS[i];
              const isSel = selected === opt;
              return (
                <button key={opt} onClick={() => setSelected(opt)} style={{
                  fontSize: 24, fontWeight: 900, padding: "28px 0", borderRadius: 12, width: "100%", cursor: "pointer", fontFamily: F, transition: "all 0.15s",
                  background: isSel ? c.bg : c.light,
                  color: isSel ? "#fff" : c.bg,
                  border: "2px solid " + c.bg,
                  transform: isSel ? "scale(1.03)" : "scale(1)",
                }}>{opt}</button>
              );
            })}
          </div>
          {selected && (
            <button onClick={submitAnswer} style={{
              ...bt, fontSize: 14, padding: "12px 40px", background: TEXT_PRIMARY, color: "#fff", borderRadius: 12, border: "1px solid " + TEXT_PRIMARY, fontWeight: 700,
            }}>Lock in answer</button>
          )}
        </>
      )}
    </div>
  );
}

/* ─── ROSTER + BIO ─── */
const BIO_FIELDS = [
  { key: "about", label: "About Me", type: "textarea", placeholder: "Tell us a little about yourself..." },
  { key: "major", label: "Major", type: "text", placeholder: "e.g. Communication" },
  { key: "year", label: "Year", type: "text", placeholder: "e.g. Junior" },
  { key: "hometown", label: "Hometown", type: "text", placeholder: "e.g. San Jose, CA" },
  { key: "favTeam", label: "What's your research motto? No wrong answers.", type: "text", placeholder: "e.g. Stay curious" },
  { key: "motto", label: "Player Motto", type: "text", placeholder: "Your personal motto..." },
  { key: "funFact", label: "Fun Fact", type: "text", placeholder: "Something unexpected..." },
];

const SUPABASE_URL = "https://ybuchgebudixbyrcxpik.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidWNoZ2VidWRpeGJ5cmN4cGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0Nzg3OTIsImV4cCI6MjA4ODA1NDc5Mn0.aF2M_fj6bVYKw-Tz1XxI9SiQB7lAtWzuhBRZbsai8QY";
const SUPABASE_BUCKET = "class-photos";

async function uploadPhoto(file, studentId) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `comm4/${studentId}.${ext}`;
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

async function uploadPdf(file, readingId) {
  const path = `comm4/readings/${readingId}.pdf`;
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
            const team = data.teams.find(t => t.id === s.teamId);
            const tc = team ? TEAM_COLORS[team.colorIdx] : TEAM_COLORS[0];
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

function RosterCombined({ data, setData, userName, isAdmin }) {
  const [sub, setSub] = useState("roster");
  return (
    <div style={{ fontFamily: F }}>
      <div style={{ display: "flex", gap: 6, padding: "16px 20px 0", justifyContent: "center" }}>
        <button onClick={() => setSub("roster")} style={sub === "roster" ? pillActive : pillInactive}>Roster</button>
        <button onClick={() => setSub("teams")} style={sub === "teams" ? pillActive : pillInactive}>Teams</button>
        {isAdmin && <button onClick={() => setSub("draft")} style={sub === "draft" ? pillActive : pillInactive}>Draft</button>}
      </div>
      {sub === "roster" && <RosterView data={data} setData={setData} userName={userName} />}
      {sub === "teams" && <TeamsView teams={data.teams} students={data.students} log={data.log} data={data} setData={setData} userName={userName} isAdmin={isAdmin} />}
      {sub === "draft" && isAdmin && <TeamBuilder data={data} setData={setData} />}
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

  const team = data.teams.find(t => t.id === student.teamId);
  const tc = team ? TEAM_COLORS[team.colorIdx] : TEAM_COLORS[0];
  const [editName, setEditName] = useState(student.name);
  const initials = student.name.split(" ").map(n => n[0]).join("");

  const saveBio = async () => {
    let updated = { ...data, bios: { ...(data.bios || {}), [student.id]: form } };
    if (editName.trim() && editName.trim() !== student.name) {
      updated = { ...updated, students: updated.students.map(s => s.id === student.id ? { ...s, name: editName.trim() } : s) };
    }
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
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#fff", border: "3px solid rgba(255,255,255,0.2)" }}>{initials}</div>
            )}
            {canEdit && (
              <label style={{ position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TEXT_SECONDARY} strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
              </label>
            )}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{student.name}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{team ? team.name : "Unassigned"}</div>
          </div>
        </div>

        {editing ? (
          <div style={{ ...crd, padding: 16, marginTop: 12 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ ...sectionLabel, marginBottom: 4 }}>Name</div>
              <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" style={inp} />
            </div>
            {BIO_FIELDS.map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <div style={{ ...sectionLabel, marginBottom: 4 }}>{f.label}</div>
                {f.type === "textarea" ? (
                  <textarea value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} rows={3} style={{ ...inp, resize: "vertical" }} />
                ) : (
                  <input value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} style={inp} />
                )}
              </div>
            ))}
            {isAdmin && (
              <div style={{ marginBottom: 12, padding: "10px 12px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fef3c7" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: AMBER, textTransform: "uppercase", marginBottom: 4 }}>Admin Only</div>
                <div style={{ ...sectionLabel, marginBottom: 2 }}>Student Email</div>
                <div style={{ fontSize: 13, color: TEXT_PRIMARY }}>{form.email || "Not provided"}</div>
              </div>
            )}
            {(isOwn || isAdmin) && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ ...sectionLabel, marginBottom: 4 }}>Email</div>
                <input value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your.email@scu.edu" style={inp} />
                {isOwn && <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>Only visible to your instructor</div>}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={saveBio} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", flex: 1, padding: "10px 0" }}>Save</button>
              <button onClick={() => { setForm({ ...bio }); setEditing(false); }} style={{ ...pillInactive, flex: 1, padding: "10px 0" }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ ...crd, padding: 16, marginTop: 12 }}>
            {bio.about || bio.major || bio.year || bio.hometown || bio.favTeam || bio.motto || bio.funFact ? (
              <>
                {bio.about && <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.5, marginBottom: 12 }}>{bio.about}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {bio.major && <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Major</div><div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{bio.major}</div></div>}
                  {bio.year && <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Year</div><div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{bio.year}</div></div>}
                  {bio.hometown && <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Hometown</div><div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{bio.hometown}</div></div>}
                  {bio.favTeam && <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Research Motto</div><div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{bio.favTeam}</div></div>}
                  {bio.motto && <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Motto</div><div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{bio.motto}</div></div>}
                </div>
                {bio.funFact && <div style={{ marginTop: 10 }}><div style={{ ...sectionLabel, marginBottom: 2 }}>Fun Fact</div><div style={{ fontSize: 13, color: "#374151" }}>{bio.funFact}</div></div>}
                {isAdmin && bio.email && <div style={{ marginTop: 10, padding: "6px 10px", background: "#fffbeb", borderRadius: 6, border: "1px solid #fef3c7" }}><div style={{ fontSize: 10, fontWeight: 700, color: AMBER, textTransform: "uppercase", marginBottom: 2 }}>Admin Only</div><div style={{ fontSize: 13, color: TEXT_PRIMARY }}>{bio.email}</div></div>}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0", color: TEXT_MUTED, fontSize: 13 }}>
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

/* ─── READINGS & MEDIA ─── */
function ReadingsView({ data, setData, isAdmin }) {
  const readings = data.readings || [];
  const schedule = data.schedule || [];
  const [editId, setEditId] = useState(null);
  const [editLocal, setEditLocal] = useState(null);
  const [newReading, setNewReading] = useState({ title: "", url: "", category: "", notes: "", readingType: "recommended" });
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [showRepo, setShowRepo] = useState(false);
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const categories = [...new Set(readings.map(r => r.category).filter(Boolean))].sort();

  const typeColor = (t) => t === "fishbowl" ? "#7c3aed" : t === "required" ? "#b45309" : t === "additional" ? TEXT_MUTED : GREEN;
  const typeLabel = (t) => t === "fishbowl" ? "Fishbowl" : t === "required" ? "Required" : t === "additional" ? "Additional" : "Recommended";
  const typeShort = (t) => t === "fishbowl" ? "Fish" : t === "required" ? "Req" : t === "additional" ? "Add" : "Rec";

  const addReading = async () => {
    if (!newReading.title.trim()) return;
    const r = { id: genId(), title: newReading.title.trim(), url: newReading.url.trim(), category: newReading.category.trim(), notes: newReading.notes.trim(), readingType: newReading.readingType || "recommended" };
    const updated = { ...data, readings: [...readings, r] };
    await saveData(updated); setData(updated);
    setNewReading({ title: "", url: "", category: "", notes: "", readingType: "recommended" });
    showMsg("Added");
  };
  const updateReading = async (id, field, value) => {
    const updated = { ...data, readings: readings.map(r => r.id === id ? { ...r, [field]: value } : r) };
    await saveData(updated); setData(updated);
  };
  const updateScheduleReadingType = async (date, readingId, newType) => {
    const newSchedule = schedule.map(w => ({
      ...w, dates: w.dates.map(d => {
        if (d.date !== date) return d;
        return { ...d, readings: (d.readings || []).map(r => r.readingId === readingId ? { ...r, type: newType } : r) };
      })
    }));
    const updated = { ...data, schedule: newSchedule };
    await saveData(updated); setData(updated);
  };
  const deleteReading = async (id) => {
    const newSchedule = schedule.map(w => ({
      ...w, dates: w.dates.map(d => ({
        ...d, readings: (d.readings || []).filter(r => r.readingId !== id)
      }))
    }));
    const updated = { ...data, readings: readings.filter(r => r.id !== id), schedule: newSchedule };
    await saveData(updated); setData(updated); showMsg("Deleted");
  };
  const handlePdfUpload = async (file, readingId) => {
    if (!file || !readingId) return;
    if (file.size > 10 * 1024 * 1024) { showMsg("Max 10MB"); return; }
    setUploading(true);
    try {
      const pdfUrl = await uploadPdf(file, readingId);
      await updateReading(readingId, "pdfUrl", pdfUrl);
      showMsg("PDF uploaded");
    } catch (err) { showMsg("Upload failed"); }
    setUploading(false);
  };
  const handleNewPdfUpload = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showMsg("Max 10MB"); return; }
    const title = newReading.title.trim() || file.name.replace(/\.pdf$/i, "");
    const id = genId();
    setUploading(true);
    try {
      const pdfUrl = await uploadPdf(file, id);
      const r = { id, title, url: newReading.url.trim(), pdfUrl, category: newReading.category.trim(), notes: newReading.notes.trim(), readingType: newReading.readingType || "recommended" };
      const updated = { ...data, readings: [...readings, r] };
      await saveData(updated); setData(updated);
      setNewReading({ title: "", url: "", category: "", notes: "", readingType: "recommended" });
      showMsg("Added with PDF");
    } catch (err) { showMsg("Upload failed"); }
    setUploading(false);
  };

  const getReadingLink = (r) => r.pdfUrl || r.url;

  const startReadingEdit = (r) => {
    setEditId(r.id);
    setEditLocal({ title: r.title || "", url: r.url || "", category: r.category || "", notes: r.notes || "", readingType: r.readingType || "recommended" });
  };

  const saveReadingEdit = async () => {
    if (!editId || !editLocal) return;
    const updated = { ...data, readings: readings.map(r => r.id === editId ? { ...r, ...editLocal } : r) };
    await saveData(updated); setData(updated);
    setEditId(null); setEditLocal(null); showMsg("Saved");
  };

  const cancelEdit = () => { setEditId(null); setEditLocal(null); };

  // Build week-grouped view from schedule attachments
  const weekReadings = [];
  schedule.forEach(w => {
    const weekItems = [];
    (w.dates || []).forEach(d => {
      (d.readings || []).forEach(dr => {
        const rdg = readings.find(r => r.id === dr.readingId);
        if (rdg) weekItems.push({ ...rdg, type: dr.type, date: d.date, day: d.day });
      });
    });
    if (weekItems.length > 0) {
      weekReadings.push({ week: w.week, label: w.label, theme: w.theme, items: weekItems });
    }
  });

  return (
    <div style={{ padding: "24px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 16 }}>Readings and Media</div>

        {/* Admin: add new reading */}
        {isAdmin && (
          <div style={{ ...crd, padding: 18, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 12 }}>Add to Repository</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input value={newReading.title} onChange={e => setNewReading({ ...newReading, title: e.target.value })} placeholder="Title" style={inp} />
              <input value={newReading.url} onChange={e => setNewReading({ ...newReading, url: e.target.value })} placeholder="URL (optional)" style={inp} />
              <div style={{ display: "flex", gap: 8 }}>
                <input value={newReading.category} onChange={e => setNewReading({ ...newReading, category: e.target.value })} placeholder="Category" list="cat-list" style={{ ...inp, flex: 1 }} />
                <datalist id="cat-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
                <select value={newReading.readingType} onChange={e => setNewReading({ ...newReading, readingType: e.target.value })} style={{ ...sel, width: 150, fontSize: 14 }}>
                  <option value="fishbowl">Fishbowl</option>
                  <option value="required">Required</option>
                  <option value="recommended">Recommended</option>
                  <option value="additional">Additional</option>
                </select>
              </div>
              <textarea value={newReading.notes} onChange={e => setNewReading({ ...newReading, notes: e.target.value })} placeholder="Notes (optional)" rows={2} style={{ ...inp, resize: "vertical" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addReading} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", padding: "11px 0", flex: 1 }}>Add Reading</button>
                <label style={{ ...pill, background: "#eff6ff", color: "#2563eb", padding: "11px 16px", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
                  {uploading ? "Uploading..." : "Add with PDF"}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <input type="file" accept=".pdf" onChange={e => { if (e.target.files?.[0]) handleNewPdfUpload(e.target.files[0]); e.target.value = ""; }} style={{ display: "none" }} disabled={uploading} />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Week-by-week readings */}
        {weekReadings.length === 0 && <div style={{ ...crd, padding: 24, textAlign: "center", color: TEXT_MUTED, fontSize: 14 }}>No readings added yet.</div>}
        {weekReadings.map(w => {
          const fishbowl = w.items.filter(i => i.type === "fishbowl");
          const required = w.items.filter(i => i.type === "required");
          const recommended = w.items.filter(i => i.type === "recommended");
          const additional = w.items.filter(i => i.type === "additional" || i.type === "highly_recommended");

          const renderItem = (item, i, sectionType) => {
            const link = getReadingLink(item);
            const isEdit = editId === item.id;
            const isFish = sectionType === "fishbowl";
            const isReq = sectionType === "required";
            return (
              <div key={item.id + "-" + i} style={{ padding: "10px 12px", borderTop: i > 0 ? "1px solid " + BORDER : "none", background: isReq ? "#fffbeb" : "transparent", borderRadius: isReq && i === 0 ? "8px 8px 0 0" : isReq ? 0 : 0, marginLeft: -12, marginRight: -12, paddingLeft: 12, paddingRight: 12 }}>
                {isAdmin && isEdit && editLocal ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <input value={editLocal.title} onChange={e => setEditLocal({ ...editLocal, title: e.target.value })} style={{ ...inp, fontSize: 14, padding: "6px 10px" }} />
                    <input value={editLocal.url} onChange={e => setEditLocal({ ...editLocal, url: e.target.value })} placeholder="URL" style={{ ...inp, fontSize: 13, padding: "6px 10px" }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <select value={item.type} onChange={e => updateScheduleReadingType(item.date, item.id, e.target.value)} style={{ ...sel, fontSize: 13, padding: "6px 10px" }}>
                        <option value="fishbowl">Fishbowl</option>
                        <option value="required">Required</option>
                        <option value="recommended">Recommended</option>
                        <option value="additional">Additional</option>
                      </select>
                      <select value={editLocal.readingType} onChange={e => setEditLocal({ ...editLocal, readingType: e.target.value })} style={{ ...sel, fontSize: 13, padding: "6px 10px" }}>
                        <option value="fishbowl">Repo: Fishbowl</option>
                        <option value="required">Repo: Required</option>
                        <option value="recommended">Repo: Recommended</option>
                        <option value="additional">Repo: Additional</option>
                      </select>
                    </div>
                    <textarea value={editLocal.notes} onChange={e => setEditLocal({ ...editLocal, notes: e.target.value })} placeholder="Notes" rows={2} style={{ ...inp, fontSize: 13, padding: "6px 10px", resize: "vertical" }} />
                    {!item.pdfUrl && (
                      <label style={{ ...pillInactive, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "8px 0", cursor: "pointer", fontSize: 12 }}>
                        {uploading ? "Uploading..." : "Upload PDF"}
                        <input type="file" accept=".pdf" onChange={e => { if (e.target.files?.[0]) handlePdfUpload(e.target.files[0], item.id); e.target.value = ""; }} style={{ display: "none" }} disabled={uploading} />
                      </label>
                    )}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={saveReadingEdit} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", flex: 1 }}>Done</button>
                      <button onClick={() => { if (window.confirm("Delete?")) { deleteReading(item.id); cancelEdit(); } }} style={{ ...pill, background: "#fef2f2", color: RED }}>Delete</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: isAdmin ? "pointer" : "default" }} onClick={() => isAdmin && startReadingEdit(item)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {link ? (
                        <a href={link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 15, color: "#2563eb", textDecoration: "none", fontWeight: 500, lineHeight: 1.4, display: "block" }}>{isFish ? "\uD83D\uDC1F " : ""}{item.title}</a>
                      ) : (
                        <span style={{ fontSize: 15, color: TEXT_PRIMARY, fontWeight: 500, lineHeight: 1.4, display: "block" }}>{isFish ? "\uD83D\uDC1F " : ""}{item.title}</span>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        {item.category && <span style={{ fontSize: 12, color: TEXT_MUTED }}>{item.category}</span>}
                        {item.pdfUrl && <span style={{ fontSize: 10, fontWeight: 700, color: RED, background: "#fef2f2", padding: "1px 5px", borderRadius: 4 }}>PDF</span>}
                        {item.day && item.date && <span style={{ fontSize: 12, color: TEXT_MUTED }}>{item.day} {item.date}</span>}
                      </div>
                      {item.notes && <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 3, lineHeight: 1.4 }}>{item.notes}</div>}
                    </div>
                    {isAdmin && <span style={{ fontSize: 12, color: TEXT_MUTED, flexShrink: 0, marginTop: 2 }}>Edit</span>}
                  </div>
                )}
              </div>
            );
          };

          return (
            <div key={w.week} style={{ ...crd, padding: 18, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>{w.week}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.2 }}>{w.label}</div>
                  {w.theme && <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 1 }}>{w.theme}</div>}
                </div>
              </div>

              {fishbowl.length > 0 && (
                <div style={{ marginBottom: (required.length > 0 || recommended.length > 0 || additional.length > 0) ? 16 : 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Fishbowl</div>
                  {fishbowl.map((item, i) => renderItem(item, i, "fishbowl"))}
                </div>
              )}

              {required.length > 0 && (
                <div style={{ marginBottom: (recommended.length > 0 || additional.length > 0) ? 16 : 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Required</div>
                  {required.map((item, i) => renderItem(item, i, "required"))}
                </div>
              )}

              {recommended.length > 0 && (
                <div style={{ marginBottom: additional.length > 0 ? 16 : 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Recommended</div>
                  {recommended.map((item, i) => renderItem(item, i, "recommended"))}
                </div>
              )}

              {additional.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Additional</div>
                  {additional.map((item, i) => renderItem(item, i, "additional"))}
                </div>
              )}
            </div>
          );
        })}

        {/* Full repository toggle (admin only) */}
        {isAdmin && readings.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <button onClick={() => setShowRepo(!showRepo)} style={{ ...pillInactive, width: "100%", padding: "10px 0", fontSize: 13 }}>
              {showRepo ? "Hide" : "Show"} Full Repository ({readings.length} items)
            </button>
            {showRepo && (
              <div style={{ marginTop: 12 }}>
                {(categories.length > 0 ? categories : [""]).map(cat => {
                  const catReadings = readings.filter(r => (r.category || "") === cat);
                  if (catReadings.length === 0) return null;
                  return (
                    <div key={cat || "__none"} style={{ marginBottom: 16 }}>
                      {cat && <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{cat}</div>}
                      {catReadings.map(r => {
                        const isEdit = editId === r.id;
                        // Find which dates this reading is attached to
                        const attachedDates = [];
                        schedule.forEach(w => {
                          (w.dates || []).forEach(d => {
                            (d.readings || []).forEach(dr => {
                              if (dr.readingId === r.id) attachedDates.push({ week: w.week, date: d.date, day: d.day, type: dr.type });
                            });
                          });
                        });
                        // Build all available dates for attaching
                        const allDates = [];
                        schedule.forEach(w => {
                          (w.dates || []).forEach(d => {
                            if (!d.holiday) allDates.push({ week: w.week, label: w.label, date: d.date, day: d.day });
                          });
                        });

                        return (
                          <div key={r.id} style={{ ...crd, padding: 12, marginBottom: 4 }}>
                            {isEdit && editLocal ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <input value={editLocal.title} onChange={e => setEditLocal({ ...editLocal, title: e.target.value })} style={{ ...inp, fontSize: 14, padding: "6px 10px" }} />
                                <input value={editLocal.url} onChange={e => setEditLocal({ ...editLocal, url: e.target.value })} placeholder="URL" style={{ ...inp, fontSize: 13, padding: "6px 10px" }} />
                                <div style={{ display: "flex", gap: 6 }}>
                                  <input value={editLocal.category} onChange={e => setEditLocal({ ...editLocal, category: e.target.value })} placeholder="Category" list="cat-list" style={{ ...inp, fontSize: 13, padding: "6px 10px", flex: 1 }} />
                                  <select value={editLocal.readingType} onChange={e => setEditLocal({ ...editLocal, readingType: e.target.value })} style={{ ...sel, fontSize: 13, padding: "6px 10px" }}>
                                    <option value="fishbowl">Fishbowl</option>
                                    <option value="required">Required</option>
                                    <option value="recommended">Recommended</option>
                                    <option value="additional">Additional</option>
                                  </select>
                                </div>
                                <textarea value={editLocal.notes} onChange={e => setEditLocal({ ...editLocal, notes: e.target.value })} placeholder="Notes" rows={2} style={{ ...inp, fontSize: 13, padding: "6px 10px", resize: "vertical" }} />
                                {/* Attached dates */}
                                {attachedDates.length > 0 && (
                                  <div style={{ padding: "8px 10px", background: "#f4f4f5", borderRadius: 8 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 4 }}>Attached to</div>
                                    {attachedDates.map((ad, adi) => (
                                      <div key={adi} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "3px 0" }}>
                                        <span style={{ color: TEXT_PRIMARY }}>Week {ad.week} / {ad.day} {ad.date}</span>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: typeColor(ad.type) }}>{typeShort(ad.type)}</span>
                                        <button onClick={async () => {
                                          const newSchedule = schedule.map(w => ({
                                            ...w, dates: w.dates.map(d => d.date === ad.date ? { ...d, readings: (d.readings || []).filter(dr => dr.readingId !== r.id) } : d)
                                          }));
                                          const updated = { ...data, schedule: newSchedule };
                                          await saveData(updated); setData(updated);
                                        }} style={{ background: "none", border: "none", cursor: "pointer", color: RED, fontSize: 11, fontWeight: 600 }}>Remove</button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {/* Attach to date */}
                                <div style={{ display: "flex", gap: 6 }}>
                                  <select id={"attach-date-" + r.id} style={{ ...sel, flex: 1, fontSize: 13, padding: "6px 10px" }}>
                                    <option value="">Attach to date...</option>
                                    {allDates.filter(ad => !attachedDates.some(x => x.date === ad.date)).map(ad => (
                                      <option key={ad.date} value={ad.date}>Wk {ad.week} {ad.day} {ad.date}</option>
                                    ))}
                                  </select>
                                  <select id={"attach-type-" + r.id} style={{ ...sel, fontSize: 13, padding: "6px 10px", width: 130 }}>
                                    <option value="fishbowl">Fishbowl</option>
                                    <option value="required">Required</option>
                                    <option value="recommended">Recommended</option>
                                    <option value="additional">Additional</option>
                                  </select>
                                  <button onClick={async () => {
                                    const dateEl = document.getElementById("attach-date-" + r.id);
                                    const typeEl = document.getElementById("attach-type-" + r.id);
                                    if (!dateEl?.value) return;
                                    const newSchedule = schedule.map(w => ({
                                      ...w, dates: w.dates.map(d => {
                                        if (d.date !== dateEl.value) return d;
                                        const existing = d.readings || [];
                                        if (existing.some(dr => dr.readingId === r.id)) return d;
                                        return { ...d, readings: [...existing, { readingId: r.id, type: typeEl.value }] };
                                      })
                                    }));
                                    const updated = { ...data, schedule: newSchedule };
                                    await saveData(updated); setData(updated);
                                    dateEl.value = "";
                                  }} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", fontSize: 12 }}>Attach</button>
                                </div>
                                {!r.pdfUrl && (
                                  <label style={{ ...pillInactive, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "8px 0", cursor: "pointer", fontSize: 12 }}>
                                    {uploading ? "Uploading..." : "Upload PDF"}
                                    <input type="file" accept=".pdf" onChange={e => { if (e.target.files?.[0]) handlePdfUpload(e.target.files[0], r.id); e.target.value = ""; }} style={{ display: "none" }} disabled={uploading} />
                                  </label>
                                )}
                                {r.pdfUrl && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: "#f0fdf4", borderRadius: 6 }}>
                                    <span style={{ fontSize: 11, color: GREEN, fontWeight: 600, flex: 1 }}>PDF attached</span>
                                    <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#2563eb" }}>View</a>
                                    <button onClick={() => updateReading(r.id, "pdfUrl", "")} style={{ background: "none", border: "none", cursor: "pointer", color: RED, fontSize: 11, fontWeight: 600 }}>Remove</button>
                                  </div>
                                )}
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button onClick={saveReadingEdit} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", flex: 1 }}>Done</button>
                                  <button onClick={() => { if (window.confirm("Delete this reading?")) { deleteReading(r.id); cancelEdit(); } }} style={{ ...pill, background: "#fef2f2", color: RED }}>Delete</button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => startReadingEdit(r)}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: typeColor(r.readingType), textTransform: "uppercase", width: 36, flexShrink: 0 }}>{typeShort(r.readingType)}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    {(r.pdfUrl || r.url) ? (
                                      <a href={r.pdfUrl || r.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 14, color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>{r.title}</a>
                                    ) : (
                                      <span style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY }}>{r.title}</span>
                                    )}
                                    {r.pdfUrl && <span style={{ fontSize: 9, fontWeight: 700, color: RED, background: "#fef2f2", padding: "1px 5px", borderRadius: 4 }}>PDF</span>}
                                  </div>
                                  {r.notes && <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>{r.notes}</div>}
                                  {attachedDates.length > 0 && <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>Wk {attachedDates.map(a => a.week).filter((v,i,a) => a.indexOf(v) === i).join(", ")}</div>}
                                </div>
                                <span style={{ fontSize: 12, color: TEXT_MUTED, flexShrink: 0 }}>Edit</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
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
    await saveData(updated); setData(updated); showMsg("Post archived");
  };

  const unarchivePost = async (boardId, postAuthor) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    const post = (board.posts || {})[postAuthor];
    if (!post) return;
    const updatedPost = { ...post, archived: false };
    const updated = { ...data, boards: boards.map(b => b.id === boardId ? { ...b, posts: { ...b.posts, [postAuthor]: updatedPost } } : b) };
    await saveData(updated); setData(updated); showMsg("Post restored");
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

          {/* Write / edit response */}
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

          {/* All responses */}
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
                {isAdmin && !post.featured && (
                  <button onClick={() => featurePost(board.id, name)} style={{ ...pillInactive, fontSize: 11, padding: "4px 10px" }}>Feature (+5 pts)</button>
                )}
                {isAdmin && (
                  <button onClick={() => archivePost(board.id, name)} style={{ ...pillInactive, fontSize: 11, padding: "4px 10px" }}>Archive</button>
                )}
                {isAdmin && (
                  <button onClick={() => { if (window.confirm("Delete " + name + "'s post?")) deletePost(board.id, name); }} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11, padding: "4px 10px" }}>Delete</button>
                )}
                {name === userName && snapCount > 0 && (
                  <span style={{ fontSize: 12, color: TEXT_MUTED }}>{snapCount} snap{snapCount !== 1 ? "s" : ""}</span>
                )}
              </div>
            </div>
            );
          })}

          {/* Archived posts (admin only) */}
          {isAdmin && archivedPostList.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Archived Posts ({archivedPostList.length})</div>
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

/* ─── SURVEY ─── */
function SurveyView({ data, setData, isAdmin, userName }) {
  const surveys = data.surveys || [];

  // Auto-close surveys past their closeAt time
  React.useEffect(() => {
    const toClose = surveys.filter(s => s.active && s.closeAt && Date.now() > s.closeAt);
    if (toClose.length > 0) {
      const updated = { ...data, surveys: surveys.map(s => toClose.find(tc => tc.id === s.id) ? { ...s, active: false } : s) };
      saveData(updated); setData(updated);
    }
  }, [surveys.length]);
  const [creating, setCreating] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [viewingResults, setViewingResults] = useState(null);
  const [changing, setChanging] = useState({});
  const [questions, setQuestions] = useState([{ text: "", type: "multiple_choice", options: ["", "", "", ""] }]);
  const [surveyTitle, setSurveyTitle] = useState("");
  const [surveyCloseAt, setSurveyCloseAt] = useState("");
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const TYPES = [
    { id: "multiple_choice", label: "Multiple Choice" },
    { id: "number", label: "Number" },
    { id: "true_false", label: "True or False" },
    { id: "short_answer", label: "Short Answer" },
    { id: "likert", label: "Likert Scale (1-5)" },
  ];

  const addQuestion = () => { if (questions.length >= 10) return; setQuestions([...questions, { text: "", type: "multiple_choice", options: ["", "", "", ""] }]); };
  const removeQuestion = (idx) => { if (questions.length <= 1) return; setQuestions(questions.filter((_, i) => i !== idx)); };
  const updateQuestion = (idx, field, value) => { setQuestions(questions.map((q, i) => i === idx ? { ...q, [field]: value } : q)); };
  const updateOption = (qIdx, oIdx, value) => { setQuestions(questions.map((q, i) => i === qIdx ? { ...q, options: q.options.map((o, j) => j === oIdx ? value : o) } : q)); };
  const addOption = (qIdx) => { setQuestions(questions.map((q, i) => i === qIdx ? { ...q, options: [...q.options, ""] } : q)); };

  const createSurvey = async () => {
    const validQs = questions.filter(q => q.text.trim());
    if (validQs.length === 0) return;
    const s = { id: genId(), title: surveyTitle.trim() || "Survey", questions: validQs.map(q => ({ id: genId(), text: q.text.trim(), type: q.type, options: q.type === "multiple_choice" ? q.options.filter(o => o.trim()) : [] })), responses: {}, active: true, showResults: false, ts: Date.now(), closeAt: surveyCloseAt ? new Date(surveyCloseAt).getTime() : null };
    const updated = { ...data, surveys: [...surveys, s] };
    await saveData(updated); setData(updated);
    setSurveyTitle(""); setSurveyCloseAt(""); setQuestions([{ text: "", type: "multiple_choice", options: ["", "", "", ""] }]); setCreating(false); showMsg("Survey created");
  };

  const startEditSurvey = (survey) => {
    setSurveyTitle(survey.title);
    setSurveyCloseAt(survey.closeAt ? new Date(survey.closeAt).toISOString().slice(0, 16) : "");
    setQuestions((survey.questions || []).map(q => ({ text: q.text, type: q.type, options: q.type === "multiple_choice" ? [...q.options] : ["", "", "", ""], id: q.id })));
    setEditingSurvey(survey.id);
    setCreating(false);
  };

  const saveSurveyEdit = async () => {
    const validQs = questions.filter(q => q.text.trim());
    if (validQs.length === 0) return;
    const updated = { ...data, surveys: surveys.map(s => s.id === editingSurvey ? { ...s, title: surveyTitle.trim() || s.title, closeAt: surveyCloseAt ? new Date(surveyCloseAt).getTime() : null, questions: validQs.map(q => ({ id: q.id || genId(), text: q.text.trim(), type: q.type, options: q.type === "multiple_choice" ? q.options.filter(o => o.trim()) : [] })) } : s) };
    await saveData(updated); setData(updated);
    setSurveyTitle(""); setSurveyCloseAt(""); setQuestions([{ text: "", type: "multiple_choice", options: ["", "", "", ""] }]); setEditingSurvey(null); showMsg("Survey updated");
  };

  const respond = async (surveyId, questionId, answer) => {
    const latestRaw = await window.storage.get("comm4-v1", true);
    const latest = latestRaw?.value ? JSON.parse(latestRaw.value) : data;
    const survey = (latest.surveys || []).find(s => s.id === surveyId);
    if (!survey) return;
    const responses = { ...(survey.responses || {}) };
    responses[userName] = { ...(responses[userName] || {}), [questionId]: answer };
    const updated = { ...latest, surveys: (latest.surveys || []).map(s => s.id === surveyId ? { ...s, responses } : s) };
    await saveData(updated); setData(updated);
    setChanging(prev => { const n = { ...prev }; delete n[questionId]; return n; });
  };

  const toggleResults = async (surveyId) => {
    const updated = { ...data, surveys: surveys.map(s => s.id === surveyId ? { ...s, showResults: !s.showResults } : s) };
    await saveData(updated); setData(updated);
  };
  const closeSurvey = async (surveyId) => {
    const updated = { ...data, surveys: surveys.map(s => s.id === surveyId ? { ...s, active: false } : s) };
    await saveData(updated); setData(updated); showMsg("Survey closed");
  };
  const deleteSurvey = async (surveyId) => {
    const updated = { ...data, surveys: surveys.filter(s => s.id !== surveyId) };
    await saveData(updated); setData(updated); showMsg("Deleted"); if (viewingResults === surveyId) setViewingResults(null);
  };

  const getResponses = (survey, questionId) => {
    const all = [];
    Object.values(survey.responses || {}).forEach(ua => { if (ua[questionId] !== undefined) all.push(ua[questionId]); });
    return all;
  };

  const renderResults = (question, answers) => {
    if (answers.length === 0) return <div style={{ fontSize: 13, color: TEXT_MUTED, padding: "4px 0" }}>No responses yet</div>;
    if (question.type === "multiple_choice") {
      const counts = {}; question.options.forEach(o => { counts[o] = 0; }); answers.forEach(a => { counts[a] = (counts[a] || 0) + 1; });
      const max = Math.max(...Object.values(counts), 1);
      return (<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{question.options.map(o => (
        <div key={o} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: TEXT_PRIMARY, width: 120, flexShrink: 0, fontWeight: 500 }}>{o}</span>
          <div style={{ flex: 1, background: "#f4f4f5", borderRadius: 6, height: 24, overflow: "hidden" }}><div style={{ height: "100%", width: (counts[o] / max * 100) + "%", background: ACCENT, borderRadius: 6, transition: "width 0.3s" }} /></div>
          <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, width: 28, textAlign: "right" }}>{counts[o]}</span>
        </div>))}</div>);
    }
    if (question.type === "true_false") {
      const t = answers.filter(a => a === "True").length, f = answers.filter(a => a === "False").length, total = t + f || 1;
      return (<div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1, ...crd, padding: 14, textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800, color: GREEN }}>{Math.round(t / total * 100)}%</div><div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>True ({t})</div></div>
        <div style={{ flex: 1, ...crd, padding: 14, textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800, color: RED }}>{Math.round(f / total * 100)}%</div><div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>False ({f})</div></div>
      </div>);
    }
    if (question.type === "likert") {
      const counts = [0, 0, 0, 0, 0]; answers.forEach(a => { const v = parseInt(a); if (v >= 1 && v <= 5) counts[v - 1]++; });
      const max = Math.max(...counts, 1);
      const avg = answers.length > 0 ? (answers.reduce((s, a) => s + (parseInt(a) || 0), 0) / answers.length).toFixed(1) : "0";
      return (<div><div style={{ textAlign: "center", marginBottom: 10 }}><span style={{ fontSize: 24, fontWeight: 800, color: ACCENT }}>{avg}</span><span style={{ fontSize: 13, color: TEXT_MUTED, marginLeft: 4 }}>/ 5 avg</span></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{[1,2,3,4,5].map(n => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: TEXT_SECONDARY, width: 20, textAlign: "center", flexShrink: 0, fontWeight: 700 }}>{n}</span>
            <div style={{ flex: 1, background: "#f4f4f5", borderRadius: 4, height: 18, overflow: "hidden" }}><div style={{ height: "100%", width: (counts[n-1] / max * 100) + "%", background: ACCENT, borderRadius: 4, transition: "width 0.3s" }} /></div>
            <span style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, width: 20, textAlign: "right" }}>{counts[n-1]}</span>
          </div>))}</div></div>);
    }
    if (question.type === "number") {
      const nums = answers.map(a => parseFloat(a)).filter(n => !isNaN(n));
      const avg = nums.length > 0 ? (nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(1) : "0";
      const mn = nums.length > 0 ? Math.min(...nums) : 0, mx = nums.length > 0 ? Math.max(...nums) : 0;
      return (<div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1, ...crd, padding: 10, textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 800, color: ACCENT }}>{avg}</div><div style={{ fontSize: 11, color: TEXT_MUTED }}>Avg</div></div>
        <div style={{ flex: 1, ...crd, padding: 10, textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 800, color: TEXT_PRIMARY }}>{mn}</div><div style={{ fontSize: 11, color: TEXT_MUTED }}>Min</div></div>
        <div style={{ flex: 1, ...crd, padding: 10, textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 800, color: TEXT_PRIMARY }}>{mx}</div><div style={{ fontSize: 11, color: TEXT_MUTED }}>Max</div></div>
      </div>);
    }
    if (question.type === "short_answer") {
      return (<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{answers.map((a, i) => (
        <div key={i} style={{ fontSize: 14, color: TEXT_PRIMARY, padding: "6px 10px", background: "#f4f4f5", borderRadius: 8, lineHeight: 1.4 }}>{a}</div>
      ))}</div>);
    }
    return null;
  };

  const renderAnswerInput = (survey, question) => {
    const userAnswers = (survey.responses || {})[userName] || {};
    const answered = userAnswers[question.id] !== undefined;
    const currentAnswer = userAnswers[question.id];
    const showCurrent = answered && !changing[question.id];
    if (showCurrent) return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
        <span style={{ fontSize: 13, color: GREEN, fontWeight: 600 }}>Your answer: {String(currentAnswer)}</span>
        <button onClick={() => setChanging(prev => ({ ...prev, [question.id]: true }))} style={{ fontSize: 11, color: ACCENT, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontWeight: 600 }}>Change</button>
      </div>
    );
    if (question.type === "multiple_choice") return (<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{question.options.map(o => (<button key={o} onClick={() => respond(survey.id, question.id, o)} style={{ ...crd, padding: "10px 14px", cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: 500, color: o === currentAnswer ? "#fff" : TEXT_PRIMARY, background: o === currentAnswer ? ACCENT : "#fff", border: "1px solid " + (o === currentAnswer ? ACCENT : BORDER) }}>{o}</button>))}</div>);
    if (question.type === "true_false") return (<div style={{ display: "flex", gap: 8 }}><button onClick={() => respond(survey.id, question.id, "True")} style={{ ...pill, background: currentAnswer === "True" ? GREEN : "#ecfdf5", color: currentAnswer === "True" ? "#fff" : GREEN, flex: 1, padding: "12px 0", fontSize: 15, fontWeight: 700 }}>True</button><button onClick={() => respond(survey.id, question.id, "False")} style={{ ...pill, background: currentAnswer === "False" ? RED : "#fef2f2", color: currentAnswer === "False" ? "#fff" : RED, flex: 1, padding: "12px 0", fontSize: 15, fontWeight: 700 }}>False</button></div>);
    if (question.type === "likert") return (<div style={{ display: "flex", gap: 6, justifyContent: "center" }}>{[1,2,3,4,5].map(n => (<button key={n} onClick={() => respond(survey.id, question.id, String(n))} style={{ ...crd, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 17, fontWeight: 700, color: String(n) === String(currentAnswer) ? "#fff" : TEXT_PRIMARY, background: String(n) === String(currentAnswer) ? ACCENT : "#fff", border: "1px solid " + (String(n) === String(currentAnswer) ? ACCENT : BORDER) }}>{n}</button>))}</div>);
    if (question.type === "number") return (<div style={{ display: "flex", gap: 8 }}><input id={"num-" + question.id} type="number" defaultValue={currentAnswer || ""} placeholder="Enter a number" style={{ ...inp, flex: 1 }} /><button onClick={() => { const el = document.getElementById("num-" + question.id); if (el?.value) { respond(survey.id, question.id, el.value); } }} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff" }}>Submit</button></div>);
    if (question.type === "short_answer") return (<div style={{ display: "flex", gap: 8 }}><input id={"sa-" + question.id} defaultValue={currentAnswer || ""} placeholder="Your answer" style={{ ...inp, flex: 1 }} /><button onClick={() => { const el = document.getElementById("sa-" + question.id); if (el?.value?.trim()) { respond(survey.id, question.id, el.value.trim()); } }} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff" }}>Submit</button></div>);
    return null;
  };

  // Results view
  const activeSurveys = surveys.filter(s => s.active);
  const closedSurveys = surveys.filter(s => !s.active);

  return (
    <div style={{ padding: "24px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ ...sectionLabel }}>Survey</div>
          {isAdmin && <button onClick={() => { if (editingSurvey) { setEditingSurvey(null); setSurveyTitle(""); setQuestions([{ text: "", type: "multiple_choice", options: ["", "", "", ""] }]); } else { setCreating(!creating); setEditingSurvey(null); } }} style={(creating || editingSurvey) ? pillActive : pillInactive}>{(creating || editingSurvey) ? "Cancel" : "+ New Survey"}</button>}
        </div>

        {isAdmin && (creating || editingSurvey) && (
          <div style={{ ...crd, padding: 18, marginBottom: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input value={surveyTitle} onChange={e => setSurveyTitle(e.target.value)} placeholder="Survey title" style={{ ...inp, fontWeight: 700, fontSize: 16 }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 4 }}>Auto-close (optional)</div>
                <input type="datetime-local" value={surveyCloseAt} onChange={e => setSurveyCloseAt(e.target.value)} style={{ ...inp, fontSize: 13 }} />
              </div>
              {questions.map((q, qi) => (
                <div key={qi} style={{ padding: 14, background: "#f4f4f5", borderRadius: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: TEXT_MUTED }}>Q{qi + 1}</span>
                    {questions.length > 1 && <button onClick={() => removeQuestion(qi)} style={{ background: "none", border: "none", cursor: "pointer", color: RED, fontSize: 12, fontWeight: 600 }}>Remove</button>}
                  </div>
                  <textarea value={q.text} onChange={e => updateQuestion(qi, "text", e.target.value)} placeholder="Question text" rows={2} style={{ ...inp, resize: "vertical", marginBottom: 8 }} />
                  <select value={q.type} onChange={e => updateQuestion(qi, "type", e.target.value)} style={{ ...sel, width: "100%", fontSize: 14, marginBottom: 8 }}>
                    {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  {q.type === "multiple_choice" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {q.options.map((o, oi) => (<input key={oi} value={o} onChange={e => updateOption(qi, oi, e.target.value)} placeholder={"Option " + (oi + 1)} style={{ ...inp, fontSize: 13 }} />))}
                      <button onClick={() => addOption(qi)} style={{ ...pillInactive, fontSize: 11, marginTop: 2 }}>+ Option</button>
                    </div>
                  )}
                </div>
              ))}
              {questions.length < 10 && <button onClick={addQuestion} style={{ ...pillInactive, width: "100%" }}>+ Add Question ({questions.length}/10)</button>}
              <button onClick={editingSurvey ? saveSurveyEdit : createSurvey} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", padding: "12px 0" }}>{editingSurvey ? "Save Changes" : "Create Survey"}</button>
            </div>
          </div>
        )}

        {activeSurveys.length === 0 && !creating && <div style={{ ...crd, padding: 24, textAlign: "center", color: TEXT_MUTED, fontSize: 14 }}>No active surveys</div>}
        {activeSurveys.map(survey => {
          const responderCount = Object.keys(survey.responses || {}).length;
          const userAnswers = (survey.responses || {})[userName] || {};
          const totalQs = (survey.questions || []).length;
          const answeredQs = Object.keys(userAnswers).length;
          const allAnswered = answeredQs >= totalQs;
          return (
            <div key={survey.id} style={{ ...crd, padding: 18, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>{survey.title}</div>
                  <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{totalQs} question{totalQs !== 1 ? "s" : ""} / {responderCount} respondent{responderCount !== 1 ? "s" : ""}</div>
                  {survey.closeAt && <div style={{ fontSize: 12, color: Date.now() > survey.closeAt * 0.95 ? AMBER : TEXT_SECONDARY, fontWeight: 500, marginTop: 2 }}>Closes: {new Date(survey.closeAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>}
                </div>
                {(isAdmin || survey.showResults) && <button onClick={() => setViewingResults(viewingResults === survey.id ? null : survey.id)} style={viewingResults === survey.id ? pillActive : pillInactive}>{viewingResults === survey.id ? "Hide Results" : "Results"}</button>}
              </div>
              {!isAdmin && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {(survey.questions || []).map((q, qi) => (
                    <div key={q.id}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 6, lineHeight: 1.35 }}>{qi + 1}. {q.text}</div>
                      {renderAnswerInput(survey, q)}
                    </div>
                  ))}
                </div>
              )}
              
              {isAdmin && (
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button onClick={() => startEditSurvey(survey)} style={pillInactive}>Edit</button>
                  <button onClick={() => toggleResults(survey.id)} style={survey.showResults ? pillActive : pillInactive}>{survey.showResults ? "Hide from Students" : "Show to Students"}</button>
                  <button onClick={() => closeSurvey(survey.id)} style={pillInactive}>Close</button>
                  <button onClick={() => { if (window.confirm("Delete?")) deleteSurvey(survey.id); }} style={{ ...pill, background: "#fef2f2", color: RED }}>Delete</button>
                </div>
              )}

              {viewingResults === survey.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid " + BORDER }}>
                  {(survey.questions || []).map((q, qi) => {
                    const answers = getResponses(survey, q.id);
                    return (
                      <div key={q.id} style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 4 }}>Question {qi + 1}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 8, lineHeight: 1.35 }}>{q.text}</div>
                        {renderResults(q, answers)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {closedSurveys.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ ...sectionLabel, marginBottom: 10 }}>Closed Surveys</div>
            {closedSurveys.map(survey => (
              <div key={survey.id} style={{ ...crd, padding: 14, marginBottom: 8, opacity: 0.7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{survey.title}</div><div style={{ fontSize: 12, color: TEXT_MUTED }}>{Object.keys(survey.responses || {}).length} respondents</div></div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setViewingResults(viewingResults === survey.id ? null : survey.id)} style={{ ...(viewingResults === survey.id ? pillActive : pillInactive), fontSize: 11 }}>{viewingResults === survey.id ? "Hide" : "Results"}</button>
                    {isAdmin && <button onClick={() => { if (window.confirm("Delete?")) deleteSurvey(survey.id); }} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11 }}>Delete</button>}
                  </div>
                </div>
                {viewingResults === survey.id && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid " + BORDER }}>
                    {(survey.questions || []).map((q, qi) => {
                      const answers = getResponses(survey, q.id);
                      return (
                        <div key={q.id} style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 4 }}>Question {qi + 1}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 8, lineHeight: 1.35 }}>{q.text}</div>
                          {renderResults(q, answers)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── CLASS TOOLS: HEADLINE EXERCISE ─── */
const DEFAULT_HEADLINE_CATS = [
  "Gambling / betting", "Unreal performances", "Record-breaking / milestones",
  "Celebs being bad", "Doping / cheating / scandals", "New business deals",
  "Trades / free agency", "Coaching hires / firings", "Dealing with media",
  "Identity", "Social justice / activism", "Fan behavior", "Stadium / arena deals",
  "Youth / college pipeline", "Team drama", "Rivalry / beef", "Injuries / comebacks",
  "Labor disputes", "International / global", "Legacy / Hall of Fame / retirement",
];

const COMM_CONCEPTS = [
  { id: "mythmaking", name: "Mythmaking / Hero Narrative",
    desc: "How we construct larger-than-life stories around people and moments. We pick who becomes a legend and why.",
    whyItMatters: "Narratives shape public memory. The stories we tell about athletes determine who gets celebrated and who gets forgotten. This is rhetorical power in action.",
    whoItAffects: "Athletes whose legacies are simplified or distorted. Fans who internalize these narratives. Communities that build identity around hero figures.",
    exampleAngles: "GOAT debates that ignore context. Retirement tributes that rewrite flawed careers. Comeback stories that erase the people who were hurt along the way." },
  { id: "crisis", name: "Crisis Communication / Accountability",
    desc: "What happens when things go wrong publicly. Who speaks, what they say, how they try to recover.",
    whyItMatters: "Public apologies and crisis responses reveal power dynamics. Who gets second chances and who doesn't is never random.",
    whoItAffects: "The person in crisis, their organization, victims or affected parties, the public audience judging the response.",
    exampleAngles: "Notes app apologies. Organizations distancing from individuals. The difference between accountability and PR strategy." },
  { id: "media", name: "Media Framing / Agenda Setting",
    desc: "The media doesn't tell you what to think, it tells you what to think about. Who controls the story and how it gets shaped.",
    whyItMatters: "Media framing determines which stories get oxygen and which get buried. Billions of dollars flow based on what gets covered and how.",
    whoItAffects: "Athletes who lose control of their narrative. Audiences who only see what's selected for them. Communities whose stories are told by outsiders.",
    exampleAngles: "How the same play gets framed differently for different quarterbacks. Streaming deals that reshape what sports you can even watch. Social media breaking the traditional media monopoly." },
  { id: "organizational", name: "Organizational Communication",
    desc: "How institutions make decisions, manage conflict, and communicate with stakeholders. The business and structural side of sports.",
    whyItMatters: "Organizations are communication systems. Every trade, contract, and policy change is a message about values and priorities.",
    whoItAffects: "Players as labor. Fans as consumers. Cities as stakeholders. The people inside the organization who have to execute decisions they may not agree with.",
    exampleAngles: "Franchise relocations and what they communicate to a city. CBA negotiations as organizational power struggles. How front offices communicate (or don't) with players about their futures." },
  { id: "identity", name: "Identity / Representation",
    desc: "How sports shape and reflect who we think we are, who gets seen, and who gets left out.",
    whyItMatters: "Sports are one of the most visible arenas for identity. Who plays, who coaches, who owns, who commentates, all of it communicates something about who belongs.",
    whoItAffects: "Athletes navigating identity in public. Young people who see (or don't see) themselves represented. Communities whose identities are tied to teams.",
    exampleAngles: "First openly gay/trans athletes and the discourse around them. Racial dynamics in coaching hires. National identity in international competition." },
  { id: "interpersonal", name: "Interpersonal Communication, Leadership, and Culture",
    desc: "How people communicate within sports organizations. Coach-to-player, player-to-player, locker room culture, team rituals, pregame traditions. The human side of how teams function or fall apart.",
    whyItMatters: "Culture is built through daily communication. What a coach says in the huddle, what teammates say behind closed doors, what rituals a team keeps, all of it creates or destroys trust.",
    whoItAffects: "Players whose development depends on coaching relationships. Teams whose culture determines their ceiling. Leaders who set the tone through what they say and don't say.",
    exampleAngles: "A coach's postgame comments about a player that change the relationship. Team traditions that build belonging vs hazing that destroys it. What gets said in the locker room that leaks to the press." },
  { id: "community", name: "Community, Belonging, and the Fabric of Society",
    desc: "How sports are woven into the structure of our society. Civic identity, NIL and who gets paid, stadium deals that reshape cities, youth pipelines, fandom as community.",
    whyItMatters: "Sports are not separate from society, they are society. The way we fund stadiums, compensate athletes, organize youth sports, and define fandom tells us what we value.",
    whoItAffects: "Taxpayers funding stadiums. College athletes navigating NIL. Youth athletes and their families investing time and money. Communities that gain or lose teams.",
    exampleAngles: "A city voting on a stadium deal. NIL changing who benefits from college sports. Youth travel sports pricing out lower-income families. What it means when your team leaves your city." },
];

function ClassTools({ data, setData, isAdmin, userName }) {
  const isGuest = userName === GUEST_NAME;
  const student = data.students.find(s => s.name === userName);
  const sid = student?.id;
  const hl = data.headlines || { categories: [], items: [], sessions: [] };
  const cats = hl.categories && hl.categories.length > 0 ? hl.categories : DEFAULT_HEADLINE_CATS;
  const items = hl.items || [];
  const sessions = hl.sessions || [];
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const [activeSession, setActiveSession] = useState(null);
  const [newHeadline, setNewHeadline] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCat, setNewCat] = useState("");
  const [realPicks, setRealPicks] = useState([]);
  const [conceptPicks, setConceptPicks] = useState([]);
  const [adminNotes, setAdminNotes] = useState("");
  const [myPicks, setMyPicks] = useState([]);
  const [myConceptPicks, setMyConceptPicks] = useState([]);

  const saveHL = async (updated) => { const d = { ...data, headlines: updated }; await saveData(d); setData(d); };
  const ensureCats = () => hl.categories && hl.categories.length > 0 ? hl.categories : DEFAULT_HEADLINE_CATS;

  const addCategory = async () => {
    if (!newCat.trim() || cats.includes(newCat.trim())) return;
    await saveHL({ ...hl, categories: [...cats, newCat.trim()] });
    setNewCat(""); showMsg("Category added");
  };
  const submitHeadline = async (sessionId) => {
    if (!newHeadline.trim()) return;
    const item = { id: genId(), text: newHeadline.trim(), url: newUrl.trim() || null, submittedBy: userName, sessionId, ts: Date.now() };
    await saveHL({ ...hl, categories: ensureCats(), items: [...items, item] });
    setNewHeadline(""); setNewUrl(""); showMsg("Headline added");
  };
  const createSession = async () => {
    const s = { id: genId(), name: "Session " + (sessions.length + 1), ts: Date.now(), activeHeadlineId: null, phase: "surface", realCategories: [], realConcepts: [], votes: {}, conceptVotes: {} };
    await saveHL({ ...hl, categories: ensureCats(), sessions: [...sessions, s] });
    setActiveSession(s.id); showMsg("Session created");
  };
  const activateHeadline = async (sessionId, headlineId) => {
    await saveHL({ ...hl, sessions: sessions.map(s => s.id === sessionId ? { ...s, activeHeadlineId: headlineId, phase: "surface", realCategories: [], realConcepts: [], votes: {}, conceptVotes: {} } : s) });
    setRealPicks([]); setConceptPicks([]); setMyPicks([]); setMyConceptPicks([]); setAdminNotes("");
  };

  // Student votes
  const togglePick = (cat) => setMyPicks(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  const toggleConceptPick = (id) => setMyConceptPicks(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  const lockInSurface = async (sessionId) => {
    if (!sid || myPicks.length === 0) return;
    await saveHL({ ...hl, sessions: sessions.map(s => s.id === sessionId ? { ...s, votes: { ...s.votes, [sid]: myPicks } } : s) });
    showMsg("Locked in");
  };
  const lockInConcept = async (sessionId) => {
    if (!sid || myConceptPicks.length === 0) return;
    await saveHL({ ...hl, sessions: sessions.map(s => s.id === sessionId ? { ...s, conceptVotes: { ...(s.conceptVotes || {}), [sid]: myConceptPicks } } : s) });
    showMsg("Locked in");
  };

  // Admin reveals
  const toggleReal = (cat) => setRealPicks(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  const toggleConceptReal = (id) => setConceptPicks(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  const revealSurface = async (sessionId) => {
    if (realPicks.length === 0) return;
    await saveHL({ ...hl, sessions: sessions.map(s => s.id === sessionId ? { ...s, phase: "concept", realCategories: realPicks } : s) });
    setMyConceptPicks([]);
  };
  const revealConcept = async (sessionId) => {
    if (conceptPicks.length === 0) return;
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    const hid = session.activeHeadlineId;
    const updatedItems = items.map(it => it.id === hid ? { ...it, realCategories: session.realCategories, realConcepts: conceptPicks, surfaceVotes: session.votes, conceptVotesData: session.conceptVotes, adminNotes: adminNotes.trim() || it.adminNotes } : it);
    await saveHL({ ...hl, items: updatedItems, sessions: sessions.map(s => s.id === sessionId ? { ...s, phase: "done", realConcepts: conceptPicks } : s) });
  };
  const closeSession = async (sessionId) => {
    if (!window.confirm("End this Headlines session? It will no longer show as live.")) return;
    await saveHL({ ...hl, sessions: sessions.map(s => s.id === sessionId ? { ...s, phase: "done", activeHeadlineId: null } : s) });
    showMsg("Session ended");
  };
  const saveHeadlineNotes = async (headlineId, notes) => {
    await saveHL({ ...hl, items: items.map(it => it.id === headlineId ? { ...it, adminNotes: notes } : it) });
    showMsg("Notes saved");
  };

  const session = activeSession ? sessions.find(s => s.id === activeSession) : null;
  const sessionHeadlines = session ? items.filter(it => it.sessionId === session.id) : [];
  const activeHeadline = session ? items.find(it => it.id === session.activeHeadlineId) : null;
  const phase = session?.phase || "surface";

  // Tallies
  const buildTally = (votesObj) => {
    const tally = {}; let count = 0;
    Object.values(votesObj || {}).forEach(picks => {
      count++;
      (Array.isArray(picks) ? picks : [picks]).forEach(c => { tally[c] = (tally[c] || 0) + 1; });
    });
    return { tally, count };
  };
  const { tally: surfaceTally, count: surfaceVoterCount } = buildTally(session?.votes);
  const { tally: conceptTally, count: conceptVoterCount } = buildTally(session?.conceptVotes);

  const myVoteArr = sid && session?.votes?.[sid] ? (Array.isArray(session.votes[sid]) ? session.votes[sid] : [session.votes[sid]]) : null;
  const myConceptVoteArr = sid && session?.conceptVotes?.[sid] ? (Array.isArray(session.conceptVotes[sid]) ? session.conceptVotes[sid] : [session.conceptVotes[sid]]) : null;

  // Render vote results bar
  const VoteBar = ({ items: voteItems, tally: t, total, realItems, label }) => (
    <div style={{ ...crd, padding: 14, marginBottom: 12 }}>
      <div style={{ ...sectionLabel, marginBottom: 8 }}>{label} ({total} students)</div>
      {voteItems.filter(c => t[c]).sort((a, b) => (t[b] || 0) - (t[a] || 0)).map(cat => {
        const count = t[cat] || 0;
        const pct = total > 0 ? Math.round(count / total * 100) : 0;
        const isReal = (realItems || []).includes(cat);
        return (
          <div key={cat} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: isReal ? 900 : 500, color: isReal ? GREEN : TEXT_PRIMARY }}>{cat}{isReal ? " \u2713" : ""}</div>
              <div style={{ height: 3, background: "#f4f4f5", borderRadius: 2, marginTop: 2 }}>
                <div style={{ height: "100%", width: pct + "%", background: isReal ? GREEN : TEXT_MUTED, borderRadius: 2 }} />
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY, width: 30, textAlign: "right" }}>{count}</span>
          </div>
        );
      })}
      {total === 0 && <div style={{ fontSize: 13, color: "#d4d4d8", textAlign: "center", padding: 12 }}>Waiting for responses...</div>}
    </div>
  );

  // Talking points panel (admin only, after concept reveal)
  const TalkingPoints = ({ conceptIds, headline }) => {
    const concepts = COMM_CONCEPTS.filter(c => conceptIds.includes(c.id));
    return (
      <div style={{ marginTop: 16 }}>
        <div style={{ ...sectionLabel, marginBottom: 8 }}>Talking Points (admin only)</div>
        {concepts.map(c => (
          <div key={c.id} style={{ ...crd, padding: 14, marginBottom: 8, borderLeft: "4px solid " + ACCENT }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: TEXT_PRIMARY, marginBottom: 6 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 8, lineHeight: 1.4 }}>{c.desc}</div>
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: "uppercase", marginBottom: 2 }}>Why it matters</div>
              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.4 }}>{c.whyItMatters}</div>
            </div>
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: "uppercase", marginBottom: 2 }}>Who it affects</div>
              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.4 }}>{c.whoItAffects}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: "uppercase", marginBottom: 2 }}>Example angles</div>
              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.4 }}>{c.exampleAngles}</div>
            </div>
          </div>
        ))}
        <div style={{ ...crd, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 4 }}>Your notes for this headline</div>
          <textarea value={adminNotes || headline?.adminNotes || ""} onChange={e => setAdminNotes(e.target.value)} placeholder="Add your own talking points, examples, discussion questions..." rows={3} style={{ ...inp, fontSize: 12, resize: "vertical" }} />
          <button onClick={() => saveHeadlineNotes(headline.id, adminNotes)} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", padding: "8px 0", width: "100%", marginTop: 6 }}>Save Notes</button>
        </div>
      </div>
    );
  };

  if (isGuest) {
    return <div style={{ padding: 40, textAlign: "center", fontFamily: F }}><div style={{ ...sectionLabel, marginBottom: 8 }}>Class Tools</div><div style={{ fontSize: 14, color: TEXT_SECONDARY }}>Sign in to participate.</div></div>;
  }

  // ── ADMIN VIEW ──
  if (isAdmin) {
    if (session) {
      return (
        <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
          <Toast message={msg} />
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <button onClick={() => setActiveSession(null)} style={pillInactive}>Back</button>
              <div style={{ fontSize: 16, fontWeight: 900, color: TEXT_PRIMARY }}>Headlines</div>
              <button onClick={() => closeSession(session.id)} style={{ ...pillInactive, color: RED }}>End session</button>
            </div>

            <div style={{ ...crd, padding: 14, marginBottom: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <input value={newHeadline} onChange={e => setNewHeadline(e.target.value)} placeholder="Headline text..." style={inp} />
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="URL (optional)" style={{ ...inp, flex: 1 }} />
                  <button onClick={() => submitHeadline(session.id)} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", padding: "10px 16px" }}>Add</button>
                </div>
              </div>
            </div>

            <div style={{ ...sectionLabel, marginBottom: 8 }}>Headlines ({sessionHeadlines.length})</div>
            {sessionHeadlines.map(h => {
              const isActive = session.activeHeadlineId === h.id;
              const rc = h.realCategories || []; const rco = h.realConcepts || [];
              return (
                <div key={h.id} style={{ ...crd, padding: 12, marginBottom: 4, borderColor: isActive ? ACCENT : "#f4f4f5", borderWidth: isActive ? 2 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: TEXT_PRIMARY }}>{h.text}</div>
                      {h.url && <a href={h.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 11, color: "#2563eb", textDecoration: "none" }}>Source</a>}
                      {rc.length > 0 && <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{rc.join(", ")}</div>}
                      {rco.length > 0 && <div style={{ fontSize: 11, color: ACCENT, fontWeight: 600 }}>{rco.map(id => COMM_CONCEPTS.find(c => c.id === id)?.name || id).join(", ")}</div>}
                    </div>
                    {!isActive && <button onClick={() => activateHeadline(session.id, h.id)} style={{ ...pill, background: "#f4f4f5", color: "#52525b", fontSize: 11, padding: "4px 10px" }}>Activate</button>}
                  </div>
                </div>
              );
            })}

            {activeHeadline && (
              <div style={{ marginTop: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ ...sectionLabel }}>Active Headline</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: phase === "surface" ? "#2563eb" : phase === "concept" ? PURPLE : GREEN, background: phase === "surface" ? "#eff6ff" : phase === "concept" ? "#f5f3ff" : "#f0fdf4", padding: "2px 8px", borderRadius: 4 }}>
                    {phase === "surface" ? "Step 1: Surface" : phase === "concept" ? "Step 2: Concept" : "Complete"}
                  </span>
                </div>
                <div style={{ ...crd, padding: 20, textAlign: "center", marginBottom: 16, background: TEXT_PRIMARY, borderColor: TEXT_PRIMARY }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1.3 }}>{activeHeadline.text}</div>
                  {activeHeadline.url && <a href={activeHeadline.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textDecoration: "none", marginTop: 6, display: "inline-block" }}>View source</a>}
                </div>

                {phase === "surface" && (
                  <div>
                    <VoteBar items={cats} tally={surfaceTally} total={surfaceVoterCount} realItems={[]} label="Surface Category Responses" />
                    <div style={{ ...sectionLabel, marginBottom: 8 }}>What surface categories fit? (select all that apply)</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                      {cats.map(cat => (
                        <button key={cat} onClick={() => toggleReal(cat)} style={{ ...pill, fontSize: 11, padding: "6px 10px", background: realPicks.includes(cat) ? GREEN : "#f4f4f5", color: realPicks.includes(cat) ? "#fff" : "#374151" }}>{cat}</button>
                      ))}
                    </div>
                    {realPicks.length > 0 && <button onClick={() => revealSurface(session.id)} style={{ ...pill, background: ACCENT, color: "#fff", padding: "10px 20px", fontSize: 13 }}>Reveal Surface ({realPicks.length})</button>}
                  </div>
                )}

                {phase === "concept" && (
                  <div>
                    <div style={{ ...crd, padding: 14, background: "#f0fdf4", borderColor: GREEN, textAlign: "center", marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: GREEN, fontWeight: 600, textTransform: "uppercase" }}>Surface categories</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: TEXT_PRIMARY, marginTop: 2 }}>{(session.realCategories || []).join(", ")}</div>
                    </div>
                    <VoteBar items={COMM_CONCEPTS.map(c => c.id)} tally={conceptTally} total={conceptVoterCount} realItems={[]} label="Communication Concept Responses" />
                    <div style={{ ...sectionLabel, marginBottom: 8 }}>What communication concept is this really about?</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                      {COMM_CONCEPTS.map(c => (
                        <button key={c.id} onClick={() => toggleConceptReal(c.id)} style={{ ...crd, padding: "10px 14px", textAlign: "left", cursor: "pointer", borderColor: conceptPicks.includes(c.id) ? PURPLE : "#f4f4f5", borderWidth: conceptPicks.includes(c.id) ? 2 : 1, background: conceptPicks.includes(c.id) ? "#f5f3ff" : "#fff" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: conceptPicks.includes(c.id) ? PURPLE : TEXT_PRIMARY }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{c.desc}</div>
                        </button>
                      ))}
                    </div>
                    {conceptPicks.length > 0 && (
                      <div>
                        <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Your notes for this headline (saved with reveal)..." rows={2} style={{ ...inp, fontSize: 12, marginBottom: 8, resize: "vertical" }} />
                        <button onClick={() => revealConcept(session.id)} style={{ ...pill, background: PURPLE, color: "#fff", padding: "10px 20px", fontSize: 13 }}>Reveal Concept ({conceptPicks.length})</button>
                      </div>
                    )}
                  </div>
                )}

                {phase === "done" && (
                  <div>
                    <div style={{ ...crd, padding: 14, background: "#f0fdf4", borderColor: GREEN, textAlign: "center", marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: GREEN, fontWeight: 600, textTransform: "uppercase" }}>Surface</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: TEXT_PRIMARY }}>{(session.realCategories || []).join(", ")}</div>
                    </div>
                    <div style={{ ...crd, padding: 14, background: "#f5f3ff", borderColor: PURPLE, textAlign: "center", marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: PURPLE, fontWeight: 600, textTransform: "uppercase" }}>Communication Concept</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: TEXT_PRIMARY }}>{(session.realConcepts || []).map(id => COMM_CONCEPTS.find(c => c.id === id)?.name || id).join(", ")}</div>
                    </div>
                    <VoteBar items={cats} tally={surfaceTally} total={surfaceVoterCount} realItems={session.realCategories} label="Surface Results" />
                    <VoteBar items={COMM_CONCEPTS.map(c => c.id)} tally={conceptTally} total={conceptVoterCount} realItems={session.realConcepts} label="Concept Results" />
                    <TalkingPoints conceptIds={session.realConcepts || []} headline={activeHeadline} />
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <div style={{ ...sectionLabel, marginBottom: 6 }}>Categories ({cats.length})</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="New category" onKeyDown={e => e.key === "Enter" && addCategory()} style={{ ...inp, flex: 1 }} />
                <button onClick={addCategory} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", padding: "10px 16px" }}>Add</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Session list
    return (
      <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
        <Toast message={msg} />
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ ...sectionLabel, marginBottom: 12 }}>Class Tools</div>
          <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>Headline Exercise</div>
              <button onClick={createSession} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff" }}>New Session</button>
            </div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.5, marginBottom: 12 }}>Show a headline. Students categorize the surface topic, then identify the communication concept underneath.</div>
            {sessions.length === 0 && <div style={{ fontSize: 13, color: "#d4d4d8", textAlign: "center", padding: 12 }}>No sessions yet.</div>}
            {[...sessions].reverse().map(s => {
              const count = items.filter(it => it.sessionId === s.id).length;
              return (
                <button key={s.id} onClick={() => setActiveSession(s.id)} style={{ ...crd, padding: 14, marginBottom: 4, width: "100%", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED }}>{count} headline{count !== 1 ? "s" : ""} / {new Date(s.ts).toLocaleDateString()}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              );
            })}
          </div>
          {items.filter(it => it.realConcepts?.length > 0).length > 0 && (
            <div style={{ ...crd, padding: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 10 }}>Headline Archive</div>
              {items.filter(it => it.realConcepts?.length > 0).map(h => (
                <div key={h.id} style={{ padding: "8px 0", borderBottom: "1px solid #f9fafb" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, fontSize: 13, color: TEXT_PRIMARY }}>{h.text}</div>
                    {h.url && <a href={h.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#2563eb", textDecoration: "none" }}>Source</a>}
                  </div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{(h.realCategories || []).join(", ")}</div>
                  <div style={{ fontSize: 11, color: ACCENT, fontWeight: 600 }}>{(h.realConcepts || []).map(id => COMM_CONCEPTS.find(c => c.id === id)?.name || id).join(", ")}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── STUDENT VIEW ──
  const liveSession = sessions.find(s => s.activeHeadlineId && s.phase !== "done");
  const doneSession = sessions.find(s => s.activeHeadlineId && s.phase === "done");
  const currentSession = liveSession || doneSession;
  const currentHeadline = currentSession ? items.find(it => it.id === currentSession.activeHeadlineId) : null;
  const curPhase = currentSession?.phase || "surface";
  const studentSurfaceVote = sid && currentSession?.votes?.[sid] ? (Array.isArray(currentSession.votes[sid]) ? currentSession.votes[sid] : [currentSession.votes[sid]]) : null;
  const studentConceptVote = sid && currentSession?.conceptVotes?.[sid] ? (Array.isArray(currentSession.conceptVotes[sid]) ? currentSession.conceptVotes[sid] : [currentSession.conceptVotes[sid]]) : null;
  const { tally: stSurfaceTally, count: stSurfaceCount } = buildTally(currentSession?.votes);
  const { tally: stConceptTally, count: stConceptCount } = buildTally(currentSession?.conceptVotes);

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 12 }}>Class Tools</div>
        {currentHeadline ? (
          <div>
            <div style={{ ...crd, padding: 20, textAlign: "center", marginBottom: 16, background: TEXT_PRIMARY, borderColor: TEXT_PRIMARY }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Headline</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1.3 }}>{currentHeadline.text}</div>
              {currentHeadline.url && <a href={currentHeadline.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textDecoration: "none", marginTop: 6, display: "inline-block" }}>Read article</a>}
            </div>

            {/* Surface phase */}
            {curPhase === "surface" && (
              studentSurfaceVote ? (
                <div style={{ ...crd, padding: 20, textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>You picked: {studentSurfaceVote.join(", ")}</div>
                  <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4 }}>Waiting for surface reveal...</div>
                </div>
              ) : (
                <div>
                  <div style={{ ...sectionLabel, marginBottom: 8 }}>Step 1: What surface categories fit? (select all that apply)</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                    {cats.map(cat => (
                      <button key={cat} onClick={() => togglePick(cat)} style={{ ...pill, fontSize: 12, padding: "8px 12px", background: myPicks.includes(cat) ? TEXT_PRIMARY : "#f4f4f5", color: myPicks.includes(cat) ? "#fff" : "#374151" }}>{cat}</button>
                    ))}
                  </div>
                  {myPicks.length > 0 && <button onClick={() => lockInSurface(currentSession.id)} style={{ ...pill, background: ACCENT, color: "#fff", padding: "10px 20px", fontSize: 13, width: "100%" }}>Lock in ({myPicks.length})</button>}
                </div>
              )
            )}

            {/* Concept phase */}
            {curPhase === "concept" && (
              <div>
                <div style={{ ...crd, padding: 14, background: "#f0fdf4", borderColor: GREEN, textAlign: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: GREEN, fontWeight: 600, textTransform: "uppercase" }}>Surface categories</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: TEXT_PRIMARY, marginTop: 2 }}>{(currentSession.realCategories || []).join(", ")}</div>
                  {studentSurfaceVote && <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginTop: 4 }}>You picked: {studentSurfaceVote.join(", ")}{studentSurfaceVote.some(v => (currentSession.realCategories || []).includes(v)) ? " \u2713" : ""}</div>}
                </div>
                {studentConceptVote ? (
                  <div style={{ ...crd, padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>You picked: {studentConceptVote.map(id => COMM_CONCEPTS.find(c => c.id === id)?.name || id).join(", ")}</div>
                    <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4 }}>Waiting for concept reveal...</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ ...sectionLabel, marginBottom: 8 }}>Step 2: What communication concept is this really about?</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                      {COMM_CONCEPTS.map(c => (
                        <button key={c.id} onClick={() => toggleConceptPick(c.id)} style={{ ...crd, padding: "10px 14px", textAlign: "left", cursor: "pointer", borderColor: myConceptPicks.includes(c.id) ? PURPLE : "#f4f4f5", borderWidth: myConceptPicks.includes(c.id) ? 2 : 1, background: myConceptPicks.includes(c.id) ? "#f5f3ff" : "#fff" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: myConceptPicks.includes(c.id) ? PURPLE : TEXT_PRIMARY }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{c.desc}</div>
                        </button>
                      ))}
                    </div>
                    {myConceptPicks.length > 0 && <button onClick={() => lockInConcept(currentSession.id)} style={{ ...pill, background: PURPLE, color: "#fff", padding: "10px 20px", fontSize: 13, width: "100%" }}>Lock in ({myConceptPicks.length})</button>}
                  </div>
                )}
              </div>
            )}

            {/* Done phase */}
            {curPhase === "done" && (
              <div>
                <div style={{ ...crd, padding: 14, background: "#f0fdf4", borderColor: GREEN, textAlign: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: GREEN, fontWeight: 600, textTransform: "uppercase" }}>Surface</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: TEXT_PRIMARY }}>{(currentSession.realCategories || []).join(", ")}</div>
                </div>
                <div style={{ ...crd, padding: 14, background: "#f5f3ff", borderColor: PURPLE, textAlign: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: PURPLE, fontWeight: 600, textTransform: "uppercase" }}>Communication Concept</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: TEXT_PRIMARY }}>{(currentSession.realConcepts || []).map(id => COMM_CONCEPTS.find(c => c.id === id)?.name || id).join(", ")}</div>
                  {studentConceptVote && <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginTop: 4 }}>You picked: {studentConceptVote.map(id => COMM_CONCEPTS.find(c => c.id === id)?.name || id).join(", ")}{studentConceptVote.some(v => (currentSession.realConcepts || []).includes(v)) ? " \u2713" : ""}</div>}
                </div>
                <VoteBar items={cats} tally={stSurfaceTally} total={stSurfaceCount} realItems={currentSession.realCategories} label="Surface Results" />
                <VoteBar items={COMM_CONCEPTS.map(c => c.id)} tally={stConceptTally} total={stConceptCount} realItems={currentSession.realConcepts} label="Concept Results" />
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <div style={{ ...sectionLabel, marginBottom: 6 }}>Submit a headline</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <input value={newHeadline} onChange={e => setNewHeadline(e.target.value)} placeholder="Headline text..." style={inp} />
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="URL (optional)" style={{ ...inp, flex: 1 }} />
                  <button onClick={() => submitHeadline(currentSession.id)} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", padding: "10px 16px" }}>Submit</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ ...crd, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 14, color: TEXT_MUTED }}>No active headline right now. Check back during class.</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── TO-DO ─── */
function getWeekMonday() {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  return mon.getFullYear() + "-" + String(mon.getMonth() + 1).padStart(2, "0") + "-" + String(mon.getDate()).padStart(2, "0");
}

const WEEKLY_ITEMS = [
  { id: "reading", label: "Do the reading" },
  { id: "quiz_prep", label: "Prep for game" },
  { id: "sports_news", label: "Read ESPN, The Athletic, and other sports sites" },
];

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
          const deadline = scoredTs + 72 * 60 * 60 * 1000;
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


/* ─── APP ─── */
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
          <RosterCombined data={data} setData={setData} userName={userName} isAdmin={isAdmin} />
        </div>

        {/* Readings */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ ...sectionLabel, marginBottom: 10 }}>Readings</div>
          <ReadingsView data={data} setData={setData} isAdmin={isAdmin} />
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

export default function Comm4() {
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
        if (d && !d.schedule) { d.schedule = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)); await saveData(d); }
        if (d && !d.bios) { d.bios = {}; await saveData(d); }
        if (d && !d.grades) { d.grades = {}; await saveData(d); }
        if (d && !d.participation) { d.participation = {}; await saveData(d); }
        if (d && !d.assignments) { d.assignments = JSON.parse(JSON.stringify(DEFAULT_ASSIGNMENTS)); await saveData(d); }
        if (d && !d.weeklyGames) { d.weeklyGames = {}; await saveData(d); }
        if (d && !d.weeklyToT) { d.weeklyToT = {}; await saveData(d); }
        if (d && !d.weeklyFishbowl) { d.weeklyFishbowl = {}; await saveData(d); }
        if (d && !d.fishbowlStars) { d.fishbowlStars = {}; await saveData(d); }
        if (d && !d.weeklyTeamWins) { d.weeklyTeamWins = {}; await saveData(d); }
        if (d && !d.todoChecks) { d.todoChecks = {}; await saveData(d); }
        if (d && !d.readings) { d.readings = []; await saveData(d); }
        if (d && !d.headlines) { d.headlines = { categories: [], items: [], sessions: [] }; await saveData(d); }
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
        if (d && !d.customTodos) { d.customTodos = []; await saveData(d); }
        // Generate PINs
        if (d && !d.pins) {
          const pins = {};
          d.students.forEach(s => {
            if (s.name === ADMIN_NAME) {
              pins[s.id] = "118711";
            } else {
              pins[s.id] = String(Math.floor(100000 + Math.random() * 900000));
            }
          });
          d.pins = pins;
          await saveData(d);
        }
        setData(d);
      } catch(e) { console.error("Storage load failed:", e); setData(null); }
      setLoading(false);
    })();
    // Real-time subscription
    let unsub = null;
    if (window.storage?.onUpdate) {
      unsub = window.storage.onUpdate(STORAGE_KEY, (value) => {
        try { const d = JSON.parse(value); if (d) setData(d); } catch(e) { console.error("Realtime parse error:", e); }
      });
    }
    // Backup polling every 30s (in case realtime drops)
    const iv = setInterval(refresh, 30000);
    return () => { clearInterval(iv); if (unsub) unsub(); };
  }, [refresh]);

  if (loading) return <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>Loading...</div></div>;

  if (!userName) return <NamePicker data={data} onSelect={name => { setUserName(name); setView(name === GUEST_NAME ? "schedule" : "home"); }} />;

  // Detect anything live (drives green dot in nav)
  const isLiveSlot = (slot) => !!(slot && slot.phase === "live");
  const activitiesLive = !!(
    Object.keys(data?.weeklyGames || {}).some(w => isLiveSlot(data.weeklyGames[w])) ||
    Object.keys(data?.weeklyToT || {}).some(w => isLiveSlot(data.weeklyToT[w])) ||
    (data?.headlines?.sessions || []).some(s => s.activeHeadlineId && s.phase !== "done") ||
    (data?.surveys || []).some(s => s.active) ||
    (data?.boards || []).some(b => b.active)
  );

  return <ThemedComm4Wrapper data={data} isAdmin={effectiveAdmin} isGuest={isGuest} view={view} setView={setView} displayName={displayName} testStudent={testStudent} setTestStudent={setTestStudent} setStudentView={setStudentView} studentView={studentView} setUserName={setUserName} effectiveUserName={effectiveUserName} effectiveAdmin={effectiveAdmin} activitiesLive={activitiesLive} visibleStudents={visibleStudents} setData={setData} />;
}

function ThemedComm4Wrapper({ data, isAdmin, isGuest, view, setView, displayName, testStudent, setTestStudent, setStudentView, studentView, setUserName, effectiveUserName, effectiveAdmin, activitiesLive, visibleStudents, setData }) {
  const { theme } = useTheme(STORAGE_KEY);
  const themedFont = themedHeadingFont(theme, F);

  // Load themed fonts at the top level so every page gets them
  React.useEffect(() => {
    if (theme === "clean") return;
    const id = "themed-fonts-" + theme;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    if (theme === "locked") {
      link.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap";
    } else if (theme === "crashing") {
      link.href = "https://fonts.googleapis.com/css2?family=Rubik+Mono+One&family=Press+Start+2P&display=swap";
    }
    document.head.appendChild(link);
  }, [theme]);

  return (
    <div style={{ minHeight: "100vh", background: themedPageBg(theme), color: TEXT_PRIMARY, fontFamily: themedFont, fontSize: 15, position: "relative" }}>
      {theme === "crashing" && (
        <>
          <style>{THEME_KEYFRAMES_CSS}</style>
          {/* Fixed-position pixel art that follows you across all pages */}
          <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }}>
            <PixelStar top="10%" right="3%" delay={0} />
            <PixelStar top="35%" right="7%" delay={0.4} />
            <PixelStar top="20%" left="4%" delay={0.2} color="#ec4899" />
            <PixelStar bottom="20%" right="5%" delay={0.6} color="#0ea5e9" />
            <PixelArrow bottom="15%" left="3%" delay={0} />
            <PixelArrow top="50%" right="2%" delay={0.3} color="#a855f7" />
            <PixelHeart top="42%" left="3%" delay={0} />
            <PixelHeart bottom="35%" right="6%" delay={0.5} />
            <PixelMushroom top="62%" right="3%" delay={0} />
            <PixelMushroom bottom="55%" left="5%" delay={0.4} />
            <PixelCoin top="72%" left="6%" delay={0} />
            <PixelCoin top="85%" right="6%" delay={0.3} />
            <PixelLightning top="90%" left="2%" delay={0.1} />
            <PixelLightning bottom="60%" right="3%" delay={0.5} />
          </div>
        </>
      )}
      {theme === "locked" && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #dc2626 0%, #1f2937 50%, #dc2626 100%)", zIndex: 100, pointerEvents: "none" }} />
      )}

      {isAdmin && (
        <div style={{ background: "#111", display: "flex", justifyContent: "center", gap: 4, padding: "5px 12px", position: "relative", zIndex: 10 }}>
          <a href="/comm118" style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: F, textDecoration: "none", color: "#9ca3af", background: "transparent" }}>118</a>
          <a href="/comm2" style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: F, textDecoration: "none", color: "#9ca3af", background: "transparent" }}>COMM 2</a>
          <a href="/comm4" style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: F, textDecoration: "none", color: STORAGE_KEY === "comm4-v1" ? "#fff" : "#9ca3af", background: STORAGE_KEY === "comm4-v1" ? "#333" : "transparent" }}>COMM 4</a>
          <a href="/dashboard" style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: F, textDecoration: "none", color: "#9ca3af", background: "transparent" }}>Dash</a>
        </div>
      )}
      <div style={{ position: "relative", zIndex: 2 }}>
      <Nav view={view} setView={setView} isAdmin={effectiveAdmin} isGuest={isGuest} userName={testStudent || displayName} onLogout={() => { if (testStudent) { setTestStudent(null); return; } try { localStorage.removeItem(STORAGE_KEY + "-user"); } catch(e) {} setUserName(null); }} studentView={studentView} setStudentView={isAdmin ? setStudentView : null} courseTitle={data?.courseTitle} testStudent={testStudent} setTestStudent={isAdmin ? setTestStudent : null} allStudents={data ? data.students.filter(s => s.name !== "Andrew Ishak" && s.name !== "Bruce Willis").sort((a, b) => { const al = a.name.split(" ").slice(-1)[0]; const bl = b.name.split(" ").slice(-1)[0]; return al.localeCompare(bl); }) : []} activitiesLive={activitiesLive} />
      {view === "home" && !isGuest && <HomeView data={data} setData={setData} userName={effectiveUserName} isAdmin={effectiveAdmin} setView={setView} />}
      {view === "schedule" && <ScheduleView data={data} setData={setData} isAdmin={effectiveAdmin} />}
      {view === "assignments" && !isGuest && <AssignmentsView data={data} setData={setData} isAdmin={effectiveAdmin} userName={effectiveUserName} setView={setView} />}
      {view === "activities" && !isGuest && <ActivitiesView data={data} setData={setData} isAdmin={effectiveAdmin} userName={effectiveUserName} />}
      {view === "more" && !isGuest && <MoreView data={data} setData={setData} isAdmin={effectiveAdmin} userName={effectiveUserName} />}
      {view === "todo" && !isGuest && <ToDoView data={data} setData={setData} userName={effectiveUserName} isAdmin={effectiveAdmin} />}
      {view === "inclassadmin" && isAdmin && !studentView && !testStudent && <GameAdmin data={data} setData={setData} />}
      {view === "grades" && isAdmin && !studentView && <Gradebook data={data} setData={setData} userName={effectiveUserName} isAdmin={effectiveAdmin} setView={setView} />}
      {view === "grading" && isAdmin && !studentView && <GradingInbox data={data} setData={setData} userName={effectiveUserName} />}
      {view === "pti" && isAdmin && !studentView && <PTIMode data={data} setData={setData} />}
      {view === "admin" && isAdmin && !studentView && <AdminPanel data={data} setData={setData} />}
      {/* Dedicated routes for nav cards */}
      {view === "leaderboard" && <Leaderboard students={visibleStudents} log={data.log} teams={data.teams} isAdmin={effectiveAdmin} userName={effectiveUserName} data={data} setData={setData} />}
      {view === "boards" && !isGuest && <BoardsView data={data} setData={setData} isAdmin={effectiveAdmin} userName={effectiveUserName} />}
      {view === "roster" && !isGuest && <RosterCombined data={data} setData={setData} userName={effectiveUserName} isAdmin={effectiveAdmin} />}
      {/* Backwards-compat redirects */}
      {view === "readings" && !isGuest && <MoreView data={data} setData={setData} isAdmin={effectiveAdmin} userName={effectiveUserName} />}
      {view === "inclass" && !isGuest && <ActivitiesView data={data} setData={setData} isAdmin={effectiveAdmin} userName={effectiveUserName} />}
      {view === "mynotes" && !isGuest && <MoreView data={data} setData={setData} isAdmin={effectiveAdmin} userName={effectiveUserName} />}
      {view === "accolades" && !isGuest && <Accolades data={data} />}
      </div>
    </div>
  );
}
