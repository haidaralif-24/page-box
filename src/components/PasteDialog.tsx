import { useEffect, useMemo, useRef, useState } from "react";
import { cleanInput } from "../lib/cleaning";
import { GenerateHTMLPromptDialog } from "./GenerateHTMLPromptDialog";
import { SparklesIcon } from "./Icons";

interface PasteDialogProps {
  onSave: (rawText: string) => Promise<void>;
  onClose: () => void;
  onCopied?: (message: string) => void;
}

export function PasteDialog({ onSave, onClose, onCopied }: PasteDialogProps) {
  const [raw, setRaw] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
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
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Add a page">
        <h2>Add a page</h2>

        <button
          type="button"
          className="generate-prompt-btn"
          onClick={() => setShowGenerate(true)}
        >
          <SparklesIcon size={16} />
          <div className="generate-prompt-text">
            <span className="generate-prompt-title">
              Need HTML? Generate a prompt for AI
            </span>
            <span className="generate-prompt-hint">
              Describe what you want to learn and get a ready-made interactive
              lesson.
            </span>
          </div>
        </button>

        <p className="dialog-hint">
          Or paste the HTML your AI tool gave you. Code fences and extra prose
          are cleaned up automatically.
        </p>
        <textarea
          ref={textareaRef}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void save();
          }}
          placeholder={"```html\n<!doctype html>\n<html>…\n```"}
          spellCheck={false}
          aria-label="Pasted text"
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
            {saving ? "Saving…" : "Save page"}
          </button>
        </div>
        <p className="dialog-shortcut">Ctrl+Enter to save · Esc to close</p>
      </div>

      {showGenerate && (
        <GenerateHTMLPromptDialog
          onClose={() => setShowGenerate(false)}
          onCopied={(msg) => onCopied?.(msg)}
        />
      )}
    </div>
  );
}
