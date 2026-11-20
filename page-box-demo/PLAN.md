# Pagebox Demo Video — Production Plan

Status: PLAN LOCKED — Rev 3 (S3/S4/S5 rewritten to Haidar's real recording flow:
two-segment takes + TimeSkip cards; captions deferred; takes live in public/video/)

> **Rev 4 — post-plan adjustments (Haidar's call, supersedes the bits below):**
> · S3 pt1 extended 300→450f so the prompt-template fill-in (topic + extras) and
>   the Copy-prompt/toast payoff are fully on screen (rate 1.8→1.7, trim 1.5s).
> · S3 TimeSkip now carries the AI disclaimer: any AI works — DeepSeek is used
>   here because it's free & fast.
> · S7 extended 360→570f: "school-managed Mac" → "school-managed device", plus a
>   first-launch warning-bypass beat (macOS `xattr -dr com.apple.quarantine …`,
>   Windows SmartScreen "More info → Run anyway" / `Unblock-File`). This overrides
>   risk C6's "no friction shown" — the copy stays honest (unsigned ≠ unsafe,
>   only bypass for apps you trust, ask IT if policy blocks it).
> · Runtime is now ~2:35 (4640f), not 2:00. Audio bed + QA stills derive their
>   timing from theme.ts/edit.ts via scripts/timing.mjs — run `pnpm audio` after
>   any re-cut.
Target: one polished YouTube demo, ~2:00, 1920×1080 @ 30fps, for Pagebox v0.1.2.
Method: real screen recordings + Remotion motion graphics. Remotion is the ENTIRE
timeline/editor (video-as-code) — no iMovie/CapCut in the pipeline.
Made on: MDM school MacBook Air (2560×1600 Retina), no installers, pnpm/Node only.
Devlog entry: deferred until after exam week (this doc is the spec until then).

---

## 1. Concept

Working hook: **"Your AI made a webpage. Now what?"**
One-liner: Pagebox is a notes app for AI-generated HTML — paste it, preview it
safely, organize it, iterate on it with your AI.

Tone: confident dev-tool demo. Honest: every product shot (S3–S5) is the real
app; S1's AI chat and S6/S7's sandbox/platform visuals are stylized Remotion
illustrations, labeled as such (see §2 beat sheets and risk C7).
Signature motif: **the box** — code fragments fly into a box, the box renders
a live page; versions stack as cards. Everything derives from that metaphor.

Audience: students/beginners using free AI tools (primary), devs/teachers and
portfolio reviewers (secondary). English VO; burned-in captions DEFERRED to a
later pass (Rev 3) — the Caption component stays in the inventory, unwired.

## 2. Storyboard (~120s = 3600 frames @ 30fps)

| # | Scene | Time | Frames | Source | Content |
|---|-------|------|--------|--------|---------|
| S1 | Hook | 0:00–0:10 | 300 | Remotion | Stylized AI chat spits a wall of HTML; files scatter into desktop chaos; kinetic type: "Now what?" |
| S2 | Sting | 0:10–0:16 | 180 | Remotion | Pagebox icon assembles, wordmark + tagline "A notes app for AI-generated HTML" |
| S3 | The AI loop | 0:16–0:38 | 660 | Record (2 segments) + TimeSkip | Add page → template prompt → Copy to AI → [TimeSkip card] → back in app → paste AI output → instant sandboxed preview → auto-title → save |
| S4 | Organize | 0:38–0:58 | 600 | Record + overlays | New collection created live → paste PREPARED HTML (no AI wait) → save; quick beats: "Move to" picker, tags, live search. (No drag-drop — not in v0.1) |
| S5 | Iterate with AI | 0:58–1:22 | 720 | Record (2 segments) + TimeSkip | "Copy for AI" on the saved page → [TimeSkip card] → ReplaceDialog → paste changed HTML → VersionStack graphic → History → restore |
| S6 | Safety | 1:22–1:40 | 540 | Remotion (pure) | Animated sandbox: network/files/app probes blocked at the box wall; stylized fetch fails with "Blocked by CSP" |
| S7 | Anywhere | 1:40–1:52 | 360 | Remotion (pure) | Platform cards → ZIP unpack animation → "No installer · No admin rights" → locked-laptop pass-through |
| S8 | Outro | 1:52–2:02 | 300 | Remotion | End card: logo, github.com/haidaralif-24/page-box, "Free · Open source · v0.1.2" |

