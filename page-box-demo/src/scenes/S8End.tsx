import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { BoxLogo, useSceneFade } from "../components/primitives";
import { C, FONT, spr } from "../theme";

export const S8End: React.FC = () => {
  const f = useCurrentFrame();
  const fade = useSceneFade();
  const logo = spr(f, 6, 16);
  const word = spr(f, 18, 16);
  const tag = spr(f, 56, 18);
  const git = spr(f, 92, 16);
  const chips = spr(f, 126, 18);
  const cta = spr(f, 160, 18);
  const brand = spr(f, 208, 22);
  const drift = Math.sin(f * 0.02) * 8;
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Backdrop seed={8} intensity={1.35} />
      {/* left-of-center block; right third stays calm for YouTube end screens */}
      <div style={{ position: "absolute", left: 190 + drift, top: 240, width: 1150 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
          <div style={{ opacity: logo, transform: `scale(${0.7 + 0.3 * logo})` }}>
            <BoxLogo size={150} glow />
          </div>
          <div style={{
            fontFamily: FONT.sans, fontSize: 124, fontWeight: 800, color: C.text, letterSpacing: -3,
            opacity: word, transform: `translateX(${(1 - word) * 40}px)`,
          }}>Pagebox</div>
        </div>
        <div style={{ fontFamily: FONT.sans, fontSize: 44, fontWeight: 500, color: C.muted, marginTop: 26, opacity: tag, transform: `translateY(${(1 - tag) * 22}px)` }}>
          A home for AI-made pages.
        </div>
        <div style={{ marginTop: 36, opacity: git, transform: `translateY(${(1 - git) * 22}px)` }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 16, fontFamily: FONT.mono, fontSize: 32, color: C.text,
            background: C.panel, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "16px 28px",
            boxShadow: "0 12px 36px #00000066",
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.accentFg} strokeWidth="2">
              <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="8" r="3" />
              <path d="M6 9 v6 M18 11 c0 4 -6 3 -9 5" />
            </svg>
            github.com/haidaralif-24/page-box
          </span>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 30, opacity: chips, transform: `translateY(${(1 - chips) * 20}px)` }}>
          {["Free", "Open source", "v0.1.2"].map((t) => (
            <span key={t} style={{
              fontFamily: FONT.mono, fontSize: 26, color: C.accentFg, border: `1px solid ${C.accent}66`,
              background: `${C.accent}1a`, borderRadius: 10, padding: "8px 20px",
            }}>{t}</span>
          ))}
        </div>
        <div style={{ fontFamily: FONT.sans, fontSize: 42, fontWeight: 700, color: C.text, marginTop: 40, opacity: cta, transform: `translateY(${(1 - cta) * 22}px)` }}>
          Star it <span style={{ color: C.muted }}>·</span> Try it <span style={{ color: C.muted }}>·</span> Break it
        </div>
      </div>
      {/* subtle personal brand signature (Darz Bits) */}
      <div style={{
        position: "absolute", left: 196, bottom: 56, display: "flex", alignItems: "center", gap: 16,
        opacity: brand * 0.92, transform: `translateY(${(1 - brand) * 16}px)`,
      }}>
        <Img src={staticFile("brand/logo-mark.png")} style={{ width: 46, height: 46, borderRadius: 9, border: `1px solid ${C.border}` }} />
        <span style={{ fontFamily: FONT.mono, fontSize: 24, color: C.muted }}>a Darz Bits build</span>
      </div>
    </AbsoluteFill>
  );
};
