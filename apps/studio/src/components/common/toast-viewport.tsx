"use client";

import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";

import { useUiStore, type Toast } from "@/store/ui-store";
import { cn } from "@/lib/cn";

const ICONS: Record<Toast["variant"], typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: XCircle,
};

const VARIANT_CLASS: Record<Toast["variant"], string> = {
  info: "border-border bg-bg-elevated text-text-primary",
  success: "border-status-2xx/40 bg-status-2xx/10 text-status-2xx",
  warning: "border-status-3xx/40 bg-status-3xx/10 text-status-3xx",
  error: "border-status-5xx/40 bg-status-5xx/10 text-status-5xx",
};

/**
 * Floating toast stack. Positioned absolutely so it overlays every panel
 * without participating in layout.
 */
export function ToastViewport() {
  const toasts = useUiStore((state) => state.toasts);
  const dismiss = useUiStore((state) => state.dismissToast);

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2"
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.variant];
        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 shadow-md backdrop-blur",
              VARIANT_CLASS[toast.variant],
            )}
          >
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium">{toast.title}</span>
              {toast.description ? (
                <span className="text-xs text-text-muted">{toast.description}</span>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismiss(toast.id)}
              className="text-text-muted hover:text-text-primary"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}