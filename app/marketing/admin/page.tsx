"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  CalendarDays,
  Plus,
  Radio,
} from "lucide-react";
import type {
  MarketingEvent,
  MarketingEventStats,
} from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { DemoDataControls } from "@/components/layout/DemoDataControls";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
} from "@/components/ui";
import { MarketingEventCard } from "@/components/marketing/MarketingEventCard";
import { MarketingAnalyticsPanel } from "@/components/marketing/MarketingAnalyticsPanel";
import { LoadingSection } from "@/components/shared/LoadingSection";
import {
  getDashboardData,
  type MarketingDashboardData,
} from "@/lib/services/marketingEventService";
import { getStatsForEvents } from "@/lib/services/marketingAttendanceService";
import { getEventTotals } from "@/lib/services/marketingAnalyticsService";
import { formatMediumDate } from "@/lib/utils/dates";
import { formatNumber } from "@/lib/utils/format";

interface EventTotal {
  eventId: string;
  eventName: string;
  date: string;
  students: number;
  visitors: number;
  attended: number;
}

export default function MarketingAdminDashboardPage() {
  const [
    data,
    setData,
  ] =
    useState<
      MarketingDashboardData | null
    >(null);

  const [
    stats,
    setStats,
  ] = useState<
    Record<
      string,
      MarketingEventStats
    >
  >({});

  const [
    totals,
    setTotals,
  ] =
    useState<
      EventTotal[]
    >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const load =
    useCallback(async () => {
      setLoading(true);

      const dashboard =
        await getDashboardData();

      const ids =
        Array.from(
          new Set(
            [
              ...dashboard.live,
              ...dashboard.thisWeek,
              ...dashboard.upcoming,
              ...dashboard.recentlyCompleted,
            ].map(
              (event) =>
                event.id
            )
          )
        );

      const [
        eventStats,
        eventTotals,
      ] =
        await Promise.all([
          getStatsForEvents(
            ids
          ),
          getEventTotals(),
        ]);

      setData(dashboard);
      setStats(
        eventStats
      );
      setTotals(
        eventTotals
      );
      setLoading(false);
    }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function renderList(
    events: MarketingEvent[],
    withStats: boolean
  ) {
    return (
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {events.map(
          (event) => (
            <MarketingEventCard
              key={event.id}
              event={event}
              href={`/marketing/admin/events/${event.id}`}
              stats={
                withStats
                  ? stats[
                      event.id
                    ]
                  : undefined
              }
            />
          )
        )}
      </div>
    );
  }

  return (
    <div className="page space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Recruitment events, prospects and visitors across all activity."
        actions={
          <>
            <Link
              href="/marketing/admin/events"
              className="btn btn-secondary"
            >
              All Events
            </Link>

            <Link
              href="/marketing/admin/events/new"
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </Link>
          </>
        }
      />

      {loading ||
      !data ? (
        <LoadingSection rows={3} />
      ) : (
        <>
          <MarketingAnalyticsPanel />

          {data.live.length >
            0 && (
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
              This week
            </h2>

            {data.thisWeek.length ===
            0 ? (
              <Card>
                <EmptyState
                  icon={
                    <CalendarDays className="h-6 w-6" />
                  }
                  title="No events in the next 7 days"
                  action={
                    <Link
                      href="/marketing/admin/events/new"
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

            {data.upcoming.length ===
            0 ? (
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

            {data.recentlyCompleted
              .length === 0 ? (
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
            <CardHeader title="Event totals" />

            <CardBody>
              <div className="scroll-x">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Date</th>
                      <th>Students</th>
                      <th>Visitors</th>
                      <th>Attended</th>
                    </tr>
                  </thead>

                  <tbody>
                    {totals.map(
                      (row) => (
                        <tr
                          key={
                            row.eventId
                          }
                        >
                          <td>
                            <Link
                              href={`/marketing/admin/events/${row.eventId}`}
                              className="link"
                            >
                              {
                                row.eventName
                              }
                            </Link>
                          </td>

                          <td>
                            {formatMediumDate(
                              row.date
                            )}
                          </td>

                          <td className="table-numeric">
                            {formatNumber(
                              row.students
                            )}
                          </td>

                          <td className="table-numeric">
                            {formatNumber(
                              row.visitors
                            )}
                          </td>

                          <td className="table-numeric">
                            {formatNumber(
                              row.attended
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <p className="field-hint mt-3">
                Students counts prospects who
                registered. Visitors counts
                people who arrived, including
                the guests they brought. The
                two columns are never added
                together.
              </p>
            </CardBody>
          </Card>

          <DemoDataControls />
        </>
      )}
    </div>
  );
}