
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CircleHelp, X } from "lucide-react";

type ConfirmVariant = "danger" | "warning" | "default";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

const variants = {
  danger: {
    icon: "bg-red-500/10 text-red-400",
    button: "bg-red-500 text-white hover:bg-red-400",
  },
  warning: {
    icon: "bg-gold/10 text-gold",
    button: "bg-gold text-obsidian hover:bg-gold/90",
  },
  default: {
    icon: "bg-gold/10 text-gold",
    button: "bg-gold text-obsidian hover:bg-gold/90",
  },
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    cancelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  const style = variants[variant];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => {
          if (!loading) onCancel();
        }}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          aria-label="Close dialog"
          className="absolute right-5 top-5 text-muted transition-colors hover:text-white disabled:opacity-40"
        >
          <X size={18} />
        </button>

        <div
          className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${style.icon}`}
        >
          {variant === "danger" ? (
            <AlertTriangle size={22} />
          ) : (
            <CircleHelp size={22} />
          )}
        </div>

        <h2
          id={titleId}
          className="font-display text-2xl font-bold text-white"
        >
          {title}
        </h2>

        <p
          id={descriptionId}
          className="mt-3 text-sm leading-6 text-muted"
        >
          {description}
        </p>

        {children && (
          <div className="mt-5">{children}</div>
        )}

        <div className="mt-7 flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-border bg-surface-hover px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-muted disabled:opacity-40"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-40 ${style.button}`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
