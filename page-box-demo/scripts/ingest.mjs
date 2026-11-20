// Scans videos/ for recorded takes (S<n>-pt<k>.mov / S4-LiveSearch.mov),
// probes them, ensures H.264, hard-links into public/videos/ and writes
// src/footage.json so the Remotion timeline swaps mocks for real footage.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const srcDir = path.join(root, "videos");
const pubDir = path.join(root, "public", "videos");
fs.mkdirSync(pubDir, { recursive: true });

const probe = (f) => {
  const out = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=codec_name,width,height,r_frame_rate,duration",
    "-of", "json", f], { encoding: "utf8" });
  const s = JSON.parse(out).streams[0];
  const [n, d] = s.r_frame_rate.split("/").map(Number);
  return { codec: s.codec_name, width: s.width, height: s.height,
    fps: n / d, durationSec: parseFloat(s.duration) };
};

const manifest = { S3: { pt1: null, pt2: null }, S4: { pt1: null }, S5: { pt1: null, pt2: null } };
const files = fs.readdirSync(srcDir).filter((f) => /\.(mov|mp4)$/i.test(f));

for (const f of files) {
  const m = f.match(/^S(\d+)-(pt\d+|LiveSearch)\.(mov|mp4)$/i);
  if (!m) { console.log(`skip (unrecognized): ${f}`); continue; }
  const scene = `S${m[1]}`;
  const part = m[2].toLowerCase() === "livesearch" ? "pt1" : m[2].toLowerCase();
  if (!manifest[scene]) manifest[scene] = {};
  const full = path.join(srcDir, f);
  let info = probe(full);
  let target = f;
  if (info.codec !== "h264") {
    target = f.replace(/\.(mov|mp4)$/i, ".h264.mp4");
    console.log(`transcoding ${f} (${info.codec}) -> ${target}`);
    execFileSync("ffmpeg", ["-y", "-v", "error", "-i", full, "-c:v", "libx264",
      "-crf", "18", "-preset", "fast", "-an", path.join(pubDir, target)], { stdio: "inherit" });
    info = probe(path.join(pubDir, target));
  } else {
    const dest = path.join(pubDir, target);
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    try { fs.linkSync(full, dest); } catch { fs.copyFileSync(full, dest); }
  }
  manifest[scene][part] = { file: `videos/${target}`, fps: info.fps,
    width: info.width, height: info.height, durationSec: info.durationSec,
    frames: Math.round(info.durationSec * info.fps) };
  console.log(`ok ${scene}.${part}: ${info.width}x${info.height} @${info.fps}fps, ${info.durationSec.toFixed(2)}s (${info.codec})`);
}

fs.writeFileSync(path.join(root, "src", "footage.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("\nwrote src/footage.json");
for (const [s, parts] of Object.entries(manifest))
  for (const [p, e] of Object.entries(parts))
    if (!e) console.log(`MISSING ${s}.${p} — mock stand-in will be used`);
