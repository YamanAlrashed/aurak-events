"use client";

import { useRouter } from "next/navigation";
import type { CampusEventInput } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  CampusEventForm,
  EMPTY_CAMPUS_EVENT,
} from "@/components/campus/CampusEventForm";
import { createEvent } from "@/lib/services/campusEventService";
import { countAudience } from "@/lib/services/notificationService";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/lib/context/ToastContext";
import { formatNumber } from "@/lib/utils/format";

export default function NewCampusEventPage() {
  const router =
    useRouter();

  const { user } =
    useAuth();

  const { showToast } =
    useToast();

  async function handleSubmit(
    value: CampusEventInput
  ) {
    try {
      const recipients =
        countAudience(
          value.targetAudience
        );

      const event =
        await createEvent(
          value,
          user?.campusUserId ??
            "cu-shalaby"
        );

      showToast({
        title:
          "Event created",

        description: `${event.name} is published. ${formatNumber(
          recipients
        )} people were notified; everyone can see it.`,
      });

      router.push(
        `/campus-events/admin/events/${event.id}`
      );
    } catch (error) {
      showToast({
        title:
          "Could not create the event",

        description:
          error instanceof Error
            ? error.message
            : "Please try again.",

        variant: "error",
      });
    }
  }

  return (
    <div className="page space-y-5">
      <PageHeader
        title="Create Event"
        subtitle="Published events are visible to every internal AURAK user."
      />

      <CampusEventForm
        initialValue={
          EMPTY_CAMPUS_EVENT
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