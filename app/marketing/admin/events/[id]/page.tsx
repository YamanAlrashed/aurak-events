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
  Ban,
  Copy,
  ExternalLink,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import type {
  MarketingEvent,
  MarketingEventStats,
} from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
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
import { RegistrationTable } from "@/components/marketing/RegistrationTable";
import { CrmBreakdownPanel } from "@/components/marketing/CrmBreakdownPanel";
import { MarketingAnalyticsPanel } from "@/components/marketing/MarketingAnalyticsPanel";
import { StaffFeedbackPanel } from "@/components/marketing/StaffFeedbackPanel";
import {
  canDeleteEvent,
  canEditEvent,
  cancelEvent,
  deleteEvent,
  getEvent,
} from "@/lib/services/marketingEventService";
import { getEventStats } from "@/lib/services/marketingAttendanceService";
import { getFeedbackCounts } from "@/lib/services/staffFeedbackService";
import { useToast } from "@/lib/context/ToastContext";
import {
  EMIRATE_LABELS,
  MARKETING_EVENT_TYPE_LABELS,
  STAFF_DEPARTMENT_LABELS,
  STAFF_DEPARTMENT_ORDER,
} from "@/lib/data/marketing-reference";
import {
  deriveEventStatus,
  formatEventDate,
  formatTime,
  formatTimeRange,
} from "@/lib/utils/dates";
import { formatNumber } from "@/lib/utils/format";

type TabId =
  | "overview"
  | "registrations"
  | "crm"
  | "analytics"
  | "team"
  | "feedback";

