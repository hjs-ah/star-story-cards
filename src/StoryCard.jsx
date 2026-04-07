import StarRating from "./StarRating";
import { patchStory, saveCA2R } from "./notionService";
import KeywordSuggestions from "./KeywordSuggestions";
import { CA2RCardView, CA2RGenerateButton, OutcomeTags } from "./CA2RGenerator";

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

const MM_COLORS = {
  "Learn-Analyze-Unblock":    { bg: "#EBF2FB", text: "#185FA5", border: "#93BBE8" },
  "Diagnose-Convene-Activate":{ bg: "#F3EEF9", text: "#6B3FA0", border: "#C9AEE8" },
  "Listen-Validate-Design":   { bg: "#E8F5ED", text: "#2E7D4F", border: "#A3D4B4" },
  "Assess-Align-Execute":     { bg: "#FDF3DC", text: "#C47B10", border: "#F0D08A" },
  "Build-Measure-Learn":      { bg: "#FDE8F0", text: "#A0346A", border: "#E8A8C8" },
};

function truncate(text, maxChars) {
  if (!text) return "";
  return text.length > maxChars ? text.slice(0, maxChars).trimEnd() + "..." : text;
}

function StarLabel({ letter }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
      fontFamily: "var(--font-mono)", background: "var(--text)", color: "var(--bg)",
    }}>{letter}</span>
  );
}

