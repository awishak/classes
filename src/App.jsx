import { useState, useEffect } from "react";
import Comm118 from "./Comm118.jsx";

const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const CLASSES = [
  {
    id: "comm118",
    path: "/comm118",
    name: "Communication and Sport",
    code: "COMM 118",
    quarter: "Spring 2026",
    desc: "Sports touch everything. Follow the money, the media, the identity, and the community.",
    color: "#9f1239",
    ready: true,
  },
  {
    id: "public-speaking",
    path: "/public-speaking",
    name: "Public Speaking",
    code: "COMM 20",
    quarter: "Spring 2026",
    desc: "Do the reps. 15 deliverables. Find your voice.",
    color: "#2563eb",
    ready: false,
  },
  {
    id: "comm-research",
    path: "/comm-research",
    name: "Approaches to Communication Research",
    code: "COMM 110",
    quarter: "Spring 2026",
    desc: "How do we study communication? Methods, frameworks, and practice.",
    color: "#059669",
    ready: false,
  },
];

function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: F }}>
      <div style={{ background: "linear-gradient(135deg, #1e293b, #334155)", padding: "48px 24px 52px", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Santa Clara University</div>
        <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>Andrew Ishak</div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>Department of Communication</div>
      </div>

      <div style={{ maxWidth: 560, margin: "-28px auto 0", padding: "0 20px 60px", position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {CLASSES.map(c => (
            <div key={c.id} style={{ opacity: c.ready ? 1 : 0.5 }}>
              {c.ready ? (
                <a href={c.path} style={{
                  display: "block", textDecoration: "none", color: "inherit",
                  background: "#fff", borderRadius: 16, border: "1px solid #f3f4f6",
                  overflow: "hidden", transition: "box-shadow 0.15s, border-color 0.15s",
                  cursor: "pointer",
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#f3f4f6"; }}
                >
                  <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14, background: c.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, fontWeight: 900, color: "#fff", flexShrink: 0,
                    }}>
                      {c.code.split(" ")[1]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{c.code} / {c.quarter}</div>
                      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4, lineHeight: 1.4 }}>{c.desc}</div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </a>
              ) : (
                <div style={{
                  background: "#fff", borderRadius: 16, border: "1px solid #f3f4f6",
                  overflow: "hidden", cursor: "default",
                }}>
                  <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14, background: "#e5e7eb",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, fontWeight: 900, color: "#9ca3af", flexShrink: 0,
                    }}>
                      {c.code.split(" ")[1]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#9ca3af" }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "#d1d5db", marginTop: 2 }}>{c.code} / {c.quarter}</div>
                      <div style={{ fontSize: 12, color: "#d1d5db", marginTop: 4, fontStyle: "italic" }}>Coming soon</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 32, fontSize: 11, color: "#9ca3af" }}>
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

  if (path === "/comm118" || path === "/comm118/") {
    return <Comm118 />;
  }

  return <LandingPage />;
}
