import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { FileChip, codeSpan, useSceneFade } from "../components/primitives";
import { C, FONT, H, W, clamp01, easeInOut, easeOut, spr } from "../theme";

const USER_MSG = "make me an interactive lesson on the water cycle";
const CODE: React.ReactNode[][] = [
  [codeSpan("com", "<!-- water-cycle.html -->")],
  [codeSpan("tag", "<!doctype html>")],
  [codeSpan("tag", "<html>"), codeSpan("txt", " ")],
  [codeSpan("txt", "  "), codeSpan("tag", "<head>"), codeSpan("tag", "<title>"), codeSpan("txt", "The Water Cycle"), codeSpan("tag", "</title>")],
  [codeSpan("txt", "  "), codeSpan("tag", "<style>"), codeSpan("txt", " .cloud { animation: drift 6s … } "), codeSpan("tag", "</style>")],
  [codeSpan("txt", "  "), codeSpan("tag", "<script>"), codeSpan("txt", " let drops = []; function rain() { … } "), codeSpan("tag", "</script>")],
];
// Exact character budget of the code wall, so the final line finishes typing
// cleanly instead of cutting off mid-tag.
const TOTAL_CHARS = CODE.reduce(
  (n, line) => n + line.reduce<number>((m, s) => m + (s as React.ReactElement<{ children: string }>).props.children.length, 0),
  0,
);

const FILES = [
  { name: "water-cycle.html", x: 330, y: 300, r: -8 },
  { name: "water-cycle(1).html", x: 1350, y: 250, r: 6 },
  { name: "lesson_final.html", x: 250, y: 640, r: 5 },
  { name: "lesson_FINAL_v2.html", x: 1420, y: 620, r: -6 },
  { name: "untitled-3.html", x: 700, y: 820, r: -4 },
  { name: "index(2).html", x: 1150, y: 860, r: 7 },
];

export const S1Hook: React.FC = () => {
  const f = useCurrentFrame();
  const fade = useSceneFade();
  const userP = spr(f, 18, 18);
  const userChars = Math.floor(interpolate(f, [24, 68], [0, USER_MSG.length], { extrapolateRight: "clamp" }));
  const aiP = spr(f, 72, 18);
  const codeChars = interpolate(f, [80, 148], [0, TOTAL_CHARS], { extrapolateRight: "clamp" });
  const eject = interpolate(f, [148, 168], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  const headline1 = spr(f, 192, 16);
  const headline2 = spr(f, 222, 16);
  const suck = interpolate(f, [262, 298], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  const dim = interpolate(f, [188, 210], [1, 0.28], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  let budget = codeChars;
  const rendered = CODE.map((line, i) => {
    const text = line.map((s) => (s as React.ReactElement<{ children: string }>).props.children).join("");
    const take = clamp01(budget / Math.max(1, text.length)) * text.length;
    budget -= text.length;
    if (take <= 0) return null;
    let used = 0;
    return (
      <div key={i} style={{ whiteSpace: "pre" }}>
        {line.map((s, j) => {
          const el = s as React.ReactElement<{ children: string }>;
          const t = el.props.children;
          const slice = t.slice(0, Math.max(0, Math.min(t.length, take - used)));
          used += t.length;
          return <span key={j} style={{ color: (el.props as { style?: { color?: string } }).style?.color }}>{slice}</span>;
        })}
      </div>
    );
  });

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Backdrop seed={1} />
      {/* chat */}
      <div style={{
        position: "absolute", left: W / 2 - 520, top: 150, width: 1040,
        opacity: eject, transform: `scale(${0.9 + 0.1 * eject}) translateY(${(1 - eject) * -40}px)`,
      }}>
        <div style={{ display: "flex", justifyContent: "flex-end", opacity: userP, transform: `translateY(${(1 - userP) * 24}px)` }}>
          <div style={{
            maxWidth: 780, background: `${C.accent}22`, border: `1.5px solid ${C.accent}88`,
            borderRadius: "18px 18px 4px 18px", padding: "18px 26px",
            fontFamily: FONT.sans, fontSize: 32, color: C.text,
          }}>
            {USER_MSG.slice(0, userChars)}
            {userChars < USER_MSG.length && <span style={{ color: C.accentFg }}>▍</span>}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 26, opacity: aiP, transform: `translateY(${(1 - aiP) * 24}px)` }}>
          <div style={{
            width: 860, background: C.panel, border: `1px solid ${C.border}`,
            borderRadius: "18px 18px 18px 4px", padding: "20px 26px",
            fontFamily: FONT.mono, fontSize: 25, lineHeight: 1.55,
            boxShadow: "0 16px 50px #00000077",
          }}>
            <div style={{ fontFamily: FONT.sans, fontSize: 20, color: C.muted, marginBottom: 10 }}>AI · generating…</div>
            {rendered}
          </div>
        </div>
      </div>
      {/* scattered files */}
      {FILES.map((file, i) => {
        const p = spr(f, 150 + i * 5, 14);
        const drift = Math.sin(f * 0.05 + i * 1.7) * 10;
        const sx = W / 2 + (file.x - W / 2) * p;
        const sy = 430 + (file.y - 430) * p + drift * p;
        const x = sx + (W / 2 - sx) * suck;
        const y = sy + (500 - sy) * suck;
        const op = p * dim * (1 - suck);
        return (
          <div key={file.name} style={{
            position: "absolute", left: x, top: y, opacity: op,
            transform: `translate(-50%,-50%) rotate(${file.r * p + Math.sin(f * 0.03 + i) * 2}deg) scale(${1 - 0.5 * suck})`,
          }}>
            <FileChip name={file.name} tone={i % 2 ? C.warning : C.muted} />
          </div>
        );
      })}
      {/* downloads overflow */}
      <div style={{
        position: "absolute", right: 90, bottom: 120, opacity: spr(f, 172, 16) * dim * (1 - suck),
        display: "flex", alignItems: "center", gap: 14, fontFamily: FONT.mono, fontSize: 26, color: C.muted,
      }}>
        <svg width="40" height="34" viewBox="0 0 40 34"><path d="M2 8 h12 l4 5 h20 v19 h-36 z" fill="none" stroke={C.warning} strokeWidth="2" /></svg>
        Downloads · {Math.min(23, Math.floor(interpolate(f, [172, 240], [4, 23], { extrapolateRight: "clamp" })))} files
      </div>
      {/* headline */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
        <div style={{
          fontFamily: FONT.sans, fontSize: 96, fontWeight: 800, color: C.text, letterSpacing: -2,
          opacity: headline1, transform: `translateY(${(1 - headline1) * 40}px)`,
          textShadow: "0 8px 40px #000c",
        }}>
          Your AI made a webpage.
        </div>
        <div style={{
          fontFamily: FONT.sans, fontSize: 96, fontWeight: 800, color: C.accentFg, letterSpacing: -2,
          opacity: headline2 * (1 - suck * 0.6), transform: `translateY(${(1 - headline2) * 40}px)`,
          textShadow: `0 0 60px ${C.accent}66`,
        }}>
          Now what?
        </div>
      </div>
    </AbsoluteFill>
  );
};
