// Single source of truth for timeline math in Node scripts.
// Parses SCENES from src/theme.ts and SLOTS from src/edit.ts (the same
// literals Remotion uses), so audio SFX and QA stills can never drift out
// of sync with the video when scene/slot lengths change.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const themeSrc = fs.readFileSync(path.join(root, "src/theme.ts"), "utf8");
const editSrc = fs.readFileSync(path.join(root, "src/edit.ts"), "utf8");

const scenesBlock = themeSrc.match(/export const SCENES = \{([\s\S]*?)\}/);
if (!scenesBlock) throw new Error("timing: could not find SCENES in src/theme.ts");
export const SCENES = Object.fromEntries(
  [...scenesBlock[1].matchAll(/(S\d):\s*(\d+)/g)].map((m) => [m[1], Number(m[2])]),
);
if (Object.keys(SCENES).length !== 8) throw new Error("timing: expected 8 scenes in SCENES");

const slotsBlock = editSrc.match(/export const SLOTS = \{([\s\S]*?)\} as const/);
if (!slotsBlock) throw new Error("timing: could not find SLOTS in src/edit.ts");
export const SLOTS = Object.fromEntries(
  [...slotsBlock[1].matchAll(/(S\d):\s*\{([^}]+)\}/g)].map((m) => [
    m[1],
    Object.fromEntries([...m[2].matchAll(/(\w+):\s*(\d+)/g)].map((p) => [p[1], Number(p[2])])),
  ]),
);

// Every slot budget must sum exactly to its scene length.
for (const [id, slots] of Object.entries(SLOTS)) {
  const sum = Object.values(slots).reduce((a, b) => a + b, 0);
  if (sum !== SCENES[id]) {
    throw new Error(`timing: SLOTS.${id} sums to ${sum}, but SCENES.${id} = ${SCENES[id]}`);
  }
}

export const FPS = 30;
export const OFFSETS = (() => {
  const o = {};
  let acc = 0;
  for (const [k, v] of Object.entries(SCENES)) { o[k] = acc; acc += v; }
  return o;
})();
export const TOTAL = Object.values(SCENES).reduce((a, b) => a + b, 0);