// Mental model section: tags + chevron steps if present
function MentalModelRow({ tags = [], steps }) {
  const hasSteps = steps && steps.trim();
  const hasTags = tags && tags.length > 0;
  if (!hasTags && !hasSteps) return null;

  const parts = hasSteps
    ? steps.split(/[→\-–>]+/).map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div style={{
      marginTop: 8, padding: "7px 10px",
      background: "var(--surface2)", borderRadius: 8,
      border: "0.5px solid var(--border2)",
    }}>
      <span style={{
        fontSize: 9, fontWeight: 700, color: "var(--text3)",
        textTransform: "uppercase", letterSpacing: "0.08em",
        display: "block", marginBottom: hasTags || hasSteps ? 5 : 0,
      }}>Mental Model</span>

      {/* Tags row */}
      {hasTags && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: hasSteps ? 6 : 0 }}>
          {tags.map(tag => {
            const c = MM_COLORS[tag] || { bg: "#F1F0EE", text: "#6B6860", border: "#D0CEC5" };
            return (
              <span key={tag} style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 500,
                background: c.bg, color: c.text, border: `0.5px solid ${c.border}`,
              }}>{tag}</span>
            );
          })}
        </div>
      )}

      {/* Chevron steps */}
      {parts.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          {parts.map((step, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {i > 0 && (
                <span style={{ fontSize: 11, color: "var(--text3)" }}>›</span>
              )}
              <span style={{
                fontSize: 11, fontWeight: 500, color: "var(--text2)",
                background: "var(--surface)", padding: "2px 7px",
                borderRadius: 6, border: "0.5px solid var(--border)",
              }}>{step}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StoryCard({
  story, onEdit, onArchive, onRestore, onRatingChange, onFocus,
  condensed, storyMode,
  kwData, onKwSave, onKwReset,
  carData, onCarSave, onCarReset,
}) {
  const status = story.status || "Active";
  const ss = STATUS_STYLES[status] || STATUS_STYLES.Active;
  const isCar = storyMode === "CA2R";

  const carFromNotion = story.car2r_generated ? {
    context:    story.car2r_context,
    approach1:  story.car2r_approach1,
    approach2:  story.car2r_approach2,
    result:     story.car2r_result,
    coachNotes: story.car2r_coach,
  } : null;
  const activeCar = carData || carFromNotion;

  // Load saved keywords from story if no session data
  const resolvedKw = kwData || (
    (story.kw_power_words?.length || story.kw_metrics?.length || story.kw_phrases?.length)
      ? { powerWords: story.kw_power_words || [], metrics: story.kw_metrics || [], phrases: story.kw_phrases || [] }
      : null
  );

  function handleRating(n) {
    onRatingChange(story.id, n);
    patchStory(story.id, { "Star Rating": n }).catch(console.error);
  }

  function handleCarGenerated(car) {
    onCarSave(car);
    saveCA2R(story.id, car).catch(console.error);
  }

  function handleKwSave(kw) {
    onKwSave(kw);
    // Persist to Notion
    patchStory(story.id, {
      "KW Power Words": (kw.powerWords || []).join(", "),
      "KW Metrics":     (kw.metrics || []).join(", "),
      "KW Phrases":     (kw.phrases || []).join(", "),
    }).catch(console.error);
  }

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
    navigator.clipboard.writeText(lines.filter(l => l !== undefined).join("\n")).catch(() => {});
  }

  const cardHeader = (
    <div style={{ marginBottom: condensed ? 6 : 8 }}>
      {/* Title + status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--tan-title)", lineHeight: 1.4, flex: 1 }}>
          {story.title || "Untitled"}
        </h3>
        <span style={{
          fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 500, flexShrink: 0,
          background: ss.bg, color: ss.text, border: `0.5px solid ${ss.border}`,
        }}>{status}</span>
      </div>

      {/* Year + role */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
        {story.year && (
          <span style={{
            fontSize: 10, padding: "1px 7px", borderRadius: 20, fontFamily: "var(--font-mono)",
            background: "var(--surface2)", color: "var(--text2)",
            border: "0.5px solid var(--border2)", fontWeight: 500,
          }}>{story.year}</span>
        )}
        {story.context && (
          <p style={{ fontSize: 11, color: "var(--text3)", fontStyle: "italic", margin: 0 }}>
            {story.context}
          </p>
        )}
      </div>

      {/* Star rating */}
      <div style={{ marginTop: 8 }}>
        <StarRating value={story.rating || 0} onChange={handleRating} size={14} />
      </div>

      {/* Mental model — tags + chevron steps */}
      <MentalModelRow
        tags={story.mental_model || []}
        steps={story.mental_model_steps || ""}
      />

      {/* Action stack: full-width stacked */}
      <div style={{
        marginTop: 10, paddingTop: 10,
        borderTop: "0.5px solid var(--section-border)",
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        <KeywordSuggestions
          story={story}
          kwData={resolvedKw}
          onSave={handleKwSave}
          onReset={onKwReset}
          condensed={condensed}
        />
        <div>
          {activeCar ? (
            <button onClick={() => onCarReset(story.id)} style={{
              width: "100%", fontSize: 11, padding: "6px 8px", borderRadius: 8, cursor: "pointer",
              border: "0.5px solid var(--border2)", background: "transparent",
              color: "var(--text3)", fontFamily: "var(--font)",
            }}>Reset CA²R</button>
          ) : (
            <CA2RGenerateButton story={story} onGenerated={handleCarGenerated} />
          )}
        </div>
      </div>
    </div>
  );

  const actionRow = (
    <div style={{
      display: "flex", gap: 6,
      marginTop: condensed ? 10 : 12, paddingTop: condensed ? 8 : 10,
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
  );

  const tagsRow = (
    <>
      {story.tags?.length > 0 && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase",
            letterSpacing: "0.07em", paddingTop: 3, flexShrink: 0,
          }}>Impact</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
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
        </div>
      )}
      {(story.outcomes || []).length > 0 && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase",
            letterSpacing: "0.07em", paddingTop: 3, flexShrink: 0,
          }}>Outcomes</span>
          <OutcomeTags outcomes={story.outcomes || []} />
        </div>
      )}
    </>
  );

  return (
    <div style={{
      background: "var(--card-bg)",
      border: "1.5px solid var(--tan-border)",
      borderRadius: 16,
      padding: condensed ? "1rem" : "1.25rem",
      display: "flex", flexDirection: "column",
      fontFamily: "var(--font)",
      boxShadow: "0 0 0 3px var(--tan-glow)",
    }}>
      {cardHeader}

      {condensed ? (
        <div>
          {isCar && activeCar
            ? <p style={{ fontSize: 12, color: "var(--mono-text)", lineHeight: 1.6, margin: 0 }}>
                {truncate(activeCar.context, 160)}
              </p>
            : <div style={{ fontSize: 12, color: "var(--mono-text)", lineHeight: 1.6 }}>
                {story.situation && (
                  <p style={{ margin: "0 0 4px" }}>{truncate(story.situation, 130)}</p>
                )}
                {story.result && (
                  <p style={{ margin: 0, color: "var(--text2)" }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "0.07em", color: "#6B3FA0", marginRight: 4,
                    }}>Result</span>
                    {truncate(story.result, 100)}
                  </p>
                )}
              </div>
          }
          {tagsRow}
          {actionRow}
        </div>
      ) : (
        <>
          {isCar ? (
            activeCar
              ? <CA2RCardView car={activeCar} condensed={false} />
              : <div style={{ fontSize: 12, color: "var(--text3)", fontStyle: "italic", marginTop: 8 }}>
                  Click "Generate CA²R" above to create your CA²R version.
                </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { key: "situation", label: "S", full: "Situation" },
                { key: "task",      label: "T", full: "Task" },
                { key: "action",    label: "A", full: "Action" },
                { key: "result",    label: "R", full: "Result" },
              ].map(({ key, label, full }) => (
                <div key={key} style={{ borderTop: "0.5px solid var(--section-border)", paddingTop: 8, marginTop: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                    <StarLabel letter={label} />
                    <span style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{full}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--mono-text)", lineHeight: 1.6 }}>
                    {story[key] || <span style={{ color: "var(--text3)", fontStyle: "italic" }}>Not filled in</span>}
                  </p>
                </div>
              ))}
            </div>
          )}
          {tagsRow}
          {actionRow}
        </>
      )}
    </div>
  );
}

function btnStyle(type) {
  return {
    flex: 1, fontSize: 11, padding: "5px 8px", borderRadius: 8, cursor: "pointer",
    border: "0.5px solid var(--border)",
    background: type === "focus" ? "var(--surface2)" : "transparent",
    color: type === "focus" ? "var(--text)" : "var(--text2)",
    fontFamily: "var(--font)", transition: "all 0.12s",
  };
}
