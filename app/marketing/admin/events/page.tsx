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
} from "lucide-react";
import type {
  EventStatus,
  MarketingEvent,
  MarketingEventStats,
} from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  EmptyState,
  SearchInput,
  Tabs,
} from "@/components/ui";
import { MarketingEventCard } from "@/components/marketing/MarketingEventCard";
import { LoadingSection } from "@/components/shared/LoadingSection";
import { listEvents } from "@/lib/services/marketingEventService";
import { getStatsForEvents } from "@/lib/services/marketingAttendanceService";

type StatusTab =
  | "all"
  | Extract<
      EventStatus,
      | "upcoming"
      | "live"
      | "completed"
      | "cancelled"
    >;

const TABS: Array<{
  id: StatusTab;
  label: string;
}> = [
  {
    id: "all",
    label: "All",
  },
  {
    id: "upcoming",
    label: "Upcoming",
  },
  {
    id: "live",
    label: "Live",
  },
  {
    id: "completed",
    label: "Completed",
  },
  {
    id: "cancelled",
    label: "Cancelled",
  },
];

export default function MarketingAdminEventsPage() {
  const [
    events,
    setEvents,
  ] = useState<
    MarketingEvent[]
  >([]);

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
    tab,
    setTab,
  ] =
    useState<StatusTab>(
      "all"
    );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const load =
    useCallback(async () => {
      setLoading(true);

      const result =
        await listEvents({
          status:
            tab === "all"
              ? "all"
              : tab,
          search,
        });

      const eventStats =
        await getStatsForEvents(
          result.map(
            (event) =>
              event.id
          )
        );

      setEvents(result);
      setStats(
        eventStats
      );
      setLoading(false);
    }, [tab, search]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page space-y-5">
      <PageHeader
        title="Events"
        subtitle="Open days, school visits, exhibitions and recruitment trips."
        actions={
          <Link
            href="/marketing/admin/events/new"
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Link>
        }
      />

      <div className="space-y-4">
        <SearchInput
          value={search}
          onChange={
            setSearch
          }
          placeholder="Search by event or venue…"
          className="max-w-md"
        />

        <Tabs
          items={TABS.map(
            (item) => ({
              id: item.id,
              label:
                item.label,
            })
          )}
          activeId={tab}
          onChange={(id) =>
            setTab(
              id as StatusTab
            )
          }
        />
      </div>

      {loading ? (
        <LoadingSection rows={4} />
      ) : events.length ===
        0 ? (
        <Card>
          <EmptyState
            icon={
              <CalendarDays className="h-6 w-6" />
            }
            title="No events match"
            description={
              search
                ? "Try a different search term."
                : "Create your first event."
            }
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
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {events.map(
            (event) => (
              <MarketingEventCard
                key={
                  event.id
                }
                event={
                  event
                }
                href={`/marketing/admin/events/${event.id}`}
                stats={
                  stats[
                    event.id
                  ]
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}