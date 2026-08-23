// Renders a QR code as SVG, so it stays crisp at whatever size the projector
// blows it up to. One path for the dark modules; no images, no dependency.

import { useMemo } from "react";
import { qrMatrix } from "./qr.js";

export default function QRCode({ value, size = 160, dark = "#0f0d0c", light = "#f6f2ec", quiet = 3 }) {
  const path = useMemo(() => {
    const m = qrMatrix(value);
    if (!m) return null;
    const n = m.length;
    let d = "";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (m[r][c]) d += "M" + (c + quiet) + " " + (r + quiet) + "h1v1h-1z";
      }
    }
    return { d, span: n + quiet * 2 };
  }, [value, quiet]);

  if (!path) return null;
  return (
    <svg width={size} height={size} viewBox={"0 0 " + path.span + " " + path.span}
      role="img" aria-label={"QR code for " + value} shapeRendering="crispEdges"
      style={{ display: "block", borderRadius: 6 }}>
      <rect width={path.span} height={path.span} fill={light} />
      <path d={path.d} fill={dark} />
    </svg>
  );
}
