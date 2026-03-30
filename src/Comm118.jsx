import React, { useState, useEffect, useCallback, useRef } from "react";
import { AssignmentsView, Gradebook, DEFAULT_ASSIGNMENTS } from "./Grades.jsx";
import { GameAdmin, StudentAnswerView, Accolades } from "./GameSystem.jsx";

const STORAGE_KEY = "comm118-game-v14";

const POINT_SOURCES = ["Weekly Team Game","This or That","Assignment","Friday Response","Channel Switch","Participation","Bonus","Other"];

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
  "William Anderson","Luke Baird","Maxwell Bayles","Alec Berger",
  "Samuel Canales","Koen Carston","Benjamin Cleary","Isabelle De Buyl",
  "Sophia DeFonzo","Russell Filter","Amaris Franco","Jace Gillmore",
  "Charlotte Halk","Christian Hammond","Danica RaeAnne Ibus","Andrew Ishak",
  "Hannah Kamins","Juliette Krumholz","Payton Lambert","Jack Lazark",
  "Oliver Maldonado","Gianna Malnati","Emil Nielsen","Annesley Potchatek",
  "Kalia Schempp","Caroline Shah","Ethan Silva","Francisco Soldavini",
  "Reagan Viens","Alexander Watanabe Eriksson",
];

const DEFAULT_SCHEDULE = [
  { week: 1, label: "Gambling", theme: "Purpose of Sports", question: "Why do people bet on sports?", dates: [
    { date: "Mar 30", day: "Mon", topic: "Gambling. Zero judgment. What is a line?", assignment: "", notes: "" },
    { date: "Apr 1", day: "Wed", topic: "Why do we involve ourselves in sports?", assignment: "", notes: "" },
    { date: "Apr 3", day: "Fri", topic: "", assignment: "", notes: "Good Friday", holiday: true },
  ]},
  { week: 2, label: "Value", theme: "Value & Interest of Sports", question: "What makes sports worth caring about?", dates: [
    { date: "Apr 6", day: "Mon", topic: "", assignment: "Prepare arguments with sources", notes: "No class — async work day", holiday: true },
    { date: "Apr 8", day: "Wed", topic: "Discussion: value of sports, what makes them interesting", assignment: "", notes: "" },
    { date: "Apr 10", day: "Fri", topic: "Leadership track begins", assignment: "", notes: "", fri: true },
  ]},
  { week: 3, label: "Athletes & Corps", theme: "Celebrity & Ads", question: "Who really profits from athlete fame?", dates: [
    { date: "Apr 13", day: "Mon", topic: "Athletes as celebrities, parasocial", assignment: "", notes: "" },
    { date: "Apr 15", day: "Wed", topic: "Corporations, ads, sponsorships, naming rights", assignment: "", notes: "" },
    { date: "Apr 17", day: "Fri", topic: "Leadership track", assignment: "", notes: "", fri: true },
  ]},
  { week: 4, label: "Media", theme: "Rights & Spectacle", question: "How does media shape what we see and believe?", dates: [
    { date: "Apr 20", day: "Mon", topic: "Media rights", assignment: "WoC proposal due", notes: "" },
    { date: "Apr 22", day: "Wed", topic: "Spectacle, heroes, mythmaking", assignment: "", notes: "" },
    { date: "Apr 24", day: "Fri", topic: "Leadership track", assignment: "", notes: "WoC meetings", fri: true },
  ]},
  { week: 5, label: "Identity", theme: "Fans & Identity", question: "How do sports shape who we think we are?", dates: [
    { date: "Apr 27", day: "Mon", topic: "Fan identity, athlete identity", assignment: "", notes: "" },
    { date: "Apr 29", day: "Wed", topic: "Gender, race, politics", assignment: "", notes: "" },
    { date: "May 1", day: "Fri", topic: "Leadership track", assignment: "", notes: "", fri: true },
  ]},
  { week: 6, label: "Community", theme: "Civic Pride, Stadiums, NCAA", question: "When does community pride become exploitation?", dates: [
    { date: "May 4", day: "Mon", topic: "Civic pride vs stadium deals", assignment: "", notes: "" },
    { date: "May 6", day: "Wed", topic: "NCAA, youth sports, role models", assignment: "WoC submission due", notes: "WoC + leadership meetings" },
    { date: "May 8", day: "Fri", topic: "Leadership track", assignment: "", notes: "", fri: true },
  ]},
  { week: 7, label: "OJ", theme: "Everything Collides", question: "What happens when sports, race, media, and money collide?", dates: [
    { date: "May 11", day: "Mon", topic: "OJ: Made in America", assignment: "", notes: "" },
    { date: "May 13", day: "Wed", topic: "OJ continued", assignment: "", notes: "" },
    { date: "May 15", day: "Fri", topic: "Leadership track", assignment: "", notes: "", fri: true },
  ]},
  { week: 8, label: "Leadership", theme: "Comm & Culture", question: "What does it actually take to lead?", dates: [
    { date: "May 18", day: "Mon", topic: "Leadership & culture main stage", assignment: "", notes: "" },
    { date: "May 20", day: "Wed", topic: "Leadership wrap-up", assignment: "Leadership Guide due", notes: "" },
    { date: "May 22", day: "Fri", topic: "Leadership final session", assignment: "", notes: "", fri: true },
  ]},
  { week: 9, label: "Final Project", theme: "Teach Me Something New", question: "", dates: [
    { date: "May 25", day: "Mon", topic: "", assignment: "", notes: "MEMORIAL DAY", holiday: true },
    { date: "May 27", day: "Wed", topic: "Presentations", assignment: "", notes: "" },
    { date: "May 29", day: "Fri", topic: "Presentations", assignment: "", notes: "" },
  ]},
  { week: 10, label: "Final Project", theme: "Teach Me Something New", question: "", dates: [
    { date: "Jun 1", day: "Mon", topic: "Presentations", assignment: "", notes: "" },
    { date: "Jun 3", day: "Wed", topic: "", assignment: "", notes: "No class", holiday: true },
    { date: "Jun 5", day: "Fri", topic: "Wrap-up", assignment: "", notes: "" },
  ]},
  { week: 11, label: "Finals", theme: "", question: "", dates: [
    { date: "Jun 8+", day: "Finals", topic: "Final project due", assignment: "Final project due", notes: "Meetings available" },
  ]},
];

const ACCENT = "#9f1239";
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

