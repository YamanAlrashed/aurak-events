"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Radio,
  Users,
  UserSquare,
} from "lucide-react";
import type { MarketingEvent } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, Card, CardBody, EmptyState, StatCard } from "@/components/ui";
import { DemoDataControls } from "@/components/layout/DemoDataControls";
import { LoadingSection } from "@/components/shared/LoadingSection";
import {
  getDashboardSummary,
  type ActivityItem,
  type AttentionItem,
  type AttentionSeverity,
  type MarketingDashboardSummary,
} from "@/lib/services/marketingDashboardService";
import {
  EMIRATE_LABELS,
  MARKETING_EVENT_TYPE_LABELS,
} from "@/lib/data/marketing-reference";
import {
  formatCountdown,
  formatEventDate,
  formatRelativeTime,
  formatTime,
  formatTimeRange,
} from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

/* =============================================================================
   Marketing Admin dashboard.

   Deliberately operational: it answers "what needs attention right now".
   Detailed figures — students, visitors, attendance, CRM and analytics — live
   inside each event, where the admin opens them on purpose.
   ========================================================================== */

const ATTENTION_VISIBLE = 5;

/** The countdown re-renders on this interval. No data is refetched. */
const COUNTDOWN_REFRESH_MS = 60000;

const SEVERITY_STYLE: Record<
  AttentionSeverity,
  { dot: string; label: string }
> = {
  high: { dot: "bg-[var(--aurak-danger)]", label: "Urgent" },
  medium: { dot: "bg-[var(--aurak-warning)]", label: "Soon" },
  low: { dot: "bg-[var(--aurak-text-subtle)]", label: "Later" },
};

const ACTIVITY_ICON: Record<ActivityItem["kind"], React.ReactNode> = {
  event_created: <CalendarPlus className="h-4 w-4" />,
  registrations: <Users className="h-4 w-4" />,
  feedback: <CheckCircle2 className="h-4 w-4" />,
};

/* -----------------------------------------------------------------------------
   Quick actions
   -------------------------------------------------------------------------- */

function QuickAction({
  href,
  label,
  description,
  icon,
  disabledReason,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  /** When set, the action renders inert rather than linking nowhere. */
  disabledReason?: string;
}) {
  const body = (
    <>
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          disabledReason
            ? "bg-[var(--aurak-bg-sunken)] text-[var(--aurak-text-subtle)]"
            : "bg-[var(--aurak-brand-soft)] text-[var(--aurak-brand)]"
        )}
        aria-hidden
      >
        {icon}
      </span>

      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[var(--aurak-navy)]">
          {label}
        </span>

        <span className="block text-xs text-[var(--aurak-text-muted)]">
          {disabledReason ?? description}
        </span>
      </span>
    </>
  );

  if (disabledReason) {
    return (
      <div
        className="card flex cursor-not-allowed items-center gap-3 p-4 opacity-60"
        aria-disabled="true"
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="card card-interactive flex items-center gap-3 p-4"
    >
      {body}
    </Link>
  );
}

/* -----------------------------------------------------------------------------
   Compact event row for the today / live section
   -------------------------------------------------------------------------- */

function CompactEventRow({ event }: { event: MarketingEvent }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--aurak-radius)] border border-[var(--aurak-line)] bg-white p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--aurak-navy)]">
          {event.name}
        </p>

        <p className="mt-0.5 truncate text-xs text-[var(--aurak-text-muted)]">
          {formatTimeRange(event.startTime, event.endTime)} ·{" "}
          {event.location.venueName}, {EMIRATE_LABELS[event.location.emirate]}
        </p>

        <p className="mt-0.5 text-xs text-[var(--aurak-text-muted)]">
          {event.assignedStaff.length}{" "}
          {event.assignedStaff.length === 1 ? "staff member" : "staff assigned"}
        </p>
      </div>

      <Link
        href={`/marketing/admin/events/${event.id}`}
        className="btn btn-primary btn-sm shrink-0"
      >
        Open Event
      </Link>
    </div>
  );
}

/* -----------------------------------------------------------------------------
   Attention row
   -------------------------------------------------------------------------- */

function AttentionRow({ item }: { item: AttentionItem }) {
  const style = SEVERITY_STYLE[item.severity];

  return (
    <li>
      <Link
        href={item.href}
        className="flex items-start gap-3 rounded-[var(--aurak-radius)] px-2 py-2.5 transition-colors hover:bg-[var(--aurak-bg-subtle)]"
      >
        <span
          className={cn(
            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
            style.dot
          )}
          aria-hidden
        />

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-medium text-[var(--aurak-navy)]">
              {item.title}
            </span>

            <span className="truncate text-xs text-[var(--aurak-text-muted)]">
              {item.eventName}
            </span>
          </span>

          <span className="mt-0.5 block text-xs text-[var(--aurak-text-muted)]">
            {item.detail}
          </span>
        </span>

        <ChevronRight
          className="mt-1 h-4 w-4 shrink-0 text-[var(--aurak-text-subtle)]"
          aria-hidden
        />

        <span className="sr-only">{style.label}</span>
      </Link>
    </li>
  );
}

