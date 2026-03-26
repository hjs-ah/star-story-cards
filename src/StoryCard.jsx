import StarRating from "./StarRating";
import { patchStory } from "./notionService";
import KeywordSuggestions from "./KeywordSuggestions";

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

function truncate(text, maxChars) {
  if (!text) return "";
  return text.length > maxChars ? text.slice(0, maxChars).trimEnd() + "..." : text;
}

export default function StoryCard({ story, onEdit, onArchive, onRestore, onRatingChange, onFocus, condensed }) {
  const status = story.status || "Active";
  const ss = STATUS_STYLES[status] || STATUS_STYLES.Active;

  function handleRating(n) {
    onRatingChange(story.id, n);
    patchStory(story.id, { "Star Rating": n }).catch(console.error);
  }

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
    ].filter(l => l !== undefined).join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div style={{
      background: "var(--card-bg)",
      border: "1.5px solid var(--border2)",
      borderRadius: 16,
      padding: condensed ? "1rem" : "1.25rem",
      display: "flex",
      flexDirection: "column",
      fontFamily: "var(--font)",
      boxShadow: "0 0 0 3px var(--surface2)",
      transition: "box-shadow 0.15s, border-color 0.15s",
    }}>

      {/* Header — always visible */}
      <div style={{ marginBottom: condensed ? 6 : 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", lineHeight: 1.4, flex: 1 }}>
            {story.title || "Untitled"}
          </h3>
          <span style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 500, flexShrink: 0,
            background: ss.bg, color: ss.text, border: `0.5px solid ${ss.border}`,
          }}>
            {status}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
          {story.year && (
            <span style={{
              fontSize: 10, padding: "1px 7px", borderRadius: 20, fontFamily: "var(--font-mono)",
              background: "var(--surface2)", color: "var(--text2)",
              border: "0.5px solid var(--border2)", fontWeight: 500,
            }}>{story.year}</span>
          )}
          {story.context && (
            <p style={{ fontSize: 11, color: "var(--text3)", fontStyle: "italic", margin: 0 }}>{story.context}</p>
          )}
        </div>
        {!condensed && (
          <div style={{ marginTop: 8 }}>
            <StarRating value={story.rating || 0} onChange={handleRating} size={14} />
          </div>
        )}
      </div>

      {/* CONDENSED VIEW — situation truncated + soundbites only */}
      {condensed ? (
        <div>
          <p style={{ fontSize: 12, color: "var(--mono-text)", lineHeight: 1.55, margin: 0 }}>
            {truncate(story.situation, 120)}
          </p>
          {story.tags?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 8 }}>
              {story.tags.map(tag => {
                const tc = TAG_COLORS[tag] || { bg: "#F1F0EE", text: "#6B6860" };
                return (
                  <span key={tag} style={{
                    fontSize: 10, padding: "2px 7px", borderRadius: 20,
                    background: tc.bg, color: tc.text, fontWeight: 500,
                  }}>{tag}</span>
                );
              })}
            </div>
          )}
          <div style={{
            display: "flex", gap: 6, marginTop: 10, paddingTop: 8,
            borderTop: "0.5px solid var(--section-border)",
          }}>
            <button onClick={() => onFocus(story)} style={btnStyle("focus")}>Focus</button>
            <button onClick={() => onEdit(story)} style={btnStyle()}>Edit</button>
            {status !== "Archived"
              ? <button onClick={() => onArchive(story.id)} style={btnStyle()}>Archive</button>
              : <button onClick={() => onRestore(story.id)} style={btnStyle()}>Restore</button>
            }
            <button onClick={copyToClipboard} style={btnStyle()}>Copy</button>
          </div>
        </div>
      ) : (
        /* FULL VIEW — all STAR sections */
        <>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {[
              { key: "situation", label: "S", full: "Situation" },
              { key: "task",      label: "T", full: "Task" },
              { key: "action",    label: "A", full: "Action" },
              { key: "result",    label: "R", full: "Result" },
            ].map(({ key, label, full }) => (
              <div key={key} style={{ borderTop: "0.5px solid var(--section-border)", paddingTop: 8, marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, background: "var(--label-bg)",
                    color: "var(--label-text)", padding: "1px 6px", borderRadius: 4,
                    fontFamily: "var(--font-mono)",
                  }}>{label}</span>
                  <span style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {full}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "var(--mono-text)", lineHeight: 1.6 }}>
                  {story[key] || <span style={{ color: "var(--text3)", fontStyle: "italic" }}>Not filled in</span>}
                </p>
              </div>
            ))}
          </div>

          {story.tags?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 12 }}>
              {story.tags.map(tag => {
                const tc = TAG_COLORS[tag] || { bg: "#F1F0EE", text: "#6B6860" };
                return (
                  <span key={tag} style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 20,
                    background: tc.bg, color: tc.text, fontWeight: 500,
                  }}>{tag}</span>
                );
              })}
            </div>
          )}

          <div style={{
            display: "flex", gap: 6, marginTop: 12, paddingTop: 10,
            borderTop: "0.5px solid var(--section-border)",
          }}>
            <button onClick={() => onFocus(story)} style={btnStyle("focus")}>Focus</button>
            <button onClick={() => onEdit(story)} style={btnStyle()}>Edit</button>
            {status !== "Archived"
              ? <button onClick={() => onArchive(story.id)} style={btnStyle()}>Archive</button>
              : <button onClick={() => onRestore(story.id)} style={btnStyle()}>Restore</button>
            }
            <button onClick={copyToClipboard} style={btnStyle()}>Copy</button>
          </div>

          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "0.5px solid var(--section-border)" }}>
            <KeywordSuggestions story={story} />
          </div>
        </>
      )}
    </div>
  );
}

function btnStyle(type) {
  const isFocus = type === "focus";
  return {
    flex: 1, fontSize: 11, padding: "5px 8px", borderRadius: 8, cursor: "pointer",
    border: "0.5px solid var(--border)",
    background: isFocus ? "var(--surface2)" : "transparent",
    color: isFocus ? "var(--text)" : "var(--text2)",
    fontFamily: "var(--font)", transition: "all 0.12s",
  };
}
