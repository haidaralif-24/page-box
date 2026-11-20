# page-box-demo

Remotion project that produces the Pagebox demo video — composition `Demo`,
1920×1080 @ 30fps, 4640 frames (~2:35). Code-driven scenes + recorded takes,
cut deterministically from `src/theme.ts` (SCENES) and `src/edit.ts` (SLOTS).

## Local setup

```bash
pnpm install

# Recorded takes (~200 MB) are NOT in git — they live on the demo-footage-v1
# prerelease. Pull them into public/videos/:
gh release download demo-footage-v1 -p '*.mov' -D public/videos

pnpm audio    # synthesizes public/audio/bed.wav (pure Node, deterministic)
pnpm studio
```

### School-managed Macs (Scalefusion MDM + Veltar SecureWebGateway)

The SWG stalls Chrome's loopback HTTP and the bundled headless shell aborts
on macOS 26, so two extra steps are needed (details in `remotion.config.ts`):

```bash
node scripts/browser.mjs            # full Chrome for Testing into .browser/
node scripts/patch-remotion-lan.mjs # serve bundle + video proxy via LAN IP
```

Re-run the patch after **every** `pnpm install` (it patches node_modules).
Neither step is needed on normal machines or in CI.

## Render

```bash
pnpm render   # full quality (crf 18), slow

# fast/small version for the README (540p — scale must yield integer
# dimensions, so 0.5 works but 0.6667 does not):
pnpm exec remotion render Demo out/pagebox-demo-web.mp4 \
  --codec=h264 --crf=28 --x264-preset=veryfast --scale=0.5 --concurrency=8
```

## Render on GitHub Actions

Repo → **Actions → Render demo → Run workflow**. Pick `web` (540p, small) or
`full` (1080p), optionally a frame range (e.g. `520-610`) for a quick test.
The job downloads the takes from the `demo-footage-v1` prerelease, regenerates
the audio bed, renders on `ubuntu-latest`, and uploads the mp4 as a build
artifact. No local machine needed.
