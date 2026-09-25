import type {
  CampusAttendance,
  CampusAttendeeRow,
  CampusScanResult,
  CampusUserSummary,
  RSVPStatus,
} from "@/lib/types";
import {
  clone,
  getDb,
  mutate,
  simulateLatency,
} from "@/lib/data/store";
import {
  getCampusUserSummary,
  toCampusUserSummary,
  CAMPUS_USERS,
} from "@/lib/data/campus-users";

export async function getAttendedCount(
  eventId: string
): Promise<number> {
  await simulateLatency(
    100
  );

  return getDb()
    .campusAttendance.filter(
      (item) =>
        item.eventId ===
          eventId &&
        item.checkedIn
    ).length;
}

export async function getAttendedCounts(
  eventIds: string[]
): Promise<
  Record<string, number>
> {
  await simulateLatency(
    100
  );

  const result: Record<
    string,
    number
  > = {};

  for (
    const eventId
    of eventIds
  ) {
    result[eventId] =
      getDb()
        .campusAttendance.filter(
          (item) =>
            item.eventId ===
              eventId &&
            item.checkedIn
        ).length;
  }

  return result;
}

export async function getAttendanceForUser(
  eventId: string,
  userId: string
): Promise<
  CampusAttendance | null
> {
  await simulateLatency(
    100
  );

  const record =
    getDb().campusAttendance.find(
      (item) =>
        item.eventId ===
          eventId &&
        item.userId ===
          userId
    );

  return record
    ? clone(record)
    : null;
}

export async function getAttendedEventIds(
  userId: string
): Promise<string[]> {
  await simulateLatency(
    120
  );

  return getDb()
    .campusAttendance.filter(
      (item) =>
        item.userId ===
          userId &&
        item.checkedIn
    )
    .map(
      (item) =>
        item.eventId
    );
}

export interface AttendeeFilter {
  search?: string;

  state?:
    | "all"
    | "checked_in"
    | "not_checked_in";
}

export async function listAttendees(
  eventId: string,
  filter: AttendeeFilter = {}
): Promise<
  CampusAttendeeRow[]
> {
  await simulateLatency();

  const db = getDb();

  const {
    search = "",
    state = "all",
  } = filter;

  const needle = search
    .trim()
    .toLowerCase();

  const userIds =
    new Set<string>();

  db.campusRsvps
    .filter(
      (item) =>
        item.eventId ===
          eventId &&
        item.status !== "no"
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
    CampusAttendeeRow[] =
    [];

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

    const checkedIn =
      Boolean(
        attendance
          ?.checkedIn
      );

    if (
      state ===
        "checked_in" &&
      !checkedIn
    ) {
      continue;
    }

    if (
      state ===
        "not_checked_in" &&
      checkedIn
    ) {
      continue;
    }

    if (
      needle &&
      !summary.fullName
        .toLowerCase()
        .includes(needle) &&
      !summary.eumsId
        .toLowerCase()
        .includes(needle)
    ) {
      continue;
    }

    rows.push({
      user: summary,

      rsvpStatus:
        (rsvp?.status as
          | RSVPStatus
          | undefined) ??
        null,

      checkedIn,

      checkedInAt:
        attendance
          ?.checkedInAt ??
        null,
    });
  }

  return rows.sort(
    (a, b) => {
      if (
        a.checkedIn !==
        b.checkedIn
      ) {
        return a.checkedIn
          ? -1
          : 1;
      }

      return a.user.fullName.localeCompare(
        b.user.fullName
      );
    }
  );
}

export async function scanCode(
  eventId: string,
  scannedValue: string
): Promise<CampusScanResult> {
  await simulateLatency(
    400
  );

  const db = getDb();

  const normalised =
    scannedValue
      .trim()
      .toUpperCase();

  const ticket =
    db.campusTickets.find(
      (item) =>
        item.qrCode
          .toUpperCase() ===
        normalised
    );

  if (!ticket) {
    return {
      outcome:
        "invalid_code",

      scannedValue,
    };
  }

  if (
    ticket.eventId !==
    eventId
  ) {
    const otherEvent =
      db.campusEvents.find(
        (item) =>
          item.id ===
          ticket.eventId
      );

    return {
      outcome:
        "wrong_event",

      scannedValue,

      belongsToEventName:
        otherEvent?.name ??
        "another event",
    };
  }

  const summary =
    getCampusUserSummary(
      ticket.userId
    );

  if (!summary) {
    return {
      outcome:
        "invalid_code",
      scannedValue,
    };
  }

  const rsvp =
    db.campusRsvps.find(
      (item) =>
        item.eventId ===
          eventId &&
        item.userId ===
          ticket.userId
    );

  const rsvpStatus =
    (rsvp?.status as
      | RSVPStatus
      | undefined) ??
    null;

  const attendance =
    db.campusAttendance.find(
      (item) =>
        item.eventId ===
          eventId &&
        item.userId ===
          ticket.userId
    );

  if (
    attendance
      ?.checkedIn &&
    attendance.checkedInAt
  ) {
    return {
      outcome:
        "already_checked_in",

      user: summary,

      rsvpStatus,

      checkedInAt:
        attendance.checkedInAt,
    };
  }

  return {
    outcome:
      "ready_to_check_in",

    user: summary,

    rsvpStatus,
  };
}

