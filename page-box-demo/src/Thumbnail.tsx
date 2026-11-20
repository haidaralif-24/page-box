import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { Backdrop } from "./components/Backdrop";
import { BoxLogo } from "./components/primitives";
import { C, FONT } from "./theme";

/** 1920x1080 YouTube thumbnail (rendered as a still). */
export const Thumbnail: React.FC = () => (
  <AbsoluteFill>
    <Backdrop seed={8} intensity={1.4} />
    <div style={{ position: "absolute", left: 150, top: 250, display: "flex", alignItems: "center", gap: 44 }}>
      <BoxLogo size={230} glow />
      <div>
        <div style={{ fontFamily: FONT.sans, fontSize: 176, fontWeight: 800, color: C.text, letterSpacing: -5 }}>
          Pagebox
        </div>
        <div style={{ fontFamily: FONT.sans, fontSize: 52, fontWeight: 600, color: C.accentFg, marginTop: 6 }}>
          A home for AI-made pages.
        </div>
      </div>
    </div>
    <div style={{ position: "absolute", left: 158, top: 640, display: "flex", gap: 20 }}>
      {["Paste", "Preview", "Organize"].map((t) => (
        <span key={t} style={{
          fontFamily: FONT.mono, fontSize: 38, fontWeight: 700, color: C.text,
          background: C.panel, border: `2px solid ${C.border}`, borderRadius: 16, padding: "16px 34px",
          boxShadow: "0 14px 40px #00000077",
        }}>{t}</span>
      ))}
    </div>
    <div style={{ position: "absolute", left: 158, bottom: 90, fontFamily: FONT.mono, fontSize: 34, color: C.muted }}>
      github.com/haidaralif-24/page-box · free & open source
    </div>
    <Img src={staticFile("brand/logo-mark.png")} style={{
      position: "absolute", right: 84, bottom: 76, width: 72, height: 72, borderRadius: 14,
      border: `1px solid ${C.border}`, opacity: 0.9,
    }} />
  </AbsoluteFill>
);
