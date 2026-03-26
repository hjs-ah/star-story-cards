import { useState } from "react";

const SECTIONS = [
  { key: "powerWords", label: "Power words", accent: "#2E7D4F", bg: "#E8F5ED", border: "#A3D4B4", mono: false },
  { key: "metrics",    label: "Key metrics",  accent: "#185FA5", bg: "#EBF2FB", border: "#93BBE8", mono: true  },
  { key: "phrases",    label: "Soundbites",   accent: "#6B3FA0", bg: "#F3EEF9", border: "#C9AEE8", mono: false },
];

export default function KeywordSuggestions({ story, kwData, onSave, onReset, condensed }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");

  async function generate() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Request failed");
      onSave(json);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  function copyAll() {
    if (!kwData) return;
    const lines = [
      `STORY: ${story.title}`,
      "",
      "POWER WORDS:",
      ...(kwData.powerWords || []).map(w => `  - ${w}`),
      "",
      "KEY METRICS:",
      ...(kwData.metrics || []).map(m => `  - ${m}`),
      "",
      "SOUNDBITES:",
      ...(kwData.phrases || []).map(p => `  - ${p}`),
    ].join("\n");
    navigator.clipboard.writeText(lines).catch(() => {});
  }

  // ── No results yet ─────────────────────────────────────────────────────────
  if (!kwData) {
    if (loading) {
      return (
        <div style={{ padding: "6px 0", fontSize: 11, color: "var(--text3)", fontStyle: "italic" }}>
          Analyzing with Haiku...
        </div>
      );
    }
    return (
      <div>
        <button onClick={generate} style={{
          width: "100%", fontSize: 11, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
          border: "0.5px solid var(--border2)", background: "transparent",
          color: "var(--text2)", fontFamily: "var(--font)", fontWeight: 400,
          transition: "all 0.12s",
        }}>
          Suggest keywords
        </button>
        {err && (
          <div style={{ fontSize: 11, color: "#B84A2E", marginTop: 5 }}>
            {err}
            <button onClick={generate} style={{ marginLeft: 6, fontSize: 11, cursor: "pointer", color: "#B84A2E", background: "none", border: "none", textDecoration: "underline" }}>
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── CONDENSED: show only the first soundbite ───────────────────────────────
  if (condensed) {
    const firstPhrase = kwData.phrases?.[0];
    if (!firstPhrase) return null;
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#6B3FA0", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
          Soundbite
        </div>
        <span style={{
          fontSize: 11, padding: "3px 9px", borderRadius: 20,
          background: "#F3EEF9", color: "#6B3FA0", border: "0.5px solid #C9AEE8",
          lineHeight: 1.5, display: "inline-block",
        }}>
          {firstPhrase}
        </span>
      </div>
    );
  }

  // ── FULL: all sections ─────────────────────────────────────────────────────
  return (
    <div>
      {SECTIONS.map(({ key, label, accent, bg, border, mono }) => {
        const items = kwData[key] || [];
        if (!items.length) return null;
        return (
          <div key={key} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: accent, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>
              {label}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {items.map((item, i) => (
                <span key={i} style={{
                  fontSize: 11, padding: "3px 9px", borderRadius: 20,
                  background: bg, color: accent, border: `0.5px solid ${border}`,
                  fontWeight: mono ? 600 : 400,
                  fontFamily: mono ? "var(--font-mono)" : "var(--font)",
                  lineHeight: 1.5,
                }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <button onClick={copyAll} style={{
          flex: 1, fontSize: 11, padding: "5px 8px", borderRadius: 8, cursor: "pointer",
          border: "0.5px solid var(--border)", background: "transparent",
          color: "var(--text2)", fontFamily: "var(--font)",
        }}>
          Copy notes
        </button>
        <button onClick={() => onReset(story.id)} style={{
          fontSize: 11, padding: "5px 8px", borderRadius: 8, cursor: "pointer",
          border: "0.5px solid var(--border)", background: "transparent",
          color: "var(--text3)", fontFamily: "var(--font)",
        }}>
          Reset
        </button>
      </div>
    </div>
  );
}
