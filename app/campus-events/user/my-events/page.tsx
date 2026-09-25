"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Ticket } from "lucide-react";
import type { CampusEvent, RSVPStatus } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Tabs,
} from "@/components/ui";
import { UserEventCard } from "@/components/campus/UserEventCard";
import { LoadingSection } from "@/components/shared/LoadingSection";
import { listEvents } from "@/lib/services/campusEventService";
import { getRsvpsForUser } from "@/lib/services/campusRsvpService";
import {
  getAttendedCounts,
  getAttendedEventIds,
} from "@/lib/services/campusAttendanceService";
import { useAuth } from "@/lib/context/AuthContext";
import { deriveEventStatus } from "@/lib/utils/dates";

type TabId =
  | "responses"
  | "attended";

export default function CampusUserMyEventsPage() {
  const { user } = useAuth();
  const campusUserId = user?.campusUserId;

  const [responses, setResponses] =
    useState<CampusEvent[]>([]);

  const [attendedEvents, setAttendedEvents] =
    useState<CampusEvent[]>([]);

  const [myRsvps, setMyRsvps] =
    useState<Record<string, RSVPStatus>>({});

  const [attendedCounts, setAttendedCounts] =
    useState<Record<string, number>>({});

  const [loading, setLoading] =
    useState(true);

  const [tab, setTab] =
    useState<TabId>("responses");

  const load = useCallback(async () => {
    if (!campusUserId) return;

    setLoading(true);

    const [allEvents, rsvps, attendedIds] =
      await Promise.all([
        listEvents({
          status: "all",
          includeArchived: true,
        }),
        getRsvpsForUser(campusUserId),
        getAttendedEventIds(campusUserId),
      ]);

    const rsvpMap: Record<string, RSVPStatus> = {};

    rsvps.forEach((rsvp) => {
      rsvpMap[rsvp.eventId] = rsvp.status;
    });

    const myUpcoming = allEvents
      .filter((event) => rsvpMap[event.id] !== undefined)
      .filter((event) => {
        const status = deriveEventStatus(event);

        return (
          status === "upcoming" ||
          status === "live" ||
          status === "cancelled"
        );
      });

    const attended = allEvents
      .filter((event) => attendedIds.includes(event.id))
      .sort((a, b) => b.date.localeCompare(a.date));

    const counts = await getAttendedCounts(
      attended.map((event) => event.id)
    );

    setResponses(myUpcoming);
    setAttendedEvents(attended);
    setMyRsvps(rsvpMap);
    setAttendedCounts(counts);
    setLoading(false);
  }, [campusUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page space-y-5">
      <PageHeader
        title="My Events"
        subtitle="Your responses and the events you attended."
      />

      <Tabs
        items={[
          {
            id: "responses",
            label: "My Responses",
            count: responses.length,
          },
          {
            id: "attended",
            label: "Attended",
            count: attendedEvents.length,
          },
        ]}
        activeId={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      {loading ? (
        <LoadingSection rows={3} />
      ) : tab === "responses" ? (
        responses.length === 0 ? (
          <Card>
            <EmptyState
              icon={<CalendarCheck className="h-6 w-6" />}
              title="You have not responded to any events yet"
              description="Browse the events and let the organisers know if you are coming."
              action={
                <Link
                  href="/campus-events/user"
                  className="btn btn-primary btn-sm"
                >
                  Browse events
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {responses.map((event) => (
              <UserEventCard
                key={event.id}
                event={event}
                myRsvp={myRsvps[event.id] ?? null}
              />
            ))}
          </div>
        )
      ) : attendedEvents.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Ticket className="h-6 w-6" />}
            title="No attended events yet"
            description="Your attendance appears here once staff scan your QR code at an event."
          />
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {attendedEvents.map((event) => (
              <UserEventCard
                key={event.id}
                event={event}
                myRsvp={myRsvps[event.id] ?? null}
                attendedCount={attendedCounts[event.id]}
              />
            ))}
          </div>

          <Card>
            <CardHeader title="Why an event might be missing" />

            <CardBody>
              <p className="meta-text">
                This list is based on QR check-ins. If you attended an event
                but were not scanned, it will not appear here — and you will
                not be able to rate it.
              </p>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}