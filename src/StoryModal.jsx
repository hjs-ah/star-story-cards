import { useState, useEffect } from "react";
import StarRating from "./StarRating";

const EMPTY = {
  title: "", context: "", situation: "", task: "", action: "", result: "",
  status: "Active", rating: 5, tags: [], year: "",
};

export default function StoryModal({ story, onSave, onClose, saving, availableTags }) {
  const [form, setForm] = useState(EMPTY);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    setForm(story ? { ...EMPTY, ...story, year: story.year || "" } : { ...EMPTY });
    setNewTag("");
  }, [story]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  function toggleTag(tag) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  }

  function addCustomTag() {
    const t = newTag.trim();
    if (!t) return;
    if (!form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
    setNewTag("");
  }

  // All tags = from Notion schema + any on this story not yet in schema
  const allTags = [...new Set([...availableTags, ...form.tags])];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 20 }, (_, i) => currentYear - i);

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        backdropFilter: "blur(2px)",
      }}
    >
      <div style={{
        background: "var(--card-bg)", borderRadius: 18, padding: "1.75rem",
        width: "100%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto",
        border: "1.5px solid var(--accent-border)",
        boxShadow: "0 0 0 3px var(--accent-bg), 0 24px 60px rgba(0,0,0,0.25)",
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: "1.25rem", color: "var(--text)" }}>
          {story ? "Edit story" : "New story"}
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 0 }}>
          <Field label="Story title" required>
            <input style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Turnaround at Comcast" />
          </Field>
          <Field label="Role / context">
            <input style={inputStyle} value={form.context} onChange={e => set("context", e.target.value)} placeholder="e.g. Sales Manager" />
          </Field>
        </div>

        {[
          { key: "situation", label: "S — Situation", placeholder: "What was the context or challenge?" },
          { key: "task",      label: "T — Task",      placeholder: "What were you responsible for?" },
          { key: "action",    label: "A — Action",    placeholder: "What specific steps did you take?" },
          { key: "result",    label: "R — Result",    placeholder: "What was the quantifiable outcome?" },
        ].map(({ key, label, placeholder }) => (
          <Field key={key} label={label}>
            <textarea
              style={{ ...inputStyle, minHeight: 68, resize: "vertical" }}
              value={form[key]} onChange={e => set(key, e.target.value)}
              placeholder={placeholder}
            />
          </Field>
        ))}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 0 }}>
          <Field label="Status">
            <select style={inputStyle} value={form.status} onChange={e => set("status", e.target.value)}>
              <option>Active</option>
              <option>Draft</option>
              <option>Archived</option>
            </select>
          </Field>
          <Field label="Year">
            <select style={inputStyle} value={form.year} onChange={e => set("year", e.target.value ? Number(e.target.value) : "")}>
              <option value="">— year —</option>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
          <Field label="Star rating">
            <div style={{ paddingTop: 8 }}>
              <StarRating value={form.rating} onChange={n => set("rating", n)} size={22} />
            </div>
          </Field>
        </div>

        <Field label="Tags">
          {/* Existing tags from Notion schema */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 2, marginBottom: 8 }}>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  fontSize: 11, padding: "3px 10px", borderRadius: 20, cursor: "pointer",
                  border: form.tags.includes(tag) ? "0.5px solid var(--accent)" : "0.5px solid var(--border2)",
                  background: form.tags.includes(tag) ? "var(--accent-bg)" : "transparent",
                  color: form.tags.includes(tag) ? "var(--accent)" : "var(--text2)",
                  fontFamily: "var(--font)", fontWeight: form.tags.includes(tag) ? 500 : 400,
                  transition: "all 0.1s",
                }}
              >
                {tag}
              </button>
            ))}
          </div>
          {/* Add a new custom tag */}
          <div style={{ display: "flex", gap: 6 }}>
            <input
              style={{ ...inputStyle, flex: 1, fontSize: 12 }}
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
              placeholder="Add a new tag and press Enter..."
            />
            <button
              onClick={addCustomTag}
              style={{
                fontSize: 12, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                border: "0.5px solid var(--border2)", background: "transparent",
                color: "var(--text2)", fontFamily: "var(--font)",
              }}
            >
              Add
            </button>
          </div>
        </Field>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: "1.25rem" }}>
          <button onClick={onClose} style={actionBtn(false)}>Cancel</button>
          <button
            onClick={() => onSave({ ...form, year: form.year ? Number(form.year) : null })}
            disabled={!form.title.trim() || saving}
            style={{ ...actionBtn(true), opacity: (!form.title.trim() || saving) ? 0.4 : 1 }}
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
      <label style={{ fontSize: 11, color: "var(--text2)", display: "block", marginBottom: 5, fontWeight: 500 }}>
        {label}{required && <span style={{ color: "#B84A2E", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", fontSize: 13, padding: "7px 10px",
  border: "0.5px solid var(--border2)", borderRadius: 8,
  background: "var(--surface2)", color: "var(--text)",
  fontFamily: "var(--font)", outline: "none",
};

const actionBtn = primary => ({
  fontSize: 13, padding: "7px 18px", borderRadius: 8, cursor: "pointer",
  border: primary ? "none" : "0.5px solid var(--border2)",
  background: primary ? "var(--text)" : "transparent",
  color: primary ? "var(--bg)" : "var(--text2)",
  fontFamily: "var(--font)", fontWeight: primary ? 500 : 400,
});
