"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  MapPin,
  ScanLine,
} from "lucide-react";
import type { CampusEvent } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
} from "@/components/ui";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { LoadingSection } from "@/components/shared/LoadingSection";
import { listEvents } from "@/lib/services/campusEventService";
import { getAttendedCounts } from "@/lib/services/campusAttendanceService";
import { formatCampusLocation } from "@/lib/data/campus-reference";
import {
  formatEventDate,
  formatTimeRange,
  isToday,
} from "@/lib/utils/dates";
import { formatNumber } from "@/lib/utils/format";

function StaffEventRow({
  event,
  attendedCount,
}: {
  event: CampusEvent;
  attendedCount: number;
}) {
  return (
    <Link
      href={`/campus-events/staff/events/${event.id}`}
      className="card card-interactive flex items-center gap-3 p-4"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-[0.9375rem] font-semibold text-[var(--aurak-navy)]">
            {event.name}
          </h3>

          <EventStatusBadge
            event={event}
            className="shrink-0"
          />
        </div>

        <p className="mt-1.5 flex items-center gap-2 text-sm text-[var(--aurak-text-muted)]">
          <CalendarDays
            className="h-3.5 w-3.5 shrink-0"
            aria-hidden
          />

          <span className="truncate">
            {formatEventDate(
              event.date
            )}{" "}
            ·{" "}
            {formatTimeRange(
              event.startTime,
              event.endTime
            )}
          </span>
        </p>

        <p className="mt-1 flex items-center gap-2 text-sm text-[var(--aurak-text-muted)]">
          <MapPin
            className="h-3.5 w-3.5 shrink-0"
            aria-hidden
          />

          <span className="truncate">
            {formatCampusLocation(
              event.location
            )}
          </span>
        </p>

        <p className="mt-2 text-xs text-[var(--aurak-text-muted)]">
          Attended so
          far:{" "}
          <span className="tabular font-medium text-[var(--aurak-navy)]">
            {formatNumber(
              attendedCount
            )}
          </span>
        </p>
      </div>

      <ChevronRight
        className="h-5 w-5 shrink-0 text-[var(--aurak-text-subtle)]"
        aria-hidden
      />
    </Link>
  );
}

export default function CampusStaffHomePage() {
  const [today, setToday] =
    useState<CampusEvent[]>(
      []
    );

  const [upcoming, setUpcoming] =
    useState<CampusEvent[]>(
      []
    );

  const [attended, setAttended] =
    useState<
      Record<
        string,
        number
      >
    >({});

  const [loading, setLoading] =
    useState(true);

  const load =
    useCallback(async () => {
      setLoading(true);

      const all =
        await listEvents({
          status: "all",
        });

      const scannable =
        all.filter(
          (event) =>
            event.status !==
            "cancelled"
        );

      const todayEvents =
        scannable.filter(
          (event) =>
            isToday(
              event.date
            )
        );

      const futureEvents =
        scannable.filter(
          (event) =>
            !isToday(
              event.date
            ) &&
            new Date(
              event.date
            ) > new Date()
        );

      const ids = [
        ...todayEvents,
        ...futureEvents,
      ].map(
        (event) =>
          event.id
      );

      const counts =
        await getAttendedCounts(
          ids
        );

      setToday(
        todayEvents
      );

      setUpcoming(
        futureEvents
      );

      setAttended(
        counts
      );

      setLoading(
        false
      );
    }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page space-y-6">
      <PageHeader
        title="Check-in"
        subtitle="Select an event, then scan attendee QR codes."
      />

      {loading ? (
        <LoadingSection rows={3} />
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="section-title flex items-center gap-2">
              <ScanLine
                className="h-4 w-4 text-[var(--aurak-brand)]"
                aria-hidden
              />
              Today&apos;s Events
            </h2>

            {today.length ===
            0 ? (
              <Card>
                <EmptyState
                  icon={
                    <CalendarDays className="h-6 w-6" />
                  }
                  title="No events today"
                  description="Upcoming events are listed below."
                />
              </Card>
            ) : (
              <div className="space-y-3">
                {today.map(
                  (event) => (
                    <StaffEventRow
                      key={
                        event.id
                      }
                      event={
                        event
                      }
                      attendedCount={
                        attended[
                          event.id
                        ] ??
                        0
                      }
                    />
                  )
                )}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="section-title">
              Upcoming Events
            </h2>

            {upcoming.length ===
            0 ? (
              <Card>
                <EmptyState title="Nothing scheduled ahead" />
              </Card>
            ) : (
              <div className="space-y-3">
                {upcoming.map(
                  (event) => (
                    <StaffEventRow
                      key={
                        event.id
                      }
                      event={
                        event
                      }
                      attendedCount={
                        attended[
                          event.id
                        ] ??
                        0
                      }
                    />
                  )
                )}
              </div>
            )}
          </section>

          <Card>
            <CardHeader title="How check-in works" />

            <CardBody>
              <p className="meta-text">
                Attendance only increases when you check
                someone in. RSVP numbers are intentions
                and are handled separately by the events
                team.
              </p>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}