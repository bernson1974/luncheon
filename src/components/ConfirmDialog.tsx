"use client";

import { useEffect, type ReactNode } from "react";

type Props = {
  open: boolean;
  title?: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** danger = röd/grön app-stil; primary = mörkgrön CTA */
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="app-confirm-dialog-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="app-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={title ? "app-confirm-dialog-title" : undefined}
        aria-describedby="app-confirm-dialog-desc"
      >
        {title ? (
          <h2 id="app-confirm-dialog-title" className="app-confirm-dialog__title">
            {title}
          </h2>
        ) : null}
        <div id="app-confirm-dialog-desc" className="app-confirm-dialog__message">
          {message}
        </div>
        <div className="app-confirm-dialog__actions">
          <button type="button" className="secondary-button app-confirm-dialog__btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={
              confirmVariant === "primary" ? "primary-button app-confirm-dialog__btn" : "danger-button app-confirm-dialog__btn"
            }
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
