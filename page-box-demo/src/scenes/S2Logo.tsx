import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { BoxLogo, useSceneFade } from "../components/primitives";
import { C, FONT, W, easeInOut, spr } from "../theme";

const FRAGS = [
  { x: 180, y: 160 }, { x: 1700, y: 200 }, { x: 240, y: 880 }, { x: 1680, y: 900 },
  { x: 960, y: 100 }, { x: 120, y: 540 }, { x: 1800, y: 540 }, { x: 960, y: 990 },
];

export const S2Logo: React.FC = () => {
  const f = useCurrentFrame();
  const fade = useSceneFade();
  const draw = interpolate(f, [12, 72], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  const conv = interpolate(f, [0, 48], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  const shift = interpolate(f, [96, 136], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  const boxX = W / 2 - 110 - shift * 330;
  const word = spr(f, 108, 16);
  const tag = spr(f, 132, 18);
  const chip = spr(f, 152, 16);
  const pulse = 1 + 0.02 * Math.sin(f * 0.15);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Backdrop seed={2} intensity={1.2} />
      {FRAGS.map((p, i) => {
        const x = p.x + (W / 2 - p.x) * conv;
        const y = p.y + (480 - p.y) * conv;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y, width: 26, height: 10, borderRadius: 5,
            background: i % 2 ? C.accentFg : C.logoSoft, opacity: (1 - conv) * 0.9,
            transform: `translate(-50%,-50%) rotate(${i * 40}deg)`,
            boxShadow: `0 0 14px ${C.accent}88`,
          }} />
        );
      })}
      <div style={{ position: "absolute", left: boxX, top: 370, transform: `scale(${pulse})` }}>
        <BoxLogo size={220} draw={draw} glow />
      </div>
      <div style={{ position: "absolute", left: boxX + 270, top: 385, opacity: word, transform: `translateX(${(1 - word) * 50}px)` }}>
        <div style={{ fontFamily: FONT.sans, fontSize: 128, fontWeight: 800, color: C.text, letterSpacing: -3 }}>
          Pagebox
        </div>
        <div style={{ fontFamily: FONT.sans, fontSize: 40, fontWeight: 500, color: C.muted, marginTop: 10, opacity: tag, transform: `translateY(${(1 - tag) * 20}px)` }}>
          A home for AI-made pages.
        </div>
        <div style={{ marginTop: 24, opacity: chip, transform: `translateY(${(1 - chip) * 20}px)` }}>
          <span style={{
            fontFamily: FONT.mono, fontSize: 26, color: C.accentFg,
            border: `1px solid ${C.accent}66`, background: `${C.accent}1a`,
            borderRadius: 10, padding: "8px 18px",
          }}>v0.1.2 · free & open source</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
