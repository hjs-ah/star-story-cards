import { useRef, useState } from "react";

const START_YEAR = 2017;
const END_YEAR   = 2026;
const ALL_YEARS  = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);

const EMPLOYERS = [
  { key: "CB",  label: "Comcast Business", from: 2017, to: 2021, color: "#185FA5", bg: "#EBF2FB", border: "#93BBE8" },
  { key: "AWS", label: "Amazon Web Services", from: 2022, to: 2026, color: "#C47B10", bg: "#FDF3DC", border: "#F0D08A" },
];

const TAG_CATEGORY = {
  Sales:            "pro",
  Leadership:       "pro",
  Communication:    "pro",
  "Problem Solving":"strategy",
  Technical:        "strategy",
  Ministry:         "ministry",
  "L&D":            "ministry",
  Collaboration:    "ministry",
};

const CATEGORY_COLORS = {
  pro:      "#185FA5",
  ministry: "#2E7D4F",
  strategy: "#C47B10",
  academic: "#6B3FA0",
};

const LEGEND = [
  { key: "pro",      label: "Pro / Leadership",      color: "#185FA5" },
  { key: "ministry", label: "Ministry / L&D",        color: "#2E7D4F" },
  { key: "strategy", label: "Strategy / Enablement", color: "#C47B10" },
  { key: "academic", label: "Academic / Research",   color: "#6B3FA0" },
];

function dotColor(tags) {
  for (const tag of tags || []) {
    const cat = TAG_CATEGORY[tag];
    if (cat) return CATEGORY_COLORS[cat];
  }
  return "#A09E98";
}

function pct(year) {
  return ((year - START_YEAR) / (END_YEAR - START_YEAR)) * 100;
}

function shortYear(y) {
  return "'" + String(y).slice(2);
}

