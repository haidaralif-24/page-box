# 2026-11-19 - AI prompt generators, native clipboard, and a real icon

## What I did
- **CopyForAIDialog**: instead of dumping raw HTML, pick a goal template
  (fix bugs, add a feature, improve design, make responsive, accessibility)
  plus an optional specific request, and it copies a complete prompt with the
  page's HTML embedded.
- **GenerateHTMLPromptDialog** in the Add-page flow: describe the material or
  topic and get a prompt that asks an AI for a self-contained, interactive,
  standalone HTML lesson for students.
- Added a native `copy_to_clipboard` Tauri command using the `arboard` crate;
  browser builds keep the `navigator.clipboard` fallback.
- Designed a custom app icon (GitHub Dark colors, a box with a document glyph
  and HTML brackets) and generated every platform icon set — macOS, Windows,
  iOS, Android.

## What went wrong
- `navigator.clipboard.writeText()` throws `NotAllowedError` inside WKWebView,
  so the Copy-for-AI button worked in the browser mock and failed in the real
  app. Same lesson as the dialogs, one API later.

## What I learned
- In a webview, route OS integrations (clipboard, dialogs, files) through
  Rust commands instead of trusting web APIs.
- The prompt dialogs close the loop: generate → paste → preview → ask for
  changes → replace. Pagebox stops being just a viewer.

## Next
- Ship it: a release workflow that builds installers for every platform.

Commits: `c553f7a`, `b0f5e1a`
