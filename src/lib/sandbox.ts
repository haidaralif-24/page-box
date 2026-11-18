/**
 * Sandboxed preview helpers (SECURITY.md).
 *
 * Untrusted HTML is only ever rendered inside
 * `<iframe sandbox="allow-scripts" srcdoc=...>` — never with
 * `allow-same-origin`, so the page gets an opaque origin and cannot reach
 * the parent window or Tauri's IPC.
 *
 * Network is blocked by default by injecting a CSP `<meta>` into the page.
 * The per-page "Allow internet" toggle (v0.4) will relax this.
 */

export const PREVIEW_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src data: blob:",
  "font-src data:",
  "media-src data: blob:",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "frame-src 'none'",
].join("; ");

const CSP_META = `<meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}">`;

/**
 * Inject the CSP meta as early as possible: right after `<head>` if present,
 * else right after `<html>`, else after a leading doctype, else at the top.
 */
export function buildSandboxedHtml(html: string): string {
  const head = /<head(?:\s[^>]*)?>/i.exec(html);
  if (head) return insertAt(html, head.index + head[0].length, CSP_META);

  const htmlTag = /<html(?:\s[^>]*)?>/i.exec(html);
  if (htmlTag) return insertAt(html, htmlTag.index + htmlTag[0].length, CSP_META);

  const doctype = /^\s*<!doctype[^>]*>/i.exec(html);
  if (doctype) return insertAt(html, doctype[0].length, CSP_META);

  return CSP_META + html;
}

function insertAt(text: string, index: number, insertion: string): string {
  return text.slice(0, index) + insertion + text.slice(index);
}
