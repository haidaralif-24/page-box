import { useCallback, useEffect, useState } from "react";
import {
  addPage,
  deletePage,
  getPageHtml,
  isTauri,
  listPages,
  type PageMeta,
} from "./lib/backend";
import { PageCard } from "./components/PageCard";
import { PasteDialog } from "./components/PasteDialog";
import { PreviewFrame } from "./components/PreviewFrame";
import "./App.css";

type View = { name: "gallery" } | { name: "page"; page: PageMeta; html: string };

function App() {
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [view, setView] = useState<View>({ name: "gallery" });
  const [showPaste, setShowPaste] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setPages(await listPages());
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleSave(rawText: string) {
    const meta = await addPage(rawText);
    setShowPaste(false);
    await refresh();
    await openPage(meta);
  }

  async function openPage(page: PageMeta) {
    try {
      const html = await getPageHtml(page.id);
      setView({ name: "page", page, html });
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

  return (
    <div className="app">
      <header className="app-header">
        <button
          className="brand"
          onClick={() => setView({ name: "gallery" })}
          title="Go to all pages"
        >
          <img src="/pagebox.svg" alt="" width="26" height="26" />
          <span>Pagebox</span>
        </button>
        <div className="header-actions">
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
              <h2>No pages yet</h2>
              <p>
                Paste the HTML your AI tool gave you and it will show up here —
                rendered safely, saved locally.
              </p>
              <button className="btn primary" onClick={() => setShowPaste(true)}>
                + Add your first page
              </button>
            </div>
          ) : (
            <div className="page-grid">
              {pages.map((page) => (
                <PageCard key={page.id} page={page} onOpen={openPage} />
              ))}
            </div>
          )}
        </main>
      ) : (
        <main className="page-view">
          <div className="page-toolbar">
            <button className="btn" onClick={() => setView({ name: "gallery" })}>
              ← All pages
            </button>
            <h1 className="page-title">{view.page.title}</h1>
            <button
              className="btn danger"
              onClick={() => void handleDelete(view.page)}
            >
              Delete
            </button>
          </div>
          <PreviewFrame html={view.html} title={view.page.title} />
        </main>
      )}

      {showPaste && (
        <PasteDialog onSave={handleSave} onClose={() => setShowPaste(false)} />
      )}
    </div>
  );
}

export default App;
