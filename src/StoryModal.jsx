import { useState, useEffect } from "react";
import StarRating from "./StarRating";

const ALL_TAGS = ["Leadership", "Communication", "Problem Solving", "Collaboration", "Sales", "L&D", "Ministry", "Technical"];

const EMPTY = {
  title: "", context: "", situation: "", task: "", action: "", result: "",
  status: "Active", rating: 5, tags: [],
};

export default function StoryModal({ story, onSave, onClose, saving }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    setForm(story ? { ...EMPTY, ...story } : { ...EMPTY });
  }, [story]);

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  function toggleTag(tag) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
    >
      <div style={{
        background: "#FFFFFF", borderRadius: 16, padding: "1.75rem",
        width: "100%", maxWidth: 620, maxHeight: "90vh", overflowY: "auto",
        border: "0.5px solid #D0CEC5", boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: "1.25rem", color: "#1A1916" }}>
          {story ? "Edit story" : "New story"}
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <Field label="Story title" required>
            <input style={inputStyle} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Turnaround at Comcast" />
          </Field>
          <Field label="Role / context">
            <input style={inputStyle} value={form.context} onChange={(e) => set("context", e.target.value)} placeholder="e.g. Sales Manager, 2020" />
          </Field>
        </div>

        {[
          { key: "situation", label: "S — Situation", placeholder: "What was the context or challenge?" },
          { key: "task", label: "T — Task", placeholder: "What were you responsible for?" },
          { key: "action", label: "A — Action", placeholder: "What specific steps did you take?" },
          { key: "result", label: "R — Result", placeholder: "What was the quantifiable outcome?" },
        ].map(({ key, label, placeholder }) => (
          <Field key={key} label={label}>
            <textarea
              style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
              placeholder={placeholder}
            />
          </Field>
        ))}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <Field label="Status">
            <select style={inputStyle} value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option>Active</option>
              <option>Draft</option>
              <option>Archived</option>
            </select>
          </Field>
          <Field label="Star rating">
            <div style={{ paddingTop: 6 }}>
              <StarRating value={form.rating} onChange={(n) => set("rating", n)} size={22} />
            </div>
          </Field>
        </div>

        <Field label="Tags">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 2 }}>
            {ALL_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  fontSize: 11, padding: "3px 10px", borderRadius: 20, cursor: "pointer",
                  border: form.tags.includes(tag) ? "0.5px solid #2A5F9E" : "0.5px solid #D0CEC5",
                  background: form.tags.includes(tag) ? "#EBF2FB" : "transparent",
                  color: form.tags.includes(tag) ? "#185FA5" : "#6B6860",
                  fontFamily: "var(--font)", fontWeight: form.tags.includes(tag) ? 500 : 400,
                  transition: "all 0.1s",
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </Field>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: "1.25rem" }}>
          <button onClick={onClose} style={{ ...actionBtn, color: "#6B6860" }}>Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.title.trim() || saving}
            style={{ ...actionBtn, background: "#1A1916", color: "#FAFAF8", border: "none", opacity: (!form.title.trim() || saving) ? 0.4 : 1 }}
          >
            {saving ? "Saving..." : "Save to Notion"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, color: "#6B6860", display: "block", marginBottom: 5, fontWeight: 500 }}>
        {label}{required && <span style={{ color: "#B84A2E", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", fontSize: 13, padding: "7px 10px",
  border: "0.5px solid #D0CEC5", borderRadius: 8,
  background: "#FAFAF8", color: "#1A1916",
  fontFamily: "var(--font)", outline: "none",
};

const actionBtn = {
  fontSize: 13, padding: "7px 18px", borderRadius: 8, cursor: "pointer",
  border: "0.5px solid #D0CEC5", background: "transparent", fontFamily: "var(--font)", fontWeight: 500,
};
