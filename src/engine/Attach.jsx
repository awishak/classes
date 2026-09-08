// Sending a file up, from any form that takes one.
//
// The repository editor, the repository's Add item form and the dashboard's
// Add a note sheet all attach a clip the same way and dress the button
// differently. The state of the upload lives here once: nothing, a fraction on
// the way up, or a reason it failed. Each form draws its own button.

import { useState } from "react";
import { uploadMedia } from "./media.js";

export function useUpload({ classId, onDone }) {
  const [sending, setSending] = useState(null);   // null, or 0..1
  const [why, setWhy] = useState("");
  const send = (file) => {
    if (!file) return;
    setWhy(""); setSending(0);
    uploadMedia(file, { classId, onProgress: setSending })
      .then(media => { setSending(null); onDone(media); })
      .catch(err => { setSending(null); setWhy(err.message); });
  };
  // What the button says while the upload is where it is.
  const label = (idle) => (sending !== null ? "Sending, " + Math.round(sending * 100) + "%" : idle);
  return { sending, why, send, label, busy: sending !== null };
}
