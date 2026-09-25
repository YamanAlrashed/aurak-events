"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { CampusEvent } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  StatCard,
} from "@/components/ui";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { DetailList } from "@/components/shared/DetailList";
import { LoadingSection } from "@/components/shared/LoadingSection";
import { CampusCheckInPanel } from "@/components/campus/CampusCheckInPanel";
import { getEvent } from "@/lib/services/campusEventService";
import { getAttendedCount } from "@/lib/services/campusAttendanceService";
import { formatCampusLocation } from "@/lib/data/campus-reference";
import {
  formatEventDate,
  formatTimeRange,
} from "@/lib/utils/dates";

export default function CampusStaffEventPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const eventId =
    params.id;

  const [event, setEvent] =
    useState<CampusEvent | null>(
      null
    );

  const [attended, setAttended] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const refreshCount =
    useCallback(async () => {
      setAttended(
        await getAttendedCount(
          eventId
        )
      );
    }, [eventId]);

  useEffect(() => {
    let cancelled =
      false;

    async function load() {
      const [
        result,
        count,
      ] =
        await Promise.all([
          getEvent(
            eventId
          ),

          getAttendedCount(
            eventId
          ),
        ]);

      if (!cancelled) {
        setEvent(
          result
        );

        setAttended(
          count
        );

        setLoading(
          false
        );
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (loading) {
    return (
      <div className="page space-y-5">
        <PageHeader title="Event" />
        <LoadingSection rows={2} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="page">
        <Card>
          <EmptyState
            title="Event not found"
            action={
              <Link
                href="/campus-events/staff"
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

  return (
    <div className="page space-y-5">
      <PageHeader
        title={event.name}
        subtitle={
          event.hostingDepartmentName
        }
      />

      <EventStatusBadge
        event={event}
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Attended"
          value={attended}
          caption="QR check-ins"
        />

        <StatCard
          label="Location"
          value={
            event.location
              .buildingName
          }
          caption={
            event.location.room ??
            event.location
              .locationName ??
            ""
          }
        />
      </div>

      <Card>
        <CardHeader title="Event details" />

        <CardBody>
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
                  "Location",

                value:
                  formatCampusLocation(
                    event.location
                  ),

                wide: true,
              },
            ]}
          />
        </CardBody>
      </Card>

      <CampusCheckInPanel
        eventId={
          event.id
        }
        onCheckedIn={
          refreshCount
        }
      />
    </div>
  );
}