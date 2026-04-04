import { useState } from "react";

const OUTCOME_COLORS = {
  "Revenue Generation":  { bg: "#E8F5ED", text: "#2E7D4F", border: "#A3D4B4" },
  "Market Awareness":    { bg: "#EBF2FB", text: "#185FA5", border: "#93BBE8" },
  "Customer Attraction": { bg: "#F3EEF9", text: "#6B3FA0", border: "#C9AEE8" },
  "Customer Happiness":  { bg: "#FDE8F0", text: "#A0346A", border: "#E8A8C8" },
  "Company Growth":      { bg: "#FDF3DC", text: "#C47B10", border: "#F0D08A" },
  "Employee Happiness":  { bg: "#FFF0EC", text: "#B84A2E", border: "#F5B8A8" },
  "Cost Reduction":      { bg: "#F4F3EF", text: "#5C5B56", border: "#C4C2BC" },
  "Process Efficiency":  { bg: "#E1F5EE", text: "#0F6E56", border: "#5DCAA5" },
};

const CA2R_LABELS = [
  { key: "context",   label: "C",  full: "Context",    color: "#185FA5" },
  { key: "approach1", label: "A¹", full: "Approach¹",  color: "#2E7D4F" },
  { key: "approach2", label: "A²", full: "Approach²",  color: "#C47B10" },
  { key: "result",    label: "R",  full: "Result",     color: "#6B3FA0" },
];

// Shown on the card in CA²R mode — reads from stored/generated data
export function CA2RCardView({ car, condensed }) {
  if (!car) return null;
  if (condensed) {
    return car.context ? (
      <p style={{ fontSize: 12, color: "var(--mono-text)", lineHeight: 1.55, margin: 0 }}>
        {car.context.length > 120 ? car.context.slice(0, 120).trimEnd() + "..." : car.context}
      </p>
    ) : null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {CA2R_LABELS.map(({ key, label, full, color }) => (
        <div key={key} style={{ borderTop: "0.5px solid var(--section-border)", paddingTop: 8, marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
            <span style={{
              fontSize: 10, fontWeight: 700,
              background: "var(--text)", color: "var(--bg)",
              padding: "1px 6px", borderRadius: 4, fontFamily: "var(--font-mono)",
            }}>{label}</span>
            <span style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {full}
            </span>
          </div>
          <p style={{ fontSize: 12, color: "var(--mono-text)", lineHeight: 1.6 }}>
            {car[key] || <span style={{ color: "var(--text3)", fontStyle: "italic" }}>Not generated yet</span>}
          </p>
        </div>
      ))}
      {car.coachNotes && (
        <div style={{
          marginTop: 10, padding: "8px 10px",
          background: "var(--accent-bg)", borderRadius: 8,
          border: "0.5px solid var(--accent-border)",
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Coach notes
          </div>
          <p style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.6 }}>{car.coachNotes}</p>
        </div>
      )}
    </div>
  );
}

// The generate button shown when no CA²R data exists yet
export function CA2RGenerateButton({ story, onGenerated }) {
  const [state, setState] = useState("idle");
  const [err, setErr]     = useState("");

  async function generate() {
    setState("loading");
    setErr("");
    try {
      const res = await fetch("/api/car", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Request failed");
      onGenerated(json);
      setState("done");
    } catch (e) {
      setErr(e.message);
      setState("error");
    }
  }

  if (state === "loading") return (
    <div style={{ fontSize: 11, color: "var(--text3)", fontStyle: "italic", padding: "6px 0" }}>
      Generating CA²R with Haiku...
    </div>
  );

  if (state === "error") return (
    <div style={{ fontSize: 11, color: "#B84A2E" }}>
      {err}
      <button onClick={generate} style={{ marginLeft: 6, fontSize: 11, cursor: "pointer", color: "#B84A2E", background: "none", border: "none", textDecoration: "underline" }}>Retry</button>
    </div>
  );

  return (
    <button onClick={generate} style={{
      width: "100%", fontSize: 11, padding: "7px 12px", borderRadius: 8, cursor: "pointer",
      border: "0.5px solid #0F6E56", background: "#E1F5EE",
      color: "#0F6E56", fontFamily: "var(--font)", fontWeight: 500,
      transition: "all 0.12s",
    }}>
      Generate CA²R
    </button>
  );
}

// Outcome tags row — separate from competency tags
export function OutcomeTags({ outcomes = [] }) {
  if (!outcomes.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
      {outcomes.map(o => {
        const c = OUTCOME_COLORS[o] || { bg: "#F1F0EE", text: "#6B6860", border: "#D0CEC5" };
        return (
          <span key={o} style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 500,
            background: c.bg, color: c.text, border: `0.5px solid ${c.border}`,
          }}>
            {o}
          </span>
        );
      })}
    </div>
  );
}

export { OUTCOME_COLORS };
