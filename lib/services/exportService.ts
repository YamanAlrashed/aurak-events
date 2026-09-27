import { getDb, simulateLatency } from "@/lib/data/store";
import { getCampusUserSummary } from "@/lib/data/campus-users";
import { CAMPUS_USER_TYPE_LABELS } from "@/lib/data/campus-reference";
import {
  EMIRATE_LABELS,
  getIntakeLabel,
  getProgramOfInterestName,
} from "@/lib/data/marketing-reference";
import { CRM_STATUS_LABELS, RSVP_LABELS } from "@/lib/utils/constants";
import { formatDateTime } from "@/lib/utils/dates";
import type { RegistrationType } from "@/lib/types";

/* =============================================================================
   EXPORT SERVICE

   Builds a CSV in the browser from the mock store and hands it to the user as
   a download. Genuinely frontend-only — no server, no Excel library.

   EMPTY EXPORTS NEVER DOWNLOAD. Every function builds its rows first and
   returns { fileName, rowCount: 0 } without touching the browser when there is
   nothing to write, so the caller can explain the outcome instead of handing
   the user a file containing only a header line.

   Later, a real implementation calls an endpoint that returns a file; the
   screens keep calling these same functions unchanged.
   ========================================================================== */

type CsvValue = string | number | boolean | null | undefined;

function escapeCell(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) lines.push(row.map(escapeCell).join(","));
  return lines.join("\r\n");
}

