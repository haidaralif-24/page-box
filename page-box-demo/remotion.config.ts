import path from "node:path";
import fs from "node:fs";
import { Config } from "@remotion/cli/config";

// School Mac = Scalefusion MDM + Veltar SecureWebGateway. Two environment fixes:
//  1) scripts/patch-remotion-lan.mjs makes Remotion serve/navigate via the LAN IP
//     (the SWG stalls Chrome's loopback HTTP but allows LAN traffic).
//  2) Use a full Chrome for Testing build (.browser/, via scripts/browser.mjs):
//     the bundled headless shell aborts in InitializeICU on macOS 26. The wrapper
//     injects --no-sandbox. chrome-for-testing mode selects --headless=new.
const wrapper = path.resolve(process.cwd(), ".browser/chrome-wrapper.sh");
if (fs.existsSync(wrapper)) {
  Config.setBrowserExecutable(wrapper);
  Config.setChromeMode("chrome-for-testing");
}
Config.setChromiumOpenGlRenderer("angle");
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency("50%");

// Increase timeout for heavy video processing (e.g., large .mov files)
Config.setDelayRenderTimeoutInMilliseconds(60000);
