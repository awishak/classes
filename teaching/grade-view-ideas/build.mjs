// Inline the real-data embed into the template and syntax-check the page script.
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const dir = new URL("./", import.meta.url);
const tpl = readFileSync(new URL("grade-view-ideas.template.html", dir), "utf8");
const data = readFileSync(new URL("comm3-embed.json", dir), "utf8");
const out = tpl.replace("__DATA__", data);
writeFileSync(new URL("grade-view-ideas.html", dir), out);
const script = out.match(/<script>([\s\S]*)<\/script>/)[1];
writeFileSync(new URL("page-script.check.mjs", dir), script);
execFileSync("node", ["--check", new URL("page-script.check.mjs", dir).pathname], { stdio: "inherit" });
console.log("built", out.length, "bytes; script parses");
const sizes = [...out.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map(m => Number(m[1])).filter(n => n < 13);
console.log("sizes under 13px:", sizes.length ? sizes : "none");
