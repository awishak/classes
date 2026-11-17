// The audio story review page, to read with no connection: the same
// component the site draws, fed from a file beside the page instead of the
// server. Built by scripts/comm3-audio-story-offline.mjs into a folder that
// opens from disk. Andrew, 2026-11-16: "i want to review all this on the
// plane tomorrow on a different machine."
//
// Everything the page asks the server for is answered here from
// window.OFFLINE (data.js in the same folder): the sheets, Claude's read, the
// due date, and each story's audio as a file in clips/. Nothing is sent
// anywhere and nothing can be saved; the unlock buttons do nothing.
import { createRoot } from "react-dom/client";
import comm3 from "../src/config/comm3.js";
import { AudioStoryReview } from "../src/engine/audiostory/storypages.jsx";
import { ThemeStyle } from "../src/engine/ThemeShell.jsx";
import * as TOKENS from "../src/engine/tokens.js";

const O = window.OFFLINE;
const json = (o) => new Response(JSON.stringify(o), { status: 200, headers: { "Content-Type": "application/json" } });
window.fetch = async (url, opts = {}) => {
  const u = String(url && url.url ? url.url : url);
  if (u.includes("/api/worksheet-submits")) {
    let b = {}; try { b = JSON.parse(opts.body || "{}"); } catch { b = {}; }
    if (b.all) return json({ ok: true, sheets: O.sheets });
    if (b.reports) return json({ ok: true, reports: [] });
    if (b.sign) return json({ ok: true, urls: Object.fromEntries(b.sign.map(p => [p, O.files[p] || ""]).filter(x => x[1])) });
    return json({ ok: false, error: "This copy is for reading. Nothing can be changed here." });
  }
  if (u.includes("/api/sitdown-sheet")) return json(O.read);
  if (u.includes("worksheet_deadlines")) return json([{ due_at: O.due }]);
  return json([]);
};
// No live connection to wait on.
window.WebSocket = class { constructor() { this.readyState = 3; } close() {} send() {} addEventListener() {} removeEventListener() {} };

createRoot(document.getElementById("root")).render(
  <div data-theme="clean" data-mode="day" style={{ minHeight: "100vh", background: TOKENS.SURFACE.page, color: TOKENS.TEXT.primary, fontFamily: TOKENS.FONT.body }}>
    <ThemeStyle theme="clean" />
    <AudioStoryReview config={comm3} worksheetKey="audio-story" roster={O.roster} />
  </div>
);
