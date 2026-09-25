"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import type {
  CampusEvent,
  CampusEventInput,
} from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  EmptyState,
} from "@/components/ui";
import { CampusEventForm } from "@/components/campus/CampusEventForm";
import { LoadingSection } from "@/components/shared/LoadingSection";
import {
  canEditEvent,
  getEvent,
  updateEvent,
} from "@/lib/services/campusEventService";
import { useToast } from "@/lib/context/ToastContext";

function toInput(
  event: CampusEvent
): CampusEventInput {
  return {
    name:
      event.name,

    description:
      event.description ?? "",

    date:
      event.date,

    startTime:
      event.startTime,

    endTime:
      event.endTime,

    location: {
      ...event.location,
    },

    hostingDepartmentId:
      event.hostingDepartmentId,

    targetAudience: {
      userTypes: [
        ...event.targetAudience.userTypes,
      ],

      collegeIds: [
        ...event.targetAudience.collegeIds,
      ],

      departmentIds: [
        ...event.targetAudience.departmentIds,
      ],

      programIds: [
        ...event.targetAudience.programIds,
      ],
    },

    showAverageRatingToUsers:
      event.showAverageRatingToUsers,
  };
}

export default function EditCampusEventPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const eventId =
    params.id;

  const router =
    useRouter();

  const { showToast } =
    useToast();

  const [event, setEvent] =
    useState<CampusEvent | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let cancelled =
      false;

    async function load() {
      const result =
        await getEvent(
          eventId
        );

      if (!cancelled) {
        setEvent(result);
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function handleSubmit(
    value: CampusEventInput
  ) {
    try {
      await updateEvent(
        eventId,
        value
      );

      showToast({
        title:
          "Event updated",
      });

      router.push(
        `/campus-events/admin/events/${eventId}`
      );
    } catch (error) {
      showToast({
        title:
          "Could not save the event",

        description:
          error instanceof Error
            ? error.message
            : "Please try again.",

        variant: "error",
      });
    }
  }

  if (loading) {
    return (
      <div className="page space-y-5">
        <PageHeader title="Edit Event" />
        <LoadingSection rows={3} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="page">
        <Card>
          <EmptyState
            title="Event not found"
            description="It may have been deleted."
            action={
              <Link
                href="/campus-events/admin/events"
                className="btn btn-secondary btn-sm"
              >
                Back to events
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  if (
    !canEditEvent(event)
  ) {
    return (
      <div className="page space-y-5">
        <PageHeader
          title="Edit Event"
          subtitle={event.name}
        />

        <Card>
          <EmptyState
            title="This event cannot be edited"
            description="Only upcoming and cancelled events can be edited. Completed and archived events are preserved as a record."
            action={
              <Link
                href={`/campus-events/admin/events/${event.id}`}
                className="btn btn-secondary btn-sm"
              >
                View event
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="page space-y-5">
      <PageHeader
        title="Edit Event"
        subtitle={event.name}
      />

      <CampusEventForm
        initialValue={
          toInput(event)
        }
        submitLabel="Save Changes"
        requireFutureDate={
          false
        }
        onSubmit={
          handleSubmit
        }
      />
    </div>
  );
}