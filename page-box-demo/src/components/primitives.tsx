import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, clamp01, easeOut, spr } from "../theme";

/** Top-left numbered scene chip. */
export const SceneChip: React.FC<{ n: string; label: string; delay?: number }> = ({
  n, label, delay = 0,
}) => {
  const f = useCurrentFrame();
  const p = spr(f, delay, 18);
  return (
    <div style={{
      position: "absolute", top: 56, left: 64, display: "flex", alignItems: "center", gap: 16,
      transform: `translateX(${(1 - p) * -60}px)`, opacity: p,
    }}>
      <div style={{
        fontFamily: FONT.mono, fontSize: 26, fontWeight: 700, color: C.accentFg,
        border: `1px solid ${C.accent}66`, background: `${C.accent}1a`,
        borderRadius: 10, padding: "6px 14px",
      }}>{n}</div>
      <div style={{ fontFamily: FONT.sans, fontSize: 30, fontWeight: 700, color: C.text, letterSpacing: 0.5 }}>
        {label}
      </div>
    </div>
  );
};

/** Lower-third callout pill with accent glow; springs in at `from`, out before `to`. */
export const Callout: React.FC<{
  from: number; to: number; children: React.ReactNode; tone?: "accent" | "success";
}> = ({ from, to, children, tone = "accent" }) => {
  const f = useCurrentFrame();
  const inP = spr(f, from, 16);
  const outP = interpolate(f, [to - 12, to], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const p = Math.min(inP, outP);
  const col = tone === "success" ? C.success : C.accentFg;
  const edge = tone === "success" ? C.success : C.accent;
  if (p <= 0) return null;
  return (
    <div style={{
      position: "absolute", bottom: 64, left: 0, right: 0, display: "flex", justifyContent: "center",
      opacity: p, transform: `translateY(${(1 - p) * 40}px)`,
    }}>
      <div style={{
        fontFamily: FONT.sans, fontSize: 34, fontWeight: 600, color: C.text,
        background: `${C.panel}f2`, border: `1.5px solid ${edge}88`, borderRadius: 16,
        padding: "18px 34px", boxShadow: `0 0 44px ${edge}44, 0 12px 40px #00000088`,
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <span style={{ width: 12, height: 12, borderRadius: 6, background: col, boxShadow: `0 0 14px ${col}` }} />
        {children}
      </div>
    </div>
  );
};

/** Animated mouse cursor with click ripple. x/y in stage px. */
export const Cursor: React.FC<{ x: number; y: number; clickAt?: number }> = ({ x, y, clickAt = -100 }) => {
  const f = useCurrentFrame();
  const since = f - clickAt;
  const rip = since >= 0 && since < 18 ? spr(since, 0, 14) : 0;
  return (
    <div style={{ position: "absolute", left: x, top: y, zIndex: 50 }}>
      {rip > 0 && (
        <div style={{
          position: "absolute", left: -22, top: -22, width: 44, height: 44, borderRadius: 22,
          border: `3px solid ${C.accentFg}`, opacity: 1 - rip, transform: `scale(${0.4 + rip * 1.6})`,
        }} />
      )}
      <svg width="30" height="34" viewBox="0 0 24 28" style={{ filter: "drop-shadow(0 3px 6px #000a)" }}>
        <path d="M3 1 L3 22 L8.5 17 L12 25 L15.5 23.4 L12 15.6 L19 15 Z"
          fill="#fff" stroke="#000" strokeWidth="1.4" />
      </svg>
    </div>
  );
};

/** Pagebox app icon (src-tauri/icons/icon.png), with scale/fade reveal and optional glow. */
export const BoxLogo: React.FC<{ size: number; draw?: number; glow?: boolean }> = ({
  size, draw = 1, glow = false,
}) => {
  const d = clamp01(draw);
  const scale = 0.7 + 0.3 * d;
  const opacity = d;
  return (
    <Img
      src={staticFile("logo.png")}
      style={{
        width: size,
        height: size,
        filter: glow ? `drop-shadow(0 0 ${size * 0.18}px ${C.logo}66)` : undefined,
        opacity,
        transform: `scale(${scale})`,
      }}
    />
  );
};

export const Wordmark: React.FC<{ size?: number; delay?: number }> = ({ size = 110, delay = 0 }) => {
  const f = useCurrentFrame();
  const p = spr(f, delay, 16);
  return (
    <div style={{
      fontFamily: FONT.sans, fontSize: size, fontWeight: 800, color: C.text, letterSpacing: -2,
      opacity: p, transform: `translateY(${(1 - p) * 30}px)`,
    }}>
      Pagebox
    </div>
  );
};

/** Keycap chip, e.g. ⌘V. */
export const Kbd: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const f = useCurrentFrame();
  const p = spr(f, delay, 14);
  return (
    <span style={{
      fontFamily: FONT.mono, fontSize: 30, fontWeight: 700, color: C.text,
      background: C.hover, border: `1px solid ${C.border}`, borderBottomWidth: 4,
      borderRadius: 10, padding: "8px 18px", opacity: p, display: "inline-block",
      transform: `scale(${0.7 + 0.3 * p})`,
    }}>{children}</span>
  );
};

/** Small mono file chip used in the S1 chaos. */
export const FileChip: React.FC<{ name: string; tone?: string }> = ({ name, tone = C.muted }) => (
  <div style={{
    fontFamily: FONT.mono, fontSize: 26, color: C.text, background: `${C.panel}ee`,
    border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 18px",
    display: "flex", gap: 12, alignItems: "center", boxShadow: "0 8px 24px #00000066",
  }}>
    <svg width="20" height="24" viewBox="0 0 20 24">
      <path d="M2 1 h11 l5 5 v17 h-16 z" fill="none" stroke={tone} strokeWidth="1.6" />
      <path d="M13 1 v5 h5" fill="none" stroke={tone} strokeWidth="1.6" />
    </svg>
    {name}
  </div>
);

/** Syntax-colored fake HTML line for the S1 chat stream. */
export const codeSpan = (kind: "tag" | "attr" | "str" | "txt" | "com", text: string) => {
  const col = { tag: "#7ee787", attr: "#79c0ff", str: "#a5d6ff", txt: C.text, com: C.muted }[kind];
  return <span style={{ color: col }}>{text}</span>;
};

/** Fade-from-bg wrapper for scene entrances (8f). */
export const useSceneFade = () => {
  const f = useCurrentFrame();
  return interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp", easing: easeOut });
};
