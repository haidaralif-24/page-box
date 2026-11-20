import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FONT, easeOut, spr } from "../theme";
import { BoxLogo } from "./primitives";

/** ~2s bridge card between "ask the AI" and "back in Pagebox".
 *  Honest about the time jump instead of faking a live AI response. */
export const TimeSkip: React.FC<{ label: string; sub?: string }> = ({
  label, sub = "the AI does its thing off-camera",
}) => {
  const f = useCurrentFrame();
  const p = spr(f, 0, 16);
  const out = interpolate(f, [48, 60], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const chev = (i: number) => {
    const t = (f * 0.09 + i * 0.33) % 1;
    return interpolate(t, [0, 0.5, 1], [0.15, 1, 0.15]);
  };
  const orbit = f * 0.11;
  return (
    <AbsoluteFill style={{ backgroundColor: C.inset, opacity: Math.min(p, out) }}>
      <AbsoluteFill style={{
        background: `radial-gradient(600px 400px at 50% 50%, ${C.accent}1f, transparent 70%)`,
      }} />
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 30,
        transform: `scale(${0.92 + 0.08 * p})`,
      }}>
        <div style={{ position: "relative", width: 150, height: 150 }}>
          <BoxLogo size={150} draw={1} glow />
          <div style={{
            position: "absolute", left: 75 + 96 * Math.cos(orbit) - 7,
            top: 75 + 96 * Math.sin(orbit) - 7, width: 14, height: 14, borderRadius: 7,
            background: C.accentFg, boxShadow: `0 0 18px ${C.accentFg}`,
          }} />
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[0, 1, 2].map((i) => (
            <svg key={i} width="34" height="40" viewBox="0 0 24 28" style={{ opacity: chev(i) }}>
              <path d="M4 4 L14 14 L4 24" fill="none" stroke={C.accentFg} strokeWidth="4"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ))}
        </div>
        <div style={{ fontFamily: FONT.sans, fontSize: 56, fontWeight: 800, color: C.text }}>
          {label}
        </div>
        <div style={{ fontFamily: FONT.mono, fontSize: 26, color: C.muted }}>{sub}</div>
      </div>
    </AbsoluteFill>
  );
};
