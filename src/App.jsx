import { useState, useCallback, useEffect } from "react";
import StoryCard from "./StoryCard";
import StoryModal from "./StoryModal";
import FocusOverlay from "./FocusOverlay";
import SiteHeader from "./SiteHeader";
import ChangelogModal from "./ChangelogModal";
import CareerTimeline from "./CareerTimeline";
import { listStories, getSchema, createStory, updateStory, patchStory, fetchConfig } from "./notionService";

const STATUS_FILTERS = ["Active", "Draft", "Archived", "All"];
const COLS = [1, 2, 3];

const SORT_OPTIONS = [
  { value: "edited",     label: "Last edited"  },
  { value: "rating_desc",label: "Rating ↓"     },
  { value: "rating_asc", label: "Rating ↑"     },
  { value: "year_desc",  label: "Year ↓"       },
  { value: "year_asc",   label: "Year ↑"       },
  { value: "title_asc",  label: "Title A–Z"    },
];

function sortStories(stories, sort) {
  const s = [...stories];
  switch (sort) {
    case "rating_desc": return s.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case "rating_asc":  return s.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    case "year_desc":   return s.sort((a, b) => (b.year || 0) - (a.year || 0));
    case "year_asc":    return s.sort((a, b) => (a.year || 0) - (b.year || 0));
    case "title_asc":   return s.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    default:            return s; // "edited" — keep Notion order
  }
}

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

