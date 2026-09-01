// Andrew's pick, on anything that draws a block.
//
// The flag lives on the block and only the repository was drawing it, so a
// pick made on the shelf was invisible on the dashboard and invisible to
// students, which makes a recommendation nobody receives.
//
// One mark, three sizes, everywhere a block turns up. The drawing is served
// from /chef.png rather than built into the bundle, so it can be swapped
// without a deploy. A missing file renders as a broken-image icon, which is
// worse than no mark at all, so a failed load falls back to the words.

import { useState } from "react";

export const PICK_LABEL = "Andrew's pick";

export default function PickMark({ size = 34, label }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <span title={PICK_LABEL} style={{
        fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 10, fontWeight: 600,
        letterSpacing: ".09em", textTransform: "uppercase", color: "#fff", background: "#b45309",
        borderRadius: 999, padding: "3px 8px", whiteSpace: "nowrap",
      }}>Pick</span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
      <img src="/chef.png" alt={PICK_LABEL} title={PICK_LABEL} onError={() => setBroken(true)}
        style={{ width: Math.round(size * 1.4), height: size, objectFit: "contain", display: "block" }} />
      {label ? (
        <span style={{ fontSize: 12, fontWeight: 700, color: "#b45309", whiteSpace: "nowrap" }}>{PICK_LABEL}</span>
      ) : null}
    </span>
  );
}
