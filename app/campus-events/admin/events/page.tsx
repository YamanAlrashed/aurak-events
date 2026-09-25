"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  CalendarDays,
  Plus,
} from "lucide-react";
import type {
  CampusEvent,
  EventStatus,
  RsvpBreakdown,
} from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  EmptyState,
  SearchInput,
  Tabs,
} from "@/components/ui";
import { CampusEventCard } from "@/components/campus/CampusEventCard";
import { LoadingSection } from "@/components/shared/LoadingSection";
import { listEvents } from "@/lib/services/campusEventService";
import { getBreakdowns } from "@/lib/services/campusRsvpService";
import { getAttendedCounts } from "@/lib/services/campusAttendanceService";

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

export default function CampusAdminEventsPage() {
  const [events, setEvents] =
    useState<CampusEvent[]>([]);

  const [rsvps, setRsvps] =
    useState<Record<string, RsvpBreakdown>>({});

  const [attended, setAttended] =
    useState<Record<string, number>>({});

  const [tab, setTab] =
    useState<StatusTab>("all");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const result =
      await listEvents({
        status:
          tab === "all"
            ? "all"
            : tab,
        search,
      });

    const ids =
      result.map(
        (event) =>
          event.id
      );

    const [breakdowns, counts] =
      await Promise.all([
        getBreakdowns(ids),
        getAttendedCounts(ids),
      ]);

    setEvents(result);
    setRsvps(breakdowns);
    setAttended(counts);
    setLoading(false);
  }, [tab, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const showAttended =
    useMemo(
      () =>
        tab === "completed" ||
        tab === "live" ||
        tab === "all",
      [tab]
    );

  return (
    <div className="page space-y-5">
      <PageHeader
        title="Events"
        subtitle="Create, edit and review every campus event."
        actions={
          <Link
            href="/campus-events/admin/events/new"
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
          onChange={setSearch}
          placeholder="Search by name, department or location…"
          className="max-w-md"
        />

        <Tabs
          items={TABS.map(
            (item) => ({
              id: item.id,
              label: item.label,
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
      ) : events.length === 0 ? (
        <Card>
          <EmptyState
            icon={
              <CalendarDays className="h-6 w-6" />
            }
            title="No events match"
            description={
              search
                ? "Try a different search term."
                : "Create your first event for this status."
            }
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
      )}
    </div>
  );
}