// Filter row label — bold
function FilterLabel({ children }) {
  return (
    <span style={{
      fontSize: 11, color: "var(--text2)", marginRight: 4,
      fontWeight: 700, flexShrink: 0, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

export default function App() {
  const [stories,       setStories]       = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [statusFilter,  setStatusFilter]  = useState("Active");
  const [tagFilter,     setTagFilter]     = useState(null);
  const [yearFilter,    setYearFilter]    = useState(null);
  const [filterOutcome, setFilterOutcome] = useState(null);
  const [filterMM,      setFilterMM]      = useState(null);
  const [filterRating,  setFilterRating]  = useState(null); // null | 1..5
  const [sortBy,        setSortBy]        = useState("edited");
  const [cols,          setCols]          = useState(2);
  const [condensed,     setCondensed]     = useState(false);
  const [darkMode,      setDarkMode]      = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [editStory,     setEditStory]     = useState(null);
  const [showModal,     setShowModal]     = useState(false);
  const [focusStory,    setFocusStory]    = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [toast,         setToast]         = useState("");
  const [error,         setError]         = useState("");
  const [kwCache,       setKwCache]       = useState({});
  const [carCache,      setCarCache]      = useState({});
  const [storyMode,     setStoryMode]     = useState("STAR");
  const [siteConfig,    setSiteConfig]    = useState({});
  const [showChangelog, setShowChangelog] = useState(false);

  useEffect(() => { document.body.classList.toggle("dark", darkMode); }, [darkMode]);

  const loadStories = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [storiesData, schemaData, cfg] = await Promise.all([
        listStories(), getSchema(), fetchConfig().catch(() => ({})),
      ]);
      setStories(storiesData);
      setAvailableTags(schemaData.tags || []);
      setSiteConfig(cfg);
    } catch (e) {
      setError(e.message || "Could not load stories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStories(); }, [loadStories]);

  const availableYears  = [...new Set(stories.map(s => s.year).filter(Boolean))].sort((a, b) => b - a);
  const allTags         = [...new Set([...availableTags, ...stories.flatMap(s => s.tags || [])])];
  const allOutcomes     = [...new Set(stories.flatMap(s => s.outcomes || []))];
  const allMentalModels = [...new Set(stories.flatMap(s => s.mental_model || []))];

  const filteredSorted = sortStories(
    stories.filter(story => {
      const matchStatus  = statusFilter === "All" ? true : (story.status || "Active") === statusFilter;
      const matchTag     = tagFilter     ? (story.tags || []).includes(tagFilter) : true;
      const matchYear    = yearFilter    ? story.year === yearFilter : true;
      const matchOutcome = filterOutcome ? (story.outcomes || []).includes(filterOutcome) : true;
      const matchMM      = filterMM      ? (story.mental_model || []).includes(filterMM) : true;
      const matchRating  = filterRating  ? (story.rating || 0) >= filterRating : true;
      return matchStatus && matchTag && matchYear && matchOutcome && matchMM && matchRating;
    }),
    sortBy
  );

  function openNew()   { setEditStory(null); setShowModal(true); }
  function openEdit(s) { setEditStory(s);    setShowModal(true); }
  function closeModal(){ setShowModal(false); setEditStory(null); }

  async function handleSave(formData) {
    setSaving(true);
    try {
      if (editStory) {
        await updateStory(editStory.id, formData);
        setStories(prev => prev.map(s => s.id === editStory.id ? { ...s, ...formData } : s));
        getSchema().then(d => setAvailableTags(d.tags || [])).catch(() => {});
        setToast("Story updated in Notion.");
      } else {
        const res = await createStory(formData);
        const ns  = res?.id ? { ...formData, id: res.id } : { id: "local-" + Date.now(), ...formData };
        setStories(prev => [ns, ...prev]);
        getSchema().then(d => setAvailableTags(d.tags || [])).catch(() => {});
        setToast("Story saved to Notion.");
      }
      closeModal();
    } catch { setToast("Error saving. Please try again."); }
    finally  { setSaving(false); }
  }

  async function handleArchive(id) {
    setStories(prev => prev.map(s => s.id === id ? { ...s, status: "Archived" } : s));
    setToast("Story archived.");
    await patchStory(id, { status: "Archived" }).catch(console.error);
  }
  async function handleRestore(id) {
    setStories(prev => prev.map(s => s.id === id ? { ...s, status: "Active" } : s));
    setToast("Story restored to Active.");
    await patchStory(id, { status: "Active" }).catch(console.error);
  }
  function handleRatingChange(id, rating) {
    setStories(prev => prev.map(s => s.id === id ? { ...s, rating } : s));
  }

  // Filter pill
  const pill = (label, active, onClick, count) => (
    <button key={label} onClick={onClick} style={{
      fontSize: 12, padding: "5px 12px", borderRadius: 20, cursor: "pointer",
      border: active ? "0.5px solid var(--accent)" : "0.5px solid var(--border)",
      background: active ? "var(--accent-bg)" : "transparent",
      color: active ? "var(--accent)" : "var(--text2)",
      fontFamily: "var(--font)", fontWeight: active ? 500 : 400,
      transition: "all 0.12s", whiteSpace: "nowrap",
    }}>
      {label}
      {count !== undefined && <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>{count}</span>}
    </button>
  );

  const hasFilters = tagFilter || yearFilter || filterOutcome || filterMM || filterRating || statusFilter !== "All";
  const filterParts = [];
  if (statusFilter !== "All") filterParts.push(statusFilter.toLowerCase());
  if (tagFilter)     filterParts.push(`"${tagFilter}"`);
  if (yearFilter)    filterParts.push(`${yearFilter}`);
  if (filterOutcome) filterParts.push(filterOutcome);
  if (filterMM)      filterParts.push(filterMM);
  if (filterRating)  filterParts.push(`${filterRating}★+`);

  function clearFilters() {
    setTagFilter(null); setYearFilter(null);
    setFilterOutcome(null); setFilterMM(null); setFilterRating(null);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", transition: "background 0.2s" }}>
      <SiteHeader cfg={siteConfig} />

      {/* App header */}
      <header style={{
        background: "var(--header-bg)", borderBottom: "0.5px solid var(--border)",
        padding: "0 1.5rem", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 17, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em" }}>
              Impact Narratives
            </span>
            <span style={{ fontSize: 10, color: "var(--text3)", background: "var(--surface2)", padding: "2px 7px", borderRadius: 5, fontFamily: "var(--font-mono)" }}>
              STAR
            </span>
          </div>
          <span style={{ fontSize: 10, color: "var(--text3)", letterSpacing: "0.01em" }}>For use by owner</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Column switcher */}
          <div style={{ display: "flex", gap: 3, background: "var(--surface2)", borderRadius: 8, padding: 3 }}>
            {COLS.map(n => (
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

          {/* What's New */}
          <button onClick={() => setShowChangelog(true)} style={{
            fontSize: 11, padding: "0 10px", height: 32, borderRadius: 8,
            border: "0.5px solid var(--border2)", background: "transparent",
            color: "var(--text3)", cursor: "pointer", fontFamily: "var(--font)",
            flexShrink: 0, whiteSpace: "nowrap",
          }}>What's New</button>

          {/* STAR / CA²R toggle */}
          <div style={{ display: "flex", gap: 2, background: "var(--surface2)", borderRadius: 8, padding: 3, flexShrink: 0 }}>
            {[["STAR","STAR"],["CA²R","CA2R"]].map(([label, val]) => (
              <button key={val} onClick={() => setStoryMode(val)} style={{
                padding: "0 10px", height: 26, borderRadius: 6, border: "none", cursor: "pointer",
                background: storyMode === val ? "var(--surface)" : "transparent",
                color: storyMode === val ? "var(--text)" : "var(--text3)",
                fontFamily: "var(--font)", fontSize: 11, fontWeight: storyMode === val ? 500 : 400,
                boxShadow: storyMode === val ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                transition: "all 0.12s", flexShrink: 0,
              }}>{label}</button>
            ))}
          </div>

          {/* Condense */}
          <button onClick={() => setCondensed(v => !v)} style={{
            width: 82, height: 32, borderRadius: 8,
            border: "0.5px solid var(--border)",
            background: condensed ? "var(--surface2)" : "transparent",
            color: condensed ? "var(--text)" : "var(--text3)",
            cursor: "pointer", fontSize: 11, fontFamily: "var(--font)", fontWeight: condensed ? 500 : 400,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.12s, color 0.12s", flexShrink: 0,
          }}>{condensed ? "Full view" : "Condense"}</button>

          {/* Dark mode */}
          <button onClick={() => setDarkMode(v => !v)} style={{
            width: 34, height: 34, borderRadius: 8, border: "0.5px solid var(--border)",
            background: "transparent", cursor: "pointer", fontSize: 16, color: "var(--text2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{darkMode ? "☀" : "☾"}</button>

          <button onClick={openNew} style={{
            fontSize: 12, padding: "6px 16px", borderRadius: 8, cursor: "pointer",
            background: "var(--text)", color: "var(--bg)", border: "none",
            fontFamily: "var(--font)", fontWeight: 500,
          }}>+ New story</button>
        </div>
      </header>

      <main style={{ maxWidth: cols === 3 ? 1200 : 960, margin: "0 auto", padding: "1.25rem 1.5rem 3rem" }}>

        {/* Status filter row */}
        <div style={{ display: "flex", gap: 4, marginBottom: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <FilterLabel>Status</FilterLabel>
          {STATUS_FILTERS.map(s => pill(
            s, statusFilter === s, () => setStatusFilter(s),
            s === "All" ? undefined : stories.filter(st => (st.status || "Active") === s).length
          ))}
          {!loading && (
            <button onClick={loadStories} title="Refresh" style={{
              marginLeft: "auto", fontSize: 12, padding: "5px 10px", borderRadius: 20, cursor: "pointer",
              border: "0.5px solid var(--border)", background: "transparent",
              color: "var(--text3)", fontFamily: "var(--font)",
            }}>↻</button>
          )}
        </div>

        {/* Impact (tags) filter row */}
        {allTags.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginBottom: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <FilterLabel>Impact</FilterLabel>
            {allTags.map(tag => pill(tag, tagFilter === tag, () => setTagFilter(tagFilter === tag ? null : tag)))}
          </div>
        )}

        {/* Outcomes filter row */}
        {allOutcomes.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginBottom: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <FilterLabel>Outcomes</FilterLabel>
            {allOutcomes.map(o => pill(o, filterOutcome === o, () => setFilterOutcome(filterOutcome === o ? null : o)))}
          </div>
        )}

        {/* Mental Model filter row */}
        {allMentalModels.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginBottom: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <FilterLabel>Model</FilterLabel>
            {allMentalModels.map(m => pill(m, filterMM === m, () => setFilterMM(filterMM === m ? null : m)))}
          </div>
        )}

        {/* Year filter row */}
        {availableYears.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginBottom: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <FilterLabel>Year</FilterLabel>
            {availableYears.map(y => pill(String(y), yearFilter === y, () => setYearFilter(yearFilter === y ? null : y)))}
          </div>
        )}

        {/* Rating filter + Sort row */}
        <div style={{ display: "flex", gap: 4, marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
          <FilterLabel>Rating</FilterLabel>
          {[5, 4, 3, 2, 1].map(n => pill(
            "★".repeat(n), filterRating === n,
            () => setFilterRating(filterRating === n ? null : n)
          ))}
          {/* Sort selector — pushed to right */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", whiteSpace: "nowrap" }}>Sort</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                fontSize: 11, padding: "5px 8px", borderRadius: 8, cursor: "pointer",
                border: "0.5px solid var(--border)", background: "var(--surface2)",
                color: "var(--text2)", fontFamily: "var(--font)", outline: "none",
              }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Timeline */}
        <CareerTimeline
          stories={stories}
          activeYear={yearFilter}
          onYearSelect={y => setYearFilter(yearFilter === y ? null : y)}
        />

        {/* Filter status bar */}
        {!loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", minHeight: 22 }}>
            <span style={{ fontSize: 11, color: "var(--text2)" }}>
              {!hasFilters
                ? <span style={{ color: "var(--text3)" }}>No filters selected</span>
                : <>
                    Showing <strong style={{ fontWeight: 500, color: "var(--text)" }}>{filteredSorted.length}</strong>
                    {" "}stor{filteredSorted.length === 1 ? "y" : "ies"}
                    {filterParts.length ? ` — ${filterParts.join(", ")}` : ""}
                  </>
              }
            </span>
            {hasFilters && statusFilter === "Active" && (
              <button onClick={clearFilters} style={{
                fontSize: 11, background: "none", border: "none", color: "var(--tan-title)",
                cursor: "pointer", textDecoration: "underline", fontFamily: "var(--font)", padding: 0,
              }}>clear filters</button>
            )}
          </div>
        )}

        {/* Loading / Error / Empty */}
        {loading && <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text3)", fontSize: 13 }}>Loading stories from Notion...</div>}
        {!loading && error && (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#B84A2E", background: "#FFF0EC", borderRadius: 12, fontSize: 13 }}>
            {error}
            <button onClick={loadStories} style={{ display: "block", margin: "10px auto 0", fontSize: 12, cursor: "pointer", color: "#B84A2E", background: "none", border: "none", textDecoration: "underline" }}>Try again</button>
          </div>
        )}
        {!loading && !error && filteredSorted.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text3)" }}>
            <p style={{ fontSize: 14, marginBottom: 8 }}>No stories match the current filters.</p>
            {statusFilter !== "Archived" && !tagFilter && !yearFilter && (
              <button onClick={openNew} style={{ fontSize: 12, cursor: "pointer", color: "var(--accent)", background: "none", border: "none", textDecoration: "underline" }}>
                Add your first story
              </button>
            )}
          </div>
        )}

        {/* Story grid */}
        {!loading && !error && filteredSorted.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 16 }}>
            {filteredSorted.map(story => (
              <StoryCard
                key={story.id}
                story={story}
                onEdit={openEdit}
                onArchive={handleArchive}
                onRestore={handleRestore}
                onRatingChange={handleRatingChange}
                onFocus={setFocusStory}
                condensed={condensed}
                storyMode={storyMode}
                kwData={kwCache[story.id] || null}
                onKwSave={kw  => setKwCache(prev => ({ ...prev, [story.id]: kw }))}
                onKwReset={id => setKwCache(prev => { const n = { ...prev }; delete n[id]; return n; })}
                carData={carCache[story.id] || null}
                onCarSave={car => setCarCache(prev => ({ ...prev, [story.id]: car }))}
                onCarReset={id => setCarCache(prev => { const n = { ...prev }; delete n[id]; return n; })}
              />
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <StoryModal story={editStory} onSave={handleSave} onClose={closeModal} saving={saving} availableTags={allTags} />
      )}
      {focusStory && (
        <FocusOverlay
          story={focusStory}
          onClose={() => setFocusStory(null)}
          onEdit={openEdit}
          storyMode={storyMode}
          carData={carCache[focusStory?.id] || null}
          onCarSave={car => setCarCache(prev => ({ ...prev, [focusStory.id]: car }))}
        />
      )}
      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
      {toast && <Toast msg={toast} onDone={() => setToast("")} />}
    </div>
  );
}
