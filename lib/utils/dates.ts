import type {
  EventStatus,
  ISODate,
  ISODateTime,
  TimeString,
} from "@/lib/types";
import { GALLERY_ACTIVE_MONTHS } from "@/lib/utils/constants";

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function parseISODate(date: ISODate): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toISODate(date: Date): ISODate {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseEventMoment(
  date: ISODate,
  time: TimeString
): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const result = parseISODate(date);

  result.setHours(hours, minutes, 0, 0);

  return result;
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

export function formatEventDate(date: ISODate): string {
  const d = parseISODate(date);

  return `${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${
    MONTHS_SHORT[d.getMonth()]
  } ${d.getFullYear()}`;
}

export function formatShortDate(date: ISODate): string {
  const d = parseISODate(date);

  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function formatMediumDate(date: ISODate): string {
  const d = parseISODate(date);

  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(time: TimeString): string {
  const [rawHours, rawMinutes] = time.split(":").map(Number);
  const suffix = rawHours >= 12 ? "PM" : "AM";
  const hours = rawHours % 12 === 0 ? 12 : rawHours % 12;

  return `${hours}:${String(rawMinutes).padStart(2, "0")} ${suffix}`;
}

export function formatTimeRange(
  start: TimeString,
  end: TimeString
): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function formatDateTime(value: ISODateTime): string {
  const d = new Date(value);

  const time = `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;

  return `${d.getDate()} ${
    MONTHS_SHORT[d.getMonth()]
  } ${d.getFullYear()}, ${formatTime(time)}`;
}

export function formatClockTime(value: ISODateTime): string {
  const d = new Date(value);

  return formatTime(
    `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`
  );
}

export function formatRelativeTime(value: ISODateTime): string {
  const then = new Date(value).getTime();
  const minutes = Math.round((Date.now() - then) / 60000);

  if (minutes < 1) return "just now";

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.round(hours / 24);

  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return formatMediumDate(toISODate(new Date(value)));
}

export function isToday(date: ISODate): boolean {
  return date === todayISO();
}

export function isPastDate(date: ISODate): boolean {
  return (
    parseISODate(date).getTime() <
    parseISODate(todayISO()).getTime()
  );
}

export function daysUntil(date: ISODate): number {
  const ms =
    parseISODate(date).getTime() -
    parseISODate(todayISO()).getTime();

  return Math.round(ms / 86400000);
}

export function isWithinNextDays(
  date: ISODate,
  days: number
): boolean {
  const diff = daysUntil(date);

  return diff >= 0 && diff <= days;
}

export function formatDateProximity(date: ISODate): string {
  const diff = daysUntil(date);

  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1 && diff <= 6) return `In ${diff} days`;

  return formatEventDate(date);
}

export function compareByStart(
  a: {
    date: ISODate;
    startTime: TimeString;
  },
  b: {
    date: ISODate;
    startTime: TimeString;
  }
): number {
  return (
    parseEventMoment(a.date, a.startTime).getTime() -
    parseEventMoment(b.date, b.startTime).getTime()
  );
}

export function deriveEventStatus(event: {
  date: ISODate;
  startTime: TimeString;
  endTime: TimeString;
  status: EventStatus;
}): EventStatus {
  if (
    event.status === "archived" ||
    event.status === "cancelled"
  ) {
    return event.status;
  }

  const now = Date.now();
  const start = parseEventMoment(
    event.date,
    event.startTime
  ).getTime();
  const end = parseEventMoment(
    event.date,
    event.endTime
  ).getTime();

  if (now < start) return "upcoming";
  if (now <= end) return "live";

  return "completed";
}

export function addMonths(
  date: ISODate,
  months: number
): ISODate {
  const d = parseISODate(date);

  d.setMonth(d.getMonth() + months);

  return toISODate(d);
}

export function galleryArchiveDate(
  publishedAt: ISODateTime
): ISODate {
  return addMonths(
    toISODate(new Date(publishedAt)),
    GALLERY_ACTIVE_MONTHS
  );
}

export function isGalleryPastArchiveWindow(
  publishedAt: ISODateTime
): boolean {
  return isPastDate(
    galleryArchiveDate(publishedAt)
  );
}