import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "comm118-game-v13";

const POINT_SOURCES = ["Weekly Team Quiz","Real or Fake","Assignment","Friday Response","Channel Switch","Participation","Bonus","Other"];

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

const MISMATCHED_NAMES = ["New York Cowboys","Dallas Sharks","Miami Penguins","Phoenix Mariners","Detroit Flamingos","Las Vegas Moose","Boston Gators","Seattle Cactus"];

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

function Toast({ message }) { if (!message) return null; return <div style={{ position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)", background: "#1e293b", color: "#fff", padding: "10px 24px", borderRadius: 12, fontWeight: 600, zIndex: 100, fontFamily: F, fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>{message}</div>; }

/* ─── NAV ─── */
function Nav({ view, setView, isAdmin, userName, onLogout }) {
  const tabs = [
    { id: "schedule", label: "Schedule", admin: false },
    { id: "leaderboard", label: "Leaderboard", admin: false },
    { id: "teams", label: "Teams", admin: false },
    { id: "roster", label: "Roster", admin: false },
    { id: "pti", label: "PTI", admin: true },
    { id: "livequiz", label: "Live Quiz", admin: true },
    { id: "answer", label: "Answer", admin: false },
    { id: "builder", label: "Draft", admin: true },
    { id: "admin", label: "Admin", admin: true },
  ];
  return (
    <div style={{ background: "linear-gradient(to right, #1e293b, #334155)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", fontFamily: F }}>Comm and Sport</div>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
        {tabs.filter(t => !t.admin || isAdmin).map(t => (
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
  const names = data ? data.students.map(s => s.name).sort(lastSort) : [...ALL_STUDENTS].sort(lastSort);
  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT_PRIMARY, fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 420, width: "100%" }}>
        <div style={{ background: "linear-gradient(135deg, #1e293b, #334155)", borderRadius: 16, padding: "32px 24px", marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}>Communication and Sport</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 500, marginTop: 4 }}>COMM 118 - Ishak / Santa Clara University</div>
        </div>
        <div style={{ ...crd, padding: "12px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.6, textAlign: "center" }}>This app is our class hub: schedule, leaderboard, quizzes, and team standings. Select your name to get started.</div>
        </div>
        <div style={{ ...crd, padding: 4 }}>
          {names.map(name => (
            <button key={name} onClick={() => onSelect(name)} style={{
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

  return (
    <div style={{ padding: "20px 16px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...sectionLabel, marginBottom: 8 }}>Schedule</div>
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
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input value={week.label} onChange={e => updateWeek(wi, "label", e.target.value)} placeholder="Label" style={{ ...inp, padding: "4px 8px", fontSize: 12, width: 90 }} />
                      <input value={week.theme} onChange={e => updateWeek(wi, "theme", e.target.value)} placeholder="Theme" style={{ ...inp, padding: "4px 8px", fontSize: 12, flex: 1 }} />
                    </div>
                    <input value={week.question || ""} onChange={e => updateWeek(wi, "question", e.target.value)} placeholder="Driving question" style={{ ...inp, padding: "4px 8px", fontSize: 12 }} onBlur={() => setEditWeek(null)} />
                  </div>
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
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <input value={d.date} onChange={e => updateDate(wi, realDi, "date", e.target.value)} style={{ ...inp, padding: "3px 6px", fontSize: 11, width: 60 }} />
                            <input value={d.day} onChange={e => updateDate(wi, realDi, "day", e.target.value)} style={{ ...inp, padding: "3px 6px", fontSize: 11, width: 40 }} />
                            <label style={{ fontSize: 10, color: TEXT_MUTED, display: "flex", alignItems: "center", gap: 2 }}><input type="checkbox" checked={!!d.holiday} onChange={e => updateDate(wi, realDi, "holiday", e.target.checked)} />Off</label>
                          </div>
                          <input value={d.topic} onChange={e => updateDate(wi, realDi, "topic", e.target.value)} placeholder="Topic" style={{ ...inp, padding: "4px 6px", fontSize: 12 }} />
                          <input value={d.assignment || ""} onChange={e => updateDate(wi, realDi, "assignment", e.target.value)} placeholder="Due" style={{ ...inp, padding: "3px 6px", fontSize: 11 }} />
                          <input value={d.notes || ""} onChange={e => updateDate(wi, realDi, "notes", e.target.value)} placeholder="Notes" style={{ ...inp, padding: "3px 6px", fontSize: 11 }} />
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => setEditCell(null)} style={{ ...bt, fontSize: 10, padding: "3px 10px", background: ACCENT, color: "#fff" }}>Done</button>
                            <button onClick={() => { removeDate(wi, realDi); setEditCell(null); }} style={{ ...bt, fontSize: 10, padding: "3px 10px", background: "transparent", color: RED, border: "1px solid " + RED + "33" }}>X</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {isHoliday ? (
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#db2777" }}>{d.notes || "No class"}</div>
                          ) : (
                            <>
                              <div style={{ fontSize: 13, color: TEXT_PRIMARY, lineHeight: 1.35 }}>{d.topic || <span style={{ color: TEXT_MUTED, fontStyle: "italic" }}>—</span>}</div>
                              {d.assignment && <div style={{ fontSize: 11, color: "#ea580c", marginTop: 3, fontWeight: 600 }}>{d.assignment}</div>}
                              {d.notes && !isHoliday && <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{d.notes}</div>}
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
function Leaderboard({ students, log, teams, isAdmin, userName }) {
  const ranked = rs(students, log);
  const mx = ranked.length > 0 ? Math.max(ranked[0].points, 1) : 1;
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? ranked : ranked.slice(0, 10);
  const myRank = ranked.findIndex(s => s.name === userName);
  const meInVisible = myRank >= 0 && myRank < visible.length;
  const meData = myRank >= 0 ? ranked[myRank] : null;

  const renderRow = (s, i, isMe, isGhost) => {
    const team = teams.find(t => t.id === s.teamId);
    const tc = team ? TEAM_COLORS[team.colorIdx] : TEAM_COLORS[0];
    const inA = i < 5;
    const isTop3 = i < 3;
    const bw = mx > 0 ? Math.max((s.points / mx) * 100, 2) : 2;
    return (
      <div key={s.id + (isGhost ? "-ghost" : "")} style={{
        borderRadius: 12, overflow: "hidden", marginBottom: 6, background: "#fff",
        border: isGhost ? "2px dashed #93c5fd" : inA ? "2px solid #fecdd3" : "1px solid #f3f4f6",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            fontSize: 12, fontWeight: 900, fontFamily: F,
            background: isTop3 ? "#111827" : inA ? ACCENT : "#f3f4f6",
            color: isTop3 || inA ? "#fff" : "#6b7280",
          }}>{i + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: tc.accent, flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#111827", fontFamily: F }}>{s.name}</span>
              {isMe && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#dbeafe", color: "#1d4ed8", fontWeight: 700 }}>YOU</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              {team && <span style={{ fontSize: 11, color: "#9ca3af" }}>{team.name}</span>}
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{s.points} pts</span>
            </div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: inA ? ACCENT : "#111827", fontFamily: F, fontVariantNumeric: "tabular-nums" }}>{s.points}</div>
        </div>
        <div style={{ height: 3, background: "#f3f4f6" }}>
          <div style={{ height: "100%", width: bw + "%", background: inA ? ACCENT : tc.accent, transition: "width 0.5s", borderRadius: "0 2px 2px 0" }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...sectionLabel, marginBottom: 8 }}>Leaderboard</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: ACCENT }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>A Zone — Top 5</span>
          </div>
        </div>
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
function TeamsView({ teams, students, log }) {
  const ranked = rt(teams, students, log);
  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 12 }}>Team Standings</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {ranked.map((team, i) => {
            const tc = TEAM_COLORS[team.colorIdx];
            const members = students.filter(s => s.teamId === team.id).map(m => ({ ...m, points: gp(log, m.id) })).sort((a, b) => b.points - a.points);
            return (
              <div key={team.id} style={{ borderRadius: 16, border: "1px solid #f3f4f6", overflow: "hidden", background: "#fff" }}>
                <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 900, flexShrink: 0 }}>#{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{team.name}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{members.length} players</div>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#111827", fontVariantNumeric: "tabular-nums" }}>{team.points}</div>
                </div>
                <div style={{ padding: "0 16px 12px" }}>
                  {members.map(m => (
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
  const [mode, setMode] = useState("points");
  const [selected, setSelected] = useState([]);
  const [selTeam, setSelTeam] = useState("");
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState(POINT_SOURCES[0]);
  const [customSrc, setCustomSrc] = useState("");
  const [msg, setMsg] = useState("");
  const [newName, setNewName] = useState("");
  const [newTeamId, setNewTeamId] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2500); };

  const award = async (sids, p, src) => { const entries = sids.map(sid => ({ id: genId(), studentId: sid, amount: p, source: src, ts: Date.now() })); const updated = { ...data, log: [...data.log, ...entries] }; await saveData(updated); setData(updated); };
  const awardInd = async () => { if (!selected.length || !amount) return; const p = parseInt(amount); if (isNaN(p)) return; const src = source === "Other" ? customSrc || "Other" : source; await award(selected, p, src); showMsg((p > 0 ? "+" : "") + p + " to " + selected.length + " student(s)"); setSelected([]); setAmount(""); };
  const awardTeam = async () => { if (!selTeam || !amount) return; const p = parseInt(amount); if (isNaN(p)) return; const src = source === "Other" ? customSrc || "Other" : source; const ids = data.students.filter(s => s.teamId === selTeam).map(s => s.id); await award(ids, p, src); showMsg((p > 0 ? "+" : "") + p + " to whole team"); setSelTeam(""); setAmount(""); };
  const undo = async () => { if (!data.log.length) return; const lastTs = data.log[data.log.length - 1].ts; const updated = { ...data, log: data.log.filter(e => e.ts !== lastTs) }; await saveData(updated); setData(updated); showMsg("Undone"); };
  const resetAll = async () => { const updated = { ...data, log: [] }; await saveData(updated); setData(updated); showMsg("Reset"); };
  const toggle = id => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleTeamSel = tid => { const ids = data.students.filter(s => s.teamId === tid).map(s => s.id); const all = ids.every(id => selected.includes(id)); setSelected(p => all ? p.filter(id => !ids.includes(id)) : [...new Set([...p, ...ids])]); };
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
        {["points", "roster", "log"].map(m => (
          <button key={m} onClick={() => setMode(m)} style={mode === m ? pillActive : pillInactive}>{m === "points" ? "Award Points" : m === "roster" ? "Roster" : "Log"}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={undo} style={pillInactive}>Undo</button>
        <button onClick={() => { if (window.confirm("Reset ALL points?")) resetAll(); }} style={{ ...pill, background: "#fef2f2", color: RED }}>Reset</button>
      </div>

      {mode === "points" && (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
          <div style={{ ...crd, padding: 16 }}>
            <div style={{ ...sectionLabel, marginBottom: 14 }}>Individual</div>
            {data.teams.map(team => { const tc = TEAM_COLORS[team.colorIdx]; const members = data.students.filter(s => s.teamId === team.id); return (<div key={team.id} style={{ marginBottom: 10 }}><button onClick={() => toggleTeamSel(team.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, color: tc.accent, marginBottom: 4, display: "block", fontFamily: F }}>{team.name}</button><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{members.map(s => (<button key={s.id} onClick={() => toggle(s.id)} style={{ ...bt, fontSize: 12, padding: "4px 10px", background: selected.includes(s.id) ? tc.accent : "transparent", color: selected.includes(s.id) ? "#000" : TEXT_SECONDARY, border: "1px solid " + (selected.includes(s.id) ? tc.accent : BORDER) }}>{s.name.split(" ")[0]}</button>))}</div></div>); })}
            <div style={{ display: "flex", gap: 8, marginTop: 12, marginBottom: 8 }}><input type="number" placeholder="Pts" value={amount} onChange={e => setAmount(e.target.value)} style={{ ...inp, flex: 1 }} /><select value={source} onChange={e => setSource(e.target.value)} style={{ ...sel, flex: 1 }}>{POINT_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            {source === "Other" && <input placeholder="Custom" value={customSrc} onChange={e => setCustomSrc(e.target.value)} style={{ ...inp, marginBottom: 8 }} />}
            <button onClick={awardInd} style={{ ...bt, background: "#111827", color: "#fff", width: "100%" }}>Award</button>
          </div>
          <div style={{ ...crd, padding: 16 }}>
            <div style={{ ...sectionLabel, marginBottom: 14 }}>Team</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>{data.teams.map(team => { const tc = TEAM_COLORS[team.colorIdx]; return <button key={team.id} onClick={() => setSelTeam(team.id)} style={{ ...bt, fontSize: 13, padding: "8px 14px", textAlign: "left", background: selTeam === team.id ? tc.accent + "20" : "transparent", color: selTeam === team.id ? tc.accent : TEXT_SECONDARY, border: "1px solid " + (selTeam === team.id ? tc.accent : BORDER) }}>{team.name}</button>; })}</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}><input type="number" placeholder="Pts" value={amount} onChange={e => setAmount(e.target.value)} style={{ ...inp, flex: 1 }} /><select value={source} onChange={e => setSource(e.target.value)} style={{ ...sel, flex: 1 }}>{POINT_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            {source === "Other" && <input placeholder="Custom" value={customSrc} onChange={e => setCustomSrc(e.target.value)} style={{ ...inp, marginBottom: 8 }} />}
            <button onClick={awardTeam} style={{ ...bt, background: "#111827", color: "#fff", width: "100%" }}>Award Whole Team</button>
          </div>
        </div>
      )}

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

  const awardPTI = async (sid, amount) => {
    const student = data.students.find(s => s.id === sid);
    const entry = { id: genId(), studentId: sid, amount, source: "Culture Points", ts: Date.now() };
    const updated = { ...data, log: [...data.log, entry] };
    await saveData(updated); setData(updated);
    setPopup(null);
    showMsg((amount > 0 ? "+" : "") + amount + " " + (student?.name?.split(" ")[0] || ""));
  };

  return (
    <div style={{ padding: "20px 16px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 12 }}>Culture Points</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
          {[...data.students].sort(lastSortObj).map(s => {
            const team = data.teams.find(t => t.id === s.teamId);
            const tc = team ? TEAM_COLORS[team.colorIdx] : TEAM_COLORS[0];
            const pts = gp(data.log, s.id);
            const isOpen = popup === s.id;
            const initials = s.name.split(" ").map(n => n[0]).join("");
            return (
              <div key={s.id} style={{ position: "relative" }}>
                <button onClick={() => setPopup(isOpen ? null : s.id)} style={{
                  width: "100%", padding: "12px 8px", borderRadius: 12, background: "#fff",
                  border: isOpen ? "2px solid " + tc.accent : "1px solid #f3f4f6",
                  cursor: "pointer", textAlign: "center", transition: "all 0.1s",
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px", fontSize: 12, fontWeight: 900, color: "#fff" }}>{initials}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{s.name.split(" ")[0]}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>{s.name.split(" ").slice(1).join(" ")}</div>
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
        <div style={{ ...sectionLabel, textAlign: "center", marginBottom: 16 }}>Quiz</div>
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
  { key: "funFact", label: "Fun Fact", type: "text", placeholder: "Something unexpected..." },
];

// Placeholder: replace SUPABASE_URL and SUPABASE_KEY with real values
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_KEY = "YOUR_ANON_KEY";

async function uploadPhoto(file, studentId) {
  // Placeholder for Supabase storage upload
  // When ready: POST to SUPABASE_URL/storage/v1/object/photos/{studentId}
  // For now, convert to base64 data URL and store in shared storage
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
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
            {isOwn && (
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
            {bio.about || bio.major || bio.year || bio.hometown || bio.favTeam || bio.funFact ? (
              <>
                {bio.about && <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.5, marginBottom: 12 }}>{bio.about}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {bio.major && <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Major</div><div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{bio.major}</div></div>}
                  {bio.year && <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Year</div><div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{bio.year}</div></div>}
                  {bio.hometown && <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Hometown</div><div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{bio.hometown}</div></div>}
                  {bio.favTeam && <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Fav Team</div><div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{bio.favTeam}</div></div>}
                </div>
                {bio.funFact && <div style={{ marginTop: 10 }}><div style={{ ...sectionLabel, marginBottom: 2 }}>Fun Fact</div><div style={{ fontSize: 13, color: "#374151" }}>{bio.funFact}</div></div>}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#9ca3af", fontSize: 13 }}>
                {isOwn ? "You haven't filled out your bio yet." : "This person hasn't filled out their bio yet."}
              </div>
            )}
            {isOwn && <button onClick={() => { setForm({ ...bio }); setEditing(true); }} style={{ ...pillInactive, width: "100%", marginTop: 12, padding: "10px 0" }}>Edit Bio</button>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── APP ─── */
export default function Comm118() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("schedule");
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
          const teams = MISMATCHED_NAMES.slice(0, 6).map((name, i) => ({ id: genId(), name, colorIdx: i }));
          const students = shuffled.map((name, i) => ({ id: genId(), name, teamId: teams[i % 6].id }));
          d = { teams, students, log: [], schedule: JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)), bios: {} };
          await saveData(d);
        }
        if (d && !d.schedule) { d.schedule = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)); await saveData(d); }
        if (d && !d.bios) { d.bios = {}; await saveData(d); }
        setData(d);
      } catch(e) { console.error("Storage load failed:", e); setData(null); }
      setLoading(false);
    })();
    const iv = setInterval(refresh, 5000); return () => clearInterval(iv);
  }, [refresh]);

  if (loading) return <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>Loading...</div></div>;

  if (!userName) return <NamePicker data={data} onSelect={name => { setUserName(name); setView("schedule"); }} />;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT_PRIMARY, fontFamily: F, fontSize: 15 }}>
      <Nav view={view} setView={setView} isAdmin={isAdmin} userName={displayName} onLogout={() => setUserName(null)} />
      {view === "schedule" && <ScheduleView data={data} setData={setData} isAdmin={isAdmin} />}
      {view === "leaderboard" && <Leaderboard students={data.students} log={data.log} teams={data.teams} isAdmin={isAdmin} userName={userName} />}
      {view === "teams" && <TeamsView teams={data.teams} students={data.students} log={data.log} />}
      {view === "roster" && <RosterView data={data} setData={setData} userName={userName} />}
      {view === "builder" && isAdmin && <TeamBuilder data={data} setData={setData} />}
      {view === "pti" && isAdmin && <PTIMode data={data} setData={setData} />}
      {view === "livequiz" && isAdmin && <LiveQuizAdmin data={data} setData={setData} />}
      {view === "answer" && !isGuest && <StudentAnswer data={data} setData={setData} userName={userName} />}
      {view === "answer" && isGuest && <div style={{ padding: 40, textAlign: "center", fontFamily: F }}><div style={{ ...sectionLabel, marginBottom: 8 }}>Quiz</div><div style={{ fontSize: 14, color: TEXT_SECONDARY }}>Sign in as a student to answer quizzes.</div></div>}
      {view === "admin" && isAdmin && <AdminPanel data={data} setData={setData} />}
      {view === "quiz" && isAdmin && <QuizMode data={data} setData={setData} />}
      {(view === "builder" || view === "admin" || view === "quiz" || view === "pti" || view === "livequiz") && !isAdmin && <Leaderboard students={data.students} log={data.log} teams={data.teams} />}
    </div>
  );
}
