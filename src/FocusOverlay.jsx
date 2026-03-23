import StarRating from "./StarRating";

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

const STATUS_STYLES = {
  Active:   { bg: "#E8F5ED", text: "#2E7D4F", border: "#A3D4B4" },
  Draft:    { bg: "#FDF3DC", text: "#C47B10", border: "#F0D08A" },
  Archived: { bg: "#F1F0EE", text: "#6B6860", border: "#D0CEC5" },
};

export default function FocusOverlay({ story, onClose, onEdit }) {
  if (!story) return null;
  const status = story.status || "Active";
  const ss = STATUS_STYLES[status] || STATUS_STYLES.Active;

  function copyToClipboard() {
    const text = [
      `STORY: ${story.title}`,
      story.context ? `Role: ${story.context}` : "",
      "",
      `SITUATION:\n${story.situation}`,
      "",
      `TASK:\n${story.task}`,
      "",
      `ACTION:\n${story.action}`,
      "",
      `RESULT:\n${story.result}`,
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(2px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1.5rem",
        animation: "fadeIn 0.18s ease",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      <div style={{
        background: "var(--card-bg)",
        border: "2px solid var(--accent-border)",
        borderRadius: 20,
        boxShadow: "0 0 0 4px var(--accent-bg), 0 32px 80px rgba(0,0,0,0.4)",
        width: "100%",
        maxWidth: 680,
        maxHeight: "88vh",
        overflowY: "auto",
        padding: "2rem",
        fontFamily: "var(--font)",
      }}>
        {/* Close button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
          <button onClick={onClose} style={{
            background: "none", border: "0.5px solid var(--border)", borderRadius: 8,
            padding: "3px 10px", cursor: "pointer", fontSize: 13, color: "var(--text2)",
          }}>✕</button>
        </div>

        {/* Title row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--text)", lineHeight: 1.3, flex: 1 }}>
            {story.title || "Untitled"}
          </h2>
          <span style={{
            fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 500, flexShrink: 0,
            background: ss.bg, color: ss.text, border: `0.5px solid ${ss.border}`,
          }}>
            {status}
          </span>
        </div>

        {story.context && (
          <p style={{ fontSize: 13, color: "var(--text3)", fontStyle: "italic", marginBottom: 10 }}>{story.context}</p>
        )}

        <div style={{ marginBottom: 16 }}>
          <StarRating value={story.rating || 0} size={18} readonly />
        </div>

        {/* STAR sections */}
        {[
          { key: "situation", label: "S", full: "Situation", color: "#185FA5" },
          { key: "task",      label: "T", full: "Task",      color: "#2E7D4F" },
          { key: "action",    label: "A", full: "Action",    color: "#C47B10" },
          { key: "result",    label: "R", full: "Result",    color: "#6B3FA0" },
        ].map(({ key, label, full, color }) => (
          <div key={key} style={{
            borderTop: "0.5px solid var(--section-border)",
            paddingTop: 14, marginTop: 14,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: color + "18",
                color: color,
                padding: "2px 8px", borderRadius: 5,
                fontFamily: "var(--font-mono)",
                border: `0.5px solid ${color}40`,
              }}>
                {label}
              </span>
              <span style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
                {full}
              </span>
            </div>
            <p style={{ fontSize: 14, color: "var(--mono-text)", lineHeight: 1.7 }}>
              {story[key] || <span style={{ color: "var(--text3)", fontStyle: "italic" }}>Not filled in</span>}
            </p>
          </div>
        ))}

        {/* Tags */}
        {story.tags?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16 }}>
            {story.tags.map((tag) => {
              const tc = TAG_COLORS[tag] || { bg: "#F1F0EE", text: "#6B6860" };
              return (
                <span key={tag} style={{
                  fontSize: 11, padding: "3px 10px", borderRadius: 20,
                  background: tc.bg, color: tc.text, fontWeight: 500,
                }}>
                  {tag}
                </span>
              );
            })}
          </div>
        )}

        {/* Footer actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 20, paddingTop: 16, borderTop: "0.5px solid var(--section-border)" }}>
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
    fontFamily: "var(--font)", fontWeight: primary ? 500 : 400,
    transition: "all 0.12s",
  };
}
