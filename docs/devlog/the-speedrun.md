# The Speedrun — building Pagebox in one sprint

> **One log, no dates — on purpose.** Pagebox is a speedrun project: idea to
> installers in a handful of intense sessions, not a leisurely weekly journal.
> Dated daily entries would be fake precision, and the exact timeline already
> exists in `git log`. So this is a single entry told in **phases**, each ending
> with the commits it covers — you can always reconstruct the real order from
> the SHAs.

> **AI disclaimer — read this first.** I use AI a lot in this development,
> specifically **Qwen4-Max**. Most of the code was AI-written from my specs and
> debugging feedback, and that is the only reason the short development time
> makes sense. What I did: the idea and scope, the architecture decisions
> (including the storage reversal in Phase 3), testing on real devices —
> including an MDM-managed school laptop — describing symptoms until the bugs
> were found, and deciding what "done" means. This is a student portfolio
> project, and I'd rather be upfront about how it was built than pretend I
> hand-typed every line. The failures below are the part AI couldn't skip for me.

---

## Phase 0 — The idea

**What I did**
- Defined the problem: AI makes HTML easily, but managing it is annoying —
  random `.html` files scattered across Downloads, no idea which version is which.
- Chose the scope: paste-in, sandboxed preview, collections, replace-all
  editing, version history.
- Chose the stack: Tauri 2 + React + SQLite.

**What I learned**
- Replace-all editing makes version history essential — and full snapshots
  make it cheap to build. Those two features are one decision.

Commits: `a97e365` (initial project docs)

---

## Phase 1 — v0.1: paste and preview

**What I did**
- Replaced the Tauri starter demo with the real app:
  - Rust backend: `cleaning.rs` (fence stripping, HTML extraction, title
    detection), `storage.rs` (UUID page dirs under app-data with `current.html`
    + `meta.json`), commands `add_page`, `list_pages`, `get_page_html`, `delete_page`.
  - React frontend: gallery of page cards, paste dialog with live title
    detection and a "doesn't look like HTML" warning, sandboxed preview,
    delete with confirm (pulled forward from v0.2 — tiny, and makes testing sane).
- Preview security per SECURITY.md: `<iframe sandbox="allow-scripts" srcdoc>`
  (no `allow-same-origin`), CSP meta injected before render, network off by
  default. App CSP set in `tauri.conf.json` (was `null`), unused opener
  plugin/permission dropped, everything renamed from `tauri-app` to Pagebox.
- vitest + 17 unit tests for cleaning and CSP injection, mirrored Rust tests
  in `cleaning.rs`. `pnpm dev` also works in a plain browser with a labeled
  localStorage mock backend, so the UI can be demoed without a desktop build.

**What went wrong**
- `srcdoc` iframes inherit the parent's CSP. A "strict" app CSP without
  `'unsafe-inline'` would silently break every previewed page's inline scripts.
  The app CSP therefore allows inline scripts/styles; isolation comes from the
  sandbox's opaque origin, and the injected meta CSP locks the page down further.
- A naive `/<head[^>]*>/` injection regex also matches `<header>` — needed
  `/<head(?:\s[^>]*)?>/` so the CSP meta lands in the right place.
- Lowercasing a whole string before searching shifts byte indices for some
  Unicode input; the Rust cleaner searches ASCII-case-insensitively over the
  original bytes instead.

**What I learned**
- Sandbox flags and CSP do different jobs: the sandbox isolates the page from
  the app; the CSP isolates it from the network. You need both.
- Mirroring logic in TS (instant UI feedback) and Rust (source of truth on
  save) works well, but the two need paired tests to stay in sync.

Commits: `4bc6433`

---

## Phase 2 — v0.2 + v0.3: collections, replace, history, tags, search

The SQLite schema and collections (the v0.2 milestone) landed in the same
stretch — there's no standalone v0.2 commit in the history; it's folded into
this push. Speedrun means milestones blur together.

**What I did**
- **Replace**: pasting a new version over an existing page snapshots the old
  HTML into version history instead of losing it.
- **Version history**: list of snapshots per page, preview any of them,
  restore one back to current.
- **Tags** on pages, and **search** by title and tag.
- First version of the **Copy for AI** button — it copied raw HTML to the
  clipboard (it gets smarter in Phase 5).
- Full snapshots rather than diffs: storage is cheap, and restore becomes a
  copy instead of a patch-replay.

**What went wrong**
- Nothing dramatic in this commit itself. The subtle bug — `replace_page`
  quietly resetting a page's `collection_id` and `created_at` — only surfaced
  later during testing (Phase 4).

**What I learned**
- Replace-all editing keeps the app simple *because* history exists. The two
  features are one design decision, not two.
