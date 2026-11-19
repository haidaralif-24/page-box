import { useEffect, useRef } from "react";
import { CloseIcon } from "./Icons";

interface ConfirmDialogProps {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A custom modal that replaces `window.confirm()`, which does not work
 * in Tauri's webview (WKWebView). Supports keyboard shortcuts:
 *   - Enter  -> confirm
 *   - Escape -> cancel
 */
export function ConfirmDialog({
  title = "Confirm",
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onConfirm, onCancel]);

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div
        className="dialog confirm-dialog"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <h2 id="confirm-title">{title}</h2>
        <p className="dialog-hint">{message}</p>
        <div className="dialog-actions">
          <button className="btn" onClick={onCancel} ref={cancelRef}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${danger ? "danger" : "primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ToastProps {
  message: string;
  onClose: () => void;
  durationMs?: number;
}

/**
 * A simple auto-dismissing toast, replacing `window.alert()` for
 * non-critical notifications (e.g. "copied to clipboard").
 */
export function Toast({ message, onClose, durationMs = 2500 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [onClose, durationMs]);

  return (
    <div className="toast" role="status" aria-live="polite">
      <span>{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss">
        <CloseIcon size={16} />
      </button>
    </div>
  );
}
