"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/context/ToastContext";
import {
  exportCampusEvent,
  exportMarketingEvent,
} from "@/lib/services/exportService";

export function ExportButton({
  module,
  eventId,
  label = "Export Event Data",
  size = "md",
  variant = "secondary",
}: {
  module: "campus" | "marketing";
  eventId: string;
  label?: string;
  size?: "sm" | "md";
  variant?: "primary" | "secondary";
}) {
  const { showToast } = useToast();
  const [working, setWorking] = useState(false);

  async function handleExport() {
    setWorking(true);

    try {
      const result =
        module === "campus"
          ? await exportCampusEvent(eventId)
          : await exportMarketingEvent(eventId);

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
      {label}
    </Button>
  );
}