"use client";

import { useState } from "react";
import { Check, HelpCircle, X } from "lucide-react";
import type { CampusEventTicket, RSVPStatus } from "@/lib/types";
import { Button, Card, CardBody, CardHeader } from "@/components/ui";
import { MockQrCode } from "@/components/shared/MockQrCode";
import { setRsvp } from "@/lib/services/campusRsvpService";
import { useToast } from "@/lib/context/ToastContext";
import { cn } from "@/lib/utils/cn";

const OPTIONS: Array<{
  value: RSVPStatus;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    value: "yes",
    label: "Yes",
    icon: <Check className="h-4 w-4" />,
  },
  {
    value: "maybe",
    label: "Maybe",
    icon: <HelpCircle className="h-4 w-4" />,
  },
  {
    value: "no",
    label: "No",
    icon: <X className="h-4 w-4" />,
  },
];

export function RsvpSelector({
  eventId,
  userId,
  status,
  ticket,
  eventName,
  disabled = false,
  onChange,
}: {
  eventId: string;
  userId: string;
  status: RSVPStatus | null;
  ticket: CampusEventTicket | null;
  eventName: string;
  disabled?: boolean;
  onChange: (
    status: RSVPStatus,
    ticket: CampusEventTicket | null
  ) => void;
}) {
  const { showToast } = useToast();

  const [saving, setSaving] =
    useState<RSVPStatus | null>(null);

  async function choose(next: RSVPStatus) {
    if (disabled || next === status) return;

    setSaving(next);

    try {
      const result = await setRsvp(eventId, userId, next);

      onChange(result.rsvp.status, result.ticket);

      showToast({
        title:
          next === "no"
            ? "Response saved: No"
            : `You're going${next === "maybe" ? " — maybe" : ""}`,

        description:
          next === "no"
            ? "You can change your answer at any time."
            : "Your event QR code is ready below.",
      });
    } catch {
      showToast({
        title: "Could not save your response",
        variant: "error",
      });
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Are you attending?" />

        <CardBody className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {OPTIONS.map((option) => {
              const selected = status === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={disabled || saving !== null}
                  aria-pressed={selected}
                  onClick={() => void choose(option.value)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 rounded-[var(--aurak-radius-lg)] border px-2 py-4 text-sm font-medium transition-colors",
                    selected
                      ? "border-[var(--aurak-brand)] bg-[var(--aurak-brand)] text-white"
                      : "border-[var(--aurak-line-strong)] bg-white text-[var(--aurak-navy)] hover:bg-[var(--aurak-bg-subtle)]",
                    (disabled || saving !== null) && "opacity-60"
                  )}
                >
                  {option.icon}
                  {option.label}
                </button>
              );
            })}
          </div>

          {disabled ? (
            <p className="field-hint">
              This event has finished, so the response can no longer be changed.
            </p>
          ) : status ? (
            <p className="field-hint">
              You answered{" "}
              <strong>
                {OPTIONS.find((option) => option.value === status)?.label}
              </strong>
              . You can change this at any time.
            </p>
          ) : (
            <p className="field-hint">
              Let the organisers know whether to expect you.
            </p>
          )}
        </CardBody>
      </Card>

      {status === "no" ? (
        <Card>
          <CardBody className="space-y-3 text-center">
            <p className="text-sm font-medium text-[var(--aurak-navy)]">
              Changed your mind?
            </p>

            <p className="meta-text">
              Choose Yes or Maybe and your event QR code will be issued.
            </p>

            <div className="flex justify-center gap-2">
              <Button
                size="sm"
                loading={saving === "yes"}
                onClick={() => void choose("yes")}
                disabled={disabled}
              >
                I&apos;ll attend
              </Button>

              <Button
                size="sm"
                variant="secondary"
                loading={saving === "maybe"}
                onClick={() => void choose("maybe")}
                disabled={disabled}
              >
                Maybe
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : ticket ? (
        <Card>
          <CardHeader title="Your event QR code" />

          <CardBody className="space-y-3">
            <MockQrCode code={ticket.qrCode} size={220} />

            <p className="meta-text text-center">
              Show this at {eventName}. Staff will scan it to check you in.
              This code works for this event only.
            </p>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}