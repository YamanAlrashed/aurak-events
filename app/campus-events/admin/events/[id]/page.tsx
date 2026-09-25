"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  Archive,
  Ban,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import type {
  CampusEvent,
  RsvpBreakdown,
} from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  Tabs,
} from "@/components/ui";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { DetailList } from "@/components/shared/DetailList";
import { ExportButton } from "@/components/shared/ExportButton";
import { LoadingSection } from "@/components/shared/LoadingSection";
import { RsvpBreakdownCard } from "@/components/campus/RsvpBreakdownCard";
import { AttendeeTable } from "@/components/campus/AttendeeTable";
import { GalleryManager } from "@/components/campus/GalleryManager";
import { AdminRatingsPanel } from "@/components/campus/AdminRatingsPanel";
import {
  archiveEvent,
  canDeleteEvent,
  canEditEvent,
  cancelEvent,
  deleteEvent,
  getEvent,
  restoreEvent,
} from "@/lib/services/campusEventService";
import { getBreakdown } from "@/lib/services/campusRsvpService";
import { getAttendedCount } from "@/lib/services/campusAttendanceService";
import { getPhotoCounts } from "@/lib/services/galleryService";
import { useToast } from "@/lib/context/ToastContext";
import { formatCampusLocation } from "@/lib/data/campus-reference";
import {
  describeTargetAudience,
  formatNumber,
} from "@/lib/utils/format";
import {
  deriveEventStatus,
  formatEventDate,
  formatTimeRange,
  parseEventMoment,
} from "@/lib/utils/dates";

type TabId =
  | "overview"
  | "rsvp"
  | "attendees"
  | "gallery"
  | "ratings";

