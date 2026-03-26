import { useState, useEffect, useCallback } from "react";
import StoryCard from "./StoryCard";
import StoryModal from "./StoryModal";
import FocusOverlay from "./FocusOverlay";
import { fetchStories, fetchSchema, createStory, updateStory, patchStory } from "./notionService";

const STATUS_FILTERS = ["Active", "Draft", "Archived", "All"];
const COL_OPTIONS = [1, 2, 3];

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, [msg]);
  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 400,
      background: "var(--text)", color: "var(--bg)", borderRadius: 10,
      padding: "10px 18px", fontSize: 12, fontFamily: "var(--font)",
      boxShadow: "0 4px 16px rgba(0,0,0,0.18)", fontWeight: 500,
    }}>{msg}</div>
  );
}

export default function App() {
  const [stories, setStories]         = useState([]);
  const [availableTags, setAvailTags] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatus]     = useState("Active");
  const [activeTag, setActiveTag]     = useState(null);   // tag filter
  const [activeYear, setActiveYear]   = useState(null);   // year filter
  const [cols, setCols]               = useState(2);
  const [condensed, setCondensed]     = useState(false);
  const [dark, setDark]               = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [editingStory, setEditing]    = useState(null);
  const [modalOpen, setModalOpen]     = useState(false);
  const [focusStory, setFocusStory]   = useState(null);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState("");
  const [error, setError]             = useState("");

  useEffect(() => { document.body.classList.toggle("dark", dark); }, [dark]);

  const showToast = msg => setToast(msg);

  const loadAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [data, schema] = await Promise.all([fetchStories(), fetchSchema()]);
      setStories(data);
      setAvailTags(schema.tags || []);
    } catch (e) {
      setError(e.message || "Could not load stories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Derive unique years from loaded stories for the year filter
  const allYears = [...new Set(stories.map(s => s.year).filter(Boolean))].sort((a, b) => b - a);

  // Derive all tags in use (schema + any on stories not yet in schema)
  const allTagsInUse = [...new Set([...availableTags, ...stories.flatMap(s => s.tags || [])])];

  const filtered = stories.filter(s => {
    const matchStatus = statusFilter === "All" ? true : (s.status || "Active") === statusFilter;
    const matchTag    = activeTag  ? (s.tags || []).includes(activeTag) : true;
    const matchYear   = activeYear ? s.year === activeYear : true;
    return matchStatus && matchTag && matchYear;
  });

  function openNew()       { setEditing(null); setModalOpen(true); }
  function openEdit(story) { setEditing(story); setModalOpen(true); }
  function closeModal()    { setModalOpen(false); setEditing(null); }

  async function handleSave(form) {
    setSaving(true);
    try {
      if (editingStory) {
        await updateStory(editingStory.id, form);
        setStories(prev => prev.map(s => s.id === editingStory.id ? { ...s, ...form } : s));
        // refresh tags in case a new one was added
        fetchSchema().then(s => setAvailTags(s.tags || [])).catch(() => {});
        showToast("Story updated in Notion.");
      } else {
        const created = await createStory(form);
        const newStory = created?.id ? { ...form, id: created.id } : { id: "local-" + Date.now(), ...form };
        setStories(prev => [newStory, ...prev]);
        fetchSchema().then(s => setAvailTags(s.tags || [])).catch(() => {});
        showToast("Story saved to Notion.");
      }
      closeModal();
    } catch (e) {
      showToast("Error saving. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(id) {
    setStories(prev => prev.map(s => s.id === id ? { ...s, status: "Archived" } : s));
    showToast("Story archived.");
    await patchStory(id, { status: "Archived" }).catch(console.error);
  }

  async function handleRestore(id) {
    setStories(prev => prev.map(s => s.id === id ? { ...s, status: "Active" } : s));
    showToast("Story restored to Active.");
    await patchStory(id, { status: "Active" }).catch(console.error);
  }

  function handleRatingChange(id, rating) {
    setStories(prev => prev.map(s => s.id === id ? { ...s, rating } : s));
  }

  const pill = (label, active, onClick, count) => (
    <button key={label} onClick={onClick} style={{
      fontSize: 12, padding: "5px 12px", borderRadius: 20, cursor: "pointer",
      border: active ? "0.5px solid var(--accent)" : "0.5px solid var(--border)",
      background: active ? "var(--accent-bg)" : "transparent",
      color: active ? "var(--accent)" : "var(--text2)",
      fontFamily: "var(--font)", fontWeight: active ? 500 : 400,
      transition: "all 0.12s", whiteSpace: "nowrap",
    }}>
      {label}{count !== undefined && <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>{count}</span>}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", transition: "background 0.2s" }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        background: "var(--header-bg)", borderBottom: "0.5px solid var(--border)",
        padding: "0 1.5rem", height: 56, display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em" }}>Story Cards</span>
          <span style={{ fontSize: 11, color: "var(--text3)", background: "var(--surface2)", padding: "2px 8px", borderRadius: 6, fontFamily: "var(--font-mono)" }}>STAR</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Column switcher */}
          <div style={{ display: "flex", gap: 3, background: "var(--surface2)", borderRadius: 8, padding: 3 }}>
            {COL_OPTIONS.map(n => (
              <button key={n} onClick={() => setCols(n)} title={`${n} col${n > 1 ? "s" : ""}`} style={{
                width: 28, height: 26, borderRadius: 6, border: "none", cursor: "pointer",
                background: cols === n ? "var(--surface)" : "transparent",
                color: cols === n ? "var(--text)" : "var(--text3)",
                fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600,
                boxShadow: cols === n ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                transition: "all 0.12s",
              }}>{n}</button>
            ))}
          </div>
          {/* Condensed toggle */}
          <button
            onClick={() => setCondensed(c => !c)}
            title={condensed ? "Full view" : "Condensed view"}
            style={{
              height: 32, padding: "0 10px", borderRadius: 8, border: "0.5px solid var(--border)",
              background: condensed ? "var(--surface2)" : "transparent",
              color: condensed ? "var(--text)" : "var(--text3)",
              cursor: "pointer", fontSize: 11, fontFamily: "var(--font)", fontWeight: condensed ? 500 : 400,
              display: "flex", alignItems: "center", gap: 5, transition: "all 0.12s",
            }}
          >
            <span style={{ fontSize: 13, lineHeight: 1 }}>{condensed ? "=" : "="}</span>
            {condensed ? "Full" : "Condense"}
          </button>
          {/* Dark/light */}
          <button onClick={() => setDark(d => !d)} title={dark ? "Light mode" : "Dark mode"} style={{
            width: 34, height: 34, borderRadius: 8, border: "0.5px solid var(--border)",
            background: "transparent", cursor: "pointer", fontSize: 16, color: "var(--text2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{dark ? "☀" : "☾"}</button>
          {/* New story */}
          <button onClick={openNew} style={{
            fontSize: 12, padding: "6px 16px", borderRadius: 8, cursor: "pointer",
            background: "var(--text)", color: "var(--bg)", border: "none",
            fontFamily: "var(--font)", fontWeight: 500,
          }}>+ New story</button>
        </div>
      </header>

      <main style={{ maxWidth: cols === 3 ? 1200 : 960, margin: "0 auto", padding: "1.25rem 1.5rem 3rem" }}>

        {/* ── Filter row 1: Status ──────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 4, marginBottom: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          {STATUS_FILTERS.map(f =>
            pill(f, statusFilter === f, () => setStatus(f),
              f !== "All" ? stories.filter(s => (s.status || "Active") === f).length : undefined)
          )}
          {!loading && (
            <button onClick={loadAll} title="Refresh" style={{
              marginLeft: "auto", fontSize: 12, padding: "5px 10px", borderRadius: 20, cursor: "pointer",
              border: "0.5px solid var(--border)", background: "transparent", color: "var(--text3)", fontFamily: "var(--font)",
            }}>↻</button>
          )}
        </div>

        {/* ── Filter row 2: Tags ────────────────────────────────────────────── */}
        {allTagsInUse.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginBottom: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--text3)", marginRight: 2, fontWeight: 500 }}>Tags</span>
            {allTagsInUse.map(tag =>
              pill(tag, activeTag === tag, () => setActiveTag(activeTag === tag ? null : tag))
            )}
            {activeTag && (
              <button onClick={() => setActiveTag(null)} style={{
                fontSize: 11, padding: "3px 8px", borderRadius: 20, cursor: "pointer",
                border: "0.5px solid var(--border)", background: "transparent", color: "var(--text3)", fontFamily: "var(--font)",
              }}>✕ clear</button>
            )}
          </div>
        )}

        {/* ── Filter row 3: Years ───────────────────────────────────────────── */}
        {allYears.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--text3)", marginRight: 2, fontWeight: 500 }}>Year</span>
            {allYears.map(y =>
              pill(String(y), activeYear === y, () => setActiveYear(activeYear === y ? null : y))
            )}
            {activeYear && (
              <button onClick={() => setActiveYear(null)} style={{
                fontSize: 11, padding: "3px 8px", borderRadius: 20, cursor: "pointer",
                border: "0.5px solid var(--border)", background: "transparent", color: "var(--text3)", fontFamily: "var(--font)",
              }}>✕ clear</button>
            )}
          </div>
        )}

        {/* ── Active filter summary ─────────────────────────────────────────── */}
        {(activeTag || activeYear) && (
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: "1rem" }}>
            Showing {filtered.length} stor{filtered.length === 1 ? "y" : "ies"}
            {activeTag  ? ` tagged "${activeTag}"` : ""}
            {activeYear ? ` from ${activeYear}` : ""}
            {" — "}
            <button onClick={() => { setActiveTag(null); setActiveYear(null); }} style={{ fontSize: 11, background: "none", border: "none", color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}>
              clear all filters
            </button>
          </div>
        )}

        {/* ── Content ───────────────────────────────────────────────────────── */}
        {loading && <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text3)", fontSize: 13 }}>Loading stories from Notion...</div>}

        {!loading && error && (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#B84A2E", background: "#FFF0EC", borderRadius: 12, fontSize: 13 }}>
            {error}
            <button onClick={loadAll} style={{ display: "block", margin: "10px auto 0", fontSize: 12, cursor: "pointer", color: "#B84A2E", background: "none", border: "none", textDecoration: "underline" }}>Try again</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text3)" }}>
            <p style={{ fontSize: 14, marginBottom: 8 }}>No stories match the current filters.</p>
            {statusFilter !== "Archived" && !activeTag && !activeYear && (
              <button onClick={openNew} style={{ fontSize: 12, cursor: "pointer", color: "var(--accent)", background: "none", border: "none", textDecoration: "underline" }}>Add your first story</button>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 16 }}>
            {filtered.map(story => (
              <StoryCard key={story.id} story={story}
                onEdit={openEdit} onArchive={handleArchive}
                onRestore={handleRestore} onRatingChange={handleRatingChange}
                onFocus={setFocusStory} condensed={condensed}
              />
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <StoryModal story={editingStory} onSave={handleSave} onClose={closeModal}
          saving={saving} availableTags={allTagsInUse} />
      )}
      {focusStory && <FocusOverlay story={focusStory} onClose={() => setFocusStory(null)} onEdit={openEdit} />}
      {toast && <Toast msg={toast} onDone={() => setToast("")} />}
    </div>
  );
}
