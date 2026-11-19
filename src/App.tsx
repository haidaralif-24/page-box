import { useCallback, useEffect, useState } from "react";
import {
  addPage,
  addTag,
  createCollection,
  deleteCollection,
  deletePage,
  getPageHtml,
  isTauri,
  listCollections,
  listPages,
  listTagsForPage,
  movePage,
  removeTag,
  renameCollection,
  replacePage,
  searchPages,
  type Collection,
  type PageMeta,
  type Tag,
} from "./lib/backend";
import { PageCard } from "./components/PageCard";
import { PasteDialog } from "./components/PasteDialog";
import { ReplaceDialog } from "./components/ReplaceDialog";
import { PreviewFrame } from "./components/PreviewFrame";
import { VersionHistory } from "./components/VersionHistory";
import "./App.css";

type View = { name: "gallery" } | { name: "page"; page: PageMeta; html: string };

function App() {
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [view, setView] = useState<View>({ name: "gallery" });
  const [showPaste, setShowPaste] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [pagesData, collectionsData] = await Promise.all([
        searchQuery ? searchPages(searchQuery) : listPages(selectedCollectionId),
        listCollections(),
      ]);
      setPages(pagesData);
      setCollections(collectionsData);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [selectedCollectionId, searchQuery]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function loadTags(pageId: string) {
    try {
      const pageTags = await listTagsForPage(pageId);
      setTags(pageTags);
    } catch (e) {
      console.error("Failed to load tags:", e);
    }
  }

  async function handleSave(rawText: string) {
    const meta = await addPage(rawText, selectedCollectionId);
    setShowPaste(false);
    await refresh();
    await openPage(meta);
  }

  async function handleReplace(rawText: string) {
    if (view.name !== "page") return;
    const meta = await replacePage(view.page.id, rawText);
    setShowReplace(false);
    await openPage(meta); // Re-open to get fresh HTML
  }

  async function openPage(page: PageMeta) {
    try {
      const html = await getPageHtml(page.id);
      setView({ name: "page", page, html });
      await loadTags(page.id);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleDelete(page: PageMeta) {
    if (!window.confirm(`Delete "${page.title}"? This can't be undone.`)) return;
    try {
      await deletePage(page.id);
      setView({ name: "gallery" });
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleCopyForAI() {
    if (view.name !== "page") return;
    try {
      const html = await getPageHtml(view.page.id);
      await navigator.clipboard.writeText(html);
      alert("HTML copied to clipboard!");
    } catch (e) {
      setError("Failed to copy: " + String(e));
    }
  }

  async function handleAddTag() {
    if (view.name !== "page" || !newTagInput.trim()) return;
    try {
      await addTag(view.page.id, newTagInput.trim());
      setNewTagInput("");
      await loadTags(view.page.id);
    } catch (e) {
      setError("Failed to add tag: " + String(e));
    }
  }

  async function handleRemoveTag(tagName: string) {
    if (view.name !== "page") return;
    try {
      await removeTag(view.page.id, tagName);
      await loadTags(view.page.id);
    } catch (e) {
      setError("Failed to remove tag: " + String(e));
    }
  }

  async function handleCreateCollection() {
    const name = prompt("Collection name:");
    if (!name) return;
    try {
      await createCollection(name, selectedCollectionId);
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleRenameCollection(collection: Collection) {
    const name = prompt("New collection name:", collection.name);
    if (!name || name === collection.name) return;
    try {
      await renameCollection(collection.id, name);
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleDeleteCollection(collection: Collection) {
    if (!window.confirm(`Delete "${collection.name}"? Pages inside will be moved to Unsorted.`)) return;
    try {
      await deleteCollection(collection.id);
      if (selectedCollectionId === collection.id) {
        setSelectedCollectionId(null);
      }
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleMovePage(page: PageMeta, newCollectionId: number | null) {
    try {
      await movePage(page.id, newCollectionId);
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  }

  const selectedCollection = collections.find((c) => c.id === selectedCollectionId);
  const viewTitle = selectedCollection ? selectedCollection.name : searchQuery ? `Search: "${searchQuery}"` : "All Pages";

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <button className="brand" onClick={() => { setSelectedCollectionId(null); setSearchQuery(""); setView({ name: "gallery" }); }}>
            <img src="/pagebox.svg" alt="" width="20" height="20" />
            <span>Pagebox</span>
          </button>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${selectedCollectionId === null && !searchQuery ? "active" : ""}`}
            onClick={() => { setSelectedCollectionId(null); setSearchQuery(""); }}
          >
            📁 Unsorted
          </button>
          {collections.map((c) => (
            <div key={c.id} className="nav-item-wrapper">
              <button
                className={`nav-item ${selectedCollectionId === c.id && !searchQuery ? "active" : ""}`}
                onClick={() => { setSelectedCollectionId(c.id); setSearchQuery(""); }}
              >
                📂 {c.name}
              </button>
              <div className="nav-actions">
                <button title="Rename" onClick={() => handleRenameCollection(c)}>✏️</button>
                <button title="Delete" onClick={() => handleDeleteCollection(c)}>🗑️</button>
              </div>
            </div>
          ))}
          <button className="nav-item add-collection" onClick={handleCreateCollection}>
            + New Collection
          </button>
        </nav>
      </aside>

      <div className="main-content">
        <header className="app-header">
          <h1 className="page-title">{viewTitle}</h1>
          <div className="header-actions">
            <input
              type="text"
              className="search-input"
              placeholder="Search by title or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {!isTauri() && (
              <span
                className="badge"
                title="Running outside Tauri: pages are stored in this browser's localStorage, not on disk."
              >
                Browser preview
              </span>
            )}
            <button className="btn primary" onClick={() => setShowPaste(true)}>
              + Add page
            </button>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        {view.name === "gallery" ? (
          <main className="gallery">
            {loading ? (
              <p className="muted">Loading…</p>
            ) : pages.length === 0 ? (
              <div className="empty-state">
                <img src="/pagebox.svg" alt="" width="56" height="56" />
                <h2>{searchQuery ? "No matching pages found" : "No pages here yet"}</h2>
                <p>
                  {searchQuery 
                    ? "Try a different search term." 
                    : "Paste the HTML your AI tool gave you and it will show up here — rendered safely, saved locally."}
                </p>
                {!searchQuery && (
                  <button className="btn primary" onClick={() => setShowPaste(true)}>
                    + Add your first page
                  </button>
                )}
              </div>
            ) : (
              <div className="page-grid">
                {pages.map((page) => (
                  <PageCard
                    key={page.id}
                    page={page}
                    onOpen={openPage}
                    onMove={handleMovePage}
                    collections={collections}
                  />
                ))}
              </div>
            )}
          </main>
        ) : (
          <main className="page-view">
            <div className="page-toolbar">
              <button className="btn" onClick={() => setView({ name: "gallery" })}>
                ← Back to {selectedCollection ? selectedCollection.name : "All Pages"}
              </button>
              <h2 className="page-title-small">{view.page.title}</h2>
              <div className="page-toolbar-actions">
                <button className="btn" onClick={() => setShowReplace(true)} title="Replace with new version">
                  🔄 Replace
                </button>
                <button className="btn" onClick={() => setShowHistory(true)} title="View version history">
                  🕒 History
                </button>
                <button className="btn" onClick={handleCopyForAI} title="Copy raw HTML to clipboard">
                  📋 Copy for AI
                </button>
                <button className="btn danger" onClick={() => void handleDelete(view.page)}>
                  🗑️ Delete
                </button>
              </div>
            </div>
            
            <div className="page-tags-section">
              <span className="tags-label">Tags:</span>
              {tags.map((tag) => (
                <span key={tag.id} className="tag">
                  {tag.name}
                  <button className="tag-remove" onClick={() => handleRemoveTag(tag.name)} title="Remove tag">
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="tag-input"
                placeholder="+ add tag"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleAddTag();
                  }
                }}
              />
            </div>

            <PreviewFrame html={view.html} title={view.page.title} />
          </main>
        )}

        {showPaste && <PasteDialog onSave={handleSave} onClose={() => setShowPaste(false)} />}
        {showReplace && view.name === "page" && (
          <ReplaceDialog currentHtml={view.html} onSave={handleReplace} onClose={() => setShowReplace(false)} />
        )}
        {showHistory && view.name === "page" && (
          <VersionHistory
            pageId={view.page.id}
            onClose={() => setShowHistory(false)}
            onRestore={async () => {
              await openPage(view.page);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;