export default function CareerTimeline({
  stories,
  activeYear,
  onYearSelect,
  activeEmployer,
  onEmployerSelect,
}) {
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const byYear = {};
  stories.forEach(s => {
    if (!s.year || s.year < START_YEAR || s.year > END_YEAR) return;
    if (!byYear[s.year]) byYear[s.year] = [];
    byYear[s.year].push(s);
  });

  const hasData = Object.keys(byYear).length > 0;

  function handleDotEnter(e, story) {
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    const tRect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      x: tRect.left - cRect.left + tRect.width / 2,
      y: tRect.top  - cRect.top,
      text: story.title,
    });
  }

  return (
    <div style={{
      background: "var(--card-bg)", border: "0.5px solid var(--border)",
      borderRadius: 14, padding: "1rem 1.25rem 0.75rem",
      marginBottom: "1rem", fontFamily: "var(--font)",
    }}>
      {/* ── Year track ── */}
      <div
        ref={containerRef}
        style={{ position: "relative", height: 72, margin: "0 16px", userSelect: "none" }}
      >
        {/* Single base line */}
        <div style={{
          position: "absolute", top: "50%", left: 0, right: 0,
          height: 1, background: "var(--border2)", transform: "translateY(-50%)",
        }} />

        {/* Active year highlight */}
        {activeYear && (
          <div style={{
            position: "absolute", top: "50%", height: 3,
            left: `${pct(activeYear)}%`, width: 0,
            transform: "translateY(-50%)",
            background: "var(--tan-border)", borderRadius: 2,
          }} />
        )}

        {/* Year nodes */}
        {ALL_YEARS.map(year => {
          const dots   = byYear[year] || [];
          const active = activeYear === year;
          const dimmed = activeYear && !active;

          return (
            <div
              key={year}
              onClick={() => onYearSelect(year)}
              style={{
                position: "absolute", left: `${pct(year)}%`,
                transform: "translateX(-50%)",
                top: 0, height: "100%",
                display: "flex", flexDirection: "column", alignItems: "center",
                cursor: "pointer",
                opacity: dimmed ? 0.35 : 1, transition: "opacity 0.15s",
                zIndex: 3,
              }}
            >
              {/* Story dots above the line */}
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                position: "absolute", bottom: "calc(50% + 10px)",
              }}>
                {dots.map(story => (
                  <div
                    key={story.id}
                    onMouseEnter={e => handleDotEnter(e, story)}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: dotColor(story.tags),
                      border: active
                        ? `1.5px solid ${dotColor(story.tags)}`
                        : "1.5px solid transparent",
                      cursor: "pointer",
                      transition: "transform 0.12s",
                      transform: active ? "scale(1.3)" : "scale(1)",
                    }}
                  />
                ))}
              </div>

              {/* Center node */}
              <div style={{
                position: "absolute", top: "50%", transform: "translateY(-50%)",
                width:  active ? 14 : dots.length > 0 ? 10 : 8,
                height: active ? 14 : dots.length > 0 ? 10 : 8,
                borderRadius: "50%",
                background: active
                  ? "var(--tan-border)"
                  : dots.length > 0 ? "var(--card-bg)" : "var(--border2)",
                border: active
                  ? "2px solid var(--tan-border)"
                  : dots.length > 0 ? "1.5px solid var(--tan-border)" : "1px solid var(--border2)",
                transition: "all 0.15s", zIndex: 2,
              }} />

              {/* Short year label */}
              <div style={{
                position: "absolute", top: "calc(50% + 12px)",
                fontSize: 10, fontVariantNumeric: "tabular-nums",
                color: active ? "var(--tan-title)" : "var(--text3)",
                fontWeight: active ? 600 : 400,
                whiteSpace: "nowrap", transition: "color 0.15s",
              }}>
                {shortYear(year)}
              </div>
            </div>
          );
        })}

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: "absolute", left: tooltip.x, top: tooltip.y - 4,
            transform: "translate(-50%, -100%)",
            background: "var(--card-bg)", border: "0.5px solid var(--border2)",
            borderRadius: 7, padding: "5px 10px", fontSize: 11,
            color: "var(--text)", whiteSpace: "nowrap",
            pointerEvents: "none", zIndex: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}>{tooltip.text}</div>
        )}
      </div>

      {/* ── Employer badge row ── */}
      <div style={{
        display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap",
      }}>
        {EMPLOYERS.map(emp => {
          const isActive = activeEmployer === emp.key;
          return (
            <button
              key={emp.key}
              onClick={() => onEmployerSelect && onEmployerSelect(isActive ? null : emp.key)}
              style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 20,
                cursor: "pointer", fontFamily: "var(--font)",
                fontWeight: isActive ? 600 : 400,
                border: `0.5px solid ${isActive ? emp.color : emp.border}`,
                background: isActive ? emp.bg : "transparent",
                color: isActive ? emp.color : "var(--text3)",
                transition: "all 0.15s",
              }}
            >
              {emp.label}
            </button>
          );
        })}
      </div>

      {/* ── Legend + clear ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginTop: 10, flexWrap: "wrap", gap: 6,
      }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {LEGEND.map(item => (
            <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: item.color }} />
              <span style={{ fontSize: 10, color: "var(--text3)" }}>{item.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {activeYear && (
            <button onClick={() => onYearSelect(activeYear)} style={{
              fontSize: 10, color: "var(--tan-title)", background: "none",
              border: "none", cursor: "pointer", textDecoration: "underline",
              fontFamily: "var(--font)", padding: 0,
            }}>clear {shortYear(activeYear)}</button>
          )}
          {activeEmployer && (
            <button onClick={() => onEmployerSelect(null)} style={{
              fontSize: 10, color: "var(--tan-title)", background: "none",
              border: "none", cursor: "pointer", textDecoration: "underline",
              fontFamily: "var(--font)", padding: 0,
            }}>clear {EMPLOYERS.find(e => e.key === activeEmployer)?.label}</button>
          )}
        </div>
      </div>

      {!hasData && (
        <div style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", paddingBottom: 4, marginTop: 8 }}>
          Add a year to your stories to see them on the timeline
        </div>
      )}
    </div>
  );
}
