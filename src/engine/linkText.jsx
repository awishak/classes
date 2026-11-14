// Words with the addresses in them drawn as links.
//
// A message is plain text, and a student who pastes their Google Doc, or
// Andrew who points at a challenge, was leaving an address nobody could
// press. Andrew, 2026-11-13: "let us link to assignments and pages in the
// inbox." `onOpen(href)` gets first say on a press; when it returns true the
// press is its to handle (the inbox opens the file in the popup), otherwise
// the link opens in a tab of its own.

const ADDRESS = /(https?:\/\/[^\s<>"]*[^\s<>".,;:!?)\]'])/g;

export function Linked({ text, onOpen }) {
  return String(text || "").split(ADDRESS).map((part, i) => i % 2 ? (
    <a key={i} href={part} target="_blank" rel="noopener" style={{ color: "inherit", textDecoration: "underline", overflowWrap: "anywhere" }}
      onClick={onOpen ? (e) => { if (onOpen(part)) e.preventDefault(); } : undefined}>{part}</a>
  ) : part);
}
