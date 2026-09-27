import type { MarketingEvent } from "@/lib/types";
import { clone, getDb, simulateLatency } from "@/lib/data/store";
import {
  compareByStart,
  deriveEventStatus,
  hoursUntilStart,
  isToday,
} from "@/lib/utils/dates";

/* =============================================================================
   MARKETING DASHBOARD SERVICE

   Derives the operational view: what needs attention right now, what is next,
   what is happening today, and what changed recently.

   Every value here comes from real records in the mock store. No decorative or
   invented warnings, and no analytics — detailed figures stay inside the event
   detail screen where the admin opens them deliberately.
   ========================================================================== */

export type AttentionSeverity = "high" | "medium" | "low";

export type AttentionKind =
  | "no_staff"
  | "no_driver"
  | "starts_soon"
  | "no_feedback"
  | "no_attendance";

export interface AttentionItem {
  id: string;
  kind: AttentionKind;
  severity: AttentionSeverity;
  eventId: string;
  eventName: string;
  title: string;
  detail: string;
  /** Deep link straight to the tab that resolves the issue. */
  href: string;
}

export type ActivityKind = "event_created" | "registrations" | "feedback";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  /** ISODateTime, used for ordering and relative display. */
  at: string;
  title: string;
  detail: string;
  eventId: string;
  href: string;
}

export interface MarketingDashboardSummary {
  totalEvents: number;
  attention: AttentionItem[];
  /** The single next upcoming event, excluding anything today or live. */
  nextUpcoming: MarketingEvent | null;
  /** Events happening today or currently live. Usually empty or one. */
  todayOrLive: MarketingEvent[];
  recentActivity: ActivityItem[];
  /**
   * Most recent event that actually has registrations — the sensible target
   * for the Reports and CRM quick actions. Null when no event has any.
   */
  reportingEventId: string | null;
}

/** An event starting within this window is flagged as starting soon. */
const SOON_HOURS = 48;

/** Registrations within this window of the latest one count as one batch. */
const ACTIVITY_BATCH_HOURS = 24;

const RECENT_ACTIVITY_LIMIT = 3;

