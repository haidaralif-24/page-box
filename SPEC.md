# Pagebox - Product Spec

## 1. Summary

A desktop app for storing, previewing, and organizing HTML pages, designed for people who
get their HTML from AI tools and don't want to touch a code editor or file manager.

## 2. Goals

1. Zero setup: open the app, paste, done.
2. Render pages safely and instantly.
3. Make organizing easy: collections, nesting, tags, search.
4. Never lose work: every replace keeps the previous version.

## 3. Non-goals (v1)

- No code editor, syntax highlighting, or line-level editing.
- No built-in AI calls or API keys (users paste to and from their own AI tool).
- No cloud sync, accounts, or sharing.
- No support for multi-file projects (one page = one self-contained HTML document).

## 4. Target users

- High school and college students using free AI tools to make pages and mini web apps.
- Beginners who know how to ask an AI for HTML but not how to manage files or servers.

## 5. Terminology

Use friendly words in the UI:

| UI term | Technical meaning |
| --- | --- |
| Page | One HTML document |
| Collection | A folder (can nest) |
| Version | A saved snapshot of a page's HTML |
| Tag | A label attached to pages |

## 6. Core user flows

### 6.1 Add page
1. User clicks **Add page** (or presses the shortcut).
2. A paste box opens. User pastes text.
3. App cleans the input (see 7.1), detects the title, and saves it into the selected collection.
4. The page opens in the preview.

### 6.2 Replace page
1. On a page, user clicks **Replace with new version**.
2. The same paste box opens.
3. On save, the current HTML is stored as a version, and the new HTML becomes current.

### 6.3 Restore a previous version
1. User opens **Version history** on a page.
2. Clicking a version previews it.
3. **Restore** makes it current (the version being replaced is itself saved first).

### 6.4 Organize
- Create, rename, move, and delete collections (nested).
- Move pages between collections (drag-and-drop, or a "Move to..." menu).
- Add and remove tags on pages.

### 6.5 Copy for AI
Copies the current page's raw HTML to the clipboard.

### 6.6 Search
Search by title and tags (v0.3), then by page content (v0.4).

## 7. Functional requirements

### 7.1 Input cleaning
When the user pastes text:
- Strip markdown code fences (```` ```html ... ``` ````) if present.
- If the text contains extra prose before/after the HTML, extract from the first
  `<!doctype` or `<html` to the last `</html>` when possible.
- If no HTML-like content is detected, show a friendly warning but still allow saving.
- Title = contents of `<title>`; fallback = `Untitled page`.

### 7.2 Preview
- Rendered in a sandboxed iframe (see SECURITY.md).
- Toggle: **Allow internet for this page** (default off).
- Responsive preview sizes (desktop / tablet / phone) are a nice-to-have.

### 7.3 Gallery view
- Default view of a collection is a grid of page cards (thumbnail + title).
- Thumbnails can start as a scaled-down live iframe; real image thumbnails come later.

### 7.4 Storage
- Everything is local. Data lives in the OS app-data directory.
- HTML content = files on disk; metadata = SQLite. See ARCHITECTURE.md.

### 7.5 Import / Export
- Import: drag a `.html` file into the window.
- Export: save a page as `.html`, or a collection as a `.zip`.

## 8. Non-functional requirements

- **Safe:** untrusted HTML must never access the app's internals or the user's files.
- **Fast:** opening a page preview < 200 ms for typical pages.
- **Small:** installer under ~15 MB (a Tauri advantage).
- **Offline:** works with no interne[118;1:3ut (except pages the user explicitly allows online).
- **Accessible:** keyboard shortcuts for main actions, readable contrast, dark mode.

## 9. Success criteria

- A new user can add and view their first page in under 30 seconds.
- Replacing a page never loses the previous version.
- A malicious test page (see SECURITY.md test list) cannot escape the sandbox.
- README has a demo GIF, screenshots, and a clear explanation of the security approach.

## 10. Open questions

- App name (placeholder: Pagebox).
- How to generate real thumbnails across Windows / macOS / Linux webviews?
- Should "allow internet" be remembered per page?
