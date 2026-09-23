// Around the Horn, over whatever page Andrew is on.
//
// Andrew, 2026-09-17: "around the horn should not load on top of the
// dashboard. it should load on top of whatever page i'm on and that's it."
// The board used to belong to the dashboard, and the tab in the bar was a
// link to /dashboard?app=horn, so opening it from Grade view meant leaving
// Grade view. The board lives here now, mounted once inside the top bar, so
// it is on every page Andrew opens; the tab and the dashboard's own button
// both send one event and the board comes up in place.
//
// Seats and points go to the same places as before: data.athSeats keyed by
// name, and log entries with source "Around the Horn", stamped with the
// class day nearest to today, which is the day the dashboard would show.

import { useEffect, useState } from "react";
import HornBoard from "./HornBoard.jsx";
import { useClassData } from "./store.js";
import { usePhotos, useWithPhotos } from "./photos.js";
import { currentDay } from "./days.js";
import { studentsIn, realStudents, useRoomSection } from "./sections.js";
import { genId } from "../utils.jsx";

const OPEN = "ishak:horn";

export const openHorn = () => {
  try { window.dispatchEvent(new Event(OPEN)); } catch { /* server */ }
};

// A saved link to /dashboard?app=horn still opens the board.
const askedFor = () => {
  try { return new URLSearchParams(window.location.search).get("app") === "horn"; } catch { return false; }
};

export default function HornApp({ config }) {
  const [open, setOpen] = useState(askedFor);
  const [stored, update] = useClassData(config.storageKey);
  // The faces live one row over; put back on the profiles here. See photos.js.
  const [photos] = usePhotos(config.storageKey);
  const data = useWithPhotos(stored, photos);
  // The board follows the bar while it is open, so changing the sitting
  // reseats the room rather than needing the board closed and opened again.
  const [room] = useRoomSection(config);

  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener(OPEN, on);
    return () => window.removeEventListener(OPEN, on);
  }, []);

  if (!open || !data) return null;
  // The room, not the class: a board of seats belongs to the sitting in front
  // of him, and it reads the same choice the dashboard's bar writes.
  const students = studentsIn(realStudents(config, data.students || config.students || []), room);
  const weeks = data.schedule || config.scheduleWeeks || [];
  const day = currentDay(weeks)?.date || null;
  const setSeats = (seats) => update(prev => ({ ...prev, athSeats: seats }));
  const award = (name, amount) => update(prev => ({
    ...prev,
    log: [...(prev.log || []), { id: genId(), student: name, amount, source: "Around the Horn", ts: Date.now(), date: day }],
  }));
  return (
    <HornBoard students={students} seats={data.athSeats || {}} log={data.log || []} accent={config.accent}
      profiles={data.profiles || {}}
      onSeats={setSeats} onAward={award} onClose={() => setOpen(false)} />
  );
}
