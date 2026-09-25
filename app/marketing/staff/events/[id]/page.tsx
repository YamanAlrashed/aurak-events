"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Bus,
  MapPin,
  Phone,
} from "lucide-react";
import type {
  MarketingEvent,
  MarketingEventStats,
} from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  StatCard,
} from "@/components/ui";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { DetailList } from "@/components/shared/DetailList";
import { LoadingSection } from "@/components/shared/LoadingSection";
import { MarketingCheckInPanel } from "@/components/marketing/MarketingCheckInPanel";
import { StaffFeedbackForm } from "@/components/marketing/StaffFeedbackForm";
import { getEvent } from "@/lib/services/marketingEventService";
import { getEventStats } from "@/lib/services/marketingAttendanceService";
import { useAuth } from "@/lib/context/AuthContext";
import {
  EMIRATE_LABELS,
  MARKETING_EVENT_TYPE_LABELS,
  STAFF_DEPARTMENT_LABELS,
} from "@/lib/data/marketing-reference";
import {
  formatEventDate,
  formatTime,
  formatTimeRange,
} from "@/lib/utils/dates";

export default function MarketingStaffEventPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const eventId =
    params.id;

  const { user } =
    useAuth();

  const staffId =
    user?.marketingStaffId ??
    "staff-yaman";

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
    loading,
    setLoading,
  ] = useState(true);

  const refreshStats =
    useCallback(async () => {
      setStats(
        await getEventStats(
          eventId
        )
      );
    }, [eventId]);

  useEffect(() => {
    let cancelled =
      false;

    async function load() {
      const result =
        await getEvent(
          eventId
        );

      /*
       * Marketing Staff may only access events they are assigned to.
       * This also blocks manually entering another Marketing event URL.
       */
      const assigned =
        result?.assignedStaff.some(
          (staff) =>
            staff.staffId ===
            staffId
        ) ?? false;

      if (
        !result ||
        !assigned
      ) {
        if (!cancelled) {
          setEvent(null);
          setStats(null);
          setLoading(false);
        }

        return;
      }

      const eventStats =
        await getEventStats(
          eventId
        );

      if (!cancelled) {
        setEvent(result);
        setStats(
          eventStats
        );
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [eventId, staffId]);

  if (loading) {
    return (
      <div className="page space-y-5">
        <PageHeader title="Event" />
        <LoadingSection rows={2} />
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
            title="Event not available"
            description="This event does not exist or is not assigned to you."
            action={
              <Link
                href="/marketing/staff"
                className="btn btn-secondary btn-sm"
              >
                Back to my events
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
        title={event.name}
        subtitle={
          MARKETING_EVENT_TYPE_LABELS[
            event.type
          ]
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <EventStatusBadge
          event={event}
        />

        <Badge variant="neutral">
          {
            EMIRATE_LABELS[
              event.location
                .emirate
            ]
          }
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Attended"
          value={
            stats.attended
          }
          caption="Registrations checked in"
        />

        <StatCard
          label="Visitors"
          value={
            stats.visitors
          }
          caption="People present, guests included"
        />
      </div>

      <Card>
        <CardHeader title="Event details" />

        <CardBody className="space-y-4">
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
                  "Departure Time",
                value:
                  event.departureTime ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-[var(--aurak-brand)]">
                      <Bus
                        className="h-3.5 w-3.5"
                        aria-hidden
                      />

                      {formatTime(
                        event.departureTime
                      )}
                    </span>
                  ) : (
                    "Not set"
                  ),
              },
              {
                label:
                  "Location",
                value: `${
                  event.location
                    .venueName
                }, ${
                  EMIRATE_LABELS[
                    event
                      .location
                      .emirate
                  ]
                }`,
              },
              {
                label:
                  "Driver",
                value:
                  event.driver ? (
                    <span>
                      {
                        event.driver
                          .name
                      }

                      <a
                        href={`tel:${event.driver.phone.replace(/\s/g, "")}`}
                        className="link mt-0.5 flex items-center gap-1.5"
                      >
                        <Phone
                          className="h-3.5 w-3.5"
                          aria-hidden
                        />

                        {
                          event.driver
                            .phone
                        }
                      </a>
                    </span>
                  ) : (
                    "Not assigned"
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
            ]}
          />

          {event.location
            .mapUrl && (
            <a
              href={
                event.location
                  .mapUrl
              }
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-block"
            >
              <MapPin className="h-4 w-4" />
              Open Map
            </a>
          )}
        </CardBody>
      </Card>

      {event.assignedStaff
        .length > 0 && (
        <Card>
          <CardHeader
            title={`Assigned team (${event.assignedStaff.length})`}
          />

          <CardBody>
            <ul className="flex flex-wrap gap-2">
              {event.assignedStaff.map(
                (staff) => (
                  <li
                    key={
                      staff.staffId
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--aurak-line)] bg-white py-1 pl-1 pr-3"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--aurak-brand-soft)] text-[0.625rem] font-semibold text-[var(--aurak-brand)]">
                      {
                        staff.initials
                      }
                    </span>

                    <span className="text-sm text-[var(--aurak-navy)]">
                      {
                        staff.name
                      }
                    </span>

                    <span className="text-xs text-[var(--aurak-text-subtle)]">
                      {
                        STAFF_DEPARTMENT_LABELS[
                          staff.department
                        ]
                      }
                    </span>
                  </li>
                )
              )}
            </ul>
          </CardBody>
        </Card>
      )}

      <MarketingCheckInPanel
        eventId={
          event.id
        }
        onChanged={
          refreshStats
        }
      />

      <StaffFeedbackForm
        eventId={
          event.id
        }
        staffId={
          staffId
        }
        onSubmitted={() =>
          void refreshStats()
        }
      />
    </div>
  );
}