import type { EventStatus, ISODate, ISODateTime, TimeString } from "@/lib/types";
import { GALLERY_ACTIVE_MONTHS } from "@/lib/utils/constants";

/* =============================================================================
   Dates and times.

   ISODate values are parsed component-by-component into a LOCAL date. Passing
   "2026-10-14" to new Date() yields UTC midnight, which renders as 13 October
   in any negative-offset timezone. Never do that.
   ========================================================================== */

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "2026-10-14" -> local Date at midnight. */
export function parseISODate(date: ISODate): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Date -> "2026-10-14" */
export function toISODate(date: Date): ISODate {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** "2026-10-14" + "14:30" -> local Date at that moment. */
export function parseEventMoment(date: ISODate, time: TimeString): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const result = parseISODate(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

/* -----------------------------------------------------------------------------
   Display formatting
   -------------------------------------------------------------------------- */

/** "Tue, 14 Oct 2026" */
export function formatEventDate(date: ISODate): string {
  const d = parseISODate(date);
  return `${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${
    MONTHS_SHORT[d.getMonth()]
  } ${d.getFullYear()}`;
}

/** "14 Oct" — for compact cards. */
export function formatShortDate(date: ISODate): string {
  const d = parseISODate(date);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** "14 Oct 2026" */
export function formatMediumDate(date: ISODate): string {
  const d = parseISODate(date);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** "14:30" -> "2:30 PM" */
export function formatTime(time: TimeString): string {
  const [rawHours, rawMinutes] = time.split(":").map(Number);
  const suffix = rawHours >= 12 ? "PM" : "AM";
  const hours = rawHours % 12 === 0 ? 12 : rawHours % 12;
  return `${hours}:${String(rawMinutes).padStart(2, "0")} ${suffix}`;
}

/** "2:30 PM – 5:00 PM" */
export function formatTimeRange(start: TimeString, end: TimeString): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/** Full timestamp -> "14 Oct 2026, 2:30 PM" */
export function formatDateTime(value: ISODateTime): string {
  const d = new Date(value);
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}, ${formatTime(time)}`;
}

/** Timestamp -> "2:30 PM" (check-in times). */
export function formatClockTime(value: ISODateTime): string {
  const d = new Date(value);
  return formatTime(
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  );
}

/**
 * "just now" / "12 minutes ago" / "3 hours ago" / "2 days ago" / a date.
 * Depends on the current time, so use it in client components only.
 */
export function formatRelativeTime(value: ISODateTime): string {
  const then = new Date(value).getTime();
  const minutes = Math.round((Date.now() - then) / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  return formatMediumDate(toISODate(new Date(value)));
}

/* -----------------------------------------------------------------------------
   Comparisons and grouping
   -------------------------------------------------------------------------- */

export function isToday(date: ISODate): boolean {
  return date === todayISO();
}

export function isPastDate(date: ISODate): boolean {
  return parseISODate(date).getTime() < parseISODate(todayISO()).getTime();
}

/** Whole days from today. Negative for past dates. */
export function daysUntil(date: ISODate): number {
  const ms =
    parseISODate(date).getTime() - parseISODate(todayISO()).getTime();
  return Math.round(ms / 86400000);
}

/** Today through the next N days — powers "Events This Week". */
export function isWithinNextDays(date: ISODate, days: number): boolean {
  const diff = daysUntil(date);
  return diff >= 0 && diff <= days;
}

/** "Today" / "Tomorrow" / "In 4 days" / "Tue, 14 Oct 2026" */
export function formatDateProximity(date: ISODate): string {
  const diff = daysUntil(date);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1 && diff <= 6) return `In ${diff} days`;
  return formatEventDate(date);
}

/** Hours until the event starts. Negative once it has begun. */
export function hoursUntilStart(
  date: ISODate,
  startTime: TimeString
): number {
  const start = parseEventMoment(date, startTime).getTime();
  return (start - Date.now()) / 3600000;
}

/**
 * Countdown to an event's start, computed from the clock.
 *
 *   "Starts in 1 minute" / "Starts in 45 minutes" / "Starts in 18 hours"
 *   "Tomorrow"           / "Starts in 3 days"     / "Started"
 *
 * Minutes use Math.ceil so a start that is seconds away never reads
 * "Starts in 0 minutes". Depends on the current time, so use it in client
 * components only.
 */
export function formatCountdown(date: ISODate, startTime: TimeString): string {
  const start = parseEventMoment(date, startTime).getTime();
  const remainingMs = start - Date.now();

  if (remainingMs <= 0) return "Started";

  const minutes = Math.ceil(remainingMs / 60000);
  if (minutes < 60) {
    return `Starts in ${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  /* At least 60 minutes remain, so this can never round down to zero. */
  const hours = Math.max(1, Math.round(minutes / 60));
  if (hours < 24) {
    return `Starts in ${hours} hour${hours === 1 ? "" : "s"}`;
  }

  const days = daysUntil(date);
  if (days === 1) return "Tomorrow";
  if (days > 1) return `Starts in ${days} days`;

  /* Defensive fallback for clock or DST edge cases. */
  return `Starts in ${hours} hours`;
}

/** Sort comparator: earliest event first. */
export function compareByStart(
  a: { date: ISODate; startTime: TimeString },
  b: { date: ISODate; startTime: TimeString }
): number {
  return (
    parseEventMoment(a.date, a.startTime).getTime() -
    parseEventMoment(b.date, b.startTime).getTime()
  );
}

/* -----------------------------------------------------------------------------
   Status derivation
   -------------------------------------------------------------------------- */

/**
 * The single rule for event status.
 *
 * archived and cancelled are explicit decisions and always win. Everything
 * else is derived from the clock so a stored "upcoming" never goes stale.
 */
export function deriveEventStatus(event: {
  date: ISODate;
  startTime: TimeString;
  endTime: TimeString;
  status: EventStatus;
}): EventStatus {
  if (event.status === "archived" || event.status === "cancelled") {
    return event.status;
  }

  const now = Date.now();
  const start = parseEventMoment(event.date, event.startTime).getTime();
  const end = parseEventMoment(event.date, event.endTime).getTime();

  if (now < start) return "upcoming";
  if (now <= end) return "live";
  return "completed";
}

/* -----------------------------------------------------------------------------
   Gallery archiving (mock — no background job exists)
   -------------------------------------------------------------------------- */

export function addMonths(date: ISODate, months: number): ISODate {
  const d = parseISODate(date);
  d.setMonth(d.getMonth() + months);
  return toISODate(d);
}

/** publishedAt + 24 months. */
export function galleryArchiveDate(publishedAt: ISODateTime): ISODate {
  return addMonths(toISODate(new Date(publishedAt)), GALLERY_ACTIVE_MONTHS);
}

/** True once the 24-month window has elapsed. Photos are never deleted. */
export function isGalleryPastArchiveWindow(publishedAt: ISODateTime): boolean {
  return isPastDate(galleryArchiveDate(publishedAt));
}