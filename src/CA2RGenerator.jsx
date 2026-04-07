import { useState } from "react";
import { patchStory } from "./notionService";

export const OUTCOME_COLORS = {
  "Revenue Generation": { bg: "#E8F5ED", text: "#2E7D4F", border: "#A3D4B4" },
  "Market Awareness":   { bg: "#EBF2FB", text: "#185FA5", border: "#93BBE8" },
  "Customer Attraction":{ bg: "#F3EEF9", text: "#6B3FA0", border: "#C9AEE8" },
  "Customer Happiness": { bg: "#FDE8F0", text: "#A0346A", border: "#E8A8C8" },
  "Company Growth":     { bg: "#FDF3DC", text: "#C47B10", border: "#F0D08A" },
  "Employee Happiness": { bg: "#FFF0EC", text: "#B84A2E", border: "#F5B8A8" },
  "Cost Reduction":     { bg: "#F4F3EF", text: "#5C5B56", border: "#C4C2BC" },
  "Process Efficiency": { bg: "#E1F5EE", text: "#0F6E56", border: "#5DCAA5" },
};

const SECTIONS = [
  { key: "context",   label: "C",  full: "Context",   color: "#185FA5" },
  { key: "approach1", label: "A¹", full: "Approach¹", color: "#2E7D4F" },
  { key: "approach2", label: "A²", full: "Approach²", color: "#C47B10" },
  { key: "result",    label: "R",  full: "Result",    color: "#6B3FA0" },
];

// Format coach notes: insert blank line before each ALL-CAPS section heading
// (after the first one)
function formatCoachNotes(text) {
  if (!text) return [];
  // Split on boundaries where an all-caps word/phrase starts a new line or sentence
  // Pattern: line break before "WORD:" or "WORD WORD:" that is all caps
  const lines = text.split(/\n/);
  const blocks = [];
  let current = "";
  for (const line of lines) {
    // Detect an all-caps heading like "STRENGTHS:", "FLAG 1", "GAPS", etc.
    const isHeading = /^[A-Z][A-Z0-9 &\-:()]{3,}[:.]?\s/.test(line.trim()) || /^[A-Z]{3,}:/.test(line.trim());
    if (isHeading && current.trim()) {
      blocks.push(current.trim());
      current = line;
    } else {
      current = current ? current + " " + line : line;
    }
  }
  if (current.trim()) blocks.push(current.trim());
  return blocks;
}

