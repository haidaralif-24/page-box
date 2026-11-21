import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { BoxLogo, SceneChip, useSceneFade } from "../components/primitives";
import { C, FONT, easeInOut, spr } from "../theme";

const Apple = () => (
  <svg width="64" height="76" viewBox="0 0 384 512">
    <path fill={C.text} d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
);
const Win = () => (
  <svg width="72" height="72" viewBox="0 0 72 72">
    {[[2, 2], [38, 2], [2, 38], [38, 38]].map(([x, y], i) => (
      <rect key={i} x={x} y={y} width="32" height="32" rx="4" fill={C.accentFg} />
    ))}
  </svg>
);
const Linux = () => (
  <div style={{
    width: 84, height: 68, borderRadius: 10, border: `2.5px solid ${C.success}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: FONT.mono, fontSize: 34, fontWeight: 700, color: C.success,
  }}>&gt;_</div>
);

const PLATFORMS = [
  { name: "macOS", Icon: Apple, x: 330 },
  { name: "Windows", Icon: Win, x: 810 },
  { name: "Linux", Icon: Linux, x: 1290 },
];

/** Small platform glyph for the warning-card title rows. */
const MiniIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ width: 30, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ transform: "scale(0.45)", display: "flex" }}>{children}</div>
  </div>
);

/** OS-warning chip shown next to the platform name. */
const WarnChip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{
    fontFamily: FONT.mono, fontSize: 18, color: C.warning,
    border: `1px solid ${C.warning}66`, background: `${C.warning}14`,
    borderRadius: 8, padding: "3px 12px", marginLeft: "auto",
  }}>{children}</span>
);

/** Terminal-style command block. */
const Term: React.FC<{ prompt: string; cmd: string }> = ({ prompt, cmd }) => (
  <div style={{
    background: C.inset, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: "12px 16px", fontFamily: FONT.mono, fontSize: 20, color: C.text,
    whiteSpace: "nowrap", overflow: "hidden",
  }}>
    <span style={{ color: C.success }}>{prompt} </span>{cmd}
  </div>
);

const cardStyle: React.CSSProperties = {
  position: "absolute", top: 508, width: 800, height: 330,
  background: C.panel, border: `1.5px solid ${C.border}`, borderRadius: 16,
  padding: 22, display: "flex", flexDirection: "column", gap: 12,
  boxShadow: "0 14px 40px #00000066",
};
const titleRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12 };
const cardName: React.CSSProperties = { fontFamily: FONT.sans, fontSize: 28, fontWeight: 700, color: C.text };
const quote: React.CSSProperties = { fontFamily: FONT.mono, fontSize: 20, color: C.warning };
const sub: React.CSSProperties = { fontFamily: FONT.sans, fontSize: 19, color: C.muted };
const hint: React.CSSProperties = { fontFamily: FONT.sans, fontSize: 19, color: C.muted };

export const S7Platforms: React.FC = () => {
  const f = useCurrentFrame();
  const fade = useSceneFade();
  const zipP = spr(f, 108, 16);
  const open = interpolate(f, [140, 176], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  const rise = spr(f, 156, 14);
  const travel = interpolate(f, [210, 268], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  const check = spr(f, 272, 14);
  const copy = spr(f, 304, 18);
  const iconX = 700 + travel * 620;
  const iconY = 640 - rise * 90 - Math.sin(travel * Math.PI) * 60;

  // After the ZIP / managed-device story lands (~f300), those props exit and
  // the first-launch warning-bypass beat takes the stage (f322+).
  const exit = interpolate(f, [300, 332], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  const warnHead = spr(f, 322, 16);
  const macCard = spr(f, 336, 16);
  const winCard = spr(f, 350, 16);
  const trust = spr(f, 402, 18);

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Backdrop seed={7} />
      <SceneChip n="05" label="Runs anywhere" />
      {/* platform cards */}
      {PLATFORMS.map(({ name, Icon, x }, i) => {
        const p = spr(f, 34 + i * 14, 16);
        return (
          <div key={name} style={{
            position: "absolute", left: x, top: 210, width: 300, height: 210,
            background: C.panel, border: `1.5px solid ${C.border}`, borderRadius: 18,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
            opacity: p, transform: `translateY(${(1 - p) * 40}px)`, boxShadow: "0 14px 40px #00000066",
          }}>
            <Icon />
            <div style={{ fontFamily: FONT.sans, fontSize: 30, fontWeight: 700, color: C.text }}>{name}</div>
            <div style={{ fontFamily: FONT.mono, fontSize: 20, color: C.muted }}>portable ZIP</div>
          </div>
        );
      })}
      {/* zip file */}
      <div style={{ position: "absolute", left: 520, top: 660, opacity: zipP * (1 - exit), transform: `translateY(${(1 - zipP) * 30 - exit * 24}px)` }}>
        <div style={{
          width: 380, height: 110, background: C.hover, border: `1.5px solid ${C.border}`, borderRadius: 14,
          display: "flex", alignItems: "center", gap: 16, padding: "0 22px", position: "relative", overflow: "visible",
        }}>
          <svg width="40" height="48" viewBox="0 0 40 48">
            <rect x="2" y="2" width="36" height="44" rx="5" fill="none" stroke={C.warning} strokeWidth="2.5" />
            {[8, 16, 24, 32].map((y) => <rect key={y} x="17" y={y} width="6" height="5" fill={C.warning} />)}
          </svg>
          <div style={{ fontFamily: FONT.mono, fontSize: 22, color: C.text, lineHeight: 1.4 }}>
            pagebox-0.1.2<br /><span style={{ color: C.muted }}>portable.zip</span>
          </div>
          {/* flap */}
          <div style={{
            position: "absolute", left: 0, top: -26, width: 380, height: 26, background: C.border,
            borderRadius: "10px 10px 0 0", transformOrigin: "bottom left",
            transform: `rotateX(${open * 110}deg) skewX(${open * -14}deg) translateY(${open * -10}px)`,
            opacity: 1 - open * 0.5,
          }} />
        </div>
        <div style={{ fontFamily: FONT.mono, fontSize: 22, color: C.muted, marginTop: 14, textAlign: "center" }}>
          unzip → run · no installer
        </div>
      </div>
      {/* rising icon */}
      <div style={{ position: "absolute", left: iconX, top: iconY, opacity: rise * (1 - exit), transform: `scale(${0.6 + 0.4 * rise})` }}>
        <BoxLogo size={110} glow />
      </div>
      {/* managed device */}
      <div style={{ position: "absolute", left: 1280, top: 560, opacity: spr(f, 190, 16) * (1 - exit) }}>
        <svg width="300" height="210" viewBox="0 0 300 210">
          <rect x="40" y="10" width="220" height="140" rx="12" fill={C.inset} stroke={C.border} strokeWidth="3" />
          <path d="M20 160 h260 l-14 26 h-232 z" fill={C.hover} stroke={C.border} strokeWidth="2.5" />
          {/* padlock stays locked */}
          <g transform="translate(128,52)">
            <path d="M8 22 v-8 a14 14 0 0 1 28 0 v8" fill="none" stroke={C.warning} strokeWidth="5" />
            <rect x="0" y="22" width="44" height="34" rx="7" fill={C.warning} />
            <circle cx="22" cy="38" r="5" fill={C.inset} />
          </g>
        </svg>
        <div style={{ fontFamily: FONT.mono, fontSize: 21, color: C.muted, textAlign: "center", marginTop: 6 }}>
          school-managed device
        </div>
        {check > 0 && (
          <div style={{
            position: "absolute", left: 60, top: -56, display: "flex", gap: 12, alignItems: "center",
            fontFamily: FONT.sans, fontSize: 27, fontWeight: 700, color: C.success,
            border: `1.5px solid ${C.success}88`, background: `${C.success}14`, borderRadius: 12, padding: "10px 20px",
            opacity: check, transform: `translateY(${(1 - check) * 18}px)`, whiteSpace: "nowrap",
          }}>✓ Runs on managed machines</div>
        )}
      </div>

      {/* ── First-launch warning bypass (macOS quarantine / Windows SmartScreen) ── */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 448, textAlign: "center",
        opacity: warnHead, transform: `translateY(${(1 - warnHead) * 22}px)`,
        fontFamily: FONT.sans, fontSize: 34, fontWeight: 800, color: C.text,
      }}>
        <span style={{ color: C.warning }}>⚠</span> First launch: expect a warning — clear it once
      </div>

      {/* macOS card */}
      <div style={{ ...cardStyle, left: 120, opacity: macCard, transform: `translateY(${(1 - macCard) * 30}px)` }}>
        <div style={titleRow}>
          <MiniIcon><Apple /></MiniIcon>
          <span style={cardName}>macOS</span>
          <WarnChip>Gatekeeper</WarnChip>
        </div>
        <div style={quote}>“Pagebox is damaged and can’t be opened”</div>
        <div style={sub}>= quarantine flag on an unsigned app, not actual damage</div>
        <Term prompt="$" cmd="xattr -dr com.apple.quarantine ~/Downloads/Pagebox.app" />
        <div style={hint}>Just downloaded? It’s in Downloads — no need to move it to Applications. App elsewhere? Drag it into Terminal to auto-fill its path.</div>
      </div>

      {/* Windows card */}
      <div style={{ ...cardStyle, left: 1000, opacity: winCard, transform: `translateY(${(1 - winCard) * 30}px)` }}>
        <div style={titleRow}>
          <MiniIcon><Win /></MiniIcon>
          <span style={cardName}>Windows</span>
          <WarnChip>SmartScreen</WarnChip>
        </div>
        <div style={quote}>“Windows protected your PC”</div>
        <div style={sub}>unsigned app — not a malware verdict</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: FONT.mono, fontSize: 20 }}>
          <span style={{ border: `1px solid ${C.border}`, background: C.hover, color: C.text, borderRadius: 8, padding: "6px 14px" }}>More info</span>
          <span style={{ color: C.muted }}>→</span>
          <span style={{ border: `1px solid ${C.accent}88`, background: `${C.accent}1f`, color: C.accentFg, borderRadius: 8, padding: "6px 14px" }}>Run anyway</span>
        </div>
        <Term prompt="PS>" cmd="Unblock-File ~/Downloads/Pagebox.exe" />
        <div style={hint}>Point it at your Pagebox.exe — usually in Downloads. Or: right-click it → Properties → tick Unblock.</div>
      </div>

      {/* trust / honesty note */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 852, textAlign: "center",
        opacity: trust, fontFamily: FONT.mono, fontSize: 21, color: C.muted,
      }}>
        Only bypass warnings for apps you trust · if school policy blocks it, ask IT · full steps in INSTALLATION.md
      </div>

      {/* bottom copy */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 900, textAlign: "center", opacity: copy, transform: `translateY(${(1 - copy) * 26}px)` }}>
        <div style={{ fontFamily: FONT.sans, fontSize: 46, fontWeight: 800, color: C.text }}>
          No installer. No admin rights.
        </div>
        <div style={{ fontFamily: FONT.mono, fontSize: 26, color: C.accentFg, marginTop: 12 }}>
          portable ZIP builds · macOS · Windows · Linux
        </div>
      </div>
    </AbsoluteFill>
  );
};
