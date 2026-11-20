import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { OFFSETS, SCENES } from "./theme";
import { S1Hook } from "./scenes/S1Hook";
import { S2Logo } from "./scenes/S2Logo";
import { S3Capture } from "./scenes/S3Capture";
import { S4Search } from "./scenes/S4Search";
import { S5Iterate } from "./scenes/S5Iterate";
import { S6Sandbox } from "./scenes/S6Sandbox";
import { S7Platforms } from "./scenes/S7Platforms";
import { S8End } from "./scenes/S8End";

export const Demo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#0d1117" }}>
    <Sequence from={OFFSETS.S1} durationInFrames={SCENES.S1}><S1Hook /></Sequence>
    <Sequence from={OFFSETS.S2} durationInFrames={SCENES.S2}><S2Logo /></Sequence>
    <Sequence from={OFFSETS.S3} durationInFrames={SCENES.S3}><S3Capture /></Sequence>
    <Sequence from={OFFSETS.S4} durationInFrames={SCENES.S4}><S4Search /></Sequence>
    <Sequence from={OFFSETS.S5} durationInFrames={SCENES.S5}><S5Iterate /></Sequence>
    <Sequence from={OFFSETS.S6} durationInFrames={SCENES.S6}><S6Sandbox /></Sequence>
    <Sequence from={OFFSETS.S7} durationInFrames={SCENES.S7}><S7Platforms /></Sequence>
    <Sequence from={OFFSETS.S8} durationInFrames={SCENES.S8}><S8End /></Sequence>
    {/* Synthesized bed + event-synced SFX (scripts/audio.mjs). Quiet by
        design so the VO pass can layer on top without re-mixing. */}
    <Audio src={staticFile("audio/bed.wav")} volume={0.9} />
    {/* VO pass (later): <Audio src={staticFile("vo/s1.m4a")} /> inside each
        scene Sequence, then duck the bed with a volume callback. */}
  </AbsoluteFill>
);
