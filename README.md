# Pagebox

> A notes app for AI-generated HTML. Paste it, see it, organize it.

[![Release](https://github.com/haidaralif-24/page-box/actions/workflows/release.yaml/badge.svg)](https://github.com/haidaralif-24/page-box/actions/workflows/release.yaml)
[![Latest release](https://img.shields.io/github/v/release/haidaralif-24/page-box?label=latest%20release)](https://github.com/haidaralif-24/page-box/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<!-- TODO: add a demo GIF here (docs/screenshots/demo.gif) -->

## Download

Grab the newest build from the [**Releases page**](https://github.com/haidaralif-24/page-box/releases/latest).
Step-by-step instructions — including the first-launch security warnings — are in **[INSTALLATION.md](INSTALLATION.md)**.

| Platform | Standard | Portable — no installer, no admin |
| --- | --- | --- |
| macOS · Apple Silicon (M1–M4) | `Pagebox_<version>_aarch64.dmg` | `Pagebox-<tag>-macos-arm64.zip` |
| macOS · Intel | `Pagebox_<version>_x64.dmg` | `Pagebox-<tag>-macos-x64.zip` |
| Windows 10/11 · 64-bit | `Pagebox_<version>_x64-setup.exe` | `Pagebox-<tag>-windows-x64-portable.zip` |
| Linux | `.deb` · `.rpm` | `.AppImage` |

> **On a school-managed laptop?** Use the portable ZIPs. I develop Pagebox on an
> MDM-managed school Mac where DMGs won't mount and installers are blocked, so every
> release ships ZIP builds that run without installing anything.
> See [Managed school devices](INSTALLATION.md#managed-school-devices-mdm).

Builds are currently **unsigned**, so macOS Gatekeeper / Windows SmartScreen will warn
on first launch — INSTALLATION.md walks you through it.

## The problem

AI tools can generate working HTML pages in seconds. But then what?
You end up with random `.html` files scattered across your Downloads folder,
you have to open each one in a browser, and you lose track of which version is which.

## The idea

Pagebox is a desktop app that works like a notes app, but for HTML pages.

- **Paste** whatever the AI gave you. It figures out the HTML and names the page.
- **See** it rendered instantly, in a safe sandbox.
- **Organize** pages into collections (folders inside folders).
- **Replace** a page when the AI gives you a better version. The old one is saved automatically.
- **Copy for AI** puts the current HTML on your clipboard so you can ask for changes.

No code editor. No project setup. No file paths.

## Who it's for

Students and beginners who use AI to make web pages, and want one tidy place to keep them
without learning how to manage files, editors, or local servers.

## Status

v0.4 — paste & sandboxed preview, collections, replace + version history, tags,
search, and AI prompt tools. The release pipeline builds installers and portable
ZIPs for every platform; the first public release is being prepared.
See [ROADMAP.md](ROADMAP.md).

> Built speedrun-style with heavy AI assistance (**Qwen4-Max**). The
> [devlog](docs/devlog/the-speedrun.md) is the honest record of what I did,
> what the AI did, and what broke along the way.

## Tech stack

- [Tauri 2](https://tauri.app) (Rust backend)
- React + TypeScript + Vite (frontend)
- SQLite for everything — metadata, page HTML, and version history
  (folders are virtual; no loose files on disk)

## Documentation

| Doc | What's in it |
| --- | --- |
| [INSTALLATION.md](INSTALLATION.md) | Install on personal & school-managed (MDM) devices |
| [SPEC.md](SPEC.md) | What the app does and doesn't do |
| [ARCHITECTURE.md](ARCHITECTURE.md) | How it's built, data model |
| [SECURITY.md](SECURITY.md) | How untrusted HTML is handled safely |
| [ROADMAP.md](ROADMAP.md) | Milestones and checklist |
| [Devlog](docs/devlog/the-speedrun.md) | The whole build in one log — phases, failures, AI disclaimer |

## Getting started (development)

Prerequisites: Node.js 20+, [pnpm](https://pnpm.io), Rust (via rustup), and the
[Tauri system dependencies](https://tauri.app/start/prerequisites/) for your OS.

```bash
pnpm install
pnpm tauri dev
```

Other commands:

```bash
pnpm test    # unit tests for input cleaning + CSP injection
pnpm dev     # UI only, in a plain browser
```

`pnpm dev` without Tauri runs the UI with a localStorage-backed mock backend
(labeled "Browser preview" in the header) so the frontend can be developed
without a desktop build. Real on-disk storage requires `pnpm tauri dev`.

### Cutting a release

Push a version tag and GitHub Actions builds every platform, then attaches the
installers and portable ZIPs to a **draft** release:

```bash
git tag v0.1.1
git push origin v0.1.1
```

Review the draft on the Releases page, then publish it.

## License

MIT — see [LICENSE](LICENSE).
