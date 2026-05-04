import React, { useState, useEffect } from "react";
import { ReboundPanel } from "./GameSystem4";
import { useTheme, themedInteriorCrd, themedHeadingFont } from "./styles.jsx";
import { parseDueDate, fmtDue, genId, gp, Toast } from "./utils.jsx";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#4b5563";
const TEXT_MUTED = "#9ca3af";
const BORDER = "#f3f4f6";
const BORDER_STRONG = "#e5e7eb";
const ACCENT = "#059669";
const GREEN = "#10b981";
const RED = "#ef4444";
const AMBER = "#f59e0b";
const TEAL = "#14b8a6";

const crd = { background: "#fff", borderRadius: 14, border: "1px solid #d1d5db", overflow: "hidden", boxShadow: "0 1px 3px rgba(17, 24, 39, 0.08), 0 1px 2px rgba(17, 24, 39, 0.04)" };
const pill = { padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F, border: "none", transition: "all 0.15s" };
const pillInactive = { ...pill, background: "#f3f4f6", color: TEXT_SECONDARY };
const linkPill = { ...pill, background: "#f3f4f6", color: TEXT_SECONDARY, padding: "6px 12px", fontSize: 11, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 };
const sectionLabel = { fontSize: 10, fontWeight: 800, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: F };
const inp = { background: "#fff", border: "1px solid " + BORDER_STRONG, borderRadius: 10, padding: "10px 12px", color: TEXT_PRIMARY, fontFamily: F, fontSize: 14, fontWeight: 500, outline: "none", width: "100%", boxSizing: "border-box" };
const sel = { ...inp, width: "auto" };
const CONTAINER_MAX = 720;

const ADMIN_NAME = "Andrew Ishak";
const GUEST_NAME = "__guest__";

export const DEFAULT_ASSIGNMENTS = [
  { id: "idea_gen", name: "Group Project #1: Idea Generation", weight: 10, due: "Apr 24", dueTime: "11:59 PM", link: "", notes: "" },
  { id: "references", name: "Group Project #2: References", weight: 10, due: "May 1", dueTime: "11:59 PM", link: "", notes: "" },
  { id: "synthesis", name: "Group Project #3: Article Synthesis", weight: 10, due: "May 22", dueTime: "11:59 PM", link: "", notes: "" },
  { id: "presentation", name: "Final Presentation/Project", weight: 25, due: "Jun 1", dueTime: "11:59 PM", link: "", notes: "" },
  { id: "peer_eval", name: "Peer Evaluation", weight: 10, due: "Jun 8", dueTime: "11:59 PM", link: "", notes: "" },
  { id: "final_reflection", name: "Final Reflection", weight: 10, due: "Jun 8", dueTime: "11:59 PM", link: "", notes: "" },
  { id: "participation", name: "Participation", weight: 25, due: "", link: "", notes: "Weekly Game, Around the Horn, Rotating Fishbowl" },
];

export const QUIZ_BREAKDOWN = [
  { id: "on_topic", label: "On Reading", count: 6, gamePts: 10, gradePts: 15 },
  { id: "sports_world", label: "Extra", count: 4, gamePts: 10, gradePts: 2.5 },
];


function lastName(name) { if (name === "Ava da Cunha") return "da Cunha"; if (name === "Nogbou Chris Junior Tadjo") return "Tadjo"; if (name === "Anne Sephora Pohan") return "Pohan"; if (name === "Santino Rafael Diaz") return "Diaz"; return name.split(" ").slice(-1)[0]; }
function lastSortObj(a, b) { return lastName(a.name).localeCompare(lastName(b.name)); }

async function saveData(data) { try { const STORAGE_KEY = "comm4-v1"; await window.storage.set(STORAGE_KEY, JSON.stringify(data), true); return true; } catch { return false; } }

/* ─── RUBRIC SYSTEM ─── */

const DEFAULT_MASTER_RUBRIC = {
  sections: [
    { id: "document", label: "Document", weight: 20, subsections: [
      { id: "doc_completeness", label: "Completeness" },
      { id: "doc_formatting", label: "Formatting" },
    ]},
    { id: "presentation", label: "Presentation", weight: 80, subsections: [
      { id: "content", label: "Content" },
      { id: "structure", label: "Structure" },
      { id: "delivery", label: "Presentation & Delivery" },
      { id: "character", label: "Character" },
    ]},
  ],
  items: [
    // Document > Completeness
    { id: "doc_complete", sub: "doc_completeness", label: "Document is complete", explanation: "Very nice work on the entire document. Everything required is here and well done.", link: "", positive: true },
    { id: "doc_missing_parts", sub: "doc_completeness", label: "Missing required parts", explanation: "Your document was missing one or more required components. Review the assignment requirements and make sure each section is addressed.", link: "", positive: false },
    { id: "doc_purpose", sub: "doc_completeness", label: "Missing specific purpose", explanation: "Make sure to include the specific speech purpose. This helps frame everything else in your document.", link: "", positive: false },
    // Document > Formatting
    { id: "doc_well_formatted", sub: "doc_formatting", label: "Well formatted", explanation: "Your document is well formatted and easy to read.", link: "", positive: true },
    { id: "doc_needs_formatting", sub: "doc_formatting", label: "Needs better formatting", explanation: "Work on your formatting. You should have proper indentation (nesting) where appropriate, and it should look good so that someone quickly looking at it can get an idea of what you are doing.", link: "", positive: false },
    { id: "doc_line_markers", sub: "doc_formatting", label: "Missing line markers", explanation: "Make sure to use line markers (a, b, c, 1, 2, 3) all the way through your outline.", link: "", positive: false },
    { id: "doc_nesting", sub: "doc_formatting", label: "Needs nesting", explanation: "Don't forget to nest ideas so that you don't simply have a list. Nesting will help break your work into sections so it's easier for you and the audience to understand.", link: "", positive: false },
    // Presentation > Content
    { id: "strong_ideas", sub: "content", label: "Strong, well-developed ideas", explanation: "Your ideas were fully focused and well-developed. You used relevant evidence and examples effectively to support your points.", link: "", positive: true },
    { id: "good_evidence", sub: "content", label: "Good use of evidence", explanation: "You incorporated data and examples that strengthened your argument.", link: "", positive: true },
    { id: "lacks_depth", sub: "content", label: "Lacks depth", explanation: "Your content would benefit from deeper development. Try to go beyond the surface level and explore your ideas more fully.", link: "", positive: false },
    { id: "weak_evidence", sub: "content", label: "Weak or missing evidence", explanation: "Your work needed stronger supporting evidence. Include specific data, examples, or stories to back up your claims.", link: "", positive: false },
    { id: "off_topic", sub: "content", label: "Off topic", explanation: "Parts of your work drifted from the core topic. Keep your focus tight on the question you're addressing.", link: "", positive: false },
    { id: "logic_gaps", sub: "content", label: "Logic gaps", explanation: "Some of your reasoning had gaps that made it harder to follow your argument. Make sure each point connects clearly to the next.", link: "", positive: false },
    // Presentation > Structure
    { id: "strong_opening_closing", sub: "structure", label: "Strong opening and closing", explanation: "Your introduction grabbed attention and your conclusion landed effectively.", link: "", positive: true },
    { id: "well_organized", sub: "structure", label: "Well organized", explanation: "Your work was clearly structured and easy to follow, with smooth transitions between ideas.", link: "", positive: true },
    { id: "weak_intro_conclusion", sub: "structure", label: "Weak intro or conclusion", explanation: "Your introduction and/or conclusion needed more work. An engaging opening and a clear closing make a big difference.", link: "", positive: false },
    { id: "hard_to_follow", sub: "structure", label: "Hard to follow", explanation: "The organization made it difficult to follow at times. Try outlining your main points in a clearer sequence.", link: "", positive: false },
    { id: "rough_transitions", sub: "structure", label: "Rough transitions", explanation: "The transitions between your ideas were abrupt. Work on connecting your points so everything flows naturally.", link: "", positive: false },
    // Presentation > Delivery
    { id: "confident_engaging", sub: "delivery", label: "Confident and engaging", explanation: "You came across as confident and well-prepared. Your presence kept the audience engaged.", link: "", positive: true },
    { id: "strong_vocal", sub: "delivery", label: "Strong vocal variety", explanation: "Your use of tone, pacing, and emphasis was effective. It kept things dynamic.", link: "", positive: true },
    { id: "good_pauses", sub: "delivery", label: "Good use of pauses", explanation: "You used pauses well for emphasis and impact.", link: "", positive: true },
    { id: "needs_confidence", sub: "delivery", label: "Needs more confidence", explanation: "You seemed nervous or underprepared. Practice will help you feel more comfortable and present with more authority.", link: "", positive: false },
    { id: "volume_clarity", sub: "delivery", label: "Volume or clarity issues", explanation: "There were moments where you were hard to hear or understand. Project your voice and enunciate clearly.", link: "", positive: false },
    { id: "filler_words", sub: "delivery", label: "Too many filler words", explanation: "Filler words ('um,' 'like,' 'you know') were noticeable. Try to pause instead of filling the silence.", link: "", positive: false },
    { id: "read_notes", sub: "delivery", label: "Read from notes too much", explanation: "You relied too heavily on your notes. Aim to make more eye contact and speak more naturally.", link: "", positive: false },
    // Presentation > Character
    { id: "fresh_memorable", sub: "character", label: "Fresh and memorable", explanation: "Your work stood out. Your ideas felt original and left a strong impression.", link: "", positive: true },
    { id: "insightful", sub: "character", label: "Insightful thinking", explanation: "You showed real depth of thought. Your perspective on this topic was thoughtful and engaging.", link: "", positive: true },
    { id: "felt_generic", sub: "character", label: "Felt generic", explanation: "Your work covered the topic but didn't feel distinctive. Push yourself to find a unique angle or personal connection.", link: "", positive: false },
    { id: "didnt_address", sub: "character", label: "Didn't fully address the question", explanation: "Your work didn't fully answer the question being asked. Make sure you're directly responding to what's being asked of you.", link: "", positive: false },
    // General (no section)
    { id: "strong_effort", sub: "general", label: "Strong overall effort", explanation: "It's clear you put real effort into this. Keep it up.", link: "", positive: true },
    { id: "submitted_late", sub: "general", label: "Submitted late", explanation: "This was submitted after the deadline.", link: "", positive: false },
    { id: "missing_components", sub: "general", label: "Missing required components", explanation: "Your submission was missing one or more required components. Review the assignment requirements.", link: "", positive: false },
    { id: "missing_name", sub: "general", label: "Missing name on document", explanation: "Please include your name on the document. Thank you.", link: "", positive: false },
    { id: "missing_colors", sub: "general", label: "Missing stylistic highlights", explanation: "Don't forget to highlight your stylistic elements in three different colors. This is an important part of the assignment.", link: "", positive: false },
  ],
  tiers: [
    { label: "Excellent", min: 93, max: 100 },
    { label: "Good", min: 85, max: 92 },
    { label: "Satisfactory", min: 77, max: 84 },
    { label: "Needs Improvement", min: 70, max: 76 },
    { label: "Incomplete", min: 0, max: 69 },
  ],
};

