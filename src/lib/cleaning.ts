/**
 * Input cleaning for pasted AI output (SPEC.md §7.1).
 *
 * Mirrors `src-tauri/src/cleaning.rs` so the paste dialog can show instant
 * feedback (detected title, "doesn't look like HTML" warning). The Rust side
 * re-cleans on save and is the source of truth. Keep the two in sync.
 */

export interface CleanedInput {
  html: string;
  title: string;
  looksLikeHtml: boolean;
}

const FALLBACK_TITLE = "Untitled page";

export function cleanInput(raw: string): CleanedInput {
  const normalized = raw.replace(/\r\n/g, "\n");
  const unfenced = stripCodeFences(normalized);
  const html = extractHtml(unfenced);
  return {
    html,
    title: detectTitle(html),
    looksLikeHtml: looksLikeHtml(html),
  };
}

/** Keep only fenced content when markdown code fences are present. */
function stripCodeFences(raw: string): string {
  let inside = false;
  let foundFence = false;
  const kept: string[] = [];
  for (const line of raw.split("\n")) {
    if (line.trimStart().startsWith("```")) {
      foundFence = true;
      inside = !inside;
      continue;
    }
    if (inside) kept.push(line);
  }
  return foundFence ? kept.join("\n") : raw;
}

/** First `<!doctype` or `<html` to the last `</html>`; fragments kept as-is. */
function extractHtml(text: string): string {
  const candidates = [text.search(/<!doctype/i), findTag(text, "html")].filter(
    (i) => i >= 0,
  );
  if (candidates.length === 0) return text.trim();
  const start = Math.min(...candidates);
  const closeRe = /<\/html/gi;
  let last = -1;
  let m: RegExpExecArray | null;
  while ((m = closeRe.exec(text)) !== null) last = m.index;
  const end = last >= 0 ? last + "</html>".length : text.length;
  return (end > start ? text.slice(start, end) : text.slice(start)).trim();
}

/** Contents of the first `<title>`, whitespace collapsed; else fallback. */
function detectTitle(html: string): string {
  const open = findTag(html, "title");
  if (open < 0) return FALLBACK_TITLE;
  const gt = html.indexOf(">", open);
  if (gt < 0) return FALLBACK_TITLE;
  const contentStart = gt + 1;
  const close = html.slice(contentStart).search(/<\/title/i);
  if (close < 0) return FALLBACK_TITLE;
  const title = html
    .slice(contentStart, contentStart + close)
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
  return title || FALLBACK_TITLE;
}

function looksLikeHtml(text: string): boolean {
  return /<[a-zA-Z!]/.test(text);
}

/** `<name` followed by `>`, `/`, whitespace, or end — so `<titlex` ≠ `<title`. */
function findTag(text: string, name: string): number {
  const m = new RegExp(`<${name}(?=[\\s/>]|$)`, "i").exec(text);
  return m ? m.index : -1;
}
