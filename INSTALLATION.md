# Installing Pagebox

Every release ships two kinds of downloads:

- **Standard installers** (`.dmg`, `-setup.exe`, `.deb`, `.rpm`) — for personal computers.
- **Portable ZIPs** — the same app, zipped so it runs straight from a folder. No disk image to mount, no installer, no admin rights. Made for school-managed devices.

> **Why the portable builds exist.** I built Pagebox as a student, on a school laptop
> managed by MDM. The DMG wouldn't mount and installers were blocked — and I know a lot
> of schools manage their devices the same way. So every release also ships ZIP builds
> that skip the *packaging* problem entirely. They don't switch off any security checks:
> if your school's policy blocks the app itself, the fix is asking your IT admin
> (there's a [section for them](#for-it-admins) below), not a different file format.

All downloads live on the [Releases page](https://github.com/haidaralif-24/page-box/releases/latest).

## Which file should I download?

| Your device | Personal computer | School-managed (MDM) |
| --- | --- | --- |
| Mac, Apple Silicon (M1/M2/M3/M4) | `Pagebox_<version>_aarch64.dmg` | `Pagebox-<tag>-macos-arm64.zip` |
| Mac, Intel | `Pagebox_<version>_x64.dmg` | `Pagebox-<tag>-macos-x64.zip` |
| Windows 10/11, 64-bit | `Pagebox_<version>_x64-setup.exe` | `Pagebox-<tag>-windows-x64-portable.zip` |
| Linux | `Pagebox_<version>_amd64.deb` or the `.rpm` | `Pagebox_<version>_amd64.AppImage` (already portable) |

- Not sure which Mac you have? **Apple menu → About This Mac**. "Apple M…" → arm64, "Intel" → x64.
- `<version>` is the app version (e.g. `0.1.0`); `<tag>` is the release tag (e.g. `v0.1.0`). Same release, slightly different naming — just take the newest files on the release page.
- On Windows you may also see an `.msi`. Prefer `-setup.exe`: it installs **just for you**, without admin rights. The `.msi` may ask for an administrator password.

## Personal computers (standard install)

### macOS

1. Download the `.dmg` for your chip, open it, and drag **Pagebox** into **Applications**.
2. First launch: Pagebox isn't code-signed yet (that requires a paid Apple Developer account), so macOS warns you:
   - **macOS 14 and older:** right-click the app → **Open** → **Open**.
   - **macOS 15 and newer:** double-click once (it gets blocked), then go to **System Settings → Privacy & Security → Open Anyway**.
3. After that it opens normally.

Only click through these warnings for apps you actually trust.

### Windows

1. Download `Pagebox_<version>_x64-setup.exe` and run it.
2. SmartScreen says "Windows protected your PC" → **More info → Run anyway**. The app is unsigned, which is what triggers this — it's not a malware verdict.
3. It installs into your own user folder — **no admin password needed** — and launches.

Requires the **Microsoft Edge WebView2 Runtime**, which comes preinstalled on Windows 10/11; the installer fetches it if it's missing.

### Linux

Use the exact file names from the release page:

- Debian/Ubuntu: `sudo apt install ./Pagebox_<version>_amd64.deb`
- Fedora: `sudo dnf install ./Pagebox-<version>-1.x86_64.rpm`
- Any distro: the AppImage — `chmod +x Pagebox_<version>_amd64.AppImage`, then run it. On Ubuntu 22.04+ you may need `sudo apt install libfuse2` first.

## Managed school devices (MDM)

Use the **portable ZIP** for your platform. Nothing gets mounted, nothing gets
"installed", and everything stays inside your own user account.

### macOS (managed)

1. Download `Pagebox-<tag>-macos-arm64.zip` (Apple Silicon) or `Pagebox-<tag>-macos-x64.zip` (Intel).
2. Double-click the ZIP in Finder → you get **Pagebox.app**.
3. Keep it wherever you like — **Downloads is fine**. There's no need to move it to Applications, and on managed Macs that folder often asks for an admin password you don't have. Want it tidier? Use `~/Applications`: Finder → Go → Home, then ⌘⇧N to create a folder named `Applications`. That's your personal Applications folder — no admin needed.
4. Try to open it: right-click → **Open**, or on macOS 15+: **System Settings → Privacy & Security → Open Anyway**.
5. If it still says *"Pagebox is damaged and can't be opened"* — that's macOS's misleading wording for an **unsigned app with a quarantine flag**, not actual damage. Remove the flag in Terminal:

   ```bash
   xattr -dr com.apple.quarantine ~/Downloads/Pagebox.app
   ```

   That path assumes the app is still in **Downloads** — where it lands when you double-click the ZIP. Put it somewhere else (say `~/Applications`)? Adjust the path. Tip: type `xattr -dr com.apple.quarantine ` (with a trailing space), then drag the app into the Terminal window to fill in the path for you.

   This tells macOS to skip its download check **for this app only**. Do it only for apps you trust — like this one, whose entire source is in this repo.
6. If it *still* won't run — "blocked by your administrator", or it quits immediately — that's your school's security policy (e.g. an app allowlist). **Stop here and ask IT** ([section below](#for-it-admins)). No file format gets around that, and you shouldn't try.

### Windows (managed)

1. Download `Pagebox-<tag>-windows-x64-portable.zip`.
2. Right-click → **Extract All…** and extract somewhere you can write — the default (a folder inside **Downloads**) is fine, or e.g. `Documents\Pagebox`. Don't run the exe from inside the ZIP preview — extract first.
3. Double-click **Pagebox.exe**.
4. SmartScreen: **More info → Run anyway**. If the warning keeps coming back, unblock the file once: right-click `Pagebox.exe` → **Properties** → tick **Unblock** → **OK**. (PowerShell equivalent: `Unblock-File ~/Downloads/Pagebox.exe` — adjust the path to wherever you extracted it; Extract All usually creates a subfolder in Downloads.)
5. Optional: right-click `Pagebox.exe` → **Send to → Desktop (create shortcut)** so you don't have to dig through folders every time.
6. If you get *"This app has been blocked by your system administrator"* (AppLocker/WDAC), or SmartScreen shows no "Run anyway" button — that's school policy. Ask IT ([section below](#for-it-admins)).

Notes:

- Needs the **WebView2 Runtime** — preinstalled on virtually all school Windows PCs (it ships with Edge). If the window is blank or the app won't start, install the [Evergreen runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) from Microsoft.
- "Portable" means *no installer* — your notes still live in your Windows profile ([see below](#where-your-notes-are-stored)), so keep using the same account and you can move the app folder anywhere.

## Where your notes are stored

The app and your data are separate. Your pages live in your user profile:

| OS | Data folder |
| --- | --- |
| macOS | `~/Library/Application Support/com.pagebox.app` |
| Windows | `%APPDATA%\com.pagebox.app` |
| Linux | `~/.local/share/com.pagebox.app` |

Inside: **`app.db`** — one SQLite database holding everything: your pages' HTML,
version history, collections, and tags. No loose `.html` files.
**Backup = copy that folder** (or just `app.db`). Moving or replacing the app
never touches it.

If you ran a very early build you may also see a `pages.old/` folder — leftover
from the one-time automatic migration into the database. Your data lives in
`app.db` now.

## Updating & uninstalling

- **Portable:** download the new ZIP and replace the old app/folder. Your notes stay.
- **Installer:** run the new installer over the old one.
- **Uninstall:** delete the app — and the data folder above too, if you want your notes gone.

## For IT admins

Context you probably want before allowlisting:

- **What it is:** an open-source (MIT) notes app for AI-generated HTML, built with Tauri 2 (Rust + the system webview). All source is in this repo; release builds are produced by GitHub Actions (`.github/workflows/release.yaml`).
- **Why the warnings:** binaries are currently unsigned / un-notarized — hence Gatekeeper and SmartScreen. Code signing + notarization is the long-term fix.
- **Behavior:** no services, no drivers, no elevated privileges. All data is a single SQLite file in the per-user app-data directory (paths above); the app writes nowhere else. Previewed pages run in an opaque-origin sandboxed iframe with network blocked by default — details in [SECURITY.md](SECURITY.md).
- **Deployment options:** allowlist by hash/path; or repackage and push via Jamf Self Service / Intune Company Portal; the NSIS `-setup.exe` installs per-user without admin rights; the portable exe runs from any user-writable folder.
- App identifier: `com.pagebox.app`. Need hashes, a specific build, or anything else? Open an issue.

## Troubleshooting

| Symptom | What it means | Fix |
| --- | --- | --- |
| macOS: "Pagebox is damaged and can't be opened" | Quarantine flag on an unsigned app — not actual damage | Open Anyway, or the `xattr` step above |
| macOS: "Apple could not verify…" | Gatekeeper warning for unsigned apps | Right-click → Open, or Open Anyway |
| Windows: "Windows protected your PC" | SmartScreen warning for unsigned apps | More info → Run anyway |
| "Blocked by your (system) administrator" | School MDM policy / app allowlist | Ask IT — see [For IT admins](#for-it-admins) |
| Windows: blank window or won't start | WebView2 Runtime missing | Install the [Evergreen runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) |
| Mac: "bad CPU type in executable" | Wrong architecture for your Mac | Apple menu → About This Mac, then grab the other ZIP |
| Linux AppImage: FUSE error | `libfuse2` missing | `sudo apt install libfuse2` |
