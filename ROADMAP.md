# Roadmap

## v0.1 - Paste and preview
- [x] Tauri + React + TypeScript project running
- [x] Add page: paste box, input cleaning, title detection
- [x] Sandboxed preview iframe
- [x] Save HTML to disk, list saved pages after restart
- [x] Unit tests for input cleaning + CSP injection (vitest, mirrored Rust tests)

Note: page delete was pulled forward from v0.2 (small, and makes testing easier).
v0.1 stores metadata as `meta.json` per page; SQLite replaces it in v0.2.

## v0.2 - Organize
- [ ] SQLite schema + migrations
- [ ] Collections: create, rename, nest, move, delete
- [ ] Sidebar tree
- [ ] Gallery view with page cards
- [ ] Move pages between collections
- [ ] Rename and delete pages

## v0.3 - Replace, history, tags
- [ ] Replace with new version
- [ ] Version history list, preview, restore
- [ ] Copy for AI button
- [ ] Tags
- [ ] Search by title and tag

## v0.4 - Polish
- [ ] Keyboard shortcuts
- [ ] Drag-and-drop (pages into collections, `.html` files into the window)
- [ ] Dark mode
- [ ] Friendly empty states and error messages
- [ ] Allow-internet toggle with clear labeling
- [ ] Security test pages all pass

## v0.5 - Ship
- [ ] Real thumbnails
- [ ] Full-text content search
- [ ] Export page / collection (.html, .zip)
- [ ] App icon, installer builds (Windows / macOS / Linux if possible)
- [ ] README demo GIF + screenshots
- [ ] First GitHub release

## Ideas for later
- Built-in "Ask AI to edit" (bring your own API key)
- Per-page storage bridge so pages can save data safely
- Responsive preview (phone / tablet / desktop)
- Import a folder of existing HTML files
- Side-by-side version comparison
