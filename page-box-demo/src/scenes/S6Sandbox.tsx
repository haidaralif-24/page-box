import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { SceneChip, useSceneFade } from "../components/primitives";
import { C, FONT, easeOut, spr } from "../theme";

const BOX = { x: 370, y: 200, w: 1180, h: 670 };
const CARD = { x: 660, y: 400, w: 400, h: 250 };
const CX = CARD.x + CARD.w / 2;
const CY = CARD.y + CARD.h / 2;

type Probe = { from: number; to: number; tx: number; ty: number; label: string; lx: number; ly: number };
const PROBES: Probe[] = [
  { from: 140, to: 186, tx: CX, ty: BOX.y + 6, label: "network · blocked", lx: CX + 30, ly: BOX.y - 52 },
  { from: 200, to: 246, tx: BOX.x + BOX.w - 6, ty: CY, label: "file system · blocked", lx: BOX.x + BOX.w - 330, ly: CY - 70 },
  { from: 260, to: 306, tx: CX, ty: BOX.y + BOX.h - 6, label: "app data · blocked", lx: CX + 30, ly: BOX.y + BOX.h + 16 },
];

const GOOD = ["Scripts run safely", "No access to your data", "Offline by default"];

export const S6Sandbox: React.FC = () => {
  const f = useCurrentFrame();
  const fade = useSceneFade();
  const boxP = spr(f, 16, 16);
  const cardP = spr(f, 56, 14);
  const cardX = -500 + 500 * cardP;
  const fetchChars = Math.floor(interpolate(f, [324, 384], [0, 30], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const fetchLine = 'fetch("https://example.com")'.slice(0, fetchChars);
  const blockedP = spr(f, 396, 14);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Backdrop seed={6} />
      <SceneChip n="04" label="Safe by design" />
      {/* sandbox walls */}
      <div style={{
        position: "absolute", left: BOX.x, top: BOX.y, width: BOX.w, height: BOX.h,
        border: `2.5px dashed ${C.accentFg}88`, borderRadius: 26, opacity: boxP,
        transform: `scale(${0.94 + 0.06 * boxP})`, background: `${C.accent}08`,
        boxShadow: `inset 0 0 80px ${C.accent}14`,
      }}>
        <div style={{
          position: "absolute", top: -24, left: 36, display: "flex", gap: 12, alignItems: "center",
          background: C.bg, padding: "0 16px", fontFamily: FONT.mono, fontSize: 28, fontWeight: 700, color: C.accentFg,
        }}>
          <svg width="26" height="30" viewBox="0 0 24 28"><path d="M12 1 L22 5 V14 C22 21 17 25 12 27 C7 25 2 21 2 14 V5 Z" fill="none" stroke={C.accentFg} strokeWidth="2" /></svg>
          sandbox
        </div>
      </div>
      {/* page card */}
      <div style={{
        position: "absolute", left: CARD.x + cardX, top: CARD.y, width: CARD.w, height: CARD.h,
        background: C.panel, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: 18,
        opacity: cardP, boxShadow: "0 18px 50px #00000088", display: "flex", flexDirection: "column", gap: 12,
      }}>
        <div style={{ fontFamily: FONT.sans, fontSize: 27, fontWeight: 700, color: C.text }}>The Water Cycle</div>
        <div style={{ flex: 1, background: C.inset, borderRadius: 10, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 54, height: 54, borderRadius: 27, border: `2.5px solid ${C.accentFg}${i === 1 ? "cc" : "55"}` }} />
          ))}
        </div>
        <div style={{ fontFamily: FONT.mono, fontSize: 20, color: C.muted }}>lesson.html · v1</div>
      </div>
      {/* probes */}
      {PROBES.map((p, i) => {
        const t = interpolate(f, [p.from, p.to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
        const hit = f >= p.to;
        const hitP = spr(f, p.to, 12);
        const x = CX + (p.tx - CX) * t;
        const y = CY + (p.ty - CY) * t;
        const alive = f >= p.from && f < p.to + 60;
        if (!alive && !hit) return null;
        return (
          <React.Fragment key={i}>
            {t > 0 && t < 1 && (
              <div style={{
                position: "absolute", left: x - 9, top: y - 9, width: 18, height: 18, borderRadius: 9,
                background: C.warning, boxShadow: `0 0 20px ${C.warning}`,
              }} />
            )}
            {hit && (
              <>
                <div style={{
                  position: "absolute", left: p.tx - 30, top: p.ty - 30, width: 60, height: 60, borderRadius: 30,
                  border: `3px solid ${C.danger}`, opacity: Math.max(0, 1 - hitP), transform: `scale(${0.5 + hitP * 1.8})`,
                }} />
                <div style={{
                  position: "absolute", left: p.tx - 22, top: p.ty - 22, width: 44, height: 44, borderRadius: 22,
                  background: `${C.danger}22`, border: `2px solid ${C.danger}`, display: "flex", alignItems: "center",
                  justifyContent: "center", color: C.danger, fontSize: 28, fontWeight: 800, fontFamily: FONT.sans,
                  opacity: hitP, transform: `scale(${0.6 + 0.4 * hitP})`,
                }}>✕</div>
                <div style={{
                  position: "absolute", left: p.lx, top: p.ly, fontFamily: FONT.mono, fontSize: 26, fontWeight: 700,
                  color: C.danger, opacity: hitP, transform: `translateY(${(1 - hitP) * 14}px)`,
                }}>{p.label}</div>
              </>
            )}
          </React.Fragment>
        );
      })}
      {/* fetch demo */}
      <div style={{ position: "absolute", left: CARD.x, top: CARD.y + CARD.h + 34, width: 700 }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 27, color: "#a5d6ff" }}>
          {fetchLine}{fetchChars < 30 && fetchChars > 0 && <span style={{ color: C.accentFg }}>▍</span>}
        </div>
        {blockedP > 0 && (
          <div style={{
            marginTop: 14, display: "inline-flex", gap: 12, alignItems: "center", fontFamily: FONT.mono, fontSize: 26,
            color: C.danger, border: `1.5px solid ${C.danger}88`, background: `${C.danger}14`,
            borderRadius: 10, padding: "8px 18px", opacity: blockedP, transform: `translateY(${(1 - blockedP) * 14}px)`,
          }}>✕ Blocked by CSP</div>
        )}
      </div>
      {/* success chips */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 930, display: "flex", justifyContent: "center", gap: 22 }}>
        {GOOD.map((g, i) => {
          const p = spr(f, 424 + i * 12, 16);
          return (
            <div key={g} style={{
              fontFamily: FONT.sans, fontSize: 29, fontWeight: 600, color: C.text,
              border: `1.5px solid ${C.success}77`, background: `${C.success}12`, borderRadius: 14,
              padding: "14px 26px", display: "flex", gap: 12, alignItems: "center",
              opacity: p, transform: `translateY(${(1 - p) * 26}px)`,
            }}>
              <span style={{ color: C.success }}>✓</span>{g}
            </div>
          );
        })}
      </div>
      <div style={{
        position: "absolute", right: 64, bottom: 30, fontFamily: FONT.mono, fontSize: 20, color: C.muted,
        opacity: spr(f, 470, 20),
      }}>
        Animated illustration — behavior verified in the real app.
      </div>
    </AbsoluteFill>
  );
};
