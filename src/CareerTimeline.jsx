import { useRef, useState } from "react";

const MIN_YEAR = 2017;
const MAX_YEAR = 2026;
const ALL_YEARS = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);

const TAG_CATEGORY = {
  "Sales":           "pro",
  "Leadership":      "pro",
  "Communication":   "pro",
  "Problem Solving": "strategy",
  "Technical":       "strategy",
  "Ministry":        "ministry",
  "L&D":             "ministry",
  "Collaboration":   "ministry",
  "Academic":        "academic",
  "Research":        "academic",
};

const CATEGORY_COLOR = {
  pro:      "#185FA5",
  ministry: "#2E7D4F",
  strategy: "#C47B10",
  academic: "#6B3FA0",
};

const LEGEND = [
  { key: "pro",      label: "Pro / Leadership",    color: "#185FA5" },
  { key: "ministry", label: "Ministry / L&D",       color: "#2E7D4F" },
  { key: "strategy", label: "Strategy / Enablement",color: "#C47B10" },
  { key: "academic", label: "Academic / Research",  color: "#6B3FA0" },
];

function dotColor(tags) {
  for (const t of (tags || [])) {
    const cat = TAG_CATEGORY[t];
    if (cat) return CATEGORY_COLOR[cat];
  }
  return "#A09E98";
}

export default function CareerTimeline({ stories, activeYear, onYearSelect }) {
  const trackRef = useRef(null);
  const [tooltip, setTooltip] = useState(null); // { x, y, text }

  function pct(year) {
    return ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;
  }

  function handleDotEnter(e, story) {
    const track = trackRef.current;
    if (!track) return;
    const tr = track.getBoundingClientRect();
    const er = e.currentTarget.getBoundingClientRect();
    setTooltip({
      x: er.left - tr.left + er.width / 2,
      y: er.top - tr.top,
      text: story.title,
    });
  }

  // Group stories by year
  const byYear = {};
  stories.forEach(s => {
    if (!s.year || s.year < MIN_YEAR || s.year > MAX_YEAR) return;
    if (!byYear[s.year]) byYear[s.year] = [];
    byYear[s.year].push(s);
  });

  const hasAnyYearData = Object.keys(byYear).length > 0;

  return (
    <div style={{
      background: "var(--card-bg)",
      border: "0.5px solid var(--border)",
      borderRadius: 14,
      padding: "1rem 1.25rem 0.75rem",
      marginBottom: "1rem",
      fontFamily: "var(--font)",
    }}>

      {/* Track */}
      <div
        ref={trackRef}
        style={{ position: "relative", height: 72, margin: "0 16px", userSelect: "none" }}
      >
        {/* Base line */}
        <div style={{
          position: "absolute", top: "50%", left: 0, right: 0,
          height: "1px", background: "var(--border2)",
          transform: "translateY(-50%)",
        }} />

        {/* Active year highlight segment */}
        {activeYear && (
          <div style={{
            position: "absolute", top: "50%", height: 3,
            left: pct(activeYear) + "%",
            width: 0,
            transform: "translateY(-50%)",
            background: "var(--tan-border)",
            borderRadius: 2,
          }} />
        )}

        {ALL_YEARS.map(year => {
          const yearStories = byYear[year] || [];
          const isActive = activeYear === year;
          const isDimmed = activeYear && activeYear !== year;
          const left = pct(year) + "%";

          return (
            <div
              key={year}
              onClick={() => onYearSelect(year)}
              style={{
                position: "absolute", left,
                transform: "translateX(-50%)",
                top: 0, height: "100%",
                display: "flex", flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
                opacity: isDimmed ? 0.35 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {/* Story dots above the line */}
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 3,
                position: "absolute",
                bottom: "calc(50% + 10px)",
              }}>
                {yearStories.map((s, i) => (
                  <div
                    key={s.id}
                    onMouseEnter={e => handleDotEnter(e, s)}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: dotColor(s.tags),
                      border: isActive ? `1.5px solid ${dotColor(s.tags)}` : "1.5px solid transparent",
                      cursor: "pointer",
                      transition: "transform 0.12s",
                      transform: isActive ? "scale(1.3)" : "scale(1)",
                    }}
                  />
                ))}
              </div>

              {/* Year node */}
              <div style={{
                position: "absolute", top: "50%", transform: "translateY(-50%)",
                width: isActive ? 14 : (yearStories.length > 0 ? 10 : 8),
                height: isActive ? 14 : (yearStories.length > 0 ? 10 : 8),
                borderRadius: "50%",
                background: isActive ? "var(--tan-border)" : (yearStories.length > 0 ? "var(--card-bg)" : "var(--border2)"),
                border: isActive
                  ? "2px solid var(--tan-border)"
                  : yearStories.length > 0
                    ? "1.5px solid var(--tan-border)"
                    : "1px solid var(--border2)",
                transition: "all 0.15s",
                zIndex: 2,
              }} />

              {/* Year label */}
              <div style={{
                position: "absolute",
                top: "calc(50% + 12px)",
                fontSize: 10,
                fontVariantNumeric: "tabular-nums",
                color: isActive ? "var(--tan-title)" : "var(--text3)",
                fontWeight: isActive ? 600 : 400,
                whiteSpace: "nowrap",
                transition: "color 0.15s",
              }}>
                {year}
              </div>
            </div>
          );
        })}

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: "absolute",
            left: tooltip.x,
            top: tooltip.y - 4,
            transform: "translate(-50%, -100%)",
            background: "var(--card-bg)",
            border: "0.5px solid var(--border2)",
            borderRadius: 7,
            padding: "5px 10px",
            fontSize: 11,
            color: "var(--text)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}>
            {tooltip.text}
          </div>
        )}
      </div>

      {/* Legend + clear */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginTop: 20, flexWrap: "wrap", gap: 6,
      }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {LEGEND.map(l => (
            <div key={l.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%", background: l.color,
              }} />
              <span style={{ fontSize: 10, color: "var(--text3)" }}>{l.label}</span>
            </div>
          ))}
        </div>
        {activeYear && (
          <button
            onClick={() => onYearSelect(activeYear)}
            style={{
              fontSize: 10, color: "var(--tan-title)", background: "none",
              border: "none", cursor: "pointer", textDecoration: "underline",
              fontFamily: "var(--font)", padding: 0,
            }}
          >
            clear {activeYear}
          </button>
        )}
      </div>

      {!hasAnyYearData && (
        <div style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", paddingBottom: 4 }}>
          Add a year to your stories to see them on the timeline
        </div>
      )}
    </div>
  );
}
