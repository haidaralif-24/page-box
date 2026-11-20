import { Easing, spring } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const inter = loadInter("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"], ignoreTooManyRequestsWarning: true });
const mono = loadMono("normal", { weights: ["400", "700"], subsets: ["latin"], ignoreTooManyRequestsWarning: true });

// Pagebox app tokens (src/App.css) — the video should feel like the app.
export const C = {
  bg: "#0d1117",
  inset: "#010409",
  panel: "#161b22",
  hover: "#21262d",
  border: "#30363d",
  text: "#e6edf3",
  muted: "#7d8590",
  accent: "#1f6feb",
  accentFg: "#58a6ff",
  success: "#3fb950",
  danger: "#f85149",
  warning: "#d29922",
  purple: "#bc8cff",
  logo: "#6c8cff",
  logoSoft: "#aab8ff",
};

export const FONT = {
  sans: `${inter.fontFamily}, -apple-system, "SF Pro Display", sans-serif`,
  mono: `${mono.fontFamily}, ui-monospace, "SF Mono", Menlo, monospace`,
};

export const FPS = 30;
export const W = 1920;
export const H = 1080;

export const SCENES = {
  S1: 300, S2: 180, S3: 1050, S4: 750, S5: 950, S6: 540, S7: 570, S8: 300,
} as const;
// S3 grew 900→1050 (pt1 300→450: show the prompt template being filled in).
// S7 grew 360→570 (added the first-launch warning-bypass beat: xattr / SmartScreen).
export const TOTAL = Object.values(SCENES).reduce((a, b) => a + b, 0); // 4640 ≈ 2:35

export const OFFSETS = (() => {
  const o: Record<string, number> = {};
  let acc = 0;
  for (const [k, v] of Object.entries(SCENES)) { o[k] = acc; acc += v; }
  return o;
})();

export const easeOut = Easing.out(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);

/** Delayed spring, clamped to 0 before its delay. */
export const spr = (frame: number, delay = 0, damping = 200, stiffness = 100) =>
  frame <= delay ? 0 : spring({ frame: frame - delay, fps: FPS, config: { damping, stiffness } });

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
