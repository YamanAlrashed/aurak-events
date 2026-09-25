"use client";

import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import type { CampusEvent, RSVPStatus } from "@/lib/types";
import { RawBadge } from "@/components/ui/Badge";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { formatCampusLocation } from "@/lib/data/campus-reference";
import {
  RSVP_BADGE_CLASS,
  RSVP_LABELS,
} from "@/lib/utils/constants";
import {
  formatDateProximity,
  formatTimeRange,
} from "@/lib/utils/dates";
import { formatCount } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function UserEventCard({
  event,
  myRsvp,
  attendedCount,
  className,
}: {
  event: CampusEvent;
  myRsvp?: RSVPStatus | null;
  attendedCount?: number;
  className?: string;
}) {
  return (
    <Link
      href={`/campus-events/user/events/${event.id}`}
      className={cn("card card-interactive block p-4", className)}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 text-[0.9375rem] font-semibold leading-snug text-[var(--aurak-navy)]">
          {event.name}
        </h3>

        <EventStatusBadge event={event} className="shrink-0" />
      </div>

      <p className="mt-1 text-xs text-[var(--aurak-text-muted)]">
        {event.hostingDepartmentName}
      </p>

      <div className="mt-2.5 space-y-1.5 text-sm text-[var(--aurak-text-muted)]">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />

          <span className="truncate">
            {formatDateProximity(event.date)} ·{" "}
            {formatTimeRange(event.startTime, event.endTime)}
          </span>
        </p>

        <p className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />

          <span className="truncate">
            {formatCampusLocation(event.location)}
          </span>
        </p>

        {typeof attendedCount === "number" && attendedCount > 0 && (
          <p className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />

            <span>{formatCount(attendedCount, "attended")}</span>
          </p>
        )}
      </div>

      {myRsvp && (
        <div className="mt-3 border-t border-[var(--aurak-line)] pt-2.5">
          <RawBadge badgeClass={RSVP_BADGE_CLASS[myRsvp]}>
            You said {RSVP_LABELS[myRsvp]}
          </RawBadge>
        </div>
      )}
    </Link>
  );
}