/* =============================================================================
   Page
   ========================================================================== */

export default function MarketingAdminDashboardPage() {
  const [summary, setSummary] =
    useState<MarketingDashboardSummary | null>(null);

  const [loading, setLoading] = useState(true);

  const [countdown, setCountdown] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setSummary(await getDashboardSummary());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /* Primitives so the timer restarts only when the target event changes. */
  const nextDate =
    summary?.nextUpcoming?.date ?? null;

  const nextStartTime =
    summary?.nextUpcoming?.startTime ?? null;

  /*
    Recalculates the countdown text once a minute while the page is open.
    Only this string is updated — no dashboard data is refetched.
  */
  useEffect(() => {
    if (!nextDate || !nextStartTime) {
      setCountdown("");
      return;
    }

    const recalculate = () =>
      setCountdown(
        formatCountdown(nextDate, nextStartTime)
      );

    recalculate();

    const timer = window.setInterval(
      recalculate,
      COUNTDOWN_REFRESH_MS
    );

    return () =>
      window.clearInterval(timer);
  }, [nextDate, nextStartTime]);

  if (loading || !summary) {
    return (
      <div className="page space-y-6">
        <PageHeader title="Dashboard" />
        <LoadingSection rows={3} />
      </div>
    );
  }

  const { reportingEventId } = summary;

  const noReportingTarget =
    reportingEventId === null
      ? "No event has registrations yet"
      : undefined;

  const visibleAttention =
    summary.attention.slice(
      0,
      ATTENTION_VISIBLE
    );

  const hiddenAttention =
    summary.attention.length -
    visibleAttention.length;

  return (
    <div className="page space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="What needs your attention right now."
        actions={
          <Link
            href="/marketing/admin/events/new"
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Link>
        }
      />

      {/* ---------- A. Total events ---------- */}
      <div className="max-w-[16rem]">
        <StatCard
          label="Total Events"
          value={summary.totalEvents}
          icon={
            <CalendarDays className="h-4 w-4" />
          }
        />
      </div>

      {/* ---------- B. Quick actions ---------- */}
      <section className="space-y-3">
        <h2 className="section-title">
          Quick Actions
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction
            href="/marketing/admin/events/new"
            label="Create Event"
            description="Add a new recruitment event"
            icon={
              <Plus className="h-4 w-4" />
            }
          />

          <QuickAction
            href="/marketing/admin/events"
            label="View Events"
            description="Browse and filter all events"
            icon={
              <CalendarDays className="h-4 w-4" />
            }
          />

          <QuickAction
            href={`/marketing/admin/events/${reportingEventId}?tab=analytics`}
            label="View Reports"
            description="Open analytics for the latest event with registrations"
            icon={
              <BarChart3 className="h-4 w-4" />
            }
            disabledReason={
              noReportingTarget
            }
          />

          <QuickAction
            href={`/marketing/admin/events/${reportingEventId}?tab=crm`}
            label="Open CRM"
            description="Open CRM for the latest event with registrations"
            icon={
              <UserSquare className="h-4 w-4" />
            }
            disabledReason={
              noReportingTarget
            }
          />
        </div>
      </section>

      {/* ---------- C. Needs attention ---------- */}
      <section className="space-y-3">
        <h2 className="section-title flex items-center gap-2">
          <AlertTriangle
            className="h-4 w-4 text-[var(--aurak-warning)]"
            aria-hidden
          />
          Needs Attention
        </h2>

        <Card>
          <CardBody>
            {summary.attention.length === 0 ? (
              <p className="meta-text">
                No items need attention.
              </p>
            ) : (
              <>
                <ul className="divide-y divide-[var(--aurak-line)]">
                  {visibleAttention.map(
                    (item) => (
                      <AttentionRow
                        key={item.id}
                        item={item}
                      />
                    )
                  )}
                </ul>

                {hiddenAttention > 0 && (
                  <p className="field-hint mt-3">
                    {hiddenAttention} more{" "}
                    {hiddenAttention === 1
                      ? "item"
                      : "items"}{" "}
                    need attention. Open an event
                    to review it.
                  </p>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </section>

      {/* ---------- D. Next upcoming event ---------- */}
      <section className="space-y-3">
        <h2 className="section-title">
          Next Upcoming Event
        </h2>

        {summary.nextUpcoming === null ? (
          <Card>
            <EmptyState
              icon={
                <CalendarDays className="h-6 w-6" />
              }
              title="No upcoming events"
              description="Create an event to get started."
              action={
                <Link
                  href="/marketing/admin/events/new"
                  className="btn btn-primary btn-sm"
                >
                  Create Event
                </Link>
              }
            />
          </Card>
        ) : (
          <Card>
            <CardBody className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-[var(--aurak-navy)]">
                    {
                      summary.nextUpcoming
                        .name
                    }
                  </h3>

                  <Badge
                    variant="brand"
                    className="mt-1.5"
                  >
                    {
                      MARKETING_EVENT_TYPE_LABELS[
                        summary
                          .nextUpcoming.type
                      ]
                    }
                  </Badge>
                </div>

                {countdown !== "" && (
                  <span className="badge badge-upcoming shrink-0">
                    <Clock
                      className="h-3 w-3"
                      aria-hidden
                    />
                    {countdown}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-sm text-[var(--aurak-text-muted)]">
                <p className="flex items-center gap-2">
                  <CalendarDays
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden
                  />

                  <span className="truncate">
                    {formatEventDate(
                      summary.nextUpcoming
                        .date
                    )}{" "}
                    · starts{" "}
                    {formatTime(
                      summary.nextUpcoming
                        .startTime
                    )}
                  </span>
                </p>

                <p className="flex items-center gap-2">
                  <MapPin
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden
                  />

                  <span className="truncate">
                    {
                      summary.nextUpcoming
                        .location.venueName
                    }
                    ,{" "}
                    {
                      EMIRATE_LABELS[
                        summary
                          .nextUpcoming
                          .location.emirate
                      ]
                    }
                  </span>
                </p>

                <p className="flex items-center gap-2">
                  <Users
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden
                  />

                  <span>
                    {
                      summary.nextUpcoming
                        .assignedStaff
                        .length
                    }{" "}
                    {summary
                      .nextUpcoming
                      .assignedStaff
                      .length === 1
                      ? "staff member assigned"
                      : "staff assigned"}
                  </span>
                </p>
              </div>

              <Link
                href={`/marketing/admin/events/${summary.nextUpcoming.id}`}
                className="btn btn-primary btn-sm w-full sm:w-auto"
              >
                Open Event
              </Link>
            </CardBody>
          </Card>
        )}
      </section>

      {/* ---------- E. Today / live ---------- */}
      {summary.todayOrLive.length > 0 && (
        <section className="space-y-3">
          <h2 className="section-title flex items-center gap-2">
            <Radio
              className="h-4 w-4 text-[var(--aurak-live)]"
              aria-hidden
            />
            Today
          </h2>

          <div className="space-y-2">
            {summary.todayOrLive.map(
              (event) => (
                <CompactEventRow
                  key={event.id}
                  event={event}
                />
              )
            )}
          </div>
        </section>
      )}

      {/* ---------- F. Recent activity ---------- */}
      <section className="space-y-3">
        <h2 className="section-title">
          Recent Activity
        </h2>

        <Card>
          <CardBody>
            {summary.recentActivity
              .length === 0 ? (
              <p className="meta-text">
                No activity yet.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--aurak-line)]">
                {summary.recentActivity.map(
                  (item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 rounded-[var(--aurak-radius)] px-2 py-2.5 transition-colors hover:bg-[var(--aurak-bg-subtle)]"
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--aurak-bg-sunken)] text-[var(--aurak-text-muted)]"
                          aria-hidden
                        >
                          {
                            ACTIVITY_ICON[
                              item.kind
                            ]
                          }
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-[var(--aurak-navy)]">
                            {item.title}
                          </span>

                          <span className="block truncate text-xs text-[var(--aurak-text-muted)]">
                            {item.detail}
                          </span>
                        </span>

                        <span className="shrink-0 text-xs text-[var(--aurak-text-subtle)]">
                          {formatRelativeTime(
                            item.at
                          )}
                        </span>
                      </Link>
                    </li>
                  )
                )}
              </ul>
            )}
          </CardBody>
        </Card>
      </section>

      {/* Prototype utility */}
      <div className="pt-2">
        <div className="divider mb-4" />

        <details>
          <summary className="cursor-pointer text-xs font-medium text-[var(--aurak-text-muted)] transition-colors hover:text-[var(--aurak-navy)]">
            Prototype tools
          </summary>

          <div className="mt-3">
            <DemoDataControls />
          </div>
        </details>
      </div>
    </div>
  );
}