- Version history as full snapshots is almost free to build and very hard to
  corrupt compared to storing diffs.

Commits: `2d6275c`

---

## Phase 3 — v0.4: the storage saga (real files → pure SQLite)

The biggest reversal of the sprint, and the one worth telling in full.

**What I tried first**
- **Real directory storage.** Collections became actual folders
  (`workspace/Projects/`), pages became slugified `.html` files
  (`my-awesome-page.html`), renames/moves physically moved files on disk
  (version history files included), with an automatic migration from the old
  `pages/<uuid>/` layout. The pitch: "your notes are just files" — inspectable,
  portable, openable in any editor.

**What went wrong**
- The real-files approach ran into macOS permission errors — that's what
  triggered the revert. Writing and moving files around is exactly the kind
  of thing that behaves differently on every machine.
- Reverting took several passes (backend storage first, frontend types
  after), plus a `backup` commit and two pull-merges to reconcile parallel
  work before the tree view landed cleanly.
- Databases created by the intermediate builds didn't have the new `content`
  column, so startup broke until the migration landed. Empty-content rows
  needed a separate backfill (Phase 4).

**Why I moved to SQLite — the permission problem is way more complex than it looks**

The errors were the trigger, but the reason I stopped fighting is that on
macOS, "just write a file" isn't one operation — it's a negotiation with a
consent system:

- **TCC (Transparency, Consent & Control)** guards the places users actually
  want their stuff: Desktop, Documents, Downloads, external drives. An app
  touching them triggers per-folder consent prompts, and the grant is
  per-app *and* per-location — not a single "can this app write files" switch.
- **Grants don't travel.** Move the workspace, rename a folder, restore on a
  new Mac → new prompts or silent failures. Remembering a user-picked folder
  across launches drags in security-scoped bookmarks — a whole extra API
  surface just to persist "the user said yes once."
- **Dev mode can lie.** The permission belongs to whichever binary asked; a
  terminal running `pnpm tauri dev` can have access the packaged `.app`
  doesn't. "Works on my machine" is the default failure mode here.
- **MDM makes it worse.** On managed school devices, consent prompts can be
  suppressed or denied by policy — and those are exactly the machines I'm
  building for. A storage layer that depends on a permission dialog is a
  non-starter there, and every prompt is a support ticket from a student.

SQLite sidesteps the entire negotiation. The database lives in the app's own
data directory — `~/Library/Application Support/com.pagebox.app` on macOS,
`%APPDATA%\com.pagebox.app` on Windows, `~/.local/share/com.pagebox.app` on
Linux — which needs no consent on any platform, managed or not. And once
content is rows instead of files:

- **Transactions**: a rename/move/delete can't half-fail the way "update the
  DB, then move the file" can. One source of truth beats two.
- **Virtual folders**: collections are rows with `parent_id`; the tree view
  is a query, moving a page is an `UPDATE`, not a filesystem operation that
  can trip a permission.
- **Backup is one file**, and schema changes get migrations instead of
  "hope every machine's folder layout matches."

The honest trade-off: pages are no longer plain `.html` files you can open in
another editor. Copy-for-AI (and a future export) covers that need without
handing every user a filesystem permission problem.

**What I learned**
- "Looks like folders" is a UI concern, not a storage concern.
- Every schema change needs a migration path from *every* version that ever
  ran on my machine, not just the last one.
- Pick storage for the least-privileged device you target. My target is a
  managed school laptop, and SQLite is the only option that behaves the same
  there as on my own Mac.

Commits: `0915f71`, `bad80a3`, `b91808f`, `33aa676`, `b49eea1`, `3b5f9aa`, `ca80af0`, `3bcebcf`, `5b1d46c` (+ merges `0c2b453`, `2d6574a`)

---

## Phase 4 — WKWebView quirks, data fixes, GitHub Dark

**What I did**
- Replaced every browser dialog with real components: VS Code-style inline
  inputs in the file tree for create/rename (Enter submits, Escape cancels),
  a custom `ConfirmDialog`, and an auto-dismissing `Toast` instead of `alert()`.
- Fixed Unsorted vs All Pages: `list_pages` gained an `includeAll` flag,
  Unsorted now means `collection_id IS NULL` only, and the sidebar shows
  per-collection count pills (`count_pages_per_collection`).
- Data repairs: a backfill migration that reads legacy `pages/` files into
  the empty `content` column, and `replace_page` now preserves `collection_id`
  and `created_at`.
- Replaced all emoji icons with a proper SVG set (`Icons.tsx`), strengthened
  contrast edges, then applied a full GitHub Dark high-contrast theme.

