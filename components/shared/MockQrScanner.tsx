"use client";

import { useState } from "react";
import {
  QrCode,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { cn } from "@/lib/utils/cn";

export interface ScanSample {
  code: string;
  label: string;
  hint?: string;
}

export function MockQrScanner({
  onScan,
  samples = [],
  processing = false,
  className,
}: {
  onScan: (code: string) => void;
  samples?: ScanSample[];
  processing?: boolean;
  className?: string;
}) {
  const [
    manualCode,
    setManualCode,
  ] = useState("");

  function submitManual(
    event: React.FormEvent
  ) {
    event.preventDefault();

    const trimmed =
      manualCode.trim();

    if (!trimmed) return;

    onScan(trimmed);
    setManualCode("");
  }

  return (
    <div
      className={cn(
        "space-y-4",
        className
      )}
    >
      <div className="relative flex aspect-square w-full max-w-xs items-center justify-center overflow-hidden rounded-[var(--aurak-radius-xl)] border border-[var(--aurak-line)] bg-[var(--aurak-bg-sunken)] sm:mx-auto">
        <div className="absolute inset-6 rounded-[var(--aurak-radius-lg)] border-2 border-dashed border-[var(--aurak-line-strong)]" />

        <div className="relative flex flex-col items-center gap-2 px-6 text-center">
          <QrCode
            className="h-10 w-10 text-[var(--aurak-text-subtle)]"
            aria-hidden
          />

          <p className="text-sm font-medium text-[var(--aurak-navy)]">
            {processing
              ? "Reading code…"
              : "Camera not connected"}
          </p>

          <p className="text-xs text-[var(--aurak-text-muted)]">
            Prototype build — choose
            a code below to simulate
            a scan.
          </p>
        </div>
      </div>

      {samples.length > 0 && (
        <div className="space-y-2">
          <p className="label mb-0">
            Simulate a scan
          </p>

          <div className="space-y-2">
            {samples.map(
              (sample) => (
                <button
                  key={
                    sample.code
                  }
                  type="button"
                  disabled={
                    processing
                  }
                  onClick={() =>
                    onScan(
                      sample.code
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-[var(--aurak-radius)] border border-[var(--aurak-line)] bg-white px-3 py-3 text-left transition-colors hover:border-[var(--aurak-line-strong)] hover:bg-[var(--aurak-bg-subtle)] disabled:opacity-55"
                >
                  <ScanLine className="h-4 w-4 shrink-0 text-[var(--aurak-brand)]" />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--aurak-navy)]">
                      {
                        sample.label
                      }
                    </span>

                    {sample.hint && (
                      <span className="block truncate text-xs text-[var(--aurak-text-muted)]">
                        {
                          sample.hint
                        }
                      </span>
                    )}
                  </span>
                </button>
              )
            )}
          </div>
        </div>
      )}

      <form
        onSubmit={submitManual}
        className="space-y-2"
      >
        <label
          htmlFor="manual-code"
          className="label mb-0"
        >
          Or enter a code
        </label>

        <div className="flex gap-2">
          <Input
            id="manual-code"
            value={manualCode}
            onChange={(e) =>
              setManualCode(
                e.target.value
              )
            }
            placeholder="AURAK-CE-…"
            autoCapitalize="characters"
            spellCheck={false}
            disabled={processing}
          />

          <Button
            type="submit"
            disabled={
              !manualCode.trim() ||
              processing
            }
          >
            Scan
          </Button>
        </div>
      </form>
    </div>
  );
}