import { useEffect, useMemo, useState } from "react";
import { copyToClipboard } from "../lib/backend";
import { CopyIcon, CloseIcon, BookOpenIcon } from "./Icons";

interface GenerateHTMLPromptDialogProps {
  onClose: () => void;
  onCopied: (message: string) => void;
}

const SYSTEM_FRAME = (topic: string, extras: string): string => {
  const parts: string[] = [
    `Create a standalone, interactive HTML page that teaches the following material:`,
    "",
    `**Material / Topic:**`,
    topic || "[describe the topic here]",
    "",
    `**Requirements:**`,
    `- Output ONE single self-contained HTML file (all CSS and JavaScript embedded inline).`,
    `- Do NOT use external CDNs, libraries, or network requests.`,
    `- Include clear, accurate explanations suitable for a student.`,
    `- Add interactive elements that reinforce the material (e.g., quizzes, sliders, step-by-step animations, draggable diagrams, collapsible sections, or practice exercises).`,
    `- Use a clean, modern, readable design (semantic HTML, good typography, comfortable colors).`,
    `- Put a short summary of the topic near the top.`,
    `- End with 3-5 interactive practice questions that give immediate feedback.`,
  ];
  if (extras.trim()) {
    parts.push("", `**Additional instructions:**`, extras.trim());
  }
  parts.push(
    "",
    `Return ONLY the raw HTML code inside a single \`\`\`html code block — no other explanation.`,
  );
  return parts.join("\n");
};

export function GenerateHTMLPromptDialog({
  onClose,
  onCopied,
}: GenerateHTMLPromptDialogProps) {
  const [topic, setTopic] = useState("");
  const [extras, setExtras] = useState("");
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prompt = useMemo(
    () => SYSTEM_FRAME(topic.trim(), extras.trim()),
    [topic, extras],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleCopy() {
    if (!topic.trim()) {
      setError("Please describe the material/topic first.");
      return;
    }
    setCopying(true);
    setError(null);
    try {
      await copyToClipboard(prompt);
      onCopied(
        "Prompt copied! Paste it into ChatGPT / Claude / etc., then paste the HTML it gives you back into the Add page dialog.",
      );
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
        aria-label="Generate HTML prompt"
      >
        <div className="dialog-header">
          <h2>
            <BookOpenIcon size={18} />
            <span>Generate a lesson with AI</span>
          </h2>
          <button className="icon-btn" onClick={onClose} title="Close">
            <CloseIcon size={16} />
          </button>
        </div>

        <p className="dialog-hint">
          Describe the material you want to learn. Pagebox will build a prompt
          that asks an AI to create a standalone interactive HTML lesson for
          you. Copy it, paste it into your favorite AI, then paste the HTML it
          returns into the <strong>Add page</strong> textarea.
        </p>

        <label className="dialog-label">
          Material / Topic <span className="required">*</span>
        </label>
        <textarea
          className="dialog-textarea"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. The water cycle (evaporation, condensation, precipitation) for middle school students"
          rows={3}
          autoFocus
          spellCheck={false}
        />

        <label className="dialog-label">
          Extra instructions <span className="muted">(optional)</span>
        </label>
        <textarea
          className="dialog-textarea"
          value={extras}
          onChange={(e) => setExtras(e.target.value)}
          placeholder="e.g. Use a dark theme, include a drag-and-drop diagram, make it in Bahasa Indonesia"
          rows={2}
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
            disabled={copying || !topic.trim()}
          >
            <CopyIcon size={14} />
            <span>{copying ? "Copying…" : "Copy prompt"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
