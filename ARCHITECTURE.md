# Architecture

## Overview

```
+-----------------------------+        +-------------------------------+
|  Frontend (React + TS)      |  IPC   |  Backend (Rust / Tauri)       |
|  - Sidebar (collections)    | <----> |  - Commands (add_page, ...)   |
|  - Gallery / page cards     |        |  - SQLite (metadata)          |
|  - Paste dialog             |        |  - File storage (HTML files)  |
|  - Sandboxed preview iframe |        |  - Input cleaning helpers     |
+-----------------------------+        +-------------------------------+
```

The frontend never touches the filesystem directly. All reads/writes go through
Tauri commands in the Rust backend.

## Storage layout

In the OS app-data directory:

```
<app-data>/
  app.db                      # SQLite database
  pages/
    <page-id>/
      <version-id>.html       # one file per version (full copy, no diffs)
```

Why this split: HTML stays as plain files (easy to export, inspect, and back up),
while SQLite handles the relationships, tags, and search.

## Data model

```sql
CREATE TABLE collections (
  id          INTEGER PRIMARY KEY,
  parent_id   INTEGER REFERENCES collections(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE pages (
  id                 INTEGER PRIMARY KEY,
  collection_id      INTEGER REFERENCES collections(id) ON DELETE SET NULL,
  title              TEXT NOT NULL,
  current_version_id INTEGER,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE versions (
  id          INTEGER PRIMARY KEY,
  page_id     INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  file_path   TEXT NOT NULL,         -- relative to <app-data>/pages/
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- v0.3
CREATE TABLE tags (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE
);

CREATE TABLE page_tags (
  page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, tag_id)
);
```

Notes:
- `parent_id IS NULL` means a top-level collection.
- `pages.collection_id IS NULL` means "Unsorted".
- Deleting a collection: decide whether to cascade-delete pages or move them to Unsorted
  (current plan: confirm dialog, then move pages to Unsorted).

## Backend commands (draft)

| Command | Purpose |
| --- | --- |
| `list_collections()` | Tree of collections |
| `create_collection(name, parent_id)` | New collection |
| `rename_collection(id, name)` / `move_collection(id, new_parent_id)` / `delete_collection(id)` | Manage |
| `list_pages(collection_id)` | Pages in a collection |
| `add_page(raw_text, collection_id)` | Clean input, detect title, save v1 |
| `replace_page(page_id, raw_text)` | Save new version, update current |
| `get_page_html(page_id, version_id?)` | Read HTML for preview / copy |
| `list_versions(page_id)` | Version history |
| `restore_version(page_id, version_id)` | Make an old version current |
| `move_page(page_id, collection_id)` / `delete_page(page_id)` | Manage |
| `export_page(page_id, dest)` / `export_collection(id, dest)` | Export |

## Frontend structure (suggested)

```
src/
  components/    # Sidebar, PageCard, PasteDialog, VersionList, PreviewFrame
  pages/         # Main views (Gallery, PageView)
  lib/           # tauri command wrappers, input cleaning (mirrored for instant UI feedback)
  styles/
src-tauri/
  src/
    commands/    # one file per command group
    db.rs        # SQLite setup + migrations
    storage.rs   # file read/write helpers
    cleaning.rs  # fence stripping, HTML extraction, title detection
```

## Key decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Desktop framework | Tauri 2 | Small binaries, Rust learning, strong portfolio signal |
| Versioning | Full-copy snapshots | HTML is small; avoids diff complexity |
| Content storage | Files on disk | Easy export/backup; keeps DB small |
| Metadata storage | SQLite | Relations, tags, search |
| Edit model | Replace-all | AI generates whole pages; no code editor needed |