Total ≈ 122s; trim S5/S6 by a few frames each at script lock to hit 120 exactly.

### S3/S4/S5 — recording beat sheets (Rev 3, Haidar's flow)

The AI round-trip is REAL but never recorded: each AI loop is two silent
segments joined by a Remotion TimeSkip card. The chat window (account name,
school email) never appears on screen — privacy and pacing in one cut.

S3 (660f): T1 ≈ 0–150f — Add page → template prompt dialog → Copy to AI
(toast). TimeSkip card ≈ 150–210f. T2 ≈ 210–660f — paste the AI output →
preview renders → auto-title → save. Zooms: prompt dialog (1.6×), paste
field (1.8×), preview reveal (1.5×). The full loop IS the hook's payoff.

S4 (600f): T3 — create a fresh collection live (name NOT in the seed set,
e.g. "Physics Demos") → Add page → paste the PREPARED HTML (clipboard-ready
before recording, zero AI wait) → save. Remaining frames: quick "Move to" /
tag / search beats over the seeded library. The scratch note holding the
prepared payload never appears on screen.

S5 (720f): T4 ≈ 0–120f — open the S3 page → "Copy for AI" (toast).
TimeSkip card ≈ 120–180f. T5 ≈ 180–720f — ReplaceDialog → paste the changed
HTML → save as new version → VersionStack graphic → History → restore v1.
Same loop as S3, one verb different: Replace, not Add.

TimeSkip card (new comp, ~60f, used twice): box motif — the page card
shrinks into the box, a prompt chip flies out, elapsed-time chip
("one prompt later…") springs in, box reopens. GitHub Dark, JetBrains Mono
chip. Replaces Rev 2's "3s stylized chat beat" in S5.

### S6 — Safety · pure Remotion beat sheet (540 local frames)

No footage. Animated SVG/React, faithful to the app's real behavior
(opaque-origin iframe sandbox + injected meta CSP, network off by default).

