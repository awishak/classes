// Worktopia, open to the public at /worktopia. Andrew, 2026-10-01: "just give
// the public a way to go through worktopia. make it a public version. i'll
// link to it and let people play with it. and then give a ? button at the top
// that has a pop up that has like a 3 paragraph description of what i'm doing
// here." The terminal runs on a memory store: nothing a visitor types leaves
// the tab, there is no roster, no calendar and no submit. The ? and its text
// are in terminal.js (ABOUT). The pictures under public/worktopia are kept for
// the day a page of screenshots is wanted again.

import { useEffect, useRef } from "react";
import { mountWorktopia } from "./engine/worktopia/terminal.js";
import { memoryStore } from "./engine/worktopia/store.js";

export default function WorktopiaPage() {
  const ref = useRef(null);
  useEffect(() => {
    document.title = "Worktopia";
    const sheet = mountWorktopia(ref.current, { store: memoryStore(), viewer: null, photo: null, classmates: [], visitor: true });
    return () => sheet.destroy();
  }, []);
  return <div ref={ref} style={{ minHeight: "100vh" }} />;
}
