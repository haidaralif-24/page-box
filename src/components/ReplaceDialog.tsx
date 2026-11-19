import { useEffect, useMemo, useRef, useState } from "react";
import { cleanInput } from "../lib/cleaning";

interface ReplaceDialogProps {
  currentHtml: string;
  onSave: (rawText: string) => Promise<void>;
  onClose: () => void;
}

export function ReplaceDialog({ currentHtml, onSave, onClose }: ReplaceDialogProps) {
  const [raw, setRaw] = useState(currentHtml);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const cleaned = useMemo(() => cleanInput(raw), [raw]);
  const hasText = raw.trim().length > 0;

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    if (!hasText || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(raw);
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  }

  return (
    <div
      className="dialog-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Replace page">
        <h2>Replace page</h2>
        <p className="dialog-hint">
          Paste the new HTML. The current version will be saved in history.
        </p>
        <textarea
          ref={textareaRef}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void save();
          }}
          placeholder={"<!doctype html>\n<html>…\n</html>"}
          spellCheck={false}
          aria-label="New HTML content"
        />
        {hasText && (
          <p className="dialog-status">
            {cleaned.looksLikeHtml ? (
              <>
                Detected title: <strong>{cleaned.title}</strong>
              </>
            ) : (
              <span className="warning">
                This doesn't look like HTML — you can still save it.
              </span>
            )}
          </p>
        )}
        {error && <p className="error">{error}</p>}
        <div className="dialog-actions">
          <button className="btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="btn primary"
            onClick={() => void save()}
            disabled={!hasText || saving}
          >
            {saving ? "Replacing…" : "Replace page"}
          </button>
        </div>
        <p className="dialog-shortcut">Ctrl+Enter to save · Esc to close</p>
      </div>
    </div>
  );
}