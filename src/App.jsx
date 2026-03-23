import { useState, useEffect, useCallback } from "react";
import StoryCard from "./StoryCard";
import StoryModal from "./StoryModal";
import { fetchStories, createStory, updateStory, patchStory } from "./notionService";

const FILTERS = ["Active", "Draft", "Archived", "All"];

function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [msg]);
  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 300,
      background: "#1A1916", color: "#FAFAF8", borderRadius: 10,
      padding: "10px 18px", fontSize: 12, fontFamily: "var(--font)",
      boxShadow: "0 4px 16px rgba(0,0,0,0.18)", fontWeight: 500,
    }}>
      {msg}
    </div>
  );
}

export default function App() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Active");
  const [editingStory, setEditingStory] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

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

  const filtered = stories.filter((s) => {
    if (filter === "All") return true;
    return (s.status || "Active") === filter;
  });

  function openNew() { setEditingStory(null); setModalOpen(true); }
  function openEdit(story) { setEditingStory(story); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditingStory(null); }

  async function handleSave(form) {
    setSaving(true);
    try {
      if (editingStory) {
        await updateStory(editingStory.id, form);
        setStories((prev) => prev.map((s) => s.id === editingStory.id ? { ...s, ...form } : s));
        showToast("Story updated in Notion.");
      } else {
        await createStory(form);
        setStories((prev) => [{ id: "local-" + Date.now(), ...form }, ...prev]);
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
    await patchStory(id, { Status: "Archived" }).catch(console.error);
  }

  async function handleRestore(id) {
    setStories((prev) => prev.map((s) => s.id === id ? { ...s, status: "Active" } : s));
    showToast("Story restored to Active.");
    await patchStory(id, { Status: "Active" }).catch(console.error);
  }

  function handleRatingChange(id, rating) {
    setStories((prev) => prev.map((s) => s.id === id ? { ...s, rating } : s));
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8" }}>
      {/* Header */}
      <header style={{
        background: "#FFFFFF", borderBottom: "0.5px solid #E5E3DC",
        padding: "0 2rem", height: 56, display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: "#1A1916", letterSpacing: "-0.02em" }}>
            Story Cards
          </span>
          <span style={{ fontSize: 11, color: "#A09E98", background: "#F4F3EF", padding: "2px 8px", borderRadius: 6, fontFamily: "var(--font-mono)" }}>
            STAR
          </span>
        </div>
        <button
          onClick={openNew}
          style={{
            fontSize: 12, padding: "6px 16px", borderRadius: 8, cursor: "pointer",
            background: "#1A1916", color: "#FAFAF8", border: "none",
            fontFamily: "var(--font)", fontWeight: 500, letterSpacing: "0.01em",
          }}
        >
          + New story
        </button>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem 1.5rem 3rem" }}>
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                fontSize: 12, padding: "5px 14px", borderRadius: 20, cursor: "pointer",
                border: filter === f ? "0.5px solid #2A5F9E" : "0.5px solid #E5E3DC",
                background: filter === f ? "#EBF2FB" : "transparent",
                color: filter === f ? "#185FA5" : "#6B6860",
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
                border: "0.5px solid #E5E3DC", background: "transparent", color: "#A09E98",
                fontFamily: "var(--font)",
              }}
            >
              ↻ Refresh
            </button>
          )}
        </div>

        {/* Content */}
        {loading && (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#A09E98", fontSize: 13 }}>
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
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#A09E98" }}>
            <p style={{ fontSize: 14, marginBottom: 8 }}>
              No {filter !== "All" ? filter.toLowerCase() + " " : ""}stories yet.
            </p>
            {filter !== "Archived" && (
              <button onClick={openNew} style={{ fontSize: 12, cursor: "pointer", color: "#2A5F9E", background: "none", border: "none", textDecoration: "underline" }}>
                Add your first story
              </button>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 16,
          }}>
            {filtered.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onEdit={openEdit}
                onArchive={handleArchive}
                onRestore={handleRestore}
                onRatingChange={handleRatingChange}
              />
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <StoryModal
          story={editingStory}
          onSave={handleSave}
          onClose={closeModal}
          saving={saving}
        />
      )}

      {toast && <Toast msg={toast} onDone={() => setToast("")} />}
    </div>
  );
}
