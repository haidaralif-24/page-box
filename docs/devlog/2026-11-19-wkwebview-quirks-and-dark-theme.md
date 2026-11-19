# 2026-11-19 - WKWebView quirks, data fixes, and the GitHub Dark theme

## What I did
- Replaced every browser dialog with real components:
  - VS Code-style inline inputs in the file tree for create/rename
    (Enter submits, Escape cancels),
  - a custom `ConfirmDialog` (Enter/Escape support),
  - an auto-dismissing `Toast` instead of `alert()`.
- Fixed Unsorted vs All Pages: `list_pages` gained an `includeAll` flag,
  Unsorted now means `collection_id IS NULL` only, and the sidebar shows
  per-collection count pills (`count_pages_per_collection`).
- Data repairs: a backfill migration that reads legacy `pages/` files into
  the empty `content` column, and `replace_page` now preserves `collection_id`
  and `created_at`.
- Replaced all emoji icons with a proper SVG set (`Icons.tsx`), strengthened
  contrast edges, then applied a full GitHub Dark high-contrast theme.

## What went wrong
- Tauri's WKWebView silently ignores `window.prompt()`, `window.confirm()`
  and `window.alert()`. In the browser mock everything worked; in the real
  app "New Collection" just… did nothing. No error, no dialog.
- Moving a page into a collection left it visible under Unsorted — the old
  query treated Unsorted as "everything", not "collection_id IS NULL".
- Pages saved during this morning's storage churn had an empty `content`
  column; adding the column wasn't enough, the data had to be backfilled
  from the old on-disk files.
- `replace_page` was quietly resetting `collection_id` and `created_at`, so
  replacing a page teleported it back to Unsorted with a new birthday.

## What I learned
- A webview is not a browser: test in the actual shell early, because the
  failure mode is silence, not errors.
- Migrations are two jobs: change the schema, *and* repair the data written
  by every buggy intermediate build.

## Next
- The clipboard has the same WKWebView problem — fix it natively, then build
  the AI prompt dialogs and a real app icon.

Commits: `7288d80`, `10b6065`, `915c8b8`, `8d9dd7b`, `a901c5d`
