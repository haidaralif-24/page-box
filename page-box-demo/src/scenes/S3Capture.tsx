import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { MockApp, type MockState } from "../components/MockApp";
import { TimeSkip } from "../components/TimeSkip";
import { VideoSlot } from "../components/VideoSlot";
import { BoxLogo, Callout, Kbd, SceneChip, useSceneFade } from "../components/primitives";
import { SLOTS } from "../edit";
import { C, FONT, spr } from "../theme";

// Pre-viz fallback for pt1: the "Generate a lesson with AI" template being
// filled in (topic → extras), mirroring the real take. Only shown if the
// recorded S3-pt1 take is missing from public/videos.
const mockPt1 = (f: number): MockState => ({
  dialog: "add",
  typed: "Create a standalone, interactive HTML page that teaches:\n\nThe water cycle (evaporation, condensation, precipitation)\nfor middle school students.\n\n+ a labeled diagram and a 4-question quiz with instant feedback.".slice(0, Math.floor(f * 0.9)),
  cursor: { x: 1180 + Math.sin(f * 0.05) * 30, y: 620, clickAt: 150 },
});
const mockPt2 = (f: number): MockState => ({
  dialog: f < 120 ? "add" : null,
  typed: "<!doctype html>\n<html>…the water cycle…</html>",
  detectedTitle: f > 40 ? "The Water Cycle" : null,
  savedPage: f >= 120,
  preview: f >= 160,
  toast: f >= 120 && f < 220 ? "Page saved locally" : null,
  cursor: { x: 1250, y: 700, clickAt: 110 },
});

export const S3Capture: React.FC = () => {
  const f = useCurrentFrame();
  const fade = useSceneFade();
  const { intro, pt1, skip, pt2, outro } = SLOTS.S3;
  const t2 = intro + pt1 + skip;
  const tOut = t2 + pt2;
  const sum1 = spr(f - tOut, 6, 16);
  const sum2 = spr(f - tOut, 24, 18);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Backdrop seed={3} />
      <Sequence from={0} durationInFrames={intro}>
        <SceneChip n="01" label="Capture" />
      </Sequence>
      <Sequence from={intro} durationInFrames={pt1}>
        <VideoSlot scene="S3" part="pt1" durationInFrames={pt1} mock={<MockApp state={mockPt1(f - intro)} />} />
        {/* pt1 is 450f (15s): three beats — open the template, fill it in, copy it. */}
        <Callout from={40} to={140}>Add page → Generate a lesson with AI</Callout>
        <Callout from={155} to={315}>Fill in the topic — the template writes the prompt</Callout>
        <Callout from={335} to={pt1 - 12}>Copy the prompt → paste it into any AI</Callout>
      </Sequence>
      <Sequence from={intro + pt1} durationInFrames={skip}>
        <TimeSkip
          label="one prompt later…"
          sub="any AI works — DeepSeek here because it's free & fast"
        />
      </Sequence>
      <Sequence from={t2} durationInFrames={pt2}>
        <VideoSlot scene="S3" part="pt2" durationInFrames={pt2} mock={<MockApp state={mockPt2(f - t2)} />} />
        <Sequence from={12} durationInFrames={80}>
          <div style={{ position: "absolute", top: 130, right: 90 }}><Kbd>⌘V</Kbd></div>
        </Sequence>
        <Callout from={200} to={pt2 - 12} tone="success">Pasted → previewed → saved locally</Callout>
      </Sequence>
      <Sequence from={tOut} durationInFrames={outro}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 22 }}>
          <div style={{ opacity: sum1, transform: `scale(${0.8 + 0.2 * sum1})` }}>
            <BoxLogo size={110} glow />
          </div>
          <div style={{ fontFamily: FONT.sans, fontSize: 72, fontWeight: 800, color: C.text, opacity: sum1, transform: `translateY(${(1 - sum1) * 30}px)` }}>
            Paste. Preview. Saved.
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.muted, opacity: sum2 }}>
            rendered in a sandbox — more on that in a moment
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