// Load DM Sans
if (typeof document !== "undefined" && !document.getElementById("dm-sans-font")) {
  const link = document.createElement("link");
  link.id = "dm-sans-font";
  link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900;1,9..40,400&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);
}
// Responsive schedule grid
if (typeof document !== "undefined" && !document.getElementById("comm118-responsive")) {
  const style = document.createElement("style");
  style.id = "comm118-responsive";
  style.textContent = `
    .schedule-days { grid-template-columns: 1fr !important; }
    .home-grid { grid-template-columns: 1fr !important; }
    @media (min-width: 700px) { .schedule-days { grid-template-columns: repeat(3, 1fr) !important; } }
    @media (min-width: 700px) { .schedule-days[data-cols="2"] { grid-template-columns: repeat(2, 1fr) !important; } }
    @media (min-width: 700px) { .home-grid { grid-template-columns: 1fr 1fr !important; } }
    @keyframes tickerPulse { 0% { transform: scale(1.15); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
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

// Write-lock: prevent catastrophic overwrites of roster, log, grades
async function saveData(newData) {
  try {
    // Load current data from storage to compare
    const current = await loadData();
    if (current && current.students && current.students.length > 0) {
      const curIds = new Set(current.students.map(s => s.id));
      const newIds = new Set((newData.students || []).map(s => s.id));
      // Block if more than half the roster vanished (catastrophic overwrite)
      const overlap = [...curIds].filter(id => newIds.has(id)).length;
      if (curIds.size > 5 && overlap < curIds.size * 0.5) {
        console.error("WRITE-LOCK: Blocked save. " + (curIds.size - overlap) + " of " + curIds.size + " students would be lost. This looks like a data corruption. Save rejected.");
        return false;
      }
      // Block if log got wiped (went from many entries to zero)
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
function lastName(name) { if (name === "Alexander Watanabe Eriksson") return "Watanabe Eriksson"; return name.split(" ").slice(-1)[0]; }
function lastSort(a, b) { return lastName(a).localeCompare(lastName(b)); }
function lastSortObj(a, b) { return lastName(a.name).localeCompare(lastName(b.name)); }
function tp(team, students, log) { const ids = students.filter(s => s.teamId === team.id).map(s => s.id); return log.filter(e => ids.includes(e.studentId)).reduce((s, e) => s + e.amount, 0); }
function rs(students, log) { return students.map(s => ({ ...s, points: gp(log, s.id) })).sort((a, b) => b.points - a.points); }
function rt(teams, students, log) { return teams.map(t => ({ ...t, points: tp(t, students, log) })).sort((a, b) => b.points - a.points); }

// Weekly snake draft: round 1 forward, rounds 2+ reverse
function shuffleTeams(students, log, teams) {
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

/* ─── NAV ─── */
function Nav({ view, setView, isAdmin, isGuest, userName, onLogout, studentView, setStudentView }) {
  const tabs = [
    { id: "home", label: "Home", admin: false, guest: false },
    { id: "leaderboard", label: "Leaderboard", admin: false, guest: true },
    { id: "schedule", label: "Schedule", admin: false, guest: true },
    { id: "assignments", label: "Assignments", admin: false, guest: false },
    { id: "readings", label: "Readings", admin: false, guest: false },
    { id: "classtools", label: "Headlines", admin: false, guest: false },
    { id: "answer", label: "Answer", admin: false, guest: false },
    { id: "accolades", label: "Accolades", admin: false, guest: false },
    { id: "boards", label: "Boards", admin: false, guest: false },
    { id: "mynotes", label: "My Notes", admin: false, guest: false },
    { id: "survey", label: "Survey", admin: false, guest: false },
    { id: "pti", label: "Around the Horn", admin: true, guest: false },
    { id: "activities", label: "Activities", admin: true, guest: false },
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
        <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: F, letterSpacing: "-0.01em" }}>Comm and Sport</div>
        {studentView && <span style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.05em" }}>Student View</span>}
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
        {visibleTabs.map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={view === t.id
            ? { ...pill, background: "#fff", color: studentView ? "#334155" : ACCENT, fontWeight: 700, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
            : { ...pill, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" }
          }>{t.label}</button>
        ))}
        <a href="https://camino.instructure.com/courses/117721" target="_blank" rel="noopener noreferrer" style={{ ...pill, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
          Camino <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
        {setStudentView && (
          <button onClick={() => setStudentView(!studentView)} style={{
            padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            fontFamily: F, border: studentView ? "1px solid #fbbf24" : "1px solid rgba(255,255,255,0.2)",
            background: studentView ? "#fbbf24" : "transparent", color: studentView ? "#18181b" : "rgba(255,255,255,0.6)", transition: "all 0.15s",
          }}>{studentView ? "Exit Student View" : "Student View"}</button>
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

/* ─── NAME PICKER (front page) ─── */
const ADMIN_NAME = "Andrew Ishak";
const GUEST_NAME = "__guest__";

function NamePicker({ data, onSelect }) {
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const pins = data?.pins || {};

  const names = data ? data.students.map(s => s.name).sort(lastSort) : [...ALL_STUDENTS].sort(lastSort);
  // Put admin at top, even if not in students list
  const sorted = [ADMIN_NAME, ...names.filter(n => n !== ADMIN_NAME)];

  const tryLogin = () => {
    if (!selected) return;
    // Admin login: check hardcoded PIN, doesn't need to be in students list
    if (selected === ADMIN_NAME) {
      if (pin !== "118711") { setError("Wrong PIN"); setPin(""); return; }
      onSelect(selected);
      return;
    }
    const student = data.students.find(s => s.name === selected);
    if (!student) return;
    const correctPin = pins[student.id];
    if (correctPin && pin !== String(correctPin)) {
      setError("Wrong PIN"); setPin(""); return;
    }
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
          <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Communication and Sport</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: 500, marginTop: 6 }}>COMM 118 / Ishak / Santa Clara University</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>MWF 8:00 to 9:05 am / Vari 128</div>
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
              background: name === ADMIN_NAME ? "#fef2f2" : "transparent",
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
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Continue as Guest
        </button>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: TEXT_MUTED }}>Questions? Contact aishak@scu.edu</div>
      </div>
    </div>
  );
}

/* ─── SCHEDULE ─── */
/* ─── HOME DASHBOARD ─── */
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

  // Add news
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
  const todayStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const upcomingDates = [];
  schedule.forEach(week => {
    (week.dates || []).forEach(d => {
      if (d.day === "Finals") return;
      const dateStr = d.date;
      const year = today.getFullYear();
      const parsed = new Date(dateStr + ", " + year);
      if (!isNaN(parsed) && parsed >= new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
        upcomingDates.push({ ...d, weekLabel: week.label, weekNum: week.week, parsedDate: parsed });
      }
    });
  });
  upcomingDates.sort((a, b) => a.parsedDate - b.parsedDate);
  const next3 = upcomingDates.slice(0, 3);

  // To-Do: assignments due soon
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

  // News type config
  const newsColors = { info: { bg: "#eff6ff", color: "#2563eb", label: "Info" }, assignment: { bg: "#fffbeb", color: "#d97706", label: "Assignment" }, alert: { bg: "#fef2f2", color: "#dc2626", label: "Alert" } };

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

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
              const isAssignment = item.type === "assignment";
              const matchedAssignment = isAssignment ? todoDue.find(a => item.text.toLowerCase().includes(a.name.toLowerCase())) : null;
              return (
                <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid " + BORDER }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: nc.color, background: nc.bg, padding: "3px 8px", borderRadius: 6, flexShrink: 0, marginTop: 2, textTransform: "uppercase" }}>{nc.label}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.45 }}>{item.text}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: TEXT_MUTED }}>{new Date(item.ts).toLocaleDateString()}</span>
                      {matchedAssignment && matchedAssignment.completed && <span style={{ fontSize: 11, fontWeight: 700, color: GREEN }}>You've completed this</span>}
                    </div>
                  </div>
                  {isAdmin && <button onClick={() => removeNews(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, fontSize: 14 }}>x</button>}
                </div>
              );
            })}
          </div>
        )}

        <div className="home-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
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
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", background: s.name === userName ? ACCENT + "08" : "transparent", borderRadius: 6, margin: s.name === userName ? "0 -6px" : 0, padding: s.name === userName ? "4px 6px" : "4px 0" }}>
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

        {/* Messages / Notes */}
        {(() => {
          const messages = data.messages || [];
          const myMessages = isAdmin ? messages : messages.filter(m => m.to === "all" || (Array.isArray(m.to) && m.to.includes(userName)) || m.to === userName);
          if (myMessages.length === 0 && !isAdmin) return null;

          const sendReply = async (msgId) => {
            if (!replyText.trim()) return;
            const updated = { ...data, messages: messages.map(m => m.id === msgId ? { ...m, replies: [...(m.replies || []), { from: userName, text: replyText.trim(), ts: Date.now() }] } : m) };
            await saveData(updated); setData(updated);
            setReplyingTo(null); setReplyText(""); showMsg("Reply sent");
          };

          const sendMessage = async () => {
            if (!composeText.trim()) return;
            const to = composeRecipients === "all" ? "all" : selectedStudents;
            if (composeRecipients !== "all" && selectedStudents.length === 0) return;
            const m = { id: genId(), from: userName, to, text: composeText.trim(), ts: Date.now(), replies: [] };
            const updated = { ...data, messages: [m, ...(data.messages || [])] };
            await saveData(updated); setData(updated);
            setComposeText(""); setSelectedStudents([]); setComposing(false); showMsg("Message sent");
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
                {isAdmin && <button onClick={() => setComposing(!composing)} style={composing ? pillActive : pillInactive}>{composing ? "Cancel" : "New Message"}</button>}
              </div>

              {isAdmin && composing && (
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
                        <span style={{ fontSize: 11, color: TEXT_MUTED }}>{new Date(msgItem.ts).toLocaleDateString()}</span>
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

        {/* This week's readings (everyone) */}
        {(() => {
          const currentWeek = schedule.find(w => {
            return (w.dates || []).some(d => {
              if (d.day === "Finals") return false;
              const year = today.getFullYear();
              const parsed = new Date(d.date + ", " + year);
              const dayDiff = (parsed - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / (1000 * 60 * 60 * 24);
              return dayDiff >= -3 && dayDiff <= 4;
            });
          });
          if (!currentWeek) return null;
          const weekReadings = [];
          (currentWeek.dates || []).forEach(d => {
            (d.readings || []).forEach(r => {
              const rdg = (data.readings || []).find(x => x.id === r.readingId);
              if (rdg) weekReadings.push({ ...rdg, day: d.day, date: d.date, type: r.type });
            });
          });
          if (weekReadings.length === 0) return null;
          const required = weekReadings.filter(r => r.type === "required" || r.type === "fishbowl");
          const recommended = weekReadings.filter(r => r.type === "recommended");
          return (
            <div style={{ ...crd, padding: 14, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>Week {currentWeek.week} Readings</div>
                <button onClick={() => setView("readings")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: ACCENT, fontWeight: 600, fontFamily: F }}>All readings</button>
              </div>
              {required.length > 0 && (
                <div style={{ marginBottom: recommended.length > 0 ? 12 : 0 }}>
                  <div style={{ fontSize: 12, color: "#b45309", fontWeight: 600, marginBottom: 6 }}>These readings are required for this week.</div>
                  {required.map((r, i) => {
                    const link = r.pdfUrl || r.url;
                    const isFish = r.type === "fishbowl";
                    return (
                      <div key={i} style={{ padding: "4px 0" }}>
                        {link ? (
                          <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>{isFish ? "Fishbowl: " : ""}{r.title}</a>
                        ) : (
                          <span style={{ fontSize: 13, color: TEXT_PRIMARY, fontWeight: 500 }}>{isFish ? "Fishbowl: " : ""}{r.title}</span>
                        )}
                        <span style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: 6 }}>{r.day} {r.date}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {recommended.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: GREEN, fontWeight: 600, marginBottom: 6 }}>These readings are recommended for further understanding of course material.</div>
                  {recommended.map((r, i) => {
                    const link = r.pdfUrl || r.url;
                    return (
                      <div key={i} style={{ padding: "4px 0" }}>
                        {link ? (
                          <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>{r.title}</a>
                        ) : (
                          <span style={{ fontSize: 13, color: TEXT_PRIMARY, fontWeight: 500 }}>{r.title}</span>
                        )}
                        <span style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: 6 }}>{r.day} {r.date}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

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

        {/* Sports question */}
        <div style={{ ...crd, padding: 14, marginBottom: 16, cursor: "pointer" }} onClick={() => setView("classtools")}>
          <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.5 }}>What's going on in the sports world right now that you think is interesting?</div>
          <div style={{ fontSize: 12, color: ACCENT, fontWeight: 600, marginTop: 6 }}>Go to Headlines</div>
        </div>

        {/* Assignments & To-Do */}
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

        {/* SCU Sports Calendar */}
        {(() => {
          const SCU_EVENTS = [{"e":"Women's Golf vs Silicon Valley Showcase","d":"3/30/2026","t":"All Day","l":"Millbrae, Calif. | Green Hills CC","c":"Women's Golf"},{"e":"Baseball vs San Jose State","d":"3/30/2026","t":"6:05PM","l":"Santa Clara, Calif.","c":"Baseball"},{"e":"Women's Golf vs Silicon Valley Showcase","d":"3/31/2026","t":"All Day","l":"Millbrae, Calif. | Green Hills CC","c":"Women's Golf"},{"e":"Men's Tennis vs Pacific","d":"4/2/2026","t":"11:00AM","l":"Santa Clara, Calif.","c":"Men's Tennis"},{"e":"Softball vs Oregon State","d":"4/2/2026","t":"6:00PM","l":"Santa Clara, Calif.","c":"Softball"},{"e":"Baseball at San Diego","d":"4/2/2026","t":"6:00PM","l":"San Diego","c":"Baseball"},{"e":"Women's Cross Country/Track  Day One","d":"4/3/2026","t":"","l":"Stanford, Calif.","c":"Women's Cross Country/Track"},{"e":"Women's Cross Country/Track  Day One","d":"4/3/2026","t":"","l":"San Francisco","c":"Women's Cross Country/Track"},{"e":"Men's Cross Country/Track  Day One","d":"4/3/2026","t":"","l":"Berkeley, Calif.","c":"Men's Cross Country/Track"},{"e":"Men's Cross Country/Track  Day One","d":"4/3/2026","t":"","l":"Stanford, Calif.","c":"Men's Cross Country/Track"},{"e":"Men's Cross Country/Track  Day One","d":"4/3/2026","t":"","l":"San Francisco","c":"Men's Cross Country/Track"},{"e":"Women's Beach Volleyball vs UTEP","d":"4/3/2026","t":"10:00AM","l":"Boise, Idaho","c":"Women's Beach Volleyball"},{"e":"Women's Tennis vs LMU","d":"4/3/2026","t":"11:00AM","l":"Santa Clara, Calif.","c":"Women's Tennis"},{"e":"Women's Beach Volleyball at Boise State","d":"4/3/2026","t":"4:00PM","l":"Boise, Idaho","c":"Women's Beach Volleyball"},{"e":"Softball vs Oregon State","d":"4/3/2026","t":"6:00PM","l":"Santa Clara, Calif.","c":"Softball"},{"e":"Baseball at San Diego","d":"4/3/2026","t":"6:00PM","l":"San Diego","c":"Baseball"},{"e":"Women's Cross Country/Track  Day Two","d":"4/4/2026","t":"","l":"Stanford, Calif.","c":"Women's Cross Country/Track"},{"e":"Women's Cross Country/Track  Day Two","d":"4/4/2026","t":"","l":"San Francisco","c":"Women's Cross Country/Track"},{"e":"Men's Rowing vs Redwood Shores Invitational II","d":"4/4/2026","t":"","l":"Redwood City, Calif.","c":"Men's Rowing"},{"e":"Women's Rowing at Cal","d":"4/4/2026","t":"","l":"Berkeley, Calif.","c":"Women's Rowing"},{"e":"Men's Cross Country/Track  Day Two","d":"4/4/2026","t":"","l":"Stanford, Calif.","c":"Men's Cross Country/Track"},{"e":"Men's Cross Country/Track  Day Two","d":"4/4/2026","t":"","l":"Berkeley, Calif.","c":"Men's Cross Country/Track"},{"e":"Men's Cross Country/Track  Day Two","d":"4/4/2026","t":"","l":"San Francisco","c":"Men's Cross Country/Track"},{"e":"Women's Beach Volleyball vs CSUN","d":"4/4/2026","t":"9:30AM","l":"Boise, Idaho","c":"Women's Beach Volleyball"},{"e":"Men's Tennis vs Saint Mary's","d":"4/4/2026","t":"1:00PM","l":"Santa Clara, Calif.","c":"Men's Tennis"},{"e":"Softball vs Oregon State","d":"4/4/2026","t":"1:00PM","l":"Santa Clara, Calif.","c":"Softball"},{"e":"Baseball at San Diego","d":"4/4/2026","t":"1:00PM","l":"San Diego","c":"Baseball"},{"e":"Women's Beach Volleyball vs Oregon","d":"4/4/2026","t":"1:30PM","l":"Boise, Idaho","c":"Women's Beach Volleyball"},{"e":"Baseball vs Clemson","d":"4/6/2026","t":"6:00PM","l":"Santa Clara, Calif.","c":"Baseball"},{"e":"Women's Golf vs Wyoming Cowgirl Classic","d":"4/7/2026","t":"All Day","l":"Maricopa, Ariz. | Ak Chin Southern Dunes GC","c":"Women's Golf"},{"e":"Women's Tennis at Sacramento State","d":"4/7/2026","t":"1:00PM","l":"Sacramento, Calif.","c":"Women's Tennis"},{"e":"Women's Beach Volleyball vs San Jose State","d":"4/7/2026","t":"4:00PM","l":"Santa Clara, Calif.","c":"Women's Beach Volleyball"},{"e":"Women's Golf vs Wyoming Cowgirl Classic","d":"4/8/2026","t":"All Day","l":"Maricopa, Ariz. | Ak Chin Southern Dunes GC","c":"Women's Golf"},{"e":"Softball vs Florida State","d":"4/8/2026","t":"6:00PM","l":"Santa Clara, Calif.","c":"Softball"},{"e":"Men's Tennis at Pepperdine","d":"4/9/2026","t":"12:00PM","l":"Malibu, Calif.","c":"Men's Tennis"},{"e":"Women's Rowing at Seattle","d":"4/10/2026","t":"","l":"Vancouver, Wash.","c":"Women's Rowing"},{"e":"Women's Beach Volleyball vs Chaminade","d":"4/10/2026","t":"1:00PM","l":"Honolulu","c":"Women's Beach Volleyball"},{"e":"Women's Beach Volleyball vs Hawaii Pacific","d":"4/10/2026","t":"3:00PM","l":"Honolulu","c":"Women's Beach Volleyball"},{"e":"Softball vs San Diego","d":"4/10/2026","t":"6:00PM","l":"Santa Clara, Calif.","c":"Softball"},{"e":"Baseball vs Saint Mary's","d":"4/10/2026","t":"6:00PM","l":"Santa Clara, Calif.","c":"Baseball"},{"e":"Women's Rowing vs Portland Invitational","d":"4/11/2026","t":"","l":"Vancouver, Wash.","c":"Women's Rowing"},{"e":"Men's Rowing at Gonzaga","d":"4/11/2026","t":"","l":"Spokane, Wash.","c":"Men's Rowing"},{"e":"Women's Tennis at Pacific","d":"4/11/2026","t":"11:00AM","l":"Stockton, Calif.","c":"Women's Tennis"},{"e":"Women's Beach Volleyball vs Oregon","d":"4/11/2026","t":"11:00AM","l":"Honolulu","c":"Women's Beach Volleyball"},{"e":"Softball vs San Diego","d":"4/11/2026","t":"1:00PM","l":"Santa Clara, Calif.","c":"Softball"},{"e":"Baseball vs Saint Mary's","d":"4/11/2026","t":"1:00PM","l":"Santa Clara, Calif.","c":"Baseball"},{"e":"Men's Tennis vs LMU","d":"4/12/2026","t":"11:00AM","l":"Santa Clara, Calif.","c":"Men's Tennis"},{"e":"Softball vs San Diego","d":"4/12/2026","t":"12:00PM","l":"Santa Clara, Calif.","c":"Softball"},{"e":"Women's Tennis at Saint Mary's","d":"4/12/2026","t":"12:00PM","l":"Moraga, Calif.","c":"Women's Tennis"},{"e":"Baseball vs Saint Mary's","d":"4/12/2026","t":"12:00PM","l":"Santa Clara, Calif.","c":"Baseball"},{"e":"Women's Beach Volleyball at Hawaii","d":"4/12/2026","t":"2:00PM","l":"Honolulu","c":"Women's Beach Volleyball"},{"e":"Women's Beach Volleyball vs Oregon","d":"4/12/2026","t":"5:00PM","l":"Honolulu","c":"Women's Beach Volleyball"},{"e":"Baseball at Stanford","d":"4/15/2026","t":"6:05PM","l":"Stanford, Calif.","c":"Baseball"},{"e":"Men's Cross Country/Track  Day One","d":"4/16/2026","t":"","l":"Azusa, Calif.","c":"Men's Cross Country/Track"},{"e":"Women's Cross Country/Track  Day One","d":"4/16/2026","t":"7:30AM","l":"Azusa, Calif.","c":"Women's Cross Country/Track"},{"e":"Women's Tennis vs Washington State","d":"4/16/2026","t":"11:00AM","l":"Santa Clara, Calif.","c":"Women's Tennis"},{"e":"Men's Cross Country/Track  Day Two","d":"4/17/2026","t":"","l":"Azusa, Calif.","c":"Men's Cross Country/Track"},{"e":"Women's Cross Country/Track  Day Two","d":"4/17/2026","t":"7:00AM","l":"Azusa, Calif.","c":"Women's Cross Country/Track"},{"e":"Women's Tennis vs Gonzaga","d":"4/17/2026","t":"11:00AM","l":"Santa Clara, Calif.","c":"Women's Tennis"},{"e":"Women's Beach Volleyball vs Sacramento State","d":"4/17/2026","t":"12:00PM","l":"Davis, Calif.","c":"Women's Beach Volleyball"},{"e":"Women's Beach Volleyball at UC Davis","d":"4/17/2026","t":"2:00PM","l":"Davis, Calif.","c":"Women's Beach Volleyball"},{"e":"Softball at Pacific","d":"4/17/2026","t":"6:00PM","l":"Stockton, Calif.","c":"Softball"},{"e":"Baseball at Pacific","d":"4/17/2026","t":"6:00PM","l":"Stockton, Calif.","c":"Baseball"},{"e":"Men's Cross Country/Track  Day Three","d":"4/18/2026","t":"","l":"Azusa, Calif.","c":"Men's Cross Country/Track"},{"e":"Women's Cross Country/Track  Day Three","d":"4/18/2026","t":"8:30AM","l":"Azusa, Calif.","c":"Women's Cross Country/Track"},{"e":"Women's Beach Volleyball at UC Davis","d":"4/18/2026","t":"10:00AM","l":"Davis, Calif.","c":"Women's Beach Volleyball"},{"e":"Men's Tennis vs San Diego","d":"4/18/2026","t":"11:00AM","l":"Santa Clara, Calif.","c":"Men's Tennis"},{"e":"Women's Beach Volleyball vs Sacramento State","d":"4/18/2026","t":"12:00PM","l":"Davis, Calif.","c":"Women's Beach Volleyball"},{"e":"Baseball at Pacific","d":"4/18/2026","t":"3:00PM","l":"Stockton, Calif.","c":"Baseball"},{"e":"Softball at Pacific","d":"4/18/2026","t":"4:00PM","l":"Stockton, Calif.","c":"Softball"},{"e":"Softball at Pacific","d":"4/19/2026","t":"12:00PM","l":"Stockton, Calif.","c":"Softball"},{"e":"Baseball at Pacific","d":"4/19/2026","t":"1:00PM","l":"Stockton, Calif.","c":"Baseball"},{"e":"Baseball vs Stanford","d":"4/20/2026","t":"6:00PM","l":"Santa Clara, Calif.","c":"Baseball"},{"e":"Softball vs Stanford","d":"4/22/2026","t":"6:00PM","l":"Santa Clara, Calif.","c":"Softball"},{"e":"Women's Beach Volleyball vs West Coast Conference","d":"4/23/2026","t":"TBA","l":"Santa Monica, Calif.","c":"Women's Beach Volleyball"},{"e":"Men's Tennis vs WCC Championship Tournament","d":"4/23/2026","t":"","l":"Green Valley Country Club | Fairfield, Calif.","c":"Men's Tennis"},{"e":"Women's Tennis vs WCC Championship Tournament","d":"4/23/2026","t":"","l":"Green Valley Country Club | Fairfield, Calif.","c":"Women's Tennis"},{"e":"Women's Tennis vs WCC Championship Tournament","d":"4/24/2026","t":"","l":"Green Valley Country Club | Fairfield, Calif.","c":"Women's Tennis"},{"e":"Men's Tennis vs WCC Championship Tournament","d":"4/24/2026","t":"","l":"Green Valley Country Club | Fairfield, Calif.","c":"Men's Tennis"},{"e":"Women's Beach Volleyball vs West Coast Conference","d":"4/24/2026","t":"TBA","l":"Santa Monica, Calif.","c":"Women's Beach Volleyball"},{"e":"Baseball vs Portland","d":"4/24/2026","t":"6:00PM","l":"Santa Clara, Calif.","c":"Baseball"},{"e":"Women's Tennis vs WCC Championship Tournament","d":"4/25/2026","t":"","l":"Green Valley Country Club | Fairfield, Calif.","c":"Women's Tennis"},{"e":"Women's Golf vs WCC Championship","d":"4/25/2026","t":"All Day","l":"Fairfield, Calif. | Green Valley CC","c":"Women's Golf"},{"e":"Men's Tennis vs WCC Championship Tournament","d":"4/25/2026","t":"","l":"Green Valley Country Club | Fairfield, Calif.","c":"Men's Tennis"},{"e":"Men's Rowing vs WIRAs","d":"4/25/2026","t":"","l":"Rancho Cordova, Calif.","c":"Men's Rowing"},{"e":"Women's Rowing vs WIRAs","d":"4/25/2026","t":"","l":"Rancho Cordova, Calif.","c":"Women's Rowing"},{"e":"Women's Rowing vs Seattle","d":"4/25/2026","t":"","l":"Los Gatos, Calif.","c":"Women's Rowing"},{"e":"Baseball vs Portland","d":"4/25/2026","t":"1:00PM","l":"Santa Clara, Calif.","c":"Baseball"},{"e":"Women's Golf vs WCC Championship","d":"4/26/2026","t":"All Day","l":"Fairfield, Calif. | Green Valley CC","c":"Women's Golf"},{"e":"Women's Rowing vs WIRAs","d":"4/26/2026","t":"","l":"Rancho Cordova, Calif.","c":"Women's Rowing"},{"e":"Men's Rowing vs WIRAs","d":"4/26/2026","t":"","l":"Rancho Cordova, Calif.","c":"Men's Rowing"},{"e":"Baseball vs Portland","d":"4/26/2026","t":"12:00PM","l":"Santa Clara, Calif.","c":"Baseball"},{"e":"Women's Golf vs WCC Championship","d":"4/27/2026","t":"All Day","l":"Fairfield, Calif. | Green Valley CC","c":"Women's Golf"},{"e":"Baseball at Cal Poly","d":"4/28/2026","t":"4:05PM","l":"San Luis Obispo, Calif.","c":"Baseball"},{"e":"Men's Golf vs WCC Championship","d":"5/1/2026","t":"All Day","l":"Fairfield, Calif. | Green Valley CC","c":"Men's Golf"},{"e":"Men's Cross Country/Track  Payton Jordan Invitational","d":"5/1/2026","t":"","l":"Stanford, Calif.","c":"Men's Cross Country/Track"},{"e":"Women's Cross Country/Track  Payton Jordan Invitational","d":"5/1/2026","t":"","l":"Stanford, Calif.","c":"Women's Cross Country/Track"},{"e":"Softball at Seattle U","d":"5/1/2026","t":"5:00PM","l":"Seattle","c":"Softball"},{"e":"Baseball at Gonzaga","d":"5/1/2026","t":"6:00PM","l":"Spokane, Wash.","c":"Baseball"},{"e":"Men's Golf vs WCC Championship","d":"5/2/2026","t":"All Day","l":"Fairfield, Calif. | Green Valley CC","c":"Men's Golf"},{"e":"Softball at Seattle U","d":"5/2/2026","t":"2:00PM","l":"Seattle","c":"Softball"},{"e":"Baseball at Gonzaga","d":"5/2/2026","t":"6:00PM","l":"Spokane, Wash.","c":"Baseball"},{"e":"Men's Golf vs WCC Championship","d":"5/3/2026","t":"All Day","l":"Fairfield, Calif. | Green Valley CC","c":"Men's Golf"},{"e":"Softball at Seattle U","d":"5/3/2026","t":"12:00PM","l":"Seattle","c":"Softball"},{"e":"Baseball at Gonzaga","d":"5/3/2026","t":"1:00PM","l":"Spokane, Wash.","c":"Baseball"},{"e":"Baseball vs Cal Poly","d":"5/5/2026","t":"4:00PM","l":"Santa Clara, Calif.","c":"Baseball"},{"e":"Softball vs Saint Mary's","d":"5/7/2026","t":"6:00PM","l":"Santa Clara, Calif.","c":"Softball"},{"e":"Men's Cross Country/Track  Day One","d":"5/8/2026","t":"","l":"Azusa, Calif.","c":"Men's Cross Country/Track"},{"e":"Women's Cross Country/Track  Day One","d":"5/8/2026","t":"","l":"Azusa, Calif.","c":"Women's Cross Country/Track"},{"e":"Men's Rowing vs Dad Vail Regatta","d":"5/8/2026","t":"","l":"Camden, N.J.","c":"Men's Rowing"},{"e":"Baseball at Seattle","d":"5/8/2026","t":"4:00PM","l":"Bellevue, Wash.","c":"Baseball"},{"e":"Softball vs Saint Mary's","d":"5/8/2026","t":"7:00PM","l":"Santa Clara, Calif.","c":"Softball"},{"e":"Men's Cross Country/Track  Day Two","d":"5/9/2026","t":"","l":"Azusa, Calif.","c":"Men's Cross Country/Track"},{"e":"Men's Rowing vs Dad Vail Regatta","d":"5/9/2026","t":"","l":"Camden, N.J.","c":"Men's Rowing"},{"e":"Women's Cross Country/Track  Day Two","d":"5/9/2026","t":"","l":"Azusa, Calif.","c":"Women's Cross Country/Track"},{"e":"Softball vs Saint Mary's","d":"5/9/2026","t":"1:00PM","l":"Santa Clara, Calif.","c":"Softball"},{"e":"Baseball at Seattle","d":"5/9/2026","t":"2:00PM","l":"Bellevue, Wash.","c":"Baseball"},{"e":"Baseball at Seattle","d":"5/10/2026","t":"12:00PM","l":"Bellevue, Wash.","c":"Baseball"},{"e":"Baseball vs Pepperdine","d":"5/14/2026","t":"6:00PM","l":"Santa Clara, Calif.","c":"Baseball"},{"e":"Softball vs NCAA","d":"5/15/2026","t":"","l":"TBA","c":"Softball"},{"e":"Women's Rowing vs West Coast Conference Championships","d":"5/15/2026","t":"","l":"Rancho Cordova, Calif.","c":"Women's Rowing"},{"e":"Baseball vs Pepperdine","d":"5/15/2026","t":"6:00PM","l":"Santa Clara, Calif.","c":"Baseball"},{"e":"Men's Cross Country/Track  West Coast Last Chance","d":"5/16/2026","t":"","l":"San Francisco","c":"Men's Cross Country/Track"},{"e":"Women's Rowing vs West Coast Conference Championships","d":"5/16/2026","t":"","l":"Rancho Cordova, Calif.","c":"Women's Rowing"},{"e":"Women's Cross Country/Track  West Coast Last Chance","d":"5/16/2026","t":"","l":"San Francisco","c":"Women's Cross Country/Track"},{"e":"Baseball vs Pepperdine","d":"5/16/2026","t":"1:00PM","l":"Santa Clara, Calif.","c":"Baseball"},{"e":"Baseball vs First Round","d":"5/20/2026","t":"TBA","l":"Scottsdale, Ariz.","c":"Baseball"},{"e":"Baseball vs Day Two","d":"5/21/2026","t":"TBA","l":"Scottsdale, Ariz.","c":"Baseball"},{"e":"Baseball vs Semifinals","d":"5/22/2026","t":"TBA","l":"Scottsdale, Ariz.","c":"Baseball"},{"e":"Softball vs NCAA","d":"5/22/2026","t":"","l":"TBA","c":"Softball"},{"e":"Baseball vs Championship Day","d":"5/23/2026","t":"TBA","l":"Scottsdale, Ariz.","c":"Baseball"},{"e":"Men's Cross Country/Track  NCAA Outdoor Track & Field Championships West First Round","d":"5/27/2026","t":"","l":"Fayetteville, Ark.","c":"Men's Cross Country/Track"},{"e":"Women's Cross Country/Track  NCAA Outdoor Track & Field Championships West First Round","d":"5/27/2026","t":"","l":"Fayetteville, Ark.","c":"Women's Cross Country/Track"},{"e":"Softball vs NCAA","d":"5/28/2026","t":"","l":"Oklahoma City, Okla.","c":"Softball"},{"e":"Men's Rowing vs IRA National Championship","d":"5/29/2026","t":"","l":"Rancho Cordova, Calif.","c":"Men's Rowing"},{"e":"Men's Rowing vs IRA National Championship","d":"5/30/2026","t":"","l":"Rancho Cordova, Calif.","c":"Men's Rowing"},{"e":"Men's Rowing vs IRA National Championship","d":"5/31/2026","t":"","l":"Rancho Cordova, Calif.","c":"Men's Rowing"},{"e":"Women's Cross Country/Track  NCAA Outdoor Track & Field Championships","d":"6/10/2026","t":"","l":"Eugene, Ore.","c":"Women's Cross Country/Track"},{"e":"Men's Cross Country/Track  NCAA Outdoor Track & Field Championships","d":"6/10/2026","t":"","l":"Eugene, Ore.","c":"Men's Cross Country/Track"}];
          const now = new Date();
          const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          const weekEnd = todayMs + 7 * 24 * 60 * 60 * 1000;
          const upcoming = SCU_EVENTS.filter(ev => {
            const parts = ev.d.split("/");
            const evDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1])).getTime();
            return evDate >= todayMs && evDate < weekEnd;
          }).sort((a, b) => {
            const da = new Date(a.d).getTime(); const db = new Date(b.d).getTime();
            return da - db;
          });
          if (upcoming.length === 0) return null;
          return (
            <div style={{ ...crd, padding: 14, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>SCU Sports This Week</div>
                <a href="https://santaclarabroncos.com/calendar" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: ACCENT, fontWeight: 600, textDecoration: "none", fontFamily: F }}>Full calendar</a>
              </div>
              {upcoming.map((ev, i) => {
                const parts = ev.d.split("/");
                const evDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
                const dayName = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][evDate.getDay()];
                const monthDay = evDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "6px 0", borderBottom: i < upcoming.length - 1 ? "1px solid " + BORDER : "none" }}>
                    <div style={{ width: 42, textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase" }}>{dayName}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: TEXT_PRIMARY }}>{evDate.getDate()}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.3 }}>{ev.e}</div>
                      <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 1 }}>{ev.t && ev.t !== "All Day" ? ev.t + " / " : ""}{ev.l}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}


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

        {/* Admin section */}
        {isAdmin && (
          <div style={{ marginTop: 8 }}>
            {/* Quick links */}
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
                <input id="admin-link-label" placeholder="Label" style={{ ...inp, flex: 1, fontSize: 12 }} />
                <input id="admin-link-url" placeholder="URL" style={{ ...inp, flex: 2, fontSize: 12 }} />
                <button onClick={async () => {
                  const label = document.getElementById("admin-link-label").value.trim();
                  const url = document.getElementById("admin-link-url").value.trim();
                  if (!label || !url) return;
                  const updated = { ...data, adminLinks: [...(data.adminLinks || []), { label, url }] };
                  await saveData(updated); setData(updated);
                  document.getElementById("admin-link-label").value = "";
                  document.getElementById("admin-link-url").value = "";
                  showMsg("Link added");
                }} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", fontSize: 12 }}>Add</button>
              </div>
            </div>
          </div>
        )}

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

function WeekHeaderEditor({ week, wi, data, setData, onDone }) {
  const [local, setLocal] = useState({ label: week.label || "", theme: week.theme || "", question: week.question || "" });
  const set = (field, value) => setLocal(prev => ({ ...prev, [field]: value }));
  const handleDone = async () => {
    const updated = { ...data, schedule: data.schedule.map((w, i) => i === wi ? { ...w, label: local.label, theme: local.theme, question: local.question } : w) };
    await saveData(updated); setData(updated); onDone();
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={local.label} onChange={e => set("label", e.target.value)} placeholder="Label" style={{ ...inp, padding: "4px 8px", fontSize: 12, width: 90 }} />
        <input value={local.theme} onChange={e => set("theme", e.target.value)} placeholder="Theme" style={{ ...inp, padding: "4px 8px", fontSize: 12, flex: 1 }} />
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <input value={local.question} onChange={e => set("question", e.target.value)} placeholder="Driving question" style={{ ...inp, padding: "4px 8px", fontSize: 12, flex: 1 }} />
        <button onClick={handleDone} style={{ ...bt, fontSize: 11, padding: "3px 10px", background: ACCENT, color: "#fff" }}>Done</button>
      </div>
    </div>
  );
}

function ScheduleCardEditor({ d, wi, realDi, data, setData, updateDate, removeDate, onDone }) {
  const [local, setLocal] = useState({
    date: d.date, day: d.day, topic: d.topic || "", holiday: !!d.holiday,
    activities: (d.activities || []).join(", "), assignment: d.assignment || "",
    notes: d.notes || "", adminNotes: d.adminNotes || "",
  });
  const set = (field, value) => setLocal(prev => ({ ...prev, [field]: value }));

  const handleDone = async () => {
    const patch = {
      date: local.date, day: local.day, topic: local.topic, holiday: local.holiday,
      activities: local.activities.split(",").map(s => s.trim()).filter(Boolean),
      assignment: local.assignment, notes: local.notes, adminNotes: local.adminNotes,
    };
    const updated = { ...data, schedule: data.schedule.map((w, i) => i === wi ? { ...w, dates: w.dates.map((dt, di) => di === realDi ? { ...dt, ...patch } : dt) } : w) };
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
        <button onClick={handleDone} style={{ ...bt, fontSize: 11, padding: "3px 10px", background: ACCENT, color: "#fff" }}>Done</button>
        <button onClick={() => { removeDate(wi, realDi); onDone(); }} style={{ ...bt, fontSize: 11, padding: "3px 10px", background: "transparent", color: RED, border: "1px solid " + RED + "33" }}>X</button>
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

  const updateDate = async (weekIdx, dateIdx, field, value) => {
    const updated = { ...data, schedule: data.schedule.map((w, wi) => wi === weekIdx ? { ...w, dates: w.dates.map((d, di) => di === dateIdx ? { ...d, [field]: value } : d) } : w) };
    await saveData(updated); setData(updated);
  };
  const updateWeek = async (weekIdx, field, value) => {
    const updated = { ...data, schedule: data.schedule.map((w, wi) => wi === weekIdx ? { ...w, [field]: value } : w) };
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

  return (
    <div style={{ padding: "20px 16px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ ...sectionLabel, marginBottom: 8 }}>Schedule</div>
            {isAdmin && (
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {data.scheduleDocUrl && !editLinks && (
                  <a href={data.scheduleDocUrl} target="_blank" rel="noopener noreferrer" style={{ ...pillInactive, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    Doc
                  </a>
                )}
                {data.scheduleCanvaUrl && !editLinks && (
                  <a href={data.scheduleCanvaUrl} target="_blank" rel="noopener noreferrer" style={{ ...pillInactive, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    Canva
                  </a>
                )}
                <button onClick={() => setEditLinks(!editLinks)} style={{ ...pillInactive, fontSize: 11 }}>{editLinks ? "Cancel" : "Links"}</button>
              </div>
            )}
          </div>
          {isAdmin && editLinks && (
            <div style={{ ...crd, padding: 12, marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              <input value={docUrl} onChange={e => setDocUrl(e.target.value)} placeholder="Google Doc URL" style={{ ...inp, fontSize: 12, padding: "6px 8px" }} />
              <input value={canvaUrl} onChange={e => setCanvaUrl(e.target.value)} placeholder="Canva URL" style={{ ...inp, fontSize: 12, padding: "6px 8px" }} />
              <button onClick={saveLinks} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", padding: "8px 0", width: "100%" }}>Save</button>
            </div>
          )}
          {isAdmin && (
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button onClick={addWeek} style={pillInactive}>+ Week</button>
              <button onClick={() => { if (window.confirm("Reset?")) resetSchedule(); }} style={{ ...pill, background: "#fef2f2", color: RED }}>Reset</button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {schedule.map((week, wi) => {
          const tc = TOPIC_COLORS[week.label] || TEXT_SECONDARY;
          const mon = week.dates.find(d => d.day === "Mon");
          const wed = week.dates.find(d => d.day === "Wed");
          const fri = week.dates.find(d => d.day === "Fri" || d.day === "Finals");
          const days = [mon, wed, fri].filter(Boolean);
          const isEditing = editWeek === wi;
          const hiddenWeeks = data.hiddenWeeks || [];
          const isHidden = hiddenWeeks.includes(week.week);

          const toggleHidden = async () => {
            const newHidden = isHidden ? hiddenWeeks.filter(w => w !== week.week) : [...hiddenWeeks, week.week];
            const updated = { ...data, hiddenWeeks: newHidden };
            await saveData(updated); setData(updated);
          };

          return (
            <div key={wi}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                {week.week <= 10 && <div style={{ width: 36, height: 36, borderRadius: 10, background: isHidden && !isAdmin ? TEXT_MUTED : ACCENT, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 15, fontWeight: 800, fontFamily: F, flexShrink: 0 }}>{week.week}</div>}
                {isAdmin && isEditing ? (
                  <WeekHeaderEditor week={week} wi={wi} data={data} setData={setData} onDone={() => setEditWeek(null)} />
                ) : (
                  <div style={{ flex: 1, cursor: isAdmin ? "pointer" : "default" }} onClick={() => isAdmin && setEditWeek(wi)}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.25 }}>{week.label}{week.theme ? " — " + week.theme : ""}</div>
                    <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{days.map(d => d.date).join("  /  ")}</div>
                  </div>
                )}
                {isAdmin && <button onClick={toggleHidden} style={{ ...pill, background: isHidden ? "#fef2f2" : "#ecfdf5", color: isHidden ? RED : GREEN, fontSize: 11, padding: "4px 10px" }}>{isHidden ? "Hidden" : "Visible"}</button>}
                {isAdmin && <button onClick={() => removeWeek(wi)} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, fontSize: 16, padding: 4 }}>x</button>}
              </div>

              {/* Hidden week: students only see topic and no-class days */}
              {isHidden && !isAdmin ? (
                <div style={{ marginBottom: 16, marginLeft: 48 }}>
                  {days.filter(d => d.holiday).map((d, di) => (
                    <div key={di} style={{ fontSize: 13, color: RED, fontWeight: 600 }}>{d.day} {d.date} — No in-person class</div>
                  ))}
                  {days.filter(d => d.holiday).length === 0 && <div style={{ fontSize: 13, color: TEXT_MUTED, fontStyle: "italic" }}>Details coming soon</div>}
                </div>
              ) : (
                <>
              {week.question && !isEditing && <div style={{ fontSize: 14, fontStyle: "italic", color: TEXT_SECONDARY, marginBottom: 10, marginLeft: 48, lineHeight: 1.4 }}>"{week.question}"</div>}

              <div className="schedule-days" style={{ display: "grid", gap: 8 }}>
                {days.map((d, di) => {
                  const realDi = week.dates.indexOf(d);
                  const isHoliday = d.holiday;
                  const isFri = d.fri || d.day === "Fri";
                  const isEdit = editCell && editCell.w === wi && editCell.d === realDi;
                  const hasReadings = (d.readings || []).length > 0;

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
                        <ScheduleCardEditor d={d} wi={wi} realDi={realDi} data={data} setData={setData} updateDate={updateDate} removeDate={removeDate} onDone={() => setEditCell(null)} />
                      ) : (
                        <div>
                          {isHoliday && <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: "#dc2626", background: "#fef2f2", padding: "3px 8px", borderRadius: 6, marginBottom: d.topic ? 6 : 0 }}>No in-person class</div>}
                          {d.topic && <div style={{ fontSize: 15, color: TEXT_PRIMARY, lineHeight: 1.45, fontWeight: 400 }}>{d.topic}</div>}
                          {!isHoliday && !d.topic && <div style={{ fontSize: 15, color: TEXT_MUTED, fontStyle: "italic" }}>—</div>}
                          {!isHoliday && (
                            <>
                              {(d.activities || []).length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                                  {(d.activities || []).map((act, ai) => (
                                    <span key={ai} style={{ fontSize: 11, fontWeight: 700, color: TEXT_PRIMARY, background: "#f4f4f5", padding: "3px 8px", borderRadius: 6 }}>{act}</span>
                                  ))}
                                </div>
                              )}
                              {d.assignment && <div style={{ fontSize: 13, color: "#c2410c", marginTop: 6, fontWeight: 600 }}>{d.assignment}</div>}
                              {hasReadings && (
                                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid " + BORDER, display: "flex", flexDirection: "column", gap: 4 }}>
                                  {(d.readings || []).filter(r => r.type === "fishbowl" || r.type === "required" || r.type === "recommended").map((r, ri) => {
                                    const rdg = (data.readings || []).find(x => x.id === r.readingId);
                                    if (!rdg) return null;
                                    const link = rdg.pdfUrl || rdg.url;
                                    const tColor = r.type === "fishbowl" ? "#7c3aed" : r.type === "required" ? "#b45309" : GREEN;
                                    const tLabel = r.type === "fishbowl" ? "Fish" : r.type === "required" ? "Req" : "Rec";
                                    const isFish = r.type === "fishbowl";
                                    const isReq = r.type === "required";
                                    return (
                                      <div key={ri} style={{ display: "flex", alignItems: "flex-start", gap: 6, background: isReq ? "#fffbeb" : "transparent", padding: isReq ? "4px 8px" : "2px 0", borderRadius: isReq ? 6 : 0, margin: isReq ? "0 -8px" : 0 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: tColor, textTransform: "uppercase", marginTop: 2, flexShrink: 0, width: 30 }}>{tLabel}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          {link ? (
                                            <a href={link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", fontWeight: 500, lineHeight: 1.35 }}>{isFish ? "\uD83D\uDC1F " : ""}{rdg.title}</a>
                                          ) : (
                                            <span style={{ fontSize: 13, color: TEXT_PRIMARY, fontWeight: 500, lineHeight: 1.35 }}>{isFish ? "\uD83D\uDC1F " : ""}{rdg.title}</span>
                                          )}
                                          {rdg.pdfUrl && <span style={{ fontSize: 9, fontWeight: 700, color: RED, background: "#fef2f2", padding: "1px 4px", borderRadius: 3, marginLeft: 4 }}>PDF</span>}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {d.notes && !isHoliday && <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 6, whiteSpace: "pre-wrap", lineHeight: 1.4 }}>{d.notes}</div>}
                              {isAdmin && d.adminNotes && <div style={{ fontSize: 12, color: AMBER, marginTop: 6, padding: "6px 10px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fef3c7", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>{d.adminNotes}</div>}
                            </>
                          )}
                          {isHoliday && d.assignment && <div style={{ fontSize: 13, color: "#c2410c", marginTop: 6, fontWeight: 600 }}>{d.assignment}</div>}
                          {isHoliday && hasReadings && (
                                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid " + BORDER, display: "flex", flexDirection: "column", gap: 4 }}>
                                  {(d.readings || []).filter(r => r.type === "fishbowl" || r.type === "required" || r.type === "recommended").map((r, ri) => {
                                    const rdg = (data.readings || []).find(x => x.id === r.readingId);
                                    if (!rdg) return null;
                                    const link = rdg.pdfUrl || rdg.url;
                                    const tColor = r.type === "fishbowl" ? "#7c3aed" : r.type === "required" ? "#b45309" : GREEN;
                                    const tLabel = r.type === "fishbowl" ? "Fish" : r.type === "required" ? "Req" : "Rec";
                                    const isFish = r.type === "fishbowl";
                                    const isReq = r.type === "required";
                                    return (
                                      <div key={ri} style={{ display: "flex", alignItems: "flex-start", gap: 6, background: isReq ? "#fffbeb" : "transparent", padding: isReq ? "4px 8px" : "2px 0", borderRadius: isReq ? 6 : 0, margin: isReq ? "0 -8px" : 0 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: tColor, textTransform: "uppercase", marginTop: 2, flexShrink: 0, width: 30 }}>{tLabel}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          {link ? (
                                            <a href={link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", fontWeight: 500, lineHeight: 1.35 }}>{isFish ? "\uD83D\uDC1F " : ""}{rdg.title}</a>
                                          ) : (
                                            <span style={{ fontSize: 13, color: TEXT_PRIMARY, fontWeight: 500, lineHeight: 1.35 }}>{isFish ? "\uD83D\uDC1F " : ""}{rdg.title}</span>
                                          )}
                                          {rdg.pdfUrl && <span style={{ fontSize: 9, fontWeight: 700, color: RED, background: "#fef2f2", padding: "1px 4px", borderRadius: 3, marginLeft: 4 }}>PDF</span>}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                          )}
                          {isHoliday && d.notes && <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 6, whiteSpace: "pre-wrap", lineHeight: 1.4 }}>{d.notes}</div>}
                          {isHoliday && isAdmin && d.adminNotes && <div style={{ fontSize: 12, color: AMBER, marginTop: 6, padding: "6px 10px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fef3c7", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>{d.adminNotes}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {isAdmin && <button onClick={() => addDate(wi)} style={{ ...pill, background: "transparent", border: "1px dashed " + BORDER, color: TEXT_MUTED, width: "100%", marginTop: 8, fontSize: 12 }}>+</button>}
                </>
              )}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}

/* ─── LEADERBOARD ─── */
const DEFAULT_MOTTOS = [
  "Ball is life.", "No days off.", "Stay hungry.", "Trust the process.", "Built different.",
  "Pressure makes diamonds.", "Leave it on the field.", "One play at a time.", "Outwork everyone.",
  "Why not us?", "Heart of a champion.", "Earned, not given.", "Rise and grind.", "Fear no one.",
  "All gas, no brakes.", "Be the storm.", "Play to win.", "Next play mentality.", "Refuse to lose.",
  "Make it happen.", "Bet on yourself.", "Talk is cheap.", "Work in silence.", "Stay dangerous.",
  "Go big or go home.", "Every rep counts.", "Relentless.", "Play like nobody's watching.",
  "Dream bigger.", "Stay locked in.", "No shortcuts.", "Prove them wrong.", "Run your race.",
  "The grind never stops.", "Champions adjust.", "Win the moment.", "Play with purpose.",
  "Control what you can.", "Finish strong.", "Leave no doubt.", "Keep pushing.", "Own the day.",
  "Find a way.", "Zero excuses.", "Do it anyway.", "Level up.", "Make them remember.",
  "Energy is everything.", "Show up every day.", "Write your story.", "Be undeniable.",
];

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

function Leaderboard({ students, log, teams, isAdmin, userName, data }) {
  const ranked = rs(students, log);
  const mx = ranked.length > 0 ? Math.max(ranked[0].points, 1) : 1;
  const [showAll, setShowAll] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [flashIds, setFlashIds] = useState(new Set());
  const prevLogLenRef = useRef(log.length);
  const shuffledStudents = shuffleTeams(students, log, teams);
  const visible = showAll ? ranked : ranked.slice(0, 10);
  const myRank = ranked.findIndex(s => s.name === userName);
  const meInVisible = myRank >= 0 && myRank < visible.length;
  const meData = myRank >= 0 ? ranked[myRank] : null;

  // Today's transactions
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayLog = log.filter(e => e.ts >= todayStart.getTime()).sort((a, b) => b.ts - a.ts);

  // Flash new entries for 5 seconds
  useEffect(() => {
    if (log.length > prevLogLenRef.current) {
      const newEntries = log.slice(prevLogLenRef.current);
      const newIds = new Set(newEntries.map(e => e.id));
      setFlashIds(prev => new Set([...prev, ...newIds]));
      const timer = setTimeout(() => {
        setFlashIds(prev => {
          const next = new Set(prev);
          newIds.forEach(id => next.delete(id));
          return next;
        });
      }, 5000);
      prevLogLenRef.current = log.length;
      return () => clearTimeout(timer);
    }
    prevLogLenRef.current = log.length;
  }, [log.length]);
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

  // Last week's rankings for movement
  const lastWeekLog = log.filter(e => e.ts < weekStart);
  const lastWeekRanked = students.map(s => ({ ...s, points: lastWeekLog.filter(e => e.studentId === s.id).reduce((t, e) => t + e.amount, 0) })).sort((a, b) => b.points - a.points);
  const lastWeekRankMap = {};
  lastWeekRanked.forEach((s, i) => { lastWeekRankMap[s.id] = i; });

  const getMotto = (sid) => {
    const bio = bios[sid];
    if (bio?.motto) return bio.motto;
    let hash = 0;
    for (let i = 0; i < sid.length; i++) hash = ((hash << 5) - hash) + sid.charCodeAt(i);
    return DEFAULT_MOTTOS[Math.abs(hash) % DEFAULT_MOTTOS.length];
  };

  const renderRow = (s, i, isMe, isGhost) => {
    const shuffled = shuffledStudents.find(st => st.id === s.id);
    const team = teams.find(t => t.id === (shuffled?.teamId || s.teamId));
    const tc = team ? TEAM_COLORS[team.colorIdx] : TEAM_COLORS[0];
    const inA = i < 5;
    const bw = mx > 0 ? Math.max((s.points / mx) * 100, 2) : 2;
    const bio = bios[s.id] || {};
    const initials = s.name.split(" ").map(n => n[0]).join("");
    const wp = weekPoints[s.id] || 0;
    const lastRank = lastWeekRankMap[s.id];
    const movement = lastRank !== undefined ? lastRank - i : 0;
    const offset = animOffsets[s.id] || 0;
    const isExpanded = expandedId === s.id;

    // Point breakdown by source
    const breakdown = {};
    log.filter(e => e.studentId === s.id).forEach(e => {
      const src = e.source || "Other";
      breakdown[src] = (breakdown[src] || 0) + e.amount;
    });
    const breakdownEntries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

    return (
      <div key={s.id + (isGhost ? "-ghost" : "")} style={{
        borderRadius: 14, overflow: "hidden", marginBottom: 8, background: "#fff",
        border: isGhost ? "2px dashed #93c5fd" : inA ? "2px solid #d4a017" : "1px solid #f3f4f6",
        transform: offset ? "translateY(" + offset + "px)" : "none",
        transition: offset ? "none" : "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        zIndex: offset > 0 ? 10 : offset < 0 ? 0 : 1,
        boxShadow: offset > 0 ? "0 4px 16px rgba(0,0,0,0.12)" : "none",
      }}>
        <div onClick={() => setExpandedId(isExpanded ? null : s.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            fontSize: 14, fontWeight: 900, fontFamily: F,
            background: inA ? "#d4a017" : "#f4f4f5",
            color: inA ? "#fff" : TEXT_SECONDARY,
          }}>{i + 1}</div>
          {bio.photo ? (
            <img src={bio.photo} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "3px solid " + (inA ? "#d4a01744" : "#f4f4f5") }} />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff", flexShrink: 0, border: "3px solid " + (inA ? "#d4a01744" : "#f4f4f5") }}>{initials}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: TEXT_PRIMARY, fontFamily: F }}>{s.name}</span>
              {starCounts[s.id] > 0 && <span style={{ fontSize: 13, color: "#d97706" }}>{Array(starCounts[s.id]).fill("\u2733").join("")}</span>}
              {isMe && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#dbeafe", color: "#1d4ed8", fontWeight: 700 }}>YOU</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3, flexWrap: "wrap" }}>
              {team && <span style={{ fontSize: 11, color: tc.accent, fontWeight: 600 }}>{team.name}</span>}
              <span style={{ fontSize: 11, color: "#d4d4d8" }}>/</span>
              <span style={{ fontSize: 11, color: "#b0b0b0", fontStyle: "italic" }}>{getMotto(s.id)}</span>
            </div>
            {bio.hometown && <div style={{ fontSize: 11, color: "#d4d4d8", marginTop: 2 }}>{bio.hometown}</div>}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: inA ? "#b8860b" : TEXT_PRIMARY, fontFamily: F, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{s.points}</div>
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 1 }}>pts</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 3 }}>
              {wp > 0 && <span style={{ fontSize: 11, color: GREEN, fontWeight: 700 }}>+{wp} this wk</span>}
              {movement > 0 && <span style={{ fontSize: 11, color: GREEN, fontWeight: 700 }}>&#9650;{movement}</span>}
              {movement < 0 && <span style={{ fontSize: 11, color: RED, fontWeight: 700 }}>&#9660;{Math.abs(movement)}</span>}
            </div>
          </div>
        </div>
        {isExpanded && (
          <div style={{ padding: "0 16px 14px", borderTop: "1px solid #f3f4f6" }}>
            <div style={{ ...sectionLabel, marginTop: 10, marginBottom: 6 }}>Point Breakdown</div>
            {breakdownEntries.length === 0 && <div style={{ fontSize: 12, color: "#d4d4d8", fontStyle: "italic" }}>No points yet.</div>}
            {breakdownEntries.map(([src, pts]) => (
              <div key={src} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", fontSize: 13 }}>
                <span style={{ color: TEXT_SECONDARY }}>{src}</span>
                <span style={{ fontWeight: 700, color: pts > 0 ? TEXT_PRIMARY : RED }}>{pts > 0 ? "+" : ""}{pts}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: 4, background: "#f4f4f5" }}>
          <div style={{ height: "100%", width: bw + "%", background: inA ? "#d4a017" : tc.accent, transition: "width 0.5s", borderRadius: "0 2px 2px 0" }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...sectionLabel, marginBottom: 8 }}>Class Leaderboard</div>
          <div style={{ ...crd, padding: "10px 14px" }}>
            <button onClick={() => setShowExplain(!showExplain)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F, width: "100%", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>Earn points through the weekly game, This or That, Around the Horn, and Rotating Fishbowl.</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2" style={{ transform: showExplain ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginLeft: 8 }}><path d="M6 9l6 6 6-6"/></svg>
            </button>
            {showExplain && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f3f4f6", fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.6 }}>
                <p>The leaderboard tracks your game points. You earn them four ways: the weekly game (up to 100 pts), This or That (up to 20 pts), Around the Horn culture points (awarded in class), and Rotating Fishbowl (up to 20 pts).</p>
                <p style={{ marginTop: 8 }}>The top 5 on the leaderboard at the end of the quarter earn automatic A's in the class. That's real.</p>
                <p style={{ marginTop: 8 }}>This is not your full grade. The leaderboard contributes to 25% of your grade (the participation bucket), but in different weights. The other 75% comes from your assignments. Check the Assignments tab for the full picture.</p>
              </div>
            )}
          </div>
        </div>

        {/* Transaction ticker */}
        {todayLog.length > 0 && (
          <div style={{ ...crd, padding: "8px 14px", marginBottom: 12, maxHeight: 120, overflowY: "auto" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              {todayLog.slice(0, 30).map(e => {
                const s = students.find(x => x.id === e.studentId);
                const firstName = s ? s.name.split(" ")[0] : "?";
                const lastName = s ? s.name.split(" ").slice(-1)[0] : "";
                const isFlash = flashIds.has(e.id);
                return (
                  <span key={e.id} style={{
                    fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                    background: isFlash ? (e.amount >= 0 ? "#ecfdf5" : "#fef2f2") : "#f4f4f5",
                    color: isFlash ? (e.amount >= 0 ? GREEN : RED) : TEXT_SECONDARY,
                    transition: "all 0.5s",
                    animation: isFlash ? "tickerPulse 0.5s ease-out" : "none",
                  }}>
                    {firstName} {lastName} {e.amount > 0 ? "+" : ""}{e.amount}
                  </span>
                );
              })}
            </div>
          </div>
        )}

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
    </div>
  );
}

/* ─── TEAMS ─── */
function TeamsView({ teams, students, log, data }) {
  const shuffled = shuffleTeams(students, log, teams);
  const teamTotals = teams.map(t => {
    const members = shuffled.filter(s => s.teamId === t.id);
    const total = members.reduce((sum, m) => sum + gp(log, m.id), 0);
    return { ...t, total, members };
  }).sort((a, b) => b.total - a.total);

  const weeklyWins = data?.weeklyTeamWins || {};
  const winCounts = {};
  Object.values(weeklyWins).forEach(tid => { if (tid) winCounts[tid] = (winCounts[tid] || 0) + 1; });

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 4 }}>This Week's Teams</div>
        <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 12, lineHeight: 1.5 }}>Teams shuffle weekly based on leaderboard rank. The team whose top 3 players score highest on the weekly game earns 10 bonus points each.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {teamTotals.map((team, i) => {
            const tc = TEAM_COLORS[team.colorIdx];
            const memberData = team.members.map(m => ({ ...m, points: gp(log, m.id) })).sort((a, b) => b.points - a.points);
            const wins = winCounts[team.id] || 0;
            return (
              <div key={team.id} style={{ borderRadius: 16, border: "1px solid #f3f4f6", overflow: "hidden", background: "#fff" }}>
                <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 900, flexShrink: 0 }}>#{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>{team.name}</div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED }}>{memberData.length} players{wins > 0 ? " / " + wins + " win" + (wins !== 1 ? "s" : "") : ""}</div>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: TEXT_PRIMARY, fontVariantNumeric: "tabular-nums" }}>{team.total}</div>
                </div>
                <div style={{ padding: "0 16px 12px" }}>
                  {memberData.map(m => (
                    <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderTop: "1px solid #f9fafb" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: tc.accent, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: "#52525b" }}>{m.name}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>{m.points}</span>
                    </div>
                  ))}
                </div>
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
        <button onClick={reshuffleTeams} style={{ ...pillInactive, marginTop: 10 }}>Reshuffle</button>
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
      // Write directly to storage, bypassing write-lock
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

  // All-time totals
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

      {/* Points Dashboard */}
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
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 1500); };

  const ranked = rs(data.students, data.log);
  const rankMap = {};
  ranked.forEach((s, i) => { rankMap[s.id] = i + 1; });

  const awardPTI = async (sid, amount) => {
    const student = data.students.find(s => s.id === sid);
    const entry = { id: genId(), studentId: sid, amount, source: "Around the Horn", ts: Date.now() };
    const updated = { ...data, log: [...data.log, entry] };
    await saveData(updated); setData(updated);
    showMsg((amount > 0 ? "+" : "") + amount + " " + (student?.name?.split(" ")[0] || ""));
  };

  return (
    <div style={{ padding: "20px 16px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 12 }}>Around the Horn</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
          {[...data.students].sort(lastSortObj).map(s => {
            const team = data.teams.find(t => t.id === s.teamId);
            const tc = team ? TEAM_COLORS[team.colorIdx] : TEAM_COLORS[0];
            const pts = gp(data.log, s.id);
            const ptiPts = data.log.filter(e => e.studentId === s.id && (e.source === "Around the Horn" || e.source === "PTI")).reduce((sum, e) => sum + e.amount, 0);
            const rank = rankMap[s.id] || "-";
            const isOpen = popup === s.id;
            const initials = s.name.split(" ").map(n => n[0]).join("");
            return (
              <div key={s.id} style={{ position: "relative" }}>
                <button onClick={() => setPopup(isOpen ? null : s.id)} style={{
                  width: "100%", padding: "12px 8px", borderRadius: 12, background: "#fff",
                  border: isOpen ? "2px solid " + tc.accent : "1px solid #f3f4f6",
                  cursor: "pointer", textAlign: "center", transition: "all 0.1s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, padding: "0 2px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: rank <= 5 ? "#d4a017" : "#d4d4d8" }}>#{rank}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: ptiPts > 0 ? GREEN : "#d4d4d8" }}>ATH: {ptiPts}</span>
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px", fontSize: 12, fontWeight: 900, color: "#fff" }}>{initials}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: TEXT_PRIMARY, lineHeight: 1.2 }}>{s.name.split(" ")[0]}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_SECONDARY, marginTop: 1 }}>{s.name.split(" ").slice(1).join(" ")}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: tc.accent, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{pts}</div>
                </button>
                {isOpen && (
                  <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", zIndex: 20, marginTop: 4, display: "flex", gap: 4, background: "#fff", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "1px solid #e5e7eb", padding: 6, borderRadius: 12 }}>
                    <button onClick={() => awardPTI(s.id, -1)} style={{ ...pill, background: "#fef2f2", color: RED, minWidth: 44, fontSize: 14, fontWeight: 900 }}>-1</button>
                    <button onClick={() => awardPTI(s.id, 1)} style={{ ...pill, background: "#ecfdf5", color: GREEN, minWidth: 44, fontSize: 14, fontWeight: 900 }}>+1</button>
                    <button onClick={() => awardPTI(s.id, 5)} style={{ ...pill, background: "#fef2f2", color: ACCENT, minWidth: 44, fontSize: 14, fontWeight: 900 }}>+5</button>
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
  { key: "favTeam", label: "Favorite Sports Team", type: "text", placeholder: "e.g. Warriors" },
  { key: "motto", label: "Player Motto", type: "text", placeholder: "Your personal motto..." },
  { key: "funFact", label: "Fun Fact", type: "text", placeholder: "Something unexpected..." },
];

const SUPABASE_URL = "https://ybuchgebudixbyrcxpik.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidWNoZ2VidWRpeGJ5cmN4cGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0Nzg3OTIsImV4cCI6MjA4ODA1NDc5Mn0.aF2M_fj6bVYKw-Tz1XxI9SiQB7lAtWzuhBRZbsai8QY";
const SUPABASE_BUCKET = "class-photos";

async function uploadPhoto(file, studentId) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `comm118/${studentId}.${ext}`;
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
  const path = `comm118/readings/${readingId}.pdf`;
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
  const sorted = [...data.students].sort(lastSortObj);

  if (selectedId) {
    const student = data.students.find(s => s.id === selectedId);
    if (!student) { setSelectedId(null); return null; }
    return <BioView student={student} data={data} setData={setData} userName={userName} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 12 }}>Class Roster</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {sorted.map(s => {
            const team = data.teams.find(t => t.id === s.teamId);
            const tc = team ? TEAM_COLORS[team.colorIdx] : TEAM_COLORS[0];
            const bio = (data.bios || {})[s.id] || {};
            const initials = s.name.split(" ").map(n => n[0]).join("");
            const hasPhoto = !!bio.photo;
            return (
              <button key={s.id} onClick={() => setSelectedId(s.id)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                background: "#fff", border: "1px solid #f3f4f6", borderRadius: 12,
                cursor: "pointer", textAlign: "left", fontFamily: F, width: "100%", transition: "all 0.1s",
              }}>
                {hasPhoto ? (
                  <img src={bio.photo} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#fff", flexShrink: 0 }}>{initials}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED }}>
                    {team ? team.name : "Unassigned"}
                    {bio.major ? " / " + bio.major : ""}
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
      {sub === "teams" && <TeamsView teams={data.teams} students={data.students} log={data.log} data={data} />}
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
        <button onClick={onBack} style={pillInactive}>Back to Roster</button>

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
                  {bio.favTeam && <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Fav Team</div><div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{bio.favTeam}</div></div>}
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
                <span style={{ fontSize: 11, color: TEXT_MUTED }}>{new Date(entry.ts).toLocaleDateString()}</span>
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
              <span style={{ fontSize: 11, color: TEXT_MUTED }}>{new Date(entry.ts).toLocaleDateString()}</span>
              <button onClick={() => { if (window.confirm("Delete this note?")) deleteNote(userName, entry.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, fontSize: 12 }}>x</button>
            </div>
            <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{entry.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── DISCUSSION BOARDS ─── */
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
                <span style={{ fontSize: 11, color: TEXT_MUTED }}>{new Date(post.ts).toLocaleDateString()}</span>
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

/* ─── SURVEY ─── */
function SurveyView({ data, setData, isAdmin, userName }) {
  const surveys = data.surveys || [];
  const [creating, setCreating] = useState(false);
  const [viewingResults, setViewingResults] = useState(null);
  const [questions, setQuestions] = useState([{ text: "", type: "multiple_choice", options: ["", "", "", ""] }]);
  const [surveyTitle, setSurveyTitle] = useState("");
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
    const s = { id: genId(), title: surveyTitle.trim() || "Survey", questions: validQs.map(q => ({ id: genId(), text: q.text.trim(), type: q.type, options: q.type === "multiple_choice" ? q.options.filter(o => o.trim()) : [] })), responses: {}, active: true, showResults: false, ts: Date.now() };
    const updated = { ...data, surveys: [...surveys, s] };
    await saveData(updated); setData(updated);
    setSurveyTitle(""); setQuestions([{ text: "", type: "multiple_choice", options: ["", "", "", ""] }]); setCreating(false); showMsg("Survey created");
  };

  const respond = async (surveyId, questionId, answer) => {
    const survey = surveys.find(s => s.id === surveyId);
    if (!survey) return;
    const responses = { ...(survey.responses || {}) };
    if (!responses[userName]) responses[userName] = {};
    responses[userName][questionId] = answer;
    const updated = { ...data, surveys: surveys.map(s => s.id === surveyId ? { ...s, responses } : s) };
    await saveData(updated); setData(updated);
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
    if (answered) return <div style={{ fontSize: 13, color: GREEN, fontWeight: 600, padding: "4px 0" }}>Answered</div>;
    if (question.type === "multiple_choice") return (<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{question.options.map(o => (<button key={o} onClick={() => respond(survey.id, question.id, o)} style={{ ...crd, padding: "10px 14px", cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY, border: "1px solid " + BORDER }}>{o}</button>))}</div>);
    if (question.type === "true_false") return (<div style={{ display: "flex", gap: 8 }}><button onClick={() => respond(survey.id, question.id, "True")} style={{ ...pill, background: "#ecfdf5", color: GREEN, flex: 1, padding: "12px 0", fontSize: 15, fontWeight: 700 }}>True</button><button onClick={() => respond(survey.id, question.id, "False")} style={{ ...pill, background: "#fef2f2", color: RED, flex: 1, padding: "12px 0", fontSize: 15, fontWeight: 700 }}>False</button></div>);
    if (question.type === "likert") return (<div style={{ display: "flex", gap: 6, justifyContent: "center" }}>{[1,2,3,4,5].map(n => (<button key={n} onClick={() => respond(survey.id, question.id, String(n))} style={{ ...crd, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 17, fontWeight: 700, color: TEXT_PRIMARY, border: "1px solid " + BORDER }}>{n}</button>))}</div>);
    if (question.type === "number") return (<div style={{ display: "flex", gap: 8 }}><input id={"num-" + question.id} type="number" placeholder="Enter a number" style={{ ...inp, flex: 1 }} /><button onClick={() => { const el = document.getElementById("num-" + question.id); if (el?.value) { respond(survey.id, question.id, el.value); el.value = ""; } }} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff" }}>Submit</button></div>);
    if (question.type === "short_answer") return (<div style={{ display: "flex", gap: 8 }}><input id={"sa-" + question.id} placeholder="Your answer" style={{ ...inp, flex: 1 }} /><button onClick={() => { const el = document.getElementById("sa-" + question.id); if (el?.value?.trim()) { respond(survey.id, question.id, el.value.trim()); el.value = ""; } }} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff" }}>Submit</button></div>);
    return null;
  };

  // Results view
  if (viewingResults) {
    const survey = surveys.find(s => s.id === viewingResults);
    if (!survey) { setViewingResults(null); return null; }
    const responderCount = Object.keys(survey.responses || {}).length;
    return (
      <div style={{ padding: "24px 20px 40px", fontFamily: F }}>
        <Toast message={msg} />
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <button onClick={() => setViewingResults(null)} style={{ ...pillInactive, marginBottom: 16 }}>Back to Surveys</button>
          <div style={{ ...crd, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 4 }}>{survey.title}</div>
            <div style={{ fontSize: 13, color: TEXT_MUTED }}>{responderCount} respondent{responderCount !== 1 ? "s" : ""}</div>
            {isAdmin && (
              <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                <button onClick={() => toggleResults(survey.id)} style={survey.showResults ? pillActive : pillInactive}>{survey.showResults ? "Hide from Students" : "Show to Students"}</button>
                <button onClick={() => closeSurvey(survey.id)} style={pillInactive}>Close Survey</button>
              </div>
            )}
          </div>
          {(survey.questions || []).map((q, qi) => {
            const answers = getResponses(survey, q.id);
            return (
              <div key={q.id} style={{ ...crd, padding: 18, marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 4 }}>Question {qi + 1}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 12, lineHeight: 1.35 }}>{q.text}</div>
                {renderResults(q, answers)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const activeSurveys = surveys.filter(s => s.active);
  const closedSurveys = surveys.filter(s => !s.active);

  return (
    <div style={{ padding: "24px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ ...sectionLabel }}>Survey</div>
          {isAdmin && <button onClick={() => setCreating(!creating)} style={creating ? pillActive : pillInactive}>{creating ? "Cancel" : "+ New Survey"}</button>}
        </div>

        {isAdmin && creating && (
          <div style={{ ...crd, padding: 18, marginBottom: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input value={surveyTitle} onChange={e => setSurveyTitle(e.target.value)} placeholder="Survey title" style={{ ...inp, fontWeight: 700, fontSize: 16 }} />
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
              <button onClick={createSurvey} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", padding: "12px 0" }}>Create Survey</button>
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
                </div>
                {(isAdmin || survey.showResults) && <button onClick={() => setViewingResults(survey.id)} style={pillInactive}>Results</button>}
              </div>
              {!isAdmin && !allAnswered && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {(survey.questions || []).map((q, qi) => (
                    <div key={q.id}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 6, lineHeight: 1.35 }}>{qi + 1}. {q.text}</div>
                      {renderAnswerInput(survey, q)}
                    </div>
                  ))}
                </div>
              )}
              {!isAdmin && allAnswered && !survey.showResults && <div style={{ fontSize: 14, color: GREEN, fontWeight: 600 }}>All questions answered. Waiting for results.</div>}
              {isAdmin && (
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button onClick={() => toggleResults(survey.id)} style={survey.showResults ? pillActive : pillInactive}>{survey.showResults ? "Hide from Students" : "Show to Students"}</button>
                  <button onClick={() => closeSurvey(survey.id)} style={pillInactive}>Close</button>
                  <button onClick={() => { if (window.confirm("Delete?")) deleteSurvey(survey.id); }} style={{ ...pill, background: "#fef2f2", color: RED }}>Delete</button>
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
                    <button onClick={() => setViewingResults(survey.id)} style={{ ...pillInactive, fontSize: 11 }}>Results</button>
                    {isAdmin && <button onClick={() => { if (window.confirm("Delete?")) deleteSurvey(survey.id); }} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11 }}>Delete</button>}
                  </div>
                </div>
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
              <div style={{ width: 60 }} />
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
  const isGuest = userName === GUEST_NAME;
  const student = data.students.find(s => s.name === userName);
  const sid = student?.id;
  const assignments = (data.assignments || []).filter(a => a.id !== "participation");
  const bios = data.bios || {};
  const checks = data.todoChecks || {};
  const customTodos = data.customTodos || [];
  const weekKey = getWeekMonday();

  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoTarget, setNewTodoTarget] = useState("all");
  const [newTodoSection, setNewTodoSection] = useState("assignments");
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const getCheck = (studentId, key) => {
    const sc = checks[studentId];
    if (!sc) return false;
    return !!sc[key];
  };
  const getWeeklyCheck = (studentId, itemId) => {
    const sc = checks[studentId];
    if (!sc || !sc.weekly) return false;
    const wk = sc.weekly[weekKey];
    if (!wk) return false;
    return !!wk[itemId];
  };
  const hasPhoto = (studentId) => !!(bios[studentId]?.photo);
  const hasBio = (studentId) => {
    const b = bios[studentId];
    if (!b) return false;
    return !!(b.about || b.major || b.year || b.hometown || b.favTeam || b.motto || b.funFact);
  };

  const toggleCheck = async (key) => {
    if (!sid) return;
    const sc = { ...(checks[sid] || {}) };
    sc[key] = !sc[key];
    const updated = { ...data, todoChecks: { ...checks, [sid]: sc } };
    await saveData(updated); setData(updated);
  };
  const toggleWeekly = async (itemId) => {
    if (!sid) return;
    const sc = { ...(checks[sid] || {}) };
    const weekly = { ...(sc.weekly || {}) };
    const wk = { ...(weekly[weekKey] || {}) };
    wk[itemId] = !wk[itemId];
    weekly[weekKey] = wk;
    sc.weekly = weekly;
    const updated = { ...data, todoChecks: { ...checks, [sid]: sc } };
    await saveData(updated); setData(updated);
  };

  // Custom todos
  const addCustomTodo = async () => {
    if (!newTodoText.trim()) return;
    const todo = { id: genId(), text: newTodoText.trim(), target: newTodoTarget, section: newTodoSection, ts: Date.now() };
    const updated = { ...data, customTodos: [...customTodos, todo] };
    await saveData(updated); setData(updated);
    setNewTodoText(""); showMsg("To-do added");
  };
  const removeCustomTodo = async (id) => {
    const updated = { ...data, customTodos: customTodos.filter(t => t.id !== id) };
    await saveData(updated); setData(updated); showMsg("Removed");
  };

  const getStudentCustomTodos = (studentId, section) => {
    return customTodos.filter(t => t.section === section && (t.target === "all" || t.target === studentId));
  };

  if (isGuest) {
    return <div style={{ padding: 40, textAlign: "center", fontFamily: F }}><div style={{ ...sectionLabel, marginBottom: 8 }}>To-Do</div><div style={{ fontSize: 14, color: TEXT_SECONDARY }}>Sign in as a student to view your to-do list.</div></div>;
  }

  if (isAdmin) {
    const sorted = [...data.students].filter(s => s.name !== ADMIN_NAME).sort(lastSortObj);
    return (
      <div style={{ padding: "20px 16px 40px", fontFamily: F }}>
        <Toast message={msg} />
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ ...sectionLabel, marginBottom: 12 }}>To-Do Overview</div>

          {/* Add custom to-do */}
          <div style={{ ...crd, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 8 }}>Add To-Do</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <input value={newTodoText} onChange={e => setNewTodoText(e.target.value)} placeholder="To-do item..." style={inp} />
              <div style={{ display: "flex", gap: 6 }}>
                <select value={newTodoTarget} onChange={e => setNewTodoTarget(e.target.value)} style={{ ...sel, flex: 1 }}>
                  <option value="all">All students</option>
                  {sorted.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={newTodoSection} onChange={e => setNewTodoSection(e.target.value)} style={{ ...sel }}>
                  <option value="setup">Get Started</option>
                  <option value="assignments">Assignments</option>
                  <option value="weekly">Every Week</option>
                </select>
                <button onClick={addCustomTodo} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", padding: "10px 16px" }}>Add</button>
              </div>
            </div>
            {customTodos.length > 0 && (
              <div style={{ marginTop: 10, borderTop: "1px solid #f3f4f6", paddingTop: 8 }}>
                <div style={{ ...sectionLabel, marginBottom: 6 }}>Active Custom To-Dos</div>
                {customTodos.map(t => {
                  const targetName = t.target === "all" ? "All" : data.students.find(s => s.id === t.target)?.name?.split(" ")[0] || "?";
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", fontSize: 12 }}>
                      <span style={{ flex: 1, color: "#374151" }}>{t.text}</span>
                      <span style={{ color: TEXT_MUTED, fontSize: 10 }}>{targetName} / {t.section}</span>
                      <button onClick={() => removeCustomTodo(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: RED, fontSize: 11, fontWeight: 600 }}>x</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ ...crd, overflow: "auto" }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", fontFamily: F, minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: TEXT_MUTED, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", position: "sticky", left: 0, background: "#fff", zIndex: 2 }}>Student</th>
                  <th style={{ textAlign: "center", padding: "10px 6px", color: TEXT_MUTED, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>Photo</th>
                  <th style={{ textAlign: "center", padding: "10px 6px", color: TEXT_MUTED, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>Bio</th>
                  {assignments.map(a => (
                    <th key={a.id} style={{ textAlign: "center", padding: "10px 6px", color: TEXT_MUTED, fontWeight: 600, fontSize: 11, textTransform: "uppercase", maxWidth: 80 }}>{a.name.split(" ").slice(0, 2).join(" ")}</th>
                  ))}
                  {WEEKLY_ITEMS.map(w => (
                    <th key={w.id} style={{ textAlign: "center", padding: "10px 6px", color: PURPLE, fontWeight: 600, fontSize: 11, textTransform: "uppercase", maxWidth: 70 }}>{w.label.split(" ").slice(0, 2).join(" ")}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(s => {
                  const photo = hasPhoto(s.id);
                  const bio = hasBio(s.id);
                  return (
                    <tr key={s.id} style={{ borderBottom: "1px solid #f9fafb" }}>
                      <td style={{ padding: "8px 12px", fontWeight: 600, color: TEXT_PRIMARY, fontSize: 13, whiteSpace: "nowrap", position: "sticky", left: 0, background: "#fff", zIndex: 1 }}>{s.name}</td>
                      <td style={{ textAlign: "center", padding: "6px" }}>{photo ? <span style={{ color: GREEN, fontSize: 16 }}>&#10003;</span> : <span style={{ color: "#e4e4e7", fontSize: 14 }}>-</span>}</td>
                      <td style={{ textAlign: "center", padding: "6px" }}>{bio ? <span style={{ color: GREEN, fontSize: 16 }}>&#10003;</span> : <span style={{ color: "#e4e4e7", fontSize: 14 }}>-</span>}</td>
                      {assignments.map(a => {
                        const done = getCheck(s.id, "assign-" + a.id);
                        return <td key={a.id} style={{ textAlign: "center", padding: "6px" }}>{done ? <span style={{ color: GREEN, fontSize: 16 }}>&#10003;</span> : <span style={{ color: "#e4e4e7", fontSize: 14 }}>-</span>}</td>;
                      })}
                      {WEEKLY_ITEMS.map(w => {
                        const done = getWeeklyCheck(s.id, w.id);
                        return <td key={w.id} style={{ textAlign: "center", padding: "6px" }}>{done ? <span style={{ color: PURPLE, fontSize: 16 }}>&#10003;</span> : <span style={{ color: "#e4e4e7", fontSize: 14 }}>-</span>}</td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Student view
  const Checkbox = ({ checked, onChange, accent }) => (
    <button onClick={onChange} style={{
      width: 22, height: 22, borderRadius: 6, border: "2px solid " + (checked ? (accent || GREEN) : "#d4d4d8"),
      background: checked ? (accent || GREEN) : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s", padding: 0,
    }}>
      {checked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
    </button>
  );

  const setupCustom = getStudentCustomTodos(sid, "setup");
  const assignCustom = getStudentCustomTodos(sid, "assignments");
  const weeklyCustom = getStudentCustomTodos(sid, "weekly");

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 12 }}>To-Do</div>

        {/* Setup */}
        <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 10 }}>Get Started</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Checkbox checked={hasPhoto(sid)} onChange={() => {}} />
              <span style={{ fontSize: 14, color: hasPhoto(sid) ? TEXT_MUTED : TEXT_PRIMARY, textDecoration: hasPhoto(sid) ? "line-through" : "none" }}>Add your picture</span>
              {hasPhoto(sid) && <span style={{ fontSize: 11, color: GREEN, fontWeight: 600, marginLeft: "auto" }}>Done</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Checkbox checked={hasBio(sid)} onChange={() => {}} />
              <span style={{ fontSize: 14, color: hasBio(sid) ? TEXT_MUTED : TEXT_PRIMARY, textDecoration: hasBio(sid) ? "line-through" : "none" }}>Update your bio</span>
              {hasBio(sid) && <span style={{ fontSize: 11, color: GREEN, fontWeight: 600, marginLeft: "auto" }}>Done</span>}
            </div>
            {setupCustom.map(t => {
              const done = getCheck(sid, "custom-" + t.id);
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Checkbox checked={done} onChange={() => toggleCheck("custom-" + t.id)} />
                  <span style={{ fontSize: 14, color: done ? TEXT_MUTED : TEXT_PRIMARY, textDecoration: done ? "line-through" : "none" }}>{t.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assignments */}
        <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 10 }}>Assignments</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {assignments.map(a => {
              const done = getCheck(sid, "assign-" + a.id);
              return (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Checkbox checked={done} onChange={() => toggleCheck("assign-" + a.id)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, color: done ? TEXT_MUTED : TEXT_PRIMARY, textDecoration: done ? "line-through" : "none" }}>{a.name}</span>
                    {a.due && <span style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: 6 }}>Due {a.due}</span>}
                  </div>
                  {a.link && (
                    <a href={a.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ flexShrink: 0, display: "flex", alignItems: "center", padding: "4px 8px", borderRadius: 6, background: "#f4f4f5", color: TEXT_SECONDARY, textDecoration: "none" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                  )}
                </div>
              );
            })}
            {assignCustom.map(t => {
              const done = getCheck(sid, "custom-" + t.id);
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Checkbox checked={done} onChange={() => toggleCheck("custom-" + t.id)} />
                  <span style={{ fontSize: 14, color: done ? TEXT_MUTED : TEXT_PRIMARY, textDecoration: done ? "line-through" : "none" }}>{t.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly */}
        <div style={{ ...crd, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>Every Week</div>
            <span style={{ fontSize: 11, color: PURPLE, fontWeight: 600 }}>Resets Monday</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {WEEKLY_ITEMS.map(w => {
              const done = getWeeklyCheck(sid, w.id);
              return (
                <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Checkbox checked={done} onChange={() => toggleWeekly(w.id)} accent={PURPLE} />
                  <span style={{ fontSize: 14, color: done ? TEXT_MUTED : TEXT_PRIMARY, textDecoration: done ? "line-through" : "none" }}>{w.label}</span>
                </div>
              );
            })}
            {weeklyCustom.map(t => {
              const done = getWeeklyCheck(sid, "custom-" + t.id);
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Checkbox checked={done} onChange={() => toggleWeekly("custom-" + t.id)} accent={PURPLE} />
                  <span style={{ fontSize: 14, color: done ? TEXT_MUTED : TEXT_PRIMARY, textDecoration: done ? "line-through" : "none" }}>{t.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── APP ─── */
export default function Comm118() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home");
  const [userName, setUserName] = useState(null);

  const isAdmin = userName === ADMIN_NAME;
  const isGuest = userName === GUEST_NAME;
  const displayName = isGuest ? "Guest" : userName;
  const [studentView, setStudentView] = useState(false);
  const effectiveAdmin = isAdmin && !studentView;

  const refresh = useCallback(async () => { try { const d = await loadData(); if (d) setData(d); } catch(e) { console.error(e); } }, []);
  useEffect(() => {
    (async () => {
      try {
        let d = await loadData();
        if (!d) {
          // Try loading one more time before giving up
          await new Promise(r => setTimeout(r, 2000));
          d = await loadData();
        }
        if (!d) {
          // Check if this is truly first-ever load by trying a second method
          console.error("loadData returned null. Refusing to create fresh data to protect existing data. If this is truly a first install, clear storage manually.");
          setLoading(false);
          return;
        }
        // One-time fix: if Comm118 data got overwritten with Comm4 students, rebuild roster
        // Migration: force rebuild roster if corrupted (V2 - bypasses write-lock)
        if (d && !d._comm118RosterFixV2) {
          const comm118Names = new Set(ALL_STUDENTS);
          const matchCount = d.students.filter(s => comm118Names.has(s.name)).length;
          // If less than 70% of students match, roster is corrupted
          if (matchCount < ALL_STUDENTS.length * 0.7) {
            console.log("Comm118 roster corrupted. Matched " + matchCount + "/" + ALL_STUDENTS.length + ". Rebuilding.");
            const shuffled = shuffle(ALL_STUDENTS);
            const teams = MISMATCHED_NAMES.slice(0, 7).map((name, i) => ({ id: genId(), name, colorIdx: i }));
            const students = shuffled.map((name, i) => ({ id: genId(), name, teamId: teams[i % 7].id }));
            const pins = {};
            students.forEach(s => {
              if (s.name === ADMIN_NAME) { pins[s.id] = "118711"; }
              else { pins[s.id] = String(Math.floor(100000 + Math.random() * 900000)); }
            });
            d.teams = teams;
            d.students = students;
            d.pins = pins;
            d.log = [];
            d.bios = {};
            d.grades = {};
            d.participation = {};
            d.schedule = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
            d.assignments = JSON.parse(JSON.stringify(DEFAULT_ASSIGNMENTS));
          }
          d._comm118RosterFixV1 = true;
          d._comm118RosterFixV2 = true;
          // Force readings migration to re-run since schedule was reset
          delete d._readingsMigV2;
          // Bypass write-lock: write directly to storage
          await window.storage.set(STORAGE_KEY, JSON.stringify(d), true);
        }
        // Also force readings re-run if roster fix already ran but readings are missing
        if (d && d._comm118RosterFixV2 && !d._readingsReattachV1) {
          delete d._readingsMigV2;
          delete d._scheduleMigV2;
          delete d._emailMigV1;
          d._readingsReattachV1 = true;
          await window.storage.set(STORAGE_KEY, JSON.stringify(d), true);
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
        if (d && !d.customTodos) { d.customTodos = []; await saveData(d); }
        // Migration: add interview assignment and fix weights if needed
        if (d && d.assignments && !d.assignments.find(a => a.id === "interview")) {
          d.assignments = [
            { id: "interview", name: "Interview Assignment", weight: 5, due: "Apr 17", link: "", notes: "Interview someone who works in sports in a job you're interested in" },
            ...d.assignments.map(a => {
              if (a.id === "woc_proposal") return { ...a, due: "Apr 24" };
              if (a.id === "woc_submission") return { ...a, due: "May 8" };
              if (a.id === "leadership_guide") return { ...a, weight: 15 };
              return a;
            })
          ];
          await saveData(d);
        }
        // Migration: patch schedule with activities and assignment changes
        if (d && d.schedule && !d._scheduleMigV2) {
          const patchMap = {
            "Mar 30": { activities: ["Practice This or That"] },
            "Apr 1": { activities: ["Game", "Practice Fishbowl"] },
            "Apr 8": { activities: ["Game", "Fishbowl"] },
            "Apr 13": { activities: ["This or That", "Fishbowl", "Headlines"] },
            "Apr 15": { activities: ["Game"] },
            "Apr 17": { assignment: "Interview Assignment due" },
            "Apr 20": { activities: ["This or That", "Fishbowl", "Headlines"], assignment: "" },
            "Apr 22": { activities: ["Game"] },
            "Apr 24": { assignment: "Intersections Proposal due" },
            "Apr 27": { activities: ["This or That", "Fishbowl", "Headlines"] },
            "Apr 29": { activities: ["Game"] },
            "May 4": { activities: ["This or That", "Fishbowl", "Headlines"] },
            "May 6": { activities: ["Game"], assignment: "", notes: "" },
            "May 8": { assignment: "Intersections Submission due" },
            "May 11": { activities: ["This or That", "Fishbowl", "Headlines"] },
            "May 13": { activities: ["Game"] },
            "May 18": { activities: ["This or That", "Fishbowl", "Headlines"] },
            "May 20": { activities: ["Game"] },
            "May 27": { activities: ["Game"] },
          };
          d.schedule = d.schedule.map(w => ({
            ...w,
            dates: w.dates.map(dt => {
              const patch = patchMap[dt.date];
              if (patch) return { ...dt, ...patch };
              return dt;
            })
          }));
          d._scheduleMigV2 = true;
          await saveData(d);
        }
        // Migration: fix "Quizzes" to "Weekly Game" in participation assignment notes
        if (d && d.assignments) {
          const partA = d.assignments.find(a => a.id === "participation");
          if (partA && partA.notes && partA.notes.includes("Quizzes")) {
            partA.notes = "Weekly Game, This or That, PTI, Rotating Fishbowl";
            await saveData(d);
          }
        }
        // Migration: generate PINs for all students
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
        // Migration: add readings repository and attach to schedule
        if (d && !d._readingsMigV2) {
          const R = [
            // Week 1: Required
            { id: "r_w1_klosterman", title: "Are You Not Entertained?", url: "https://grantland.com/features/chuck-klosterman-gregg-popovich-entertainment-sports/", category: "Article", readingType: "required", notes: "Klosterman on Popovich, entertainment vs winning" },
            { id: "r_w1_ncaa_props", title: "NCAA Urges Gambling Commissions to Eliminate Prop Bets", url: "https://www.ncaa.org/news/2026/1/15/media-center-ncaa-urges-gambling-commissions-to-eliminate-prop-bets.aspx", category: "Article", readingType: "required", notes: "" },
            // Week 1: Highly Recommended
            { id: "r_w1_coppins", title: "My Year as a Degenerate Sports Gambler", url: "https://www.theatlantic.com/magazine/2026/04/online-sports-betting-app-addiction/686061/", category: "Article", readingType: "additional", notes: "McKay Coppins, The Atlantic 2026" },
            // Week 1: Recommended - Purpose
            { id: "r_w1_truth", title: "Sports Has an Agreed-Upon Truth", url: "https://www.si.com/sports-illustrated/2021/01/07/sports-shared-truth-us-capitol-riot-donald-trump", category: "Article", readingType: "recommended", notes: "Post-Jan 6, sports as shared reality" },
            { id: "r_w1_olympics", title: "Why Are the Olympics Still Happening?", url: "https://www.nytimes.com/2021/06/21/sports/olympics/tokyo-olympics-happening-why.html", category: "Article", readingType: "recommended", notes: "" },
            { id: "r_w1_jenkins", title: "Athlete Activists Control Their Strength", url: "https://www.washingtonpost.com/sports/2021/01/08/athlete-activisits-capitol-trump-mob/", category: "Article", readingType: "recommended", notes: "Sally Jenkins, WaPo, Jan 2021" },
            { id: "r_w1_busch", title: "Cardinals-Cubs: Michael Busch Nearly Hits for the Cycle", url: "https://www.nytimes.com/athletic/6668845/2025/09/27/cardinals-cubs-michael-busch-cycle/", category: "Article", readingType: "recommended", notes: "Marmol: I'm not here for anybody's amusement" },
            { id: "r_w1_escape", title: "Sports Are Usually a Great Escape. Not This Time.", url: "https://nymag.com/intelligencer/2020/03/coronavirus-means-that-sports-arent-a-great-escape-anymore.html", category: "Article", readingType: "recommended", notes: "COVID and the absence of sports" },
            { id: "r_w1_triples", title: "MLB Opening Day Triples", url: "https://www.wsj.com/sports/baseball/mlb-baseball-opening-day-triples-a5c30f00", category: "Article", readingType: "recommended", notes: "WSJ 2026" },
            // Week 1: Recommended - Gambling
            { id: "r_w1_dfs", title: "How the Daily Fantasy Sports Industry Turns Fans into Suckers", url: "https://www.nytimes.com/2016/01/06/magazine/how-the-daily-fantasy-sports-industry-turns-fans-into-suckers.html", category: "Article", readingType: "recommended", notes: "" },
            { id: "r_w1_mistake", title: "Legalizing Sports Gambling Was a Huge Mistake", url: "https://www.theatlantic.com/ideas/archive/2024/09/legal-sports-gambling-was-mistake/679925/", category: "Article", readingType: "recommended", notes: "The Atlantic 2024, research on financial harm" },
            { id: "r_w1_wiki_bet", title: "Sports Betting (Wikipedia)", url: "https://en.wikipedia.org/wiki/Sports_betting", category: "Reference", readingType: "recommended", notes: "" },
            { id: "r_w1_ft_gamble", title: "Sports Gambling (Financial Times)", url: "https://www.ft.com/content/a8fbf1ac-7fc7-4015-b2ad-929df645e79b", category: "Article", readingType: "recommended", notes: "" },
            // Week 2: Book chapters (no URL)
            { id: "r_w2_ch1", title: "Communication and Sport, Chapter 1", url: "", category: "Book Chapter", readingType: "required", notes: "Billings, Butterworth, and Lewis" },
            { id: "r_w2_ch2", title: "Communication and Sport, Chapter 2", url: "", category: "Book Chapter", readingType: "required", notes: "Billings, Butterworth, and Lewis" },
            // Week 3: Required
            { id: "r_w3_ch8", title: "Communication and Sport, Chapter 8: Sport and Mythology", url: "", category: "Book Chapter", readingType: "required", notes: "Billings, Butterworth, and Lewis" },
            { id: "r_w3_ch13", title: "Communication and Sport, Chapter 13: Commercialism in Sport", url: "", category: "Book Chapter", readingType: "required", notes: "Billings, Butterworth, and Lewis" },
            { id: "r_w3_dunne", title: "Olivia 'Livvy' Dunne, LSU Gymnastics, NCAA, NIL", url: "https://www.espn.com/college-sports/story/_/id/43938472/olivia-livvy-dunne-lsu-gymnastics-ncaa-nil", category: "Article", readingType: "required", notes: "ESPN" },
            // Week 4: Fishbowl readings
            { id: "r_w4_ch5", title: "Communication and Sport, Chapter 5: Legacy Media Interactions", url: "", category: "Book Chapter", readingType: "fishbowl", notes: "Fishbowl reading" },
            { id: "r_w4_ch6", title: "Communication and Sport, Chapter 6: Social and User-Generated Media Interactions", url: "", category: "Book Chapter", readingType: "fishbowl", notes: "Fishbowl reading" },
            { id: "r_w4_ch7", title: "Communication and Sport, Chapter 7: Sport and Mythology", url: "", category: "Book Chapter", readingType: "fishbowl", notes: "Fishbowl reading" },
            // Week 4: To be sorted
            { id: "r_w4_cfb_sba", title: "College Football Schedule and the Sports Broadcasting Act", url: "https://www.nytimes.com/athletic/6360298/2025/05/16/college-football-schedule-sports-broadcasting-act/", category: "Article", readingType: "recommended", notes: "The Athletic 2025" },
            { id: "r_w4_pitaro", title: "Jimmy Pitaro, ESPN Streaming App Launch", url: "https://www.nytimes.com/athletic/6560777/2025/08/19/jimmy-pitaro-espn-streaming-app-launch-netflix/", category: "Article", readingType: "recommended", notes: "The Athletic 2025" },
            { id: "r_w4_streaming", title: "Sports TV: Netflix, Amazon, ESPN", url: "https://nymag.com/intelligencer/article/sports-tv-netflix-amazon-espn.html", category: "Article", readingType: "recommended", notes: "NY Mag" },
            { id: "r_w4_netflix_mlb", title: "Yankees-Giants MLB Opening Night on Netflix/YouTube/NBC", url: "https://www.nytimes.com/athletic/7144726/2026/03/25/yankees-giants-mlb-opening-night-netflix-youtube-nbc/", category: "Article", readingType: "recommended", notes: "The Athletic 2026" },
            { id: "r_w4_cfb_cable", title: "CFB Coverage Has Turned Into Cable News", url: "https://awfulannouncing.com/college-football/cfb-coverage-has-turned-into-cable-news.html", category: "Article", readingType: "recommended", notes: "Awful Announcing" },
            { id: "r_w4_helmets", title: "How TV and Roy Rogers Helped Put Logos on NFL Helmets", url: "https://www.toddradom.com/blog/fl-helmet-logos-licensing-giants-rams-eagles-cowboys", category: "Article", readingType: "recommended", notes: "Todd Radom" },
            { id: "r_w4_fox_theme", title: "Batman on Steroids: How the NFL on Fox Theme Song Was Born", url: "https://deadspin.com/batman-on-steroids-how-the-nfl-on-fox-theme-song-was-b-1481367234/", category: "Article", readingType: "recommended", notes: "Deadspin" },
            { id: "r_w4_athletes_great", title: "How Athletes Get Great", url: "https://www.outsideonline.com/culture/books-media/how-athletes-get-great/", category: "Article", readingType: "recommended", notes: "Outside" },
            { id: "r_w4_espn_future", title: "ESPN's Uncertain Future Is Already Here", url: "https://deadspin.com/espns-uncertain-future-is-already-here-1753901086/", category: "Article", readingType: "recommended", notes: "Deadspin" },
            { id: "r_w4_sba_wiki", title: "Sports Broadcasting Act of 1961", url: "https://en.wikipedia.org/wiki/Sports_Broadcasting_Act_of_1961", category: "Reference", readingType: "recommended", notes: "Wikipedia" },
            { id: "r_w4_cuban", title: "Mark Cuban: Hogs Get Slaughtered", url: "https://sports.yahoo.com/is-mark-cubans-hogs-get-slaughtered-comment-about-nfl-becoming-true-215057982.html", category: "Article", readingType: "recommended", notes: "Yahoo Sports" },
            { id: "r_w4_pwc", title: "PwC Sports Outlook North America", url: "https://www.pwc.com/us/en/industries/tmt/library/sports-outlook-north-america.html", category: "Reference", readingType: "recommended", notes: "" },
            { id: "r_w4_nielsen", title: "Nielsen Tops 2024 Sports", url: "https://www.nielsen.com/insights/2024/tops-2024-sports/", category: "Reference", readingType: "recommended", notes: "" },
            { id: "r_w4_rating", title: "What is Rating/Share", url: "https://www.frankwbaker.com/mlc/math-media-what-is-rating-share/", category: "Reference", readingType: "recommended", notes: "Frank W. Baker" },
            { id: "r_w4_immersive", title: "Game-Changing Generational Trends: Era of Immersive Sports", url: "https://www.prnewswire.com/news-releases/game-changing-generational-trends-and-shifts-in-tech-lead-to-the-era-of-immersive-sports-301863219.html", category: "Article", readingType: "recommended", notes: "PR Newswire" },
            { id: "r_w4_videogames", title: "Video Games, NFL, Gamers, Gen Z", url: "https://www.nytimes.com/2022/01/12/sports/video-games-nfl-gamers-gen-z.html", category: "Article", readingType: "recommended", notes: "NYT 2022" },
            // Week 5: Required Monday Fishbowl
            { id: "r_w5_softball", title: "Is Softball Sexist?", url: "https://www.nytimes.com/2014/06/07/opinion/is-softball-sexist.html", category: "Article", readingType: "fishbowl", notes: "Fishbowl reading, Monday" },
            { id: "r_w5_winter", title: "Why Some Winter Olympic Sports Are Faster, Higher, Stronger", url: "https://deadspin.com/why-some-winter-olympic-sports-are-faster-higher-str-1823153425/", category: "Article", readingType: "fishbowl", notes: "Fishbowl reading, Monday, gender angle" },
            { id: "r_w5_ugly", title: "When the Beautiful Game Turns Ugly", url: "https://www.espn.com/espn/feature/story/_/id/9338962/when-beautiful-game-turns-ugly", category: "Article", readingType: "fishbowl", notes: "Fishbowl reading, Monday, racism in Italian soccer" },
            // Week 5: Required Wednesday
            { id: "r_w5_whiteman", title: "The White Man in That Photo", url: "https://www.filmsforaction.org/articles/the-white-man-in-that-photo/", category: "Article", readingType: "required", notes: "Very important" },
            { id: "r_w5_ch11", title: "Communication and Sport, Chapter 11: Sports and Politics", url: "", category: "Book Chapter", readingType: "required", notes: "Billings, Butterworth, and Lewis" },
            // Week 5: To be sorted
            { id: "r_w5_gu", title: "Eileen Gu: Winter Olympics, China Controversy", url: "https://www.nytimes.com/athletic/7049798/2026/02/17/eileen-gu-winter-olympics-freestyle-skiing-china-controversy/", category: "Article", readingType: "recommended", notes: "The Athletic 2026" },
            { id: "r_w5_handshake", title: "Sabalenka's Opponent Refuses to Shake Her Hand", url: "https://www.sportbible.com/tennis/aryna-sabalenka-elina-svitolina-handshake-australian-open-835064-20260129", category: "Article", readingType: "recommended", notes: "Svitolina/Ukraine, SportBible 2026" },
            { id: "r_w5_trump_tennis", title: "Australian Open Star Refuses to Answer Trump Question", url: "https://www.sportbible.com/tennis/australian-open-donald-trump-question-learner-tien-890506-20260127", category: "Article", readingType: "recommended", notes: "Learner Tien, SportBible 2026" },
            { id: "r_w5_skijump", title: "Ski Jump Penis Enhancement and WADA", url: "https://www.nytimes.com/athletic/7024688/2026/02/05/ski-jump-penis-enhancement-wada/", category: "Article", readingType: "recommended", notes: "The Athletic 2026" },
            { id: "r_w5_norway", title: "Norway Women's Beach Handball Team Fined for Not Wearing Bikini Bottoms", url: "https://www.npr.org/2021/07/21/1018768633/a-womens-beach-handball-team-is-fined-for-not-wanting-to-wear-bikini-bottoms", category: "Article", readingType: "recommended", notes: "NPR 2021" },
            { id: "r_w5_unitards", title: "German Gymnasts Wore Unitards at Tokyo Olympics", url: "https://www.bbc.com/sport/olympics/articles/cdj7dgvlj0no", category: "Article", readingType: "recommended", notes: "BBC" },
            { id: "r_w5_semenya1", title: "Caster Semenya: Sex Eligibility Battle", url: "https://www.nbcnews.com/sports/track-field/caster-semenya-sex-eligibility-battle-confounded-sports-16-years-still-rcna218122", category: "Article", readingType: "recommended", notes: "NBC News" },
            { id: "r_w5_semenya2", title: "Caster Semenya Swiss Court Testosterone Win", url: "https://frontofficesports.com/caster-semenya-swiss-court-testosterone-win/", category: "Article", readingType: "recommended", notes: "Front Office Sports" },
            { id: "r_w5_throw", title: "Why Do Girls Throw Like a Girl?", url: "https://www.popsci.com/science/article/2012-09/fyi-do-men-and-women-throw-ball-differently/", category: "Article", readingType: "recommended", notes: "Popular Science" },
            { id: "r_w5_coed", title: "Why Co-Ed Sports Leagues Are Never Really Co-Ed", url: "https://deadspin.com/why-co-ed-sports-leagues-are-never-really-co-ed-1827699592/", category: "Article", readingType: "recommended", notes: "Deadspin" },
            { id: "r_w5_women_mlb", title: "Women in MLB Media: The Circus", url: "https://www.si.com/mlb/2016/03/23/women-mlb-baseball-players-media-circus-deitsch", category: "Article", readingType: "recommended", notes: "SI" },
            { id: "r_w5_kaep", title: "Kaepernick's Anthem Protest", url: "https://www.nytimes.com/2016/08/31/sports/football/colin-kaepernicks-anthem-protest-underlines-union-of-sports-and-patriotism.html", category: "Article", readingType: "recommended", notes: "NYT" },
            { id: "r_w5_military", title: "The Military and Sports Connection", url: "https://www.wbur.org/onlyagame/2018/07/20/military-sports-astore-francona", category: "Article", readingType: "recommended", notes: "WBUR, pairs with Kaepernick" },
            { id: "r_w5_fans", title: "What Does Success Mean for Long-Suffering Sports Fans?", url: "https://www.scientificamerican.com/blog/mind-guest-blog/what-does-success-mean-for-long-suffering-sports-fans-an-identity-crisis-say-researchers/", category: "Article", readingType: "recommended", notes: "Scientific American" },
            { id: "r_w5_cuban_anthem", title: "Mark Cuban, National Anthem, Mavericks", url: "https://www.sbnation.com/2021/2/10/22276282/mark-cuban-national-anthem-mavericks-sports", category: "Article", readingType: "recommended", notes: "SB Nation 2021" },
            { id: "r_w5_nba_anthem", title: "NBA Orders National Anthem Be Played", url: "https://www.nbcnews.com/think/opinion/nba-orders-national-anthem-be-played-games-here-s-why-ncna1257563", category: "Article", readingType: "recommended", notes: "NBC News 2021" },
            { id: "r_w5_stick", title: "What Does 'Stick to Sports' Even Mean Anymore?", url: "https://thecomeback.com/general/what-stick-sports-even-mean-anymore.html", category: "Article", readingType: "recommended", notes: "The Comeback" },
          ];
          // Merge with existing readings
          const existingIds = new Set((d.readings || []).map(r => r.id));
          const newReadings = R.filter(r => !existingIds.has(r.id));
          d.readings = [...(d.readings || []), ...newReadings];
          // Attach readings to schedule dates
          const attachMap = {
            "Apr 1": [ // Week 1 Wed
              { readingId: "r_w1_klosterman", type: "required" },
              { readingId: "r_w1_ncaa_props", type: "required" },
              { readingId: "r_w1_coppins", type: "additional" },
              { readingId: "r_w1_truth", type: "recommended" },
              { readingId: "r_w1_olympics", type: "recommended" },
              { readingId: "r_w1_jenkins", type: "recommended" },
              { readingId: "r_w1_busch", type: "recommended" },
              { readingId: "r_w1_escape", type: "recommended" },
              { readingId: "r_w1_triples", type: "recommended" },
              { readingId: "r_w1_dfs", type: "recommended" },
              { readingId: "r_w1_mistake", type: "recommended" },
              { readingId: "r_w1_wiki_bet", type: "recommended" },
              { readingId: "r_w1_ft_gamble", type: "recommended" },
            ],
            "Apr 8": [ // Week 2 Wed
              { readingId: "r_w2_ch1", type: "required" },
              { readingId: "r_w2_ch2", type: "required" },
            ],
            "Apr 15": [ // Week 3 Wed
              { readingId: "r_w3_ch8", type: "required" },
              { readingId: "r_w3_ch13", type: "required" },
              { readingId: "r_w3_dunne", type: "required" },
            ],
            "Apr 20": [ // Week 4 Mon (Fishbowl)
              { readingId: "r_w4_ch5", type: "fishbowl" },
              { readingId: "r_w4_ch6", type: "fishbowl" },
              { readingId: "r_w4_ch7", type: "fishbowl" },
            ],
            "Apr 22": [ // Week 4 Wed (recommended media articles)
              { readingId: "r_w4_cfb_sba", type: "recommended" },
              { readingId: "r_w4_pitaro", type: "recommended" },
              { readingId: "r_w4_streaming", type: "recommended" },
              { readingId: "r_w4_netflix_mlb", type: "recommended" },
              { readingId: "r_w4_cfb_cable", type: "recommended" },
              { readingId: "r_w4_helmets", type: "recommended" },
              { readingId: "r_w4_fox_theme", type: "recommended" },
              { readingId: "r_w4_athletes_great", type: "recommended" },
              { readingId: "r_w4_espn_future", type: "recommended" },
              { readingId: "r_w4_sba_wiki", type: "recommended" },
              { readingId: "r_w4_cuban", type: "recommended" },
              { readingId: "r_w4_pwc", type: "recommended" },
              { readingId: "r_w4_nielsen", type: "recommended" },
              { readingId: "r_w4_rating", type: "recommended" },
              { readingId: "r_w4_immersive", type: "recommended" },
              { readingId: "r_w4_videogames", type: "recommended" },
            ],
            "Apr 27": [ // Week 5 Mon (Fishbowl - gender/race)
              { readingId: "r_w5_softball", type: "fishbowl" },
              { readingId: "r_w5_winter", type: "fishbowl" },
              { readingId: "r_w5_ugly", type: "fishbowl" },
              { readingId: "r_w5_norway", type: "recommended" },
              { readingId: "r_w5_unitards", type: "recommended" },
              { readingId: "r_w5_semenya1", type: "recommended" },
              { readingId: "r_w5_semenya2", type: "recommended" },
              { readingId: "r_w5_throw", type: "recommended" },
              { readingId: "r_w5_coed", type: "recommended" },
              { readingId: "r_w5_women_mlb", type: "recommended" },
              { readingId: "r_w5_gu", type: "recommended" },
              { readingId: "r_w5_handshake", type: "recommended" },
              { readingId: "r_w5_trump_tennis", type: "recommended" },
              { readingId: "r_w5_skijump", type: "recommended" },
              { readingId: "r_w5_fans", type: "recommended" },
            ],
            "Apr 29": [ // Week 5 Wed
              { readingId: "r_w5_whiteman", type: "required" },
              { readingId: "r_w5_ch11", type: "required" },
              { readingId: "r_w5_kaep", type: "recommended" },
              { readingId: "r_w5_military", type: "recommended" },
              { readingId: "r_w5_cuban_anthem", type: "recommended" },
              { readingId: "r_w5_nba_anthem", type: "recommended" },
              { readingId: "r_w5_stick", type: "recommended" },
            ],
          };
          d.schedule = d.schedule.map(w => ({
            ...w,
            dates: w.dates.map(dt => {
              const attach = attachMap[dt.date];
              if (attach) {
                const existing = dt.readings || [];
                const newAttach = attach.filter(a => !existing.some(e => e.readingId === a.readingId));
                return { ...dt, readings: [...existing, ...newAttach] };
              }
              return dt;
            })
          }));
          d._readingsMigV2 = true;
          await saveData(d);
        }
        // Migration: rename Web of Connections to Intersections
        if (d && !d._renameMigV1) {
          let changed = false;
          if (d.assignments) {
            d.assignments = d.assignments.map(a => {
              if (a.name && a.name.includes("Web of Connections")) {
                changed = true;
                return { ...a, name: a.name.replace(/Web of Connections/g, "Intersections") };
              }
              return a;
            });
          }
          if (d.schedule) {
            d.schedule = d.schedule.map(w => ({
              ...w, dates: w.dates.map(dt => {
                if (dt.assignment && dt.assignment.includes("Web of Connections")) {
                  changed = true;
                  return { ...dt, assignment: dt.assignment.replace(/Web of Connections/g, "Intersections") };
                }
                return dt;
              })
            }));
          }
          d._renameMigV1 = true;
          await saveData(d);
        }
        // Migration: pre-populate student emails
        if (d && !d._emailMigV1) {
          const emailMap = {
            "William Anderson": "wanderson@scu.edu",
            "Luke Baird": "lbaird@scu.edu",
            "Maxwell Bayles": "mbayles@scu.edu",
            "Alec Berger": "aberger@scu.edu",
            "Samuel Canales": "scanales@scu.edu",
            "Koen Carston": "kcarston@scu.edu",
            "Benjamin Cleary": "bcleary@scu.edu",
            "Isabelle De Buyl": "idebuyl@scu.edu",
            "Sophia DeFonzo": "sdefonzo@scu.edu",
            "Russell Filter": "rdfilter@scu.edu",
            "Amaris Franco": "agfranco@scu.edu",
            "Jace Gillmore": "jgillmore@scu.edu",
            "Charlotte Halk": "chalk@scu.edu",
            "Christian Hammond": "chammond@scu.edu",
            "Danica RaeAnne Ibus": "dibus@scu.edu",
            "Hannah Kamins": "hkamins@scu.edu",
            "Juliette Krumholz": "jkrumholz@scu.edu",
            "Payton Lambert": "plambert@scu.edu",
            "Jack Lazark": "jlazark@scu.edu",
            "Oliver Maldonado": "omaldonado@scu.edu",
            "Gianna Malnati": "gmalnati2@scu.edu",
            "Emil Nielsen": "enielsen@scu.edu",
            "Annesley Potchatek": "apotchatek@scu.edu",
            "Kalia Schempp": "kschempp@scu.edu",
            "Caroline Shah": "cshah@scu.edu",
            "Ethan Silva": "esilva@scu.edu",
            "Reagan Viens": "rviens@scu.edu",
            "Alexander Watanabe Eriksson": "awatanabeeriksson@scu.edu",
            "Anders Alexander Watanabe Eriksson": "awatanabeeriksson@scu.edu",
            "Francisco Soldavini": "jsoldavininores@scu.edu",
          };
          const bios = d.bios || {};
          d.students.forEach(s => {
            const email = emailMap[s.name];
            if (email) {
              bios[s.id] = { ...(bios[s.id] || {}), email };
            }
          });
          d.bios = bios;
          d._emailMigV1 = true;
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

  if (!userName) return <NamePicker data={data} onSelect={name => { setUserName(name); setView(name === GUEST_NAME ? "leaderboard" : "home"); }} />;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT_PRIMARY, fontFamily: F, fontSize: 15 }}>
      <Nav view={view} setView={setView} isAdmin={effectiveAdmin} isGuest={isGuest} userName={displayName} onLogout={() => setUserName(null)} studentView={studentView} setStudentView={isAdmin ? setStudentView : null} />
      {view === "schedule" && <ScheduleView data={data} setData={setData} isAdmin={effectiveAdmin} />}
      {view === "home" && !isGuest && <HomeView data={data} setData={setData} userName={userName} isAdmin={effectiveAdmin} setView={setView} />}
      {view === "todo" && !isGuest && <ToDoView data={data} setData={setData} userName={userName} isAdmin={effectiveAdmin} />}
      {view === "leaderboard" && <Leaderboard students={data.students} log={data.log} teams={data.teams} isAdmin={effectiveAdmin} userName={userName} data={data} />}
      {view === "assignments" && !isGuest && <AssignmentsView data={data} setData={setData} isAdmin={effectiveAdmin} userName={userName} setView={setView} />}
      {view === "readings" && !isGuest && <ReadingsView data={data} setData={setData} isAdmin={effectiveAdmin} />}
      {view === "classtools" && !isGuest && <ClassTools data={data} setData={setData} isAdmin={effectiveAdmin} userName={userName} />}
      {view === "grades" && isAdmin && !studentView && <Gradebook data={data} setData={setData} userName={userName} isAdmin={effectiveAdmin} />}
      {view === "pti" && isAdmin && !studentView && <PTIMode data={data} setData={setData} />}
      {view === "activities" && isAdmin && !studentView && <GameAdmin data={data} setData={setData} />}
      {view === "boards" && !isGuest && <BoardsView data={data} setData={setData} isAdmin={effectiveAdmin} userName={userName} />}
      {view === "mynotes" && !isGuest && <MyNotesView data={data} setData={setData} isAdmin={effectiveAdmin} userName={userName} />}
      {view === "survey" && !isGuest && <SurveyView data={data} setData={setData} isAdmin={effectiveAdmin} userName={userName} />}
      {view === "roster" && !isGuest && <RosterCombined data={data} setData={setData} userName={userName} isAdmin={effectiveAdmin} />}
      {view === "answer" && !isGuest && <StudentAnswerView data={data} setData={setData} userName={userName} />}
      {view === "accolades" && !isGuest && <Accolades data={data} />}
      {view === "admin" && isAdmin && !studentView && <AdminPanel data={data} setData={setData} />}
      {isGuest && view !== "leaderboard" && view !== "schedule" && <Leaderboard students={data.students} log={data.log} teams={data.teams} isAdmin={false} userName={userName} data={data} />}
      {(view === "activities" || view === "admin" || view === "pti") && !isAdmin && !isGuest && <Leaderboard students={data.students} log={data.log} teams={data.teams} isAdmin={effectiveAdmin} userName={userName} data={data} />}
    </div>
  );
}