function RubricItemEditor({ item, onChange, onRemove, allSubsections }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ padding: "6px 10px", borderRadius: 8, background: item.positive ? "#f0fdf4" : "#fef2f2", border: "1px solid " + (item.positive ? "#bbf7d0" : "#fecaca"), marginBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button onClick={() => onChange({ ...item, positive: !item.positive })} style={{ ...pill, padding: "2px 8px", fontSize: 10, background: item.positive ? GREEN : RED, color: "#fff", flexShrink: 0 }}>{item.positive ? "+" : "-"}</button>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", flex: 1, cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>{item.label || "(new item)"}</span>
        <button onClick={() => setExpanded(!expanded)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: TEXT_MUTED, fontFamily: F }}>{expanded ? "close" : "edit"}</button>
        <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#d1d5db", fontFamily: F, padding: "0 4px" }}>x</button>
      </div>
      {expanded && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          <input value={item.label} onChange={e => onChange({ ...item, label: e.target.value })} placeholder="Button label" style={{ ...inp, fontSize: 13, padding: "6px 8px" }} />
          <textarea value={item.explanation} onChange={e => onChange({ ...item, explanation: e.target.value })} placeholder="Explanation for student..." rows={2} style={{ ...inp, fontSize: 13, padding: "6px 8px", resize: "vertical" }} />
          <input value={item.link || ""} onChange={e => onChange({ ...item, link: e.target.value })} placeholder="Link to resource (optional)" style={{ ...inp, fontSize: 13, padding: "6px 8px" }} />
          <select value={item.sub} onChange={e => onChange({ ...item, sub: e.target.value })} style={{ ...sel, fontSize: 13, padding: "6px 8px" }}>
            <option value="general">General (no section)</option>
            {allSubsections.map(s => <option key={s.id} value={s.id}>{s.sectionLabel} &gt; {s.label}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

function RubricEditor({ rubric, onSave, onCancel, title }) {
  const [sections, setSections] = useState(rubric.sections || []);
  const [items, setItems] = useState(rubric.items || []);
  const [tiers, setTiers] = useState(rubric.tiers || DEFAULT_MASTER_RUBRIC.tiers);
  const [showTiers, setShowTiers] = useState(false);

  // Flatten all subsections for the item editor dropdown
  const allSubsections = [];
  sections.forEach(sec => {
    (sec.subsections || []).forEach(sub => {
      allSubsections.push({ id: sub.id, label: sub.label, sectionLabel: sec.label });
    });
  });

  const addSection = () => {
    setSections([...sections, { id: genId(), label: "", weight: 0, subsections: [] }]);
  };

  const updateSection = (idx, field, value) => {
    setSections(sections.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const removeSection = (idx) => {
    const sec = sections[idx];
    const subIds = (sec.subsections || []).map(s => s.id);
    if (items.some(i => subIds.includes(i.sub))) {
      if (!window.confirm("This section has feedback items. They will be moved to General. Continue?")) return;
      setItems(items.map(i => subIds.includes(i.sub) ? { ...i, sub: "general" } : i));
    }
    setSections(sections.filter((_, i) => i !== idx));
  };

  const addSubsection = (secIdx) => {
    const sec = sections[secIdx];
    const newSub = { id: genId(), label: "" };
    setSections(sections.map((s, i) => i === secIdx ? { ...s, subsections: [...(s.subsections || []), newSub] } : s));
  };

  const updateSubsection = (secIdx, subIdx, label) => {
    setSections(sections.map((s, i) => i === secIdx ? { ...s, subsections: s.subsections.map((sub, j) => j === subIdx ? { ...sub, label } : sub) } : s));
  };

  const removeSubsection = (secIdx, subIdx) => {
    const subId = sections[secIdx].subsections[subIdx].id;
    if (items.some(i => i.sub === subId)) {
      if (!window.confirm("This subsection has feedback items. They will be moved to General. Continue?")) return;
      setItems(items.map(i => i.sub === subId ? { ...i, sub: "general" } : i));
    }
    setSections(sections.map((s, i) => i === secIdx ? { ...s, subsections: s.subsections.filter((_, j) => j !== subIdx) } : s));
  };

  const addItem = (sub) => {
    setItems([...items, { id: genId(), sub, label: "", explanation: "", link: "", positive: true }]);
  };

  const updateItem = (id, updated) => {
    setItems(items.map(i => i.id === id ? updated : i));
  };

  const removeItem = (id) => {
    if (window.confirm("Remove this feedback item?")) setItems(items.filter(i => i.id !== id));
  };

  const save = () => {
    const cleaned = items.filter(i => i.label.trim());
    onSave({ sections, items: cleaned, tiers });
  };

  const totalWeight = sections.reduce((s, x) => s + (x.weight || 0), 0);

  return (
    <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: "#111827" }}>{title}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={save} style={{ ...pill, background: "#111827", color: "#fff" }}>Save</button>
          <button onClick={onCancel} style={pillInactive}>Cancel</button>
        </div>
      </div>

      {/* Tiers */}
      <button onClick={() => setShowTiers(!showTiers)} style={{ ...pillInactive, fontSize: 11, marginBottom: 12, width: "100%" }}>
        {showTiers ? "Hide Tiers" : "Score Tiers (" + tiers.length + ")"}
      </button>
      {showTiers && (
        <div style={{ marginBottom: 16, padding: "10px 12px", background: "#f9fafb", borderRadius: 10 }}>
          {tiers.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
              <input value={t.label} onChange={e => setTiers(tiers.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} style={{ ...inp, flex: 1, fontSize: 13, padding: "4px 8px" }} />
              <input type="number" value={t.min} onChange={e => setTiers(tiers.map((x, j) => j === i ? { ...x, min: parseInt(e.target.value) || 0 } : x))} style={{ ...inp, width: 45, fontSize: 13, padding: "4px 6px", textAlign: "center" }} />
              <span style={{ fontSize: 11, color: TEXT_MUTED }}>to</span>
              <input type="number" value={t.max} onChange={e => setTiers(tiers.map((x, j) => j === i ? { ...x, max: parseInt(e.target.value) || 0 } : x))} style={{ ...inp, width: 45, fontSize: 13, padding: "4px 6px", textAlign: "center" }} />
              <button onClick={() => setTiers(tiers.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#d1d5db" }}>x</button>
            </div>
          ))}
          <button onClick={() => setTiers([...tiers, { label: "", min: 0, max: 0 }])} style={{ ...pillInactive, fontSize: 11, marginTop: 4 }}>+ Add Tier</button>
        </div>
      )}

      {/* Sections with subsections and items */}
      {sections.map((sec, secIdx) => {
        return (
          <div key={sec.id} style={{ marginBottom: 16, padding: "12px 14px", background: "#f9fafb", borderRadius: 12, border: "1px solid #e5e7eb" }}>
            {/* Section header */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <input value={sec.label} onChange={e => updateSection(secIdx, "label", e.target.value)} placeholder="Section name" style={{ ...inp, flex: 1, fontSize: 14, fontWeight: 700, padding: "6px 10px" }} />
              <span style={{ fontSize: 11, color: TEXT_MUTED, flexShrink: 0 }}>~</span>
              <input type="number" value={sec.weight} onChange={e => updateSection(secIdx, "weight", parseInt(e.target.value) || 0)} style={{ ...inp, width: 50, fontSize: 13, padding: "6px", textAlign: "center" }} />
              <span style={{ fontSize: 11, color: TEXT_MUTED, flexShrink: 0 }}>%</span>
              <button onClick={() => removeSection(secIdx)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#d1d5db" }}>x</button>
            </div>

            {/* Subsections */}
            {(sec.subsections || []).map((sub, subIdx) => {
              const subItems = items.filter(i => i.sub === sub.id);
              return (
                <div key={sub.id} style={{ marginBottom: 10, marginLeft: 12, paddingLeft: 12, borderLeft: "3px solid #e5e7eb" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <input value={sub.label} onChange={e => updateSubsection(secIdx, subIdx, e.target.value)} placeholder="Subsection name" style={{ ...inp, flex: 1, fontSize: 13, fontWeight: 600, padding: "4px 8px" }} />
                    <button onClick={() => addItem(sub.id)} style={{ ...pill, fontSize: 10, padding: "2px 8px", background: "#e5e7eb", color: "#4b5563" }}>+ Item</button>
                    <button onClick={() => removeSubsection(secIdx, subIdx)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#d1d5db" }}>x</button>
                  </div>
                  {subItems.map(item => (
                    <RubricItemEditor key={item.id} item={item} onChange={updated => updateItem(item.id, updated)} onRemove={() => removeItem(item.id)} allSubsections={allSubsections} />
                  ))}
                  {subItems.length === 0 && <div style={{ fontSize: 12, color: "#d1d5db", fontStyle: "italic", padding: "2px 0" }}>No items</div>}
                </div>
              );
            })}
            <button onClick={() => addSubsection(secIdx)} style={{ ...pillInactive, fontSize: 11, marginLeft: 12 }}>+ Add Subsection</button>
          </div>
        );
      })}

      {/* Add section */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <button onClick={addSection} style={{ ...pillInactive, fontSize: 11 }}>+ Add Section</button>
        {sections.length > 0 && (
          <span style={{ fontSize: 11, fontWeight: 600, color: totalWeight === 100 ? GREEN : AMBER }}>
            Total weight: {totalWeight}%
          </span>
        )}
      </div>

      {/* General (unsectioned) items */}
      <div style={{ padding: "12px 14px", background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", textTransform: "uppercase", letterSpacing: "0.05em" }}>General</div>
          <button onClick={() => addItem("general")} style={{ ...pill, fontSize: 10, padding: "2px 8px", background: "#f3f4f6", color: "#4b5563" }}>+ Add</button>
        </div>
        {items.filter(i => i.sub === "general").map(item => (
          <RubricItemEditor key={item.id} item={item} onChange={updated => updateItem(item.id, updated)} onRemove={() => removeItem(item.id)} allSubsections={allSubsections} />
        ))}
        {items.filter(i => i.sub === "general").length === 0 && <div style={{ fontSize: 12, color: "#d1d5db", fontStyle: "italic" }}>No items</div>}
      </div>
    </div>
  );
}

function AssignmentRubricButton({ assignmentId, data, setData }) {
  const [editing, setEditing] = useState(false);
  const [copyFrom, setCopyFrom] = useState(null);
  const rubrics = data.assignmentRubrics || {};
  const master = data.masterRubric || DEFAULT_MASTER_RUBRIC;
  const hasRubric = !!rubrics[assignmentId];
  const assignments = data.assignments || DEFAULT_ASSIGNMENTS;

  const deepCopy = (src) => ({
    items: src.items.map(i => ({ ...i, id: genId() })),
    sections: (src.sections || []).map(s => ({ ...s, id: genId(), subsections: (s.subsections || []).map(sub => ({ ...sub, id: genId() })) })),
    tiers: [...(src.tiers || DEFAULT_MASTER_RUBRIC.tiers)],
  });

  const createFromMaster = () => {
    // Deep copy with fresh IDs, but keep subsection references intact
    const copy = { items: [], sections: [], tiers: [...master.tiers] };
    const subIdMap = {};
    (master.sections || []).forEach(sec => {
      const newSecId = genId();
      const newSubs = (sec.subsections || []).map(sub => {
        const newSubId = genId();
        subIdMap[sub.id] = newSubId;
        return { ...sub, id: newSubId };
      });
      copy.sections.push({ ...sec, id: newSecId, subsections: newSubs });
    });
    copy.items = master.items.map(i => ({ ...i, id: genId(), sub: subIdMap[i.sub] || i.sub }));
    setEditing(true);
    setCopyFrom(copy);
  };

  const createFromAssignment = (srcId) => {
    const src = rubrics[srcId];
    if (!src) return;
    const copy = { items: [], sections: [], tiers: [...(src.tiers || DEFAULT_MASTER_RUBRIC.tiers)] };
    const subIdMap = {};
    (src.sections || []).forEach(sec => {
      const newSecId = genId();
      const newSubs = (sec.subsections || []).map(sub => {
        const newSubId = genId();
        subIdMap[sub.id] = newSubId;
        return { ...sub, id: newSubId };
      });
      copy.sections.push({ ...sec, id: newSecId, subsections: newSubs });
    });
    copy.items = src.items.map(i => ({ ...i, id: genId(), sub: subIdMap[i.sub] || i.sub }));
    setEditing(true);
    setCopyFrom(copy);
  };

  const editExisting = () => {
    setEditing(true);
    setCopyFrom(rubrics[assignmentId]);
  };

  const save = async (rubric) => {
    const updated = { ...data, assignmentRubrics: { ...rubrics, [assignmentId]: rubric } };
    await saveData(updated); setData(updated);
    setEditing(false); setCopyFrom(null);
  };

  const remove = async () => {
    if (!window.confirm("Remove rubric from this assignment?")) return;
    const newRubrics = { ...rubrics };
    delete newRubrics[assignmentId];
    const updated = { ...data, assignmentRubrics: newRubrics };
    await saveData(updated); setData(updated);
  };

  if (editing && copyFrom) {
    return <RubricEditor rubric={copyFrom} onSave={save} onCancel={() => { setEditing(false); setCopyFrom(null); }} title="Assignment Rubric" />;
  }

  const otherAssignments = assignments.filter(a => a.id !== assignmentId && a.id !== "participation" && rubrics[a.id]);

  return (
    <div style={{ marginTop: 8 }}>
      {hasRubric ? (
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={editExisting} style={{ ...pill, background: "#eff6ff", color: "#2563eb", fontSize: 11, flex: 1 }}>Edit Rubric</button>
          <button onClick={remove} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11 }}>Remove</button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <button onClick={createFromMaster} style={{ ...pill, background: "#f3f4f6", color: "#4b5563", fontSize: 11 }}>Create from Master</button>
          {otherAssignments.map(a => (
            <button key={a.id} onClick={() => createFromAssignment(a.id)} style={{ ...pill, background: "#f3f4f6", color: "#4b5563", fontSize: 11 }}>Copy from {a.name.length > 20 ? a.name.slice(0, 20) + "..." : a.name}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── ASSIGNMENTS TAB ─── */

function TogglePanel({ label, count, children }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginTop: 10 }}>
      <button onClick={() => setShow(!show)} style={{ ...pillInactive, fontSize: 12 }}>{show ? "Hide Submissions" : label + " (" + count + ")"}</button>
      {show && children}
    </div>
  );
}

// Compute participation grade (out of 25) for a student. Mirrors logic from Gradebook.
function computeParticipationGrade(data, sid) {
  if (!sid) return { participationGrade: 0, participationPct: 0, totalEarned: 0, totalPossible: 0 };
  const log = data.log || [];
  const weeklyGames = data.weeklyGames || {};
  const reboundGrades = data.reboundGrades || {};
  let gameGradeEarned = 0;
  let gameGradePossible = 0;
  const scoredGames = Object.keys(weeklyGames).filter(w => weeklyGames[w]?.scored);
  scoredGames.forEach(w => {
    const game = weeklyGames[w];
    gameGradePossible += 100;
    let original = 0;
    (game.questions || []).forEach((q, qi) => {
      const ans = game.responses?.[sid + "-" + qi];
      if (ans === q.correct) {
        const cat = q.category || "on_topic";
        const catPts = cat === "on_topic" ? 15 : 2.5;
        original += catPts;
      }
    });
    const rg = reboundGrades[sid + "-game-" + w];
    let earned = original;
    if (rg && typeof rg.gradePoints === "number") {
      if (rg.type === "makeup") {
        earned = Math.max(original, rg.gradePoints);
      } else {
        let cap;
        if (rg.type === "absence_override") cap = 60;
        else if (original < 50) cap = 60;
        else if (original <= 65) cap = 70;
        else if (original <= 79) cap = 80;
        else cap = 100;
        const capped = Math.min(rg.gradePoints, cap);
        earned = Math.max(original, capped);
      }
    }
    gameGradeEarned += earned;
  });
  // This or That: leaderboard only, does NOT contribute to participation grade
  const fbEntries = log.filter(e => e.studentId === sid && (e.source || "").startsWith("Fishbowl Wk"));
  const fbEarned = fbEntries.reduce((s, e) => s + e.amount, 0);
  const confirmedFishbowls = Object.keys(data.weeklyFishbowl || {}).filter(w => (data.weeklyFishbowl[w] || {}).confirmed).length;
  const fbPossible = confirmedFishbowls * 20;
  const athEntries = log.filter(e => e.studentId === sid && ((e.source || "") === "Around the Horn" || (e.source || "") === "PTI"));
  const athEarned = athEntries.reduce((s, e) => s + e.amount, 0);
  const totalEarned = gameGradeEarned + fbEarned + athEarned;
  const totalPossible = gameGradePossible + fbPossible;
  const participationPct = totalPossible > 0 ? (totalEarned / totalPossible) : 0;
  const participationGrade = participationPct * 25;
  return { participationGrade, participationPct, totalEarned, totalPossible };
}

// Format ts as "Wed, Apr 23"
function fmtDayDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// Format due like "Apr 17" -> "Thu, Apr 17"
// Determine state for an assignment dot
function getAssignmentState(a, data, studentId) {
  if (a.id === "participation") return "participation";
  const grades = data.grades || {};
  const submissions = data.submissions || {};
  const g = grades[studentId + "-" + a.id] || {};
  const sub = submissions[studentId + "-" + a.id];
  const hasGrade = g.score !== undefined && g.score !== "";
  const isZero = hasGrade && parseFloat(g.score) === 0;
  const dueDate = parseDueDate(a.due);
  const isPastDue = dueDate && Date.now() > dueDate.getTime();
  const isLate = sub && dueDate && sub.ts > dueDate.getTime();
  if (isZero) return "zero";        // red
  if (hasGrade) return "graded";    // solid green
  if (isLate) return "late";        // red (per spec: late or 0 -> red)
  if (sub) return "submitted";      // green w/ black border
  if (isPastDue) return "missing";  // red (effectively a zero)
  return "upcoming";                // yellow
}

// Diameter for a dot based on weight (5% -> 18px, 30% -> 40px)
function dotSize(weight) {
  const w = Math.max(1, Math.min(40, weight || 1));
  return Math.round(14 + w * 0.87);
}

function dotColor(state) {
  if (state === "graded") return { fill: GREEN, border: GREEN };
  if (state === "submitted") return { fill: GREEN, border: TEXT_PRIMARY };
  if (state === "late" || state === "zero" || state === "missing") return { fill: RED, border: RED };
  if (state === "participation") return { fill: TEAL, border: TEAL };
  return { fill: AMBER, border: AMBER }; // upcoming
}

function StatusBadge({ state }) {
  const map = {
    graded: { label: "Graded", bg: "#ecfdf5", color: GREEN },
    submitted: { label: "Submitted", bg: "#eff6ff", color: "#2563eb" },
    late: { label: "Submitted Late", bg: "#fffbeb", color: AMBER },
    zero: { label: "Action Required", bg: "#fef2f2", color: RED },
    missing: { label: "Missing", bg: "#fef2f2", color: RED },
    upcoming: { label: "Upcoming", bg: "#fffbeb", color: AMBER },
    participation: { label: "Ongoing", bg: "#f0fdfa", color: TEAL },
  };
  const m = map[state] || map.upcoming;
  return <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: m.bg, color: m.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</span>;
}

export function AssignmentsView({ data, setData, isAdmin, userName, setView }) {
  const { theme } = useTheme("comm4-v1");
  const crd = themedInteriorCrd(theme, 0);
  const assignments = data.assignments || DEFAULT_ASSIGNMENTS;
  const grades = data.grades || {};
  const submissions = data.submissions || {};
  const [editId, setEditId] = useState(null);
  const [editLocal, setEditLocal] = useState(null);
  const [editBlurb, setEditBlurb] = useState(false);
  const [blurbLocal, setBlurbLocal] = useState("");
  const [editMasterRubric, setEditMasterRubric] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [hoveredDotId, setHoveredDotId] = useState(null);
  const [tableExpandedId, setTableExpandedId] = useState(null);
  const [howGradeOpen, setHowGradeOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" ? window.innerWidth >= 600 : true);
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 600);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  // Jump from the assignment table to the All-assignments section, expand that one.
  // Uses an offset scroll so the row appears below the sticky nav, not under it.
  const jumpToAssignment = (id) => {
    setOpenId(id);
    // Wait two frames so the expansion has rendered before measuring,
    // then scroll with an offset that clears the sticky nav (~80px).
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById("assignment-row-" + id);
        if (!el) return;
        const navOffset = 80;
        const top = el.getBoundingClientRect().top + window.pageYOffset - navOffset;
        window.scrollTo({ top, behavior: "smooth" });
      });
    });
  };

  const isGuest = userName === GUEST_NAME;
  const normalize = s => (s || "").trim().toLowerCase();
  const student = !isAdmin && !isGuest
    ? (data.students.find(s => s.name === userName)
       || data.students.find(s => normalize(s.name) === normalize(userName)))
    : null;
  const studentId = student?.id;

  const startEdit = (a) => {
    setEditId(a.id);
    setEditLocal({ name: a.name, weight: a.weight, due: a.due || "", dueTime: a.dueTime || "", link: a.link || "", notes: a.notes || "" });
  };

  const saveEdit = async () => {
    if (!editId || !editLocal) return;
    let updated = { ...data, assignments: (data.assignments || DEFAULT_ASSIGNMENTS).map(a => a.id === editId ? { ...a, ...editLocal, weight: parseInt(editLocal.weight) || 0 } : a) };
    if (editLocal.due && data.schedule) {
      const assignment = (data.assignments || DEFAULT_ASSIGNMENTS).find(a => a.id === editId);
      if (assignment) {
        const newSchedule = data.schedule.map(week => ({
          ...week,
          dates: week.dates.map(d => {
            const cleanedAssignment = (d.assignment || "").split(", ").filter(a => a !== assignment.name && a !== assignment.name + " due").join(", ");
            if (d.date === editLocal.due) {
              const newAssignment = cleanedAssignment ? cleanedAssignment + ", " + editLocal.name + " due" : editLocal.name + " due";
              return { ...d, assignment: newAssignment };
            }
            return { ...d, assignment: cleanedAssignment };
          })
        }));
        updated.schedule = newSchedule;
      }
    }
    await saveData(updated); setData(updated);
    setEditId(null); setEditLocal(null); showMsg("Saved");
  };

  const addAssignment = async () => {
    const newA = { id: genId(), name: "New Assignment", weight: 0, due: "", link: "", notes: "" };
    const updated = { ...data, assignments: [...assignments, newA] };
    await saveData(updated); setData(updated);
    startEdit(newA); showMsg("Added");
  };

  const removeAssignment = async (id) => {
    if (id === "participation") return;
    const updated = { ...data, assignments: assignments.filter(a => a.id !== id) };
    await saveData(updated); setData(updated); setEditId(null); setEditLocal(null); showMsg("Removed");
  };

  const defaultBlurb = "Here's how your grade works. There are four major assignments worth 75% of your grade, and a participation bucket worth the other 25%. The participation bucket is where the weekly game, This or That, Around the Horn, and Rotating Fishbowl all live.\n\nThe game leaderboard and your actual grade are two different things. They pull from some of the same activities but weight them differently. The weekly game is the biggest example: the game weights all question types equally (10 pts each), but your grade weights On Topic questions much more heavily (15 pts each) than Sports World questions (2.5 pts each). So if you want to climb the leaderboard, be good at everything. If you want a good grade, focus on the course material.\n\nThe top 5 on the leaderboard at the end of the quarter get automatic A's. That's real. Everything else, just do the work, show up, and engage.";
  const blurbText = data.assignmentsBlurb || defaultBlurb;

  const saveBlurb = async () => {
    const updated = { ...data, assignmentsBlurb: blurbLocal };
    await saveData(updated); setData(updated);
    setEditBlurb(false); showMsg("Saved");
  };

  // ── Sort assignments: due-date ascending, undated last, participation last
  const today = new Date();
  const year = today.getFullYear();
  const sortedAssignments = [...assignments].sort((a, b) => {
    if (a.id === "participation") return 1;
    if (b.id === "participation") return -1;
    if (!a.due && !b.due) return 0;
    if (!a.due) return 1;
    if (!b.due) return -1;
    return new Date(a.due + ", " + year) - new Date(b.due + ", " + year);
  });

  // ── Find next assignment: first non-participation assignment with a due date today or in the future,
  // regardless of submission or grading state. The status chip differentiates upcoming/submitted/graded.
  // Falls back to first missing (past-due, ungraded) assignment if nothing is upcoming.
  const todayMidnight = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); })();
  const nextAssignment = (() => {
    if (!studentId) return sortedAssignments.find(a => a.id !== "participation" && !!a.due) || null;
    // First, anything with a due date today or in the future
    const upcoming = sortedAssignments.find(a => {
      if (a.id === "participation") return false;
      const dueDate = parseDueDate(a.due);
      if (!dueDate) return false;
      return dueDate.getTime() >= todayMidnight;
    });
    if (upcoming) return upcoming;
    // Otherwise, fall back to anything past-due but ungraded (missing/late state)
    return sortedAssignments.find(a => {
      if (a.id === "participation") return false;
      const state = getAssignmentState(a, data, studentId);
      return state === "missing" || state === "late";
    }) || null;
  })();

  // ── Compute current grade including participation
  const computeCurrentGrade = () => {
    const gradeAssignments = sortedAssignments.filter(a => a.id !== "participation");
    let weightGraded = 0;
    let weightedScore = 0;
    gradeAssignments.forEach(a => {
      const g = grades[studentId + "-" + a.id] || {};
      if (g.score !== undefined && g.score !== "") {
        weightGraded += a.weight;
        weightedScore += (parseFloat(g.score) / (g.outOf || 100)) * a.weight;
      }
    });
    // Always include participation contribution since it's 25%
    const partWeight = (sortedAssignments.find(a => a.id === "participation")?.weight) || 25;
    const part = computeParticipationGrade(data, studentId);
    weightGraded += partWeight;
    weightedScore += part.participationGrade; // already in raw points (0-25 scale)
    // weightedScore as currently summed is in "weighted points out of weightGraded"
    // For non-participation we did (score/outOf) * weight, summing into weighted points.
    // For participation we added participationGrade (0-25), which is the same as (pct * 25).
    // Treat both as weighted points relative to the same total weightGraded.
    const currentGrade = weightGraded > 0 ? Math.round(weightedScore / weightGraded * 1000) / 10 : null;
    const totalWeight = sortedAssignments.reduce((s, a) => s + a.weight, 0);
    const pctAssessed = Math.round(weightGraded / totalWeight * 100);
    return { currentGrade, pctAssessed };
  };

  const { currentGrade, pctAssessed } = studentId ? computeCurrentGrade() : { currentGrade: null, pctAssessed: 0 };
  const gradeColor = currentGrade === null ? TEXT_MUTED : currentGrade >= 90 ? GREEN : currentGrade >= 80 ? TEXT_PRIMARY : currentGrade >= 70 ? AMBER : RED;

  // Render a row for an assignment (used for next + list, with `expanded` flag)
  const renderAssignmentBody = (a, isNext = false) => {
    const g = studentId ? (grades[studentId + "-" + a.id] || {}) : null;
    const sub = studentId ? submissions[studentId + "-" + a.id] : null;
    const state = studentId ? getAssignmentState(a, data, studentId) : (a.id === "participation" ? "participation" : "upcoming");
    return (
      <div>
        {a.notes && <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.5, marginBottom: 12 }}>{a.notes}</div>}
        {a.link && (
          <a href={a.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ ...linkPill, textDecoration: "none", marginBottom: 12 }}>
            Assignment Doc
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        )}

        {/* Student grade inline */}
        {studentId && a.id !== "participation" && g && g.score !== undefined && g.score !== "" && (
          <div style={{ marginTop: 12, padding: "10px 12px", background: "#fafafa", borderRadius: 10, border: "1px solid " + BORDER }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ ...sectionLabel }}>Grade</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: parseFloat(g.score) === 0 ? RED : TEXT_PRIMARY, marginLeft: 8 }}>{g.score}</span>
              <span style={{ fontSize: 13, color: TEXT_MUTED }}>/ {g.outOf || 100}</span>
            </div>
            {parseFloat(g.score) === 0 && (
              <div style={{ fontSize: 12, color: RED, marginTop: 6, fontWeight: 600 }}>This assignment needs attention. Complete all required components and submit, then request a regrade.</div>
            )}
            {g.comment && <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 6, lineHeight: 1.5 }}>{g.comment}</div>}
            {!isAdmin && <RegradeRequest assignmentId={a.id} data={data} setData={setData} studentId={studentId} />}
          </div>
        )}

        {/* Student submission */}
        {studentId && !isAdmin && a.id !== "participation" && (
          <StudentSubmission assignmentId={a.id} data={data} setData={setData} studentId={studentId} existing={sub} />
        )}

        {/* Admin tools per assignment */}
        {isAdmin && a.id !== "participation" && (
          <div onClick={e => e.stopPropagation()} style={{ marginTop: 12 }}>
            <TogglePanel label="View Submissions" count={data.students.filter(s => s.name !== ADMIN_NAME && submissions[s.id + "-" + a.id]).length}>
              <AdminSubmissions assignmentId={a.id} data={data} setData={setData} />
            </TogglePanel>
            <AssignmentRubricButton assignmentId={a.id} data={data} setData={setData} />
            <BulkNotesImport assignmentId={a.id} data={data} setData={setData} />
            <button onClick={() => startEdit(a)} style={{ ...pillInactive, marginTop: 8, fontSize: 11 }}>Edit Assignment</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: themedHeadingFont(theme, F) }}>
      <Toast message={msg} />
      <div style={{ maxWidth: CONTAINER_MAX, margin: "0 auto" }}>

        {/* Diagnostic: non-admin, non-guest user with no matched student record */}
        {!isAdmin && !isGuest && !student && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: 14, marginBottom: 16, color: "#991b1b" }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Account not matched</div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>You are signed in as <strong>{userName}</strong>, but no student record matches that name. Submission and grade features are disabled until this is fixed.</div>
            <div style={{ fontSize: 12, lineHeight: 1.5, marginTop: 6 }}>First, try signing out and picking your name again. If that doesn't work, email aishak@scu.edu so the roster can be updated.</div>
            <button
              onClick={() => {
                try { localStorage.removeItem("comm4-v1-user"); } catch(e) {}
                window.location.reload();
              }}
              style={{ marginTop: 10, padding: "6px 12px", fontSize: 12, fontWeight: 700, background: "#fff", color: "#991b1b", border: "1px solid #fca5a5", borderRadius: 8, cursor: "pointer", fontFamily: F }}
            >Sign out and pick again</button>
          </div>
        )}

        {/* Student identity strip — clickable to bio */}
        {student && (() => {
          const bio = (data.bios || {})[student.id] || {};
          const initials = student.name.split(" ").map(n => n[0]).join("");
          return (
            <button
              onClick={() => setView && setView("more")}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: F,
                marginBottom: 18, width: "100%", textAlign: "left",
              }}
            >
              {bio.photo ? (
                <img src={bio.photo} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 600, flexShrink: 0 }}>{initials}</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 19, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.01em", lineHeight: 1.2 }}>{student.name}</div>
                {bio.motto && <div style={{ fontSize: 13, color: TEXT_SECONDARY, fontStyle: "italic", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{bio.motto}"</div>}
              </div>
            </button>
          );
        })()}

        {/* Admin buttons (top right, no page title) */}
        {isAdmin && (
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginBottom: 14 }}>
            <button onClick={addAssignment} style={{ ...linkPill, cursor: "pointer", border: "none" }}>+ Add</button>
            <button onClick={() => setEditMasterRubric(!editMasterRubric)} style={{ ...linkPill, cursor: "pointer", border: "none" }}>{editMasterRubric ? "Cancel" : "Master Rubric"}</button>
            {setView && <button onClick={() => setView("grades")} style={{ ...linkPill, cursor: "pointer", border: "none" }}>Gradebook</button>}
            {setView && <button onClick={() => setView("grading")} style={{ ...linkPill, cursor: "pointer", border: "none", color: ACCENT, background: ACCENT + "12" }}>Grading</button>}
          </div>
        )}

        {/* Master Rubric Editor */}
        {isAdmin && editMasterRubric && (
          <RubricEditor
            rubric={data.masterRubric || DEFAULT_MASTER_RUBRIC}
            onSave={async (rubric) => {
              const updated = { ...data, masterRubric: rubric };
              await saveData(updated); setData(updated);
              setEditMasterRubric(false); showMsg("Master rubric saved");
            }}
            onCancel={() => setEditMasterRubric(false)}
            title="Master Rubric Template"
          />
        )}

        {/* ASSIGNMENT TABLE — table on desktop, card list on mobile */}
        {studentId && <div style={{ ...sectionLabel, marginBottom: 10 }}>Assignment table</div>}
        {studentId && (() => {
          const partRow = sortedAssignments.find(a => a.id === "participation");
          const partWeight = partRow?.weight || 25;
          const part = computeParticipationGrade(data, studentId);
          // Build rows for every assignment
          const rows = sortedAssignments.map(a => {
            const isPart = a.id === "participation";
            const g = grades[studentId + "-" + a.id] || {};
            const sub = submissions[studentId + "-" + a.id];
            const state = getAssignmentState(a, data, studentId);
            let scoreText, contribution, hasGrade, scoreColor;
            if (isPart) {
              scoreText = part.totalEarned + " / " + part.totalPossible;
              const pct = part.totalPossible > 0 ? part.totalEarned / part.totalPossible : 0;
              contribution = Math.round(pct * partWeight * 10) / 10;
              hasGrade = part.totalPossible > 0;
              scoreColor = pct >= 0.9 ? GREEN : pct >= 0.8 ? TEXT_PRIMARY : pct >= 0.7 ? AMBER : RED;
            } else {
              hasGrade = g.score !== undefined && g.score !== "";
              if (hasGrade) {
                const sc = parseFloat(g.score);
                const out = g.outOf || 100;
                scoreText = g.score + " / " + out;
                const pct = out > 0 ? sc / out : 0;
                contribution = Math.round(pct * a.weight * 10) / 10;
                scoreColor = pct >= 0.9 ? GREEN : pct >= 0.8 ? TEXT_PRIMARY : pct >= 0.7 ? AMBER : RED;
              } else {
                scoreText = "—";
                contribution = null;
                scoreColor = TEXT_MUTED;
              }
            }
            return { a, isPart, state, scoreText, scoreColor, hasGrade, contribution, sub, g };
          });

          if (isDesktop) {
            // ─── DESKTOP TABLE ───
            return (
              <div style={{ ...crd, marginBottom: 16, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F }}>
                  <thead>
                    <tr style={{ background: "#fafafa", borderBottom: "1px solid " + BORDER_STRONG }}>
                      <th style={{ ...sectionLabel, textAlign: "left", padding: "12px 16px", fontWeight: 700 }}>Assignment</th>
                      <th style={{ ...sectionLabel, textAlign: "left", padding: "12px 12px", fontWeight: 700 }}>Due / Status</th>
                      <th style={{ ...sectionLabel, textAlign: "right", padding: "12px 12px", fontWeight: 700 }}>Weight</th>
                      <th style={{ ...sectionLabel, textAlign: "right", padding: "12px 12px", fontWeight: 700 }}>Score</th>
                      <th style={{ ...sectionLabel, textAlign: "right", padding: "12px 16px", fontWeight: 700 }}>Contribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const isExpanded = tableExpandedId === r.a.id;
                      const isLast = i === rows.length - 1;
                      const dueText = r.isPart ? "Ongoing" : (r.a.due ? "Due " + fmtDue(r.a.due, r.a.dueTime) : "—");
                      return (
                        <React.Fragment key={r.a.id}>
                          <tr
                            onClick={() => r.isPart ? setTableExpandedId(isExpanded ? null : r.a.id) : jumpToAssignment(r.a.id)}
                            style={{
                              borderBottom: (!isLast || isExpanded) ? "1px solid " + BORDER : "none",
                              cursor: "pointer",
                            }}
                          >
                            <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY }}>
                              {r.isPart && <span style={{ display: "inline-block", marginRight: 6, color: TEXT_MUTED, fontSize: 11, transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>›</span>}
                              {r.a.name}
                            </td>
                            <td style={{ padding: "14px 12px", fontSize: 12, color: TEXT_SECONDARY }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span>{dueText}</span>
                                <StatusBadge state={r.state} />
                              </div>
                            </td>
                            <td style={{ padding: "14px 12px", fontSize: 13, color: TEXT_SECONDARY, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.a.weight}%</td>
                            <td style={{ padding: "14px 12px", textAlign: "right" }}>
                              <span style={{ fontSize: 15, fontWeight: 500, color: r.scoreColor, fontVariantNumeric: "tabular-nums" }}>{r.scoreText}</span>
                            </td>
                            <td style={{ padding: "14px 16px", textAlign: "right" }}>
                              {r.contribution !== null ? (
                                <span style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY, fontVariantNumeric: "tabular-nums" }}>{r.contribution} pts</span>
                              ) : (
                                <span style={{ fontSize: 13, color: TEXT_MUTED }}>—</span>
                              )}
                            </td>
                          </tr>
                          {isExpanded && r.isPart && (
                            <tr>
                              <td colSpan={5} style={{ padding: "0 16px 16px", background: "#fafafa", borderBottom: !isLast ? "1px solid " + BORDER : "none" }}>
                                <ParticipationDetail data={data} studentId={studentId} />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "#fafafa", borderTop: "1px solid " + BORDER_STRONG }}>
                      <td colSpan={4} style={{ padding: "14px 16px", fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY, textAlign: "right" }}>Current grade</td>
                      <td style={{ padding: "14px 16px", fontSize: 18, fontWeight: 500, color: gradeColor, fontVariantNumeric: "tabular-nums", textAlign: "right", letterSpacing: "-0.01em" }}>{currentGrade !== null ? currentGrade + "%" : "---"}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          }

          // ─── MOBILE LIST (card per row) ───
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {rows.map(r => {
                const isExpanded = tableExpandedId === r.a.id;
                const dueText = r.isPart ? "Ongoing" : (r.a.due ? "Due " + fmtDue(r.a.due, r.a.dueTime) : "—");
                return (
                  <div key={r.a.id}>
                    <div
                      onClick={() => r.isPart ? setTableExpandedId(isExpanded ? null : r.a.id) : jumpToAssignment(r.a.id)}
                      style={{ ...crd, padding: "12px 14px", cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY, lineHeight: 1.3 }}>
                            {r.isPart && <span style={{ display: "inline-block", marginRight: 4, color: TEXT_MUTED, fontSize: 11, transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>›</span>}
                            {r.a.name}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                            <span style={{ fontSize: 11, color: TEXT_SECONDARY }}>{dueText}</span>
                            <StatusBadge state={r.state} />
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 16, fontWeight: 500, color: r.scoreColor, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{r.scoreText}</div>
                          <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{r.a.weight}% wt</div>
                        </div>
                      </div>
                      {r.contribution !== null && (
                        <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid " + BORDER, display: "flex", justifyContent: "space-between", fontSize: 11, color: TEXT_SECONDARY }}>
                          <span>Contribution to grade</span>
                          <span style={{ fontWeight: 500, color: TEXT_PRIMARY, fontVariantNumeric: "tabular-nums" }}>{r.contribution} pts</span>
                        </div>
                      )}
                    </div>
                    {isExpanded && r.isPart && (
                      <div style={{ ...crd, padding: 14, marginTop: 4 }}>
                        <ParticipationDetail data={data} studentId={studentId} />
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ ...crd, padding: "12px 14px", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }}>Current grade</span>
                <span style={{ fontSize: 18, fontWeight: 500, color: gradeColor, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>{currentGrade !== null ? currentGrade + "%" : "---"}</span>
              </div>
            </div>
          );
        })()}

        {/* Next Assignment */}
        {nextAssignment && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ ...sectionLabel, marginBottom: 10, color: ACCENT }}>Next Assignment</div>
            <div style={{ ...crd, padding: 18, border: "2px solid " + ACCENT }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                <div style={{ minWidth: 48, height: 48, borderRadius: 12, background: ACCENT + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: ACCENT, flexShrink: 0, padding: "0 6px" }}>{nextAssignment.weight}%</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1.2 }}>{nextAssignment.name}</div>
                  {nextAssignment.due && <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, marginTop: 4 }}>Due {fmtDue(nextAssignment.due, nextAssignment.dueTime)}</div>}
                </div>
                {studentId && <StatusBadge state={getAssignmentState(nextAssignment, data, studentId)} />}
              </div>
              {renderAssignmentBody(nextAssignment, true)}
            </div>
          </div>
        )}

        {/* Assignments list — catalog of grades */}
        <div style={{ ...sectionLabel, marginBottom: 10 }}>All assignments</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sortedAssignments.map(a => {
            const isEdit = isAdmin && editId === a.id;
            const isOpen = openId === a.id;
            const state = studentId ? getAssignmentState(a, data, studentId) : (a.id === "participation" ? "participation" : "upcoming");

            if (isEdit && editLocal) {
              return (
                <div key={a.id} style={{ ...crd, padding: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <input value={editLocal.name} onChange={e => setEditLocal({ ...editLocal, name: e.target.value })} style={{ ...inp, fontWeight: 700, fontSize: 15 }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ ...sectionLabel, marginBottom: 4 }}>Weight (%)</div>
                        <input type="number" value={editLocal.weight} onChange={e => setEditLocal({ ...editLocal, weight: e.target.value })} style={inp} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ ...sectionLabel, marginBottom: 4 }}>Due Date</div>
                        <input value={editLocal.due} onChange={e => setEditLocal({ ...editLocal, due: e.target.value })} placeholder="e.g. Apr 20" style={inp} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ ...sectionLabel, marginBottom: 4 }}>Due Time</div>
                        <input value={editLocal.dueTime || ""} onChange={e => setEditLocal({ ...editLocal, dueTime: e.target.value })} placeholder="11:59 PM" style={inp} />
                      </div>
                    </div>
                    <div>
                      <div style={{ ...sectionLabel, marginBottom: 4 }}>Google Doc Link</div>
                      <input value={editLocal.link} onChange={e => setEditLocal({ ...editLocal, link: e.target.value })} placeholder="https://docs.google.com/..." style={inp} />
                    </div>
                    <div>
                      <div style={{ ...sectionLabel, marginBottom: 4 }}>Description / Notes</div>
                      <textarea value={editLocal.notes} onChange={e => setEditLocal({ ...editLocal, notes: e.target.value })} placeholder="Short description students will see" rows={3} style={{ ...inp, resize: "vertical" }} />
                    </div>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                      {a.id !== "participation" && <button onClick={() => { if (window.confirm("Remove " + a.name + "?")) removeAssignment(a.id); }} style={{ ...pill, background: "#fef2f2", color: RED, marginRight: "auto" }}>Delete</button>}
                      <button onClick={() => { setEditId(null); setEditLocal(null); }} style={pillInactive}>Cancel</button>
                      <button onClick={saveEdit} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff" }}>Save</button>
                    </div>
                  </div>
                </div>
              );
            }

            const anyOpen = openId !== null;
            const dimmed = anyOpen && !isOpen;
            return (
              <div
                key={a.id}
                id={"assignment-row-" + a.id}
                style={{
                  marginBottom: 0,
                  background: "#fff",
                  border: isOpen ? "2px solid " + ACCENT : "1px solid " + BORDER,
                  borderRadius: 14,
                  overflow: "hidden",
                  opacity: dimmed ? 0.4 : 1,
                  transition: "opacity 0.15s, border-color 0.15s",
                }}
              >
                <button onClick={() => setOpenId(isOpen ? null : a.id)} style={{
                  background: "transparent", border: "none", padding: 14, width: "100%", textAlign: "left", fontFamily: F, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: a.id === "participation" ? TEAL + "1a" : ACCENT + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: a.id === "participation" ? TEAL : ACCENT, flexShrink: 0 }}>{a.weight}%</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>
                      {a.due ? "Due " + fmtDue(a.due, a.dueTime) : "Ongoing"}
                    </div>
                  </div>
                  {studentId && (() => {
                    const g = grades[studentId + "-" + a.id] || {};
                    const hasGrade = g.score !== undefined && g.score !== "";
                    if (hasGrade) {
                      const scoreNum = parseFloat(g.score);
                      const outOf = g.outOf || 100;
                      const pct = (scoreNum / outOf) * 100;
                      const sc = pct >= 90 ? GREEN : pct >= 80 ? TEXT_PRIMARY : pct >= 70 ? AMBER : RED;
                      return (
                        <div style={{ textAlign: "right", flexShrink: 0, minWidth: 60 }}>
                          <div style={{ fontSize: 18, fontWeight: 500, color: sc, lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>{g.score}</div>
                          <div style={{ fontSize: 9, color: TEXT_MUTED, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>/ {outOf}</div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {studentId && <StatusBadge state={state} />}
                    <span style={{ ...linkPill, padding: "4px 10px" }}>{isOpen ? "Close" : "Open"}</span>
                  </div>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 16px 16px", borderTop: "1px solid " + BORDER }} onClick={e => e.stopPropagation()}>
                    <div style={{ paddingTop: 14 }}>
                      {a.id === "participation" ? (
                        <ParticipationDetail data={data} studentId={studentId} />
                      ) : (
                        renderAssignmentBody(a)
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Class explanation (bottom) — collapsed by default */}
        <div style={{ ...crd, padding: 16, marginTop: 24 }}>
          {isAdmin && editBlurb ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <textarea value={blurbLocal} onChange={e => setBlurbLocal(e.target.value)} rows={8} style={{ ...inp, fontSize: 14, lineHeight: 1.6, resize: "vertical" }} />
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button onClick={() => setEditBlurb(false)} style={pillInactive}>Cancel</button>
                <button onClick={saveBlurb} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff" }}>Save</button>
              </div>
            </div>
          ) : (
            <div>
              <button onClick={() => setHowGradeOpen(!howGradeOpen)} style={{
                background: "transparent", border: "none", padding: 0, width: "100%", textAlign: "left", cursor: "pointer", fontFamily: F,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY }}>How your grade works</div>
                <span style={{ fontSize: 14, color: TEXT_MUTED, transform: howGradeOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>›</span>
              </button>
              {howGradeOpen && (
                <div style={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.6, whiteSpace: "pre-wrap", marginTop: 12, paddingTop: 12, borderTop: "1px solid " + BORDER }}>
                  {blurbText}
                  {isAdmin && (
                    <div style={{ marginTop: 10 }}>
                      <button onClick={() => { setBlurbLocal(blurbText); setEditBlurb(true); }} style={linkPill}>Edit</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function ParticipationDetail({ data, studentId }) {
  const log = data.log || [];
  const participation = data.participation || {};
  const getPart = (w, cat) => { const k = studentId + "-w" + w + "-" + cat; return participation[k]; };

  if (!studentId) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { label: "Weekly Game", detail: "100 pts/week, dual weighted", icon: "Q" },
          { label: "This or That", detail: "20 pts/week, game only", icon: "TT" },
          { label: "Around the Horn", detail: "Variable, game + grade", icon: "P" },
          { label: "Rotating Fishbowl", detail: "20 pts/time, game + grade", icon: "FB" },
        ].map(p => (
          <div key={p.label} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid " + BORDER, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: TEXT_SECONDARY, flexShrink: 0 }}>{p.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>{p.label}</div>
              <div style={{ fontSize: 11, color: TEXT_MUTED }}>{p.detail}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const gamePts = {};
  log.filter(e => e.studentId === studentId).forEach(e => {
    const src = e.source || "Other";
    let bucket = "Other";
    if (src.startsWith("Game Wk")) bucket = "Weekly Game";
    else if (src.startsWith("ToT")) bucket = "This or That";
    else if (src === "PTI" || src === "Around the Horn") bucket = "PTI";
    else if (src.startsWith("Fishbowl")) bucket = "Fishbowl";
    else if (src.startsWith("Team Win")) bucket = "Team Win";
    else bucket = src;
    gamePts[bucket] = (gamePts[bucket] || 0) + e.amount;
  });
  let gradeQuizTotal = 0, gradeTotTotal = 0, gradePtiTotal = 0, gradeFbTotal = 0;
  let quizWeeks = 0, totWeeks = 0, ptiWeeks = 0, fbWeeks = 0;
  for (let w = 1; w <= 10; w++) {
    const qv = getPart(w, "quiz");
    if (qv !== undefined && qv !== null && qv !== "") {
      const scores = typeof qv === "object" ? qv : {};
      QUIZ_BREAKDOWN.forEach(q => { gradeQuizTotal += (scores[q.id] || 0) * q.gradePts; });
      quizWeeks++;
    }
    const tv = getPart(w, "tot"); if (tv !== undefined && tv !== null && tv !== "") { gradeTotTotal += parseFloat(tv) || 0; totWeeks++; }
    const pv = getPart(w, "pti"); if (pv !== undefined && pv !== null && pv !== "") { gradePtiTotal += parseFloat(pv) || 0; ptiWeeks++; }
    const fv = getPart(w, "fishbowl"); if (fv !== undefined && fv !== null && fv !== "") { gradeFbTotal += parseFloat(fv) || 0; fbWeeks++; }
  }
  const items = [
    { label: "Weekly Game", game: gamePts["Weekly Game"] || 0, grade: Math.round(gradeQuizTotal * 10) / 10, weeks: quizWeeks, icon: "Q" },
    { label: "This or That", game: gamePts["This or That"] || 0, grade: gradeTotTotal, weeks: totWeeks, icon: "TT" },
    { label: "Around the Horn", game: gamePts["PTI"] || 0, grade: gradePtiTotal, weeks: ptiWeeks, icon: "P" },
    { label: "Fishbowl", game: gamePts["Fishbowl"] || 0, grade: gradeFbTotal, weeks: fbWeeks, icon: "FB" },
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        {items.map(p => (
          <div key={p.label} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid " + BORDER }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: TEXT_SECONDARY, flexShrink: 0 }}>{p.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>{p.label}</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div>
                <div style={{ fontSize: 9, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase" }}>Game</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: TEXT_PRIMARY }}>{p.game}</div>
              </div>
              {p.grade > 0 && (
                <div>
                  <div style={{ fontSize: 9, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase" }}>Grade</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: TEXT_PRIMARY }}>{Math.round(p.grade * 10) / 10}</div>
                </div>
              )}
            </div>
            {p.weeks > 0 && <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 4 }}>{p.weeks} week{p.weeks !== 1 ? "s" : ""} recorded</div>}
          </div>
        ))}
      </div>
      {(gamePts["Team Win"] || 0) > 0 && (
        <div style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid " + BORDER, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>Team Win Bonuses</span>
          <span style={{ fontSize: 16, fontWeight: 900, color: TEXT_PRIMARY }}>{gamePts["Team Win"]}</span>
        </div>
      )}
      <div style={{ padding: "10px 12px", borderRadius: 10, background: "#f8fafc", border: "1px solid " + BORDER }}>
        <div style={{ ...sectionLabel, marginBottom: 6 }}>Game Dual Weighting</div>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr", gap: "4px 12px", fontSize: 12 }}>
          <div style={{ fontWeight: 700, color: TEXT_MUTED }}></div>
          <div style={{ fontWeight: 700, color: TEXT_MUTED }}>Qs</div>
          <div style={{ fontWeight: 700, color: TEXT_MUTED }}>Game</div>
          <div style={{ fontWeight: 700, color: TEXT_MUTED }}>Grade</div>
          {QUIZ_BREAKDOWN.map(q => (
            <React.Fragment key={q.id}>
              <div style={{ fontWeight: 600, color: TEXT_SECONDARY }}>{q.label}</div>
              <div style={{ color: TEXT_SECONDARY }}>{q.count}</div>
              <div style={{ color: TEXT_SECONDARY }}>{q.gamePts} pts ea</div>
              <div style={{ color: TEXT_SECONDARY }}>{q.gradePts} pts ea</div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}


/* ─── GRADEBOOK ─── */
/* --- STUDENT SUBMISSION (doc link only) --- */
function StudentSubmission({ assignmentId, data, setData, studentId, existing }) {
  const [docUrl, setDocUrl] = useState(existing?.docUrl || "");
  const [notes, setNotes] = useState(existing?.notes || "");
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  React.useEffect(() => {
    setDocUrl(existing?.docUrl || "");
    setNotes(existing?.notes || "");
  }, [existing?.docUrl, existing?.notes]);

  const submit = async () => {
    if (!docUrl.trim()) return;
    const key = studentId + "-" + assignmentId;
    const submissions = data.submissions || {};
    const updated = { ...data, submissions: { ...submissions, [key]: { docUrl: docUrl.trim(), notes: notes.trim(), ts: Date.now() } } };
    await saveData(updated); setData(updated); showMsg("Submitted");
  };

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid " + BORDER }}>
      {msg && <div style={{ fontSize: 12, color: GREEN, fontWeight: 600, marginBottom: 4 }}>{msg}</div>}
      <div style={{ fontSize: 10, fontWeight: 800, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>Your Submission</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <input value={docUrl} onChange={e => setDocUrl(e.target.value)} placeholder="Google Doc link" style={{ ...inp, fontSize: 13, padding: "8px 10px" }} />
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes for your instructor (optional)" rows={2} style={{ ...inp, fontSize: 13, padding: "8px 10px", resize: "vertical" }} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={submit} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff" }}>{existing?.ts ? "Resubmit" : "Submit"}</button>
        </div>
      </div>
      {existing?.ts && <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 6 }}>Submitted {new Date(existing.ts).toLocaleString()}</div>}
    </div>
  );
}

function RegradeRequest({ assignmentId, data, setData, studentId }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const key = studentId + "-" + assignmentId;
  const existing = (data.regradeRequests || {})[key];

  const submit = async () => {
    if (!note.trim()) return;
    const regradeRequests = { ...(data.regradeRequests || {}), [key]: { note: note.trim(), ts: Date.now() } };
    const updated = { ...data, regradeRequests };
    await saveData(updated); setData(updated);
    setOpen(false); setNote(""); showMsg("Regrade requested");
  };

  const cancel = async () => {
    if (!window.confirm("Cancel your regrade request?")) return;
    const regradeRequests = { ...(data.regradeRequests || {}) };
    delete regradeRequests[key];
    const updated = { ...data, regradeRequests };
    await saveData(updated); setData(updated); showMsg("Request cancelled");
  };

  if (existing) {
    return (
      <div style={{ marginTop: 8, padding: "8px 10px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a" }}>
        {msg && <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600, marginBottom: 4 }}>{msg}</div>}
        <div style={{ fontSize: 11, fontWeight: 700, color: AMBER, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Regrade Requested</div>
        <div style={{ fontSize: 13, color: "#92400e", lineHeight: 1.4 }}>{existing.note}</div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Sent {new Date(existing.ts).toLocaleString()}</div>
        <button onClick={cancel} style={{ ...pill, background: "#fff", color: TEXT_SECONDARY, border: "1px solid #e5e7eb", fontSize: 11, marginTop: 6 }}>Cancel Request</button>
      </div>
    );
  }

  if (open) {
    return (
      <div style={{ marginTop: 8, padding: "10px 12px", background: "#fafafa", borderRadius: 10, border: "1px solid " + BORDER }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>Request Regrade</div>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Tell your instructor what to look for (required)..." rows={3} style={{ ...inp, fontSize: 13, padding: "8px 10px", resize: "vertical", marginBottom: 6 }} />
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <button onClick={() => { setOpen(false); setNote(""); }} style={pillInactive}>Cancel</button>
          <button onClick={submit} disabled={!note.trim()} style={{ ...pill, background: note.trim() ? TEXT_PRIMARY : "#d1d5db", color: "#fff" }}>Submit Request</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
      {msg && <div style={{ fontSize: 12, color: GREEN, fontWeight: 600, marginRight: "auto" }}>{msg}</div>}
      <button onClick={() => setOpen(true)} style={{ ...pill, background: "#fff", color: ACCENT, border: "1px solid " + ACCENT + "40", fontSize: 12 }}>Request Regrade</button>
    </div>
  );
}

/* --- BULK NOTES IMPORT --- */
function BulkNotesImport({ assignmentId, data, setData }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("text"); // "text" | "photo"
  const [text, setText] = useState("");
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const students = (data.students || []).filter(s => s.name !== ADMIN_NAME);
  const bulkNotes = (data.bulkNotes || {})[assignmentId] || {};
  const noteCount = Object.keys(bulkNotes).length;

  const parseAndSave = async (input) => {
    const lines = input.split("\n").filter(l => l.trim());
    const notes = { ...bulkNotes };
    let matched = 0;

    lines.forEach(line => {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) return;
      const namePart = line.slice(0, colonIdx).trim().toLowerCase();
      const comment = line.slice(colonIdx + 1).trim();
      if (!comment) return;

      const student = students.find(s => {
        const full = s.name.toLowerCase();
        const first = full.split(" ")[0];
        const last = full.split(" ").slice(-1)[0];
        return full === namePart || first === namePart || last === namePart || full.includes(namePart);
      });

      if (student) {
        notes[student.id] = comment;
        matched++;
      }
    });

    if (matched === 0) {
      showMsg("No students matched. Use first name, last name, or full name before the colon.");
      return;
    }

    const allBulk = { ...(data.bulkNotes || {}), [assignmentId]: notes };
    const updated = { ...data, bulkNotes: allBulk };
    await saveData(updated); setData(updated);
    setText("");
    showMsg("Matched " + matched + " student" + (matched !== 1 ? "s" : ""));
  };

  const handleText = async () => {
    if (!text.trim()) return;
    await parseAndSave(text);
  };

  const handleImage = async (file) => {
    if (!file) return;
    setLoading(true);

    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = () => rej(new Error("Read failed"));
        r.readAsDataURL(file);
      });

      const studentList = students.map(s => s.name).join(", ");

      const response = await fetch("/api/generate-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `This is a photo of handwritten grading notes. Extract each student's note and format as "Student Name: comment" on separate lines.

The students in this class are: ${studentList}

Match each note to the correct student name from the list above. Use the student's full name exactly as listed. If you can't read a name or match it, skip it. Only output the matched lines, nothing else.`,
          image: base64,
          mediaType: file.type || "image/jpeg",
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Image parse error:", response.status, errText);
        showMsg("Error reading image. Check console.");
        setLoading(false);
        return;
      }

      const result = await response.json();
      const parsed = (result.content || []).map(c => c.text || "").join("");
      setText(parsed);
      showMsg("Notes extracted from image. Review and click Save.");
    } catch (err) {
      console.error("Image upload error:", err);
      showMsg("Error processing image.");
    }
    setLoading(false);
    setImageData(null);
  };

  const clearAll = async () => {
    if (!window.confirm("Clear all bulk notes for this assignment?")) return;
    const allBulk = { ...(data.bulkNotes || {}) };
    delete allBulk[assignmentId];
    const updated = { ...data, bulkNotes: allBulk };
    await saveData(updated); setData(updated);
    showMsg("Cleared");
  };

  if (!open) {
    return (
      <div style={{ marginTop: 6 }}>
        <button onClick={() => setOpen(true)} style={{ ...pillInactive, fontSize: 11 }}>
          Bulk Notes {noteCount > 0 ? "(" + noteCount + " saved)" : ""}
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8, padding: "12px 14px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
      {msg && <div style={{ fontSize: 12, color: GREEN, fontWeight: 600, marginBottom: 6 }}>{msg}</div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRIMARY }}>Bulk Notes Import</div>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#d1d5db" }}>x</button>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        <button onClick={() => setMode("text")} style={{ ...pill, fontSize: 11, padding: "4px 10px", background: mode === "text" ? TEXT_PRIMARY : "#e5e7eb", color: mode === "text" ? "#fff" : TEXT_SECONDARY }}>Type / Paste</button>
        <button onClick={() => setMode("photo")} style={{ ...pill, fontSize: 11, padding: "4px 10px", background: mode === "photo" ? TEXT_PRIMARY : "#e5e7eb", color: mode === "photo" ? "#fff" : TEXT_SECONDARY }}>Photo of Notes</button>
      </div>

      {mode === "text" && (
        <div>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder={"One per line:\nJohn: Great interview subject choice\nJane: Needs deeper follow-up questions\nBob: Really impressed with the thank-you"} rows={6} style={{ ...inp, fontSize: 13, padding: "8px 10px", resize: "vertical", marginBottom: 6 }} />
          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
            <button onClick={handleText} disabled={!text.trim()} style={{ ...pill, background: text.trim() ? TEXT_PRIMARY : "#d1d5db", color: "#fff" }}>Save Notes</button>
          </div>
        </div>
      )}

      {mode === "photo" && (
        <div>
          <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 6 }}>Take a photo of your handwritten notes. AI will read them and match to students.</div>
          <input type="file" accept="image/*" capture="environment" onChange={e => { if (e.target.files[0]) handleImage(e.target.files[0]); }} style={{ marginBottom: 6 }} />
          {loading && <div style={{ fontSize: 13, color: ACCENT, fontWeight: 600 }}>Reading your notes...</div>}
          {text && !loading && (
            <div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 4 }}>Extracted notes (edit if needed, then save):</div>
              <textarea value={text} onChange={e => setText(e.target.value)} rows={6} style={{ ...inp, fontSize: 13, padding: "8px 10px", resize: "vertical", marginBottom: 6 }} />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={handleText} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff" }}>Save Notes</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show existing notes */}
      {noteCount > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Saved notes ({noteCount})</div>
          {students.filter(s => bulkNotes[s.id]).map(s => (
            <div key={s.id} style={{ fontSize: 12, color: "#111827", padding: "4px 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ fontWeight: 600 }}>{s.name}:</span> <span style={{ color: TEXT_SECONDARY }}>{bulkNotes[s.id]}</span>
            </div>
          ))}
          <button onClick={clearAll} style={{ ...pill, fontSize: 10, background: "#fef2f2", color: RED, marginTop: 6 }}>Clear All Notes</button>
        </div>
      )}
    </div>
  );
}

/* --- QUICK GRADE --- */
function QuickGrade({ assignmentId, studentId, studentName, data, setData, onClose }) {
  const rubric = (data.assignmentRubrics || {})[assignmentId];
  const sub = (data.submissions || {})[studentId + "-" + assignmentId];
  const existingGrade = (data.grades || {})[studentId + "-" + assignmentId] || {};

  const [selected, setSelected] = useState(new Set());
  const bulkNote = ((data.bulkNotes || {})[assignmentId] || {})[studentId] || "";
  const [customNote, setCustomNote] = useState(bulkNote);
  const [generatedComment, setGeneratedComment] = useState("");
  const [suggestedTier, setSuggestedTier] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [score, setScore] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("select"); // "select" | "review"
  const [addingItem, setAddingItem] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemExplanation, setNewItemExplanation] = useState("");
  const [newItemPositive, setNewItemPositive] = useState(false);
  const [newItemSub, setNewItemSub] = useState("general");
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  if (!rubric) return null;

  const tiers = rubric.tiers || [];
  const allItems = rubric.items || [];
  const sections = rubric.sections || [];

  // Flatten subsections for the new item dropdown
  const allSubsections = [];
  sections.forEach(sec => {
    (sec.subsections || []).forEach(sub => {
      allSubsections.push({ id: sub.id, label: sec.label + " > " + sub.label });
    });
  });

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const saveNewItemToRubric = async () => {
    if (!newItemLabel.trim()) return;
    const newItem = { id: genId(), sub: newItemSub, label: newItemLabel.trim(), explanation: newItemExplanation.trim(), link: "", positive: newItemPositive };
    const rubrics = data.assignmentRubrics || {};
    const current = rubrics[assignmentId] || rubric;
    const updatedRubric = { ...current, items: [...(current.items || []), newItem] };
    const updated = { ...data, assignmentRubrics: { ...rubrics, [assignmentId]: updatedRubric } };
    await saveData(updated); setData(updated);
    // Auto-select the new item
    const next = new Set(selected);
    next.add(newItem.id);
    setSelected(next);
    setNewItemLabel(""); setNewItemExplanation(""); setNewItemPositive(false); setNewItemSub("general"); setAddingItem(false);
    showMsg("Added to rubric");
  };

  const generateFeedback = async () => {
    if (selected.size === 0) { showMsg("Select at least one feedback item"); return; }
    setLoading(true);
    try {
      const selectedItems = allItems.filter(i => selected.has(i.id));
      const positives = selectedItems.filter(i => i.positive);
      const negatives = selectedItems.filter(i => !i.positive);

      // Build section context for the AI
      const sectionInfo = sections.map(s => {
        const subIds = (s.subsections || []).map(sub => sub.id);
        const sectionItems = selectedItems.filter(i => subIds.includes(i.sub));
        return { label: s.label, weight: s.weight, positiveCount: sectionItems.filter(i => i.positive).length, negativeCount: sectionItems.filter(i => !i.positive).length };
      }).filter(s => s.positiveCount + s.negativeCount > 0);

      const generalItems = selectedItems.filter(i => i.sub === "general");

      const tierList = tiers.map(t => t.label + " (" + t.min + "-" + t.max + ")").join(", ");

      const prompt = `You are writing brief grading feedback for a college professor. The professor's style is casual, warm, and direct. Short sentences. No flowery language. No words like "excellence," "exemplary," "substantive," "demonstrates," "genuinely," "meaningful," "exceptional." Write like a real person talking to a student they like.

Rules:
- Keep it SHORT. 2-4 short paragraphs max. Each paragraph is 1-3 sentences.
- Plain text only. No bullet points, no numbered lists, no markdown, no bold headers.
- Lead with the positive stuff, then areas for improvement.
- Address the student as "you"
- Use the explanation text from each feedback item but rewrite it to be casual and concise. Don't just copy it verbatim.
- If there are links, include them naturally.
- No filler phrases like "Overall," "In conclusion," "This assignment," "Moving forward." Just say the thing.
- Sound like a person, not a grading rubric.

Good example of the right tone: "Nice work on the interview guide. Your questions are thoughtful and well-organized. The summary is clear and I can tell you actually engaged with the conversation. One thing to work on: include more specific details from the interview itself. I want to hear what they actually said, not just general takeaways."

${customNote ? "Include this personal note at the start (keep it natural): " + customNote : ""}

Sections and their approximate weights:
${sectionInfo.map(s => s.label + " (~" + s.weight + "%): " + s.positiveCount + " positive, " + s.negativeCount + " negative").join("\n")}
${generalItems.length > 0 ? "General items: " + generalItems.length : ""}

Selected positive feedback:
${positives.map(i => "- " + i.label + ": " + i.explanation + (i.link ? " [Link: " + i.link + "]" : "")).join("\n") || "(none)"}

Selected negative feedback:
${negatives.map(i => "- " + i.label + ": " + i.explanation + (i.link ? " [Link: " + i.link + "]" : "")).join("\n") || "(none)"}

Available tiers: ${tierList}

Based on the balance of positive and negative feedback across the weighted sections, suggest the most appropriate tier. Respond with ONLY a JSON object (no markdown, no backticks):
{"tier": "tier label", "comment": "your full comment to the student"}`;

      const response = await fetch("/api/generate-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("API error:", response.status, errText);
        showMsg("Error: " + response.status + ". Check console.");
        setLoading(false);
        return;
      }

      const result = await response.json();
      const text = (result.content || []).map(c => c.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      setGeneratedComment(parsed.comment || "");
      const tierMatch = tiers.find(t => t.label.toLowerCase() === (parsed.tier || "").toLowerCase());
      if (tierMatch) {
        setSuggestedTier(tierMatch.label);
        setSelectedTier(tierMatch.label);
        setScore(String(Math.round((tierMatch.min + tierMatch.max) / 2)));
      }
      setStep("review");
    } catch (err) {
      console.error("Quick Grade AI error:", err);
      showMsg("Error generating feedback. Try again.");
    }
    setLoading(false);
  };

  const selectTier = (tierLabel) => {
    setSelectedTier(tierLabel);
    const t = tiers.find(x => x.label === tierLabel);
    if (t) setScore(String(Math.round((t.min + t.max) / 2)));
  };

  const saveQuickGrade = async () => {
    if (!score) { showMsg("Enter a score"); return; }
    const key = studentId + "-" + assignmentId;
    const grades = data.grades || {};
    const existing = grades[key] || {};
    const newGrade = { ...existing, score: parseFloat(score), outOf: 100, comment: generatedComment, gradedTs: Date.now() };
    const regradeRequests = { ...(data.regradeRequests || {}) };
    delete regradeRequests[key];
    const gradeNotifications = { ...(data.gradeNotifications || {}), [key]: { ts: Date.now() } };
    const updated = { ...data, grades: { ...grades, [key]: newGrade }, regradeRequests, gradeNotifications };
    await saveData(updated); setData(updated);
    showMsg("Grade saved");
    onClose();
  };

  // Render subsection items as toggle buttons
  const renderSubItems = (subId) => {
    const subItems = allItems.filter(i => i.sub === subId);
    if (subItems.length === 0) return <div style={{ fontSize: 12, color: "#d1d5db", fontStyle: "italic", padding: "2px 0" }}>No items</div>;
    return subItems.map(item => {
      const isOn = selected.has(item.id);
      const bg = isOn ? (item.positive ? GREEN : RED) : (item.positive ? "#ecfdf5" : "#fef2f2");
      const color = isOn ? "#fff" : (item.positive ? "#065f46" : "#991b1b");
      const border = isOn ? "transparent" : (item.positive ? "#a7f3d0" : "#fecaca");
      return (
        <button key={item.id} onClick={() => toggle(item.id)} style={{ ...pill, padding: "6px 12px", fontSize: 12, background: bg, color, border: "1.5px solid " + border, margin: "2px 4px 2px 0" }}>
          {item.positive ? "+" : "-"} {item.label}
        </button>
      );
    });
  };

  return (
    <div style={{ ...crd, padding: 16, marginBottom: 12, border: "2px solid " + ACCENT }}>
      {msg && <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#1e293b", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 999 }}>{msg}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: "#111827" }}>Quick Grade: {studentName}</div>
          <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{(data.assignments || []).find(a => a.id === assignmentId)?.name}</div>
        </div>
        <button onClick={onClose} style={pillInactive}>Close</button>
      </div>

      {/* Submission link */}
      {sub && (
        <div style={{ padding: "8px 10px", background: "#f9fafb", borderRadius: 8, marginBottom: 12 }}>
          {sub.docUrl && <a href={sub.docUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: ACCENT, fontWeight: 500 }}>View Submission</a>}
          {sub.notes && <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>"{sub.notes}"</div>}
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Submitted {new Date(sub.ts).toLocaleString()}</div>
        </div>
      )}

      {step === "select" && (
        <div>
          {/* Free form instructions to AI */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 4 }}>Say something to the student (optional)</div>
            <textarea value={customNote} onChange={e => setCustomNote(e.target.value)} placeholder={"e.g. \"Let them know I'm here if they have questions\" or \"Great job picking this person\""} rows={2} style={{ ...inp, fontSize: 13, padding: "8px 10px", resize: "vertical" }} />
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>This gets woven into the comment naturally. Say it however you want.</div>
          </div>

          {/* Sections with subsections and items */}
          {sections.map(sec => (
            <div key={sec.id} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#111827", marginBottom: 6 }}>{sec.label} <span style={{ fontWeight: 500, color: TEXT_MUTED }}>(~{sec.weight}%)</span></div>
              {(sec.subsections || []).map(sub => (
                <div key={sub.id} style={{ marginBottom: 8, marginLeft: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{sub.label}</div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {renderSubItems(sub.id)}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* General items */}
          {allItems.filter(i => i.sub === "general").length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#111827", marginBottom: 6 }}>General</div>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {renderSubItems("general")}
              </div>
            </div>
          )}

          {/* Add new item to rubric */}
          {!addingItem ? (
            <button onClick={() => setAddingItem(true)} style={{ ...pillInactive, fontSize: 11, marginBottom: 12 }}>+ Add new feedback item to rubric</button>
          ) : (
            <div style={{ padding: "10px 12px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb", marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 6 }}>New rubric item (saves for all students)</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <button onClick={() => setNewItemPositive(!newItemPositive)} style={{ ...pill, padding: "4px 10px", fontSize: 11, background: newItemPositive ? GREEN : RED, color: "#fff", flexShrink: 0 }}>{newItemPositive ? "+ Positive" : "- Negative"}</button>
                <select value={newItemSub} onChange={e => setNewItemSub(e.target.value)} style={{ ...sel, fontSize: 12, padding: "4px 8px" }}>
                  <option value="general">General</option>
                  {allSubsections.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <input value={newItemLabel} onChange={e => setNewItemLabel(e.target.value)} placeholder="Button label (short)" style={{ ...inp, fontSize: 13, padding: "6px 8px", marginBottom: 4 }} />
              <textarea value={newItemExplanation} onChange={e => setNewItemExplanation(e.target.value)} placeholder="Explanation for student..." rows={2} style={{ ...inp, fontSize: 13, padding: "6px 8px", resize: "vertical", marginBottom: 6 }} />
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={saveNewItemToRubric} disabled={!newItemLabel.trim()} style={{ ...pill, background: newItemLabel.trim() ? "#111827" : "#d1d5db", color: "#fff", flex: 1 }}>Save to Rubric</button>
                <button onClick={() => { setAddingItem(false); setNewItemLabel(""); setNewItemExplanation(""); }} style={pillInactive}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={generateFeedback} disabled={loading || selected.size === 0} style={{ ...pill, background: selected.size > 0 ? "#111827" : "#d1d5db", color: "#fff", padding: "10px 20px", fontSize: 14 }}>
              {loading ? "Generating..." : "Generate Feedback (" + selected.size + " selected)"}
            </button>
            <span style={{ fontSize: 12, color: TEXT_MUTED }}>{selected.size} item{selected.size !== 1 ? "s" : ""} selected</span>
          </div>
        </div>
      )}

      {step === "review" && (
        <div>
          {/* Tier selection */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 6 }}>
              Tier {suggestedTier ? "(AI suggested: " + suggestedTier + ")" : ""}
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {tiers.map(t => (
                <button key={t.label} onClick={() => selectTier(t.label)} style={{ ...pill, padding: "8px 14px", fontSize: 12, background: selectedTier === t.label ? "#111827" : "#f3f4f6", color: selectedTier === t.label ? "#fff" : "#4b5563", border: suggestedTier === t.label && selectedTier !== t.label ? "2px solid " + ACCENT : "2px solid transparent" }}>
                  {t.label} ({t.min}-{t.max})
                </button>
              ))}
            </div>
          </div>

          {/* Score */}
          <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase" }}>Score</div>
            <input type="number" value={score} onChange={e => setScore(e.target.value)} style={{ ...inp, width: 70, fontSize: 16, fontWeight: 900, padding: "6px 10px", textAlign: "center" }} />
            <span style={{ fontSize: 13, color: TEXT_MUTED }}>/ 100</span>
            {selectedTier && (() => {
              const t = tiers.find(x => x.label === selectedTier);
              const s = parseFloat(score);
              if (t && (s < t.min || s > t.max)) return <span style={{ fontSize: 11, color: AMBER, fontWeight: 600 }}>Outside {selectedTier} range ({t.min}-{t.max})</span>;
              return null;
            })()}
          </div>

          {/* Comment preview */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 4 }}>Comment (editable)</div>
            <textarea value={generatedComment} onChange={e => setGeneratedComment(e.target.value)} rows={8} style={{ ...inp, fontSize: 13, padding: "10px 12px", resize: "vertical", lineHeight: 1.6 }} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveQuickGrade} style={{ ...pill, background: GREEN, color: "#fff", padding: "10px 20px", fontSize: 14, flex: 1 }}>Save Grade</button>
            <button onClick={() => setStep("select")} style={{ ...pillInactive, padding: "10px 16px" }}>Back</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- ADMIN SUBMISSIONS VIEW --- */
function AdminSubmissions({ assignmentId, data, setData }) {
  const submissions = data.submissions || {};
  const grades = data.grades || {};
  const sorted = [...data.students].filter(s => s.name !== ADMIN_NAME).sort(lastSortObj);
  const [editGrades, setEditGrades] = useState({});
  const [quickGradeStudent, setQuickGradeStudent] = useState(null);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };
  const hasRubric = !!(data.assignmentRubrics || {})[assignmentId];

  const saveGrade = async (studentId) => {
    const eg = editGrades[studentId] || {};
    const key = studentId + "-" + assignmentId;
    const existing = grades[key] || {};
    const newGrade = {
      ...existing,
      score: eg.score !== undefined ? (eg.score === "" ? undefined : parseFloat(eg.score)) : existing.score,
      outOf: eg.outOf !== undefined ? (parseFloat(eg.outOf) || 100) : (existing.outOf || 100),
      comment: eg.comment !== undefined ? eg.comment : (existing.comment || ""),
      gradedTs: Date.now(),
    };
    // Auto-clear regrade request for this student/assignment
    const regradeRequests = { ...(data.regradeRequests || {}) };
    delete regradeRequests[key];
    // Create grade notification
    const gradeNotifications = { ...(data.gradeNotifications || {}), [key]: { ts: Date.now() } };
    const updated = {
      ...data,
      grades: { ...grades, [key]: newGrade },
      regradeRequests,
      gradeNotifications,
    };
    await saveData(updated); setData(updated);
    setEditGrades(prev => { const n = { ...prev }; delete n[studentId]; return n; });
    showMsg("Saved");
  };

  const startGradeEdit = (studentId) => {
    const key = studentId + "-" + assignmentId;
    const g = grades[key] || {};
    setEditGrades(prev => ({ ...prev, [studentId]: { score: g.score !== undefined ? String(g.score) : "", outOf: String(g.outOf || 100), comment: g.comment || "" } }));
  };

  return (
    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
      {msg && <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>{msg}</div>}
      {sorted.map(s => {
        const sub = submissions[s.id + "-" + assignmentId];
        const grade = grades[s.id + "-" + assignmentId] || {};
        const isEditing = editGrades[s.id] !== undefined;
        const eg = editGrades[s.id] || {};

        return (
          <div key={s.id} style={{ padding: 12, borderRadius: 10, background: sub ? "#f9fafb" : "transparent", border: "1px solid " + (sub ? "#e5e7eb" : "#f3f4f6") }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: sub ? 6 : 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{s.name}</div>
              {grade.score !== undefined && !isEditing && (
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{grade.score}<span style={{ fontSize: 12, color: "#9ca3af" }}>/{grade.outOf || 100}</span></div>
              )}
              {!sub && !isEditing && <span style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>No submission</span>}
            </div>
            {sub && (
              <div style={{ marginBottom: 8 }}>
                {sub.docUrl && <a href={sub.docUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: ACCENT, textDecoration: "none", fontWeight: 500, display: "block", marginBottom: 2 }}>Google Doc</a>}
                {sub.notes && <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4, lineHeight: 1.4 }}>"{sub.notes}"</div>}
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Submitted {new Date(sub.ts).toLocaleString()}</div>
              </div>
            )}
            {grade.comment && !isEditing && <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4, padding: "6px 8px", background: "#eff6ff", borderRadius: 6, lineHeight: 1.4 }}>{grade.comment}</div>}
            {/* Regrade request */}
            {(() => {
              const rr = (data.regradeRequests || {})[s.id + "-" + assignmentId];
              if (!rr || isEditing) return null;
              return (
                <div style={{ marginTop: 6, padding: "6px 8px", background: "#fffbeb", borderRadius: 6, border: "1px solid #fde68a" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: AMBER, marginBottom: 2 }}>Regrade Request</div>
                  <div style={{ fontSize: 12, color: "#92400e", lineHeight: 1.4 }}>{rr.note}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{new Date(rr.ts).toLocaleString()}</div>
                </div>
              );
            })()}
            {isEditing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={eg.score} onChange={e => setEditGrades(prev => ({ ...prev, [s.id]: { ...eg, score: e.target.value } }))} placeholder="Score" style={{ ...inp, fontSize: 13, padding: "6px 8px", width: 70 }} type="number" />
                  <span style={{ fontSize: 13, color: "#9ca3af", display: "flex", alignItems: "center" }}>/</span>
                  <input value={eg.outOf} onChange={e => setEditGrades(prev => ({ ...prev, [s.id]: { ...eg, outOf: e.target.value } }))} placeholder="Out of" style={{ ...inp, fontSize: 13, padding: "6px 8px", width: 70 }} type="number" />
                </div>
                <textarea value={eg.comment} onChange={e => setEditGrades(prev => ({ ...prev, [s.id]: { ...eg, comment: e.target.value } }))} placeholder="Comment for student..." rows={2} style={{ ...inp, fontSize: 13, padding: "6px 8px", resize: "vertical" }} />
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => saveGrade(s.id)} style={{ ...pill, background: "#111827", color: "#fff", flex: 1 }}>Save</button>
                  <button onClick={() => setEditGrades(prev => { const n = { ...prev }; delete n[s.id]; return n; })} style={pillInactive}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                <button onClick={() => startGradeEdit(s.id)} style={{ ...pillInactive, fontSize: 12, flex: 1 }}>Grade</button>
                {hasRubric && <button onClick={() => setQuickGradeStudent(quickGradeStudent === s.id ? null : s.id)} style={{ ...pill, fontSize: 12, background: quickGradeStudent === s.id ? ACCENT : "#eff6ff", color: quickGradeStudent === s.id ? "#fff" : ACCENT }}>Quick Grade</button>}
              </div>
            )}
            {quickGradeStudent === s.id && (
              <div style={{ marginTop: 8 }}>
                <QuickGrade assignmentId={assignmentId} studentId={s.id} studentName={s.name} data={data} setData={setData} onClose={() => setQuickGradeStudent(null)} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GameVsGradeComparison({ data, computeAutoParticipation, assignments, grades }) {
  const [openId, setOpenId] = useState(null);
  const [sortKey, setSortKey] = useState("game");
  const [sortDir, setSortDir] = useState("desc");

  const log = data.log || [];
  const students = (data.students || []).filter(s => s.name !== ADMIN_NAME && s.name !== "Bruce Willis");
  const reboundGrades = data.reboundGrades || {};
  const weeklyGames = data.weeklyGames || {};
  const weeklyToT = data.weeklyToT || {};
  const weeklyFishbowl = data.weeklyFishbowl || {};
  const partWeight = (assignments.find(a => a.id === "participation")?.weight) || 25;
  const gradeAssignments = assignments.filter(a => a.id !== "participation");
  const totalAssignmentWeight = assignments.reduce((s, a) => s + (a.weight || 0), 0);

  const scoredGameWeeks = Object.keys(weeklyGames).filter(w => weeklyGames[w]?.scored).sort((a, b) => parseInt(a) - parseInt(b));
  const scoredToTWeeks = Object.keys(weeklyToT).filter(w => weeklyToT[w]?.scored).sort((a, b) => parseInt(a) - parseInt(b));
  const confirmedFbWeeks = Object.keys(weeklyFishbowl).filter(w => weeklyFishbowl[w]?.confirmed).sort((a, b) => parseInt(a) - parseInt(b));

  // Recompute weekly game points from activity (matches getWeeklyGameBreakdown)
  // Returns { gamePts, gradePts } for one student/week
  const computeGameWeek = (sid, w) => {
    const game = weeklyGames[w];
    if (!game) return { gamePts: 0, gradePts: 0 };
    let gamePts = 0;
    let gradeOriginal = 0;
    (game.questions || []).forEach((q, qi) => {
      const ans = game.responses?.[sid + "-" + qi];
      if (ans === q.correct) {
        gamePts += 10; // each correct = 10 game pts
        const cat = q.category || "on_topic";
        gradeOriginal += cat === "on_topic" ? 15 : 2.5;
      }
    });
    // Apply rebound override to grade only
    const rg = reboundGrades[sid + "-game-" + w];
    let gradePts = gradeOriginal;
    if (rg && typeof rg.gradePoints === "number") {
      if (rg.type === "makeup") {
        gradePts = Math.max(gradeOriginal, rg.gradePoints);
      } else {
        let cap;
        if (rg.type === "absence_override") cap = 60;
        else if (gradeOriginal < 50) cap = 60;
        else if (gradeOriginal <= 65) cap = 70;
        else if (gradeOriginal <= 79) cap = 80;
        else cap = 100;
        const capped = Math.min(rg.gradePoints, cap);
        gradePts = Math.max(gradeOriginal, capped);
      }
    }
    return { gamePts, gradePts: Math.round(gradePts * 10) / 10 };
  };

  // ToT: leaderboard only. Recompute from activity.
  const computeToTWeek = (sid, w) => {
    const tot = weeklyToT[w];
    if (!tot) return { gamePts: 0 };
    const ptsEach = tot.questions?.length > 0 ? 20 / tot.questions.length : 20;
    let gamePts = 0;
    (tot.questions || []).forEach((q, qi) => {
      if (tot.responses?.[sid + "-" + qi] === q.correct) gamePts += ptsEach;
    });
    return { gamePts: Math.round(gamePts * 10) / 10 };
  };

  // Fishbowl: from scores object
  const computeFbWeek = (sid, w) => {
    const fb = weeklyFishbowl[w];
    if (!fb) return { gamePts: 0, gradePts: 0 };
    const score = fb.scores?.[sid] ?? 0;
    return { gamePts: score, gradePts: score };
  };

  // Build rows
  const rows = students.map(s => {
    const sid = s.id;
    const components = [];

    let totalGameFromComponents = 0;
    let participationEarned = 0;
    let participationPossible = 0;

    // Weekly games
    scoredGameWeeks.forEach(w => {
      const { gamePts, gradePts } = computeGameWeek(sid, w);
      totalGameFromComponents += gamePts;
      participationEarned += gradePts;
      participationPossible += 100;
      components.push({ label: "Weekly Game Wk " + w, gamePts: Math.round(gamePts * 10) / 10, gradePts });
    });

    // This or That
    scoredToTWeeks.forEach(w => {
      const { gamePts } = computeToTWeek(sid, w);
      totalGameFromComponents += gamePts;
      components.push({ label: "This or That Wk " + w, gamePts, gradePts: null });
    });

    // Fishbowl
    confirmedFbWeeks.forEach(w => {
      const { gamePts, gradePts } = computeFbWeek(sid, w);
      totalGameFromComponents += gamePts;
      participationEarned += gradePts;
      participationPossible += 20;
      components.push({ label: "Fishbowl Wk " + w, gamePts, gradePts });
    });

    // Around the Horn / PTI from log
    const athLog = log.filter(e => e.studentId === sid && (e.source === "Around the Horn" || e.source === "PTI"));
    if (athLog.length > 0) {
      const gPts = Math.round(athLog.reduce((a, e) => a + e.amount, 0) * 10) / 10;
      totalGameFromComponents += gPts;
      participationEarned += gPts;
      components.push({ label: "Around the Horn / PTI", gamePts: gPts, gradePts: gPts });
    }

    // Team Win bonuses (game only, no space in source)
    const twLog = log.filter(e => e.studentId === sid && (e.source || "").startsWith("Team Win Wk"));
    if (twLog.length > 0) {
      const gPts = twLog.reduce((a, e) => a + e.amount, 0);
      totalGameFromComponents += gPts;
      components.push({ label: "Team Win Bonuses", gamePts: gPts, gradePts: null });
    }

    // Featured Post (game only)
    const fpLog = log.filter(e => e.studentId === sid && e.source === "Featured Post");
    if (fpLog.length > 0) {
      const gPts = fpLog.reduce((a, e) => a + e.amount, 0);
      totalGameFromComponents += gPts;
      components.push({ label: "Featured Post", gamePts: gPts, gradePts: null });
    }

    // Catch-all: anything in log not covered above
    const otherLog = log.filter(e => {
      if (e.studentId !== sid) return false;
      const src = e.source || "";
      if (src.startsWith("Game Wk")) return false; // covered by activity recompute
      if (src.startsWith("ToT Wk")) return false;
      if (src.startsWith("Fishbowl Wk") || src.startsWith("Fishbowl Star Wk")) return false;
      if (src.startsWith("Team Win Wk")) return false;
      if (src === "Around the Horn" || src === "PTI") return false;
      if (src === "Featured Post") return false;
      if (src.startsWith("Quiz Q") || src.startsWith("Quiz #")) return false; // legacy bulk awards from old game
      return true;
    });
    if (otherLog.length > 0) {
      const gPts = otherLog.reduce((a, e) => a + e.amount, 0);
      totalGameFromComponents += gPts;
      // Penalty entries (negative) feed both per Andrew
      const gradePts = gPts < 0 ? gPts : null;
      components.push({ label: "Other / Adjustments", gamePts: gPts, gradePts });
      if (gPts < 0) participationEarned += gPts;
    }

    // Leaderboard total = sum of ALL log entries (matches the actual leaderboard)
    const leaderboardTotal = log.filter(e => e.studentId === sid).reduce((a, e) => a + e.amount, 0);

    // Participation grade out of 25 (or partWeight)
    const participationPct = participationPossible > 0 ? (participationEarned / participationPossible) : 0;
    const participationGrade = participationPct * partWeight;

    // Final in-class grade — match AssignmentsView computeCurrentGrade
    let weightGraded = 0;
    let weightedScore = 0;
    gradeAssignments.forEach(a => {
      const g = grades[sid + "-" + a.id] || {};
      if (g.score !== undefined && g.score !== "") {
        weightGraded += a.weight;
        weightedScore += (parseFloat(g.score) / (g.outOf || 100)) * a.weight;
      }
    });
    weightGraded += partWeight;
    weightedScore += participationGrade;
    const finalGradePct = weightGraded > 0 ? Math.round(weightedScore / weightGraded * 1000) / 10 : null;
    const pctAssessed = totalAssignmentWeight > 0 ? Math.round(weightGraded / totalAssignmentWeight * 100) : 0;

    const letter = (() => {
      if (finalGradePct === null) return "—";
      if (finalGradePct >= 93) return "A";
      if (finalGradePct >= 90) return "A-";
      if (finalGradePct >= 87) return "B+";
      if (finalGradePct >= 83) return "B";
      if (finalGradePct >= 80) return "B-";
      if (finalGradePct >= 77) return "C+";
      if (finalGradePct >= 73) return "C";
      if (finalGradePct >= 70) return "C-";
      if (finalGradePct >= 60) return "D";
      return "F";
    })();

    return {
      student: s,
      components,
      leaderboardTotal: Math.round(leaderboardTotal * 10) / 10,
      gameFromComponents: Math.round(totalGameFromComponents * 10) / 10,
      participationEarned: Math.round(participationEarned * 10) / 10,
      participationPossible,
      participationPct,
      participationGrade: Math.round(participationGrade * 10) / 10,
      finalGradePct,
      pctAssessed,
      letter,
    };
  });

  // Compute leaderboard rank (by leaderboardTotal)
  const byGame = [...rows].sort((a, b) => b.leaderboardTotal - a.leaderboardTotal);
  byGame.forEach((r, i) => { r.gameRank = i + 1; });
  // Compute grade rank
  const byGrade = [...rows].filter(r => r.finalGradePct !== null).sort((a, b) => b.finalGradePct - a.finalGradePct);
  byGrade.forEach((r, i) => { r.gradeRank = i + 1; });
  rows.forEach(r => { if (r.gradeRank == null) r.gradeRank = null; });

  const sorted = [...rows].sort((a, b) => {
    let av, bv;
    if (sortKey === "name") { av = a.student.name; bv = b.student.name; return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av); }
    if (sortKey === "game") { av = a.leaderboardTotal; bv = b.leaderboardTotal; }
    else if (sortKey === "grade") { av = a.finalGradePct ?? -1; bv = b.finalGradePct ?? -1; }
    else if (sortKey === "gap") { av = (a.gameRank ?? 999) - (a.gradeRank ?? 999); bv = (b.gameRank ?? 999) - (b.gradeRank ?? 999); }
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const setSort = (k) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir(k === "name" ? "asc" : "desc"); }
  };

  const arrow = (k) => sortKey === k ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <div style={{ ...crd, padding: 20, marginTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ ...sectionLabel, marginBottom: 4 }}>Game vs Grade Comparison</div>
          <div style={{ fontSize: 12, color: TEXT_MUTED }}>Click a student to see how each component contributes to leaderboard score versus in-class grade.</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 90px 80px 100px 60px 70px", gap: 8, alignItems: "center", paddingBottom: 8, borderBottom: "1px solid " + BORDER_STRONG, marginBottom: 8 }}>
        <button onClick={() => setSort("name")} style={{ ...sectionLabel, background: "none", border: "none", textAlign: "left", cursor: "pointer", padding: 0 }}>Student{arrow("name")}</button>
        <button onClick={() => setSort("game")} style={{ ...sectionLabel, background: "none", border: "none", textAlign: "right", cursor: "pointer", padding: 0 }}>Leaderboard{arrow("game")}</button>
        <button onClick={() => setSort("game")} style={{ ...sectionLabel, background: "none", border: "none", textAlign: "right", cursor: "pointer", padding: 0 }}>LB Rank</button>
        <button onClick={() => setSort("grade")} style={{ ...sectionLabel, background: "none", border: "none", textAlign: "right", cursor: "pointer", padding: 0 }}>Grade %{arrow("grade")}</button>
        <span style={{ ...sectionLabel, textAlign: "right" }}>Letter</span>
        <button onClick={() => setSort("gap")} style={{ ...sectionLabel, background: "none", border: "none", textAlign: "right", cursor: "pointer", padding: 0 }}>Gap{arrow("gap")}</button>
      </div>

      {sorted.map(r => {
        const gap = (r.gameRank != null && r.gradeRank != null) ? (r.gameRank - r.gradeRank) : null;
        const gapColor = gap == null ? TEXT_MUTED : Math.abs(gap) >= 5 ? RED : Math.abs(gap) >= 3 ? AMBER : TEXT_SECONDARY;
        const gapStr = gap == null ? "—" : (gap > 0 ? "+" + gap : gap.toString());
        const isOpen = openId === r.student.id;
        return (
          <div key={r.student.id}>
            <button onClick={() => setOpenId(isOpen ? null : r.student.id)} style={{
              display: "grid", gridTemplateColumns: "1.4fr 90px 80px 100px 60px 70px", gap: 8, alignItems: "center",
              padding: "8px 0", width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid " + BORDER, cursor: "pointer", fontFamily: F,
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>{r.student.name}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: TEXT_PRIMARY, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.leaderboardTotal}</span>
              <span style={{ fontSize: 12, color: TEXT_SECONDARY, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>#{r.gameRank}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: TEXT_PRIMARY, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.finalGradePct !== null ? r.finalGradePct + "%" : "—"}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: TEXT_PRIMARY, textAlign: "right" }}>{r.letter}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: gapColor, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{gapStr}</span>
            </button>

            {isOpen && (
              <div style={{ padding: "12px 16px", background: "#fafafa", borderRadius: 10, marginTop: 8, marginBottom: 8 }}>
                {r.components.length === 0 ? (
                  <div style={{ fontSize: 12, color: TEXT_MUTED, fontStyle: "italic" }}>No participation data yet.</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F }}>
                    <thead>
                      <tr>
                        <th style={{ ...sectionLabel, textAlign: "left", padding: "4px 6px" }}>Component</th>
                        <th style={{ ...sectionLabel, textAlign: "right", padding: "4px 6px" }}>Game Pts</th>
                        <th style={{ ...sectionLabel, textAlign: "right", padding: "4px 6px" }}>Grade Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.components.map((c, i) => (
                        <tr key={i} style={{ borderTop: "1px solid " + BORDER }}>
                          <td style={{ fontSize: 13, color: TEXT_PRIMARY, padding: "6px 6px" }}>{c.label}</td>
                          <td style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, textAlign: "right", padding: "6px 6px", fontVariantNumeric: "tabular-nums" }}>{c.gamePts}</td>
                          <td style={{ fontSize: 13, fontWeight: 700, color: c.gradePts === null ? TEXT_MUTED : TEXT_PRIMARY, textAlign: "right", padding: "6px 6px", fontVariantNumeric: "tabular-nums" }}>{c.gradePts === null ? "—" : c.gradePts}</td>
                        </tr>
                      ))}
                      <tr style={{ borderTop: "2px solid " + BORDER_STRONG, background: "#fff" }}>
                        <td style={{ fontSize: 12, fontWeight: 800, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.06em", padding: "8px 6px" }}>Components Total</td>
                        <td style={{ fontSize: 14, fontWeight: 900, color: TEXT_PRIMARY, textAlign: "right", padding: "8px 6px", fontVariantNumeric: "tabular-nums" }}>{r.gameFromComponents}</td>
                        <td style={{ fontSize: 14, fontWeight: 900, color: TEXT_PRIMARY, textAlign: "right", padding: "8px 6px", fontVariantNumeric: "tabular-nums" }}>
                          {r.participationPossible > 0 ? r.participationEarned + " / " + r.participationPossible : "—"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
                <div style={{ display: "flex", gap: 16, marginTop: 12, paddingTop: 12, borderTop: "1px solid " + BORDER, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ ...sectionLabel, marginBottom: 2 }}>Leaderboard Total</div>
                    <div style={{ fontSize: 13, color: TEXT_PRIMARY }}>{r.leaderboardTotal} pts (rank #{r.gameRank})</div>
                    {r.leaderboardTotal !== r.gameFromComponents && (
                      <div style={{ fontSize: 11, color: AMBER, marginTop: 2 }}>Components sum: {r.gameFromComponents}. Diff: {Math.round((r.leaderboardTotal - r.gameFromComponents) * 10) / 10}</div>
                    )}
                  </div>
                  <div>
                    <div style={{ ...sectionLabel, marginBottom: 2 }}>Participation Grade</div>
                    <div style={{ fontSize: 13, color: TEXT_PRIMARY }}>
                      {r.participationPossible > 0
                        ? Math.round(r.participationPct * 1000) / 10 + "% (" + r.participationGrade + " / " + partWeight + ")"
                        : "No data yet"}
                    </div>
                  </div>
                  <div>
                    <div style={{ ...sectionLabel, marginBottom: 2 }}>Final In-Class Grade</div>
                    <div style={{ fontSize: 13, color: TEXT_PRIMARY }}>{r.finalGradePct !== null ? r.finalGradePct + "%, " + r.letter : "—"}</div>
                    {r.pctAssessed > 0 && r.pctAssessed < 100 && (
                      <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{r.pctAssessed}% of grade assessed so far</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div style={{ marginTop: 12, fontSize: 11, color: TEXT_MUTED, lineHeight: 1.5 }}>
        Leaderboard total = sum of all log entries. Game points per component recomputed from activity data. Grade points only count Weekly Games (dual-weighted), Fishbowl, and Around the Horn / PTI. This or That, Team Wins, and Featured Posts are leaderboard-only.
      </div>
    </div>
  );
}

export function Gradebook({ data, setData, userName, isAdmin, setView }) {
  const { theme } = useTheme("comm4-v1");
  const crd = themedInteriorCrd(theme, 0);
  const assignments = data.assignments || DEFAULT_ASSIGNMENTS;
  const grades = data.grades || {};
  const participation = data.participation || {};
  const [selStudent, setSelStudent] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [reboundModal, setReboundModal] = useState(null); // { type, week } or null
  const [activityFilter, setActivityFilter] = useState("all"); // "all" | "game" | "tot" | "fb"
  const [highlight, setHighlight] = useState(null); // "zero" | "missing" | "regrade" | "late" | null
  const [quickGradeId, setQuickGradeId] = useState(null); // "studentId-assignmentId" or null
  const isGuest = userName === GUEST_NAME;

  const student = isAdmin ? (selStudent ? data.students.find(s => s.id === selStudent) : null) : data.students.find(s => s.name === userName);
  const studentId = student?.id;

  const updateGrade = async (studentId, assignmentId, field, value) => {
    const key = studentId + "-" + assignmentId;
    const existing = grades[key] || {};
    const newGrade = { ...existing, [field]: value };
    let extra = {};
    // When updating score, clear regrade request and create notification
    if (field === "score") {
      newGrade.gradedTs = Date.now();
      const regradeRequests = { ...(data.regradeRequests || {}) };
      delete regradeRequests[key];
      const gradeNotifications = { ...(data.gradeNotifications || {}), [key]: { ts: Date.now() } };
      extra = { regradeRequests, gradeNotifications };
    }
    const updated = { ...data, grades: { ...grades, [key]: newGrade }, ...extra };
    await saveData(updated); setData(updated);
  };

  const updateParticipation = async (studentId, week, category, value) => {
    const key = studentId + "-w" + week + "-" + category;
    const updated = { ...data, participation: { ...participation, [key]: value } };
    await saveData(updated); setData(updated);
  };

  const getParticipation = (sid, week, cat) => {
    const key = sid + "-w" + week + "-" + cat;
    return participation[key];
  };

  const calcQuizScores = (sid) => {
    let totalGame = 0, totalGrade = 0, totalGamePossible = 0, totalGradePossible = 0;
    let weekDetails = [];
    for (let w = 1; w <= 10; w++) {
      const val = getParticipation(sid, w, "quiz");
      if (val === undefined || val === null || val === "") continue;
      const scores = typeof val === "object" ? val : { on_topic: 0, sports_world: 0 };
      let weekGame = 0, weekGrade = 0;
      QUIZ_BREAKDOWN.forEach(q => {
        const correct = scores[q.id] || 0;
        weekGame += correct * q.gamePts;
        weekGrade += correct * q.gradePts;
      });
      totalGame += weekGame;
      totalGrade += weekGrade;
      totalGamePossible += 100;
      totalGradePossible += 100;
      weekDetails.push({ week: w, game: Math.round(weekGame), grade: Math.round(weekGrade * 10) / 10, scores });
    }
    return { totalGame, totalGrade: Math.round(totalGrade * 10) / 10, totalGamePossible, totalGradePossible, weekDetails };
  };

  const calcCategoryTotal = (sid, cat) => {
    let total = 0, count = 0;
    for (let w = 1; w <= 10; w++) {
      const val = getParticipation(sid, w, cat);
      if (val !== undefined && val !== null && val !== "") {
        total += parseFloat(val) || 0;
        count++;
      }
    }
    return { total, count };
  };

  const computeAutoParticipation = (sid) => {
    const log = data.log || [];
    const weeklyGames = data.weeklyGames || {};
    const reboundGrades = data.reboundGrades || {};

    // Weekly games: recompute grade points from responses, then apply any rebound overrides
    let gameGradeEarned = 0;
    let gameGradePossible = 0;
    const scoredGames = Object.keys(weeklyGames).filter(w => weeklyGames[w]?.scored);
    scoredGames.forEach(w => {
      const game = weeklyGames[w];
      gameGradePossible += 100;
      let original = 0;
      (game.questions || []).forEach((q, qi) => {
        const ans = game.responses?.[sid + "-" + qi];
        if (ans === q.correct) {
          const cat = q.category || "on_topic";
          const catPts = cat === "on_topic" ? 15 : 2.5;
          original += catPts;
        }
      });
      // Apply rebound override if one exists for this student/week
      const rg = reboundGrades[sid + "-game-" + w];
      let earned = original;
      if (rg && typeof rg.gradePoints === "number") {
        if (rg.type === "makeup") {
          earned = Math.max(original, rg.gradePoints);
        } else {
          // Cap based on original grade percentage (or lowest tier for absence override)
          let cap;
          if (rg.type === "absence_override") cap = 60;
          else if (original < 50) cap = 60;
          else if (original <= 65) cap = 70;
          else if (original <= 79) cap = 80;
          else cap = 100;
          const capped = Math.min(rg.gradePoints, cap);
          earned = Math.max(original, capped);
        }
      }
      gameGradeEarned += earned;
    });

    // This or That: leaderboard only, does NOT contribute to participation grade
    const totEntries = log.filter(e => e.studentId === sid && (e.source || "").startsWith("ToT Wk"));
    const totEarned = totEntries.reduce((s, e) => s + e.amount, 0);
    const scoredToTs = Object.keys(data.weeklyToT || {}).filter(w => (data.weeklyToT[w] || {}).scored).length;
    const totPossible = scoredToTs * 20;

    // Fishbowl: from log (main fishbowl entries, not star bonus)
    const fbEntries = log.filter(e => e.studentId === sid && (e.source || "").startsWith("Fishbowl Wk"));
    const fbEarned = fbEntries.reduce((s, e) => s + e.amount, 0);
    const confirmedFishbowls = Object.keys(data.weeklyFishbowl || {}).filter(w => (data.weeklyFishbowl[w] || {}).confirmed).length;
    const fbPossible = confirmedFishbowls * 20;

    // Around the Horn / PTI: from log (bonus, not in denominator)
    const athEntries = log.filter(e => e.studentId === sid && ((e.source || "") === "Around the Horn" || (e.source || "") === "PTI"));
    const athEarned = athEntries.reduce((s, e) => s + e.amount, 0);

    const totalEarned = gameGradeEarned + fbEarned + athEarned;
    const totalPossible = gameGradePossible + fbPossible;
    const participationPct = totalPossible > 0 ? (totalEarned / totalPossible) : 0;
    const participationGrade = participationPct * 25;

    return {
      gameGradeEarned: Math.round(gameGradeEarned * 10) / 10,
      gameGradePossible,
      totEarned: Math.round(totEarned * 10) / 10,
      totPossible,
      fbEarned: Math.round(fbEarned * 10) / 10,
      fbPossible,
      athEarned: Math.round(athEarned * 10) / 10,
      totalEarned: Math.round(totalEarned * 10) / 10,
      totalPossible,
      participationPct,
      participationGrade: Math.round(participationGrade * 10) / 10,
    };
  };

  // ─── HELPERS FOR NEW GRADEBOOK ───

  // Returns array of week numbers (sorted) where any activity of given type was scored
  const getScoredWeeks = (type) => {
    const store = type === "game" ? data.weeklyGames : type === "tot" ? data.weeklyToT : data.weeklyFishbowl;
    const weeks = Object.keys(store || {})
      .filter(w => type === "fishbowl" ? store[w]?.confirmed : store[w]?.scored)
      .map(w => parseInt(w))
      .filter(w => !isNaN(w))
      .sort((a, b) => a - b);
    return weeks;
  };

  // Per-week game breakdown for one student
  const getWeeklyGameBreakdown = (sid) => {
    const weeklyGames = data.weeklyGames || {};
    const reboundGrades = data.reboundGrades || {};
    const weeks = getScoredWeeks("game");
    return weeks.map(w => {
      const game = weeklyGames[w];
      let original = 0;
      let correctCount = 0;
      let answered = false;
      (game.questions || []).forEach((q, qi) => {
        const ans = game.responses?.[sid + "-" + qi];
        if (ans !== undefined) answered = true;
        if (ans === q.correct) {
          const cat = q.category || "on_topic";
          original += cat === "on_topic" ? 15 : 2.5;
          correctCount++;
        }
      });
      const rg = reboundGrades[sid + "-game-" + w];
      let cap = null, applied = null;
      if (rg && typeof rg.gradePoints === "number") {
        if (rg.type === "makeup") {
          cap = 100;
          applied = Math.max(original, rg.gradePoints);
        } else {
          if (rg.type === "absence_override") cap = 60;
          else if (original < 50) cap = 60;
          else if (original <= 65) cap = 70;
          else if (original <= 79) cap = 80;
          else cap = 100;
          applied = Math.max(original, Math.min(rg.gradePoints, cap));
        }
      }
      return {
        week: w,
        original: Math.round(original * 10) / 10,
        applied: applied !== null ? Math.round(applied * 10) / 10 : null,
        cap,
        rebound: rg || null,
        correctCount,
        totalQs: (game.questions || []).length,
        answered,
      };
    });
  };

  // Per-week ToT breakdown
  const getWeeklyToTBreakdown = (sid) => {
    const tots = data.weeklyToT || {};
    const weeks = getScoredWeeks("tot");
    return weeks.map(w => {
      const tot = tots[w];
      const ptsEach = tot.questions?.length > 0 ? 20 / tot.questions.length : 20;
      let pts = 0, answered = false;
      (tot.questions || []).forEach((q, qi) => {
        const ans = tot.responses?.[sid + "-" + qi];
        if (ans !== undefined) answered = true;
        if (ans === q.correct) pts += ptsEach;
      });
      return { week: w, score: Math.round(pts * 10) / 10, max: 20, answered };
    });
  };

  // Per-week Fishbowl breakdown
  const getWeeklyFishbowlBreakdown = (sid) => {
    const fbs = data.weeklyFishbowl || {};
    const weeks = getScoredWeeks("fishbowl");
    return weeks.map(w => {
      const fb = fbs[w];
      const score = fb.scores?.[sid] ?? 0;
      return { week: w, score, max: 20 };
    });
  };

  // Counters for one student: planned absences, unannounced absences, rebounds completed
  const getCounters = (sid) => {
    const rebounds = data.rebounds || {};
    const reboundGrades = data.reboundGrades || {};
    let planned = 0, unannounced = 0;
    Object.values(rebounds).forEach(rd => {
      const ss = (rd.studentStatuses || {})[sid];
      if (!ss) return;
      if (ss.status === "planned_makeup") planned++;
      else if (ss.status === "unannounced") unannounced++;
    });
    const reboundCount = Object.keys(reboundGrades).filter(k => k.startsWith(sid + "-game-")).length;
    return { planned, unannounced, rebounds: reboundCount };
  };

  // ATH/PTI total for one student
  const getATHTotal = (sid) => {
    return (data.log || [])
      .filter(e => e.studentId === sid && (e.source === "Around the Horn" || e.source === "PTI"))
      .reduce((s, e) => s + e.amount, 0);
  };

  // Top 5 student IDs by leaderboard (game points), excluding admin and test student
  const getAZone = () => {
    const ranked = data.students
      .filter(s => s.name !== ADMIN_NAME && s.name !== "Bruce Willis")
      .map(s => ({ id: s.id, points: (data.log || []).filter(e => e.studentId === s.id).reduce((t, e) => t + e.amount, 0) }))
      .sort((a, b) => b.points - a.points);
    return new Set(ranked.slice(0, 5).map(s => s.id));
  };

  // Game leaderboard rank for one student (1-indexed)
  const getRank = (sid) => {
    const ranked = data.students
      .filter(s => s.name !== ADMIN_NAME && s.name !== "Bruce Willis")
      .map(s => ({ id: s.id, points: (data.log || []).filter(e => e.studentId === s.id).reduce((t, e) => t + e.amount, 0) }))
      .sort((a, b) => b.points - a.points);
    const idx = ranked.findIndex(s => s.id === sid);
    return idx === -1 ? null : idx + 1;
  };

  // Color logic for weekly cells
  const cellColor = (pct, hasRebound) => {
    if (hasRebound) return { bg: "#dbeafe", color: "#1e40af" }; // blue
    if (pct === null || pct === 0) return { bg: "#f3f4f6", color: "#9ca3af" }; // gray
    if (pct >= 80) return { bg: "#dcfce7", color: "#166534" }; // green
    return { bg: "#fef3c7", color: "#92400e" }; // yellow
  };


  const renderStudentGrades = (sid) => {
    const p = computeAutoParticipation(sid);
    const gameWeeks = getWeeklyGameBreakdown(sid);
    const totWeeks = getWeeklyToTBreakdown(sid);
    const fbWeeks = getWeeklyFishbowlBreakdown(sid);

    return (
      <div>
        <div style={{ ...sectionLabel, marginBottom: 8 }}>Assignment Grades</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
          {assignments.filter(a => a.id !== "participation").map(a => {
            const g = grades[sid + "-" + a.id] || {};
            const sub = (data.submissions || {})[sid + "-" + a.id];
            const dueDate = parseDueDate(a.due);
            const isLate = sub && dueDate && sub.ts > dueDate.getTime();
            const isPastDue = dueDate && Date.now() > dueDate.getTime();
            const hasGrade = g.score !== undefined && g.score !== "";
            return (
              <div key={a.id} style={{ ...crd, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{a.name}</div>
                    {hasGrade && parseFloat(g.score) === 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: "#fef2f2", color: RED }}>Zero</span>}
                    {!hasGrade && sub && isLate && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: "#fffbeb", color: AMBER }}>Late</span>}
                    {!hasGrade && !sub && isPastDue && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: "#fef2f2", color: RED }}>Missing</span>}
                    {!hasGrade && sub && !isLate && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: "#eff6ff", color: "#2563eb" }}>Submitted</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>{a.weight}% {a.due ? "/ Due " + a.due : ""}</div>
                </div>
                {/* Submission info */}
                {sub && (
                  <div style={{ marginBottom: 8, padding: "6px 10px", background: "#f9fafb", borderRadius: 8 }}>
                    {sub.docUrl && <a href={sub.docUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: ACCENT, textDecoration: "none", fontWeight: 500, display: "block", marginBottom: 2 }}>View Submission</a>}
                    {sub.notes && <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2, lineHeight: 1.4 }}>"{sub.notes}"</div>}
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                      Submitted {new Date(sub.ts).toLocaleString()}
                      {isLate && <span style={{ color: AMBER, fontWeight: 600, marginLeft: 6 }}>LATE</span>}
                    </div>
                  </div>
                )}
                {!sub && <div style={{ fontSize: 12, color: "#d1d5db", fontStyle: "italic", marginBottom: 6 }}>No submission</div>}
                {isAdmin ? (
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                      <input type="number" value={g.score ?? ""} onChange={e => updateGrade(sid, a.id, "score", e.target.value)} placeholder="Score" style={{ ...inp, width: 80, padding: "6px 10px", fontSize: 13 }} />
                      <span style={{ fontSize: 13, color: "#9ca3af" }}>/</span>
                      <input type="number" value={g.outOf ?? 100} onChange={e => updateGrade(sid, a.id, "outOf", e.target.value)} placeholder="100" style={{ ...inp, width: 60, padding: "6px 10px", fontSize: 13 }} />
                      <input value={g.comment || ""} onChange={e => updateGrade(sid, a.id, "comment", e.target.value)} placeholder="Comment..." style={{ ...inp, flex: 1, padding: "6px 10px", fontSize: 13 }} />
                    </div>
                    {/* Regrade request from student */}
                    {(() => {
                      const rr = (data.regradeRequests || {})[sid + "-" + a.id];
                      if (!rr) return null;
                      const dismissRegrade = async () => {
                        const regradeRequests = { ...(data.regradeRequests || {}) };
                        delete regradeRequests[sid + "-" + a.id];
                        const updated = { ...data, regradeRequests };
                        await saveData(updated); setData(updated);
                      };
                      return (
                        <div style={{ marginTop: 6, padding: "8px 10px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: AMBER, textTransform: "uppercase", marginBottom: 4 }}>Regrade Request</div>
                          <div style={{ fontSize: 13, color: "#92400e", lineHeight: 1.4 }}>{rr.note}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{new Date(rr.ts).toLocaleString()}</div>
                          <button onClick={dismissRegrade} style={{ ...pill, background: "#fff", color: TEXT_SECONDARY, border: "1px solid #e5e7eb", fontSize: 11, marginTop: 6 }}>Dismiss Request</button>
                        </div>
                      );
                    })()}
                    {/* Quick Grade button */}
                    {!!(data.assignmentRubrics || {})[a.id] && (
                      <button onClick={() => setQuickGradeId(quickGradeId === sid + "-" + a.id ? null : sid + "-" + a.id)} style={{ ...pill, fontSize: 11, marginTop: 6, background: quickGradeId === sid + "-" + a.id ? ACCENT : "#eff6ff", color: quickGradeId === sid + "-" + a.id ? "#fff" : ACCENT, width: "100%" }}>
                        {quickGradeId === sid + "-" + a.id ? "Close Quick Grade" : "Quick Grade"}
                      </button>
                    )}
                    {quickGradeId === sid + "-" + a.id && (
                      <div style={{ marginTop: 8 }}>
                        <QuickGrade assignmentId={a.id} studentId={sid} studentName={student?.name || ""} data={data} setData={setData} onClose={() => setQuickGradeId(null)} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {g.score !== undefined && g.score !== "" ? (
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, color: "#111827" }}>{g.score}</span>
                        <span style={{ fontSize: 13, color: "#9ca3af" }}>/ {g.outOf || 100}</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: "#d1d5db", fontStyle: "italic" }}>Not graded yet</div>
                    )}
                    {g.comment && <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4, padding: "8px 10px", background: "#f8fafc", borderRadius: 8, lineHeight: 1.4 }}>{g.comment}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ ...sectionLabel, marginBottom: 8 }}>Weekly Game Breakdown</div>
        <div style={{ ...crd, padding: 14, marginBottom: 12 }}>
          {gameWeeks.length === 0 ? (
            <div style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>No games scored yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {gameWeeks.map(g => {
                const final = g.applied !== null ? g.applied : g.original;
                const hasMakeup = g.rebound?.type === "makeup";
                const status = (!g.answered && !hasMakeup) ? "absent" : g.applied !== null ? "rebound" : final >= 80 ? "ok" : "low";
                return (
                  <div key={g.week} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, background: status === "rebound" ? "#dbeafe" : status === "ok" ? "#f0fdf4" : status === "absent" ? "#fef2f2" : "#fffbeb" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Week {g.week}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                      {!g.answered && !hasMakeup ? (
                        <span style={{ color: "#dc2626", fontStyle: "italic" }}>Absent</span>
                      ) : !hasMakeup ? (
                        <span style={{ color: "#6b7280" }}>{g.correctCount}/{g.totalQs} correct</span>
                      ) : null}
                      {g.applied !== null ? (
                        <span style={{ fontWeight: 700 }}>
                          {!hasMakeup && <span style={{ color: "#9ca3af", textDecoration: "line-through", fontWeight: 500, marginRight: 6 }}>{g.original}</span>}
                          <span style={{ color: "#1e40af" }}>{g.applied}/100</span>
                          <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 6, fontWeight: 500 }}>({g.rebound.type === "makeup" ? "Makeup" : g.rebound.type === "absence_override" ? "Override" : "Rebound"})</span>
                        </span>
                      ) : (
                        <span style={{ fontWeight: 700, color: status === "ok" ? "#166534" : status === "absent" ? "#9ca3af" : "#92400e" }}>{g.original}/100</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ ...sectionLabel, marginBottom: 8 }}>This or That Breakdown</div>
        <div style={{ ...crd, padding: 14, marginBottom: 12 }}>
          {totWeeks.length === 0 ? (
            <div style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>None yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {totWeeks.map(t => (
                <div key={t.week} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: 8, background: !t.answered ? "#fef2f2" : t.score >= 16 ? "#f0fdf4" : "#fffbeb" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Week {t.week}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: !t.answered ? "#dc2626" : t.score >= 16 ? "#166534" : "#92400e" }}>
                    {!t.answered ? "Absent" : t.score + "/" + t.max}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ ...sectionLabel, marginBottom: 8 }}>Fishbowl Breakdown</div>
        <div style={{ ...crd, padding: 14, marginBottom: 12 }}>
          {fbWeeks.length === 0 ? (
            <div style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>None yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {fbWeeks.map(f => (
                <div key={f.week} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: 8, background: f.score === 0 ? "#f3f4f6" : f.score >= 16 ? "#f0fdf4" : "#fffbeb" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Week {f.week}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: f.score === 0 ? "#9ca3af" : f.score >= 16 ? "#166534" : "#92400e" }}>{f.score}/{f.max}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ ...sectionLabel, marginBottom: 8 }}>Participation (25%) - auto-calculated</div>
        <div style={{ ...crd, padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Weekly Game (Grade pts)</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>Recomputed from responses / On Topic 15pts, Sports World 2.5pts</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#111827", fontVariantNumeric: "tabular-nums" }}>{p.gameGradeEarned}<span style={{ fontSize: 12, color: "#9ca3af" }}> / {p.gameGradePossible}</span></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>This or That</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>20 pts each</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#111827", fontVariantNumeric: "tabular-nums" }}>{p.totEarned}<span style={{ fontSize: 12, color: "#9ca3af" }}> / {p.totPossible}</span></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Fishbowl</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>20 pts each</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#111827", fontVariantNumeric: "tabular-nums" }}>{p.fbEarned}<span style={{ fontSize: 12, color: "#9ca3af" }}> / {p.fbPossible}</span></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Around the Horn</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>Bonus, not in denominator</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#059669", fontVariantNumeric: "tabular-nums" }}>+{p.athEarned}</div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: ACCENT + "10", borderRadius: 8, marginTop: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: ACCENT }}>Total</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: ACCENT, fontVariantNumeric: "tabular-nums" }}>{p.totalEarned} / {p.totalPossible} <span style={{ fontSize: 13, fontWeight: 700 }}>({Math.round(p.participationPct * 1000) / 10}%)</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isGuest) {
    return <div style={{ padding: 40, textAlign: "center", fontFamily: F }}><div style={{ ...sectionLabel, marginBottom: 8 }}>Grades</div><div style={{ fontSize: 14, color: TEXT_SECONDARY }}>Sign in as a student to view grades.</div></div>;
  }

  if (isAdmin) {
    const sorted = [...data.students].filter(s => s.name !== ADMIN_NAME && s.name !== "Bruce Willis").sort(lastSortObj);
    const gradeAssignments = assignments.filter(a => a.id !== "participation");
    const submissions = data.submissions || {};
    const regradeRequests = data.regradeRequests || {};

    // Dashboard counts
    let zeroCount = 0, missingCount = 0, regradeCount = 0, lateUngradedCount = 0, resubCount = 0;
    const zeroCells = new Set();
    const missingCells = new Set();
    const regradeCells = new Set();
    const lateCells = new Set();
    const resubCells = new Set();

    sorted.forEach(s => {
      gradeAssignments.forEach(a => {
        const key = s.id + "-" + a.id;
        const g = grades[key] || {};
        const sub = submissions[key];
        const dueDate = parseDueDate(a.due);
        const isPastDue = dueDate && Date.now() > dueDate.getTime();
        const hasGrade = g.score !== undefined && g.score !== "";
        const isZero = hasGrade && parseFloat(g.score) === 0;
        const isLate = sub && dueDate && sub.ts > dueDate.getTime();
        const hasRegrade = !!regradeRequests[key];
        const isResub = hasGrade && sub && g.gradedTs && sub.ts > g.gradedTs;

        if (isZero) { zeroCount++; zeroCells.add(key); }
        if (isPastDue && !sub && !hasGrade) { missingCount++; missingCells.add(key); }
        if (hasRegrade) { regradeCount++; regradeCells.add(key); }
        if (isLate && !hasGrade) { lateUngradedCount++; lateCells.add(key); }
        if (isResub) { resubCount++; resubCells.add(key); }
      });
    });

    // Build column order. data.assignmentOrder is an array of column ids covering named assignments + meta columns.
    const META_COLS = [
      { id: "__inclass", label: "In-Class", sublabel: "25%" },
      { id: "__ath", label: "ATH", sublabel: "Bonus" },
      { id: "__absences", label: "Absences", sublabel: "P / U" },
      { id: "__rebounds", label: "Rebounds", sublabel: "Count" },
    ];
    const allOrderableIds = [...gradeAssignments.map(a => a.id), ...META_COLS.map(m => m.id)];
    const savedOrder = (data.assignmentOrder || []).filter(id => allOrderableIds.includes(id));
    const missingIds = allOrderableIds.filter(id => !savedOrder.includes(id));
    const colOrder = [...savedOrder, ...missingIds];

    const moveCol = async (id, direction) => {
      const idx = colOrder.indexOf(id);
      if (idx === -1) return;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= colOrder.length) return;
      const next = [...colOrder];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      const updated = { ...data, assignmentOrder: next };
      await saveData(updated); setData(updated);
    };

    const colLabel = (id) => {
      const meta = META_COLS.find(m => m.id === id);
      if (meta) return meta;
      const a = gradeAssignments.find(x => x.id === id);
      return a ? { id, label: a.name, sublabel: a.weight + "%" } : null;
    };

    const aZone = getAZone();
    const gameWeeksAll = getScoredWeeks("game");
    const totWeeksAll = getScoredWeeks("tot");
    const fbWeeksAll = getScoredWeeks("fishbowl");

    return (
      <div style={{ padding: "20px 16px 40px", fontFamily: F }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ ...sectionLabel }}>Gradebook</div>
            <div style={{ display: "flex", gap: 6 }}>
              {setView && <button onClick={() => setView("grading")} style={{ ...pill, fontSize: 11, padding: "4px 10px", background: "#eff6ff", color: ACCENT }}>Grading ({(() => {
                let count = 0;
                const ga = assignments.filter(a => a.id !== "participation");
                (data.students || []).filter(s => s.name !== ADMIN_NAME && s.name !== "Bruce Willis").forEach(s => {
                  ga.forEach(a => {
                    const k = s.id + "-" + a.id;
                    const g = grades[k] || {};
                    const sub = submissions[k];
                    const dd = parseDueDate(a.due);
                    const hg = g.score !== undefined && g.score !== "";
                    if (regradeRequests[k]) count++;
                    else if (hg && sub && g.gradedTs && sub.ts > g.gradedTs) count++;
                    else if (hg && parseFloat(g.score) === 0) count++;
                    else if (sub && !hg) count++;
                    else if (dd && Date.now() > dd.getTime() && !sub && !hg) count++;
                  });
                });
                return count;
              })()})</button>}
              <button onClick={() => setActivityFilter("all")} style={{ ...pill, background: activityFilter === "all" ? ACCENT : "#f3f4f6", color: activityFilter === "all" ? "#fff" : "#4b5563", fontSize: 11, padding: "4px 10px" }}>All</button>
              <button onClick={() => setActivityFilter("game")} style={{ ...pill, background: activityFilter === "game" ? ACCENT : "#f3f4f6", color: activityFilter === "game" ? "#fff" : "#4b5563", fontSize: 11, padding: "4px 10px" }}>Game</button>
              <button onClick={() => setActivityFilter("tot")} style={{ ...pill, background: activityFilter === "tot" ? ACCENT : "#f3f4f6", color: activityFilter === "tot" ? "#fff" : "#4b5563", fontSize: 11, padding: "4px 10px" }}>ToT</button>
              <button onClick={() => setActivityFilter("fb")} style={{ ...pill, background: activityFilter === "fb" ? ACCENT : "#f3f4f6", color: activityFilter === "fb" ? "#fff" : "#4b5563", fontSize: 11, padding: "4px 10px" }}>FB</button>
              <button onClick={() => setReorderOpen(!reorderOpen)} style={{ ...pillInactive, fontSize: 11, padding: "4px 10px" }}>{reorderOpen ? "Done" : "Reorder columns"}</button>
            </div>
          </div>

          {/* Dashboard summary */}
          {(zeroCount > 0 || missingCount > 0 || regradeCount > 0 || lateUngradedCount > 0 || resubCount > 0) && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {resubCount > 0 && (
                <button onClick={() => setHighlight(h => h === "resub" ? null : "resub")} style={{ ...pill, padding: "8px 16px", background: highlight === "resub" ? "#2563eb" : "#eff6ff", color: highlight === "resub" ? "#fff" : "#2563eb", border: "1px solid #93c5fd" }}>
                  {resubCount} Resubmitted
                </button>
              )}
              {regradeCount > 0 && (
                <button onClick={() => setHighlight(h => h === "regrade" ? null : "regrade")} style={{ ...pill, padding: "8px 16px", background: highlight === "regrade" ? AMBER : "#fffbeb", color: highlight === "regrade" ? "#fff" : "#92400e", border: "1px solid #fde68a" }}>
                  {regradeCount} Regrade Request{regradeCount !== 1 ? "s" : ""}
                </button>
              )}
              {zeroCount > 0 && (
                <button onClick={() => setHighlight(h => h === "zero" ? null : "zero")} style={{ ...pill, padding: "8px 16px", background: highlight === "zero" ? RED : "#fef2f2", color: highlight === "zero" ? "#fff" : RED, border: "1px solid #fecaca" }}>
                  {zeroCount} Zero{zeroCount !== 1 ? "s" : ""}
                </button>
              )}
              {missingCount > 0 && (
                <button onClick={() => setHighlight(h => h === "missing" ? null : "missing")} style={{ ...pill, padding: "8px 16px", background: highlight === "missing" ? "#7c3aed" : "#f5f3ff", color: highlight === "missing" ? "#fff" : "#7c3aed", border: "1px solid #c4b5fd" }}>
                  {missingCount} Missing
                </button>
              )}
              {lateUngradedCount > 0 && (
                <button onClick={() => setHighlight(h => h === "late" ? null : "late")} style={{ ...pill, padding: "8px 16px", background: highlight === "late" ? AMBER : "#fffbeb", color: highlight === "late" ? "#fff" : AMBER, border: "1px solid #fde68a" }}>
                  {lateUngradedCount} Late (ungraded)
                </button>
              )}
              {highlight && (
                <button onClick={() => setHighlight(null)} style={{ ...pillInactive, padding: "8px 12px", fontSize: 11 }}>Clear</button>
              )}
            </div>
          )}

          {reorderOpen && (
            <div style={{ ...crd, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>Use up/down to reorder. Per-week columns are fixed at the right.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {colOrder.map((id, i) => {
                  const c = colLabel(id);
                  if (!c) return null;
                  return (
                    <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#f9fafb", borderRadius: 6 }}>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#111827" }}>{c.label} <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>({c.sublabel})</span></span>
                      <button onClick={() => moveCol(id, "up")} disabled={i === 0} style={{ ...pillInactive, fontSize: 11, padding: "2px 8px", opacity: i === 0 ? 0.3 : 1 }}>up</button>
                      <button onClick={() => moveCol(id, "down")} disabled={i === colOrder.length - 1} style={{ ...pillInactive, fontSize: 11, padding: "2px 8px", opacity: i === colOrder.length - 1 ? 0.3 : 1 }}>down</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ ...crd, overflow: "auto", marginBottom: 20 }}>
            <table style={{ fontSize: 12, borderCollapse: "collapse", fontFamily: F }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: "#9ca3af", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", position: "sticky", left: 0, background: "#fff", zIndex: 2, minWidth: 200 }}>Student</th>
                  {colOrder.map(id => {
                    const c = colLabel(id);
                    if (!c) return null;
                    const short = c.label.split(" ").slice(0, 2).join(" ");
                    return (
                      <th key={id} style={{ textAlign: "center", padding: "10px 8px", color: "#9ca3af", fontWeight: 600, fontSize: 10, textTransform: "uppercase", minWidth: 70 }}>
                        <div>{short}</div>
                        <div style={{ fontSize: 9, color: "#d1d5db", fontWeight: 500 }}>{c.sublabel}</div>
                      </th>
                    );
                  })}
                  {(activityFilter === "all" || activityFilter === "game") && gameWeeksAll.map(w => (
                    <th key={"gh-" + w} style={{ textAlign: "center", padding: "10px 6px", color: "#1e40af", fontWeight: 700, fontSize: 10, textTransform: "uppercase", minWidth: 50, background: "#eff6ff" }}>
                      <div>W{w}</div>
                      <div style={{ fontSize: 9, color: "#60a5fa", fontWeight: 500 }}>Game</div>
                    </th>
                  ))}
                  {(activityFilter === "all" || activityFilter === "tot") && totWeeksAll.map(w => (
                    <th key={"th-" + w} style={{ textAlign: "center", padding: "10px 6px", color: "#7c3aed", fontWeight: 700, fontSize: 10, textTransform: "uppercase", minWidth: 50, background: "#f5f3ff" }}>
                      <div>W{w}</div>
                      <div style={{ fontSize: 9, color: "#a78bfa", fontWeight: 500 }}>ToT</div>
                    </th>
                  ))}
                  {(activityFilter === "all" || activityFilter === "fb") && fbWeeksAll.map(w => (
                    <th key={"fh-" + w} style={{ textAlign: "center", padding: "10px 6px", color: "#059669", fontWeight: 700, fontSize: 10, textTransform: "uppercase", minWidth: 50, background: "#ecfdf5" }}>
                      <div>W{w}</div>
                      <div style={{ fontSize: 9, color: "#34d399", fontWeight: 500 }}>FB</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(s => {
                  const pCalc = computeAutoParticipation(s.id);
                  const counters = getCounters(s.id);
                  const ath = getATHTotal(s.id);
                  const inAZone = aZone.has(s.id);
                  const rank = getRank(s.id);
                  const photo = (data.bios || {})[s.id]?.photo;
                  const gameBd = (activityFilter === "all" || activityFilter === "game") ? getWeeklyGameBreakdown(s.id) : [];
                  const totBd = (activityFilter === "all" || activityFilter === "tot") ? getWeeklyToTBreakdown(s.id) : [];
                  const fbBd = (activityFilter === "all" || activityFilter === "fb") ? getWeeklyFishbowlBreakdown(s.id) : [];
                  return (
                    <tr key={s.id} style={{ borderBottom: "1px solid #f9fafb" }}>
                      <td style={{ padding: "8px 12px", whiteSpace: "nowrap", position: "sticky", left: 0, background: "#fff", zIndex: 1, cursor: "pointer" }} onClick={() => setSelStudent(selStudent === s.id ? null : s.id)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {photo ? (
                            <img src={photo} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#9ca3af", flexShrink: 0 }}>{s.name[0]}</div>
                          )}
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", borderBottom: selStudent === s.id ? "2px solid " + ACCENT : "none", paddingBottom: 1, lineHeight: 1.2 }}>{s.name}</div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: inAZone ? "#16a34a" : "#9ca3af", marginTop: 2 }}>
                              {inAZone ? "A ZONE" : rank ? "#" + rank : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      {colOrder.map(id => {
                        // Meta cells
                        if (id === "__inclass") {
                          return (
                            <td key={id} style={{ textAlign: "center", padding: "4px 6px" }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT, fontVariantNumeric: "tabular-nums" }}>{pCalc.totalEarned}/{pCalc.totalPossible}</span>
                              <div style={{ fontSize: 10, color: "#9ca3af" }}>({Math.round(pCalc.participationPct * 1000) / 10}%)</div>
                            </td>
                          );
                        }
                        if (id === "__ath") {
                          return (
                            <td key={id} style={{ textAlign: "center", padding: "4px 6px" }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: ath > 0 ? "#059669" : "#d1d5db", fontVariantNumeric: "tabular-nums" }}>{ath > 0 ? "+" + ath : "0"}</span>
                            </td>
                          );
                        }
                        if (id === "__absences") {
                          return (
                            <td key={id} style={{ textAlign: "center", padding: "4px 6px" }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#111827", fontVariantNumeric: "tabular-nums" }}>
                                <span style={{ color: "#10b981" }}>{counters.planned}P</span>
                                <span style={{ color: "#9ca3af", margin: "0 3px" }}>/</span>
                                <span style={{ color: "#dc2626" }}>{counters.unannounced}U</span>
                              </span>
                            </td>
                          );
                        }
                        if (id === "__rebounds") {
                          return (
                            <td key={id} style={{ textAlign: "center", padding: "4px 6px" }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: counters.rebounds > 0 ? "#1e40af" : "#d1d5db", fontVariantNumeric: "tabular-nums" }}>{counters.rebounds}</span>
                            </td>
                          );
                        }
                        // Named assignment cell (editable)
                        const cellKey = s.id + "-" + id;
                        const g = grades[cellKey] || {};
                        const isEditing = editingCell === cellKey;
                        const score = g.score;
                        const outOf = g.outOf || 100;
                        const hasRegrade = !!regradeRequests[cellKey];
                        const isHighlighted = (highlight === "zero" && zeroCells.has(cellKey))
                          || (highlight === "missing" && missingCells.has(cellKey))
                          || (highlight === "regrade" && regradeCells.has(cellKey))
                          || (highlight === "late" && lateCells.has(cellKey))
                          || (highlight === "resub" && resubCells.has(cellKey));
                        const isDimmed = highlight && !isHighlighted;
                        const sub = submissions[cellKey];
                        const hasSubmission = !!sub;
                        const hasGrade = score !== undefined && score !== "";
                        const isResub = hasGrade && hasSubmission && g.gradedTs && sub.ts > g.gradedTs;
                        const cellBg = isHighlighted
                          ? (highlight === "zero" ? "#fecaca" : highlight === "missing" ? "#ddd6fe" : highlight === "resub" ? "#bfdbfe" : "#fde68a")
                          : zeroCells.has(cellKey) ? "#fef2f2"
                          : missingCells.has(cellKey) ? "#f5f3ff"
                          : resubCells.has(cellKey) ? "#eff6ff"
                          : "transparent";
                        return (
                          <td key={id} style={{ textAlign: "center", padding: "4px 6px", background: cellBg, opacity: isDimmed ? 0.3 : 1, transition: "opacity 0.15s" }}>
                            {isEditing ? (
                              <input autoFocus type="number" value={score ?? ""} onChange={e => updateGrade(s.id, id, "score", e.target.value)} onBlur={() => setEditingCell(null)} onKeyDown={e => e.key === "Enter" && setEditingCell(null)} style={{ ...inp, width: 48, padding: "4px 4px", fontSize: 12, textAlign: "center" }} />
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); setEditingCell(cellKey); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 13, fontWeight: 700, padding: "4px 8px", borderRadius: 6, color: score !== undefined && score !== "" ? (parseFloat(score) === 0 ? RED : "#111827") : "#d1d5db", minWidth: 40, position: "relative" }}>
                                {hasGrade ? score + "/" + outOf : missingCells.has(cellKey) ? "miss" : hasSubmission ? "\uD83D\uDCC4" : "-"}
                                {isResub && <sup style={{ fontSize: 9, marginLeft: 2, color: "#2563eb" }}>RS</sup>}
                                {hasRegrade && <sup style={{ fontSize: 9, marginLeft: 2, color: AMBER }}>RG</sup>}
                              </button>
                            )}
                          </td>
                        );
                      })}
                      {/* Per-week game cells */}
                      {(activityFilter === "all" || activityFilter === "game") && gameBd.map(b => {
                        const final = b.applied !== null ? b.applied : b.original;
                        const hasMakeup = b.rebound?.type === "makeup";
                        const pct = (b.answered || hasMakeup) ? final : null;
                        const c = cellColor(pct, b.applied !== null);
                        return (
                          <td key={"g-" + b.week} style={{ textAlign: "center", padding: "2px 4px" }}>
                            <button onClick={(e) => { e.stopPropagation(); setReboundModal({ type: "game", week: b.week }); }} style={{ background: c.bg, color: c.color, border: "none", borderRadius: 6, padding: "6px 4px", fontSize: 12, fontWeight: 700, fontFamily: F, cursor: "pointer", fontVariantNumeric: "tabular-nums", minWidth: 42 }}>
                              {!b.answered && !hasMakeup ? "abs" : final}
                              {b.applied !== null && <sup style={{ fontSize: 9, marginLeft: 2 }}>{hasMakeup ? "M" : "R"}</sup>}
                            </button>
                          </td>
                        );
                      })}
                      {/* Per-week ToT cells */}
                      {(activityFilter === "all" || activityFilter === "tot") && totBd.map(b => {
                        const pct = b.answered ? Math.round(b.score / b.max * 100) : null;
                        const c = cellColor(pct, false);
                        return (
                          <td key={"t-" + b.week} style={{ textAlign: "center", padding: "2px 4px" }}>
                            <button onClick={(e) => { e.stopPropagation(); setReboundModal({ type: "tot", week: b.week }); }} style={{ background: c.bg, color: c.color, border: "none", borderRadius: 6, padding: "6px 4px", fontSize: 12, fontWeight: 700, fontFamily: F, cursor: "pointer", fontVariantNumeric: "tabular-nums", minWidth: 42 }}>
                              {!b.answered ? "abs" : b.score}
                            </button>
                          </td>
                        );
                      })}
                      {/* Per-week FB cells */}
                      {(activityFilter === "all" || activityFilter === "fb") && fbBd.map(b => {
                        const pct = b.score === 0 ? null : Math.round(b.score / b.max * 100);
                        const c = cellColor(pct, false);
                        return (
                          <td key={"f-" + b.week} style={{ textAlign: "center", padding: "2px 4px" }}>
                            <button onClick={(e) => { e.stopPropagation(); setReboundModal({ type: "fishbowl", week: b.week }); }} style={{ background: c.bg, color: c.color, border: "none", borderRadius: 6, padding: "6px 4px", fontSize: 12, fontWeight: 700, fontFamily: F, cursor: "pointer", fontVariantNumeric: "tabular-nums", minWidth: 42 }}>
                              {b.score}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selStudent && (
            <div style={{ ...crd, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>{data.students.find(s => s.id === selStudent)?.name}</div>
                <button onClick={() => setSelStudent(null)} style={pillInactive}>Close</button>
              </div>
              {renderStudentGrades(selStudent)}
            </div>
          )}

          {/* Game vs Grade Comparison */}
          <GameVsGradeComparison data={data} computeAutoParticipation={computeAutoParticipation} assignments={assignments} grades={grades} />

          {reboundModal && (
            <div onClick={() => setReboundModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto" }}>
              <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 700, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>
                    {reboundModal.type === "game" ? "Weekly Game" : reboundModal.type === "tot" ? "This or That" : "Fishbowl"} - Week {reboundModal.week}
                  </div>
                  <button onClick={() => setReboundModal(null)} style={pillInactive}>Close</button>
                </div>
                <ReboundPanel data={data} setData={setData} activityType={reboundModal.type} week={reboundModal.week} isAdmin={true} userName="Andrew Ishak" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!studentId) return <div style={{ padding: 40, textAlign: "center", fontFamily: F, color: TEXT_SECONDARY }}>Student not found.</div>;

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: themedHeadingFont(theme, F) }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 12 }}>My Grades</div>
        {renderStudentGrades(studentId)}
      </div>
    </div>
  );
}

/* ─── GRADING INBOX ─── */
export function GradingInbox({ data, setData, userName }) {
  const { theme } = useTheme("comm4-v1");
  const crd = themedInteriorCrd(theme, 0);
  const assignments = data.assignments || DEFAULT_ASSIGNMENTS;
  const grades = data.grades || {};
  const submissions = data.submissions || {};
  const regradeRequests = data.regradeRequests || {};
  const students = (data.students || []).filter(s => s.name !== ADMIN_NAME && s.name !== "Bruce Willis");
  const bios = data.bios || {};

  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedItem, setSelectedItem] = useState(null);
  const [gradeForm, setGradeForm] = useState({});
  const [completedItems, setCompletedItems] = useState(new Set());
  const [quickGradeOpen, setQuickGradeOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  // Build inbox items
  const items = [];
  const gradeAssignments = assignments.filter(a => a.id !== "participation");

  students.forEach(s => {
    gradeAssignments.forEach(a => {
      const key = s.id + "-" + a.id;
      const g = grades[key] || {};
      const sub = submissions[key];
      const rr = regradeRequests[key];
      const dueDate = parseDueDate(a.due);
      const isPastDue = dueDate && Date.now() > dueDate.getTime();
      const hasGrade = g.score !== undefined && g.score !== "";
      const isZero = hasGrade && parseFloat(g.score) === 0;
      const isLate = sub && dueDate && sub.ts > dueDate.getTime();
      const isResub = hasGrade && sub && g.gradedTs && sub.ts > g.gradedTs;

      if (rr) {
        items.push({ id: key + "-regrade", type: "regrade", student: s, assignment: a, key, sub, grade: g, regradeNote: rr.note, ts: rr.ts, priority: 1 });
      }
      if (isResub) {
        items.push({ id: key + "-resub", type: "resub", student: s, assignment: a, key, sub, grade: g, ts: sub.ts, priority: 2 });
      }
      if (isZero) {
        items.push({ id: key + "-zero", type: "zero", student: s, assignment: a, key, sub, grade: g, ts: g.gradedTs || 0, priority: 3 });
      }
      if (sub && !hasGrade && isLate) {
        items.push({ id: key + "-late", type: "late", student: s, assignment: a, key, sub, grade: g, ts: sub.ts, priority: 4 });
      } else if (sub && !hasGrade && !isLate) {
        items.push({ id: key + "-ungraded", type: "ungraded", student: s, assignment: a, key, sub, grade: g, ts: sub.ts, priority: 5 });
      }
      if (isPastDue && !sub && !hasGrade) {
        items.push({ id: key + "-missing", type: "missing", student: s, assignment: a, key, sub: null, grade: g, ts: dueDate.getTime(), priority: 6 });
      }
    });
  });

  // Filter
  const filtered = filter === "all" ? items : items.filter(i => i.type === filter);

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "newest") return b.ts - a.ts;
    if (sortBy === "oldest") return a.ts - b.ts;
    if (sortBy === "assignment") return a.assignment.name.localeCompare(b.assignment.name) || b.ts - a.ts;
    if (sortBy === "student") return lastName(a.student.name).localeCompare(lastName(b.student.name)) || b.ts - a.ts;
    if (sortBy === "priority") return a.priority - b.priority || b.ts - a.ts;
    return 0;
  });

  const typeConfig = {
    regrade: { label: "Regrade", bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
    resub: { label: "Resubmitted", bg: "#eff6ff", color: "#1e40af", border: "#93c5fd" },
    zero: { label: "Zero", bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
    late: { label: "Late", bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
    ungraded: { label: "Ungraded", bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
    missing: { label: "Missing", bg: "#f5f3ff", color: "#5b21b6", border: "#c4b5fd" },
  };

  const typeCounts = {};
  items.forEach(i => { typeCounts[i.type] = (typeCounts[i.type] || 0) + 1; });

  const selectItem = (item) => {
    setSelectedItem(item);
    setQuickGradeOpen(false);
    const g = grades[item.key] || {};
    setGradeForm({ score: g.score ?? "", outOf: g.outOf || 100, comment: g.comment || "" });
  };

  const saveGrade = async () => {
    if (!selectedItem) return;
    const key = selectedItem.key;
    const existing = grades[key] || {};
    const newGrade = {
      ...existing,
      score: gradeForm.score === "" ? undefined : parseFloat(gradeForm.score),
      outOf: parseFloat(gradeForm.outOf) || 100,
      comment: gradeForm.comment,
      gradedTs: Date.now(),
    };
    const newRegradeRequests = { ...regradeRequests };
    delete newRegradeRequests[key];
    const gradeNotifications = { ...(data.gradeNotifications || {}), [key]: { ts: Date.now() } };
    const updated = { ...data, grades: { ...grades, [key]: newGrade }, regradeRequests: newRegradeRequests, gradeNotifications };
    await saveData(updated); setData(updated);

    // Mark as completed, fade out after 2 minutes
    const itemId = selectedItem.id;
    setCompletedItems(prev => new Set([...prev, itemId]));
    setTimeout(() => { setCompletedItems(prev => { const next = new Set(prev); next.delete(itemId); return next; }); }, 120000);

    setSelectedItem(null);
    showMsg("Grade saved");
  };

  return (
    <div style={{ fontFamily: F, height: "calc(100vh - 60px)", display: "flex", flexDirection: "column" }}>
      {msg && <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#1e293b", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 999 }}>{msg}</div>}

      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#111827" }}>Grading Inbox <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_MUTED }}>({items.length})</span></div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...sel, fontSize: 12, padding: "4px 8px" }}>
            <option value="priority">By Priority</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="assignment">By Assignment</option>
            <option value="student">By Student</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <button onClick={() => setFilter("all")} style={{ ...pill, padding: "5px 12px", fontSize: 11, background: filter === "all" ? "#111827" : "#f3f4f6", color: filter === "all" ? "#fff" : "#4b5563" }}>All ({items.length})</button>
          {["ungraded", "regrade", "resub", "zero", "late", "missing"].map(t => {
            const tc = typeConfig[t];
            const count = typeCounts[t] || 0;
            if (count === 0) return null;
            return <button key={t} onClick={() => setFilter(t)} style={{ ...pill, padding: "5px 12px", fontSize: 11, background: filter === t ? tc.color : tc.bg, color: filter === t ? "#fff" : tc.color, border: "1px solid " + tc.border }}>{tc.label} ({count})</button>;
          })}
        </div>
      </div>

      {/* Split panel */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: item list */}
        <div style={{ width: "40%", minWidth: 300, borderRight: "1px solid #f3f4f6", overflowY: "auto" }}>
          {sorted.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: TEXT_MUTED, fontSize: 14 }}>
              {filter === "all" ? "Nothing to grade. Nice work." : "No " + (typeConfig[filter]?.label || "") + " items."}
            </div>
          )}
          {sorted.filter(item => !completedItems.has(item.id) || item.id === selectedItem?.id).map(item => {
            const tc = typeConfig[item.type];
            const isSelected = selectedItem?.id === item.id;
            const isCompleted = completedItems.has(item.id);
            const bio = bios[item.student.id] || {};
            return (
              <div key={item.id} onClick={() => selectItem(item)} style={{
                padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f9fafb",
                background: isSelected ? ACCENT + "08" : isCompleted ? "#f0fdf4" : "#fff",
                borderLeft: isSelected ? "3px solid " + ACCENT : "3px solid transparent",
                opacity: isCompleted ? 0.6 : 1,
                transition: "opacity 0.3s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {bio.photo ? (
                    <img src={bio.photo} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: TEXT_MUTED, flexShrink: 0 }}>{item.student.name[0]}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{item.student.name}</span>
                      {isCompleted && <span style={{ fontSize: 12, color: GREEN }}>&#10003;</span>}
                    </div>
                    <div style={{ fontSize: 12, color: TEXT_SECONDARY, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.assignment.name}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: tc.bg, color: tc.color, border: "1px solid " + tc.border, flexShrink: 0 }}>{tc.label}</span>
                </div>
                <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>
                  {item.ts ? new Date(item.ts).toLocaleDateString() : ""}
                  {item.type === "regrade" && item.regradeNote && <span style={{ marginLeft: 6 }}>"{item.regradeNote.length > 40 ? item.regradeNote.slice(0, 40) + "..." : item.regradeNote}"</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: grading panel */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {!selectedItem ? (
            <div style={{ padding: 60, textAlign: "center", color: TEXT_MUTED }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Select an item to grade</div>
              <div style={{ fontSize: 13 }}>Click on any item in the list to open it here.</div>
            </div>
          ) : (
            <div>
              {/* Student header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                {(() => { const bio = bios[selectedItem.student.id] || {}; return bio.photo ? (
                  <img src={bio.photo} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: TEXT_MUTED }}>{selectedItem.student.name[0]}</div>
                ); })()}
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#111827" }}>{selectedItem.student.name}</div>
                  <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>{selectedItem.assignment.name} ({selectedItem.assignment.weight}%)</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: typeConfig[selectedItem.type].bg, color: typeConfig[selectedItem.type].color, border: "1px solid " + typeConfig[selectedItem.type].border, marginLeft: "auto" }}>{typeConfig[selectedItem.type].label}</span>
              </div>

              {/* Regrade request note */}
              {selectedItem.type === "regrade" && selectedItem.regradeNote && (
                <div style={{ padding: "10px 14px", background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a", marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: AMBER, textTransform: "uppercase", marginBottom: 4 }}>Regrade Request</div>
                  <div style={{ fontSize: 13, color: "#92400e", lineHeight: 1.5 }}>{selectedItem.regradeNote}</div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>{new Date(selectedItem.ts).toLocaleString()}</div>
                </div>
              )}

              {/* Submission */}
              {selectedItem.sub ? (
                <div style={{ padding: "10px 14px", background: "#f9fafb", borderRadius: 10, marginBottom: 12 }}>
                  {selectedItem.sub.docUrl && <a href={selectedItem.sub.docUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: ACCENT, fontWeight: 600, textDecoration: "none" }}>View Submission</a>}
                  {selectedItem.sub.notes && <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4, lineHeight: 1.5 }}>"{selectedItem.sub.notes}"</div>}
                  <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>
                    Submitted {new Date(selectedItem.sub.ts).toLocaleString()}
                    {selectedItem.type === "late" && <span style={{ color: AMBER, fontWeight: 600, marginLeft: 6 }}>LATE</span>}
                    {selectedItem.type === "resub" && <span style={{ color: "#2563eb", fontWeight: 600, marginLeft: 6 }}>RESUBMITTED</span>}
                  </div>
                </div>
              ) : (
                <div style={{ padding: "10px 14px", background: "#fef2f2", borderRadius: 10, marginBottom: 12, fontSize: 13, color: RED }}>No submission</div>
              )}

              {/* Existing grade */}
              {selectedItem.grade.score !== undefined && selectedItem.grade.score !== "" && (
                <div style={{ padding: "10px 14px", background: "#f9fafb", borderRadius: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 4 }}>Current Grade</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: parseFloat(selectedItem.grade.score) === 0 ? RED : "#111827" }}>{selectedItem.grade.score}<span style={{ fontSize: 13, color: TEXT_MUTED, fontWeight: 500 }}> / {selectedItem.grade.outOf || 100}</span></div>
                  {selectedItem.grade.comment && <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4, lineHeight: 1.5 }}>{selectedItem.grade.comment}</div>}
                </div>
              )}

              {/* Quick Grade button */}
              {!!(data.assignmentRubrics || {})[selectedItem.assignment.id] && (
                <button onClick={() => setQuickGradeOpen(!quickGradeOpen)} style={{ ...pill, background: quickGradeOpen ? ACCENT : "#eff6ff", color: quickGradeOpen ? "#fff" : ACCENT, width: "100%", marginBottom: 12, fontSize: 13 }}>
                  {quickGradeOpen ? "Close Quick Grade" : "Quick Grade"}
                </button>
              )}
              {quickGradeOpen && (
                <QuickGrade assignmentId={selectedItem.assignment.id} studentId={selectedItem.student.id} studentName={selectedItem.student.name} data={data} setData={setData} onClose={() => {
                  setQuickGradeOpen(false);
                  const itemId = selectedItem.id;
                  setCompletedItems(prev => new Set([...prev, itemId]));
                  setTimeout(() => { setCompletedItems(prev => { const next = new Set(prev); next.delete(itemId); return next; }); }, 120000);
                  setSelectedItem(null);
                }} />
              )}

              {/* Manual grade inputs */}
              {!quickGradeOpen && (
                <div>
                  <div style={{ ...sectionLabel, marginBottom: 6 }}>Grade</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <input type="number" value={gradeForm.score} onChange={e => setGradeForm({ ...gradeForm, score: e.target.value })} placeholder="Score" style={{ ...inp, width: 90, fontSize: 16, fontWeight: 700, padding: "8px 12px", textAlign: "center" }} />
                    <span style={{ fontSize: 14, color: TEXT_MUTED }}>/</span>
                    <input type="number" value={gradeForm.outOf} onChange={e => setGradeForm({ ...gradeForm, outOf: e.target.value })} style={{ ...inp, width: 60, fontSize: 14, padding: "8px 10px", textAlign: "center" }} />
                  </div>
                  <textarea value={gradeForm.comment} onChange={e => setGradeForm({ ...gradeForm, comment: e.target.value })} placeholder="Comment for student..." rows={3} style={{ ...inp, fontSize: 13, padding: "8px 12px", resize: "vertical", marginBottom: 10 }} />
                  <button onClick={saveGrade} style={{ ...pill, background: GREEN, color: "#fff", width: "100%", fontSize: 14, padding: "10px 16px" }}>Save Grade</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
