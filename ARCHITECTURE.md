# Architecture

> Current as of **v0.4-dev**: all data — metadata, HTML content, and version
> history — lives in a single SQLite database. Earlier revisions of this doc
> described HTML files on disk; that design was built, then reverted. The full
> story is in the [devlog](docs/devlog/the-speedrun.md) (Phase 3). Milestone
> names use the roadmap's `-dev` suffix; releases are tagged `v0.1.x`.

## Overview

```
+-----------------------------+        +-------------------------------+
|  Frontend (React + TS)      |  IPC   |  Backend (Rust / Tauri)       |
|  - Collection tree sidebar  | <----> |  - Commands (add_page, ...)   |
|  - Gallery / page cards     |        |  - SQLite (ALL data)          |
|  - Paste / prompt dialogs   |        |  - Input cleaning helpers     |
|  - Sandboxed preview iframe |        |  - Native clipboard (arboard) |
+-----------------------------+        +-------------------------------+
```

The frontend never touches the filesystem directly. All reads/writes go through
Tauri commands in the Rust backend.

## Storage: one SQLite file, nothing else

In the OS app-data directory:

```
<app-data>/
  app.db    # collections, pages (incl. current HTML), versions, tags
```

| OS | `<app-data>` |
| --- | --- |
| macOS | `~/Library/Application Support/com.pagebox.app` |
| Windows | `%APPDATA%\com.pagebox.app` |
| Linux | `~/.local/share/com.pagebox.app` |

No `pages/` directory, no loose `.html` files. The folder tree in the UI is
**virtual**: collections are rows with `parent_id`, the tree is a query, and
moving a page is an `UPDATE` — never a filesystem operation.

### Why pure SQLite

Files-on-disk was the original design (and briefly, real workspace folders).
It was reverted because on macOS, writing user-visible files is a negotiation
with a consent system (TCC): per-folder prompts, grants that don't survive
moves, dev-mode grants that don't apply to the packaged `.app` — and on
MDM-managed school devices, a primary target, prompts can be suppressed or
denied by policy. The app-data directory needs no consent on any platform, so
one SQLite file there behaves identically on a managed school laptop and a
personal Mac. It also buys transactions (no half-failed saves), one-file
backup, and migrations instead of "hope every machine's layout matches".

Trade-off: pages aren't plain files you can open in another editor. Copy for AI
covers that today; export is planned for v0.6-dev. Full reasoning:
[devlog, Phase 3](docs/devlog/the-speedrun.md).

### Migrations (startup, `db.rs::init_db`)

Several storage layouts existed during development; every one upgrades in place:

1. Create all tables with the current schema (`CREATE TABLE IF NOT EXISTS`).
2. Add `pages.content` if missing (metadata-only era databases).
3. If `versions` still has the legacy `file_path` column, rebuild it around
   `content`, recovering each version's HTML from its old file.
4. Backfill empty `pages.content` from legacy `pages/<id>/current.html` files.
5. Repair pages missing a version row or a `current_version_id`.
6. If the DB has no pages, import the v0.1-dev layout
   (`pages/<uuid>/meta.json` + `current.html`), then rename `pages/` → `pages.old/`.

## Data model (current)

```sql
CREATE TABLE collections (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id   INTEGER REFERENCES collections(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE pages (
  id                 TEXT PRIMARY KEY,       -- UUID v4, backend-generated
  collection_id      INTEGER REFERENCES collections(id) ON DELETE SET NULL,
  title              TEXT NOT NULL,
  content            TEXT NOT NULL DEFAULT '',  -- current HTML
  current_version_id INTEGER REFERENCES versions(id) ON DELETE SET NULL,
  created_at         INTEGER NOT NULL,       -- epoch milliseconds
  updated_at         INTEGER NOT NULL
);

CREATE TABLE versions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id     TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,                 -- full HTML snapshot, no diffs
  created_at  INTEGER NOT NULL
);

CREATE TABLE tags (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL UNIQUE                 -- stored lowercase
);

CREATE TABLE page_tags (
  page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, tag_id)
);
```

Notes:
- `pages.id` is a backend-generated UUID v4 (TEXT), validated before use —
  defense in depth kept from the file-storage era.
- `parent_id IS NULL` = top-level collection. Deleting a collection
  cascade-deletes its subcollections; every affected page moves to Unsorted
  (`ON DELETE SET NULL`) — a collection delete never deletes pages.
