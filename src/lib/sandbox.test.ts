import { describe, expect, it } from "vitest";
import { buildSandboxedHtml, PREVIEW_CSP } from "./sandbox";

describe("buildSandboxedHtml", () => {
  it("injects the CSP meta right after <head>", () => {
    const html = "<!doctype html><html><head><title>x</title></head><body></body></html>";
    const out = buildSandboxedHtml(html);
    expect(out).toContain(`<head><meta http-equiv="Content-Security-Policy"`);
    expect(out.indexOf("Content-Security-Policy")).toBeLessThan(
      out.indexOf("<title>"),
    );
  });

  it("handles <head> with attributes", () => {
    const out = buildSandboxedHtml('<html><head lang="en"><title>x</title></head></html>');
    expect(out).toContain('<head lang="en"><meta http-equiv="Content-Security-Policy"');
  });

  it("does not mistake <header> for <head>", () => {
    const out = buildSandboxedHtml("<html><body><header>hi</header></body></html>");
    // No head element: meta goes right after <html>, not inside <header>
    expect(out).toContain('<html><meta http-equiv="Content-Security-Policy"');
    expect(out).toContain("<header>hi</header>");
  });

  it("injects after <html> when there is no head", () => {
    const out = buildSandboxedHtml("<html><body><p>hi</p></body></html>");
    expect(out).toContain('<html><meta http-equiv="Content-Security-Policy"');
  });

  it("injects after a leading doctype for headless fragments", () => {
    const out = buildSandboxedHtml("<!doctype html><p>hi</p>");
    expect(out.startsWith('<!doctype html><meta http-equiv="Content-Security-Policy"')).toBe(true);
  });

  it("prepends for bare fragments", () => {
    const out = buildSandboxedHtml("<p>hi</p>");
    expect(out.startsWith('<meta http-equiv="Content-Security-Policy"')).toBe(true);
    expect(out.endsWith("<p>hi</p>")).toBe(true);
  });

  it("blocks network and keeps only inline scripts/styles and data/blob assets", () => {
    expect(PREVIEW_CSP).toContain("default-src 'none'");
    expect(PREVIEW_CSP).toContain("connect-src 'none'");
    expect(PREVIEW_CSP).not.toContain("http:");
    expect(PREVIEW_CSP).not.toContain("https:");
    expect(PREVIEW_CSP).not.toContain("'unsafe-eval'");
  });
});
