"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/context/ToastContext";
import {
  exportCampusEvent,
  exportMarketingEvent,
  exportPreRegisteredNoShows,
  type ExportResult,
} from "@/lib/services/exportService";

/**
 * "event"    - the full registration / attendee export
 * "no_shows" - marketing only: pre-registered prospects who did not attend
 */
export type ExportKind = "event" | "no_shows";

export function ExportButton({
  module,
  eventId,
  kind = "event",
  label,
  size = "md",
  variant = "secondary",
}: {
  module: "campus" | "marketing";
  eventId: string;
  kind?: ExportKind;
  label?: string;
  size?: "sm" | "md";
  variant?: "primary" | "secondary";
}) {
  const { showToast } = useToast();
  const [working, setWorking] = useState(false);

  const isNoShowExport = module === "marketing" && kind === "no_shows";

  const resolvedLabel =
    label ??
    (isNoShowExport
      ? "Export Pre-registered No-shows"
      : "Export Event Data");

  async function handleExport() {
    setWorking(true);

    try {
      let result: ExportResult;

      if (module === "campus") {
        result = await exportCampusEvent(eventId);
      } else if (isNoShowExport) {
        result = await exportPreRegisteredNoShows(eventId);
      } else {
        result = await exportMarketingEvent(eventId);
      }

      if (result.rowCount === 0) {
        showToast({
          title: "Nothing to export",
          description: isNoShowExport
            ? "Every pre-registered prospect for this event was checked in."
            : "There are no records for this event yet.",
          variant: "info",
        });
        return;
      }

      showToast({
        title: "Export ready",
        description: `${result.rowCount} rows downloaded as ${result.fileName}`,
      });
    } catch (error) {
      showToast({
        title: "Export failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setWorking(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      loading={working}
      onClick={handleExport}
      icon={<Download className="h-4 w-4" />}
    >
      {resolvedLabel}
    </Button>
  );
}