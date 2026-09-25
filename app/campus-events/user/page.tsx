"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  MapPin,
  Ticket,
} from "lucide-react";
import type { CampusEvent, RSVPStatus } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
} from "@/components/ui";
import { UserEventCard } from "@/components/campus/UserEventCard";
import { LoadingSection } from "@/components/shared/LoadingSection";
import {
  getEventsByBuilding,
  listEvents,
  type BuildingEventCount,
} from "@/lib/services/campusEventService";
import { getRsvpsForUser } from "@/lib/services/campusRsvpService";
import {
  getAttendedCounts,
  getAttendedEventIds,
} from "@/lib/services/campusAttendanceService";
import { useAuth } from "@/lib/context/AuthContext";
import { isWithinNextDays } from "@/lib/utils/dates";
import { formatNumber } from "@/lib/utils/format";

export default function CampusUserHomePage() {
  const { user } = useAuth();
  const campusUserId = user?.campusUserId;

  const [soon, setSoon] = useState<CampusEvent[]>([]);
  const [upcoming, setUpcoming] = useState<CampusEvent[]>([]);
  const [attendedEvents, setAttendedEvents] = useState<CampusEvent[]>([]);
  const [buildings, setBuildings] = useState<BuildingEventCount[]>([]);

  const [myRsvps, setMyRsvps] =
    useState<Record<string, RSVPStatus>>({});

  const [attendedCounts, setAttendedCounts] =
    useState<Record<string, number>>({});

  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!campusUserId) return;

    setLoading(true);

    const [allEvents, buildingCounts, rsvps, attendedIds] =
      await Promise.all([
        listEvents({ status: "all" }),
        getEventsByBuilding(),
        getRsvpsForUser(campusUserId),
        getAttendedEventIds(campusUserId),
      ]);

    const rsvpMap: Record<string, RSVPStatus> = {};

    rsvps.forEach((rsvp) => {
      rsvpMap[rsvp.eventId] = rsvp.status;
    });

    const openEvents = allEvents.filter(
      (event) => event.status !== "cancelled"
    );

    const soonEvents = openEvents.filter((event) =>
      isWithinNextDays(event.date, 7)
    );

    const upcomingEvents = openEvents.filter(
      (event) =>
        !isWithinNextDays(event.date, 7) &&
        event.date >= todayString()
    );

    const attended = allEvents
      .filter((event) => attendedIds.includes(event.id))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 4);

    const counts = await getAttendedCounts(
      attended.map((event) => event.id)
    );

    setSoon(soonEvents);
    setUpcoming(upcomingEvents);
    setAttendedEvents(attended);
    setBuildings(buildingCounts);
    setMyRsvps(rsvpMap);
    setAttendedCounts(counts);
    setLoading(false);
  }, [campusUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!campusUserId) {
    return (
      <div className="page">
        <Card>
          <EmptyState
            title="Profile unavailable"
            description="Please sign in again."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="page space-y-6">
      <PageHeader
        title={`Hello, ${user?.fullName.split(" ")[0] ?? "there"}`}
        subtitle="Everything happening at AURAK."
      />

      {loading ? (
        <LoadingSection rows={3} />
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="section-title flex items-center gap-2">
                <MapPin
                  className="h-4 w-4 text-[var(--aurak-brand)]"
                  aria-hidden
                />
                Events by Location
              </h2>

              <Link
                href="/campus-events/user/locations"
                className="text-xs font-medium text-[var(--aurak-brand)] hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {buildings.map((building) => (
                <Link
                  key={building.buildingId}
                  href={`/campus-events/user/locations/${building.buildingId}`}
                  className="card card-interactive p-4"
                >
                  <p className="text-sm font-semibold text-[var(--aurak-navy)]">
                    {building.buildingName}
                  </p>

                  <p className="mt-1 text-xs text-[var(--aurak-text-muted)]">
                    {building.upcomingCount === 0
                      ? "No events scheduled"
                      : `${formatNumber(building.upcomingCount)} ${
                          building.upcomingCount === 1
                            ? "event"
                            : "events"
                        }`}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="section-title">Happening Soon</h2>

            {soon.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<CalendarDays className="h-6 w-6" />}
                  title="Nothing in the next 7 days"
                  description="Check the upcoming events below."
                />
              </Card>
            ) : (
              <div className="space-y-3">
                {soon.map((event) => (
                  <UserEventCard
                    key={event.id}
                    event={event}
                    myRsvp={myRsvps[event.id] ?? null}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="section-title">Upcoming Events</h2>

            {upcoming.length === 0 ? (
              <Card>
                <EmptyState title="No further events scheduled yet" />
              </Card>
            ) : (
              <div className="space-y-3">
                {upcoming.map((event) => (
                  <UserEventCard
                    key={event.id}
                    event={event}
                    myRsvp={myRsvps[event.id] ?? null}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="section-title">Recently Attended</h2>

              <Link
                href="/campus-events/user/my-events"
                className="flex items-center gap-1 text-xs font-medium text-[var(--aurak-brand)] hover:underline"
              >
                My Events
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {attendedEvents.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<Ticket className="h-6 w-6" />}
                  title="No attended events yet"
                  description="Reply Yes or Maybe to an event, then show your QR code at the door."
                />
              </Card>
            ) : (
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
            )}
          </section>

          <Card>
            <CardHeader title="Good to know" />

            <CardBody>
              <p className="meta-text">
                You can see every AURAK event here. Notifications are sent
                only for events aimed at your group, so browse freely —
                nothing is hidden from you.
              </p>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

function todayString(): string {
  const now = new Date();

  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}