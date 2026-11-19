import { useCallback, useEffect, useState } from "react";
import {
  addPage,
  addTag,
  countPagesPerCollection,
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
  restoreVersion,
  searchPages,
  type Collection,
  type PageMeta,
  type Tag,
  type Version,
} from "./lib/backend";
import { PageCard } from "./components/PageCard";
import { PasteDialog } from "./components/PasteDialog";
import { ReplaceDialog } from "./components/ReplaceDialog";
import { PreviewFrame } from "./components/PreviewFrame";
import { VersionHistory } from "./components/VersionHistory";
import { CopyForAIDialog } from "./components/CopyForAIDialog";
import { FileTree } from "./components/FileTree";
import { ConfirmDialog, Toast } from "./components/ConfirmDialog";
import { RefreshIcon, ClockIcon, CopyIcon, TrashIcon } from "./components/Icons";
import "./App.css";

type View = { name: "gallery" } | { name: "page"; page: PageMeta; html: string };

type ConfirmState = {
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
} | null;

/**
 * SelectedSidebar represents what is currently selected in the sidebar.
 * - "all"  : Show every page regardless of collection
 * - null   : "Unsorted" — only pages with no collection
 * - number : A specific collection id
 */
type SelectedSidebar = number | null | "all";

function App() {
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [pageCounts, setPageCounts] = useState<Map<number | null, number>>(new Map());
  const [selectedCollectionId, setSelectedCollectionId] = useState<SelectedSidebar>("all");
  const [view, setView] = useState<View>({ name: "gallery" });
  const [showPaste, setShowPaste] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCopyForAI, setShowCopyForAI] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const includeAll = selectedCollectionId === "all";
      const collectionId = typeof selectedCollectionId === "number" ? selectedCollectionId : null;

      const [pagesData, collectionsData, countsData] = await Promise.all([
        searchQuery ? searchPages(searchQuery) : listPages(collectionId, includeAll),
        listCollections(),
        countPagesPerCollection(),
      ]);
      setPages(pagesData);
      setCollections(collectionsData);
      setPageCounts(new Map(countsData));
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
    const collectionId = typeof selectedCollectionId === "number" ? selectedCollectionId : null;
    const meta = await addPage(rawText, collectionId);
    setShowPaste(false);
    await refresh();
    await openPage(meta);
  }

  async function handleReplace(rawText: string) {
    if (view.name !== "page") return;
    const meta = await replacePage(view.page.id, rawText);
    setShowReplace(false);
    await openPage(meta);
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

  function requestDeletePage(page: PageMeta) {
    setConfirm({
      title: "Delete page",
      message: `Delete "${page.title}"? This can't be undone.`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: async () => {
        try {
          await deletePage(page.id);
          setView({ name: "gallery" });
          await refresh();
        } catch (e) {
          setError(String(e));
        }
      },
    });
  }

  async function handleCopyForAI() {
    if (view.name !== "page") return;
    setShowCopyForAI(true);
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

  async function handleCreateCollection(parentId: number | null, name: string) {
    try {
      await createCollection(name, parentId);
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleRenameCollection(id: number, newName: string) {
    try {
      await renameCollection(id, newName);
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  }

  function requestDeleteCollection(collection: Collection) {
    setConfirm({
      title: "Delete folder",
      message: `Delete "${collection.name}"? Pages inside will be moved to Unsorted.`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: async () => {
        try {
          await deleteCollection(collection.id);
          if (selectedCollectionId === collection.id) {
            setSelectedCollectionId("all");
          }
          await refresh();
        } catch (e) {
          setError(String(e));
        }
      },
    });
  }

  async function handleMovePage(page: PageMeta, newCollectionId: number | null) {
    try {
      await movePage(page.id, newCollectionId);
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  }

  const selectedCollection = typeof selectedCollectionId === "number"
    ? collections.find((c) => c.id === selectedCollectionId)
    : null;
  const viewTitle = selectedCollection
    ? selectedCollection.name
    : selectedCollectionId === null
    ? "Unsorted"
    : searchQuery
    ? `Search: "${searchQuery}"`
    : "All Pages";

  // For FileTree: pass only number | null (never "all")
  const fileTreeSelectedId = selectedCollectionId === "all" ? null : selectedCollectionId;
  const isAllSelected = selectedCollectionId === "all";

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <button
            className="brand"
            onClick={() => {
              setSelectedCollectionId("all");
              setSearchQuery("");
              setView({ name: "gallery" });
            }}
          >
            <img src="/pagebox.svg" alt="" width="20" height="20" />
            <span>Pagebox</span>
          </button>
        </div>
        <FileTree
          collections={collections}
          pageCounts={pageCounts}
          selectedCollectionId={fileTreeSelectedId}
          isAllSelected={isAllSelected}
          onSelectAll={() => {
            setSelectedCollectionId("all");
            setSearchQuery("");
          }}
          onSelectUnsorted={() => {
            setSelectedCollectionId(null);
            setSearchQuery("");
          }}
          onSelect={(id) => {
            setSelectedCollectionId(id);
            setSearchQuery("");
          }}
          onCreate={handleCreateCollection}
          onRename={handleRenameCollection}
          onDelete={requestDeleteCollection}
        />
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
              <button
                className="btn"
                onClick={() => setView({ name: "gallery" })}
              >
                ← Back to {viewTitle}
              </button>
              <h2 className="page-title-small">{view.page.title}</h2>
              <div className="page-toolbar-actions">
                <button
                  className="btn"
                  onClick={() => setShowReplace(true)}
                  title="Replace with new version"
                >
                  <RefreshIcon size={14} />
                  <span>Replace</span>
                </button>
                <button
                  className="btn"
                  onClick={() => setShowHistory(true)}
                  title="View version history"
                >
                  <ClockIcon size={14} />
                  <span>History</span>
                </button>
                <button
                  className="btn"
                  onClick={handleCopyForAI}
                  title="Copy raw HTML to clipboard"
                >
                  <CopyIcon size={14} />
                  <span>Copy for AI</span>
                </button>
                <button
                  className="btn danger"
                  onClick={() => requestDeletePage(view.page)}
                >
                  <TrashIcon size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            <div className="page-tags-section">
              <span className="tags-label">Tags:</span>
              {tags.map((tag) => (
                <span key={tag.id} className="tag">
                  {tag.name}
                  <button
                    className="tag-remove"
                    onClick={() => handleRemoveTag(tag.name)}
                    title="Remove tag"
                  >
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

        {showPaste && (
          <PasteDialog
            onSave={handleSave}
            onClose={() => setShowPaste(false)}
            onCopied={(msg) => setToast(msg)}
          />
        )}
        {showReplace && view.name === "page" && (
          <ReplaceDialog
            currentHtml={view.html}
            onSave={handleReplace}
            onClose={() => setShowReplace(false)}
          />
        )}
        {showHistory && view.name === "page" && (
          <VersionHistory
            pageId={view.page.id}
            onClose={() => setShowHistory(false)}
            onRequestRestore={(v: Version) => {
              setConfirm({
                title: "Restore version",
                message: `Restore version v${v.id}? The current version will be saved as a new snapshot.`,
                confirmLabel: "Restore",
                onConfirm: async () => {
                  try {
                    await restoreVersion(view.page.id, v.id);
                    await openPage(view.page);
                    setShowHistory(false);
                  } catch (e) {
                    setError(String(e));
                  }
                },
              });
            }}
          />
        )}

        {showCopyForAI && view.name === "page" && (
          <CopyForAIDialog
            html={view.html}
            pageTitle={view.page.title}
            onClose={() => setShowCopyForAI(false)}
            onCopied={(msg) => setToast(msg)}
          />
        )}

        {confirm && (
          <ConfirmDialog
            title={confirm.title}
            message={confirm.message}
            confirmLabel={confirm.confirmLabel}
            danger={confirm.danger}
            onConfirm={async () => {
              try {
                await confirm.onConfirm();
              } finally {
                setConfirm(null);
              }
            }}
            onCancel={() => setConfirm(null)}
          />
        )}

        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
}

export default App;
