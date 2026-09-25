"use client";

import Link from "next/link";
import { Bus, CalendarDays, MapPin, Users } from "lucide-react";
import type { MarketingEvent, MarketingEventStats } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import {
  EMIRATE_LABELS,
  MARKETING_EVENT_TYPE_LABELS,
  STAFF_DEPARTMENT_LABELS,
} from "@/lib/data/marketing-reference";
import {
  formatDateProximity,
  formatEventDate,
  formatTime,
  formatTimeRange,
} from "@/lib/utils/dates";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function MarketingEventCard({
  event,
  href,
  stats,
  className,
}: {
  event: MarketingEvent;
  href: string;
  /** Students and visitors are shown as separate figures, never summed. */
  stats?: MarketingEventStats;
  className?: string;
}) {
  const teamPreview = event.assignedStaff.slice(0, 5);
  const extraTeam = event.assignedStaff.length - teamPreview.length;

  return (
    <Link
      href={href}
      className={cn("card card-interactive block p-4 sm:p-5", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[0.9375rem] font-semibold text-[var(--aurak-navy)]">
            {event.name}
          </h3>

          <p className="mt-1">
            <Badge variant="brand">
              {MARKETING_EVENT_TYPE_LABELS[event.type]}
            </Badge>
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

        {event.departureTime && (
          <p className="flex items-center gap-2">
            <Bus className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              Departure {formatTime(event.departureTime)}
              {event.driver ? ` · Driver ${event.driver.name}` : ""}
            </span>
          </p>
        )}

        <p className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {event.location.venueName} ·{" "}
            {EMIRATE_LABELS[event.location.emirate]}
          </span>
        </p>

        {event.assignedStaff.length > 0 && (
          <p className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {event.assignedStaff.length} assigned ·{" "}
              {teamPreview.map((staff) => staff.name).join(", ")}
              {extraTeam > 0 ? ` +${extraTeam}` : ""}
            </span>
          </p>
        )}
      </div>

      {stats && (
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--aurak-line)] pt-3">
          <div>
            <p className="text-[0.625rem] font-medium uppercase tracking-[0.04em] text-[var(--aurak-text-muted)]">
              Students
            </p>
            <p className="text-sm tabular font-semibold text-[var(--aurak-navy)]">
              {formatNumber(stats.students)}
            </p>
          </div>

          <div>
            <p className="text-[0.625rem] font-medium uppercase tracking-[0.04em] text-[var(--aurak-text-muted)]">
              Visitors
            </p>
            <p className="text-sm tabular font-semibold text-[var(--aurak-navy)]">
              {formatNumber(stats.visitors)}
            </p>
          </div>

          <div>
            <p className="text-[0.625rem] font-medium uppercase tracking-[0.04em] text-[var(--aurak-text-muted)]">
              Attended
            </p>
            <p className="text-sm tabular font-semibold text-[var(--aurak-navy)]">
              {formatNumber(stats.attended)}
            </p>
          </div>
        </div>
      )}

      <p className="mt-2 text-xs font-medium text-[var(--aurak-brand)]">
        {formatDateProximity(event.date)}
      </p>

      <span className="sr-only">
        Team departments:{" "}
        {Array.from(
          new Set(event.assignedStaff.map((staff) => staff.department))
        )
          .map((department) => STAFF_DEPARTMENT_LABELS[department])
          .join(", ")}
      </span>
    </Link>
  );
}