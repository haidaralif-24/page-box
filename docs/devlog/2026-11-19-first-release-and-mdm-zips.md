# 2026-11-19 - First release pipeline + portable ZIPs for MDM-managed devices

## What I did
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
  IT admins) and gave the README a Download section + badges.

## What went wrong
- The first workflow run tripped over the pnpm setup before any platform
  built; after the fix all four jobs went green.
- On managed Macs the DMG itself won't mount, so "just tell Gatekeeper to
  open it" advice never even gets a chance — the problem is one step earlier
  than I assumed.

## What I learned
- `ditto`, not plain `zip`, for `.app` bundles — it preserves the symlinks
  and permissions that make a bundle launchable after extraction.
- Zipping avoids *installer* restrictions, not security policy: Gatekeeper
  and SmartScreen still apply, Mark-of-the-Web survives the ZIP, and app
  allowlisting (AppLocker/WDAC/Santa) blocks any format. The clean long-term
  path is IT allowlisting / MDM deployment, plus signing and notarization.
- Distribution is part of the product. An app students can't open on their
  school laptop might as well not exist.

## Next
- Publish the draft release; verify the Windows portable ZIP on a managed PC.
- v0.5 polish: shortcuts, drag-and-drop, empty states, security test pages.

Commits: `0b8e7ab`, `92e2977`, `acbc23e`, `796f1cc` (PR #1 merge `57a3362`), `51ec264`
