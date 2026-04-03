import { useState, useEffect } from "react";
import Comm118 from "./Comm118.jsx";
import Comm4 from "./Comm4.jsx";
import Comm2 from "./Comm2.jsx";
import AdminDash from "./AdminDash.jsx";

const F = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";

const CLASSES = [
  {
    id: "comm118",
    path: "/comm118",
    name: "Communication and Sport",
    code: "COMM 118",
    quarter: "Spring 2026",
    desc: "MWF 8:00 to 9:05 am / Vari 128",
    color: "#9f1239",
    ready: true,
  },
  {
    id: "comm2",
    path: "/comm2",
    name: "Public Speaking",
    code: "COMM 2",
    quarter: "Spring 2026",
    desc: "MWF 9:15 to 10:20 am / Vari 128",
    color: "#2563eb",
    ready: true,
  },
  {
    id: "comm4",
    path: "/comm4",
    name: "Approaches to Communication Research",
    code: "COMM 4",
    quarter: "Spring 2026",
    desc: "MWF 11:45 am to 12:50 pm / Lucas 207",
    color: "#059669",
    ready: true,
  },
];

function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f8", fontFamily: F }}>
      <div style={{ background: "#9f1239", padding: "48px 24px 52px", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Santa Clara University</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Andrew Ishak</div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>Department of Communication</div>
      </div>

      <div style={{ maxWidth: 560, margin: "-28px auto 0", padding: "0 20px 60px", position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {CLASSES.map(c => (
            <div key={c.id} style={{ opacity: c.ready ? 1 : 0.5 }}>
              {c.ready ? (
                <a href={c.path} style={{
                  display: "block", textDecoration: "none", color: "inherit",
                  background: "#fff", borderRadius: 16, border: "1px solid #e8e8ec",
                  overflow: "hidden", transition: "box-shadow 0.15s, border-color 0.15s",
                  cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)"; e.currentTarget.style.borderColor = "#d4d4d8"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#e8e8ec"; }}
                >
                  <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14, background: c.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, fontWeight: 800, color: "#fff", flexShrink: 0,
                    }}>
                      {c.code.split(" ")[1]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#18181b" }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 2 }}>{c.code} / {c.quarter}</div>
                      <div style={{ fontSize: 13, color: "#52525b", marginTop: 4, lineHeight: 1.4 }}>{c.desc}</div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </a>
              ) : (
                <div style={{
                  background: "#fff", borderRadius: 16, border: "1px solid #e8e8ec",
                  overflow: "hidden", cursor: "default", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}>
                  <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14, background: "#e4e4e7",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, fontWeight: 800, color: "#a1a1aa", flexShrink: 0,
                    }}>
                      {c.code.split(" ")[1]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#a1a1aa" }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "#d4d4d8", marginTop: 2 }}>{c.code} / {c.quarter}</div>
                      <div style={{ fontSize: 12, color: "#d4d4d8", marginTop: 4, fontStyle: "italic" }}>Coming soon</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 32, fontSize: 11, color: "#a1a1aa" }}>
          aishak@scu.edu
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (path === "/comm118" || path === "/comm118/") document.title = "COMM 118 Hub - Spring 2026";
    else if (path === "/comm4" || path === "/comm4/") document.title = "COMM 4 Hub - Spring 2026";
    else if (path === "/comm2" || path === "/comm2/") document.title = "COMM 2 Hub - Spring 2026";
    else if (path === "/dashboard" || path === "/dashboard/") document.title = "Admin Dashboard - Spring 2026";
    else document.title = "Ishak Classes";
  }, [path]);

  if (path === "/comm118" || path === "/comm118/") {
    return <Comm118 />;
  }

  if (path === "/comm4" || path === "/comm4/") {
    return <Comm4 />;
  }

  if (path === "/comm2" || path === "/comm2/") {
    return <Comm2 />;
  }

  if (path === "/dashboard" || path === "/dashboard/") {
    return <AdminDash />;
  }

  return <LandingPage />;
}
