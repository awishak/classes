// A name used and never defined.
//
// check-refs catches a component with no definition, because it looks for
// `<Foo`. The smoke run catches a name that throws while rendering. Neither
// sees a plain function called from inside a click or a blur, because nothing
// presses the button. That is how the drawer shipped calling writeBlock, which
// Dashboard.jsx never imported: every field in the drawer threw when you left
// it, nothing saved, and a new thing went onto the day untitled.
//
// So this reads every engine file the way the compiler does, scope and all, and
// fails on any name that is neither declared, imported, nor a global. Babel is
// already here, underneath the React plugin, so this adds nothing.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse } from "@babel/parser";
import traverseMod from "@babel/traverse";

const traverse = traverseMod.default || traverseMod;

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(jsx|js)$/.test(name)) files.push(p);
  }
})("src/engine");

// Globals the browser and Node provide. Node's own list comes from the running
// process; the browser's is written out, since there is no window here.
const BROWSER = ["window", "document", "navigator", "location", "history", "localStorage", "sessionStorage",
  "fetch", "Request", "Response", "Headers", "FormData", "Blob", "File", "FileReader", "URL", "URLSearchParams",
  "WebSocket", "Image", "Audio", "MediaRecorder", "ResizeObserver", "IntersectionObserver", "MutationObserver",
  "requestAnimationFrame", "cancelAnimationFrame", "getComputedStyle", "matchMedia", "alert", "confirm", "prompt",
  "open", "close", "print", "screen", "innerWidth", "innerHeight", "scrollTo", "HTMLElement", "Element", "Node",
  "Event", "CustomEvent", "KeyboardEvent", "DOMParser", "XMLSerializer", "CSS", "Notification", "BroadcastChannel",
  "indexedDB", "caches", "crypto", "performance", "devicePixelRatio", "speechSynthesis", "SpeechSynthesisUtterance",
  "AudioContext", "webkitAudioContext", "HTMLCanvasElement", "OffscreenCanvas", "createImageBitmap", "import",
  "PopStateEvent", "XMLHttpRequest"];
const GLOBALS = new Set([...Object.getOwnPropertyNames(globalThis), ...BROWSER, "undefined", "arguments"]);

let failed = 0;
for (const file of files) {
  const src = readFileSync(file, "utf8");
  let ast;
  try {
    ast = parse(src, { sourceType: "module", plugins: ["jsx"] });
  } catch (e) {
    console.error(`  FAIL  ${file}  does not parse: ${e.message}`);
    failed++;
    continue;
  }
  const seen = new Set();
  traverse(ast, {
    ReferencedIdentifier(path) {
      const name = path.node.name;
      // A lowercase JSX tag is an element, not a variable.
      if (path.parentPath.isJSXOpeningElement() || path.parentPath.isJSXClosingElement()) {
        if (/^[a-z]/.test(name)) return;
      }
      if (path.isJSXIdentifier() && !path.parentPath.isJSXOpeningElement() && !path.parentPath.isJSXClosingElement()) return;
      if (path.scope.hasBinding(name, true) || GLOBALS.has(name)) return;
      const at = `${file}:${path.node.loc.start.line}`;
      if (seen.has(name + at)) return;
      seen.add(name + at);
      console.error(`  FAIL  ${at}  ${name} is used and never defined or imported`);
      failed++;
    },
  });
}

if (failed) {
  console.error(`\ncheck-names: ${failed} name(s) with nothing behind them. Import it, define it, or fix the spelling.`);
  process.exit(1);
}
console.log(`check-names: ${files.length} files scanned, every name has a definition`);
