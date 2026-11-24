
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CircleHelp, X } from "lucide-react";
import Button from "./Button";

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
    icon: "bg-danger/10 text-danger",
    button: "danger",
  },
  warning: {
    icon: "bg-accent/10 text-ink",
    button: "accent",
  },
  default: {
    icon: "bg-accent/10 text-ink",
    button: "accent",
  },
} as const;

// Shared confirmation dialog with focus, Escape-key, and backdrop handling.
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
        className="absolute inset-0 bios-backdrop"
        onClick={() => {
          if (!loading) onCancel();
        }}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative w-full max-w-md modal-surface"
      >
        <Button
          variant="ghost"
          type="button"
          onClick={onCancel}
          disabled={loading}
          aria-label="Close dialog"
          className="absolute right-5 top-4 min-h-0 border-0 bg-transparent p-0 text-muted transition-colors hover:bg-transparent hover:text-ink disabled:opacity-40"
        >
          <X strokeWidth={1.5} size={18} />
        </Button>

        <div
          className={`mb-3 flex size-9 items-center justify-center ${style.icon}`}
        >
          {variant === "danger" ? (
            <AlertTriangle strokeWidth={1.5} size={22} />
          ) : (
            <CircleHelp strokeWidth={1.5} size={22} />
          )}
        </div>

        <h2
          id={titleId}
          className="font-display text-xl font-semibold text-ink"
        >
          {title}
        </h2>

        <p
          id={descriptionId}
          className="mt-3 font-body text-sm leading-6 text-muted"
        >
          {description}
        </p>

        {children && (
          <div className="mt-5">{children}</div>
        )}

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="min-w-20"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={style.button}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="min-w-20"
          >
            {loading ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
