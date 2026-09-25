"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import type { CampusEvent, RSVPStatus } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, EmptyState } from "@/components/ui";
import { UserEventCard } from "@/components/campus/UserEventCard";
import { LoadingSection } from "@/components/shared/LoadingSection";
import { listEvents } from "@/lib/services/campusEventService";
import { getRsvpsForUser } from "@/lib/services/campusRsvpService";
import { getAttendedCounts } from "@/lib/services/campusAttendanceService";
import { useAuth } from "@/lib/context/AuthContext";
import { getBuilding } from "@/lib/data/campus-reference";
import { deriveEventStatus } from "@/lib/utils/dates";

export default function CampusUserBuildingPage() {
  const params =
    useParams<{
      buildingId: string;
    }>();

  const buildingId = params.buildingId;

  const { user } = useAuth();
  const campusUserId = user?.campusUserId;

  const [events, setEvents] =
    useState<CampusEvent[]>([]);

  const [myRsvps, setMyRsvps] =
    useState<Record<string, RSVPStatus>>({});

  const [attendedCounts, setAttendedCounts] =
    useState<Record<string, number>>({});

  const [loading, setLoading] =
    useState(true);

  const building = getBuilding(buildingId);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await listEvents({
        buildingId,
        status: "all",
      });

      const counts = await getAttendedCounts(
        result.map((event) => event.id)
      );

      const rsvpMap: Record<string, RSVPStatus> = {};

      if (campusUserId) {
        const rsvps = await getRsvpsForUser(campusUserId);

        rsvps.forEach((rsvp) => {
          rsvpMap[rsvp.eventId] = rsvp.status;
        });
      }

      if (!cancelled) {
        setEvents(result);
        setAttendedCounts(counts);
        setMyRsvps(rsvpMap);
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [buildingId, campusUserId]);

  const current = events.filter((event) => {
    const status = deriveEventStatus(event);

    return (
      status === "upcoming" ||
      status === "live" ||
      status === "cancelled"
    );
  });

  const past = events.filter((event) => {
    const status = deriveEventStatus(event);

    return status === "completed";
  });

  return (
    <div className="page space-y-5">
      <PageHeader
        title={building?.name ?? "Location"}
        subtitle={building?.campus ?? "Events held at this location"}
      />

      {loading ? (
        <LoadingSection rows={3} />
      ) : events.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            title="No events at this location"
            description="Try another building."
            action={
              <Link
                href="/campus-events/user/locations"
                className="btn btn-secondary btn-sm"
              >
                All locations
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="section-title">Coming up</h2>

            {current.length === 0 ? (
              <Card>
                <EmptyState title="Nothing scheduled here right now" />
              </Card>
            ) : (
              <div className="space-y-3">
                {current.map((event) => (
                  <UserEventCard
                    key={event.id}
                    event={event}
                    myRsvp={myRsvps[event.id] ?? null}
                  />
                ))}
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="section-title">Past events here</h2>

              <div className="space-y-3">
                {past.map((event) => (
                  <UserEventCard
                    key={event.id}
                    event={event}
                    myRsvp={myRsvps[event.id] ?? null}
                    attendedCount={attendedCounts[event.id]}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}