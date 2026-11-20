import React from "react";
import { OffthreadVideo, staticFile } from "remotion";
import manifest from "../footage.json";
import { EDL } from "../edit";
import { C, FONT } from "../theme";
import { ZoomPan } from "./ZoomPan";

type Entry = {
  file: string;
  fps: number;
  width: number;
  height: number;
  durationSec: number;
  frames: number;
};
const M = manifest as Record<string, Record<string, Entry | null>>;

/** Real recorded take if ingest found one, otherwise the animated mock.
 *  Auto-clamps playbackRate so a short take never runs out mid-slot. */
export const VideoSlot: React.FC<{
  scene: "S3" | "S4" | "S5";
  part: string;
  durationInFrames: number;
  mock: React.ReactNode;
}> = ({ scene, part, durationInFrames, mock }) => {
  const entry = M[scene]?.[part] ?? null;
  const take = EDL[scene]?.[part];
  if (!entry || !take) {
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        {mock}
        <div
          style={{
            position: "absolute",
            right: 28,
            bottom: 24,
            fontFamily: FONT.mono,
            fontSize: 20,
            color: C.muted,
            background: `${C.inset}cc`,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: "4px 12px",
          }}
        >
          pre-viz · mock UI
        </div>
      </div>
    );
  }
  const slotSec = durationInFrames / 30;
  const available = entry.durationSec - take.trimStartSec;
  const rate = Math.min(take.rate, available / slotSec);
  return (
    <ZoomPan
      width={entry.width}
      height={entry.height}
      cursorPath={take.cursor}
      pullbacks={take.pullbacks}
      zoomLevel={take.zoomLevel}
    >
      <OffthreadVideo
        src={staticFile(entry.file)}
        trimBefore={Math.round(take.trimStartSec * entry.fps)}
        playbackRate={rate}
        style={{ width: "100%", height: "100%", objectFit: "fill" }}
        muted
      />
    </ZoomPan>
  );
};
