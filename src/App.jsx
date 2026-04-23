import { useState, useEffect } from "react";
import Comm118 from "./Comm118.jsx";
import Comm4 from "./Comm4.jsx";
import Comm2 from "./Comm2.jsx";

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
                <a href={c.path} style={{ textDecoration: "none", display: "block" }} onClick={e => { e.preventDefault(); window.history.pushState({}, "", c.path); window.dispatchEvent(new PopStateEvent("popstate")); }}>
                  <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: "1px solid #e8e8ec", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", cursor: "pointer", transition: "all 0.15s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: c.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ color: "#fff", fontSize: 14, fontWeight: 800, letterSpacing: "-0.02em" }}>{c.code.split(" ")[1]}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: c.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{c.code}</div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: "#18181b", lineHeight: 1.3 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 3 }}>{c.desc}</div>
                      </div>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4d4d8" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                  </div>
                </a>
              ) : (
                <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: "1px solid #e8e8ec", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "#e4e4e7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: "#a1a1aa", fontSize: 14, fontWeight: 800 }}>{c.code.split(" ")[1]}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{c.code}</div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: "#a1a1aa", lineHeight: 1.3 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "#d4d4d8", marginTop: 3 }}>Coming soon</div>
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
