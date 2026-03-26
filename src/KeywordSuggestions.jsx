import { useState } from "react";

const SECTIONS = [
  { key: "powerWords", label: "Power words", accent: "#2E7D4F", bg: "#E8F5ED", border: "#A3D4B4", mono: false },
  { key: "metrics",    label: "Key metrics",  accent: "#185FA5", bg: "#EBF2FB", border: "#93BBE8", mono: true  },
  { key: "phrases",    label: "Soundbites",   accent: "#6B3FA0", bg: "#F3EEF9", border: "#C9AEE8", mono: false },
];

export default function KeywordSuggestions({ story }) {
  const [state, setState] = useState("idle");
  const [data,  setData]  = useState(null);
  const [err,   setErr]   = useState("");

  async function generate() {
    setState("loading");
    setErr("");
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Request failed");
      setData(json);
      setState("done");
    } catch (e) {
      setErr(e.message);
      setState("error");
    }
  }

  function copyAll() {
    if (!data) return;
    const lines = [
      `STORY: ${story.title}`,
      "",
      "POWER WORDS:",
      ...(data.powerWords || []).map(w => `  - ${w}`),
      "",
      "KEY METRICS:",
      ...(data.metrics || []).map(m => `  - ${m}`),
      "",
      "SOUNDBITES:",
      ...(data.phrases || []).map(p => `  - ${p}`),
    ].join("\n");
    navigator.clipboard.writeText(lines).catch(() => {});
  }

  if (state === "idle") {
    return (
      <button onClick={generate} style={{
        width: "100%", fontSize: 11, padding: "7px 12px", borderRadius: 8, cursor: "pointer",
        border: "0.5px solid var(--accent-border)", background: "var(--accent-bg)",
        color: "var(--accent)", fontFamily: "var(--font)", fontWeight: 500,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        Suggest keywords
      </button>
    );
  }

  if (state === "loading") {
    return (
      <div style={{ padding: "8px 0", fontSize: 11, color: "var(--text3)", fontStyle: "italic" }}>
        Analyzing with Haiku...
      </div>
    );
  }

  if (state === "error") {
    return (
      <div style={{ fontSize: 11, color: "#B84A2E" }}>
        {err}
        <button onClick={generate} style={{ marginLeft: 8, fontSize: 11, cursor: "pointer", color: "#B84A2E", background: "none", border: "none", textDecoration: "underline" }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {SECTIONS.map(({ key, label, accent, bg, border, mono }) => {
        const items = data?.[key] || [];
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
        <button onClick={() => { setData(null); setState("idle"); }} style={{
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
