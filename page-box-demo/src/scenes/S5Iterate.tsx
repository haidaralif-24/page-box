import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { MockApp, type MockState } from "../components/MockApp";
import { TimeSkip } from "../components/TimeSkip";
import { VideoSlot } from "../components/VideoSlot";
import { Callout, SceneChip, useSceneFade } from "../components/primitives";
import { SLOTS } from "../edit";
import { C, FONT, spr } from "../theme";

const mockPt1 = (f: number): MockState => ({
  preview: true, savedPage: true,
  toast: f > 150 ? "Prompt copied to clipboard!" : null,
  cursor: { x: 1200, y: 560, clickAt: 140 },
});
const mockPt2 = (f: number): MockState => ({
  savedPage: true, preview: true,
  toast: f > 90 && f < 200 ? "Replaced — previous version kept" : f >= 250 ? "Restored v1" : null,
});

// The real Copy-for-AI templates (src/components/CopyForAIDialog.tsx).
const ASKS = ["Fix bugs", "Add a feature", "Improve design", "Make responsive", "Improve accessibility"];

export const S5Iterate: React.FC = () => {
  const f = useCurrentFrame();
  const fade = useSceneFade();
  const { intro, pt1, skip, pt2, outro } = SLOTS.S5;
  const t2 = intro + pt1 + skip;
  const tOut = t2 + pt2;
  const fo = f - tOut;
  const title = spr(fo, 4, 16);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Backdrop seed={5} />
      <Sequence from={0} durationInFrames={intro}>
        <SceneChip n="03" label="Iterate" />
      </Sequence>
      <Sequence from={intro} durationInFrames={pt1}>
        <VideoSlot scene="S5" part="pt1" durationInFrames={pt1} mock={<MockApp state={mockPt1(f - intro)} />} />
        <Callout from={36} to={pt1 - 12}>Copy for AI — tell it what to fix</Callout>
      </Sequence>
      <Sequence from={intro + pt1} durationInFrames={skip}>
        <TimeSkip label="one fix later…" />
      </Sequence>
      <Sequence from={t2} durationInFrames={pt2}>
        <VideoSlot scene="S5" part="pt2" durationInFrames={pt2} mock={<MockApp state={mockPt2(f - t2)} />} />
        <Callout from={220} to={pt2 - 12} tone="success">Replace keeps every version — restore anytime</Callout>
      </Sequence>
      <Sequence from={tOut} durationInFrames={outro}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 26 }}>
          {/* version stack */}
          <div style={{ position: "relative", width: 340, height: 150, opacity: title }}>
            {[2, 1, 0].map((i) => {
              const p = spr(fo, 6 + i * 8, 14);
              return (
                <div key={i} style={{
                  position: "absolute", left: 30 + i * 26, top: 34 - i * 16, width: 250, height: 96,
                  background: i === 0 ? C.panel : C.hover, border: `1.5px solid ${i === 0 ? C.accent : C.border}`,
                  borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: FONT.mono, fontSize: 28, fontWeight: 700, color: i === 0 ? C.accentFg : C.muted,
                  opacity: p, transform: `translateY(${(1 - p) * 26}px) rotate(${(i - 1) * 2}deg)`,
                  boxShadow: i === 0 ? `0 0 30px ${C.accent}44` : "0 8px 20px #0008",
                }}>v{i + 1}</div>
              );
            })}
          </div>
          <div style={{ fontFamily: FONT.sans, fontSize: 64, fontWeight: 800, color: C.text, opacity: title, transform: `translateY(${(1 - title) * 26}px)` }}>
            Nothing lost.
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", maxWidth: 1300 }}>
            {ASKS.map((a, i) => {
              const p = spr(fo, 26 + i * 5, 16);
              const sel = i === 0;
              return (
                <span key={a} style={{
                  fontFamily: FONT.mono, fontSize: 25, color: sel ? C.accentFg : C.muted,
                  border: `1px solid ${sel ? C.accent : C.border}`, background: sel ? `${C.accent}1f` : `${C.panel}cc`,
                  borderRadius: 10, padding: "8px 18px", opacity: p, transform: `translateY(${(1 - p) * 18}px)`,
                }}>{a}</span>
              );
            })}
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 24, color: C.muted, opacity: spr(fo, 56, 18) }}>
            same loop for anything you want to change
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
