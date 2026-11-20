# Roadmap

> **How versions work here:** roadmap milestones are *development checkpoints*
> and carry a `-dev` suffix (`v0.1-dev` … `v0.6-dev`). They are never tagged or
> released. Published releases use **`v0.1.x`** (`v0.1.0`, `v0.1.1`, …) — the
> patch number bumps with each release, independent of milestone progress.
> The app version lives in `src-tauri/tauri.conf.json` (currently `0.1.2`).

## v0.1-dev - Paste and preview
- [x] Tauri + React + TypeScript project running
- [x] Add page: paste box, input cleaning, title detection
- [x] Sandboxed preview iframe
- [x] Save HTML to disk, list saved pages after restart
- [x] Unit tests for input cleaning + CSP injection (vitest, mirrored Rust tests)

Note: page delete was pulled forward from v0.2-dev (small, and makes testing easier).
v0.1-dev stores metadata as `meta.json` per page; SQLite replaces it in v0.2-dev.

## v0.2-dev - Organize
- [x] SQLite schema + migrations
- [x] Collections: create, rename, nest, move, delete
- [x] Sidebar tree
- [x] Gallery view with page cards
- [x] Move pages between collections
- [x] Rename and delete pages

## v0.3-dev - Replace, history, tags
- [x] Replace with new version
- [x] Version history list, preview, restore
- [x] Copy for AI button
- [x] Tags
- [x] Search by title and tag

## v0.4-dev - Directory-Styled Storage Structure
- [x] Virtual nested folder structure (collections with `parent_id`)
- [x] Tree-view sidebar with expand/collapse functionality
- [x] All data stored purely in SQLite (no actual files on disk)
- [x] Migration script for legacy data
- [x] macOS permission error resolved

## v0.5-dev - Ship
- [ ] Real thumbnails
- [ ] Full-text content search
- [ ] Export page / collection (.html, .zip)
- [x] App icon, installer builds (Windows / macOS / Linux if possible)
- [ ] README demo GIF + screenshots
- [x] First GitHub release

Note: the icon, installers, and first public release shipped early (release
line `v0.1.0`–`v0.1.2`); the remaining items above are still open.

## v0.6-dev - Polish
- [ ] Keyboard shortcuts
- [ ] Drag-and-drop (pages into collections, `.html` files into the window)
- [x] Dark mode (GitHub Dark theme, shipped early in v0.4-dev)
- [ ] Friendly empty states and error messages
- [ ] Allow-internet toggle with clear labeling
- [ ] Security test pages all pass

## Ideas for later
- Built-in "Ask AI to edit" (bring your own API key)
- Per-page storage bridge so pages can save data safely
- Responsive preview (phone / tablet / desktop)
- Import a folder of existing HTML files
- Side-by-side version comparison
