import { useState } from "react";
import StarRating from "./StarRating";
import { CA2RCardView, CA2RGenerateButton, OutcomeTags, OUTCOME_COLORS } from "./CA2RGenerator";
import { patchStory, saveCA2R } from "./notionService";

const TAG_COLORS = {
  Leadership:        { bg: "#EBF2FB", text: "#185FA5" },
  Communication:     { bg: "#E8F5ED", text: "#2E7D4F" },
  "Problem Solving": { bg: "#FDF3DC", text: "#C47B10" },
  Collaboration:     { bg: "#F3EEF9", text: "#6B3FA0" },
  Sales:             { bg: "#FFF0EC", text: "#B84A2E" },
  "L&D":             { bg: "#E8F5ED", text: "#2E7D4F" },
  Ministry:          { bg: "#FDE8F0", text: "#A0346A" },
  Technical:         { bg: "#F1F0EE", text: "#5C5B56" },
};

const MM_COLORS = {
  "Learn-Analyze-Unblock":     { bg: "#EBF2FB", text: "#185FA5", border: "#93BBE8" },
  "Diagnose-Convene-Activate": { bg: "#F3EEF9", text: "#6B3FA0", border: "#C9AEE8" },
  "Listen-Validate-Design":    { bg: "#E8F5ED", text: "#2E7D4F", border: "#A3D4B4" },
  "Assess-Align-Execute":      { bg: "#FDF3DC", text: "#C47B10", border: "#F0D08A" },
  "Build-Measure-Learn":       { bg: "#FDE8F0", text: "#A0346A", border: "#E8A8C8" },
};

const STATUS_STYLES = {
  Active:   { bg: "#E8F5ED", text: "#2E7D4F", border: "#A3D4B4" },
  Draft:    { bg: "#FDF3DC", text: "#C47B10", border: "#F0D08A" },
  Archived: { bg: "#F1F0EE", text: "#6B6860", border: "#D0CEC5" },
};