- `pages.collection_id IS NULL` = **Unsorted**. **All Pages** is a separate
  view (`list_pages(include_all = true)`), not a collection.
- `pages.content` intentionally duplicates the current version's HTML:
  preview/gallery reads hit one row, history stays append-only.
- `pages` and `versions` reference each other (`current_version_id` ↔
  `page_id`); SQLite checks foreign keys at write time, so the cycle is fine.
- Timestamps: `pages`/`versions` use epoch milliseconds; `collections.created_at`
  is a `datetime('now')` string (historical quirk, harmless).
- `add_page`, `replace_page`, and `restore_version` write the page row, the new
  version, and the pointer in **one transaction** — no orphan pages.

## Backend commands (implemented, `lib.rs`)

| Command | Purpose |
| --- | --- |
| `list_collections()` | All collections (tree built client-side) |
| `create_collection(name, parent_id?)` / `rename_collection(id, name)` / `move_collection(id, new_parent_id?)` / `delete_collection(id)` | Manage collections |
| `list_pages(collection_id?, include_all?)` | Pages in a collection, Unsorted, or All Pages |
| `count_pages_per_collection()` | Sidebar count pills |
| `add_page(raw_text, collection_id?)` | Clean input, detect title, save page + v1 |
| `get_page_html(page_id, version_id?)` | Current or historical HTML for preview / copy |
| `replace_page(page_id, raw_text)` | Snapshot old HTML, make new HTML current |
| `move_page(page_id, collection_id?)` / `rename_page(page_id, title)` / `delete_page(page_id)` | Manage pages |
| `list_versions(page_id)` / `restore_version(page_id, version_id)` | Version history |
| `add_tag(page_id, tag_name)` / `remove_tag(page_id, tag_name)` / `list_tags_for_page(page_id)` | Tags |
| `search_pages(query)` | Title + tag search (content search: v0.6-dev) |
| `copy_to_clipboard(text)` | Native clipboard via `arboard` |

Planned, not implemented: `export_page`, `export_collection` (v0.6-dev).

## Frontend structure

```
src/
  App.tsx                    # main view: sidebar + gallery + preview, toasts
  App.css                    # GitHub Dark theme
  components/
    FileTree.tsx             # virtual collection tree, inline create/rename
    PageCard.tsx             # gallery card
    PasteDialog.tsx          # add page
    ReplaceDialog.tsx        # replace with new version
    VersionHistory.tsx       # snapshot list, preview, restore
    CopyForAIDialog.tsx      # goal-template prompt builder
    GenerateHTMLPromptDialog.tsx  # "ask an AI for a lesson" prompt builder
    ConfirmDialog.tsx        # custom confirm (WKWebView ignores window.confirm)
    PreviewFrame.tsx         # sandboxed iframe + CSP injection
    Icons.tsx                # SVG icon set
  lib/                       # command wrappers, cleaning mirror, browser mock
src-tauri/src/
  lib.rs                     # command registration
  db.rs                      # schema, migrations, collection ops
  storage.rs                 # page/version/tag/search ops (SQLite only)
  cleaning.rs                # fence stripping, HTML extraction, title detection
```

`pnpm dev` also runs in a plain browser against a labeled localStorage mock
backend, so the UI can be demoed without a desktop build — but see below.

## Webview realities (test in the real shell)

- WKWebView **silently ignores** `window.prompt/confirm/alert` → all dialogs
  and toasts are custom React components.
- `navigator.clipboard.writeText()` throws `NotAllowedError` in WKWebView →
  clipboard goes through the Rust `copy_to_clipboard` command.
- `srcdoc` iframes inherit the app's CSP → isolation comes from the sandbox's
  opaque origin; an injected meta CSP locks the page's network down. Details
  in [SECURITY.md](SECURITY.md).

## Key decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Desktop framework | Tauri 2 | Small binaries, Rust learning, strong portfolio signal |
| Content + metadata | SQLite only (v0.4-dev) | No TCC/MDM permission prompts; transactions; one-file backup. Reversed from files-on-disk — devlog Phase 3 |
| Versioning | Full-copy snapshots | HTML is small; restore is a copy, not a patch replay |
| Folders | Virtual collections (`parent_id`) | File-tree UX without filesystem operations |
| Edit model | Replace-all | AI generates whole pages; no code editor needed |
| Dialogs / toasts | Custom components | WKWebView ignores the native ones |
| Clipboard | Rust (`arboard`) | Web clipboard API is blocked in WKWebView |
