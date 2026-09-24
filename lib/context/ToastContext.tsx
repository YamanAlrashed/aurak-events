"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ToastVariant =
  | "success"
  | "error"
  | "info";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (toast: {
    title: string;
    description?: string;
    variant?: ToastVariant;
  }) => void;
}

const ToastContext =
  createContext<ToastContextValue | null>(
    null
  );

const AUTO_DISMISS_MS = 4000;

const VARIANT_STYLE: Record<
  ToastVariant,
  {
    className: string;
    icon: React.ReactNode;
  }
> = {
  success: {
    className:
      "border-[#c9e7da] bg-[var(--aurak-success-soft)] text-[#136242]",
    icon: (
      <CheckCircle2 className="h-4 w-4 shrink-0" />
    ),
  },

  error: {
    className:
      "border-[#f4cdc9] bg-[var(--aurak-danger-soft)] text-[#8f1f19]",
    icon: (
      <AlertTriangle className="h-4 w-4 shrink-0" />
    ),
  },

  info: {
    className:
      "border-[#cddff0] bg-[var(--aurak-info-soft)] text-[#17497a]",
    icon: (
      <Info className="h-4 w-4 shrink-0" />
    ),
  },
};

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] =
    useState<Toast[]>([]);
  const [mounted, setMounted] =
    useState(false);

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback(
    (id: string) => {
      setToasts((current) =>
        current.filter(
          (toast) =>
            toast.id !== id
        )
      );
    },
    []
  );

  const showToast =
    useCallback<
      ToastContextValue["showToast"]
    >(
      ({
        title,
        description,
        variant = "success",
      }) => {
        const id = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

        setToasts((current) => [
          ...current,
          {
            id,
            title,
            description,
            variant,
          },
        ]);

        setTimeout(
          () => dismiss(id),
          AUTO_DISMISS_MS
        );
      },
      [dismiss]
    );

  const value = useMemo(
    () => ({ showToast }),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={value}
    >
      {children}

      {mounted &&
        createPortal(
          <div
            className="pointer-events-none fixed inset-x-4 bottom-20 z-[110] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end"
            role="status"
            aria-live="polite"
          >
            {toasts.map((toast) => {
              const style =
                VARIANT_STYLE[
                  toast.variant
                ];

              return (
                <div
                  key={toast.id}
                  className={cn(
                    "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-[var(--aurak-radius)] border px-3.5 py-3 text-sm shadow-[var(--aurak-shadow-md)]",
                    style.className
                  )}
                >
                  {style.icon}

                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {toast.title}
                    </p>

                    {toast.description && (
                      <p className="mt-0.5 text-xs opacity-90">
                        {
                          toast.description
                        }
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      dismiss(toast.id)
                    }
                    aria-label="Dismiss"
                    className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context =
    useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast must be used inside <ToastProvider>."
    );
  }

  return context;
}