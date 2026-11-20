import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT } from "../theme";
import { BoxLogo, Cursor } from "./primitives";

export type MockState = {
  query?: string;
  dialog?: "add" | null;
  typed?: string;
  detectedTitle?: string | null;
  toast?: string | null;
  savedPage?: boolean;
  preview?: boolean;
  cursor?: { x: number; y: number; clickAt?: number };
};

const SEED = [
  { t: "Newton's Laws", tag: "physics", hue: "#1f6feb" },
  { t: "Photosynthesis Lab", tag: "biology", hue: "#3fb950" },
  { t: "Fractions Visualizer", tag: "math", hue: "#bc8cff" },
  { t: "Cell Structure", tag: "biology", hue: "#3fb950" },
  { t: "Spanish Verbs", tag: "language", hue: "#d29922" },
  { t: "Robotics Club Flyer", tag: "club", hue: "#f85149" },
];

const Mini: React.FC<{ hue: string; big?: boolean }> = ({ hue, big }) => (
  <div style={{
    height: big ? 210 : 110, borderRadius: 8, background: C.inset,
    border: `1px solid ${C.border}`, padding: 12, display: "flex", flexDirection: "column", gap: 8,
  }}>
    <div style={{ height: big ? 26 : 14, width: "60%", borderRadius: 4, background: `${hue}cc` }} />
    <div style={{ height: big ? 12 : 7, width: "85%", borderRadius: 3, background: C.hover }} />
    <div style={{ height: big ? 12 : 7, width: "72%", borderRadius: 3, background: C.hover }} />
    <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: big ? 52 : 26, height: big ? 52 : 26, borderRadius: big ? 26 : 13,
          border: `2px solid ${hue}${i === 1 ? "cc" : "55"}`,
        }} />
      ))}
    </div>
  </div>
);

const Card: React.FC<{ t: string; tag: string; hue: string; fresh?: boolean }> = ({ t, tag, hue, fresh }) => (
  <div style={{
    background: C.panel, border: `1px solid ${fresh ? C.accent : C.border}`, borderRadius: 12,
    padding: 14, display: "flex", flexDirection: "column", gap: 10,
    boxShadow: fresh ? `0 0 26px ${C.accent}44` : "0 6px 18px #00000055",
  }}>
    <Mini hue={hue} />
    <div style={{ fontFamily: FONT.sans, fontSize: 24, fontWeight: 600, color: C.text, display: "flex", alignItems: "center", gap: 10 }}>
      {t}
      {fresh && <span style={{ fontFamily: FONT.mono, fontSize: 16, color: C.accentFg, border: `1px solid ${C.accent}88`, borderRadius: 6, padding: "1px 8px" }}>new</span>}
    </div>
    <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.muted }}>#{tag} · just now</div>
  </div>
);

/** Faithful Pagebox UI replica (GitHub Dark) — mock stand-in for takes and
 *  the engine behind the README GIF. Rendered in 1920x1080 space. */
