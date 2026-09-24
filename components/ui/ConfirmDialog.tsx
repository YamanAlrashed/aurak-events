"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  const [working, setWorking] = useState(false);

  async function handleConfirm() {
    setWorking(true);

    try {
      await onConfirm();
      onClose();
    } finally {
      setWorking(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={working ? () => {} : onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={working}
          >
            {cancelLabel}
          </Button>

          <Button
            variant={destructive ? "danger" : "primary"}
            onClick={handleConfirm}
            loading={working}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}