function MentalModelRow({ tags = [], steps }) {
  const hasSteps = steps && steps.trim();
  const hasTags = tags && tags.length > 0;
  if (!hasTags && !hasSteps) return null;

  // Parse steps — split on →, -, –, or >
  const parts = hasSteps
    ? steps.split(/[→\-–>]+/).map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div style={{
      marginTop: 10, marginBottom: 4, padding: "7px 10px",
      background: "var(--surface2)", borderRadius: 8,
      border: "0.5px solid var(--border2)",
    }}>
      <span style={{
        fontSize: 9, fontWeight: 700, color: "var(--text3)",
        textTransform: "uppercase", letterSpacing: "0.08em",
        display: "block", marginBottom: (hasTags || hasSteps) ? 5 : 0,
      }}>Mental Model</span>

      {hasTags && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: parts.length ? 6 : 0 }}>
          {tags.map(tag => {
            const c = MM_COLORS[tag] || { bg: "#F1F0EE", text: "#6B6860", border: "#D0CEC5" };
            return (
              <span key={tag} style={{
                fontSize: 11, padding: "2px 10px", borderRadius: 20, fontWeight: 500,
                background: c.bg, color: c.text, border: `0.5px solid ${c.border}`,
              }}>{tag}</span>
            );
          })}
        </div>
      )}

      {parts.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {parts.map((step, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {i > 0 && <span style={{ fontSize: 14, color: "var(--text3)", lineHeight: 1 }}>→</span>}
              <span style={{
                fontSize: 12, fontWeight: 500, color: "var(--text2)",
                background: "var(--surface)", padding: "3px 9px",
                borderRadius: 6, border: "0.5px solid var(--border)",
              }}>{step}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FocusOverlay({ story, onClose, onEdit, carData, onCarSave, storyMode }) {
  if (!story) return null;

  const isCar = storyMode === "CA2R";
  const carFromNotion = story.car2r_generated ? {
    context:    story.car2r_context,
    approach1:  story.car2r_approach1,
    approach2:  story.car2r_approach2,
    result:     story.car2r_result,
    coachNotes: story.car2r_coach,
  } : null;
  const activeCar = carData || carFromNotion;

  function handleCarGenerated(car) {
    onCarSave && onCarSave(car);
    saveCA2R(story.id, car).catch(console.error);
  }

  const status = story.status || "Active";
  const ss = STATUS_STYLES[status] || STATUS_STYLES.Active;

  function copyToClipboard() {
    const lines = isCar && activeCar ? [
      `STORY: ${story.title}`, "",
      `CONTEXT:\n${activeCar.context}`, "",
      `APPROACH (SYSTEM):\n${activeCar.approach1}`, "",
      `APPROACH (DETAIL):\n${activeCar.approach2}`, "",
      `RESULT:\n${activeCar.result}`,
      activeCar.coachNotes ? `\nCOACH NOTES:\n${activeCar.coachNotes}` : "",
    ] : [
      `STORY: ${story.title}`,
      story.context ? `Role: ${story.context}` : "", "",
      `SITUATION:\n${story.situation}`, "",
      `TASK:\n${story.task}`, "",
      `ACTION:\n${story.action}`, "",
      `RESULT:\n${story.result}`,
    ];
    navigator.clipboard.writeText(lines.filter(Boolean).join("\n")).catch(() => {});
  }

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(2px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1.5rem", animation: "fadeIn 0.18s ease",
      }}
    >
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }`}</style>

      <div style={{
        background: "var(--card-bg)",
        border: "2px solid var(--accent-border)",
        borderRadius: 20,
        boxShadow: "0 0 0 4px var(--accent-bg), 0 32px 80px rgba(0,0,0,0.4)",
        width: "100%", maxWidth: 680, maxHeight: "88vh", overflowY: "auto",
        padding: "2rem", fontFamily: "var(--font)",
      }}>
        {/* Mode badge + close */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <span style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase",
            padding: "3px 10px", borderRadius: 20, border: "0.5px solid var(--border2)",
            color: isCar ? "#0F6E56" : "var(--text3)",
            background: isCar ? "#E1F5EE" : "var(--surface2)",
          }}>
            {isCar ? "CA²R view" : "STAR view"}
          </span>
          <button onClick={onClose} style={{
            background: "none", border: "0.5px solid var(--border)", borderRadius: 8,
            padding: "3px 10px", cursor: "pointer", fontSize: 13, color: "var(--text2)",
          }}>✕</button>
        </div>

        {/* Title + status */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--text)", lineHeight: 1.3, flex: 1 }}>
            {story.title || "Untitled"}
          </h2>
          <span style={{
            fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 500, flexShrink: 0,
            background: ss.bg, color: ss.text, border: `0.5px solid ${ss.border}`,
          }}>{status}</span>
        </div>

        {/* Year + role */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {story.year && (
            <span style={{
              fontSize: 11, padding: "2px 10px", borderRadius: 20,
              background: "var(--accent-bg)", color: "var(--accent)",
              border: "0.5px solid var(--accent-border)", fontFamily: "var(--font-mono)", fontWeight: 500,
            }}>{story.year}</span>
          )}
          {story.context && (
            <p style={{ fontSize: 13, color: "var(--text3)", fontStyle: "italic", margin: 0 }}>{story.context}</p>
          )}
        </div>

        {/* Star rating */}
        <div style={{ marginBottom: 4 }}>
          <StarRating value={story.rating || 0} size={18} readonly />
        </div>

        {/* Mental model */}
        <MentalModelRow tags={story.mental_model || []} steps={story.mental_model_steps || ""} />

        {/* Story content */}
        {isCar ? (
          activeCar
            ? <CA2RCardView car={activeCar} condensed={false} storyId={story.id} />
            : (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 13, color: "var(--text3)", fontStyle: "italic", marginBottom: 10 }}>
                  No CA²R version yet. Generate from the card first, or use the button below.
                </p>
                <CA2RGenerateButton story={story} onGenerated={handleCarGenerated} />
              </div>
            )
        ) : (
          [{key:"situation",label:"S",full:"Situation",color:"#185FA5"},
           {key:"task",     label:"T",full:"Task",     color:"#2E7D4F"},
           {key:"action",   label:"A",full:"Action",   color:"#C47B10"},
           {key:"result",   label:"R",full:"Result",   color:"#6B3FA0"},
          ].map(({ key, label, full, color }) => (
            <div key={key} style={{ borderTop: "0.5px solid var(--section-border)", paddingTop: 14, marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  background: color + "18", color,
                  padding: "2px 8px", borderRadius: 5,
                  fontFamily: "var(--font-mono)", border: `0.5px solid ${color}40`,
                }}>{label}</span>
                <span style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>{full}</span>
              </div>
              <p style={{ fontSize: 14, color: "var(--mono-text)", lineHeight: 1.7 }}>
                {story[key] || <span style={{ color: "var(--text3)", fontStyle: "italic" }}>Not filled in</span>}
              </p>
            </div>
          ))
        )}

        {/* Tags — Impact */}
        {story.tags?.length > 0 && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase",
              letterSpacing: "0.08em", paddingTop: 4, flexShrink: 0,
            }}>Impact</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {story.tags.map(tag => {
                const tc = TAG_COLORS[tag] || { bg: "#F1F0EE", text: "#6B6860" };
                return (
                  <span key={tag} style={{
                    fontSize: 11, padding: "3px 10px", borderRadius: 20,
                    background: tc.bg, color: tc.text, fontWeight: 500,
                  }}>{tag}</span>
                );
              })}
            </div>
          </div>
        )}

        {/* Tags — Outcomes */}
        {(story.outcomes || []).length > 0 && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase",
              letterSpacing: "0.08em", paddingTop: 4, flexShrink: 0,
            }}>Outcomes</span>
            <OutcomeTags outcomes={story.outcomes || []} />
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: "flex", gap: 8, marginTop: 20, paddingTop: 16,
          borderTop: "0.5px solid var(--section-border)",
        }}>
          <button onClick={() => { onEdit(story); onClose(); }} style={focusBtn(true)}>Edit story</button>
          <button onClick={copyToClipboard} style={focusBtn(false)}>Copy to clipboard</button>
        </div>
      </div>
    </div>
  );
}

function focusBtn(primary) {
  return {
    flex: 1, fontSize: 13, padding: "8px 16px", borderRadius: 10, cursor: "pointer",
    border: primary ? "none" : "0.5px solid var(--border)",
    background: primary ? "var(--text)" : "transparent",
    color: primary ? "var(--bg)" : "var(--text2)",
    fontFamily: "var(--font)", fontWeight: primary ? 500 : 400, transition: "all 0.12s",
  };
}
