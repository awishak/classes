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
  "William Anderson","Luke Baird","Maxwell Bayles","Koen Carston",
  "Benjamin Cleary","Isabelle De Buyl","Sophia DeFonzo","Russell Filter",
  "Amaris Franco","Jace Gillmore","Charlotte Halk","Christian Hammond",
  "Danica RaeAnne Ibus","Andrew Ishak","Hannah Kamins","Payton Lambert",
  "Jack Lazark","Oliver Maldonado","Emil Nielsen","Caroline Shah",
  "Ethan Silva","Reagan Viens","Alexander Watanabe Eriksson",
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
// (removed ACCENT_LIGHT)
const BG = "#f8fafc";
// (removed "#fff")
const BORDER = "#f3f4f6";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6b7280";
const TEXT_MUTED = "#9ca3af";
const GREEN = "#10b981";
const RED = "#ef4444";
const AMBER = "#f59e0b";
const PURPLE = "#8b5cf6";
const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const crd = { background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", overflow: "hidden" };
const pill = { padding: "6px 12px", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F, border: "none", transition: "all 0.15s" };
const pillActive = { ...pill, background: "#111827", color: "#fff" };
const pillInactive = { ...pill, background: "#f3f4f6", color: "#4b5563" };
const bt = { padding: "8px 16px", borderRadius: 10, border: "1px solid #e5e7eb", cursor: "pointer", fontFamily: F, fontWeight: 600, fontSize: 13, transition: "all 0.15s", background: "#fff", color: "#6b7280" };
const sectionLabel = { fontSize: 10, fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: F };
const inp = { background: "#fff", border: "2px solid #e5e7eb", borderRadius: 12, padding: "10px 12px", color: TEXT_PRIMARY, fontFamily: F, fontSize: 14, fontWeight: 500, outline: "none", width: "100%", boxSizing: "border-box" };
const sel = { ...inp, width: "auto" };

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

async function loadData() { try { const r = await window.storage.get(STORAGE_KEY, true); return r ? JSON.parse(r.value) : null; } catch { return null; } }
async function saveData(data) { try { await window.storage.set(STORAGE_KEY, JSON.stringify(data), true); return true; } catch { return false; } }

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

function Toast({ message }) { if (!message) return null; return <div style={{ position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)", background: "#1e293b", color: "#fff", padding: "10px 24px", borderRadius: 12, fontWeight: 600, zIndex: 100, fontFamily: F, fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>{message}</div>; }

/* ─── NAV ─── */
function Nav({ view, setView, isAdmin, isGuest, userName, onLogout }) {
  const tabs = [
    { id: "leaderboard", label: "Leaderboard", admin: false, guest: true },
    { id: "todo", label: "To-Do", admin: false, guest: false },
    { id: "schedule", label: "Schedule", admin: false, guest: true },
    { id: "teams", label: "Teams", admin: false, guest: false },
    { id: "roster", label: "Roster", admin: false, guest: false },
    { id: "assignments", label: "Assignments", admin: false, guest: false },
    { id: "readings", label: "Readings", admin: false, guest: false },
    { id: "classtools", label: "Class Tools", admin: false, guest: false },
    { id: "pti", label: "PTI", admin: true, guest: false },
    { id: "gameadmin", label: "Game Setup", admin: true, guest: false },
    { id: "fishbowl", label: "Fishbowl", admin: true, guest: false },
    { id: "answer", label: "Answer", admin: false, guest: false },
    { id: "accolades", label: "Accolades", admin: false, guest: false },
    { id: "builder", label: "Draft", admin: true, guest: false },
    { id: "admin", label: "Admin", admin: true, guest: false },
  ];
  const visibleTabs = tabs.filter(t => {
    if (t.admin && !isAdmin) return false;
    if (isGuest && !t.guest) return false;
    return true;
  });
  return (
    <div style={{ background: "linear-gradient(to right, #1e293b, #334155)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", fontFamily: F }}>Comm and Sport</div>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
        {visibleTabs.map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={view === t.id
            ? { ...pill, background: "#fff", color: "#1e293b", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
            : { ...pill, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }
          }>{t.label}</button>
        ))}
        <a href="https://camino.instructure.com/courses/117721" target="_blank" rel="noopener noreferrer" style={{ ...pill, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
          Camino <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginLeft: 8 }}>{userName}</span>
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
  // Put admin at top
  const sorted = [ADMIN_NAME, ...names.filter(n => n !== ADMIN_NAME)];

  const tryLogin = () => {
    if (!selected) return;
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
          <div style={{ background: "linear-gradient(135deg, #1e293b, #334155)", borderRadius: 16, padding: "32px 24px", marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{selected}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>Enter your PIN</div>
          </div>
          <div style={{ ...crd, padding: 20 }}>
            <input autoFocus type="password" inputMode="numeric" maxLength={6} value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }} onKeyDown={e => e.key === "Enter" && tryLogin()} placeholder="6-digit PIN" style={{ ...inp, textAlign: "center", fontSize: 24, fontWeight: 900, letterSpacing: "0.3em" }} />
            {error && <div style={{ fontSize: 12, color: RED, textAlign: "center", marginTop: 8, fontWeight: 600 }}>{error}</div>}
            <button onClick={tryLogin} style={{ ...pill, background: "#111827", color: "#fff", padding: "12px 0", width: "100%", marginTop: 12, fontSize: 14 }}>Sign In</button>
            <button onClick={() => { setSelected(null); setPin(""); setError(""); }} style={{ ...pillInactive, width: "100%", marginTop: 8, padding: "10px 0" }}>Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT_PRIMARY, fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 420, width: "100%" }}>
        <div style={{ background: "linear-gradient(135deg, #1e293b, #334155)", borderRadius: 16, padding: "32px 24px", marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}>Communication and Sport</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 500, marginTop: 4 }}>COMM 118 - Ishak / Santa Clara University</div>
        </div>
        <div style={{ ...crd, padding: "12px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.6, textAlign: "center" }}>This app is our class hub: schedule, leaderboard, games, and team standings. Select your name to get started.</div>
        </div>
        <div style={{ ...crd, padding: 4 }}>
          {sorted.map(name => (
            <button key={name} onClick={() => setSelected(name)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", textAlign: "left",
              fontFamily: F, fontSize: 14, fontWeight: name === ADMIN_NAME ? 700 : 500,
              background: name === ADMIN_NAME ? "#fef2f2" : "transparent",
              color: name === ADMIN_NAME ? ACCENT : TEXT_PRIMARY,
              border: "none", borderRadius: 10, cursor: "pointer", transition: "background 0.1s",
            }}>
              <span style={{ width: 32, height: 32, borderRadius: "50%", background: name === ADMIN_NAME ? ACCENT : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: name === ADMIN_NAME ? "#fff" : "#6b7280", flexShrink: 0 }}>
                {name.split(" ").map(n => n[0]).join("")}
              </span>
              {name}
            </button>
          ))}
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
        <button onClick={handleDone} style={{ ...bt, fontSize: 10, padding: "3px 10px", background: ACCENT, color: "#fff" }}>Done</button>
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
        <label style={{ fontSize: 10, color: TEXT_MUTED, display: "flex", alignItems: "center", gap: 2 }}><input type="checkbox" checked={local.holiday} onChange={e => set("holiday", e.target.checked)} />Off</label>
      </div>
      <textarea value={local.topic} onChange={e => set("topic", e.target.value)} placeholder="Topic" rows={2} style={{ ...inp, padding: "4px 6px", fontSize: 12, resize: "vertical" }} />
      <input value={local.activities} onChange={e => set("activities", e.target.value)} placeholder="Activities (comma-separated: Game, Fishbowl, etc.)" style={{ ...inp, padding: "3px 6px", fontSize: 11, fontWeight: 700 }} />
      <select value={local.assignment} onChange={e => set("assignment", e.target.value)} style={{ ...sel, width: "100%", fontSize: 11, padding: "3px 6px" }}>
        <option value="">No assignment due</option>
        {(data.assignments || []).filter(a => a.id !== "participation").map(a => (
          <option key={a.id} value={a.name + " due"}>{a.name}</option>
        ))}
      </select>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>Readings</div>
      {(d.readings || []).map((r, ri) => {
        const rdg = (data.readings || []).find(x => x.id === r.readingId);
        return (
          <div key={ri} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, padding: "3px 6px", background: r.type === "required" ? "#fef2f2" : "#f0fdf4", borderRadius: 6 }}>
            <span style={{ flex: 1, color: "#374151", fontWeight: 500 }}>{rdg?.title || "Unknown"}</span>
            <select value={r.type} onChange={e => {
              const upd = [...(d.readings || [])]; upd[ri] = { ...upd[ri], type: e.target.value };
              updateDate(wi, realDi, "readings", upd);
            }} style={{ fontSize: 10, border: "none", background: "transparent", color: r.type === "required" ? RED : r.type === "highly_recommended" ? AMBER : GREEN, fontWeight: 700, cursor: "pointer" }}>
              <option value="required">Required</option>
              <option value="highly_recommended">Highly Rec</option>
              <option value="recommended">Recommended</option>
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
        <div style={{ fontSize: 10, color: TEXT_MUTED, fontStyle: "italic" }}>No readings in repository yet</div>
      )}
      <textarea value={local.notes} onChange={e => set("notes", e.target.value)} placeholder="Notes (students see this)" rows={2} style={{ ...inp, padding: "3px 6px", fontSize: 11, resize: "vertical" }} />
      <textarea value={local.adminNotes} onChange={e => set("adminNotes", e.target.value)} placeholder="Admin notes (students can't see)" rows={2} style={{ ...inp, padding: "3px 6px", fontSize: 11, resize: "vertical", borderColor: "#f59e0b", background: "#fffbeb" }} />
      <div style={{ display: "flex", gap: 4 }}>
        <button onClick={handleDone} style={{ ...bt, fontSize: 10, padding: "3px 10px", background: ACCENT, color: "#fff" }}>Done</button>
        <button onClick={() => { removeDate(wi, realDi); onDone(); }} style={{ ...bt, fontSize: 10, padding: "3px 10px", background: "transparent", color: RED, border: "1px solid " + RED + "33" }}>X</button>
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
    const updated = { ...data, schedule: data.schedule.map((w, wi) => wi === weekIdx ? { ...w, dates: [...w.dates, { date: "TBD", day: "", topic: "", assignment: "", notes: "" }] } : w) };
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
              <button onClick={saveLinks} style={{ ...pill, background: "#111827", color: "#fff", padding: "8px 0", width: "100%" }}>Save</button>
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

          return (
            <div key={wi}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                {week.week <= 10 && <div style={{ width: 32, height: 32, borderRadius: 8, background: "#111827", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 900, fontFamily: F, flexShrink: 0 }}>{week.week}</div>}
                {isAdmin && isEditing ? (
                  <WeekHeaderEditor week={week} wi={wi} data={data} setData={setData} onDone={() => setEditWeek(null)} />
                ) : (
                  <div style={{ flex: 1, cursor: isAdmin ? "pointer" : "default" }} onClick={() => isAdmin && setEditWeek(wi)}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{week.label}{week.theme ? " — " + week.theme : ""}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>{days.map(d => d.date).join(" / ")}</div>
                  </div>
                )}
                {isAdmin && <button onClick={() => removeWeek(wi)} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, fontSize: 14, padding: 4 }}>x</button>}
              </div>
              {week.question && !isEditing && <div style={{ fontSize: 13, fontStyle: "italic", color: "#6b7280", marginBottom: 8, marginLeft: 42, lineHeight: 1.3 }}>"{week.question}"</div>}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(" + days.length + ", 1fr)", gap: 6, marginLeft: 1 }}>
                {days.map((d, di) => {
                  const realDi = week.dates.indexOf(d);
                  const isHoliday = d.holiday;
                  const isFri = d.fri || d.day === "Fri";
                  const isEdit = editCell && editCell.w === wi && editCell.d === realDi;

                  return (
                    <div key={di} onClick={() => isAdmin && !isEdit && setEditCell({ w: wi, d: realDi })} style={{
                      padding: "10px 12px", borderRadius: 12, minHeight: 70,
                      background: isHoliday ? "#fdf2f8" : "#fff",
                      border: isFri && !isHoliday ? "2px solid #c4b5fd" : "1px solid #f3f4f6",
                      cursor: isAdmin && !isEdit ? "pointer" : "default",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: isHoliday ? "#db2777" : isFri ? PURPLE : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>{d.day}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>{d.date}</span>
                      </div>

                      {isEdit && isAdmin ? (
                        <ScheduleCardEditor d={d} wi={wi} realDi={realDi} data={data} setData={setData} updateDate={updateDate} removeDate={removeDate} onDone={() => setEditCell(null)} />
                      ) : (
                        <div>
                          {isHoliday ? (
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#db2777" }}>{d.notes || "No class"}</div>
                          ) : (
                            <>
                              <div style={{ fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.35 }}>{d.topic || <span style={{ color: TEXT_MUTED, fontStyle: "italic" }}>—</span>}</div>
                              {(d.activities || []).length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4 }}>
                                  {(d.activities || []).map((act, ai) => (
                                    <span key={ai} style={{ fontSize: 10, fontWeight: 900, color: "#111827", background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>{act}</span>
                                  ))}
                                </div>
                              )}
                              {d.assignment && <div style={{ fontSize: 11, color: "#ea580c", marginTop: 3, fontWeight: 600 }}>{d.assignment}</div>}
                              {(d.readings || []).length > 0 && (
                                <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                                  {(d.readings || []).map((r, ri) => {
                                    const rdg = (data.readings || []).find(x => x.id === r.readingId);
                                    if (!rdg) return null;
                                    const link = rdg.pdfUrl || rdg.url;
                                    return (
                                      <div key={ri} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                                        <span style={{ fontSize: 9, fontWeight: 700, color: r.type === "required" ? RED : r.type === "highly_recommended" ? AMBER : GREEN, textTransform: "uppercase" }}>{r.type === "required" ? "Req" : r.type === "highly_recommended" ? "H.Rec" : "Rec"}</span>
                                        {link ? (
                                          <a href={link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>{rdg.title}</a>
                                        ) : (
                                          <span style={{ color: "#374151", fontWeight: 500 }}>{rdg.title}</span>
                                        )}
                                        {rdg.pdfUrl && <span style={{ fontSize: 8, fontWeight: 700, color: RED, background: "#fef2f2", padding: "0 3px", borderRadius: 3 }}>PDF</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {d.notes && !isHoliday && <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2, whiteSpace: "pre-wrap" }}>{d.notes}</div>}
                              {isAdmin && d.adminNotes && <div style={{ fontSize: 10, color: AMBER, marginTop: 3, padding: "3px 6px", background: "#fffbeb", borderRadius: 4, border: "1px solid #fef3c7", whiteSpace: "pre-wrap" }}>{d.adminNotes}</div>}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {isAdmin && <button onClick={() => addDate(wi)} style={{ ...pill, background: "transparent", border: "1px dashed #d1d5db", color: "#9ca3af", width: "100%", marginTop: 6, fontSize: 11 }}>+</button>}
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
  const shuffledStudents = shuffleTeams(students, log, teams);
  const visible = showAll ? ranked : ranked.slice(0, 10);
  const myRank = ranked.findIndex(s => s.name === userName);
  const meInVisible = myRank >= 0 && myRank < visible.length;
  const meData = myRank >= 0 ? ranked[myRank] : null;
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
            background: inA ? "#d4a017" : "#f3f4f6",
            color: inA ? "#fff" : "#6b7280",
          }}>{i + 1}</div>
          {bio.photo ? (
            <img src={bio.photo} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "3px solid " + (inA ? "#d4a01744" : "#f3f4f6") }} />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff", flexShrink: 0, border: "3px solid " + (inA ? "#d4a01744" : "#f3f4f6") }}>{initials}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#111827", fontFamily: F }}>{s.name}</span>
              {starCounts[s.id] > 0 && <span style={{ fontSize: 13, color: "#d97706" }}>{Array(starCounts[s.id]).fill("\u2733").join("")}</span>}
              {isMe && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#dbeafe", color: "#1d4ed8", fontWeight: 700 }}>YOU</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3, flexWrap: "wrap" }}>
              {team && <span style={{ fontSize: 11, color: tc.accent, fontWeight: 600 }}>{team.name}</span>}
              <span style={{ fontSize: 11, color: "#d1d5db" }}>/</span>
              <span style={{ fontSize: 11, color: "#b0b0b0", fontStyle: "italic" }}>{getMotto(s.id)}</span>
            </div>
            {bio.hometown && <div style={{ fontSize: 10, color: "#d1d5db", marginTop: 2 }}>{bio.hometown}</div>}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: inA ? "#b8860b" : "#111827", fontFamily: F, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{s.points}</div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>pts</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 3 }}>
              {wp > 0 && <span style={{ fontSize: 10, color: GREEN, fontWeight: 700 }}>+{wp} this wk</span>}
              {movement > 0 && <span style={{ fontSize: 10, color: GREEN, fontWeight: 700 }}>&#9650;{movement}</span>}
              {movement < 0 && <span style={{ fontSize: 10, color: RED, fontWeight: 700 }}>&#9660;{Math.abs(movement)}</span>}
            </div>
          </div>
        </div>
        {isExpanded && (
          <div style={{ padding: "0 16px 14px", borderTop: "1px solid #f3f4f6" }}>
            <div style={{ ...sectionLabel, marginTop: 10, marginBottom: 6 }}>Point Breakdown</div>
            {breakdownEntries.length === 0 && <div style={{ fontSize: 12, color: "#d1d5db", fontStyle: "italic" }}>No points yet.</div>}
            {breakdownEntries.map(([src, pts]) => (
              <div key={src} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", fontSize: 13 }}>
                <span style={{ color: "#6b7280" }}>{src}</span>
                <span style={{ fontWeight: 700, color: pts > 0 ? "#111827" : RED }}>{pts > 0 ? "+" : ""}{pts}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: 4, background: "#f3f4f6" }}>
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
              <span style={{ fontSize: 13, color: "#6b7280" }}>Earn points through the weekly game, This or That, PTI, and Rotating Fishbowl.</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ transform: showExplain ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginLeft: 8 }}><path d="M6 9l6 6 6-6"/></svg>
            </button>
            {showExplain && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f3f4f6", fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
                <p>The leaderboard tracks your game points. You earn them four ways: the weekly game (up to 100 pts), This or That (up to 20 pts), PTI culture points (awarded in class), and Rotating Fishbowl (up to 20 pts).</p>
                <p style={{ marginTop: 8 }}>The top 5 on the leaderboard at the end of the quarter earn automatic A's in the class. That's real.</p>
                <p style={{ marginTop: 8 }}>This is not your full grade. The leaderboard contributes to 25% of your grade (the participation bucket), but in different weights. The other 75% comes from your assignments. Check the Assignments tab for the full picture.</p>
              </div>
            )}
          </div>
        </div>
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
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12, lineHeight: 1.5 }}>Teams shuffle weekly based on leaderboard rank. The team whose top 3 players score highest on the weekly game earns 10 bonus points each.</div>
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
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{team.name}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{memberData.length} players{wins > 0 ? " / " + wins + " win" + (wins !== 1 ? "s" : "") : ""}</div>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#111827", fontVariantNumeric: "tabular-nums" }}>{team.total}</div>
                </div>
                <div style={{ padding: "0 16px 12px" }}>
                  {memberData.map(m => (
                    <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderTop: "1px solid #f9fafb" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: tc.accent, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: "#4b5563" }}>{m.name}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{m.points}</span>
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
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginLeft: 8 }}>{members.length}</div>
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
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2500); };

  const undo = async () => { if (!data.log.length) return; const lastTs = data.log[data.log.length - 1].ts; const updated = { ...data, log: data.log.filter(e => e.ts !== lastTs) }; await saveData(updated); setData(updated); showMsg("Undone"); };
  const resetAll = async () => { const updated = { ...data, log: [] }; await saveData(updated); setData(updated); showMsg("Reset"); };
  const addStudent = async () => { if (!newName.trim() || !newTeamId) return; const updated = { ...data, students: [...data.students, { id: genId(), name: newName.trim(), teamId: newTeamId }] }; await saveData(updated); setData(updated); setNewName(""); setNewTeamId(""); showMsg("Added"); };
  const removeStudent = async id => { const updated = { ...data, students: data.students.filter(s => s.id !== id), log: data.log.filter(e => e.studentId !== id) }; await saveData(updated); setData(updated); showMsg("Removed"); };
  const addTeam = async () => { if (!newTeamName.trim()) return; const updated = { ...data, teams: [...data.teams, { id: genId(), name: newTeamName.trim(), colorIdx: data.teams.length % TEAM_COLORS.length }] }; await saveData(updated); setData(updated); setNewTeamName(""); showMsg("Team added"); };
  const removeTeam = async id => { const updated = { ...data, teams: data.teams.filter(t => t.id !== id), students: data.students.map(s => s.teamId === id ? { ...s, teamId: "" } : s) }; await saveData(updated); setData(updated); showMsg("Team removed"); };

  const recent = [...data.log].reverse().slice(0, 30);

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ ...sectionLabel, marginBottom: 12 }}>Admin</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {["roster", "pins", "log"].map(m => (
          <button key={m} onClick={() => setMode(m)} style={mode === m ? pillActive : pillInactive}>{m === "roster" ? "Roster" : m === "pins" ? "PINs" : "Log"}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={undo} style={pillInactive}>Undo</button>
        <button onClick={() => { if (window.confirm("Reset ALL points?")) resetAll(); }} style={{ ...pill, background: "#fef2f2", color: RED }}>Reset</button>
      </div>

      {mode === "roster" && (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
          <div style={{ ...crd, padding: 16 }}>
            <div style={{ ...sectionLabel, marginBottom: 14 }}>Teams</div>
            {data.teams.map(t => { const tc = TEAM_COLORS[t.colorIdx]; return (<div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid " + BORDER }}><span style={{ color: tc.accent, fontWeight: 600 }}>{t.name}</span><button onClick={() => removeTeam(t.id)} style={{ ...bt, fontSize: 11, padding: "2px 8px", background: "transparent", color: RED, border: "1px solid " + RED + "33" }}>X</button></div>); })}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}><input placeholder="New team" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} style={{ ...inp, flex: 1 }} /><button onClick={addTeam} style={{ ...bt, background: "#111827", color: "#fff", fontSize: 12 }}>Add</button></div>
          </div>
          <div style={{ ...crd, padding: 16 }}>
            <div style={{ ...sectionLabel, marginBottom: 14 }}>Students</div>
            {[...data.students].sort(lastSortObj).map(s => { const team = data.teams.find(t => t.id === s.teamId); return (<div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid " + BORDER, fontSize: 13 }}><div><span style={{ color: TEXT_PRIMARY }}>{s.name}</span>{team && <span style={{ color: TEXT_MUTED, marginLeft: 8, fontSize: 11 }}>{team.name}</span>}</div><button onClick={() => removeStudent(s.id)} style={{ ...bt, fontSize: 11, padding: "2px 8px", background: "transparent", color: RED, border: "1px solid " + RED + "33" }}>X</button></div>); })}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}><input placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} style={{ ...inp, flex: 1 }} /><select value={newTeamId} onChange={e => setNewTeamId(e.target.value)} style={{ ...sel, minWidth: 90 }}><option value="">Team</option>{data.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><button onClick={addStudent} style={{ ...bt, background: "#111827", color: "#fff", fontSize: 12 }}>Add</button></div>
          </div>
        </div>
      )}

      {mode === "pins" && (
        <div style={{ ...crd, padding: 16 }}>
          <div style={{ ...sectionLabel, marginBottom: 14 }}>Student PINs</div>
          <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 12 }}>Share these with students so they can log in. PINs are generated automatically.</div>
          {[...data.students].sort(lastSortObj).map(s => {
            const studentPin = (data.pins || {})[s.id] || "------";
            return (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid " + BORDER }}>
                <span style={{ fontSize: 13, color: TEXT_PRIMARY, fontWeight: s.name === ADMIN_NAME ? 700 : 500 }}>{s.name}</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: "#111827", fontVariantNumeric: "tabular-nums", letterSpacing: "0.15em", fontFamily: F }}>{studentPin}</span>
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

  if (phase === "done") return (<div style={{ padding: 40, textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 900, color: "#111827", marginBottom: 16 }}>Quiz Complete</div><div style={{ color: TEXT_SECONDARY, marginBottom: 24 }}>Points awarded.</div><button onClick={() => { setPhase("setup"); setQuestions(["", "", "", "", ""]); }} style={{ ...bt, background: "#111827", color: "#fff", border: "1px solid #111827" }}>New Quiz</button></div>);

  if (phase === "live") {
    const valid = questions.filter(q => q.trim());
    return (
      <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}><div style={{ ...sectionLabel }}>Question {currentQ + 1} / {valid.length}</div></div>
        <div style={{ ...crd, textAlign: "center", padding: 40, marginBottom: 20 }}><div style={{ fontSize: 20, fontWeight: 900, color: "#111827", lineHeight: 1.3 }}>{valid[currentQ]}</div></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
          {data.teams.map(team => { const tc = TEAM_COLORS[team.colorIdx]; const correct = teamAnswers[currentQ + "-" + team.id]; return (<button key={team.id} onClick={() => toggleCorrect(team.id)} style={{ ...crd, cursor: "pointer", textAlign: "center", padding: 20, background: correct ? GREEN + "15" : "#fff", borderColor: correct ? GREEN : BORDER }}><div style={{ fontSize: 14, fontWeight: 700, color: correct ? GREEN : tc.accent }}>{team.name}</div><div style={{ fontSize: 10, fontWeight: 700, color: correct ? GREEN : "#9ca3af", marginTop: 4 }}>{correct ? "CORRECT" : "\u2014"}</div></button>); })}
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}><button onClick={next} style={{ ...bt, background: "#111827", color: "#fff", fontSize: 14, padding: "12px 36px", border: "1px solid #111827", fontWeight: 700 }}>{currentQ < valid.length - 1 ? "Next" : "Finish"}</button></div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 560, margin: "0 auto" }}>
      <div style={{ ...sectionLabel, textAlign: "center", marginBottom: 20 }}>Weekly Quiz</div>
      <div style={{ ...crd, padding: 16 }}>
        {questions.map((q, i) => (<div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}><span style={{ fontSize: 13, fontWeight: 900, color: "#9ca3af", width: 24 }}>{i + 1}</span><input placeholder={"Question " + (i + 1)} value={q} onChange={e => { const u = [...questions]; u[i] = e.target.value; setQuestions(u); }} style={inp} /></div>))}
        <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "16px 0" }}><span style={{ color: TEXT_SECONDARY, fontSize: 13 }}>Points per correct:</span><input type="number" value={ptsPerQ} onChange={e => setPtsPerQ(e.target.value)} style={{ ...inp, width: 60 }} /></div>
        <button onClick={start} style={{ ...bt, background: "#111827", color: "#fff", width: "100%", fontSize: 14, padding: 12, border: "1px solid #111827", fontWeight: 700 }}>Start</button>
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
    const entry = { id: genId(), studentId: sid, amount, source: "PTI", ts: Date.now() };
    const updated = { ...data, log: [...data.log, entry] };
    await saveData(updated); setData(updated);
    showMsg((amount > 0 ? "+" : "") + amount + " " + (student?.name?.split(" ")[0] || ""));
  };

  return (
    <div style={{ padding: "20px 16px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 12 }}>PTI</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
          {[...data.students].sort(lastSortObj).map(s => {
            const team = data.teams.find(t => t.id === s.teamId);
            const tc = team ? TEAM_COLORS[team.colorIdx] : TEAM_COLORS[0];
            const pts = gp(data.log, s.id);
            const ptiPts = data.log.filter(e => e.studentId === s.id && e.source === "PTI").reduce((sum, e) => sum + e.amount, 0);
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
                    <span style={{ fontSize: 10, fontWeight: 700, color: rank <= 5 ? "#d4a017" : "#d1d5db" }}>#{rank}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: ptiPts > 0 ? GREEN : "#d1d5db" }}>PTI: {ptiPts}</span>
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px", fontSize: 12, fontWeight: 900, color: "#fff" }}>{initials}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#111827", lineHeight: 1.2 }}>{s.name.split(" ")[0]}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#6b7280", marginTop: 1 }}>{s.name.split(" ").slice(1).join(" ")}</div>
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
              <span style={{ fontSize: 12, fontWeight: 900, color: "#9ca3af", width: 22 }}>{i + 1}</span>
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
            <button onClick={saveSlot} style={{ ...bt, background: "#111827", color: "#fff", flex: 1, border: "1px solid #111827" }}>Save</button>
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
                background: "#f3f4f6", color: "#9ca3af", border: "1px solid #f3f4f6",
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
              background: i === currentQ ? "#111827" : answered ? GREEN + "20" : "#f5f5f4",
              color: i === currentQ ? "#fff" : answered ? GREEN : "#9ca3af",
            }}>{i + 1}</button>
          );
        })}
      </div>

      <div style={{ fontSize: 48, fontWeight: 900, color: "#111827", marginBottom: 24 }}>Q{currentQ + 1}</div>

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
              ...bt, fontSize: 14, padding: "12px 40px", background: "#111827", color: "#fff", borderRadius: 12, border: "1px solid #111827", fontWeight: 700,
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
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                    {team ? team.name : "Unassigned"}
                    {bio.major ? " / " + bio.major : ""}
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
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

  const team = data.teams.find(t => t.id === student.teamId);
  const tc = team ? TEAM_COLORS[team.colorIdx] : TEAM_COLORS[0];
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
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#fff", border: "3px solid rgba(255,255,255,0.2)" }}>{initials}</div>
            )}
            {canEdit && (
              <label style={{ position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
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
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={saveBio} style={{ ...pill, background: "#111827", color: "#fff", flex: 1, padding: "10px 0" }}>Save</button>
              <button onClick={() => { setForm({ ...bio }); setEditing(false); }} style={{ ...pillInactive, flex: 1, padding: "10px 0" }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ ...crd, padding: 16, marginTop: 12 }}>
            {bio.about || bio.major || bio.year || bio.hometown || bio.favTeam || bio.motto || bio.funFact ? (
              <>
                {bio.about && <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.5, marginBottom: 12 }}>{bio.about}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {bio.major && <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Major</div><div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{bio.major}</div></div>}
                  {bio.year && <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Year</div><div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{bio.year}</div></div>}
                  {bio.hometown && <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Hometown</div><div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{bio.hometown}</div></div>}
                  {bio.favTeam && <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Fav Team</div><div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{bio.favTeam}</div></div>}
                  {bio.motto && <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Motto</div><div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{bio.motto}</div></div>}
                </div>
                {bio.funFact && <div style={{ marginTop: 10 }}><div style={{ ...sectionLabel, marginBottom: 2 }}>Fun Fact</div><div style={{ fontSize: 13, color: "#374151" }}>{bio.funFact}</div></div>}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#9ca3af", fontSize: 13 }}>
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
  const [newReading, setNewReading] = useState({ title: "", url: "", category: "", notes: "", readingType: "recommended" });
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const categories = [...new Set(readings.map(r => r.category).filter(Boolean))].sort();

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
      const r = { id, title, url: newReading.url.trim(), pdfUrl, category: newReading.category.trim(), notes: newReading.notes.trim() };
      const updated = { ...data, readings: [...readings, r] };
      await saveData(updated); setData(updated);
      setNewReading({ title: "", url: "", category: "", notes: "" });
      showMsg("Added with PDF");
    } catch (err) { showMsg("Upload failed"); }
    setUploading(false);
  };

  const getReadingLink = (r) => r.pdfUrl || r.url;
  const getReadingLabel = (r) => {
    if (r.pdfUrl && r.url) return "PDF + Link";
    if (r.pdfUrl) return "PDF";
    return null;
  };

  // Build week-grouped view
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

  const ReadingLink = ({ r, children }) => {
    const link = getReadingLink(r);
    if (link) return <a href={link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>{children}</a>;
    return <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{children}</span>;
  };

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 12 }}>Readings and Media</div>

        {/* Admin: add new reading */}
        {isAdmin && (
          <div style={{ ...crd, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10 }}>Add to Repository</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <input value={newReading.title} onChange={e => setNewReading({ ...newReading, title: e.target.value })} placeholder="Title" style={inp} />
              <input value={newReading.url} onChange={e => setNewReading({ ...newReading, url: e.target.value })} placeholder="URL (optional)" style={inp} />
              <div style={{ display: "flex", gap: 6 }}>
                <input value={newReading.category} onChange={e => setNewReading({ ...newReading, category: e.target.value })} placeholder="Category (e.g. Article, Video)" list="cat-list" style={{ ...inp, flex: 1 }} />
                <datalist id="cat-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
                <select value={newReading.readingType} onChange={e => setNewReading({ ...newReading, readingType: e.target.value })} style={{ ...sel, width: 140, fontSize: 12, padding: "6px 8px" }}>
                  <option value="required">Required</option>
                  <option value="highly_recommended">Highly Recommended</option>
                  <option value="recommended">Recommended</option>
                </select>
              </div>
              <textarea value={newReading.notes} onChange={e => setNewReading({ ...newReading, notes: e.target.value })} placeholder="Notes (optional)" rows={2} style={{ ...inp, resize: "vertical" }} />
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={addReading} style={{ ...pill, background: "#111827", color: "#fff", padding: "10px 0", flex: 1 }}>Add Reading</button>
                <label style={{ ...pill, background: "#eff6ff", color: "#2563eb", padding: "10px 16px", display: "flex", alignItems: "center", gap: 4 }}>
                  {uploading ? "Uploading..." : "Add with PDF"}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <input type="file" accept=".pdf" onChange={e => { if (e.target.files?.[0]) handleNewPdfUpload(e.target.files[0]); e.target.value = ""; }} style={{ display: "none" }} disabled={uploading} />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Weekly view */}
        {weekReadings.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10 }}>By Week</div>
            {weekReadings.map(w => (
              <div key={w.week} style={{ ...crd, padding: 14, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "#111827", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 900, flexShrink: 0 }}>{w.week}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{w.label}{w.theme ? " \u2014 " + w.theme : ""}</div>
                </div>
                {w.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: i > 0 ? "1px solid #f9fafb" : "none" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: (item.type || item.readingType) === "required" ? RED : (item.type || item.readingType) === "highly_recommended" ? AMBER : GREEN, textTransform: "uppercase", width: 40, flexShrink: 0 }}>{(item.type || item.readingType) === "required" ? "Req" : (item.type || item.readingType) === "highly_recommended" ? "H.Rec" : "Rec"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <ReadingLink r={item}>{item.title}</ReadingLink>
                      {getReadingLabel(item) && <span style={{ fontSize: 9, color: "#9ca3af", marginLeft: 4, fontWeight: 600 }}>{getReadingLabel(item)}</span>}
                      {item.category && <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 6 }}>{item.category}</span>}
                      {item.notes && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>{item.notes}</div>}
                    </div>
                    <span style={{ fontSize: 10, color: "#d1d5db", flexShrink: 0 }}>{item.day} {item.date}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Full repository by category */}
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10 }}>Full Repository</div>
        {readings.length === 0 && <div style={{ ...crd, padding: 20, textAlign: "center", color: "#d1d5db", fontSize: 13 }}>No readings added yet.</div>}
        {(categories.length > 0 ? categories : [""]).map(cat => {
          const catReadings = readings.filter(r => (r.category || "") === cat);
          if (catReadings.length === 0) return null;
          return (
            <div key={cat || "__none"} style={{ marginBottom: 16 }}>
              {cat && <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{cat}</div>}
              {catReadings.map(r => {
                const isEditing = editId === r.id;
                return (
                  <div key={r.id} style={{ ...crd, padding: 12, marginBottom: 4 }}>
                    {isAdmin && isEditing ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <input value={r.title} onChange={e => updateReading(r.id, "title", e.target.value)} style={{ ...inp, fontSize: 13, padding: "4px 8px" }} />
                        <input value={r.url || ""} onChange={e => updateReading(r.id, "url", e.target.value)} placeholder="URL" style={{ ...inp, fontSize: 12, padding: "4px 8px" }} />
                        <input value={r.category || ""} onChange={e => updateReading(r.id, "category", e.target.value)} placeholder="Category" list="cat-list" style={{ ...inp, fontSize: 12, padding: "4px 8px" }} />
                        <select value={r.readingType || "recommended"} onChange={e => updateReading(r.id, "readingType", e.target.value)} style={{ ...sel, width: "100%", fontSize: 12, padding: "4px 8px" }}>
                          <option value="required">Required</option>
                          <option value="highly_recommended">Highly Recommended</option>
                          <option value="recommended">Recommended</option>
                        </select>
                        <textarea value={r.notes || ""} onChange={e => updateReading(r.id, "notes", e.target.value)} placeholder="Notes" rows={2} style={{ ...inp, fontSize: 12, padding: "4px 8px", resize: "vertical" }} />
                        {r.pdfUrl ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: "#f0fdf4", borderRadius: 6 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <span style={{ fontSize: 11, color: GREEN, fontWeight: 600, flex: 1 }}>PDF attached</span>
                            <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#2563eb" }}>View</a>
                            <button onClick={() => updateReading(r.id, "pdfUrl", "")} style={{ background: "none", border: "none", cursor: "pointer", color: RED, fontSize: 11, fontWeight: 600 }}>Remove</button>
                          </div>
                        ) : (
                          <label style={{ ...pillInactive, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "8px 0", cursor: "pointer" }}>
                            {uploading ? "Uploading..." : "Upload PDF"}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            <input type="file" accept=".pdf" onChange={e => { if (e.target.files?.[0]) handlePdfUpload(e.target.files[0], r.id); e.target.value = ""; }} style={{ display: "none" }} disabled={uploading} />
                          </label>
                        )}
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => setEditId(null)} style={{ ...pill, background: "#111827", color: "#fff", flex: 1 }}>Done</button>
                          <button onClick={() => { if (window.confirm("Delete this reading?")) deleteReading(r.id); }} style={{ ...pill, background: "#fef2f2", color: RED }}>Delete</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: isAdmin ? "pointer" : "default" }} onClick={() => isAdmin && setEditId(r.id)}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: r.readingType === "required" ? RED : r.readingType === "highly_recommended" ? AMBER : GREEN, textTransform: "uppercase", width: 50, flexShrink: 0 }}>{r.readingType === "required" ? "Req" : r.readingType === "highly_recommended" ? "High Rec" : "Rec"}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <ReadingLink r={r}>{r.title}</ReadingLink>
                            {r.pdfUrl && <span style={{ fontSize: 9, fontWeight: 700, color: RED, background: "#fef2f2", padding: "1px 5px", borderRadius: 4 }}>PDF</span>}
                            {r.url && r.pdfUrl && <a href={r.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 9, fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "1px 5px", borderRadius: 4, textDecoration: "none" }}>Link</a>}
                          </div>
                          {r.notes && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{r.notes}</div>}
                        </div>
                        {isAdmin && <span style={{ fontSize: 11, color: "#d1d5db", flexShrink: 0 }}>Click to edit</span>}
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
              <div style={{ fontSize: 12, fontWeight: isReal ? 900 : 500, color: isReal ? GREEN : "#111827" }}>{cat}{isReal ? " \u2713" : ""}</div>
              <div style={{ height: 3, background: "#f3f4f6", borderRadius: 2, marginTop: 2 }}>
                <div style={{ height: "100%", width: pct + "%", background: isReal ? GREEN : "#9ca3af", borderRadius: 2 }} />
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#111827", width: 30, textAlign: "right" }}>{count}</span>
          </div>
        );
      })}
      {total === 0 && <div style={{ fontSize: 13, color: "#d1d5db", textAlign: "center", padding: 12 }}>Waiting for responses...</div>}
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
            <div style={{ fontSize: 14, fontWeight: 900, color: "#111827", marginBottom: 6 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8, lineHeight: 1.4 }}>{c.desc}</div>
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, textTransform: "uppercase", marginBottom: 2 }}>Why it matters</div>
              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.4 }}>{c.whyItMatters}</div>
            </div>
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, textTransform: "uppercase", marginBottom: 2 }}>Who it affects</div>
              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.4 }}>{c.whoItAffects}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, textTransform: "uppercase", marginBottom: 2 }}>Example angles</div>
              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.4 }}>{c.exampleAngles}</div>
            </div>
          </div>
        ))}
        <div style={{ ...crd, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 4 }}>Your notes for this headline</div>
          <textarea value={adminNotes || headline?.adminNotes || ""} onChange={e => setAdminNotes(e.target.value)} placeholder="Add your own talking points, examples, discussion questions..." rows={3} style={{ ...inp, fontSize: 12, resize: "vertical" }} />
          <button onClick={() => saveHeadlineNotes(headline.id, adminNotes)} style={{ ...pill, background: "#111827", color: "#fff", padding: "8px 0", width: "100%", marginTop: 6 }}>Save Notes</button>
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
              <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>Headlines</div>
              <div style={{ width: 60 }} />
            </div>

            <div style={{ ...crd, padding: 14, marginBottom: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <input value={newHeadline} onChange={e => setNewHeadline(e.target.value)} placeholder="Headline text..." style={inp} />
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="URL (optional)" style={{ ...inp, flex: 1 }} />
                  <button onClick={() => submitHeadline(session.id)} style={{ ...pill, background: "#111827", color: "#fff", padding: "10px 16px" }}>Add</button>
                </div>
              </div>
            </div>

            <div style={{ ...sectionLabel, marginBottom: 8 }}>Headlines ({sessionHeadlines.length})</div>
            {sessionHeadlines.map(h => {
              const isActive = session.activeHeadlineId === h.id;
              const rc = h.realCategories || []; const rco = h.realConcepts || [];
              return (
                <div key={h.id} style={{ ...crd, padding: 12, marginBottom: 4, borderColor: isActive ? ACCENT : "#f3f4f6", borderWidth: isActive ? 2 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: "#111827" }}>{h.text}</div>
                      {h.url && <a href={h.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: "#2563eb", textDecoration: "none" }}>Source</a>}
                      {rc.length > 0 && <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{rc.join(", ")}</div>}
                      {rco.length > 0 && <div style={{ fontSize: 10, color: ACCENT, fontWeight: 600 }}>{rco.map(id => COMM_CONCEPTS.find(c => c.id === id)?.name || id).join(", ")}</div>}
                    </div>
                    {!isActive && <button onClick={() => activateHeadline(session.id, h.id)} style={{ ...pill, background: "#f3f4f6", color: "#4b5563", fontSize: 10, padding: "4px 10px" }}>Activate</button>}
                  </div>
                </div>
              );
            })}

            {activeHeadline && (
              <div style={{ marginTop: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ ...sectionLabel }}>Active Headline</div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: phase === "surface" ? "#2563eb" : phase === "concept" ? PURPLE : GREEN, background: phase === "surface" ? "#eff6ff" : phase === "concept" ? "#f5f3ff" : "#f0fdf4", padding: "2px 8px", borderRadius: 4 }}>
                    {phase === "surface" ? "Step 1: Surface" : phase === "concept" ? "Step 2: Concept" : "Complete"}
                  </span>
                </div>
                <div style={{ ...crd, padding: 20, textAlign: "center", marginBottom: 16, background: "#111827", borderColor: "#111827" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1.3 }}>{activeHeadline.text}</div>
                  {activeHeadline.url && <a href={activeHeadline.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textDecoration: "none", marginTop: 6, display: "inline-block" }}>View source</a>}
                </div>

                {phase === "surface" && (
                  <div>
                    <VoteBar items={cats} tally={surfaceTally} total={surfaceVoterCount} realItems={[]} label="Surface Category Responses" />
                    <div style={{ ...sectionLabel, marginBottom: 8 }}>What surface categories fit? (select all that apply)</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                      {cats.map(cat => (
                        <button key={cat} onClick={() => toggleReal(cat)} style={{ ...pill, fontSize: 11, padding: "6px 10px", background: realPicks.includes(cat) ? GREEN : "#f3f4f6", color: realPicks.includes(cat) ? "#fff" : "#374151" }}>{cat}</button>
                      ))}
                    </div>
                    {realPicks.length > 0 && <button onClick={() => revealSurface(session.id)} style={{ ...pill, background: ACCENT, color: "#fff", padding: "10px 20px", fontSize: 13 }}>Reveal Surface ({realPicks.length})</button>}
                  </div>
                )}

                {phase === "concept" && (
                  <div>
                    <div style={{ ...crd, padding: 14, background: "#f0fdf4", borderColor: GREEN, textAlign: "center", marginBottom: 12 }}>
                      <div style={{ fontSize: 10, color: GREEN, fontWeight: 600, textTransform: "uppercase" }}>Surface categories</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: "#111827", marginTop: 2 }}>{(session.realCategories || []).join(", ")}</div>
                    </div>
                    <VoteBar items={COMM_CONCEPTS.map(c => c.id)} tally={conceptTally} total={conceptVoterCount} realItems={[]} label="Communication Concept Responses" />
                    <div style={{ ...sectionLabel, marginBottom: 8 }}>What communication concept is this really about?</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                      {COMM_CONCEPTS.map(c => (
                        <button key={c.id} onClick={() => toggleConceptReal(c.id)} style={{ ...crd, padding: "10px 14px", textAlign: "left", cursor: "pointer", borderColor: conceptPicks.includes(c.id) ? PURPLE : "#f3f4f6", borderWidth: conceptPicks.includes(c.id) ? 2 : 1, background: conceptPicks.includes(c.id) ? "#f5f3ff" : "#fff" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: conceptPicks.includes(c.id) ? PURPLE : "#111827" }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{c.desc}</div>
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
                      <div style={{ fontSize: 10, color: GREEN, fontWeight: 600, textTransform: "uppercase" }}>Surface</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: "#111827" }}>{(session.realCategories || []).join(", ")}</div>
                    </div>
                    <div style={{ ...crd, padding: 14, background: "#f5f3ff", borderColor: PURPLE, textAlign: "center", marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: PURPLE, fontWeight: 600, textTransform: "uppercase" }}>Communication Concept</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: "#111827" }}>{(session.realConcepts || []).map(id => COMM_CONCEPTS.find(c => c.id === id)?.name || id).join(", ")}</div>
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
                <button onClick={addCategory} style={{ ...pill, background: "#111827", color: "#fff", padding: "10px 16px" }}>Add</button>
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
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Headline Exercise</div>
              <button onClick={createSession} style={{ ...pill, background: "#111827", color: "#fff" }}>New Session</button>
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5, marginBottom: 12 }}>Show a headline. Students categorize the surface topic, then identify the communication concept underneath.</div>
            {sessions.length === 0 && <div style={{ fontSize: 13, color: "#d1d5db", textAlign: "center", padding: 12 }}>No sessions yet.</div>}
            {[...sessions].reverse().map(s => {
              const count = items.filter(it => it.sessionId === s.id).length;
              return (
                <button key={s.id} onClick={() => setActiveSession(s.id)} style={{ ...crd, padding: 14, marginBottom: 4, width: "100%", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{count} headline{count !== 1 ? "s" : ""} / {new Date(s.ts).toLocaleDateString()}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              );
            })}
          </div>
          {items.filter(it => it.realConcepts?.length > 0).length > 0 && (
            <div style={{ ...crd, padding: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 10 }}>Headline Archive</div>
              {items.filter(it => it.realConcepts?.length > 0).map(h => (
                <div key={h.id} style={{ padding: "8px 0", borderBottom: "1px solid #f9fafb" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, fontSize: 13, color: "#111827" }}>{h.text}</div>
                    {h.url && <a href={h.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#2563eb", textDecoration: "none" }}>Source</a>}
                  </div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{(h.realCategories || []).join(", ")}</div>
                  <div style={{ fontSize: 10, color: ACCENT, fontWeight: 600 }}>{(h.realConcepts || []).map(id => COMM_CONCEPTS.find(c => c.id === id)?.name || id).join(", ")}</div>
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
            <div style={{ ...crd, padding: 20, textAlign: "center", marginBottom: 16, background: "#111827", borderColor: "#111827" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Headline</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1.3 }}>{currentHeadline.text}</div>
              {currentHeadline.url && <a href={currentHeadline.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textDecoration: "none", marginTop: 6, display: "inline-block" }}>Read article</a>}
            </div>

            {/* Surface phase */}
            {curPhase === "surface" && (
              studentSurfaceVote ? (
                <div style={{ ...crd, padding: 20, textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>You picked: {studentSurfaceVote.join(", ")}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Waiting for surface reveal...</div>
                </div>
              ) : (
                <div>
                  <div style={{ ...sectionLabel, marginBottom: 8 }}>Step 1: What surface categories fit? (select all that apply)</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                    {cats.map(cat => (
                      <button key={cat} onClick={() => togglePick(cat)} style={{ ...pill, fontSize: 12, padding: "8px 12px", background: myPicks.includes(cat) ? "#111827" : "#f3f4f6", color: myPicks.includes(cat) ? "#fff" : "#374151" }}>{cat}</button>
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
                  <div style={{ fontSize: 10, color: GREEN, fontWeight: 600, textTransform: "uppercase" }}>Surface categories</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#111827", marginTop: 2 }}>{(currentSession.realCategories || []).join(", ")}</div>
                  {studentSurfaceVote && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>You picked: {studentSurfaceVote.join(", ")}{studentSurfaceVote.some(v => (currentSession.realCategories || []).includes(v)) ? " \u2713" : ""}</div>}
                </div>
                {studentConceptVote ? (
                  <div style={{ ...crd, padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>You picked: {studentConceptVote.map(id => COMM_CONCEPTS.find(c => c.id === id)?.name || id).join(", ")}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Waiting for concept reveal...</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ ...sectionLabel, marginBottom: 8 }}>Step 2: What communication concept is this really about?</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                      {COMM_CONCEPTS.map(c => (
                        <button key={c.id} onClick={() => toggleConceptPick(c.id)} style={{ ...crd, padding: "10px 14px", textAlign: "left", cursor: "pointer", borderColor: myConceptPicks.includes(c.id) ? PURPLE : "#f3f4f6", borderWidth: myConceptPicks.includes(c.id) ? 2 : 1, background: myConceptPicks.includes(c.id) ? "#f5f3ff" : "#fff" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: myConceptPicks.includes(c.id) ? PURPLE : "#111827" }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{c.desc}</div>
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
                  <div style={{ fontSize: 10, color: GREEN, fontWeight: 600, textTransform: "uppercase" }}>Surface</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#111827" }}>{(currentSession.realCategories || []).join(", ")}</div>
                </div>
                <div style={{ ...crd, padding: 14, background: "#f5f3ff", borderColor: PURPLE, textAlign: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: PURPLE, fontWeight: 600, textTransform: "uppercase" }}>Communication Concept</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#111827" }}>{(currentSession.realConcepts || []).map(id => COMM_CONCEPTS.find(c => c.id === id)?.name || id).join(", ")}</div>
                  {studentConceptVote && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>You picked: {studentConceptVote.map(id => COMM_CONCEPTS.find(c => c.id === id)?.name || id).join(", ")}{studentConceptVote.some(v => (currentSession.realConcepts || []).includes(v)) ? " \u2713" : ""}</div>}
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
                  <button onClick={() => submitHeadline(currentSession.id)} style={{ ...pill, background: "#111827", color: "#fff", padding: "10px 16px" }}>Submit</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ ...crd, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#9ca3af" }}>No active headline right now. Check back during class.</div>
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
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Add To-Do</div>
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
                <button onClick={addCustomTodo} style={{ ...pill, background: "#111827", color: "#fff", padding: "10px 16px" }}>Add</button>
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
                      <span style={{ color: "#9ca3af", fontSize: 10 }}>{targetName} / {t.section}</span>
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
                  <th style={{ textAlign: "left", padding: "10px 12px", color: "#9ca3af", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", position: "sticky", left: 0, background: "#fff", zIndex: 2 }}>Student</th>
                  <th style={{ textAlign: "center", padding: "10px 6px", color: "#9ca3af", fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Photo</th>
                  <th style={{ textAlign: "center", padding: "10px 6px", color: "#9ca3af", fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Bio</th>
                  {assignments.map(a => (
                    <th key={a.id} style={{ textAlign: "center", padding: "10px 6px", color: "#9ca3af", fontWeight: 600, fontSize: 10, textTransform: "uppercase", maxWidth: 80 }}>{a.name.split(" ").slice(0, 2).join(" ")}</th>
                  ))}
                  {WEEKLY_ITEMS.map(w => (
                    <th key={w.id} style={{ textAlign: "center", padding: "10px 6px", color: PURPLE, fontWeight: 600, fontSize: 10, textTransform: "uppercase", maxWidth: 70 }}>{w.label.split(" ").slice(0, 2).join(" ")}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(s => {
                  const photo = hasPhoto(s.id);
                  const bio = hasBio(s.id);
                  return (
                    <tr key={s.id} style={{ borderBottom: "1px solid #f9fafb" }}>
                      <td style={{ padding: "8px 12px", fontWeight: 600, color: "#111827", fontSize: 13, whiteSpace: "nowrap", position: "sticky", left: 0, background: "#fff", zIndex: 1 }}>{s.name}</td>
                      <td style={{ textAlign: "center", padding: "6px" }}>{photo ? <span style={{ color: GREEN, fontSize: 16 }}>&#10003;</span> : <span style={{ color: "#e5e7eb", fontSize: 14 }}>-</span>}</td>
                      <td style={{ textAlign: "center", padding: "6px" }}>{bio ? <span style={{ color: GREEN, fontSize: 16 }}>&#10003;</span> : <span style={{ color: "#e5e7eb", fontSize: 14 }}>-</span>}</td>
                      {assignments.map(a => {
                        const done = getCheck(s.id, "assign-" + a.id);
                        return <td key={a.id} style={{ textAlign: "center", padding: "6px" }}>{done ? <span style={{ color: GREEN, fontSize: 16 }}>&#10003;</span> : <span style={{ color: "#e5e7eb", fontSize: 14 }}>-</span>}</td>;
                      })}
                      {WEEKLY_ITEMS.map(w => {
                        const done = getWeeklyCheck(s.id, w.id);
                        return <td key={w.id} style={{ textAlign: "center", padding: "6px" }}>{done ? <span style={{ color: PURPLE, fontSize: 16 }}>&#10003;</span> : <span style={{ color: "#e5e7eb", fontSize: 14 }}>-</span>}</td>;
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
      width: 22, height: 22, borderRadius: 6, border: "2px solid " + (checked ? (accent || GREEN) : "#d1d5db"),
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
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10 }}>Get Started</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Checkbox checked={hasPhoto(sid)} onChange={() => {}} />
              <span style={{ fontSize: 14, color: hasPhoto(sid) ? "#9ca3af" : "#111827", textDecoration: hasPhoto(sid) ? "line-through" : "none" }}>Add your picture</span>
              {hasPhoto(sid) && <span style={{ fontSize: 11, color: GREEN, fontWeight: 600, marginLeft: "auto" }}>Done</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Checkbox checked={hasBio(sid)} onChange={() => {}} />
              <span style={{ fontSize: 14, color: hasBio(sid) ? "#9ca3af" : "#111827", textDecoration: hasBio(sid) ? "line-through" : "none" }}>Update your bio</span>
              {hasBio(sid) && <span style={{ fontSize: 11, color: GREEN, fontWeight: 600, marginLeft: "auto" }}>Done</span>}
            </div>
            {setupCustom.map(t => {
              const done = getCheck(sid, "custom-" + t.id);
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Checkbox checked={done} onChange={() => toggleCheck("custom-" + t.id)} />
                  <span style={{ fontSize: 14, color: done ? "#9ca3af" : "#111827", textDecoration: done ? "line-through" : "none" }}>{t.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assignments */}
        <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10 }}>Assignments</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {assignments.map(a => {
              const done = getCheck(sid, "assign-" + a.id);
              return (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Checkbox checked={done} onChange={() => toggleCheck("assign-" + a.id)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, color: done ? "#9ca3af" : "#111827", textDecoration: done ? "line-through" : "none" }}>{a.name}</span>
                    {a.due && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>Due {a.due}</span>}
                  </div>
                  {a.link && (
                    <a href={a.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ flexShrink: 0, display: "flex", alignItems: "center", padding: "4px 8px", borderRadius: 6, background: "#f3f4f6", color: "#6b7280", textDecoration: "none" }}>
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
                  <span style={{ fontSize: 14, color: done ? "#9ca3af" : "#111827", textDecoration: done ? "line-through" : "none" }}>{t.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly */}
        <div style={{ ...crd, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Every Week</div>
            <span style={{ fontSize: 10, color: PURPLE, fontWeight: 600 }}>Resets Monday</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {WEEKLY_ITEMS.map(w => {
              const done = getWeeklyCheck(sid, w.id);
              return (
                <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Checkbox checked={done} onChange={() => toggleWeekly(w.id)} accent={PURPLE} />
                  <span style={{ fontSize: 14, color: done ? "#9ca3af" : "#111827", textDecoration: done ? "line-through" : "none" }}>{w.label}</span>
                </div>
              );
            })}
            {weeklyCustom.map(t => {
              const done = getWeeklyCheck(sid, "custom-" + t.id);
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Checkbox checked={done} onChange={() => toggleWeekly("custom-" + t.id)} accent={PURPLE} />
                  <span style={{ fontSize: 14, color: done ? "#9ca3af" : "#111827", textDecoration: done ? "line-through" : "none" }}>{t.text}</span>
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
  const [view, setView] = useState("todo");
  const [userName, setUserName] = useState(null);

  const isAdmin = userName === ADMIN_NAME;
  const isGuest = userName === GUEST_NAME;
  const displayName = isGuest ? "Guest" : userName;

  const refresh = useCallback(async () => { try { const d = await loadData(); if (d) setData(d); } catch(e) { console.error(e); } }, []);
  useEffect(() => {
    (async () => {
      try {
        let d = await loadData();
        if (!d) {
          const shuffled = shuffle(ALL_STUDENTS);
          const teams = MISMATCHED_NAMES.slice(0, 7).map((name, i) => ({ id: genId(), name, colorIdx: i }));
          const students = shuffled.map((name, i) => ({ id: genId(), name, teamId: teams[i % 7].id }));
          d = { teams, students, log: [], schedule: JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)), bios: {} };
          await saveData(d);
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
            "Apr 24": { assignment: "Web of Connections Proposal due" },
            "Apr 27": { activities: ["This or That", "Fishbowl", "Headlines"] },
            "Apr 29": { activities: ["Game"] },
            "May 4": { activities: ["This or That", "Fishbowl", "Headlines"] },
            "May 6": { activities: ["Game"], assignment: "", notes: "" },
            "May 8": { assignment: "Web of Connections Submission due" },
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
        if (d && !d._readingsMigV1) {
          const R = [
            // Week 1: Required
            { id: "r_w1_klosterman", title: "Are You Not Entertained?", url: "https://grantland.com/features/chuck-klosterman-gregg-popovich-entertainment-sports/", category: "Article", readingType: "required", notes: "Klosterman on Popovich, entertainment vs winning" },
            { id: "r_w1_ncaa_props", title: "NCAA Urges Gambling Commissions to Eliminate Prop Bets", url: "https://www.ncaa.org/news/2026/1/15/media-center-ncaa-urges-gambling-commissions-to-eliminate-prop-bets.aspx", category: "Article", readingType: "required", notes: "" },
            // Week 1: Highly Recommended
            { id: "r_w1_coppins", title: "My Year as a Degenerate Sports Gambler", url: "https://www.theatlantic.com/magazine/2026/04/online-sports-betting-app-addiction/686061/", category: "Article", readingType: "highly_recommended", notes: "McKay Coppins, The Atlantic 2026" },
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
            { id: "r_w4_ch5", title: "Communication and Sport, Chapter 5: Legacy Media Interactions", url: "", category: "Book Chapter", readingType: "required", notes: "Fishbowl reading" },
            { id: "r_w4_ch6", title: "Communication and Sport, Chapter 6: Social and User-Generated Media Interactions", url: "", category: "Book Chapter", readingType: "required", notes: "Fishbowl reading" },
            { id: "r_w4_ch7", title: "Communication and Sport, Chapter 7: Sport and Mythology", url: "", category: "Book Chapter", readingType: "required", notes: "Fishbowl reading" },
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
            { id: "r_w5_softball", title: "Is Softball Sexist?", url: "https://www.nytimes.com/2014/06/07/opinion/is-softball-sexist.html", category: "Article", readingType: "required", notes: "Fishbowl reading, Monday" },
            { id: "r_w5_winter", title: "Why Some Winter Olympic Sports Are Faster, Higher, Stronger", url: "https://deadspin.com/why-some-winter-olympic-sports-are-faster-higher-str-1823153425/", category: "Article", readingType: "required", notes: "Fishbowl reading, Monday, gender angle" },
            { id: "r_w5_ugly", title: "When the Beautiful Game Turns Ugly", url: "https://www.espn.com/espn/feature/story/_/id/9338962/when-beautiful-game-turns-ugly", category: "Article", readingType: "required", notes: "Fishbowl reading, Monday, racism in Italian soccer" },
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
              { readingId: "r_w1_coppins", type: "highly_recommended" },
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
              { readingId: "r_w4_ch5", type: "required" },
              { readingId: "r_w4_ch6", type: "required" },
              { readingId: "r_w4_ch7", type: "required" },
            ],
            "Apr 27": [ // Week 5 Mon (Fishbowl - gender/race)
              { readingId: "r_w5_softball", type: "required" },
              { readingId: "r_w5_winter", type: "required" },
              { readingId: "r_w5_ugly", type: "required" },
            ],
            "Apr 29": [ // Week 5 Wed
              { readingId: "r_w5_whiteman", type: "required" },
              { readingId: "r_w5_ch11", type: "required" },
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
          d._readingsMigV1 = true;
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

  if (!userName) return <NamePicker data={data} onSelect={name => { setUserName(name); setView(name === GUEST_NAME ? "leaderboard" : "todo"); }} />;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT_PRIMARY, fontFamily: F, fontSize: 15 }}>
      <Nav view={view} setView={setView} isAdmin={isAdmin} isGuest={isGuest} userName={displayName} onLogout={() => setUserName(null)} />
      {view === "schedule" && <ScheduleView data={data} setData={setData} isAdmin={isAdmin} />}
      {view === "todo" && !isGuest && <ToDoView data={data} setData={setData} userName={userName} isAdmin={isAdmin} />}
      {view === "leaderboard" && <Leaderboard students={data.students} log={data.log} teams={data.teams} isAdmin={isAdmin} userName={userName} data={data} />}
      {view === "teams" && !isGuest && <TeamsView teams={data.teams} students={data.students} log={data.log} data={data} />}
      {view === "roster" && !isGuest && <RosterView data={data} setData={setData} userName={userName} />}
      {view === "assignments" && !isGuest && <AssignmentsView data={data} setData={setData} isAdmin={isAdmin} userName={userName} setView={setView} />}
      {view === "readings" && !isGuest && <ReadingsView data={data} setData={setData} isAdmin={isAdmin} />}
      {view === "classtools" && !isGuest && <ClassTools data={data} setData={setData} isAdmin={isAdmin} userName={userName} />}
      {view === "grades" && isAdmin && <Gradebook data={data} setData={setData} userName={userName} isAdmin={isAdmin} />}
      {view === "builder" && isAdmin && <TeamBuilder data={data} setData={setData} />}
      {view === "pti" && isAdmin && <PTIMode data={data} setData={setData} />}
      {view === "gameadmin" && isAdmin && <GameAdmin data={data} setData={setData} />}
      {view === "fishbowl" && isAdmin && <GameAdmin data={data} setData={setData} />}
      {view === "answer" && !isGuest && <StudentAnswerView data={data} setData={setData} userName={userName} />}
      {view === "accolades" && !isGuest && <Accolades data={data} />}
      {view === "admin" && isAdmin && <AdminPanel data={data} setData={setData} />}
      {isGuest && view !== "leaderboard" && view !== "schedule" && <Leaderboard students={data.students} log={data.log} teams={data.teams} isAdmin={false} userName={userName} data={data} />}
      {(view === "builder" || view === "admin" || view === "gameadmin" || view === "fishbowl" || view === "pti") && !isAdmin && !isGuest && <Leaderboard students={data.students} log={data.log} teams={data.teams} isAdmin={isAdmin} userName={userName} data={data} />}
    </div>
  );
}
