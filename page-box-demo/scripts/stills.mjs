// QA: one still per scene from the full Demo timeline.
// Frames are derived from src/theme.ts + src/edit.ts via scripts/timing.mjs,
// so they always land inside the intended scene/beat after a re-cut.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { SLOTS, OFFSETS } from "./timing.mjs";

const frames = {
  S1: OFFSETS.S1 + 230,                                            // "Now what?" boom
  S2: OFFSETS.S2 + 150,                                            // wordmark + tagline
  S3: OFFSETS.S3 + SLOTS.S3.intro + 230,                           // mid template-fill (pt1)
  S4: OFFSETS.S4 + 300,                                            // live search results
  S5: OFFSETS.S5 + SLOTS.S5.intro + SLOTS.S5.pt1 + SLOTS.S5.skip + 300, // version history (pt2)
  S6: OFFSETS.S6 + 300,                                            // sandbox probes blocked
  S7: OFFSETS.S7 + 420,                                            // warning-bypass cards
  S8: OFFSETS.S8 + 200,                                            // end card
};
fs.mkdirSync("out", { recursive: true });
for (const [id, frame] of Object.entries(frames)) {
  console.log(`still ${id} @${frame}`);
  execFileSync("npx", ["remotion", "still", "Demo", `out/qa-${id}.png`, `--frame=${frame}`],
    { stdio: "inherit" });
}
console.log("done -> out/qa-*.png");
