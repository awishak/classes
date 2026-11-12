// Name the sources on COMM 3's audio story pre-production. Students paste
// bare addresses; Andrew, 2026-11-12: "can you tell me what their sources are
// besides the urls?" This reads every sheet's sources, asks each address for
// its page title and site name, and adds { links: { [url]: { site, title } } }
// to Claude's read in the private instructor bucket (the file
// comm3-audio-pre-read-push.mjs writes), where the review page finds them.
// An address that does not answer keeps its host name and nothing else.
//
//   node scripts/comm3-audio-pre-links.mjs           prints
//   node scripts/comm3-audio-pre-links.mjs --write   uploads

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { answersOf } from "../src/engine/worktopia/store.js";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key };
const BASE = homedir() + "/Projects/audio-pre-grading";
const PATH = "instructor/comm3-audio-pre-read.json";
const CACHE = BASE + "/links.json";
const get = async (q) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(`read ${q}: ${r.status}`); return r.json(); };

const got = await fetch(`${SUPABASE_URL}/storage/v1/object/${PATH}`, { headers: H });
if (!got.ok) throw new Error("no read file: " + got.status);
const read = await got.json();
writeFileSync(BASE + "/read.json", JSON.stringify(read, null, 1));

const sheets = await get(`worksheet_sheets?worksheet_key=eq.audio-pre&group_key=eq.comm3&select=id,viewer_id&limit=1000`);
const ids = sheets.map(s => s.id);
const rows = [];
for (let i = 0; i < ids.length; i += 60) for (let offset = 0; ; offset += 1000) {
  const page = await get(`worksheet_answers?select=sheet_id,field,value,position&field=eq.sources&sheet_id=in.(${ids.slice(i, i + 60).join(",")})&order=id&offset=${offset}&limit=1000`);
  rows.push(...page);
  if (page.length < 1000) break;
}
const sources = {};
for (const s of sheets) sources[s.viewer_id] = answersOf(rows.filter(x => x.sheet_id === s.id)).sources || "";
writeFileSync(BASE + "/sources.json", JSON.stringify(sources, null, 1));

export const urlsIn = (text) => (String(text || "").match(/https?:\/\/[^\s<>")\]]+/g) || []).map(u => u.replace(/[.,;]+$/, ""));
const urls = [...new Set(Object.values(sources).flatMap(urlsIn))];
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
const un = (s) => String(s || "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&#x27;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&mdash;/g, ", ").replace(/&ndash;/g, "-").replace(/&[lr]squo;/g, "'").replace(/&[lr]dquo;/g, '"').replace(/&hellip;/g, "...")
  .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16))).replace(/\s+/g, " ").trim();
const meta = (html, name) => {
  const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i")) || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`, "i"));
  return m ? un(m[1]) : "";
};
// A title that names the wall in front of the page and not the page.
const EMPTY = /^(tiktok - make your day|spotify|checking your browser.*|just a moment.*|access denied.*|attention required.*|youtube|- youtube)$/i;
// A video's own title and channel, from the site's public embed answer.
const embed = async (url, host) => {
  const at = /youtu\.?be/.test(host) ? "https://www.youtube.com/oembed?format=json&url=" : /tiktok\.com$/.test(host) ? "https://www.tiktok.com/oembed?url=" : "";
  if (!at) return null;
  try {
    const r = await fetch(at + encodeURIComponent(url), { signal: AbortSignal.timeout(12000) });
    if (!r.ok) return null;
    const j = await r.json();
    return j.title ? { host, site: (/tiktok/.test(host) ? "TikTok" : "YouTube") + (j.author_name ? ", " + j.author_name : ""), title: un(j.title), status: 200 } : null;
  } catch { return null; }
};
const one = async (url) => {
  const host = (() => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } })();
  const video = await embed(url, host);
  if (video) return video;
  try {
    const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(12000), headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", Accept: "text/html" } });
    if (!r.ok || !/html/i.test(r.headers.get("content-type") || "")) return { host, status: r.status };
    const html = (await r.text()).slice(0, 400000);
    const site = meta(html, "og:site_name");
    let title = meta(html, "og:title") || un((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]);
    // The site's name off the end of its own title.
    if (site && title.toLowerCase().endsWith(site.toLowerCase())) title = title.slice(0, -site.length).replace(/[\s|,:-]+$/, "");
    if (EMPTY.test(title)) title = "";
    return { host, site, title, status: r.status };
  } catch (e) { return { host, status: String(e.name || e) }; }
};
const todo = urls.filter(u => !cache[u] || (process.argv.includes("--again") && !cache[u].title));
for (let i = 0; i < todo.length; i += 8) {
  const part = todo.slice(i, i + 8);
  (await Promise.all(part.map(one))).forEach((x, j) => { cache[part[j]] = x; });
  writeFileSync(CACHE, JSON.stringify(cache, null, 1));
}
const links = {};
for (const u of urls) { const c = cache[u] || {}; links[u] = { site: c.site || "", title: c.title || "", host: c.host || "" }; }
console.log(`${Object.keys(sources).length} sheets, ${urls.length} addresses, ${urls.filter(u => links[u].title).length} with a title.`);
console.log(`${Object.keys(read.students).length} reads in the file, pulled ${read.at}.`);
if (!process.argv.includes("--write")) { console.log("Nothing uploaded. Say --write."); process.exit(0); }
const body = JSON.stringify({ ...read, links });
const w = await fetch(`${SUPABASE_URL}/storage/v1/object/${PATH}`, { method: "POST", headers: { ...H, "Content-Type": "application/json", "x-upsert": "true" }, body });
if (!w.ok) throw new Error(`upload: ${w.status} ${(await w.text()).slice(0, 200)}`);
console.log("uploaded " + PATH);