export const MockApp: React.FC<{ state: MockState }> = ({ state }) => {
  const { query = "", dialog, typed = "", detectedTitle, toast, savedPage, preview, cursor } = state;
  const cards = savedPage
    ? [{ t: "The Water Cycle", tag: "science", hue: "#58a6ff", fresh: true }, ...SEED]
    : SEED;
  const visible = query
    ? cards.filter((c) => (c.t + " " + c.tag).toLowerCase().includes(query.toLowerCase()))
    : cards;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, fontFamily: FONT.sans }}>
      {/* sidebar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 320, background: C.panel,
        borderRight: `1px solid ${C.border}`, padding: "28px 22px", display: "flex", flexDirection: "column", gap: 22,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <BoxLogo size={44} />
          <span style={{ fontSize: 30, fontWeight: 800, color: C.text }}>Pagebox</span>
        </div>
        {[["All Pages", String(cards.length)], ["School", "4"], ["Projects", "1"], ["Experiments", "1"]].map(([n, c], i) => (
          <div key={n} style={{
            display: "flex", justifyContent: "space-between", fontSize: 24, fontWeight: i === 0 ? 700 : 500,
            color: i === 0 ? C.text : C.muted, background: i === 0 ? C.hover : "transparent",
            borderRadius: 8, padding: "10px 14px",
          }}>
            <span>{n}</span><span style={{ fontFamily: FONT.mono, fontSize: 20 }}>{c}</span>
          </div>
        ))}
        <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.muted, letterSpacing: 2, marginTop: 8 }}>TAGS</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {["physics", "biology", "math", "science"].map((t) => (
            <span key={t} style={{ fontFamily: FONT.mono, fontSize: 19, color: C.accentFg, background: `${C.accent}1a`, border: `1px solid ${C.accent}55`, borderRadius: 8, padding: "4px 12px" }}>#{t}</span>
          ))}
        </div>
      </div>
      {/* header */}
      <div style={{ position: "absolute", left: 320, right: 0, top: 0, height: 110, display: "flex", alignItems: "center", padding: "0 40px", gap: 24, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 34, fontWeight: 800, color: C.text, flex: 1 }}>All Pages</div>
        <div style={{
          width: 460, height: 56, borderRadius: 10, border: `1px solid ${query ? C.accent : C.border}`,
          background: C.inset, display: "flex", alignItems: "center", padding: "0 18px",
          fontFamily: FONT.sans, fontSize: 24, color: query ? C.text : C.muted,
          boxShadow: query ? `0 0 18px ${C.accent}33` : undefined,
        }}>
          {query || "Search by title or tag..."}
          {query && <span style={{ width: 2, height: 28, background: C.accentFg, marginLeft: 3 }} />}
        </div>
        <div style={{ height: 56, borderRadius: 10, background: C.accent, color: "#fff", fontSize: 24, fontWeight: 700, display: "flex", alignItems: "center", padding: "0 24px" }}>
          + Add page
        </div>
      </div>
      {/* grid */}
      <div style={{ position: "absolute", left: 360, top: 140, right: preview ? 760 : 40, bottom: 40, display: "grid", gridTemplateColumns: preview ? "1fr 1fr" : "1fr 1fr 1fr", gap: 22, alignContent: "start" }}>
        {visible.map((c) => <Card key={c.t} {...c} />)}
        {query && visible.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", color: C.muted, fontSize: 28, paddingTop: 80 }}>
            No matching pages found
          </div>
        )}
      </div>
      {/* preview pane */}
      {preview && (
        <div style={{ position: "absolute", right: 40, top: 140, width: 680, bottom: 40, background: C.panel, border: `1px solid ${C.accent}66`, borderRadius: 14, padding: 22, display: "flex", flexDirection: "column", gap: 14, boxShadow: `0 0 40px ${C.accent}22` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: C.text }}>The Water Cycle</span>
            <span style={{ fontFamily: FONT.mono, fontSize: 18, color: C.success, border: `1px solid ${C.success}66`, borderRadius: 8, padding: "3px 12px" }}>sandboxed</span>
          </div>
          <Mini hue="#58a6ff" big />
          <div style={{ fontFamily: FONT.mono, fontSize: 19, color: C.muted }}>v1 · saved locally · scripts allowed, network blocked</div>
        </div>
      )}
      {/* add dialog */}
      {dialog === "add" && (
        <AbsoluteFill style={{ background: "#010409b8", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 760, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 30, display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 30px 80px #000c" }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: C.text }}>Add a page</div>
            <div style={{ display: "flex", gap: 14, alignItems: "center", background: `${C.accent}14`, border: `1px solid ${C.accent}55`, borderRadius: 12, padding: "14px 18px" }}>
              <span style={{ color: C.accentFg, fontSize: 26 }}>✦</span>
              <div>
                <div style={{ fontSize: 23, fontWeight: 700, color: C.text }}>Need HTML? Generate a prompt for AI</div>
                <div style={{ fontSize: 19, color: C.muted }}>Describe what you want to learn and get a ready-made interactive lesson.</div>
              </div>
            </div>
            <div style={{ height: 190, background: C.inset, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, fontFamily: FONT.mono, fontSize: 20, color: "#a5d6ff", whiteSpace: "pre-wrap", overflow: "hidden" }}>
              {typed || "```html\n<!doctype html>\n<html>…\n```"}
            </div>
            {detectedTitle && (
              <div style={{ fontSize: 22, color: C.muted }}>Detected title: <b style={{ color: C.text }}>{detectedTitle}</b></div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 14 }}>
              <div style={{ fontSize: 23, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 24px" }}>Cancel</div>
              <div style={{ fontSize: 23, fontWeight: 700, color: "#fff", background: detectedTitle ? C.accent : C.hover, borderRadius: 10, padding: "12px 24px" }}>Save page</div>
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.muted, textAlign: "center" }}>Ctrl+Enter to save · Esc to close</div>
          </div>
        </AbsoluteFill>
      )}
      {toast && (
        <div style={{ position: "absolute", bottom: 46, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", background: C.panel, border: `1px solid ${C.success}88`, borderRadius: 12, padding: "14px 26px", fontSize: 24, color: C.text, boxShadow: `0 0 30px ${C.success}33` }}>
            <span style={{ color: C.success }}>✓</span>{toast}
          </div>
        </div>
      )}
      {cursor && <Cursor x={cursor.x} y={cursor.y} clickAt={cursor.clickAt} />}
    </AbsoluteFill>
  );
};