function safeFileName(value: string): string {
  return value
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function download(fileName: string, csv: string): void {
  if (typeof window === "undefined") return;

  /* BOM so Excel opens UTF-8 names correctly. */
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ExportResult {
  fileName: string;
  rowCount: number;
}

/* -----------------------------------------------------------------------------
   Campus Events

   One row per attendee record. RSVP and attendance are separate columns and
   are never combined into a single "attendance" figure.
   -------------------------------------------------------------------------- */

export async function exportCampusEvent(
  eventId: string
): Promise<ExportResult> {
  await simulateLatency(900);
  const db = getDb();
  const event = db.campusEvents.find((item) => item.id === eventId);
  if (!event) throw new Error("Event not found.");

  const userIds = new Set<string>();

  db.campusRsvps
    .filter((item) => item.eventId === eventId)
    .forEach((item) => userIds.add(item.userId));

  db.campusAttendance
    .filter((item) => item.eventId === eventId)
    .forEach((item) => userIds.add(item.userId));

  const rows: CsvValue[][] = [];

  for (const userId of userIds) {
    const summary = getCampusUserSummary(userId);
    if (!summary) continue;

    const rsvp = db.campusRsvps.find(
      (item) => item.eventId === eventId && item.userId === userId
    );

    const attendance = db.campusAttendance.find(
      (item) => item.eventId === eventId && item.userId === userId
    );

    rows.push([
      summary.fullName,
      summary.eumsId,
      CAMPUS_USER_TYPE_LABELS[summary.userType],
      summary.collegeName ?? "",
      summary.departmentName ?? "",
      summary.programName ?? "",
      rsvp ? RSVP_LABELS[rsvp.status] : "No response",
      attendance?.checkedIn ? "Yes" : "No",
      attendance?.checkedInAt ?? "",
    ]);
  }

  rows.sort((a, b) => String(a[0]).localeCompare(String(b[0])));

  const headers = [
    "Name",
    "University ID",
    "User Type",
    "College",
    "Department",
    "Program",
    "RSVP",
    "Checked In",
    "Check-in Time",
  ];

  const fileName = `aurak-campus-${safeFileName(event.name)}-${event.date}.csv`;

  /* Nothing to write — report it rather than downloading an empty file. */
  if (rows.length === 0) {
    return { fileName, rowCount: 0 };
  }

  download(fileName, toCsv(headers, rows));

  return { fileName, rowCount: rows.length };
}

/* -----------------------------------------------------------------------------
   Marketing

   Export wording for registration type. Kept local to this file so the UI
   badges (REGISTRATION_TYPE_LABELS) are unaffected.
   -------------------------------------------------------------------------- */

const REGISTRATION_TYPE_EXPORT_LABELS: Record<RegistrationType, string> = {
  pre_registered: "Pre-registration",
  walk_in: "Walk-in",
};

/**
 * Main registration export — one row per prospect.
 *
 * Visitors are deliberately NOT included. A visitor count belongs to an
 * attendance record and describes how many people arrived together; placing it
 * on a prospect row would invite adding it to the prospect total. Visitor
 * figures live on the event detail screen and analytics instead.
 *
 * Event attribution is the file itself (one export per event) and stays
 * separate from the CRM Status column.
 */
export async function exportMarketingEvent(
  eventId: string
): Promise<ExportResult> {
  await simulateLatency(900);
  const db = getDb();
  const event = db.marketingEvents.find((item) => item.id === eventId);
  if (!event) throw new Error("Event not found.");

  const registrations = db.marketingRegistrations.filter(
    (item) => item.eventId === eventId
  );

  const rows: CsvValue[][] = registrations.map((registration) => {
    const registrant = db.marketingRegistrants.find(
      (item) => item.id === registration.registrantId
    );

    const attendance = db.marketingAttendance.find(
      (item) => item.registrationId === registration.id
    );

    /* Blank when the person never checked in. */
    const checkInTime =
      attendance?.checkedIn && attendance.checkedInAt
        ? formatDateTime(attendance.checkedInAt)
        : "";

    return [
      registrant?.fullName ?? "",
      registrant?.phone ?? "",
      registrant?.email ?? "",
      getProgramOfInterestName(registrant?.programOfInterestId),
      getIntakeLabel(registrant?.intakeId),
      registrant ? EMIRATE_LABELS[registrant.emirate] : "",
      REGISTRATION_TYPE_EXPORT_LABELS[registration.registrationType],
      CRM_STATUS_LABELS[registration.crmStatus],
      checkInTime,
    ];
  });

  rows.sort((a, b) => String(a[0]).localeCompare(String(b[0])));

  const headers = [
    "Name",
    "Phone",
    "Email",
    "Program",
    "Intake",
    "Emirate",
    "Registration Type",
    "CRM Status",
    "Check-in Time",
  ];

  const fileName = `aurak-marketing-${safeFileName(event.name)}-${event.date}.csv`;

  /* Nothing to write — report it rather than downloading an empty file. */
  if (rows.length === 0) {
    return { fileName, rowCount: 0 };
  }

  download(fileName, toCsv(headers, rows));

  return { fileName, rowCount: rows.length };
}

/**
 * Pre-registered prospects who did not attend.
 *
 * Filter, stated exactly:
 *   registrationType === "pre_registered"
 *   AND there is no attendance record with checkedIn === true
 *
 * Walk-ins are excluded by definition — they were physically present.
 * Checked-in pre-registrations are excluded because they attended.
 */
export async function exportPreRegisteredNoShows(
  eventId: string
): Promise<ExportResult> {
  await simulateLatency(900);
  const db = getDb();
  const event = db.marketingEvents.find((item) => item.id === eventId);
  if (!event) throw new Error("Event not found.");

  const noShows = db.marketingRegistrations.filter((registration) => {
    if (registration.eventId !== eventId) return false;
    if (registration.registrationType !== "pre_registered") return false;

    const attendance = db.marketingAttendance.find(
      (item) => item.registrationId === registration.id
    );

    return !attendance?.checkedIn;
  });

  const rows: CsvValue[][] = noShows.map((registration) => {
    const registrant = db.marketingRegistrants.find(
      (item) => item.id === registration.registrantId
    );

    return [
      registrant?.fullName ?? "",
      registrant?.phone ?? "",
      registrant?.email ?? "",
      getProgramOfInterestName(registrant?.programOfInterestId),
      getIntakeLabel(registrant?.intakeId),
    ];
  });

  rows.sort((a, b) => String(a[0]).localeCompare(String(b[0])));

  const headers = [
    "Name",
    "Phone",
    "Email",
    "Program of Interest",
    "Intake",
  ];

  const fileName = `aurak-marketing-no-shows-${safeFileName(event.name)}-${
    event.date
  }.csv`;

  /* Nothing to write — report it rather than downloading an empty file. */
  if (rows.length === 0) {
    return { fileName, rowCount: 0 };
  }

  download(fileName, toCsv(headers, rows));

  return { fileName, rowCount: rows.length };
}