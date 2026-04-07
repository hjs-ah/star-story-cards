import { useState, useEffect } from "react";

const STATUS_STYLE = {
  Released:    { bg: "#E8F5ED", text: "#2E7D4F", border: "#A3D4B4" },
  "In Progress": { bg: "#FDF3DC", text: "#C47B10", border: "#F0D08A" },
  Planned:     { bg: "#F1F0EE", text: "#6B6860", border: "#D0CEC5" },
};

export default function ChangelogModal({ onClose }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    fetch("/api/changelog")
      .then(r => r.json())
      .then(data => { setEntries(data); setLoading(false); })
      .catch(() => { setError("Could not load changelog."); setLoading(false); });
  }, []);

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 600,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(2px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div style={{
        background: "var(--card-bg)",
        border: "1.5px solid var(--border)",
        borderRadius: 20,
        width: "100%", maxWidth: 600, maxHeight: "82vh",
        display: "flex", flexDirection: "column",
        fontFamily: "var(--font)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "1.25rem 1.5rem 1rem",
          borderBottom: "0.5px solid var(--border)",
        }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>
              What's New
            </h2>
            <p style={{ fontSize: 11, color: "var(--text3)", margin: "2px 0 0" }}>
              Impact Narratives — release history
            </p>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "0.5px solid var(--border)", borderRadius: 8,
            padding: "3px 10px", cursor: "pointer", fontSize: 13, color: "var(--text2)",
          }}>✕</button>
        </div>

        {/* Entries */}
        <div style={{ overflowY: "auto", padding: "0.75rem 1.5rem 1.5rem" }}>
          {loading && (
            <p style={{ fontSize: 13, color: "var(--text3)", textAlign: "center", padding: "2rem 0" }}>
              Loading…
            </p>
          )}
          {error && (
            <p style={{ fontSize: 13, color: "#B84A2E", textAlign: "center", padding: "2rem 0" }}>
              {error}
            </p>
          )}
          {!loading && !error && entries.map((entry, i) => {
            const ss = STATUS_STYLE[entry.status] || STATUS_STYLE.Planned;
            const isPlanned = entry.status === "Planned";
            return (
              <div key={i} style={{
                borderTop: i > 0 ? "0.5px solid var(--border)" : "none",
                paddingTop: i > 0 ? "1rem" : "0.5rem",
                marginTop: i > 0 ? "1rem" : 0,
                opacity: isPlanned ? 0.75 : 1,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 13, fontWeight: 600, color: "var(--text)",
                  }}>{entry.version}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                    background: ss.bg, color: ss.text, border: `0.5px solid ${ss.border}`,
                    textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>{entry.status}</span>
                  {entry.date && (
                    <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--font-mono)" }}>
                      {entry.date}
                    </span>
                  )}
                </div>
                <p style={{
                  fontSize: 12, color: "var(--text2)", lineHeight: 1.65, margin: 0,
                }}>{entry.summary}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
