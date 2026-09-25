"use client";

import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import type { CampusEvent, RsvpBreakdown } from "@/lib/types";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { formatCampusLocation } from "@/lib/data/campus-reference";
import {
  formatDateProximity,
  formatEventDate,
  formatTimeRange,
} from "@/lib/utils/dates";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function CampusEventCard({
  event,
  href,
  rsvp,
  attendedCount,
  className,
}: {
  event: CampusEvent;
  href: string;
  rsvp?: RsvpBreakdown;
  attendedCount?: number;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "card card-interactive block p-4 sm:p-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[0.9375rem] font-semibold text-[var(--aurak-navy)]">
            {event.name}
          </h3>

          <p className="mt-0.5 truncate text-xs text-[var(--aurak-text-muted)]">
            {event.hostingDepartmentName}
          </p>
        </div>

        <EventStatusBadge event={event} className="shrink-0" />
      </div>

      <div className="mt-3 space-y-1.5 text-sm text-[var(--aurak-text-muted)]">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {formatEventDate(event.date)} ·{" "}
            {formatTimeRange(event.startTime, event.endTime)}
          </span>
        </p>

        <p className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {formatCampusLocation(event.location)}
          </span>
        </p>
      </div>

      {(rsvp || typeof attendedCount === "number") && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--aurak-line)] pt-3 text-xs">
          {rsvp && (
            <span className="flex items-center gap-1.5 text-[var(--aurak-text-muted)]">
              <Users className="h-3.5 w-3.5" aria-hidden />
              RSVP&nbsp;
              <span className="tabular font-medium text-[var(--aurak-navy)]">
                {formatNumber(rsvp.yes)}
              </span>
              &nbsp;yes ·&nbsp;
              <span className="tabular">
                {formatNumber(rsvp.maybe)}
              </span>
              &nbsp;maybe
            </span>
          )}

          {typeof attendedCount === "number" && (
            <span className="text-[var(--aurak-text-muted)]">
              Attended&nbsp;
              <span className="tabular font-medium text-[var(--aurak-navy)]">
                {formatNumber(attendedCount)}
              </span>
            </span>
          )}
        </div>
      )}

      <p className="mt-2 text-xs font-medium text-[var(--aurak-brand)]">
        {formatDateProximity(event.date)}
      </p>
    </Link>
  );
}