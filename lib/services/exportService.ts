import {
  getDb,
  simulateLatency,
} from "@/lib/data/store";
import { getCampusUserSummary } from "@/lib/data/campus-users";
import { CAMPUS_USER_TYPE_LABELS } from "@/lib/data/campus-reference";
import {
  EMIRATE_LABELS,
  getIntakeLabel,
  getProgramOfInterestName,
} from "@/lib/data/marketing-reference";
import {
  CRM_STATUS_LABELS,
  REGISTRATION_TYPE_LABELS,
  RSVP_LABELS,
} from "@/lib/utils/constants";

type CsvValue =
  | string
  | number
  | boolean
  | null
  | undefined;

function escapeCell(
  value: CsvValue
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const text =
    String(value);

  if (
    /[",\n\r]/.test(text)
  ) {
    return `"${text.replace(
      /"/g,
      '""'
    )}"`;
  }

  return text;
}

function toCsv(
  headers: string[],
  rows: CsvValue[][]
): string {
  const lines = [
    headers
      .map(escapeCell)
      .join(","),
  ];

  for (
    const row
    of rows
  ) {
    lines.push(
      row
        .map(escapeCell)
        .join(",")
    );
  }

  return lines.join(
    "\r\n"
  );
}

function safeFileName(
  value: string
): string {
  return value
    .replace(
      /[^a-z0-9]+/gi,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
    .toLowerCase();
}

function download(
  fileName: string,
  csv: string
): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  const blob =
    new Blob(
      [`\uFEFF${csv}`],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href = url;

  link.download =
    fileName;

  document.body.appendChild(
    link
  );

  link.click();

  document.body.removeChild(
    link
  );

  URL.revokeObjectURL(
    url
  );
}

export interface ExportResult {
  fileName: string;
  rowCount: number;
}

export async function exportCampusEvent(
  eventId: string
): Promise<ExportResult> {
  await simulateLatency(
    900
  );

  const db = getDb();

  const event =
    db.campusEvents.find(
      (item) =>
        item.id ===
        eventId
    );

  if (!event) {
    throw new Error(
      "Event not found."
    );
  }

  const userIds =
    new Set<string>();

  db.campusRsvps
    .filter(
      (item) =>
        item.eventId ===
        eventId
    )
    .forEach((item) =>
      userIds.add(
        item.userId
      )
    );

  db.campusAttendance
    .filter(
      (item) =>
        item.eventId ===
        eventId
    )
    .forEach((item) =>
      userIds.add(
        item.userId
      )
    );

  const rows:
    CsvValue[][] = [];

  for (
    const userId
    of userIds
  ) {
    const summary =
      getCampusUserSummary(
        userId
      );

    if (!summary) {
      continue;
    }

    const rsvp =
      db.campusRsvps.find(
        (item) =>
          item.eventId ===
            eventId &&
          item.userId ===
            userId
      );

    const attendance =
      db.campusAttendance.find(
        (item) =>
          item.eventId ===
            eventId &&
          item.userId ===
            userId
      );

    rows.push([
      summary.fullName,

      summary.eumsId,

      CAMPUS_USER_TYPE_LABELS[
        summary.userType
      ],

      summary.collegeName ??
        "",

      summary.departmentName ??
        "",

      summary.programName ??
        "",

      rsvp
        ? RSVP_LABELS[
            rsvp.status
          ]
        : "No response",

      attendance?.checkedIn
        ? "Yes"
        : "No",

      attendance
        ?.checkedInAt ??
        "",
    ]);
  }

  rows.sort(
    (a, b) =>
      String(a[0]).localeCompare(
        String(b[0])
      )
  );

  const csv =
    toCsv(
      [
        "Name",
        "University ID",
        "User Type",
        "College",
        "Department",
        "Program",
        "RSVP",
        "Checked In",
        "Check-in Time",
      ],
      rows
    );

  const fileName =
    `aurak-campus-${safeFileName(
      event.name
    )}-${event.date}.csv`;

  download(
    fileName,
    csv
  );

  return {
    fileName,
    rowCount:
      rows.length,
  };
}

export async function exportMarketingEvent(
  eventId: string
): Promise<ExportResult> {
  await simulateLatency(
    900
  );

  const db = getDb();

  const event =
    db.marketingEvents.find(
      (item) =>
        item.id ===
        eventId
    );

  if (!event) {
    throw new Error(
      "Event not found."
    );
  }

  const registrations =
    db.marketingRegistrations.filter(
      (item) =>
        item.eventId ===
        eventId
    );

  const rows:
    CsvValue[][] =
    registrations.map(
      (registration) => {
        const registrant =
          db.marketingRegistrants.find(
            (item) =>
              item.id ===
              registration.registrantId
          );

        const attendance =
          db.marketingAttendance.find(
            (item) =>
              item.registrationId ===
              registration.id
          );

        return [
          registrant
            ?.fullName ?? "",

          registrant
            ?.phone ?? "",

          registrant
            ?.email ?? "",

          getProgramOfInterestName(
            registrant
              ?.programOfInterestId
          ),

          getIntakeLabel(
            registrant
              ?.intakeId
          ),

          registrant
            ? EMIRATE_LABELS[
                registrant.emirate
              ]
            : "",

          REGISTRATION_TYPE_LABELS[
            registration
              .registrationType
          ],

          CRM_STATUS_LABELS[
            registration
              .crmStatus
          ],

          registration
            .registeredAt,

          attendance?.checkedIn
            ? "Yes"
            : "No",

          attendance
            ?.checkedInAt ??
            "",

          attendance?.checkedIn
            ? attendance.visitorCount
            : 0,
        ];
      }
    );

  rows.sort(
    (a, b) =>
      String(a[0]).localeCompare(
        String(b[0])
      )
  );

  const csv =
    toCsv(
      [
        "Full Name",
        "Phone",
        "Email",
        "Program of Interest",
        "Intake",
        "Emirate",
        "Registration Type",
        "CRM Status",
        "Registered At",
        "Attended",
        "Check-in Time",
        "Visitors (incl. prospect)",
      ],
      rows
    );

  const fileName =
    `aurak-marketing-${safeFileName(
      event.name
    )}-${event.date}.csv`;

  download(
    fileName,
    csv
  );

  return {
    fileName,
    rowCount:
      rows.length,
  };
}