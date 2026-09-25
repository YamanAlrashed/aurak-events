import type {
  MarketingAttendance,
  MarketingEventStats,
} from "@/lib/types";
import {
  clone,
  getDb,
  mutate,
  simulateLatency,
} from "@/lib/data/store";
import { buildBreakdown } from "@/lib/services/mockCrmService";

/* =============================================================================
   MARKETING ATTENDANCE SERVICE

   THE VISITOR RULE, implemented once, here:

     visitorCount = the TOTAL number of people who physically arrived with this
                    registration, INCLUDING the prospect themselves.

     A prospect who came with two companions is:
       students / prospects = 1
       visitors             = 3

   Therefore:
     students  = number of registrations (distinct prospects)
     attended  = registrations that checked in
     visitors  = SUM of visitorCount across checked-in registrations

   Students and visitors are different measures and are never added together.
   CRM buckets partition registrations, so they sum to students — never to
   visitors.
   ========================================================================== */

export async function getAttendance(
  registrationId: string
): Promise<MarketingAttendance | null> {
  await simulateLatency(100);

  const record =
    getDb().marketingAttendance.find(
      (item) =>
        item.registrationId ===
        registrationId
    );

  return record
    ? clone(record)
    : null;
}

/**
 * Confirms attendance and records how many people actually arrived.
 * Idempotent: a second call reports the duplicate instead of double counting.
 */
export async function confirmAttendance(
  eventId: string,
  registrationId: string,
  visitorCount: number,
  staffId: string
): Promise<
  | {
      ok: true;
      attendance: MarketingAttendance;
    }
  | {
      ok: false;
      reason: "already_checked_in";
      checkedInAt: string;
      visitorCount: number;
    }
  | {
      ok: false;
      reason: "invalid_visitor_count";
    }
> {
  await simulateLatency(350);

  /* At least the prospect arrived, so the minimum is 1. */
  const total =
    Math.round(visitorCount);

  if (
    !Number.isFinite(total) ||
    total < 1
  ) {
    return {
      ok: false,
      reason:
        "invalid_visitor_count",
    };
  }

  const existing =
    getDb().marketingAttendance.find(
      (item) =>
        item.registrationId ===
        registrationId
    );

  if (
    existing?.checkedIn &&
    existing.checkedInAt
  ) {
    return {
      ok: false,
      reason:
        "already_checked_in",
      checkedInAt:
        existing.checkedInAt,
      visitorCount:
        existing.visitorCount,
    };
  }

  const now =
    new Date().toISOString();

  const attendance =
    mutate((db) => {
      const record =
        db.marketingAttendance.find(
          (item) =>
            item.registrationId ===
            registrationId
        );

      if (record) {
        record.checkedIn = true;
        record.checkedInAt = now;
        record.checkedInByStaffId =
          staffId;
        record.visitorCount =
          total;

        return record;
      }

      const created:
        MarketingAttendance = {
        id: `mat-${registrationId}`,
        eventId,
        registrationId,
        checkedIn: true,
        checkedInAt: now,
        checkedInByStaffId:
          staffId,
        visitorCount: total,
      };

      db.marketingAttendance.push(
        created
      );

      return created;
    });

  return {
    ok: true,
    attendance:
      clone(attendance),
  };
}

/** Correcting a visitor count after check-in, without changing the check-in. */
export async function updateVisitorCount(
  registrationId: string,
  visitorCount: number
): Promise<MarketingAttendance> {
  await simulateLatency(250);

  const total = Math.max(
    1,
    Math.round(visitorCount)
  );

  return clone(
    mutate((db) => {
      const record =
        db.marketingAttendance.find(
          (item) =>
            item.registrationId ===
            registrationId
        );

      if (!record) {
        throw new Error(
          "This registration has not checked in yet."
        );
      }

      record.visitorCount =
        total;

      return record;
    })
  );
}

/* -----------------------------------------------------------------------------
   Statistics
   -------------------------------------------------------------------------- */

export async function getEventStats(
  eventId: string
): Promise<MarketingEventStats> {
  await simulateLatency(150);

  const db = getDb();

  const registrations =
    db.marketingRegistrations.filter(
      (item) =>
        item.eventId === eventId
    );

  const registrationIds =
    new Set(
      registrations.map(
        (item) => item.id
      )
    );

  const attendanceRecords =
    db.marketingAttendance.filter(
      (item) =>
        registrationIds.has(
          item.registrationId
        ) &&
        item.checkedIn
    );

  /* Distinct prospects — the "students" measure. */
  const students =
    new Set(
      registrations.map(
        (item) =>
          item.registrantId
      )
    ).size;

  /* Total humans through the door, guests included. */
  const visitors =
    attendanceRecords.reduce(
      (sum, record) =>
        sum +
        record.visitorCount,
      0
    );

  return {
    visitors,
    students,
    attended:
      attendanceRecords.length,
    totalRegistrations:
      registrations.length,
    preRegistered:
      registrations.filter(
        (item) =>
          item.registrationType ===
          "pre_registered"
      ).length,
    walkIn:
      registrations.filter(
        (item) =>
          item.registrationType ===
          "walk_in"
      ).length,
    crmBreakdown:
      buildBreakdown(
        registrations
      ),
  };
}

export async function getStatsForEvents(
  eventIds: string[]
): Promise<
  Record<
    string,
    MarketingEventStats
  >
> {
  await simulateLatency(200);

  const result: Record<
    string,
    MarketingEventStats
  > = {};

  for (const eventId of eventIds) {
    result[eventId] =
      await getEventStats(
        eventId
      );
  }

  return result;
}

/** Totals across every marketing event, for the admin dashboard. */
export async function getOverallStats(): Promise<MarketingEventStats> {
  await simulateLatency(200);

  const db = getDb();

  const registrations =
    db.marketingRegistrations;

  const attendanceRecords =
    db.marketingAttendance.filter(
      (item) => item.checkedIn
    );

  return {
    visitors:
      attendanceRecords.reduce(
        (sum, record) =>
          sum +
          record.visitorCount,
        0
      ),

    students:
      new Set(
        registrations.map(
          (item) =>
            item.registrantId
        )
      ).size,

    attended:
      attendanceRecords.length,

    totalRegistrations:
      registrations.length,

    preRegistered:
      registrations.filter(
        (item) =>
          item.registrationType ===
          "pre_registered"
      ).length,

    walkIn:
      registrations.filter(
        (item) =>
          item.registrationType ===
          "walk_in"
      ).length,

    crmBreakdown:
      buildBreakdown(
        registrations
      ),
  };
}