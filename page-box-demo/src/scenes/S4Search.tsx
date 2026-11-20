import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { MockApp, type MockState } from "../components/MockApp";
import { VideoSlot } from "../components/VideoSlot";
import { Callout, SceneChip, useSceneFade } from "../components/primitives";
import { SLOTS } from "../edit";
import { C, FONT, spr } from "../theme";

const mockQuery = (f: number): MockState => {
  const q1 = "water".slice(0, Math.max(0, Math.floor((f - 40) / 12)));
  const q2 = f > 260 ? "physics".slice(0, Math.max(0, Math.floor((f - 260) / 12))) : "";
  return { query: f > 220 ? q2 : q1, savedPage: true };
};

export const S4Search: React.FC = () => {
  const f = useCurrentFrame();
  const fade = useSceneFade();
  const { intro, footage, outro } = SLOTS.S4;
  const big = spr(f - (intro + footage), 8, 16);
  const sub = spr(f - (intro + footage), 28, 18);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Backdrop seed={4} />
      <Sequence from={0} durationInFrames={intro}>
        <SceneChip n="02" label="Find" />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: FONT.sans, fontSize: 84, fontWeight: 800, color: C.text, opacity: spr(f, 4, 16), transform: `translateY(${(1 - spr(f, 4, 16)) * 30}px)` }}>
            Live search.
          </div>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={intro} durationInFrames={footage}>
        <VideoSlot scene="S4" part="pt1" durationInFrames={footage} mock={<MockApp state={mockQuery(f - intro)} />} />
        <Callout from={250} to={footage - 16}>Titles and tags — filtered as you type</Callout>
      </Sequence>
      <Sequence from={intro + footage} durationInFrames={outro}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
          <div style={{ fontFamily: FONT.sans, fontSize: 88, fontWeight: 800, color: C.text, opacity: big, transform: `translateY(${(1 - big) * 34}px)` }}>
            Find it fast.
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 30, color: C.accentFg, opacity: sub }}>
            no folders to dig through
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