export async function searchAttendeesByName(
  eventId: string,
  query: string
): Promise<
  CampusAttendeeRow[]
> {
  await simulateLatency(
    200
  );

  if (!query.trim()) {
    return [];
  }

  return listAttendees(
    eventId,
    {
      search: query,
    }
  );
}

export async function checkIn(
  eventId: string,
  userId: string,
  staffAccountId: string,
  method:
    | "qr"
    | "manual" = "qr"
): Promise<
  | {
      ok: true;
      attendance:
        CampusAttendance;
      user:
        CampusUserSummary;
    }
  | {
      ok: false;
      reason:
        "already_checked_in";
      checkedInAt:
        string;
    }
  | {
      ok: false;
      reason:
        "unknown_user";
    }
> {
  await simulateLatency(
    300
  );

  const summary =
    getCampusUserSummary(
      userId
    );

  if (!summary) {
    return {
      ok: false,
      reason:
        "unknown_user",
    };
  }

  const existing =
    getDb().campusAttendance.find(
      (item) =>
        item.eventId ===
          eventId &&
        item.userId ===
          userId
    );

  if (
    existing
      ?.checkedIn &&
    existing.checkedInAt
  ) {
    return {
      ok: false,

      reason:
        "already_checked_in",

      checkedInAt:
        existing.checkedInAt,
    };
  }

  const now =
    new Date().toISOString();

  const attendance =
    mutate((db) => {
      const record =
        db.campusAttendance.find(
          (item) =>
            item.eventId ===
              eventId &&
            item.userId ===
              userId
        );

      if (record) {
        record.checkedIn =
          true;

        record.checkedInAt =
          now;

        record.checkedInByStaffId =
          staffAccountId;

        record.method =
          method;

        return record;
      }

      const created:
        CampusAttendance =
        {
          id: `att-${eventId}-${userId}`,
          eventId,
          userId,

          checkedIn:
            true,

          checkedInAt:
            now,

          checkedInByStaffId:
            staffAccountId,

          method,
        };

      db.campusAttendance.push(
        created
      );

      return created;
    });

  return {
    ok: true,

    attendance:
      clone(attendance),

    user: summary,
  };
}

export async function getScanSamples(
  eventId: string
): Promise<
  Array<{
    code: string;
    label: string;
    hint: string;
  }>
> {
  await simulateLatency(
    120
  );

  const db = getDb();

  const tickets =
    db.campusTickets.filter(
      (item) =>
        item.eventId ===
        eventId
    );

  const samples: Array<{
    code: string;
    label: string;
    hint: string;
  }> = [];

  const pending =
    tickets.find(
      (ticket) => {
        const attendance =
          db.campusAttendance.find(
            (item) =>
              item.eventId ===
                eventId &&
              item.userId ===
                ticket.userId
          );

        return !attendance
          ?.checkedIn;
      }
    );

  const done =
    tickets.find(
      (ticket) => {
        const attendance =
          db.campusAttendance.find(
            (item) =>
              item.eventId ===
                eventId &&
              item.userId ===
                ticket.userId
          );

        return attendance
          ?.checkedIn;
      }
    );

  if (pending) {
    const user =
      CAMPUS_USERS.find(
        (item) =>
          item.id ===
          pending.userId
      );

    if (user) {
      samples.push({
        code:
          pending.qrCode,

        label:
          toCampusUserSummary(
            user
          ).fullName,

        hint:
          "Not checked in yet",
      });
    }
  }

  if (done) {
    const user =
      CAMPUS_USERS.find(
        (item) =>
          item.id ===
          done.userId
      );

    if (user) {
      samples.push({
        code:
          done.qrCode,

        label:
          toCampusUserSummary(
            user
          ).fullName,

        hint:
          "Already checked in — duplicate scan",
      });
    }
  }

  samples.push({
    code:
      "AURAK-CE-INVALID-CODE",

    label:
      "Unrecognised code",

    hint:
      "Demonstrates an invalid scan",
  });

  return samples;
}