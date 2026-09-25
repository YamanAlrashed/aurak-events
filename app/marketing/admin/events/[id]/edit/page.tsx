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
  MarketingEvent,
  MarketingEventInput,
} from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  EmptyState,
} from "@/components/ui";
import { MarketingEventForm } from "@/components/marketing/MarketingEventForm";
import { LoadingSection } from "@/components/shared/LoadingSection";
import {
  canEditEvent,
  getEvent,
  updateEvent,
} from "@/lib/services/marketingEventService";
import { useToast } from "@/lib/context/ToastContext";

function toInput(
  event: MarketingEvent
): MarketingEventInput {
  return {
    name: event.name,
    type: event.type,
    date: event.date,
    startTime:
      event.startTime,
    endTime:
      event.endTime,
    departureTime:
      event.departureTime ??
      "",
    location: {
      emirate:
        event.location
          .emirate,
      venueName:
        event.location
          .venueName,
      mapUrl:
        event.location
          .mapUrl ?? "",
    },
    description:
      event.description ??
      "",
    assignedStaffIds:
      event.assignedStaff.map(
        (staff) =>
          staff.staffId
      ),
    driver: {
      name:
        event.driver
          ?.name ?? "",
      phone:
        event.driver
          ?.phone ?? "",
    },
  };
}

export default function EditMarketingEventPage() {
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

  const [
    event,
    setEvent,
  ] =
    useState<
      MarketingEvent | null
    >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

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
    value: MarketingEventInput
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
        `/marketing/admin/events/${eventId}`
      );
    } catch (error) {
      showToast({
        title:
          "Could not save the event",
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
            action={
              <Link
                href="/marketing/admin/events"
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
    !canEditEvent(
      event
    )
  ) {
    return (
      <div className="page space-y-5">
        <PageHeader
          title="Edit Event"
          subtitle={
            event.name
          }
        />

        <Card>
          <EmptyState
            title="This event cannot be edited"
            description="Only upcoming and cancelled events can be edited. Completed events are preserved together with their registrations and attendance."
            action={
              <Link
                href={`/marketing/admin/events/${event.id}`}
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
        subtitle={
          event.name
        }
      />

      <MarketingEventForm
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