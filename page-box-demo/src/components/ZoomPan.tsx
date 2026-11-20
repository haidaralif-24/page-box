import React, { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { H, W } from "../theme";

/**
 * Cursor-following zoom with moderate magnification.
 *
 * Instead of hard keyframing zoom targets that SNAP to UI elements,
 * this component smoothly follows the cursor position and applies a
 * moderate, consistent zoom level (~1.4× by default). This keeps the
 * full app visible while gently drawing attention to the action area.
 *
 * Optional `pullbacks` let you drop the zoom back to ~1.0× at specific
 * moments (e.g. after a save, to show the full library).
 *
 * Measured on the 3360×2100 takes:
 *   - menu bar ends ~y50
 *   - Dock is auto-hidden (2px artifact at y2080, outside crop)
 * SAFE_BOTTOM=200 covers the Dock's revealed height (~130px) in case
 * the pointer ever touches the screen bottom mid-take.
 */
const SAFE_TOP = 110;
const SAFE_BOTTOM = 200;

/** Cursor position at a specific slot-frame (source-normalized 0..1). */
export type CursorKey = { f: number; x: number; y: number };

/** Optional frame range where zoom drops to show the full app. */
export type Pullback = { from: number; to: number };

/**
 * Cover-fits source footage into 1920×1080, then applies cursor-following
 * zoom/pan. Translation is edge-clamped so we never reveal outside the frame.
 */
export const ZoomPan: React.FC<{
  width: number;
  height: number;
  cursorPath: CursorKey[];
  pullbacks?: Pullback[];
  /** Extra zoom above cover-fit. 0.4 = 1.4× total. Default 0.4. */
  zoomLevel?: number;
  /** How fast the zoom responds to pullback transitions (frames). */
  springFrames?: number;
  children: React.ReactNode;
}> = ({
  width,
  height,
  cursorPath,
  pullbacks = [],
  zoomLevel = 0.4,
  springFrames = 30,
  children,
}) => {
  const f = useCurrentFrame();
  const cover = Math.max(W / width, H / height);

  // Interpolate cursor position from path (linear = natural movement)
  const fs = cursorPath.map((k) => k.f);
  const cursorX = interpolate(f, fs, cursorPath.map((k) => k.x ?? 0.5), {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorY = interpolate(f, fs, cursorPath.map((k) => k.y ?? 0.5), {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Compute zoom intensity: 1.0 = full zoomLevel, 0.0 = cover-fit only.
  // Smoothly ramps down/up around pullbacks using a smoothstep envelope.
  const zoomIntensity = useMemo(() => {
    if (pullbacks.length === 0) return 1;
    let intensity = 1;
    for (const pb of pullbacks) {
      if (f < pb.from) {
        // Ramp down before pullback
        const dist = pb.from - f;
        if (dist < springFrames) {
          const t = dist / springFrames;
          intensity = Math.min(intensity, t * t * (3 - 2 * t)); // smoothstep
        }
      } else if (f <= pb.to) {
        // During pullback: minimal zoom
        intensity = 0;
      } else {
        // Ramp up after pullback
        const dist = f - pb.to;
        if (dist < springFrames) {
          const t = dist / springFrames;
          intensity = Math.min(intensity, t * t * (3 - 2 * t)); // smoothstep
        }
      }
    }
    return intensity;
  }, [f, pullbacks, springFrames]);

  const extraZoom = zoomLevel * zoomIntensity;
  const s = cover * (1 + extraZoom);
  const rw = width * s;
  const rh = height * s;

  // Center the viewport on the cursor
  let left = W / 2 - cursorX * rw;
  let top = H / 2 - cursorY * rh;

  // Clamp to source bounds, respecting safe areas
  left = Math.min(0, Math.max(W - rw, left));
  top = Math.min(-SAFE_TOP * s, Math.max(H - (height - SAFE_BOTTOM) * s, top));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "#010409",
      }}
    >
      <div style={{ position: "absolute", left, top, width: rw, height: rh }}>
        {children}
      </div>
    </div>
  );
};
