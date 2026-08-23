// A small QR encoder, verified module-for-module against an independent
// implementation (segno) at every version and every mask.
//
// A small QR encoder. Byte mode, error correction level M, versions 1-10
// (up to 213 bytes) — plenty for a class URL, and level M survives being
// photographed off a projector from the back row.
//
// Returns a square array of booleans; true is a dark module.
// No dependency: this is the whole spec surface we need, nothing more.

// ─── GF(256), primitive polynomial 0x11D ───
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();
const gfMul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];

// Generator polynomial for `n` error correction codewords.
function rsGenerator(n) {
  let poly = [1];
  for (let i = 0; i < n; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

// Reed-Solomon remainder for one block.
export function rsEncode(data, ecLen) {
  const gen = rsGenerator(ecLen);
  const res = new Array(ecLen).fill(0);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ res[0];
    res.shift();
    res.push(0);
    if (factor !== 0) for (let j = 0; j < gen.length - 1; j++) res[j] ^= gfMul(gen[j + 1], factor);
  }
  return res;
}

// ─── version tables, level M only ───
// [ecCodewordsPerBlock, group1Blocks, group1DataCodewords, group2Blocks, group2DataCodewords]
const M_BLOCKS = {
  1: [10, 1, 16, 0, 0], 2: [16, 1, 28, 0, 0], 3: [26, 1, 44, 0, 0],
  4: [18, 2, 32, 0, 0], 5: [24, 2, 43, 0, 0], 6: [16, 4, 27, 0, 0],
  7: [18, 4, 31, 0, 0], 8: [22, 2, 38, 2, 39], 9: [22, 3, 36, 2, 37],
  10: [26, 4, 43, 1, 44],
};
// Byte-mode payload capacity at level M, by version.
const M_CAPACITY = { 1: 14, 2: 26, 3: 42, 4: 62, 5: 84, 6: 106, 7: 122, 8: 152, 9: 180, 10: 213 };
const ALIGN = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
  6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
};
function pickVersion(len) {
  for (let v = 1; v <= 10; v++) if (len <= M_CAPACITY[v]) return v;
  return null;
}

// ─── BCH codes for the format and version areas ───
function formatBits(mask) {
  const data = (0b00 << 3) | mask;          // level M is 00
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
}
function versionBits(version) {
  let rem = version;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >> 11) * 0x1f25);
  return (version << 12) | rem;
}

// ─── mask patterns ───
const MASKS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

// ─── build the codeword stream ───
export function codewords(bytes, version) {
  const [ecLen, g1, d1, g2, d2] = M_BLOCKS[version];
  const totalData = g1 * d1 + g2 * d2;

  const bits = [];
  const put = (value, len) => { for (let i = len - 1; i >= 0; i--) bits.push((value >> i) & 1); };
  put(0b0100, 4);                              // byte mode
  put(bytes.length, version >= 10 ? 16 : 8);   // character count indicator
  bytes.forEach(b => put(b, 8));

  // Terminator, pad to a byte boundary, then the alternating pad bytes.
  for (let i = 0; i < 4 && bits.length < totalData * 8; i++) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    data.push(bits.slice(i, i + 8).reduce((n, b) => (n << 1) | b, 0));
  }
  const PAD = [0xec, 0x11];
  for (let k = 0; data.length < totalData; k++) data.push(PAD[k % 2]);

  // Split into blocks, error-correct each, then interleave.
  const blocks = [];
  let at = 0;
  for (let i = 0; i < g1; i++) { blocks.push(data.slice(at, at + d1)); at += d1; }
  for (let i = 0; i < g2; i++) { blocks.push(data.slice(at, at + d2)); at += d2; }
  const ecBlocks = blocks.map(b => rsEncode(b, ecLen));

  const out = [];
  const maxData = Math.max(d1, d2);
  for (let i = 0; i < maxData; i++) blocks.forEach(b => { if (i < b.length) out.push(b[i]); });
  for (let i = 0; i < ecLen; i++) ecBlocks.forEach(b => out.push(b[i]));
  return out;
}

// ─── matrix ───
function blank(size) {
  return { m: Array.from({ length: size }, () => new Array(size).fill(false)),
           fn: Array.from({ length: size }, () => new Array(size).fill(false)) };
}

