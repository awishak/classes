// Drafting a grading comment. The three older grades files have called
// /api/generate-feedback for months and the engine never learned to, so this is
// that, carried across and pointed at the engine's simpler rubric.
//
// It drafts. It never submits. The comment lands in the editor and I edit it and
// press Submit myself, the same deal as the day plan and the before/after
// boards: the app proposes, I decide.

// The style rules do not change between students, so they sit in `system` where
// they are the same bytes every time and can be cached later.
const SYSTEM = `You are drafting grading feedback for a college professor to edit and send. You are writing in his voice, so he can send it with small changes.

His voice:
- Casual, warm, direct. Short sentences. He talks to students he likes.
- Never these words: excellence, exemplary, substantive, demonstrates, genuinely, meaningful, exceptional, thoughtful, robust, leverage, delve, journey, elevate.
- No filler openers or closers. No "Overall," "In conclusion," "This assignment," "Moving forward," "Great job!" Just say the thing.
- Address the student as "you". Use their first name at most once, at the start.

The comment:
- 2 to 4 short paragraphs. Each one is 1 to 3 sentences.
- Plain text. No markdown, no bullets, no numbered lists, no headers, no bold.
- Lead with what worked, then what to sharpen. Both halves are specific to what they actually turned in.
- Name the concrete thing. "Your questions are well organized" beats "good structure."
- When a rubric line lost points, say what would have earned them instead of restating the score.

Return the comment and nothing else. No preamble, no quotation marks, no explanation of what you wrote.

Good example of the register:
"Nice work on the interview guide. Your questions are well organized and the summary is clear, and I can tell you actually engaged with the conversation.

One thing to work on: include more specific detail from the interview itself. I want to hear what they actually said, not just your general takeaways."`;

// What the model gets about this one student.
function buildPrompt({ asg, name, log, rubric, score, note }) {
  const first = (name || "").split(" ")[0];
  const criteria = (asg?.rubric || []).length
    ? asg.rubric.map(c => {
        const got = Number(rubric?.[c.id]) || 0;
        const gap = c.points - got;
        return "- " + c.name + ": " + got + " of " + c.points + (gap > 0 ? " (lost " + gap + ")" : " (full marks)");
      }).join("\n")
    : "(no rubric on this assignment)";

  const submissions = (log || []).filter(e => e.type === "submission");
  const theirWork = submissions.length
    ? submissions.map(e => [e.link ? "Link: " + e.link : "", e.text ? "Their note: " + e.text : ""].filter(Boolean).join("\n")).join("\n\n")
    : "(nothing submitted)";

  const earlier = (log || []).filter(e => e.type === "comment" && e.from === "student").slice(-2)
    .map(e => "- " + e.text).join("\n");

  return [
    "Student: " + first,
    "Assignment: " + (asg?.title || "Untitled") + (asg?.weight ? " (" + asg.weight + "% of the grade)" : ""),
    asg?.description ? "What the assignment asked for: " + asg.description : "",
    "",
    "Rubric, as I just scored it:",
    criteria,
    score != null ? "Total: " + score + " out of 100" : "",
    "",
    "What they turned in:",
    theirWork,
    earlier ? "\nWhat they said about it:\n" + earlier : "",
    note ? "\nI want the comment to say this, in my words: " + note : "",
    "",
    "Write the comment.",
  ].filter(x => x !== "").join("\n");
}

// Returns { ok, text } or { ok: false, error }.
export async function draftFeedback(args) {
  try {
    const res = await fetch("/api/generate-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: buildPrompt(args),
        system: SYSTEM,
        model: "claude-opus-5",
        // Thinking is on by default on Opus 5 and comes out of this same
        // budget, so a tight cap would truncate the comment. Low effort keeps
        // a short drafting job from thinking its way through the whole hour.
        max_tokens: 4000,
        effort: "low",
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: "The drafting service said " + res.status + ". " + body.slice(0, 140) };
    }
    const data = await res.json();
    const text = (data.content || []).filter(c => c.type === "text").map(c => c.text || "").join("").trim();
    if (!text) return { ok: false, error: "The draft came back empty." };
    return { ok: true, text };
  } catch {
    return { ok: false, error: "Could not reach the drafting service." };
  }
}

// The editor holds HTML; the model writes plain text with blank lines between
// paragraphs. Escape it, then turn the breaks into real paragraphs.
export function textToHtml(text) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text.split(/\n{2,}/).map(p => "<p>" + esc(p.trim()).replace(/\n/g, "<br>") + "</p>").join("");
}
