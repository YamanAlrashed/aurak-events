import type {
  CountBucket,
  CRMStatus,
  Emirate,
  MarketingAnalytics,
  MarketingEventStats,
  RegistrationType,
} from "@/lib/types";
import {
  getDb,
  simulateLatency,
} from "@/lib/data/store";
import {
  getEventStats,
  getOverallStats,
} from "@/lib/services/marketingAttendanceService";
import {
  EMIRATE_LABELS,
  getIntakeLabel,
  getProgramOfInterestName,
} from "@/lib/data/marketing-reference";
import {
  CRM_STATUS_LABELS,
  CRM_STATUS_ORDER,
  REGISTRATION_TYPE_LABELS,
} from "@/lib/utils/constants";

/* =============================================================================
   MARKETING ANALYTICS

   Every bucket set below partitions REGISTRATIONS (prospects), so each set sums
   to `stats.students`. `stats.visitors` is a separate measure — the number of
   people who physically arrived, guests included — and is never a bucket total.

   The UI must label the two distinctly. See MarketingAnalyticsPanel.
   ========================================================================== */

interface RegistrationRow {
  registrationId: string;
  registrantId: string;
  crmStatus: CRMStatus;
  registrationType: RegistrationType;
  programOfInterestId: string;
  intakeId: string;
  emirate: Emirate;
}

function collectRows(
  eventId?: string
): RegistrationRow[] {
  const db = getDb();

  return db.marketingRegistrations
    .filter(
      (registration) =>
        !eventId ||
        registration.eventId === eventId
    )
    .map((registration): RegistrationRow | null => {
      const registrant =
        db.marketingRegistrants.find(
          (item) =>
            item.id ===
            registration.registrantId
        );

      if (!registrant) {
        return null;
      }

      return {
        registrationId:
          registration.id,
        registrantId:
          registration.registrantId,
        crmStatus:
          registration.crmStatus,
        registrationType:
          registration.registrationType,
        programOfInterestId:
          registrant.programOfInterestId,
        intakeId:
          registrant.intakeId,
        emirate:
          registrant.emirate,
      };
    })
    .filter(
      (
        row
      ): row is RegistrationRow =>
        row !== null
    );
}

function countBy(
  rows: RegistrationRow[],
  key: (
    row: RegistrationRow
  ) => string,
  label: (
    id: string
  ) => string
): CountBucket[] {
  const counts =
    new Map<string, number>();

  for (const row of rows) {
    const id = key(row);

    counts.set(
      id,
      (counts.get(id) ?? 0) + 1
    );
  }

  return Array.from(
    counts.entries()
  )
    .map(
      ([id, count]) => ({
        id,
        label:
          label(id),
        count,
      })
    )
    .sort(
      (a, b) =>
        b.count - a.count
    );
}

function buildBuckets(
  rows: RegistrationRow[]
) {
  return {
    byProgramOfInterest:
      countBy(
        rows,
        (row) =>
          row.programOfInterestId,
        (id) =>
          getProgramOfInterestName(
            id
          )
      ),

    byIntake:
      countBy(
        rows,
        (row) =>
          row.intakeId,
        (id) =>
          getIntakeLabel(id)
      ),

    byEmirate:
      countBy(
        rows,
        (row) =>
          row.emirate,
        (id) =>
          EMIRATE_LABELS[
            id as keyof typeof EMIRATE_LABELS
          ] ?? id
      ),

    byRegistrationType:
      countBy(
        rows,
        (row) =>
          row.registrationType,
        (id) =>
          REGISTRATION_TYPE_LABELS[
            id as keyof typeof REGISTRATION_TYPE_LABELS
          ] ?? id
      ),
  };
}

/** CRM buckets kept in funnel order rather than sorted by size. */
function crmBuckets(
  stats: MarketingEventStats
): CountBucket[] {
  return CRM_STATUS_ORDER.map(
    (status) => ({
      id: status,
      label:
        CRM_STATUS_LABELS[
          status
        ],
      count:
        stats.crmBreakdown[
          status
        ],
    })
  );
}

export async function getEventAnalytics(
  eventId: string
): Promise<MarketingAnalytics> {
  await simulateLatency();

  const rows =
    collectRows(eventId);

  const stats =
    await getEventStats(
      eventId
    );

  const buckets =
    buildBuckets(rows);

  return {
    ...buckets,
    byCrmStatus:
      crmBuckets(stats),
    stats,
  };
}

export async function getOverallAnalytics(): Promise<MarketingAnalytics> {
  await simulateLatency();

  const rows =
    collectRows();

  const stats =
    await getOverallStats();

  const buckets =
    buildBuckets(rows);

  return {
    ...buckets,
    byCrmStatus:
      crmBuckets(stats),
    stats,
  };
}

/**
 * Per-event totals for the dashboard table. Visitors and students stay in
 * separate columns.
 */
export async function getEventTotals(): Promise<
  Array<{
    eventId: string;
    eventName: string;
    date: string;
    students: number;
    visitors: number;
    attended: number;
  }>
> {
  await simulateLatency();

  const db = getDb();

  const results: Array<{
    eventId: string;
    eventName: string;
    date: string;
    students: number;
    visitors: number;
    attended: number;
  }> = [];

  for (
    const event of db.marketingEvents
  ) {
    const stats =
      await getEventStats(
        event.id
      );

    results.push({
      eventId: event.id,
      eventName: event.name,
      date: event.date,
      students:
        stats.students,
      visitors:
        stats.visitors,
      attended:
        stats.attended,
    });
  }

  return results.sort(
    (a, b) =>
      b.date.localeCompare(
        a.date
      )
  );
}