**What went wrong**
- Tauri's WKWebView silently ignores `window.prompt()`, `window.confirm()`
  and `window.alert()`. In the browser mock everything worked; in the real
  app "New Collection" just… did nothing. No error, no dialog.
- Moving a page into a collection left it visible under Unsorted — the old
  query treated Unsorted as "everything", not "collection_id IS NULL".
- Pages saved during the storage churn had an empty `content` column; adding
  the column wasn't enough, the data had to be backfilled from the old
  on-disk files.
- `replace_page` was quietly resetting `collection_id` and `created_at`, so
  replacing a page teleported it back to Unsorted with a new birthday.

**What I learned**
- A webview is not a browser: test in the actual shell early, because the
  failure mode is silence, not errors.
- Migrations are two jobs: change the schema, *and* repair the data written
  by every buggy intermediate build.

Commits: `7288d80`, `10b6065`, `915c8b8`, `8d9dd7b`, `a901c5d`

---

## Phase 5 — AI prompt generators, native clipboard, a real icon

**What I did**
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

**What went wrong**
- `navigator.clipboard.writeText()` throws `NotAllowedError` inside WKWebView,
  so the Copy-for-AI button worked in the browser mock and failed in the real
  app. Same lesson as the dialogs, one API later.

**What I learned**
- In a webview, route OS integrations (clipboard, dialogs, files) through
  Rust commands instead of trusting web APIs.
- The prompt dialogs close the loop: generate → paste → preview → ask for
  changes → replace. Pagebox stops being just a viewer.

Commits: `c553f7a`, `b0f5e1a`

---

## Phase 6 — First release + portable ZIPs for MDM-managed devices

**What I did**
- Added `release.yaml`: push a tag → GitHub Actions builds macOS (arm64 + x64),
  Windows and Linux, and attaches everything to a **draft** release.
- Fixed a rendering bug and a table bug found while testing the build.
- Then the real-world problem: **my school laptop is MDM-managed** — DMGs
  won't mount and installers are blocked. I know other schools manage their
  devices the same way, so I made portable builds a first-class artifact
  (PR #1, after running it by my IT admin):
  - macOS: CI zips the `.app` with `ditto -c -k --keepParent` for both
    architectures. Tested manually first: extract, clear quarantine, runs.
  - Windows: the Tauri `.exe` is essentially self-contained, so CI zips the
    standalone exe with a README (WebView2 requirement, SmartScreen warning).
  - NSIS `installMode: currentUser` so the installer never asks for admin.
- Wrote INSTALLATION.md (personal devices, managed devices, and a section for
  IT admins), gave the README a Download section + badges, backfilled this
  devlog from the commit history, and added the MIT LICENSE.

**What went wrong**
- The first workflow run tripped over the pnpm setup before any platform
  built; after the fix all four jobs went green.
- On managed Macs the DMG itself won't mount, so "just tell Gatekeeper to
  open it" advice never even gets a chance — the problem is one step earlier
  than I assumed.

**What I learned**
- `ditto`, not plain `zip`, for `.app` bundles — it preserves the symlinks
  and permissions that make a bundle launchable after extraction.
- Zipping avoids *installer* restrictions, not security policy: Gatekeeper
  and SmartScreen still apply, Mark-of-the-Web survives the ZIP, and app
  allowlisting (AppLocker/WDAC/Santa) blocks any format. The clean long-term
  path is IT allowlisting / MDM deployment, plus signing and notarization.
- Distribution is part of the product. An app students can't open on their
  school laptop might as well not exist.

Commits: `0b8e7ab`, `92e2977`, `acbc23e`, `796f1cc` (PR #1 merge `57a3362`), `51ec264`, `a187b5e`

---

## What I learned about speedrunning with AI

- AI makes typing cheap; **decisions and verification are the bottleneck**.
  The two big reversals — storage and browser dialogs — were platform
  realities no amount of generated code could skip.
- The AI will confidently write code that works in dev and fails on the
  target device. My job was to test where it actually ships: a real webview,
  on a managed laptop, not just the browser mock.
- Spec small, verify, commit. 28 commits in a sprint only works because each
  one is a checkpoint you can revert to — the storage saga proves it.
- The debugging loop is the human part: reproduce, describe the symptom
  precisely, check the fix on the real device. That's also where the learning
  happened (TCC, WKWebView, CSP — none of it from a tutorial).
- Being honest about AI use is a feature of this log, not an apology. The
  point of a portfolio is the thinking, and the thinking is mine.

## Next

- Publish the draft release; verify the Windows portable ZIP on a managed PC.
- Ask IT about allowlisting / MDM deployment; look into signing + notarization.
- v0.5 polish: shortcuts, drag-and-drop, empty states, security test pages.
