"use client";

import { Info } from "lucide-react";
import type { RsvpBreakdown } from "@/lib/types";
import {
  Card,
  CardBody,
  CardHeader,
  StatCard,
} from "@/components/ui";
import {
  formatNumber,
  formatPercent,
} from "@/lib/utils/format";

export function RsvpBreakdownCard({
  breakdown,
  attendedCount,
  eventHasStarted,
}: {
  breakdown: RsvpBreakdown;
  attendedCount: number;
  eventHasStarted: boolean;
}) {
  const expected =
    breakdown.yes +
    breakdown.maybe;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="RSVP Yes"
          value={breakdown.yes}
          caption="Responses"
        />

        <StatCard
          label="RSVP Maybe"
          value={breakdown.maybe}
          caption="Responses"
        />

        <StatCard
          label="RSVP No"
          value={breakdown.no}
          caption="Responses"
        />

        <StatCard
          label="Attended"
          value={
            eventHasStarted
              ? attendedCount
              : "—"
          }
          caption={
            eventHasStarted
              ? "QR check-ins"
              : "Available after the event starts"
          }
        />
      </div>

      <Card>
        <CardHeader title="What these numbers mean" />

        <CardBody className="space-y-3">
          <div className="alert alert-info">
            <Info
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden
            />

            <span>
              RSVP is an intention, not attendance.
              Attendance is produced only by a staff QR
              check-in at the event.
            </span>
          </div>

          <dl className="grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="stat-label">
                Total responses
              </dt>

              <dd className="mt-1 text-sm tabular text-[var(--aurak-navy)]">
                {formatNumber(
                  breakdown.totalResponses
                )}
              </dd>
            </div>

            <div>
              <dt className="stat-label">
                Expected (yes + maybe)
              </dt>

              <dd className="mt-1 text-sm tabular text-[var(--aurak-navy)]">
                {formatNumber(
                  expected
                )}
              </dd>
            </div>

            <div>
              <dt className="stat-label">
                Turnout of expected
              </dt>

              <dd className="mt-1 text-sm tabular text-[var(--aurak-navy)]">
                {eventHasStarted &&
                expected > 0
                  ? formatPercent(
                      attendedCount,
                      expected
                    )
                  : "—"}
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}