import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, H, W } from "../theme";

/** Layered GitHub-Dark backdrop: drifting aurora + faint grid + vignette.
 *  Clean dev aesthetic per PLAN (no grain). `seed` varies drift per scene. */
export const Backdrop: React.FC<{ seed?: number; intensity?: number }> = ({
  seed = 0, intensity = 1,
}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const ax = W * (0.28 + 0.06 * Math.sin(t * 0.35 + seed));
  const ay = H * (0.3 + 0.08 * Math.cos(t * 0.28 + seed * 2));
  const bx = W * (0.75 + 0.05 * Math.cos(t * 0.3 + seed));
  const by = H * (0.72 + 0.06 * Math.sin(t * 0.24 + seed * 3));
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(700px 520px at ${ax}px ${ay}px, ${C.accent}26, transparent 70%),
                       radial-gradient(820px 600px at ${bx}px ${by}px, #8957e522, transparent 70%)`,
          opacity: intensity,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.border}14 1px, transparent 1px),
                            linear-gradient(90deg, ${C.border}14 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(1200px 800px at 50% 45%, black, transparent 85%)",
          WebkitMaskImage: "radial-gradient(1200px 800px at 50% 45%, black, transparent 85%)",
        }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(1400px 900px at 50% 50%, transparent 55%, #010409cc 100%)" }}
      />
    </AbsoluteFill>
  );
};
