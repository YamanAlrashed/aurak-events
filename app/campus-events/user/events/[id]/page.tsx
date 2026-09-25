"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EyeOff, Users } from "lucide-react";
import type {
  CampusEvent,
  CampusEventTicket,
  EventGallery,
  RatingSummary,
  RSVPStatus,
} from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  StarRatingDisplay,
} from "@/components/ui";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { DetailList } from "@/components/shared/DetailList";
import { PhotoGrid } from "@/components/shared/PhotoGrid";
import { LoadingSection } from "@/components/shared/LoadingSection";
import { RsvpSelector } from "@/components/campus/RsvpSelector";
import { RatingForm } from "@/components/campus/RatingForm";
import { getEvent } from "@/lib/services/campusEventService";
import {
  getRsvpForUser,
  getTicket,
} from "@/lib/services/campusRsvpService";
import { getAttendedCount } from "@/lib/services/campusAttendanceService";
import {
  getGallery,
  isGalleryVisibleToUsers,
} from "@/lib/services/galleryService";
import { getSummary } from "@/lib/services/ratingService";
import { useAuth } from "@/lib/context/AuthContext";
import { formatCampusLocation } from "@/lib/data/campus-reference";
import {
  describeTargetAudience,
  formatCount,
} from "@/lib/utils/format";
import {
  deriveEventStatus,
  formatEventDate,
  formatTimeRange,
  parseEventMoment,
} from "@/lib/utils/dates";

export default function CampusUserEventPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const eventId = params.id;

  const { user } = useAuth();
  const campusUserId = user?.campusUserId;

  const [event, setEvent] =
    useState<CampusEvent | null>(null);

  const [rsvpStatus, setRsvpStatus] =
    useState<RSVPStatus | null>(null);

  const [ticket, setTicket] =
    useState<CampusEventTicket | null>(null);

  const [attended, setAttended] =
    useState(0);

  const [gallery, setGallery] =
    useState<EventGallery | null>(null);

  const [rating, setRating] =
    useState<RatingSummary | null>(null);

  const [loading, setLoading] =
    useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const result = await getEvent(eventId);

    if (!result) {
      setEvent(null);
      setLoading(false);
      return;
    }

    const [
      rsvp,
      existingTicket,
      attendedCount,
      galleryResult,
      ratingSummary,
    ] = await Promise.all([
      campusUserId
        ? getRsvpForUser(eventId, campusUserId)
        : Promise.resolve(null),

      campusUserId
        ? getTicket(eventId, campusUserId)
        : Promise.resolve(null),

      getAttendedCount(eventId),
      getGallery(eventId),
      getSummary(eventId),
    ]);

    setEvent(result);
    setRsvpStatus(rsvp?.status ?? null);
    setTicket(existingTicket);
    setAttended(attendedCount);
    setGallery(galleryResult);
    setRating(ratingSummary);
    setLoading(false);
  }, [eventId, campusUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="page space-y-5">
        <PageHeader title="Event" />
        <LoadingSection rows={3} />
      </div>
    );
  }

  if (!event || !campusUserId) {
    return (
      <div className="page">
        <Card>
          <EmptyState
            title="Event not available"
            action={
              <Link
                href="/campus-events/user"
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

  const status = deriveEventStatus(event);

  const hasStarted =
    parseEventMoment(
      event.date,
      event.startTime
    ).getTime() <= Date.now();

  const isFinished =
    status === "completed" ||
    status === "archived";

  const rsvpLocked =
    isFinished ||
    status === "cancelled";

  const galleryVisible =
    gallery !== null &&
    isGalleryVisibleToUsers(gallery);

  return (
    <div className="page space-y-5">
      <PageHeader
        title={event.name}
        subtitle={event.hostingDepartmentName}
      />

      <div className="flex flex-wrap items-center gap-2">
        <EventStatusBadge event={event} />

        {status === "cancelled" && (
          <span className="meta-text">
            This event has been cancelled.
          </span>
        )}
      </div>

      <Card>
        <CardHeader title="Event details" />

        <CardBody>
          <DetailList
            items={[
              {
                label: "Date",
                value: formatEventDate(event.date),
              },
              {
                label: "Time",
                value: formatTimeRange(
                  event.startTime,
                  event.endTime
                ),
              },
              {
                label: "Location",
                value: formatCampusLocation(event.location),
              },
              {
                label: "Hosting Department",
                value: event.hostingDepartmentName,
              },
              {
                label: "Target Audience",
                value: (
                  <>
                    {describeTargetAudience(event.targetAudience)}

                    <span className="mt-1 block text-xs text-[var(--aurak-text-subtle)]">
                      This determines who receives notifications. The event is
                      open to all AURAK members.
                    </span>
                  </>
                ),
                wide: true,
              },
              {
                label: "Description",
                value:
                  event.description ||
                  "No description provided.",
                wide: true,
              },
            ]}
          />
        </CardBody>
      </Card>

      {hasStarted && (
        <Card>
          <CardBody className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--aurak-bg-sunken)] text-[var(--aurak-navy)]">
              <Users className="h-5 w-5" aria-hidden />
            </span>

            <div>
              <p className="text-sm font-semibold text-[var(--aurak-navy)]">
                {formatCount(attended, "attended")}
              </p>

              <p className="meta-text">
                Based on QR check-ins at the event.
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {status !== "cancelled" && (
        <RsvpSelector
          eventId={event.id}
          userId={campusUserId}
          status={rsvpStatus}
          ticket={ticket}
          eventName={event.name}
          disabled={rsvpLocked}
          onChange={(nextStatus, nextTicket) => {
            setRsvpStatus(nextStatus);
            setTicket(nextTicket);
          }}
        />
      )}

      {isFinished && rating && (
        <Card>
          <CardHeader title="Event rating" />

          <CardBody>
            {event.showAverageRatingToUsers ? (
              rating.count > 0 ? (
                <div className="space-y-1">
                  <StarRatingDisplay
                    average={rating.average}
                    count={rating.count}
                    size="md"
                  />

                  <p className="meta-text">
                    Average rating from attendees.
                  </p>
                </div>
              ) : (
                <p className="meta-text">
                  No ratings have been submitted yet.
                </p>
              )
            ) : (
              <div className="flex items-start gap-2">
                <EyeOff
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--aurak-text-subtle)]"
                  aria-hidden
                />

                <p className="meta-text">
                  The organisers have chosen not to publish the average rating
                  for this event. You can still leave your own feedback below.
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {isFinished && (
        <RatingForm
          eventId={event.id}
          userId={campusUserId}
          onSubmitted={() => void load()}
        />
      )}

      {gallery && gallery.photos.length > 0 && (
        <Card>
          <CardHeader title="Gallery" />

          <CardBody>
            {galleryVisible ? (
              <PhotoGrid photos={gallery.photos} />
            ) : (
              <p className="meta-text">
                This gallery has been archived and is no longer part of normal
                browsing. Nothing has been deleted — contact the organisers if
                you need access.
              </p>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}