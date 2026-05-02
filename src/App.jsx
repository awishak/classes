import { useState, useEffect } from "react";
import Comm118 from "./Comm118.jsx";
import Comm4 from "./Comm4.jsx";
import Comm2 from "./Comm2.jsx";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";

const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#4b5563";
const TEXT_MUTED = "#9ca3af";
const BORDER = "#f3f4f6";
const BORDER_STRONG = "#e5e7eb";

const sectionLabel = { fontSize: 10, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: F };

const CLASSES = [
  {
    id: "comm118",
    path: "/comm118",
    name: "Communication and Sport",
    code: "COMM 118",
    quarter: "Spring 2026",
    desc: "MWF 8:00 to 9:05 am · Vari 128",
    color: "#9f1239",
    ready: true,
  },
  {
    id: "comm2",
    path: "/comm2",
    name: "Public Speaking",
    code: "COMM 2",
    quarter: "Spring 2026",
    desc: "MWF 9:15 to 10:20 am · Vari 128",
    color: "#2563eb",
    ready: true,
  },
  {
    id: "comm4",
    path: "/comm4",
    name: "Approaches to Communication Research",
    code: "COMM 4",
    quarter: "Spring 2026",
    desc: "MWF 11:45 am to 12:50 pm · Lucas 207",
    color: "#059669",
    ready: true,
  },
];

function LandingPage() {
  const navigate = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf9", fontFamily: F }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 20px 60px" }}>

        {/* Centered plain-text header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: TEXT_MUTED, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Santa Clara University</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.02em", lineHeight: 1.15 }}>Andrew Ishak</div>
          <div style={{ fontSize: 14, color: TEXT_SECONDARY, marginTop: 4 }}>Department of Communication</div>
        </div>

        {/* Class cards */}
        <div style={{ ...sectionLabel, marginBottom: 10 }}>Spring 2026</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {CLASSES.map(c => {
            const codeShort = c.code.split(" ")[1];
            if (!c.ready) {
              return (
                <div key={c.id} style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", border: "1px solid " + BORDER, opacity: 0.55, fontFamily: F }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 11, background: "#e4e4e7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: "#a1a1aa", fontSize: 13, fontWeight: 700, letterSpacing: "-0.02em" }}>{codeShort}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{c.code}</div>
                      <div style={{ fontSize: 16, fontWeight: 500, color: TEXT_MUTED, lineHeight: 1.25, letterSpacing: "-0.01em" }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 3 }}>Coming soon</div>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <button
                key={c.id}
                onClick={() => navigate(c.path)}
                style={{
                  background: "#fff", borderRadius: 14, padding: "14px 16px",
                  border: "1px solid " + BORDER_STRONG,
                  cursor: "pointer", fontFamily: F, width: "100%", textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: c.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "#fff", fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>{codeShort}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: c.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{c.code}</div>
                    <div style={{ fontSize: 17, fontWeight: 500, color: TEXT_PRIMARY, lineHeight: 1.25, letterSpacing: "-0.01em" }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 3 }}>{c.desc}</div>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 8,
                    border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_PRIMARY,
                    flexShrink: 0,
                  }}>Open</span>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: 32, fontSize: 11, color: TEXT_MUTED }}>
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

  return <LandingPage />;
}