const SEVERITY_ORDER: Record<AttentionSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function countBy<T>(items: T[], key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const id = key(item);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

function eventPath(eventId: string, tab?: string): string {
  return tab
    ? `/marketing/admin/events/${eventId}?tab=${tab}`
    : `/marketing/admin/events/${eventId}`;
}

/**
 * Driver completeness.
 *
 * MarketingEventForm always carries a driver object, so `driver` can be
 * present while holding empty strings. An empty object is NOT an assigned
 * driver. Staff need both a name and a number to be able to call, so a
 * half-filled record counts as incomplete rather than complete.
 */
function driverStatus(
  event: MarketingEvent
): "missing" | "incomplete" | "complete" {
  const name = event.driver?.name.trim() ?? "";
  const phone = event.driver?.phone.trim() ?? "";

  if (!name && !phone) return "missing";
  if (!name || !phone) return "incomplete";
  return "complete";
}

export async function getDashboardSummary(): Promise<MarketingDashboardSummary> {
  await simulateLatency();
  const db = getDb();
  const events = db.marketingEvents;

  const registrationCounts = countBy(
    db.marketingRegistrations,
    (registration) => registration.eventId
  );

  const checkedInCounts = countBy(
    db.marketingAttendance.filter((record) => record.checkedIn),
    (record) => record.eventId
  );

  const feedbackCounts = countBy(
    db.staffFeedback,
    (feedback) => feedback.eventId
  );

  /* ---------------------------------------------------------------------------
     Needs attention
     ------------------------------------------------------------------------ */

  const attention: AttentionItem[] = [];

  for (const event of events) {
    const status = deriveEventStatus(event);
    const registrations = registrationCounts.get(event.id) ?? 0;
    const checkedIn = checkedInCounts.get(event.id) ?? 0;
    const feedback = feedbackCounts.get(event.id) ?? 0;
    const isAhead = status === "upcoming" || status === "live";

    /* No team assigned to an event that is coming up or running. */
    if (isAhead && event.assignedStaff.length === 0) {
      attention.push({
        id: `att-no-staff-${event.id}`,
        kind: "no_staff",
        severity: registrations > 0 ? "high" : "medium",
        eventId: event.id,
        eventName: event.name,
        title: "No staff assigned",
        detail:
          registrations > 0
            ? `${registrations} ${
                registrations === 1 ? "person has" : "people have"
              } registered and nobody is assigned to run it.`
            : "Assign people from Admission, Student Recruitment or the Call Center.",
        href: eventPath(event.id, "team"),
      });
    }

    /* Transport is planned but there is nobody usable to call. */
    if (isAhead && event.departureTime) {
      const driver = driverStatus(event);
      if (driver !== "complete") {
        attention.push({
          id: `att-no-driver-${event.id}`,
          kind: "no_driver",
          severity: "medium",
          eventId: event.id,
          eventName: event.name,
          title:
            driver === "missing"
              ? "Departure time set but no driver"
              : "Driver details incomplete",
          detail:
            driver === "missing"
              ? "Staff will see a departure time with no driver name or phone number."
              : "The driver record is missing either a name or a phone number.",
          href: eventPath(event.id),
        });
      }
    }

    /* Starting soon, so any gap above is now urgent. */
    if (status === "upcoming") {
      const hours = hoursUntilStart(event.date, event.startTime);
      if (hours > 0 && hours <= SOON_HOURS) {
        attention.push({
          id: `att-soon-${event.id}`,
          kind: "starts_soon",
          severity: "medium",
          eventId: event.id,
          eventName: event.name,
          title: "Starts soon",
          detail: `Begins in under ${Math.ceil(
            hours
          )} hours. Confirm the team and transport.`,
          href: eventPath(event.id),
        });
      }
    }

    /* Finished with registrations but nobody was ever checked in. */
    if (status === "completed" && registrations > 0 && checkedIn === 0) {
      attention.push({
        id: `att-no-attendance-${event.id}`,
        kind: "no_attendance",
        severity: "high",
        eventId: event.id,
        eventName: event.name,
        title: "No attendance recorded",
        detail: `${registrations} registered but no check-ins were captured at the event.`,
        href: eventPath(event.id, "registrations"),
      });
    }

    /* Finished, had a team, but nobody reported back. */
    if (
      status === "completed" &&
      event.assignedStaff.length > 0 &&
      feedback === 0
    ) {
      attention.push({
        id: `att-no-feedback-${event.id}`,
        kind: "no_feedback",
        severity: "low",
        eventId: event.id,
        eventName: event.name,
        title: "No staff feedback yet",
        detail: `None of the ${event.assignedStaff.length} assigned staff have left feedback.`,
        href: eventPath(event.id, "feedback"),
      });
    }
  }

  attention.sort((a, b) => {
    const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return a.eventName.localeCompare(b.eventName);
  });

  /* ---------------------------------------------------------------------------
     Today / live, and the single next upcoming event
     ------------------------------------------------------------------------ */

  const todayOrLive = events
    .filter((event) => {
      const status = deriveEventStatus(event);
      if (status === "cancelled" || status === "archived") return false;
      return isToday(event.date) || status === "live";
    })
    .sort(compareByStart);

  const todayOrLiveIds = new Set(todayOrLive.map((event) => event.id));

  const nextUpcoming =
    events
      .filter(
        (event) =>
          deriveEventStatus(event) === "upcoming" &&
          !todayOrLiveIds.has(event.id)
      )
      .sort(compareByStart)[0] ?? null;

  /* ---------------------------------------------------------------------------
     Recent activity — derived from real timestamps only
     ------------------------------------------------------------------------ */

  const activity: ActivityItem[] = [];
  const eventNameById = new Map(events.map((event) => [event.id, event.name]));

  for (const event of events) {
    activity.push({
      id: `act-created-${event.id}`,
      kind: "event_created",
      at: event.createdAt,
      title: "Event created",
      detail: event.name,
      eventId: event.id,
      href: eventPath(event.id),
    });

    /* One entry per event for its most recent burst of registrations. */
    const eventRegistrations = db.marketingRegistrations.filter(
      (registration) => registration.eventId === event.id
    );

    if (eventRegistrations.length > 0) {
      const latest = eventRegistrations.reduce((newest, registration) =>
        registration.registeredAt > newest.registeredAt ? registration : newest
      );

      const cutoff =
        new Date(latest.registeredAt).getTime() -
        ACTIVITY_BATCH_HOURS * 3600000;

      const batch = eventRegistrations.filter(
        (registration) =>
          new Date(registration.registeredAt).getTime() >= cutoff
      ).length;

      activity.push({
        id: `act-reg-${event.id}`,
        kind: "registrations",
        at: latest.registeredAt,
        title: `${batch} new ${batch === 1 ? "registration" : "registrations"}`,
        detail: event.name,
        eventId: event.id,
        href: eventPath(event.id, "registrations"),
      });
    }
  }

  for (const feedback of db.staffFeedback) {
    activity.push({
      id: `act-fb-${feedback.id}`,
      kind: "feedback",
      at: feedback.submittedAt,
      title: "Staff feedback submitted",
      detail: `${feedback.staffName} · ${
        eventNameById.get(feedback.eventId) ?? "Event"
      }`,
      eventId: feedback.eventId,
      href: eventPath(feedback.eventId, "feedback"),
    });
  }

  const recentActivity = activity
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, RECENT_ACTIVITY_LIMIT);

  /* ---------------------------------------------------------------------------
     Reporting target for the Reports / CRM quick actions
     ------------------------------------------------------------------------ */

  const reportingEventId =
    events
      .filter((event) => (registrationCounts.get(event.id) ?? 0) > 0)
      .sort((a, b) => b.date.localeCompare(a.date))[0]?.id ?? null;

  return clone({
    totalEvents: events.length,
    attention,
    nextUpcoming,
    todayOrLive,
    recentActivity,
    reportingEventId,
  });
}