// Downloads a full Chrome for Testing build (the bundled headless shell crashes
// in InitializeICU on managed macOS 26). Idempotent.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const bin = path.join(root, ".browser/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
if (fs.existsSync(bin)) { console.log("Chrome for Testing already present."); process.exit(0); }
const ver = JSON.parse(execFileSync("curl", ["-s", "--max-time", "30",
  "https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json"], { encoding: "utf8" }))
  .channels.Stable.version;
const url = `https://storage.googleapis.com/chrome-for-testing-public/${ver}/mac-arm64/chrome-mac-arm64.zip`;
fs.mkdirSync(path.join(root, ".browser"), { recursive: true });
const zip = path.join(root, ".browser/chrome-mac-arm64.zip");
console.log(`downloading Chrome for Testing ${ver} …`);
execFileSync("curl", ["-sL", "--max-time", "600", "-o", zip, url], { stdio: "inherit" });
execFileSync("unzip", ["-q", zip], { cwd: path.join(root, ".browser"), stdio: "inherit" });
fs.unlinkSync(zip);
console.log("ready:", bin);
