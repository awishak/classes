// Opens the demo class, COMM 222, the way a visitor does: no session, straight
// to /comm222 on a built copy of the site (vite preview on port 4199), in the
// installed Google Chrome at phone and laptop widths. Reports whether the page
// stayed put (no bounce to /login), who the lens says the visitor is, and what
// rendered, and writes screenshots to the folder given as the first argument
// (default: the scratch folder under node_modules). Borrows Playwright from
// ../fieldtime. Build first: npx vite build. Run: node scripts/check-demo.mjs [outdir]
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const outdir = process.argv[2] || join(root, "node_modules", ".demo-shots");
mkdirSync(outdir, { recursive: true });
const require = createRequire(join(root, "..", "fieldtime", "package.json"));
const { chromium } = require("playwright");

/* dist/, with every other path falling back to index.html the way vercel.json does */
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  let file = join(root, "dist", p);
  if (p === "/" || !existsSync(file) || extname(p) === "") file = join(root, "dist", "index.html");
  res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise(r => server.listen(4199, r));
const base = "http://127.0.0.1:4199";

const browser = await chromium.launch({ channel: "chrome" });
const errors = [];
for (const [name, viewport] of [["phone", { width: 390, height: 844 }], ["desk", { width: 1200, height: 900 }]]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on("pageerror", e => errors.push(name + " pageerror: " + e.message));
  await page.goto(base + "/comm222");
  await page.waitForTimeout(4000);
  const seen = await page.evaluate(() => ({
    path: location.pathname,
    title: document.title,
    lens: Array.from(document.querySelectorAll("span")).map(s => s.textContent).find(t => /Seeing the class as/.test(t)) || null,
    saving: Array.from(document.querySelectorAll("button")).some(b => /Save what I press|Go back to instructor view/.test(b.textContent)),
    signIn: /Sign in first/.test(document.body.textContent),
    h1: document.querySelector("h1")?.textContent?.slice(0, 80) || null,
    cards: document.querySelectorAll("[class*=card], .ca-card").length,
    text: document.body.textContent.replace(/\s+/g, " ").slice(0, 300)
  }));
  console.log(name, JSON.stringify(seen));
  await page.screenshot({ path: join(outdir, `comm222-${name}.png`), fullPage: true });
  /* the picker points the lens at another placeholder, never off */
  const picker = await page.$("select[aria-label='Which student']");
  if (picker) {
    await picker.selectOption("Zack Girgis");
    await page.waitForTimeout(800);
    console.log(name, "picked Zack:", await page.evaluate(() => Array.from(document.querySelectorAll("span")).map(s => s.textContent).find(t => /Seeing the class as/.test(t))));
    await picker.selectOption("");
    await page.waitForTimeout(800);
    console.log(name, "picked nobody:", await page.evaluate(() => Array.from(document.querySelectorAll("span")).map(s => s.textContent).find(t => /Seeing the class as/.test(t))), "| path", await page.evaluate(() => location.pathname));
  }
  /* a real class still asks for a sign-in */
  await page.goto(base + "/comm3");
  await page.waitForTimeout(2500);
  console.log(name, "comm3 as a visitor:", await page.evaluate(() => location.pathname + " " + (/Sign in first|Sign in/.test(document.body.textContent) ? "asks to sign in" : "OPEN?")));
  await page.goto(base + "/");
  await page.waitForTimeout(2500);
  console.log(name, "front page cards:", JSON.stringify(await page.evaluate(() => Array.from(document.querySelectorAll("a, button")).map(a => a.textContent.trim()).filter(t => /^COMM \d+/.test(t)).slice(0, 8))));
  await page.screenshot({ path: join(outdir, `front-${name}.png`), fullPage: true });
  await ctx.close();
}
await browser.close();
server.close();
console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "No script errors.");
console.log("Screenshots in " + outdir);
