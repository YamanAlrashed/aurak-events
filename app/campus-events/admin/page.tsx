"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  Plus,
  Radio,
} from "lucide-react";
import type {
  CampusEvent,
  RsvpBreakdown,
} from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { DemoDataControls } from "@/components/layout/DemoDataControls";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  StatCard,
} from "@/components/ui";
import { CampusEventCard } from "@/components/campus/CampusEventCard";
import {
  LoadingSection,
  LoadingStats,
} from "@/components/shared/LoadingSection";
import {
  getDashboardData,
  type CampusDashboardData,
} from "@/lib/services/campusEventService";
import { getBreakdowns } from "@/lib/services/campusRsvpService";
import { getAttendedCounts } from "@/lib/services/campusAttendanceService";

export default function CampusAdminDashboardPage() {
  const [data, setData] =
    useState<CampusDashboardData | null>(null);

  const [rsvps, setRsvps] =
    useState<Record<string, RsvpBreakdown>>({});

  const [attended, setAttended] =
    useState<Record<string, number>>({});

  const [loading, setLoading] =
    useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const dashboard =
      await getDashboardData();

    const ids = Array.from(
      new Set(
        [
          ...dashboard.live,
          ...dashboard.thisWeek,
          ...dashboard.upcoming,
          ...dashboard.recentlyCompleted,
        ].map((event) => event.id)
      )
    );

    const [breakdowns, counts] =
      await Promise.all([
        getBreakdowns(ids),
        getAttendedCounts(ids),
      ]);

    setData(dashboard);
    setRsvps(breakdowns);
    setAttended(counts);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function renderList(
    events: CampusEvent[],
    showAttended: boolean
  ) {
    return (
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <CampusEventCard
            key={event.id}
            event={event}
            href={`/campus-events/admin/events/${event.id}`}
            rsvp={rsvps[event.id]}
            attendedCount={
              showAttended
                ? attended[event.id]
                : undefined
            }
          />
        ))}
      </div>
    );
  }

  return (
    <div className="page space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Campus events at a glance. Open an event for its full statistics."
        actions={
          <>
            <Link
              href="/campus-events/admin/events"
              className="btn btn-secondary"
            >
              All Events
            </Link>

            <Link
              href="/campus-events/admin/events/new"
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </Link>
          </>
        }
      />

      {loading || !data ? (
        <>
          <LoadingStats />
          <LoadingSection rows={3} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Upcoming"
              value={data.counts.upcoming}
              icon={
                <CalendarDays className="h-4 w-4" />
              }
            />

            <StatCard
              label="This Week"
              value={data.counts.thisWeek}
              caption="Next 7 days"
            />

            <StatCard
              label="Completed"
              value={data.counts.completed}
              icon={
                <CheckCircle2 className="h-4 w-4" />
              }
            />

            <StatCard
              label="Archived"
              value={data.counts.archived}
              icon={
                <Archive className="h-4 w-4" />
              }
            />
          </div>

          {data.live.length > 0 && (
            <section className="space-y-3">
              <h2 className="section-title flex items-center gap-2">
                <Radio
                  className="h-4 w-4 text-[var(--aurak-live)]"
                  aria-hidden
                />
                Happening now
              </h2>

              {renderList(
                data.live,
                true
              )}
            </section>
          )}

          <section className="space-y-3">
            <h2 className="section-title">
              Events this week
            </h2>

            {data.thisWeek.length === 0 ? (
              <Card>
                <EmptyState
                  icon={
                    <CalendarDays className="h-6 w-6" />
                  }
                  title="Nothing scheduled in the next 7 days"
                  description="Create an event to get started."
                  action={
                    <Link
                      href="/campus-events/admin/events/new"
                      className="btn btn-primary btn-sm"
                    >
                      Create Event
                    </Link>
                  }
                />
              </Card>
            ) : (
              renderList(
                data.thisWeek,
                false
              )
            )}
          </section>

          <section className="space-y-3">
            <h2 className="section-title">
              Upcoming events
            </h2>

            {data.upcoming.length === 0 ? (
              <Card>
                <EmptyState title="No upcoming events" />
              </Card>
            ) : (
              renderList(
                data.upcoming,
                false
              )
            )}
          </section>

          <section className="space-y-3">
            <h2 className="section-title">
              Recently completed
            </h2>

            {data.recentlyCompleted.length === 0 ? (
              <Card>
                <EmptyState title="No completed events yet" />
              </Card>
            ) : (
              renderList(
                data.recentlyCompleted,
                true
              )
            )}
          </section>

          <Card>
            <CardHeader title="Reminder" />

            <CardBody>
              <p className="meta-text">
                RSVP totals are responses, not attendance.
                Attendance only increases when Campus Staff
                scan a QR code at the event.
              </p>
            </CardBody>
          </Card>

          <DemoDataControls />
        </>
      )}
    </div>
  );
}