function placeFunctionPatterns(g, size, version) {
  const set = (r, c, v) => { if (r >= 0 && c >= 0 && r < size && c < size) { g.m[r][c] = v; g.fn[r][c] = true; } };

  const finder = (r0, c0) => {
    for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
      const inRing = (r >= 0 && r <= 6 && (c === 0 || c === 6)) || (c >= 0 && c <= 6 && (r === 0 || r === 6));
      const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      set(r0 + r, c0 + c, inRing || inCore);
    }
  };
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }

  const centers = ALIGN[version];
  centers.forEach(r => centers.forEach(c => {
    const nearFinder = (r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8);
    if (nearFinder) return;
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
    }
  }));

  set(size - 8, 8, true); // the always-dark module

  // Reserve the format areas (written for real once a mask is chosen).
  for (let i = 0; i < 9; i++) {
    if (i !== 6) { set(8, i, false); set(i, 8, false); }  // (8,6) and (6,8) are timing
    else { g.fn[8][6] = true; g.fn[6][8] = true; }
  }
  for (let i = 0; i < 8; i++) { set(8, size - 1 - i, false); set(size - 1 - i, 8, false); }

  if (version >= 7) {
    const bits = versionBits(version);
    for (let i = 0; i < 18; i++) {
      const bit = ((bits >> i) & 1) === 1;
      set(Math.floor(i / 3), size - 11 + (i % 3), bit);
      set(size - 11 + (i % 3), Math.floor(i / 3), bit);
    }
  }
}

function placeData(g, size, stream) {
  let bit = 0;
  const total = stream.length * 8;
  const next = () => {
    if (bit >= total) return false;
    const v = ((stream[bit >> 3] >> (7 - (bit & 7))) & 1) === 1;
    bit++;
    return v;
  };
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // column 6 is the timing pattern
    for (let i = 0; i < size; i++) {
      const r = upward ? size - 1 - i : i;
      for (let k = 0; k < 2; k++) {
        const c = right - k;
        if (g.fn[r][c]) continue;
        g.m[r][c] = next();
      }
    }
    upward = !upward;
  }
}

function applyFormat(g, size, mask) {
  const bits = formatBits(mask);
  const b = (i) => ((bits >> (14 - i)) & 1) === 1;   // bit 14 lands first

  // Copy one: along row 8, then up column 8.
  const copy1 = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
                 [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]];
  copy1.forEach(([r, c], i) => { g.m[r][c] = b(i); });

  // Copy two: up from the bottom-left, then in from the right.
  const copy2 = [];
  for (let i = 0; i < 7; i++) copy2.push([size - 1 - i, 8]);
  for (let i = 0; i < 8; i++) copy2.push([8, size - 8 + i]);
  copy2.forEach(([r, c], i) => { g.m[r][c] = b(i); });

  g.m[size - 8][8] = true; // the always-dark module
}

// Standard penalty score; lower is more scannable.
function penalty(m, size) {
  let score = 0;
  const runScore = (line) => {
    let run = 1, s = 0;
    for (let i = 1; i < size; i++) {
      if (line[i] === line[i - 1]) { run++; }
      else { if (run >= 5) s += 3 + (run - 5); run = 1; }
    }
    if (run >= 5) s += 3 + (run - 5);
    return s;
  };
  for (let r = 0; r < size; r++) score += runScore(m[r]);
  for (let c = 0; c < size; c++) score += runScore(m.map(row => row[c]));

  for (let r = 0; r < size - 1; r++) for (let c = 0; c < size - 1; c++) {
    const v = m[r][c];
    if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) score += 3;
  }

  const PAT = [true, false, true, true, true, false, true, false, false, false, false];
  const hasAt = (line, i) => PAT.every((p, k) => line[i + k] === p);
  const scanLine = (line) => {
    let s = 0;
    for (let i = 0; i + 11 <= size; i++) {
      if (hasAt(line, i)) s += 40;
      if (PAT.slice().reverse().every((p, k) => line[i + k] === p)) s += 40;
    }
    return s;
  };
  for (let r = 0; r < size; r++) score += scanLine(m[r]);
  for (let c = 0; c < size; c++) score += scanLine(m.map(row => row[c]));

  let dark = 0;
  m.forEach(row => row.forEach(v => { if (v) dark++; }));
  const pct = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(pct - 50) / 5) * 10;
  return score;
}

// forceMask is for tests: pin the mask so output can be compared against a
// reference encoder. Leave it undefined in real use and the best mask wins.
export function qrMatrix(text, forceMask) {
  const bytes = Array.from(new TextEncoder().encode(text));
  const version = pickVersion(bytes.length);
  if (!version) return null;
  const size = 17 + version * 4;
  const stream = codewords(bytes, version);

  let best = null, bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    if (forceMask != null && mask !== forceMask) continue;
    const g = blank(size);
    placeFunctionPatterns(g, size, version);
    placeData(g, size, stream);
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      if (!g.fn[r][c] && MASKS[mask](r, c)) g.m[r][c] = !g.m[r][c];
    }
    applyFormat(g, size, mask);
    const s = penalty(g.m, size);
    if (s < bestScore) { bestScore = s; best = g.m; }
  }
  return best;
}
