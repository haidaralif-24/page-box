import { useEffect, useMemo, useState } from "react";
import { copyToClipboard } from "../lib/backend";
import {
  BugIcon,
  FeatureIcon,
  PaletteIcon,
  SmartphoneIcon,
  AccessibilityIcon,
  CopyIcon,
  CloseIcon,
} from "./Icons";

interface CopyForAIDialogProps {
  html: string;
  pageTitle: string;
  onClose: () => void;
  onCopied: (message: string) => void;
}

type Template = {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
};

const TEMPLATES: Template[] = [
  {
    id: "fix",
    label: "Fix bugs",
    icon: <BugIcon size={14} />,
    prompt: "fix any bugs or issues in this code",
  },
  {
    id: "feature",
    label: "Add a feature",
    icon: <FeatureIcon size={14} />,
    prompt: "add a new feature to this page based on my request below",
  },
  {
    id: "design",
    label: "Improve design",
    icon: <PaletteIcon size={14} />,
    prompt: "improve the visual design, layout, and styling of this page",
  },
  {
    id: "responsive",
    label: "Make responsive",
    icon: <SmartphoneIcon size={14} />,
    prompt: "make this page fully responsive for mobile, tablet, and desktop",
  },
  {
    id: "a11y",
    label: "Improve accessibility",
    icon: <AccessibilityIcon size={14} />,
    prompt: "improve the accessibility (ARIA, semantics, keyboard nav, contrast)",
  },
];

export function CopyForAIDialog({
  html,
  pageTitle,
  onClose,
  onCopied,
}: CopyForAIDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customRequest, setCustomRequest] = useState("");
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prompt = useMemo(() => {
    const templateText =
      TEMPLATES.find((t) => t.id === selectedTemplate)?.prompt ??
      "modify this HTML code based on my request below";

    const parts: string[] = [
      `I have an HTML page titled "${pageTitle}". Please ${templateText}.`,
      "",
      "```html",
      html,
      "```",
    ];
    if (customRequest.trim()) {
      parts.push("", `Specific request: ${customRequest.trim()}`);
    }
    return parts.join("\n");
  }, [html, pageTitle, selectedTemplate, customRequest]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleCopy() {
    setCopying(true);
    setError(null);
    try {
      await copyToClipboard(prompt);
      onCopied("Prompt copied to clipboard! Paste it into ChatGPT / Claude / etc.");
      onClose();
    } catch (e) {
      setError("Failed to copy: " + String(e));
    } finally {
      setCopying(false);
    }
  }

  return (
    <div
      className="dialog-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="dialog dialog-wide"
        role="dialog"
        aria-modal="true"
        aria-label="Copy prompt for AI"
      >
        <div className="dialog-header">
          <h2>Build a prompt for AI</h2>
          <button className="icon-btn" onClick={onClose} title="Close">
            <CloseIcon size={16} />
          </button>
        </div>

        <p className="dialog-hint">
          Pick a goal, optionally add a specific request, and copy the full
          prompt (with your HTML) to paste into any AI chat.
        </p>

        <div className="template-grid">
          {TEMPLATES.map((t) => {
            const active = selectedTemplate === t.id;
            return (
              <button
                key={t.id}
                className={"template-btn" + (active ? " active" : "")}
                onClick={() => setSelectedTemplate(active ? null : t.id)}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <label className="dialog-label">
          Specific request <span className="muted">(optional)</span>
        </label>
        <textarea
          className="dialog-textarea"
          value={customRequest}
          onChange={(e) => setCustomRequest(e.target.value)}
          placeholder="e.g. Make the primary button blue, and add a quiz at the end."
          rows={3}
          spellCheck={false}
        />

        <label className="dialog-label">Preview</label>
        <pre className="prompt-preview">{prompt}</pre>

        <div className="dialog-meta">
          <span className="muted">{prompt.length} characters</span>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="dialog-actions">
          <button className="btn" onClick={onClose} disabled={copying}>
            Cancel
          </button>
          <button
            className="btn primary"
            onClick={() => void handleCopy()}
            disabled={copying}
          >
            <CopyIcon size={14} />
            <span>{copying ? "Copying…" : "Copy full prompt"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
