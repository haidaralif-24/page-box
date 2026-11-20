import React from "react";
import { Composition } from "remotion";
import { FPS, H, SCENES, TOTAL, W } from "./theme";
import { Demo } from "./Demo";
import { Thumbnail } from "./Thumbnail";
import { ReadmeGif } from "./ReadmeGif";
import { S1Hook } from "./scenes/S1Hook";
import { S2Logo } from "./scenes/S2Logo";
import { S3Capture } from "./scenes/S3Capture";
import { S4Search } from "./scenes/S4Search";
import { S5Iterate } from "./scenes/S5Iterate";
import { S6Sandbox } from "./scenes/S6Sandbox";
import { S7Platforms } from "./scenes/S7Platforms";
import { S8End } from "./scenes/S8End";

const scenes = [
  ["S1", S1Hook], ["S2", S2Logo], ["S3", S3Capture], ["S4", S4Search],
  ["S5", S5Iterate], ["S6", S6Sandbox], ["S7", S7Platforms], ["S8", S8End],
] as const;

export const Root: React.FC = () => (
  <>
    <Composition id="Demo" component={Demo} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
    {scenes.map(([id, Comp]) => (
      <Composition key={id} id={id} component={Comp}
        durationInFrames={SCENES[id]} fps={FPS} width={W} height={H} />
    ))}
    <Composition id="Thumbnail" component={Thumbnail} durationInFrames={1} fps={FPS} width={W} height={H} />
    <Composition id="ReadmeGif" component={ReadmeGif} durationInFrames={90} fps={15} width={960} height={540} />
  </>
);
