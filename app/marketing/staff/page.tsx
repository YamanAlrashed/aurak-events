"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  Bus,
  CalendarDays,
  ChevronRight,
  MapPin,
  Phone,
} from "lucide-react";
import type { MarketingEvent } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Tabs,
} from "@/components/ui";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { LoadingSection } from "@/components/shared/LoadingSection";
import {
  getStaffEvents,
  type StaffEventGroups,
} from "@/lib/services/marketingEventService";
import { useAuth } from "@/lib/context/AuthContext";
import {
  EMIRATE_LABELS,
  MARKETING_EVENT_TYPE_LABELS,
} from "@/lib/data/marketing-reference";
import {
  formatDateProximity,
  formatEventDate,
  formatTime,
  formatTimeRange,
} from "@/lib/utils/dates";

type TabId =
  | "today"
  | "upcoming"
  | "assigned"
  | "past";

function StaffEventCard({
  event,
}: {
  event: MarketingEvent;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[0.9375rem] font-semibold text-[var(--aurak-navy)]">
            {event.name}
          </h3>

          <Badge
            variant="brand"
            className="mt-1"
          >
            {
              MARKETING_EVENT_TYPE_LABELS[
                event.type
              ]
            }
          </Badge>
        </div>

        <EventStatusBadge
          event={event}
          className="shrink-0"
        />
      </div>

      <div className="mt-3 space-y-1.5 text-sm text-[var(--aurak-text-muted)]">
        <p className="flex items-center gap-2">
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

        {event.departureTime && (
          <p className="flex items-center gap-2 font-medium text-[var(--aurak-brand)]">
            <Bus
              className="h-3.5 w-3.5 shrink-0"
              aria-hidden
            />

            Departure{" "}
            {formatTime(
              event.departureTime
            )}
          </p>
        )}

        <p className="flex items-center gap-2">
          <MapPin
            className="h-3.5 w-3.5 shrink-0"
            aria-hidden
          />

          <span className="truncate">
            {
              event.location
                .venueName
            }{" "}
            ·{" "}
            {
              EMIRATE_LABELS[
                event.location
                  .emirate
              ]
            }
          </span>
        </p>

        {event.driver && (
          <p className="flex items-center gap-2">
            <Phone
              className="h-3.5 w-3.5 shrink-0"
              aria-hidden
            />

            <span className="truncate">
              {
                event.driver
                  .name
              }{" "}
              ·{" "}
              {
                event.driver
                  .phone
              }
            </span>
          </p>
        )}
      </div>

      {event.assignedStaff.length >
        0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--aurak-line)] pt-3">
          {event.assignedStaff
            .slice(0, 8)
            .map(
              (staff) => (
                <span
                  key={
                    staff.staffId
                  }
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--aurak-bg-sunken)] text-[0.625rem] font-semibold text-[var(--aurak-navy)]"
                  title={
                    staff.name
                  }
                >
                  {
                    staff.initials
                  }
                </span>
              )
            )}

          {event.assignedStaff
            .length > 8 && (
            <span className="flex h-6 items-center px-1 text-xs text-[var(--aurak-text-muted)]">
              +
              {event
                .assignedStaff
                .length - 8}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/marketing/staff/events/${event.id}`}
          className="btn btn-primary btn-sm"
        >
          Open event
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>

        {event.location.mapUrl && (
          <a
            href={
              event.location
                .mapUrl
            }
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <MapPin className="h-3.5 w-3.5" />
            Open Map
          </a>
        )}
      </div>

      <p className="mt-2 text-xs font-medium text-[var(--aurak-brand)]">
        {formatDateProximity(
          event.date
        )}
      </p>
    </div>
  );
}

export default function MarketingStaffHomePage() {
  const { user } =
    useAuth();

  const staffId =
    user?.marketingStaffId;

  const [
    groups,
    setGroups,
  ] =
    useState<
      StaffEventGroups | null
    >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    tab,
    setTab,
  ] =
    useState<TabId>(
      "today"
    );

  const load =
    useCallback(async () => {
      setLoading(true);

      setGroups(
        await getStaffEvents(
          staffId
        )
      );

      setLoading(false);
    }, [staffId]);

  useEffect(() => {
    void load();
  }, [load]);

  const current =
    groups?.[tab] ?? [];

  return (
    <div className="page space-y-5">
      <PageHeader
        title="My Events"
        subtitle="Events you are assigned to, with transport and venue details."
      />

      <Tabs
        items={[
          {
            id: "today",
            label:
              "Today",
            count:
              groups?.today
                .length,
          },
          {
            id: "upcoming",
            label:
              "Upcoming",
            count:
              groups
                ?.upcoming
                .length,
          },
          {
            id: "assigned",
            label:
              "All Assigned",
            count:
              groups
                ?.assigned
                .length,
          },
          {
            id: "past",
            label:
              "Past",
            count:
              groups?.past
                .length,
          },
        ]}
        activeId={tab}
        onChange={(id) =>
          setTab(
            id as TabId
          )
        }
      />

      {loading ? (
        <LoadingSection rows={3} />
      ) : current.length ===
        0 ? (
        <Card>
          <EmptyState
            icon={
              <CalendarDays className="h-6 w-6" />
            }
            title={
              tab ===
              "today"
                ? "No events today"
                : tab ===
                    "past"
                  ? "No past events"
                  : "Nothing assigned here"
            }
            description="The Marketing team assigns staff to each event. Ask them if you expected to be on this list."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {current.map(
            (event) => (
              <StaffEventCard
                key={
                  event.id
                }
                event={
                  event
                }
              />
            )
          )}
        </div>
      )}

      <Card>
        <CardHeader title="At the event" />

        <CardBody>
          <p className="meta-text">
            Scan a registrant&apos;s QR
            code, correct their details if
            needed, then record how many
            people actually arrived —
            including the prospect
            themselves — and confirm
            attendance.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}