// Scalefusion MDM + Veltar SecureWebGateway on this school Mac stalls Chrome's
// LOOPBACK (localhost/127.0.0.1) HTTP, but allows LAN-IP traffic. Remotion serves
// its bundle on localhost, so renders hang. This patch makes Remotion bind the
// bundle server to 0.0.0.0 and navigate Chrome via the machine's LAN IP.
// Idempotent; modifies node_modules only (gitignored). Re-run after pnpm install.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const lanIp = Object.values(os.networkInterfaces()).flat()
  .find((i) => i && i.family === "IPv4" && !i.internal && /^(192\.168|10\.|172\.)/.test(i.address))?.address;
if (!lanIp) { console.error("No LAN IPv4 found; cannot patch."); process.exit(1); }

const root = path.resolve(import.meta.dirname, "..");
const pnpm = path.join(root, "node_modules/.pnpm");
const rdir = fs.readdirSync(pnpm).find((d) => d.startsWith("@remotion+renderer@"));
if (!rdir) { console.error("renderer not found in .pnpm"); process.exit(1); }
const dist = path.join(pnpm, rdir, "node_modules/@remotion/renderer/dist");
const serve = path.join(dist, "serve-static.js");
const prep = path.join(dist, "prepare-server.js");

let s = fs.readFileSync(serve, "utf8");
if (s.includes("const host = '127.0.0.1';")) {
  s = s.replace("const host = '127.0.0.1';", "const host = '0.0.0.0'; // LAN patch (SWG blocks loopback)");
  fs.writeFileSync(serve, s); console.log("patched serve-static.js -> bind 0.0.0.0");
} else console.log("serve-static.js already patched");

let p = fs.readFileSync(prep, "utf8");
const needle = "serveUrl: `http://localhost:${serverPort}`";
// Resolve the LAN IP at RUNTIME, not patch time: school DHCP moves this Mac
// between subnets, and a baked-in IP goes stale (Chrome: ERR_CONNECTION_RESET).
const dyn = 'serveUrl: `http://${(() => { const os = require("node:os"); const ip = Object.values(os.networkInterfaces()).flat().find((i) => i && i.family === "IPv4" && !i.internal && /^(192\\.168|10\\.|172\\.)/.test(i.address)); return ip ? ip.address : "localhost"; })()}:${serverPort}` /* LAN patch (dynamic) */';
const oldBaked = /serveUrl: `http:\/\/[\d.]+:\$\{serverPort\}` \/\* LAN patch \*\//;
if (p.includes("/* LAN patch (dynamic) */")) {
  console.log("prepare-server.js already patched (dynamic LAN IP)");
} else if (p.includes(needle)) {
  p = p.replace(needle, dyn);
  fs.writeFileSync(prep, p); console.log("patched prepare-server.js -> serveUrl uses runtime LAN IP");
} else if (oldBaked.test(p)) {
  p = p.replace(oldBaked, dyn);
  fs.writeFileSync(prep, p); console.log("refreshed stale baked-in LAN IP -> runtime LAN IP lookup");
} else { console.error("serveUrl needle not found — Remotion version changed?"); process.exit(1); }

// 3) OffthreadVideo frame extraction: the browser bundle hardcodes
//    http://localhost:<proxyPort>/proxy — SWG stalls that loopback request,
//    so delayRender("Fetching .../proxy?src=...") times out after 28s.
//    The proxy is the SAME server as the bundle (offthreadPort = serverPort,
//    already bound to 0.0.0.0 above), so use the page's own host instead.
//    Patch both the CJS and ESM builds (webpack bundles the ESM one).
const coreDist = path.join(root, "node_modules", "remotion", "dist");
const proxyNeedle = "http://localhost:${window.remotion_proxyPort}";
const proxyFix = "http://${window.location.hostname}:${window.remotion_proxyPort}";
let replaced = 0, already = 0;
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { walk(full); continue; }
    if (!/\.(js|mjs)$/.test(e.name)) continue;
    const src = fs.readFileSync(full, "utf8");
    if (src.includes(proxyNeedle)) {
      fs.writeFileSync(full, src.split(proxyNeedle).join(proxyFix));
      replaced++; console.log(`patched proxy host -> location.hostname: ${path.relative(root, full)}`);
    } else if (src.includes(proxyFix)) already++;
  }
};
walk(coreDist);
if (replaced === 0 && already === 0) {
  console.error("OffthreadVideo proxy needle not found — Remotion version changed?");
  process.exit(1);
}
if (replaced === 0) console.log("offthread-video proxy already patched");

console.log("LAN IP:", lanIp);
