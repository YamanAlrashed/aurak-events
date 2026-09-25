"use client";

import { useRouter } from "next/navigation";
import type { MarketingEventInput } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  EMPTY_MARKETING_EVENT,
  MarketingEventForm,
} from "@/components/marketing/MarketingEventForm";
import { createEvent } from "@/lib/services/marketingEventService";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/lib/context/ToastContext";

export default function NewMarketingEventPage() {
  const router =
    useRouter();

  const { user } =
    useAuth();

  const { showToast } =
    useToast();

  async function handleSubmit(
    value: MarketingEventInput
  ) {
    try {
      const event =
        await createEvent(
          value,
          user?.id ??
            "acct-marketing-admin"
        );

      showToast({
        title:
          "Event created",
        description: `${event.name} is ready. Its public registration link is on the event page.`,
      });

      router.push(
        `/marketing/admin/events/${event.id}`
      );
    } catch (error) {
      showToast({
        title:
          "Could not create the event",
        description:
          error instanceof
          Error
            ? error.message
            : "Please try again.",
        variant:
          "error",
      });
    }
  }

  return (
    <div className="page space-y-5">
      <PageHeader
        title="Create Event"
        subtitle="Assign staff, add transport details and generate a public registration link."
      />

      <MarketingEventForm
        initialValue={
          EMPTY_MARKETING_EVENT
        }
        submitLabel="Create Event"
        requireFutureDate
        onSubmit={
          handleSubmit
        }
      />
    </div>
  );
}