export function CA2RCardView({ car, condensed, storyId, onResolved }) {
  const [resolved, setResolved] = useState(false);
  const [showFix, setShowFix] = useState(false);

  if (!car) return null;

  if (condensed) {
    return car.context
      ? <p style={{ fontSize: 12, color: "var(--mono-text)", lineHeight: 1.55, margin: 0 }}>
          {car.context.length > 120 ? car.context.slice(0, 120).trimEnd() + "..." : car.context}
        </p>
      : null;
  }

  const noteBlocks = formatCoachNotes(car.coachNotes);

  function handleResolve() {
    setResolved(true);
    setShowFix(false);
    if (storyId) patchStory(storyId, { "CA2R Coach Notes": "✓ RESOLVED\n\n" + (car.coachNotes || "") }).catch(console.error);
    onResolved && onResolved();
  }

  function handleFix() {
    setShowFix(v => !v);
  }

  const fixPrompt = `You are helping me improve an interview story. Below are coaching notes identifying gaps. Please provide specific replacement text for each gap identified.

STORY CONTEXT: ${car.context || ""}

COACHING NOTES:
${car.coachNotes || ""}

For each gap or flag in the coaching notes, provide:
1. The specific section it applies to (Context / Approach¹ / Approach² / Result)
2. The improved version of that section or the additional sentence/phrase to add

Format your response as:
SECTION: [name]
IMPROVEMENT: [your improved text]
---`;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {SECTIONS.map(({ key, label, full, color }) => (
        <div key={key} style={{ borderTop: "0.5px solid var(--section-border)", paddingTop: 8, marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, background: "var(--text)", color: "var(--bg)",
              padding: "1px 6px", borderRadius: 4, fontFamily: "var(--font-mono)",
            }}>{label}</span>
            <span style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{full}</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--mono-text)", lineHeight: 1.6 }}>
            {car[key] || <span style={{ color: "var(--text3)", fontStyle: "italic" }}>Not generated yet</span>}
          </p>
        </div>
      ))}

      {car.coachNotes && (
        <div style={{
          marginTop: 10, padding: "8px 10px",
          background: resolved ? "#E8F5ED" : "var(--accent-bg)",
          borderRadius: 8,
          border: `0.5px solid ${resolved ? "#A3D4B4" : "var(--accent-border)"}`,
          transition: "background 0.3s, border-color 0.3s",
        }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: resolved ? "#2E7D4F" : "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {resolved ? "✓ Coach notes resolved" : "Coach notes"}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {!resolved && (
                <button onClick={handleFix} style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 6, cursor: "pointer",
                  border: "0.5px solid var(--accent-border)", background: showFix ? "var(--accent)" : "transparent",
                  color: showFix ? "var(--bg)" : "var(--accent)", fontFamily: "var(--font)", fontWeight: 500,
                }}>Fix</button>
              )}
              <button onClick={handleResolve} style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 6, cursor: "pointer",
                border: "0.5px solid #A3D4B4", background: resolved ? "#2E7D4F" : "transparent",
                color: resolved ? "#fff" : "#2E7D4F", fontFamily: "var(--font)", fontWeight: 500,
              }}>Resolve</button>
            </div>
          </div>

          {/* Coach note body — formatted with section breaks */}
          {!resolved && (
            <div style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.65 }}>
              {noteBlocks.map((block, i) => (
                <p key={i} style={{ margin: i === 0 ? 0 : "8px 0 0" }}>{block}</p>
              ))}
            </div>
          )}

          {/* Fix prompt — shown when Fix is clicked */}
          {showFix && !resolved && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                Prompt to improve this story
              </div>
              <div style={{
                fontSize: 11, color: "var(--text2)", lineHeight: 1.6,
                background: "var(--surface2)", border: "0.5px solid var(--border2)",
                borderRadius: 6, padding: "8px 10px", fontFamily: "var(--font-mono)",
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>{fixPrompt}</div>
              <button onClick={() => { navigator.clipboard.writeText(fixPrompt).catch(() => {}); }} style={{
                marginTop: 6, fontSize: 11, padding: "4px 12px", borderRadius: 6, cursor: "pointer",
                border: "0.5px solid var(--accent)", background: "transparent",
                color: "var(--accent)", fontFamily: "var(--font)",
              }}>Copy prompt</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CA2RGenerateButton({ story, onGenerated }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function generate() {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/car", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Request failed");
      onGenerated(data);
      setStatus("done");
    } catch (e) {
      setError(e.message);
      setStatus("error");
    }
  }

  if (status === "loading") return (
    <div style={{ fontSize: 11, color: "var(--text3)", fontStyle: "italic", padding: "6px 0" }}>
      Generating CA²R with Haiku…
    </div>
  );
  if (status === "error") return (
    <div style={{ fontSize: 11, color: "#B84A2E" }}>
      {error}
      <button onClick={generate} style={{ marginLeft: 6, fontSize: 11, cursor: "pointer", color: "#B84A2E", background: "none", border: "none", textDecoration: "underline" }}>Retry</button>
    </div>
  );

  return (
    <button onClick={generate} style={{
      width: "100%", fontSize: 11, padding: "7px 12px", borderRadius: 8, cursor: "pointer",
      border: "0.5px solid #0F6E56", background: "#E1F5EE", color: "#0F6E56",
      fontFamily: "var(--font)", fontWeight: 500, transition: "all 0.12s",
    }}>Generate CA²R</button>
  );
}

export function OutcomeTags({ outcomes = [] }) {
  if (!outcomes.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {outcomes.map(o => {
        const c = OUTCOME_COLORS[o] || { bg: "#F1F0EE", text: "#6B6860", border: "#D0CEC5" };
        return (
          <span key={o} style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 500,
            background: c.bg, color: c.text, border: `0.5px solid ${c.border}`,
          }}>{o}</span>
        );
      })}
    </div>
  );
}
