# Pagebox

> A notes app for AI-generated HTML. Paste it, see it, organize it.

<!-- TODO: add a demo GIF here (docs/screenshots/demo.gif) -->

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

Planning / early development. See [ROADMAP.md](ROADMAP.md).

## Tech stack

- [Tauri 2](https://tauri.app) (Rust backend)
- React + TypeScript + Vite (frontend)
- SQLite for metadata, plain `.html` files on disk for content

## Documentation

| Doc | What's in it |
| --- | --- |
| [SPEC.md](SPEC.md) | What the app does and doesn't do |
| [ARCHITECTURE.md](ARCHITECTURE.md) | How it's built, data model |
| [SECURITY.md](SECURITY.md) | How untrusted HTML is handled safely |
| [ROADMAP.md](ROADMAP.md) | Milestones and checklist |
| [docs/devlog/](docs/devlog/) | Build journal |

## Getting started (development)

Prerequisites: Node.js 20+, [pnpm](https://pnpm.io), Rust (via rustup), and the
[Tauri system dependencies](https://tauri.app/start/prerequisites/) for your OS.

```bash
pnpm install
pnpm tauri dev
```

## License

MIT
