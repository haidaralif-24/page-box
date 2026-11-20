// Synthesizes the demo's audio bed: a quiet ambient pad progression plus
// event-synced SFX (whooshes on TimeSkips, wall-thuds in S6, chimes on
// success beats). Pure Node — no samples, no licenses, fully reproducible.
// VO is a later pass: it layers on top as a separate <Audio> in Demo.tsx.
//
// All event times are DERIVED from src/theme.ts (SCENES) and src/edit.ts
// (SLOTS) via scripts/timing.mjs, so re-cutting the video never desyncs the
// bed. Run `pnpm audio` after any timing change.
import fs from "node:fs";
import path from "node:path";
import { SCENES, SLOTS, OFFSETS, TOTAL, FPS } from "./timing.mjs";

const SR = 44100;
const DUR = TOTAL / FPS;
const N = Math.ceil(SR * DUR);
const L = new Float64Array(N);
const R = new Float64Array(N);
const sec = (fr) => fr / FPS;

// Deterministic PRNG so every render sounds identical.
let seed = 0x9e3779b9;
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const add = (t0, dur, fn, amp, pan = 0) => {
  const s = Math.max(0, Math.floor(t0 * SR));
  const e = Math.min(N, Math.floor((t0 + dur) * SR));
  const gl = Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = s; i < e; i++) {
    const v = fn((i - s) / SR, i / SR) * amp;
    L[i] += v * gl; R[i] += v * gr;
  }
};

const envAR = (t, dur, a, r) =>
  Math.min(1, t / a) * Math.min(1, Math.max(0, (dur - t) / r));

// ── Pad progression: Am F C G ×2, one chord per scene-ish block ─────────
const CHORDS = [
  [110.0, 130.81, 164.81, 220.0],   // Am
  [87.31, 110.0, 130.81, 174.61],   // F
  [130.81, 164.81, 196.0, 261.63],  // C
  [98.0, 123.47, 146.83, 196.0],    // G
];
const BLOCK = DUR / 8;
for (let b = 0; b < 8; b++) {
  const chord = CHORDS[b % 4];
  const t0 = b * BLOCK - (b === 0 ? 0 : 1.2);
  const dur = BLOCK + (b === 0 ? 0 : 1.2) + (b === 7 ? 0 : 1.2);
  chord.forEach((f, vi) => {
    for (const det of [-0.0012, 0.0012]) {
      const ph = rnd() * Math.PI * 2;
      const lfo = 0.1 + rnd() * 0.08;
      add(t0, dur, (t) => {
        const e = envAR(t, dur, 2.6, 2.8);
        const trem = 0.85 + 0.15 * Math.sin(2 * Math.PI * lfo * t + ph);
        return Math.sin(2 * Math.PI * f * (1 + det) * t + ph) * e * trem;
      }, 0.026, (vi % 2 ? 0.35 : -0.35) * (det > 0 ? 1 : -1));
    }
  });
  // sub root
  add(t0, dur, (t) => Math.sin(2 * Math.PI * (chord[0] / 2) * t) * envAR(t, dur, 3, 3), 0.045);
}

// ── Pluck motif (the "box" motif: three rising notes) at scene starts ───
const pluck = (t0, f, amp = 0.1) => {
  add(t0, 1.0, (t) => {
    const e = Math.exp(-t * 4.2);
    return (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(4 * Math.PI * f * t)
      + 0.12 * Math.sin(6 * Math.PI * f * t)) * e;
  }, amp, 0.15);
};
const motif = (t0, notes = [440, 523.25, 659.25]) =>
  notes.forEach((f, i) => pluck(t0 + i * 0.1, f, 0.085));
[OFFSETS.S2, OFFSETS.S3, OFFSETS.S4, OFFSETS.S5, OFFSETS.S6, OFFSETS.S7]
  .forEach((fr) => motif(sec(fr)));
motif(sec(OFFSETS.S8), [523.25, 659.25, 783.99]); // S8 resolves up

// ── Whoosh on the two TimeSkip cards ────────────────────────────────────
const whoosh = (t0) => {
  let prev = 0, lp = 0;
  add(t0, 0.85, (t) => {
    const x = rnd() * 2 - 1;
    const hp = x - prev; prev = x;
    lp += 0.28 * (hp - lp);
    const e = Math.sin(Math.PI * Math.min(1, t / 0.85)) ** 2;
    return lp * e * 3;
  }, 0.11, -0.1);
};
whoosh(sec(OFFSETS.S3 + SLOTS.S3.intro + SLOTS.S3.pt1)); // S3 skip
whoosh(sec(OFFSETS.S5 + SLOTS.S5.intro + SLOTS.S5.pt1)); // S5 skip