export default function CampusAdminEventDetailPage() {
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

  const [rsvp, setRsvp] =
    useState<RsvpBreakdown | null>(
      null
    );

  const [attended, setAttended] =
    useState(0);

  const [
    photoCount,
    setPhotoCount,
  ] = useState(0);

  const [loading, setLoading] =
    useState(true);

  const [tab, setTab] =
    useState<TabId>(
      "overview"
    );

  const [
    deleteOpen,
    setDeleteOpen,
  ] = useState(false);

  const [
    cancelOpen,
    setCancelOpen,
  ] = useState(false);

  const [
    archiveOpen,
    setArchiveOpen,
  ] = useState(false);

  const load =
    useCallback(async () => {
      setLoading(true);

      const result =
        await getEvent(
          eventId
        );

      if (!result) {
        setEvent(null);
        setLoading(false);

        return;
      }

      const [
        breakdown,
        attendedCount,
        counts,
      ] =
        await Promise.all([
          getBreakdown(
            eventId
          ),

          getAttendedCount(
            eventId
          ),

          getPhotoCounts([
            eventId,
          ]),
        ]);

      setEvent(result);
      setRsvp(breakdown);
      setAttended(
        attendedCount
      );
      setPhotoCount(
        counts[eventId] ??
          0
      );

      setLoading(false);
    }, [eventId]);

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

  if (
    !event ||
    !rsvp
  ) {
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

  const status =
    deriveEventStatus(
      event
    );

  const eventHasStarted =
    parseEventMoment(
      event.date,
      event.startTime
    ).getTime() <=
    Date.now();

  const editable =
    canEditEvent(event);

  const deletable =
    canDeleteEvent(event);

  return (
    <div className="page space-y-5">
      <PageHeader
        title={event.name}
        subtitle={`${event.hostingDepartmentName} · ${formatEventDate(
          event.date
        )}`}
        actions={
          <>
            <ExportButton
              module="campus"
              eventId={
                event.id
              }
            />

            {editable && (
              <Link
                href={`/campus-events/admin/events/${event.id}/edit`}
                className="btn btn-secondary"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            )}

            {status ===
              "upcoming" && (
              <Button
                variant="secondary"
                onClick={() =>
                  setCancelOpen(
                    true
                  )
                }
              >
                <Ban className="h-4 w-4" />
                Cancel
              </Button>
            )}

            {status ===
            "archived" ? (
              <Button
                variant="secondary"
                onClick={async () => {
                  await restoreEvent(
                    event.id
                  );

                  showToast({
                    title:
                      "Event restored from archive",
                  });

                  void load();
                }}
              >
                <RotateCcw className="h-4 w-4" />
                Restore
              </Button>
            ) : (
              status !==
                "upcoming" && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    setArchiveOpen(
                      true
                    )
                  }
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </Button>
              )
            )}

            {deletable && (
              <Button
                variant="danger-soft"
                onClick={() =>
                  setDeleteOpen(
                    true
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <EventStatusBadge
          event={event}
        />

        {status ===
          "cancelled" && (
          <span className="meta-text">
            This event was cancelled and can still be
            edited or deleted.
          </span>
        )}
      </div>

      <Card>
        <Tabs
          className="px-5 pt-1"
          items={[
            {
              id:
                "overview",
              label:
                "Overview",
            },
            {
              id: "rsvp",
              label: "RSVP",
              count:
                rsvp.totalResponses,
            },
            {
              id:
                "attendees",
              label:
                "Attendees",
              count:
                eventHasStarted
                  ? attended
                  : undefined,
            },
            {
              id:
                "gallery",
              label:
                "Gallery",
              count:
                photoCount,
            },
            {
              id:
                "ratings",
              label:
                "Ratings",
            },
          ]}
          activeId={tab}
          onChange={(id) =>
            setTab(
              id as TabId
            )
          }
        />

        <CardBody>
          {tab ===
            "overview" && (
            <DetailList
              items={[
                {
                  label:
                    "Date",
                  value:
                    formatEventDate(
                      event.date
                    ),
                },
                {
                  label:
                    "Time",
                  value:
                    formatTimeRange(
                      event.startTime,
                      event.endTime
                    ),
                },
                {
                  label:
                    "Location",
                  value:
                    formatCampusLocation(
                      event.location
                    ),
                },
                {
                  label:
                    "Hosting Department",
                  value:
                    event.hostingDepartmentName,
                },
                {
                  label:
                    "Notification Audience",
                  value: (
                    <>
                      {describeTargetAudience(
                        event.targetAudience
                      )}

                      <span className="mt-1 block text-xs text-[var(--aurak-text-subtle)]">
                        Notification routing only — the
                        event is visible to all internal
                        AURAK users.
                      </span>
                    </>
                  ),
                  wide: true,
                },
                {
                  label:
                    "Description",
                  value:
                    event.description ||
                    "No description provided.",
                  wide: true,
                },
                {
                  label:
                    "Average rating shown to users",
                  value:
                    event.showAverageRatingToUsers
                      ? "Yes"
                      : "No",
                },
                {
                  label:
                    "Responses / Attended",
                  value: `${formatNumber(
                    rsvp.totalResponses
                  )} responses · ${
                    eventHasStarted
                      ? formatNumber(
                          attended
                        )
                      : "—"
                  } attended`,
                },
              ]}
            />
          )}

          {tab ===
            "rsvp" && (
            <RsvpBreakdownCard
              breakdown={rsvp}
              attendedCount={
                attended
              }
              eventHasStarted={
                eventHasStarted
              }
            />
          )}

          {tab ===
            "attendees" && (
            <AttendeeTable
              eventId={
                event.id
              }
            />
          )}

          {tab ===
            "gallery" && (
            <GalleryManager
              eventId={
                event.id
              }
            />
          )}

          {tab ===
            "ratings" && (
            <AdminRatingsPanel
              eventId={
                event.id
              }
              showAverageToUsers={
                event.showAverageRatingToUsers
              }
              onVisibilityChange={(
                visible
              ) =>
                setEvent({
                  ...event,

                  showAverageRatingToUsers:
                    visible,
                })
              }
            />
          )}
        </CardBody>
      </Card>

      {!editable &&
        status !==
          "cancelled" && (
          <Card>
            <CardHeader title="Preserved record" />

            <CardBody>
              <p className="meta-text">
                This event has finished, so its details,
                RSVP data and attendance are preserved and
                cannot be edited or deleted. The gallery
                and rating visibility can still be managed.
              </p>
            </CardBody>
          </Card>
        )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() =>
          setDeleteOpen(
            false
          )
        }
        title="Delete this event?"
        description="The event and all of its RSVP, attendance, gallery and rating records will be removed. This cannot be undone."
        confirmLabel="Delete Event"
        destructive
        onConfirm={async () => {
          try {
            await deleteEvent(
              event.id
            );

            showToast({
              title:
                "Event deleted",
            });

            router.push(
              "/campus-events/admin/events"
            );
          } catch (error) {
            showToast({
              title:
                "Could not delete the event",

              description:
                error instanceof Error
                  ? error.message
                  : "Please try again.",

              variant:
                "error",
            });
          }
        }}
      />

      <ConfirmDialog
        open={cancelOpen}
        onClose={() =>
          setCancelOpen(
            false
          )
        }
        title="Cancel this event?"
        description="The event stays visible and marked as cancelled. It can still be edited or deleted."
        confirmLabel="Cancel Event"
        onConfirm={async () => {
          await cancelEvent(
            event.id
          );

          showToast({
            title:
              "Event cancelled",
          });

          void load();
        }}
      />

      <ConfirmDialog
        open={archiveOpen}
        onClose={() =>
          setArchiveOpen(
            false
          )
        }
        title="Archive this event?"
        description="Archived events stay fully visible to Admin under Archive. Their gallery is archived too, and no photos are deleted."
        confirmLabel="Archive Event"
        onConfirm={async () => {
          try {
            await archiveEvent(
              event.id
            );

            showToast({
              title:
                "Event archived",
            });

            void load();
          } catch (error) {
            showToast({
              title:
                "Could not archive the event",

              description:
                error instanceof Error
                  ? error.message
                  : "Please try again.",

              variant:
                "error",
            });
          }
        }}
      />
    </div>
  );
}