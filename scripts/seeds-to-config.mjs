// teaching/seeds.md, turned into something the page can read.
//
// The markdown file is the place I write a seed, and a browser cannot read a
// file that never left the repository. So this parses the library and writes
// it out as a config module, which the repository imports like any other
// config. Run it after adding a seed:
//
//   node scripts/seeds-to-config.mjs
//
// The parser lives in src/engine/seeds.js, so the words are read exactly the
// same way here and in the page, and the smoke test covers both at once.

import { readFileSync, writeFileSync } from "node:fs";
import { parseSeeds } from "../src/engine/seeds.js";

const md = readFileSync(new URL("../teaching/seeds.md", import.meta.url), "utf8");
const seeds = parseSeeds(md);

const out = `// Generated from teaching/seeds.md by scripts/seeds-to-config.mjs.
// Write seeds in the markdown file and run the script again; editing this file
// by hand loses the edit the next time the script runs.

export const SEEDS = ${JSON.stringify(seeds, null, 2)};
`;

const path = new URL("../src/config/seed-library.js", import.meta.url);
writeFileSync(path, out);

console.log("seeds-to-config: " + seeds.length + " seeds written to src/config/seed-library.js");
seeds.forEach(s => console.log("   " + s.title + (s.concept ? "  ·  " + s.concept : "")));