// ── S6: three wall-thuds + CSP error blip + success ticks ───────────────
// Local frames match S6Sandbox.tsx: probes land at 186/246/306, the fetch
// is blocked at 396, success chips spring at 424/436/448.
const thud = (t0) => {
  add(t0, 0.4, (t) => {
    const f = 95 * Math.exp(-t * 5) + 48;
    return Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 9);
  }, 0.24);
  add(t0, 0.03, () => (rnd() * 2 - 1), 0.05);
};
[186, 246, 306].forEach((fr) => thud(sec(OFFSETS.S6 + fr)));
// error blip (two descending pulses)
add(sec(OFFSETS.S6 + 396), 0.09, (t) => (Math.sin(2 * Math.PI * 392 * t) + 0.25 * Math.sin(6 * Math.PI * 392 * t)) * Math.min(1, t / 0.01) * Math.exp(-t * 14), 0.07, 0.2);
add(sec(OFFSETS.S6 + 396) + 0.14, 0.12, (t) => (Math.sin(2 * Math.PI * 311 * t) + 0.25 * Math.sin(6 * Math.PI * 311 * t)) * Math.min(1, t / 0.01) * Math.exp(-t * 12), 0.07, 0.2);
// success chip ticks
[424, 436, 448].forEach((fr, i) =>
  add(sec(OFFSETS.S6 + fr), 0.5, (t) => Math.sin(2 * Math.PI * (1046.5 + i * 120) * t) * Math.exp(-t * 7), 0.055, 0.25));

// ── S7: zip rustle + managed-machine chime + warning-card ticks ─────────
// Local frames match S7Platforms.tsx: zip opens at 140, the managed-device
// check lands at 272, the macOS/Windows warning cards spring at 336/350.
{
  let lp = 0;
  add(sec(OFFSETS.S7 + 140), 0.5, (t) => {
    const x = rnd() * 2 - 1;
    lp += 0.4 * (x - lp);
    return (x - lp) * Math.sin(Math.PI * Math.min(1, t / 0.5)) ** 2;
  }, 0.08, -0.2);
}
add(sec(OFFSETS.S7 + 272), 0.8, (t) => (Math.sin(2 * Math.PI * 783.99 * t) + 0.5 * Math.sin(2 * Math.PI * 1046.5 * t)) * Math.exp(-t * 5), 0.075, 0.15);
// two soft ticks as the warning-bypass cards arrive
[336, 350].forEach((fr, i) =>
  add(sec(OFFSETS.S7 + fr), 0.4, (t) => Math.sin(2 * Math.PI * (880 + i * 110) * t) * Math.exp(-t * 8), 0.05, i ? 0.2 : -0.2));

// ── S1 "Now what?" boom + S8 closing swell ──────────────────────────────
add(sec(222), 1.5, (t) => Math.sin(2 * Math.PI * 55 * t) * Math.exp(-t * 2.6), 0.17);
add(sec(222), 0.35, (t) => (rnd() * 2 - 1) * Math.exp(-t * 12), 0.03);
[261.63, 329.63, 392.0, 523.25].forEach((f, i) =>
  add(sec(OFFSETS.S8), 9, (t) => Math.sin(2 * Math.PI * f * t + i) * envAR(t, 9, 1.8, 4.5), 0.04, i % 2 ? 0.3 : -0.3));

// ── Master: fades, soft-clip, normalize, write WAV ──────────────────────
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const g = Math.min(1, t / 1.2) * Math.min(1, Math.max(0, (DUR - t) / 3));
  L[i] = Math.tanh(L[i] * g * 1.4);
  R[i] = Math.tanh(R[i] * g * 1.4);
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = 0.55 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(L[i] * norm * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(R[i] * norm * 32767), 46 + i * 4);
}
const out = path.resolve(import.meta.dirname, "../public/audio");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "bed.wav"), buf);
console.log(`wrote public/audio/bed.wav (${DUR.toFixed(2)}s = ${TOTAL}f @${FPS}fps, peak normalized to 0.55)`);
