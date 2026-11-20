// ── Edit decision list for the recorded takes ─────────────────────────────
// All times in SECONDS of source footage (60 fps). `rate` speeds the take up
// to fit its slot; VideoSlot auto-slows if the take is shorter than needed.
// Cursor path: f = frame inside the slot, x/y = cursor position in source-
// normalized coords (0..1). The ZoomPan component smoothly follows these
// positions and applies a gentle zoom (zoomLevel 0.15 ≈ 1.15×) centered on
// the cursor, so the whole app stays readable. Optional pullbacks: frame
// ranges where zoom drops to ~1.0× to show the full app.

import type { CursorKey, Pullback } from "./components/ZoomPan";

export type Take = {
  trimStartSec: number;
  rate: number;
  cursor: CursorKey[];
  pullbacks?: Pullback[];
  /** Extra zoom above cover-fit. Default 0.4 = 1.4× total. */
  zoomLevel?: number;
};

// ─── Estimated cursor paths ──────────────────────────────────────────────
// These are hand-tuned estimates based on the known UI flow. Refine them in
// Remotion Studio by scrubbing the timeline and adjusting coordinates until
// the zoom naturally follows the real cursor in your recordings.
// x/y are normalized (0..1) relative to the source footage (3360×2100).

export const EDL: Record<string, Record<string, Take>> = {
  S3: {
    // Add page → "Generate a lesson with AI" → fill topic + extras → Copy prompt.
    // Real take map (verified against S3-pt1.mov): grid 0–5s · Add dialog ~5–9s ·
    // Generate dialog opens ~10s · topic typed ~10–12.5s · extras typed ~13–19s ·
    // prompt preview reviewed ~19–24s · Copy prompt clicked ~24.5s · toast ~25–27.5s.
    // trim 1.5s + rate 1.7 over a 450f (15s) slot covers source ~1.5–27s, so the
    // whole template-fill AND the copy/toast payoff are on screen, at a calmer pace.
    pt1: {
      trimStartSec: 1.5,
      rate: 1.7,
      zoomLevel: 0.15, // subtle cursor-follow zoom; whole app stays visible
      cursor: [
        { f: 0, x: 0.5, y: 0.45 },       // idle, viewing grid
        { f: 40, x: 0.66, y: 0.28 },     // smooth pan towards "+ Add page"
        { f: 62, x: 0.78, y: 0.175 },    // clicking "+ Add page" (app header, top-right)
        { f: 80, x: 0.62, y: 0.32 },     // Add dialog opens, pan in
        { f: 105, x: 0.5, y: 0.4 },      // hovering "Generate a lesson with AI" banner
        { f: 132, x: 0.5, y: 0.4 },      // clicking the banner
        { f: 150, x: 0.5, y: 0.42 },     // Generate dialog opens → Material / Topic field
        { f: 165, x: 0.55, y: 0.42 },    // typing the topic…
        { f: 195, x: 0.6, y: 0.42 },     // …topic finished
        { f: 210, x: 0.5, y: 0.56 },     // move down to Additional instructions
        { f: 235, x: 0.52, y: 0.56 },    // typing extras…
        { f: 300, x: 0.55, y: 0.58 },    // …extras finished
        { f: 320, x: 0.5, y: 0.7 },      // reviewing the live prompt preview
        { f: 365, x: 0.55, y: 0.74 },    // still on the preview
        { f: 395, x: 0.66, y: 0.82 },    // move to "Copy prompt" (dialog bottom-right)
        { f: 408, x: 0.66, y: 0.82 },    // click Copy prompt
        { f: 420, x: 0.55, y: 0.7 },     // toast appears, pan toward center
        { f: 450, x: 0.5, y: 0.55 },     // end on full app + "Prompt copied!" toast
      ],
      pullbacks: [{ from: 400, to: 450 }], // pull back after copy: full app + toast
    },
    // Paste HTML → Detected title → Save → preview renders (~0-21s of take)
    pt2: {
      trimStartSec: 0,
      rate: 1.6,
      zoomLevel: 0.15,
      cursor: [
        { f: 0, x: 0.5, y: 0.45 },       // idle
        { f: 10, x: 0.65, y: 0.25 },     // smooth pan towards top right
        { f: 15, x: 0.82, y: 0.06 },     // clicking "+ Add page"
        { f: 25, x: 0.65, y: 0.3 },      // smooth pan to paste field
        { f: 35, x: 0.5, y: 0.55 },      // paste field (textarea)
        { f: 75, x: 0.5, y: 0.55 },      // pasting HTML
        { f: 100, x: 0.5, y: 0.45 },     // smooth pan up to title
        { f: 120, x: 0.5, y: 0.35 },     // detected title appearing at top
        { f: 145, x: 0.55, y: 0.45 },    // smooth pan to save button
        { f: 165, x: 0.65, y: 0.6 },     // clicking "Save page"
        { f: 190, x: 0.6, y: 0.55 },     // preview pane rendering
        { f: 210, x: 0.55, y: 0.5 },     // holding on preview
        { f: 300, x: 0.55, y: 0.5 },     // holding on preview
        { f: 340, x: 0.5, y: 0.45 },     // pulling back
        { f: 380, x: 0.5, y: 0.45 },     // end
      ],
      pullbacks: [{ from: 300, to: 380 }], // show full app with new page card
    },
  },
  S4: {
    // Live search — full 15.2s take at 1×, bookended by graphics.
    pt1: {
      trimStartSec: 0,
      rate: 1.0,
      zoomLevel: 0.15,
      cursor: [
        { f: 0, x: 0.5, y: 0.45 },       // viewing full library
        { f: 20, x: 0.52, y: 0.25 },     // smooth pan to search
        { f: 35, x: 0.53, y: 0.06 },     // clicking search field
        { f: 80, x: 0.53, y: 0.06 },     // typing "water"
        { f: 110, x: 0.52, y: 0.25 },    // smooth pan down to results
        { f: 140, x: 0.5, y: 0.4 },      // viewing filtered results
        { f: 200, x: 0.5, y: 0.4 },      // holding on results
        { f: 230, x: 0.52, y: 0.25 },    // smooth pan back to search
        { f: 250, x: 0.53, y: 0.06 },    // back to search
        { f: 290, x: 0.53, y: 0.06 },    // clearing, typing "physics"
        { f: 320, x: 0.52, y: 0.25 },    // smooth pan down to results
        { f: 350, x: 0.5, y: 0.4 },      // results update live
        { f: 430, x: 0.5, y: 0.45 },     // pulling back
        { f: 500, x: 0.5, y: 0.45 },     // full view
        { f: 600, x: 0.5, y: 0.45 },     // end
      ],
      pullbacks: [{ from: 430, to: 600 }],
    },
  },
  S5: {
    // Copy for AI → templates (Fix bugs selected) → Copy (~0-17.6s)
    pt1: {
      trimStartSec: 0,
      rate: 1.6,
      zoomLevel: 0.15,
      cursor: [
        { f: 0, x: 0.5, y: 0.45 },       // viewing page
        { f: 15, x: 0.6, y: 0.38 },      // smooth pan to button
        { f: 25, x: 0.72, y: 0.32 },     // "Copy for AI" button on card
        { f: 40, x: 0.6, y: 0.4 },       // smooth pan to center
        { f: 55, x: 0.5, y: 0.5 },       // CopyForAIDialog opens
        { f: 100, x: 0.5, y: 0.55 },     // selecting "Fix bugs" template
        { f: 160, x: 0.5, y: 0.55 },     // holding on templates
        { f: 185, x: 0.55, y: 0.58 },    // smooth pan to copy button
        { f: 210, x: 0.62, y: 0.62 },    // "Copy" button
        { f: 235, x: 0.55, y: 0.55 },    // toast confirms copy
        { f: 260, x: 0.5, y: 0.5 },      // center
        { f: 300, x: 0.5, y: 0.5 },      // end
        { f: 320, x: 0.5, y: 0.5 },
      ],
      pullbacks: [{ from: 260, to: 320 }],
    },
    // Replace → paste fix → version history → restore (~0-21.3s)
    pt2: {
      trimStartSec: 0,
      rate: 1.5,
      zoomLevel: 0.15,
      cursor: [
        { f: 0, x: 0.5, y: 0.45 },       // viewing page
        { f: 15, x: 0.6, y: 0.38 },      // smooth pan to button
        { f: 25, x: 0.72, y: 0.32 },     // "Replace" button
        { f: 40, x: 0.6, y: 0.4 },       // smooth pan to center
        { f: 55, x: 0.5, y: 0.5 },       // ReplaceDialog opens
        { f: 70, x: 0.5, y: 0.55 },      // smooth pan to paste field
        { f: 80, x: 0.5, y: 0.6 },       // paste field
        { f: 130, x: 0.5, y: 0.6 },      // pasting changed HTML
        { f: 155, x: 0.5, y: 0.5 },      // smooth pan to history
        { f: 180, x: 0.5, y: 0.4 },      // version history panel
        { f: 250, x: 0.5, y: 0.4 },      // viewing versions
        { f: 280, x: 0.55, y: 0.45 },    // smooth pan to restore button
        { f: 310, x: 0.6, y: 0.5 },      // restore v1 button
        { f: 335, x: 0.55, y: 0.48 },    // restored, smooth pan to center
        { f: 360, x: 0.5, y: 0.45 },     // restored, full view
        { f: 400, x: 0.5, y: 0.45 },     // end
      ],
      pullbacks: [{ from: 310, to: 400 }],
    },
  },
};

// Slot budgets inside each scene (frames @30fps). Must sum to SCENES values.
export const SLOTS = {
  S3: { intro: 50, pt1: 450, skip: 80, pt2: 380, outro: 90 },
  S4: { intro: 60, footage: 600, outro: 90 },
  S5: { intro: 50, pt1: 320, skip: 80, pt2: 400, outro: 100 },
} as const;
