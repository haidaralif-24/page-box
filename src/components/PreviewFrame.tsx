import { buildSandboxedHtml } from "../lib/sandbox";

interface PreviewFrameProps {
  html: string;
  title: string;
}

/**
 * The ONLY place untrusted HTML is rendered (SECURITY.md).
 * `sandbox="allow-scripts"` without `allow-same-origin` gives the page an
 * opaque origin: no parent access, no Tauri IPC, no storage, no popups,
 * no top navigation. Network is blocked by the injected CSP meta.
 */
export function PreviewFrame({ html, title }: PreviewFrameProps) {
  return (
    <iframe
      className="preview-frame"
      title={`Preview of ${title}`}
      sandbox="allow-scripts"
      srcDoc={buildSandboxedHtml(html)}
    />
  );
}