| Local frames | Beat |
|---|---|
| 0–90 | The rendered page card (same art as S3's preview) slides into a wireframe container; chip: `iframe sandbox` |
| 90–240 | Three escape probes, staggered ~50f each: network packet, file arrow, app/IPC arrow — each hits the box wall, danger flash #f85149, chips: "no network (default)" / "no file access" / "no app access" |
| 240–390 | Inside the box: stylized test page; `fetch("https://example.com")` types out in JetBrains Mono → red ✗ ripple → console-style toast "Blocked by CSP" |
| 390–540 | Pull back; success chips settle: "Sandboxed · Offline by default · Your Mac stays untouched". Corner microcopy (muted, small): "Animated illustration — behavior verified in the real app" |

VO unchanged (24 words ≈ 9.5s, fits 18s with air). SFX: three soft wall-thuds +
one error blip, low under VO. Reuses Callout/FeatureChip; new comp: SandboxDiagram.

### S7 — Anywhere · pure Remotion beat sheet (360 local frames)

No footage. New comps: PlatformRow + ZipUnpack.

| Local frames | Beat |
|---|---|
| 0–120 | Platform cards spring in staggered: macOS (Apple Silicon + Intel) · Windows · Linux — each carries an "Installer + portable ZIP" chip |
| 120–270 | Spotlight the ZIP: archive icon unzips → Pagebox app icon slides out → chips "No installer" / "No admin rights"; simple laptop outline with a padlock badge — the app icon passes through the lock (the MDM story, told visually) |
| 270–360 | Row settles; "Free · Open source" chip foreshadows S8; wipe to end card |

Honesty guards: no Gatekeeper/SmartScreen friction shown (per C6), but copy
never claims "zero warnings" — only "no installer, no admin rights", which is
exactly what the portable ZIP provides. Platform icons are simple drawn
glyphs, not official brand logos. VO unchanged (14 words ≈ 5.5s, fits 12s).

## 3. VO script (draft, ~195 words ≈ fits 120s with air)

- S1: "You asked an AI for a webpage. It gave you… a wall of HTML. Now what?"
- S2: "This is Pagebox — a notes app for AI-generated HTML."
- S3: "Start from the built-in prompt. Copy it to your AI, paste the answer back — Pagebox renders it instantly, sandboxed, and names it for you."
- S4: "Make a collection, drop in your next page. Tags, search — your experiments stop being 'final_final_v3.html'."
- S5: "Copy the page back to your AI, ask for changes, paste the new version in. Every version is kept — roll back anytime."
- S6: "Previews run in an opaque sandbox. No network by default, no access to your files or the app. AI code stays on a leash."
- S7: "Mac, Windows, Linux. Even locked-down school laptops — just unzip and run."
- S8: "Pagebox is free and open source. Link below — go make something."

Record one take per scene (Voice Memos / QuickTime, wired-earbud mic, quiet room,
48kHz). Normalize per clip; duck music under VO; overall loudness ≈ −14 LUFS.

## 4. Visual system (locked from the app's own theme)

Palette (exact tokens from page-box/src/App.css):
bg #0d1117 · inset #010409 · panel #161b22 · hover #21262d · border #30363d ·
text #e6edf3 · muted #7d8590 · accent #1f6feb · accent-fg #58a6ff ·
success #3fb950 · danger #f85149 · warning #d29922.

Type: Inter for UI/captions, JetBrains Mono for code (@remotion/google-fonts).
The video should feel like the app: same radii, same borders, same chips.

Motion language:
- Springs (Remotion default damping ~200) for entrances; 200–400ms transitions.
- Zoom-pans: 600ms ease-in-out, 1.5–2.2× into UI regions (retina source = crisp).
- Callouts: rounded-rect blue-glow highlight + label chip; cursor ripple on clicks.
- Feature name lower-thirds styled like the app's toasts.
- Captions: DEFERRED (Rev 3). When added: phrase-level, bottom-center, toast
  styling, burned in — a Caption layer over the finished timeline, no re-edit.
- Clean dev aesthetic: no grain, subtle glow on accents only.

## 5. Tech architecture — Remotion as the editor

Project: this folder (pagebox-demo), own git repo later; app repo untouched.
Setup: `pnpm create video` (Remotion 4, React+TS blank template). Node 22 ✓.
License: free for individuals ✓.

Compositions registered in Root:
- DemoVideo — 1920×1080 @ 30, ~3600f (the deliverable)
- Thumbnail — 1280×720 still (render with `remotion still` — thumbnail is code too)
- ReadmeGif — 960×540 @ 15fps, ~6s core loop (closes the roadmap "demo GIF" item)
- Short — 1080×1920, 30–40s cut (OPTIONAL Phase 4, reuses same scene comps)

Component inventory (build once, reuse across scenes):
- theme.ts — palette/type/motion tokens above
- ZoomPan — crop + scale keyframes over <OffthreadVideo> (the workhorse)
- Callout / Ripple / FeatureChip / Caption (Caption deferred, Rev 3)
- TimeSkip — timeskip transition card (S3/S5, new in Rev 3)
- CodeRain + MockChat (S1), BoxLogo (S2/S8), VersionStack (S5),
  SandboxDiagram + BlockedFetch (S6, animated SVG, pure graphics),
  PlatformRow + ZipUnpack (S7, pure graphics), EndCard (S8)

Assets in public/: video/*.mp4 (H.264 — Haidar's "video" folder; Remotion serves
static files from public/, so it lives at pagebox-demo/public/video/), vo/*.m4a,
music.mp3, sfx/*.wav, seed/*.html
Audio: per-scene <Sequence><Audio> for VO; music bed with volume-callback ducking;
SFX only on visible events (paste thunk, save pop, soft whoosh on transitions),
kept low under VO. Music: YouTube Audio Library / Pixabay, mellow synth ~90 BPM,
license-safe, credited in description.

Render: `remotion render DemoVideo out/pagebox-demo.mp4 --codec=h264 --crf=18`
(yuv420p, AAC). Iterate live in Remotion Studio. Fanless Air: 1080p30 keeps
renders short; split into two halves if thermals bite.

How editing works (pure Remotion — video is a first-class element):
1. Drop takes into public/video/ (transcode to H.264 first if HEVC, per C3).
2. Place a clip on the timeline:
   <Sequence from={210} durationInFrames={450}>
     <OffthreadVideo src={staticFile("video/t2-paste.mp4")} trimBefore={60} />
   </Sequence>
   from/durationInFrames position it; trimBefore/trimAfter cut head/tail in
   frames; playbackRate speeds a segment. OffthreadVideo extracts exact
   frames at render time — no dropped-frame seek glitches.
3. Wrap the clip in ZoomPan for the 1.5–2.2× push-ins; Callout/Ripple on top.
4. Editing = change numbers in code, see the result instantly: Remotion
   Studio (pnpm dev) is a live preview with a scrubbable timeline + hot
   reload. It is NOT a drag-and-drop NLE — no ripple-drag trimming; the
   code IS the timeline, git-versioned like the app.
5. A timeskip = a Sequence boundary between two clips with the TimeSkip
   card comp filling the gap. No footage of the wait ever exists.
6. Final: remotion render → one H.264 mp4. Captions later = add the Caption
   layer over the locked timeline and re-render; nothing else moves.

Why Remotion-as-editor over NLE + overlay exports: one tool, frame-accurate
zooms (critical for desktop-UI legibility on phones), reproducible renders,
multi-format reuse (GIF/Shorts/thumbnail), and "the demo video is code too"
is a genuine portfolio story consistent with the devlog ethos.

## 6. Recording playbook (real app, silent takes)

Pre-flight (~15 min):
1. TEST SCREEN-RECORDING PERMISSION FIRST: Cmd+Shift+5, record 5s, play back.
   If MDM blocks it, stop — see Risks C1.
2. Focus/Do Not Disturb ON (no notification pop-ups mid-take).
3. Wallpaper: solid #0d1117 image; quit unrelated apps; hide desktop icons
   (`defaults write com.apple.finder CreateDesktop false; killall Finder`,
   reverse afterwards). Pointer size +1 notch (Accessibility → Display).
4. Pagebox window ~1280×800 pt, centered. Record ENTIRE screen (2560×1600
   retina = zoom headroom); menu bar gets cropped out in Remotion.
5. Seed data loaded (below). Verify exact UI flows: New page dialog, template
   prompt dialog, auto-title, "Move to" picker on PageCard, ReplaceDialog,
   VersionHistory, "Copy for AI". Prepared payloads clipboard-ready (shot list).

Seed data (generated as real HTML files in Phase 1, pasted in beforehand):
- Collections: "School Projects", "Experiments", "For Fun"
- Pages: Solar System Explorer (School Projects, #school #space),
  Physics Quiz (School Projects, #school), Particle Playground (Experiments,
  #game, 3 versions pre-staged), Recipe Card (For Fun, #cooking),
  Portfolio Landing (Experiments, #landing)

Shot list (Rev 3) — short silent takes, 2–3 attempts each, retakes are cheap.
Two-segment AI loops: record segment A, do the real AI round-trip OFF camera
(or use the prepared output), then record segment B. Save as t1…t5 in
public/video/ (t1-prompt.mp4 … t5-replace.mp4):
| Take | Action | Used in |
|------|--------|---------|
| T1 | Add page → template prompt dialog → Copy to AI (toast) | S3a |
| T2 | Paste the AI output → preview renders → auto-title → save | S3b |
| T3 | Create new collection live → Add page → paste PREPARED HTML → save; then "Move to" / tag / search quick beats | S4 |
| T4 | Open the S3 page → "Copy for AI" (toast confirms) | S5a |
| T5 | ReplaceDialog → paste changed HTML → History → restore v1 | S5b |

Still 5 takes. Prepared payloads (clipboard-ready before recording, kept in
a scratch note that never appears on screen): S4's fresh page HTML + S5's
changed version of the S3 page. The AI chat itself is NEVER recorded.

The security test page is DECOUPLED from the video: still worth writing later
as the roadmap's "security test pages" fixture in the app repo, and it's the
reference for verifying the S6 animation matches real behavior — but it is
not a recording dependency anymore.

Post-capture: move takes into pagebox-demo/public/video/; check codec
(`ffprobe` or QuickTime info). If HEVC, transcode:
`ffmpeg -i take.mov -c:v libx264 -crf 16 -c:a copy take.mp4` (brew ffmpeg or a
static binary — no installer needed). Trim dead air with ffmpeg -ss/-to.

Privacy: crop menu bar (username/clock) in every ZoomPan; no Finder paths with
real name beyond the public GitHub handle; hook chat is a mock, never a real
account; no school apps/notifications visible.

## 7. YouTube package

Title (pick at upload): "Pagebox — a notes app for AI-generated HTML (v0.1 demo)"
or hook-first "Your AI made a webpage. Now what?"
Thumbnail: Remotion still — real app preview + logo + ≤4 words ("AI HTML, organized").
Description: one-liner, GitHub + Releases links, pointer to INSTALLATION.md for
Gatekeeper/SmartScreen notes (never show install friction in the video itself),
chapters = scene times, credits (music, Remotion, "built with AI assistance" line),
plus one honesty line: "Sandbox sequence is an animation of verified behavior."
README follow-up: embed ReadmeGif + video link → closes roadmap "demo GIF".

## 8. Risks & checkpoints (test-first, MDM reality)

- C1 Screen-recording permission denied by MDM → blocks S3–S5 ONLY (5 of 8
  scenes are pure graphics and proceed regardless). Fallback: record on a
  personal device, or screenshot-sequence + animated mock (weaker; last resort).
- C2 Remotion's Chrome Headless Shell (auto-downloaded on first render) blocked
  by Gatekeeper → test a 1-frame render immediately after scaffold. pnpm pulls
  don't set quarantine, so expected to pass.
- C3 QuickTime HEVC output → ffmpeg transcode (see §6).
- C4 Fanless thermals on long renders → 1080p30, chunk renders if needed.
- C5 Storyboard assumes v0.1 UI only (picker move, NOT drag-drop). Verify flows
  during pre-flight; adjust takes, never fake features.
- C6 Unsigned-app warnings: excluded from the demo; documented in description.
- C7 S6/S7 are illustrations, not footage → the animation must match real
  behavior exactly (CSP blocks network by default; sandbox has no file/app
  access; ZIP needs no installer/admin). Verify against the app before render;
  label S6 as animated; never animate a capability the app doesn't have.

## 9. Phases & effort (around exam week)

- P0 — Plan review (this doc). ~15 min. Veto/adjust defaults below.
- P1 — Assets: checkpoint tests C1/C2, seed pages, 5 takes, VO. ~1.5h, one sitting.
- P2 — Remotion build: scaffold + theme + 8 scene comps. ~3–4 focused sessions,
  AI-assisted (logged honestly in the post-exam devlog).
  NEW in Rev 2: split into P2a (graphics-only: S1, S2, S6, S7, S8 + the
  TimeSkip card — footage-independent, buildable anytime, even before P1)
  and P2b (S3–S5 ZoomPan comps, which wait on real takes so footage
  dimensions/timing drive them).
- P3 — Render + review: watch 3× (sound on, sound off, on a phone), fix, upload. ~1h.
- P4 — LATER PASS: burned captions (deferred in Rev 3) + optional 30s Shorts
  cut, README GIF, thumbnail still. ~1 session.

Order: C2 checkpoint before ANY Remotion work; C1 before P1 recording only.
P2a can run in exam-week gaps without touching screen recording at all.

## 10. Locked defaults (veto anytime before P1)

1. Length ~2:00 (not 2:30+) — retention beats completeness; features not shown
   live in the README.
2. English VO now; burned captions DEFERRED to a later pass (Rev 3) — added
   as a layer over the locked timeline, no re-edit needed.
3. Remotion is the whole editor; no NLE.
4. Separate pagebox-demo project; app repo stays clean until the GIF/test-page
   follow-ups.
5. Shorts/GIF/thumbnail are Phase 4 extras, not blockers for upload.
6. Devlog deferred until after exams — but this plan + the video repo are the
   raw material for it.