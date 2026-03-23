import { useState, useEffect, useCallback } from "react";
import StoryCard from "./StoryCard";
import StoryModal from "./StoryModal";
import FocusOverlay from "./FocusOverlay";
import { fetchStories, createStory, updateStory, patchStory } from "./notionService";

const FILTERS = ["Active", "Draft", "Archived", "All"];
const COL_OPTIONS = [1, 2, 3];

function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [msg]);
  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 400,
      background: "var(--text)", color: "var(--bg)", borderRadius: 10,
      padding: "10px 18px", fontSize: 12, fontFamily: "var(--font)",
      boxShadow: "0 4px 16px rgba(0,0,0,0.18)", fontWeight: 500,
    }}>
      {msg}
    </div>
  );
}

export default function App() {
  const [stories, setStories]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState("Active");
  const [cols, setCols]             = useState(2);
  const [dark, setDark]             = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [editingStory, setEditing]  = useState(null);
  const [modalOpen, setModalOpen]   = useState(false);
  const [focusStory, setFocusStory] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState("");
  const [error, setError]           = useState("");

  // Apply dark class to body
  useEffect(() => {
    document.body.classList.toggle("dark", dark);
  }, [dark]);

  const showToast = (msg) => setToast(msg);

  const loadStories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchStories();
      setStories(data);
    } catch (e) {
      setError(e.message || "Could not load stories. Check your Notion connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStories(); }, [loadStories]);

  const filtered = stories.filter((s) =>
    filter === "All" ? true : (s.status || "Active") === filter
  );

  function openNew()        { setEditing(null); setModalOpen(true); }
  function openEdit(story)  { setEditing(story); setModalOpen(true); }
  function closeModal()     { setModalOpen(false); setEditing(null); }

  async function handleSave(form) {
    setSaving(true);
    try {
      if (editingStory) {
        await updateStory(editingStory.id, form);
        setStories((prev) => prev.map((s) => s.id === editingStory.id ? { ...s, ...form } : s));
        showToast("Story updated in Notion.");
      } else {
        const created = await createStory(form);
        // Use the real ID returned from Notion so archive/restore work correctly
        const newStory = created?.id ? { ...form, id: created.id } : { id: "local-" + Date.now(), ...form };
        setStories((prev) => [newStory, ...prev]);
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
    setStories((prev) => prev.map((s) => s.id === id ? { ...s, status: "Archived" } : s));
    showToast("Story archived.");
    await patchStory(id, { status: "Archived" }).catch(console.error);
  }

  async function handleRestore(id) {
    setStories((prev) => prev.map((s) => s.id === id ? { ...s, status: "Active" } : s));
    showToast("Story restored to Active.");
    await patchStory(id, { status: "Active" }).catch(console.error);
  }

  function handleRatingChange(id, rating) {
    setStories((prev) => prev.map((s) => s.id === id ? { ...s, rating } : s));
  }

  const gridCols = `repeat(${cols}, minmax(0, 1fr))`;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", transition: "background 0.2s" }}>
      {/* Header */}
      <header style={{
        background: "var(--header-bg)", borderBottom: "0.5px solid var(--border)",
        padding: "0 1.5rem", height: 56, display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100,
        transition: "background 0.2s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em" }}>
            Story Cards
          </span>
          <span style={{
            fontSize: 11, color: "var(--text3)", background: "var(--surface2)",
            padding: "2px 8px", borderRadius: 6, fontFamily: "var(--font-mono)",
          }}>
            STAR
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Column toggle buttons */}
          <div style={{ display: "flex", gap: 3, background: "var(--surface2)", borderRadius: 8, padding: 3 }}>
            {COL_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setCols(n)}
                title={`${n} column${n > 1 ? "s" : ""}`}
                style={{
                  width: 28, height: 26, borderRadius: 6, border: "none", cursor: "pointer",
                  background: cols === n ? "var(--surface)" : "transparent",
                  color: cols === n ? "var(--text)" : "var(--text3)",
                  fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600,
                  boxShadow: cols === n ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                  transition: "all 0.12s",
                }}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Dark / light toggle */}
          <button
            onClick={() => setDark((d) => !d)}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              width: 34, height: 34, borderRadius: 8, border: "0.5px solid var(--border)",
              background: "transparent", cursor: "pointer", fontSize: 16, color: "var(--text2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.12s",
            }}
          >
            {dark ? "☀" : "☾"}
          </button>

          {/* New story */}
          <button
            onClick={openNew}
            style={{
              fontSize: 12, padding: "6px 16px", borderRadius: 8, cursor: "pointer",
              background: "var(--text)", color: "var(--bg)", border: "none",
              fontFamily: "var(--font)", fontWeight: 500, letterSpacing: "0.01em",
              transition: "opacity 0.12s",
            }}
          >
            + New story
          </button>
        </div>
      </header>

      <main style={{ maxWidth: cols === 3 ? 1200 : 960, margin: "0 auto", padding: "1.5rem 1.5rem 3rem", transition: "max-width 0.2s" }}>
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                fontSize: 12, padding: "5px 14px", borderRadius: 20, cursor: "pointer",
                border: filter === f ? "0.5px solid var(--accent)" : "0.5px solid var(--border)",
                background: filter === f ? "var(--accent-bg)" : "transparent",
                color: filter === f ? "var(--accent)" : "var(--text2)",
                fontFamily: "var(--font)", fontWeight: filter === f ? 500 : 400,
                transition: "all 0.12s",
              }}
            >
              {f}
              {f !== "All" && (
                <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.7 }}>
                  {stories.filter((s) => (s.status || "Active") === f).length}
                </span>
              )}
            </button>
          ))}
          {!loading && (
            <button
              onClick={loadStories}
              title="Refresh from Notion"
              style={{
                marginLeft: "auto", fontSize: 12, padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                border: "0.5px solid var(--border)", background: "transparent", color: "var(--text3)",
                fontFamily: "var(--font)",
              }}
            >
              ↻ Refresh
            </button>
          )}
        </div>

        {/* States */}
        {loading && (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text3)", fontSize: 13 }}>
            Loading stories from Notion...
          </div>
        )}

        {!loading && error && (
          <div style={{
            textAlign: "center", padding: "3rem 1rem", color: "#B84A2E",
            background: "#FFF0EC", borderRadius: 12, fontSize: 13,
          }}>
            {error}
            <button onClick={loadStories} style={{ display: "block", margin: "10px auto 0", fontSize: 12, cursor: "pointer", color: "#B84A2E", background: "none", border: "none", textDecoration: "underline" }}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text3)" }}>
            <p style={{ fontSize: 14, marginBottom: 8 }}>
              No {filter !== "All" ? filter.toLowerCase() + " " : ""}stories yet.
            </p>
            {filter !== "Archived" && (
              <button onClick={openNew} style={{ fontSize: 12, cursor: "pointer", color: "var(--accent)", background: "none", border: "none", textDecoration: "underline" }}>
                Add your first story
              </button>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 16, transition: "grid-template-columns 0.2s" }}>
            {filtered.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onEdit={openEdit}
                onArchive={handleArchive}
                onRestore={handleRestore}
                onRatingChange={handleRatingChange}
                onFocus={setFocusStory}
              />
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <StoryModal story={editingStory} onSave={handleSave} onClose={closeModal} saving={saving} />
      )}

      {focusStory && (
        <FocusOverlay story={focusStory} onClose={() => setFocusStory(null)} onEdit={openEdit} />
      )}

      {toast && <Toast msg={toast} onDone={() => setToast("")} />}
    </div>
  );
}
