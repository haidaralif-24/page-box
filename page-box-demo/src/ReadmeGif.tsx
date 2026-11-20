import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { MockApp, type MockState } from "./components/MockApp";

const CODE = "```html\n<!doctype html>\n<html>\n<head><title>The Water Cycle</title></head>\n<body>…</body>\n</html>\n```";

/** 6s README loop: paste -> detected title -> save -> card + sandboxed preview. */
export const ReadmeGif: React.FC = () => {
  const f = useCurrentFrame();
  const state: MockState = {
    dialog: f < 44 ? "add" : null,
    typed: CODE.slice(0, Math.floor(Math.min(1, f / 24) * CODE.length)),
    detectedTitle: f >= 24 && f < 44 ? "The Water Cycle" : null,
    savedPage: f >= 44,
    preview: f >= 56,
    toast: f >= 44 && f < 74 ? "Page saved locally" : null,
    cursor: f < 34
      ? { x: 1100, y: 560 }
      : { x: 1100 + Math.min(1, (f - 34) / 8) * 160, y: 560 + Math.min(1, (f - 34) / 8) * 148, clickAt: 42 },
  };
  return (
    <AbsoluteFill style={{ backgroundColor: "#0d1117" }}>
      <div style={{ width: 1920, height: 1080, transform: "scale(0.5)", transformOrigin: "top left" }}>
        <MockApp state={state} />
      </div>
    </AbsoluteFill>
  );
};