export default function MarketingAdminEventDetailPage() {
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
    stats,
    setStats,
  ] =
    useState<
      MarketingEventStats | null
    >(null);

  const [
    feedbackCount,
    setFeedbackCount,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    tab,
    setTab,
  ] =
    useState<TabId>(
      "overview"
    );

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  const [
    deleteOpen,
    setDeleteOpen,
  ] = useState(false);

  const [
    cancelOpen,
    setCancelOpen,
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
        eventStats,
        counts,
      ] =
        await Promise.all([
          getEventStats(
            eventId
          ),
          getFeedbackCounts([
            eventId,
          ]),
        ]);

      setEvent(result);
      setStats(
        eventStats
      );
      setFeedbackCount(
        counts[eventId] ??
          0
      );
      setLoading(false);
    }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function copyRegistrationLink() {
    if (!event) return;

    const url = `${window.location.origin}/marketing/register/${event.publicRegistrationCode}`;

    try {
      await navigator.clipboard.writeText(
        url
      );

      showToast({
        title:
          "Registration link copied",
        description:
          url,
      });
    } catch {
      showToast({
        title:
          "Could not copy automatically",
        description:
          url,
        variant:
          "info",
      });
    }
  }

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
    !stats
  ) {
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

  const status =
    deriveEventStatus(
      event
    );

  const editable =
    canEditEvent(
      event
    );

  const deletable =
    canDeleteEvent(
      event
    );

  const registrationPath =
    `/marketing/register/${event.publicRegistrationCode}`;

  const teamByDepartment =
    STAFF_DEPARTMENT_ORDER.map(
      (department) => ({
        department,
        members:
          event.assignedStaff.filter(
            (staff) =>
              staff.department ===
              department
          ),
      })
    ).filter(
      (group) =>
        group.members.length >
        0
    );

  return (
    <div className="page space-y-5">
      <PageHeader
        title={event.name}
        subtitle={`${MARKETING_EVENT_TYPE_LABELS[event.type]} · ${formatEventDate(
          event.date
        )}`}
        actions={
          <>
            <ExportButton
              module="marketing"
              eventId={
                event.id
              }
            />

            {editable && (
              <Link
                href={`/marketing/admin/events/${event.id}/edit`}
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

        <Badge variant="brand">
          {
            MARKETING_EVENT_TYPE_LABELS[
              event.type
            ]
          }
        </Badge>

        <Badge variant="neutral">
          {
            EMIRATE_LABELS[
              event.location
                .emirate
            ]
          }
        </Badge>
      </div>

      <Card>
        <CardHeader title="Public registration link" />

        <CardBody className="space-y-3">
          <p className="meta-text">
            Share this link by invitation
            for pre-registration, or print
            it as a QR code at the venue
            for walk-ins. No login is
            required.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <code className="min-w-0 flex-1 truncate rounded-[var(--aurak-radius)] border border-[var(--aurak-line)] bg-[var(--aurak-bg-subtle)] px-3 py-2 font-mono text-xs">
              {registrationPath}
            </code>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={
                  copyRegistrationLink
                }
                icon={
                  <Copy className="h-4 w-4" />
                }
              >
                Copy
              </Button>

              <Link
                href={
                  registrationPath
                }
                target="_blank"
                className="btn btn-secondary"
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>

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
              id:
                "registrations",
              label:
                "Registrations",
              count:
                stats.totalRegistrations,
            },
            {
              id: "crm",
              label:
                "CRM",
            },
            {
              id:
                "analytics",
              label:
                "Analytics",
            },
            {
              id:
                "team",
              label:
                "Team",
              count:
                event.assignedStaff
                  .length,
            },
            {
              id:
                "feedback",
              label:
                "Staff Feedback",
              count:
                feedbackCount,
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
            <div className="space-y-4">
              <DetailList
                items={[
                  {
                    label:
                      "Event Type",
                    value:
                      MARKETING_EVENT_TYPE_LABELS[
                        event.type
                      ],
                  },
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
                      "Departure Time",
                    value:
                      event.departureTime
                        ? formatTime(
                            event.departureTime
                          )
                        : "Not set",
                  },
                  {
                    label:
                      "Emirate",
                    value:
                      EMIRATE_LABELS[
                        event
                          .location
                          .emirate
                      ],
                  },
                  {
                    label:
                      "Venue",
                    value:
                      event
                        .location
                        .venueName,
                  },
                  {
                    label:
                      "Location Link",
                    value:
                      event
                        .location
                        .mapUrl ? (
                        <a
                          href={
                            event
                              .location
                              .mapUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link inline-flex items-center gap-1"
                        >
                          <MapPin
                            className="h-3.5 w-3.5"
                            aria-hidden
                          />
                          Open Map
                        </a>
                      ) : (
                        "Not provided"
                      ),
                  },
                  {
                    label:
                      "Driver",
                    value:
                      event.driver
                        ? `${event.driver.name} · ${event.driver.phone}`
                        : "Not assigned",
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
                      "Students / Visitors",
                    value: `${formatNumber(
                      stats.students
                    )} prospects registered · ${formatNumber(
                      stats.visitors
                    )} people attended (guests included)`,
                    wide: true,
                  },
                ]}
              />
            </div>
          )}

          {tab ===
            "registrations" && (
            <RegistrationTable
              eventId={
                event.id
              }
              refreshKey={
                refreshKey
              }
            />
          )}

          {tab ===
            "crm" && (
            <CrmBreakdownPanel
              eventId={
                event.id
              }
              stats={
                stats
              }
              onStatsChanged={() => {
                setRefreshKey(
                  (key) =>
                    key + 1
                );
                void load();
              }}
            />
          )}

          {tab ===
            "analytics" && (
            <MarketingAnalyticsPanel
              eventId={
                event.id
              }
              refreshKey={
                refreshKey
              }
            />
          )}

          {tab ===
            "team" && (
            <div className="space-y-4">
              {event
                .assignedStaff
                .length ===
              0 ? (
                <EmptyState
                  title="No staff assigned"
                  description="Edit the event to assign people from Admission, Student Recruitment or the Call Center."
                  action={
                    editable ? (
                      <Link
                        href={`/marketing/admin/events/${event.id}/edit`}
                        className="btn btn-primary btn-sm"
                      >
                        Assign staff
                      </Link>
                    ) : undefined
                  }
                />
              ) : (
                teamByDepartment.map(
                  (group) => (
                    <div
                      key={
                        group.department
                      }
                    >
                      <p className="stat-label">
                        {
                          STAFF_DEPARTMENT_LABELS[
                            group
                              .department
                          ]
                        }{" "}
                        (
                        {
                          group
                            .members
                            .length
                        }
                        )
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {group.members.map(
                          (
                            member
                          ) => (
                            <span
                              key={
                                member.staffId
                              }
                              className="inline-flex items-center gap-2 rounded-full border border-[var(--aurak-line)] bg-white py-1 pl-1 pr-3"
                            >
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--aurak-brand-soft)] text-[0.625rem] font-semibold text-[var(--aurak-brand)]">
                                {
                                  member.initials
                                }
                              </span>

                              <span className="text-sm text-[var(--aurak-navy)]">
                                {
                                  member.name
                                }
                              </span>
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )
                )
              )}

              {event.driver && (
                <Card>
                  <CardHeader title="Transport" />

                  <CardBody>
                    <DetailList
                      items={[
                        {
                          label:
                            "Driver Name",
                          value:
                            event
                              .driver
                              .name,
                        },
                        {
                          label:
                            "Driver Phone",
                          value: (
                            <a
                              href={`tel:${event.driver.phone.replace(/\s/g, "")}`}
                              className="link"
                            >
                              {
                                event
                                  .driver
                                  .phone
                              }
                            </a>
                          ),
                        },
                      ]}
                    />
                  </CardBody>
                </Card>
              )}
            </div>
          )}

          {tab ===
            "feedback" && (
            <StaffFeedbackPanel
              eventId={
                event.id
              }
              refreshKey={
                refreshKey
              }
            />
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() =>
          setDeleteOpen(
            false
          )
        }
        title="Delete this event?"
        description="The event and all of its registrations, attendance records and staff feedback will be removed. This cannot be undone."
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
              "/marketing/admin/events"
            );
          } catch (error) {
            showToast({
              title:
                "Could not delete the event",
              description:
                error instanceof
                Error
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
    </div>
  );
}