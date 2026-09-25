import type {
  CRMStatus,
  MarketingRegistrant,
  MarketingRegistration,
} from "@/lib/types";
import { clone, getDb, mutate, simulateLatency } from "@/lib/data/store";
import { CRM_STATUS_ORDER } from "@/lib/utils/constants";

/* =============================================================================
   MOCK CRM (stands in for Meritto)

   TWO SEPARATE CONCEPTS, deliberately not merged:

     CRM STATUS      - where this person currently stands in the CRM
                       (enrolled / accepted / admitted / lead / new_lead).
                       It is a property of the PERSON and can change over time
                       independently of any event.

     ATTRIBUTION     - which event this registration came from.
                       That is MarketingRegistration.eventId and it never
                       changes, even when the CRM status later moves on.

   Never infer one from the other. A registrant attributed to the Dubai school
   visit may be Enrolled today and was New Lead when they registered; both facts
   must remain readable.

   new_lead means "not found in the CRM".

   REPLACING THIS LATER: swap the body of lookup() for a Meritto API call. The
   returned CRMStatus and the separation above stay exactly as they are.
   ========================================================================== */

/** Stable hash so the same person always resolves to the same status. */
function hashIdentity(value: string): number {
  let hash = 2166136261;
  const normalised = value.trim().toLowerCase();

  for (let index = 0; index < normalised.length; index += 1) {
    hash ^= normalised.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

/**
 * Weighted status distribution, matching the seed generator so runtime and
 * seeded registrations behave identically.
 */
const STATUS_WEIGHTS: Array<[CRMStatus, number]> = [
  ["enrolled", 15],
  ["accepted", 11],
  ["admitted", 22],
  ["lead", 41],
  ["new_lead", 11],
];

/**
 * Mock CRM lookup, keyed on the prospect's identity (email then phone).
 *
 * Deterministic on purpose: re-running a sync must not shuffle the dashboard.
 */
export async function lookup(
  identity: Pick<MarketingRegistrant, "email" | "phone">
): Promise<{ found: boolean; status: CRMStatus }> {
  await simulateLatency(250);

  const seed = hashIdentity(identity.email || identity.phone);
  const total = STATUS_WEIGHTS.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = seed % total;

  for (const [status, weight] of STATUS_WEIGHTS) {
    roll -= weight;

    if (roll < 0) {
      return {
        found: status !== "new_lead",
        status,
      };
    }
  }

  return {
    found: false,
    status: "new_lead",
  };
}

/** Convenience wrapper used when a registration is created. */
export async function resolveStatus(
  identity: Pick<MarketingRegistrant, "email" | "phone">
): Promise<CRMStatus> {
  const result = await lookup(identity);
  return result.status;
}

/**
 * Mock re-sync for one event. In production this reconciles against Meritto.
 * Attribution (eventId) is never touched — only the status field.
 */
export async function resyncEvent(eventId: string): Promise<number> {
  await simulateLatency(800);

  const db = getDb();

  const registrations = db.marketingRegistrations.filter(
    (item) => item.eventId === eventId
  );

  let changed = 0;

  for (const registration of registrations) {
    const registrant = db.marketingRegistrants.find(
      (item) => item.id === registration.registrantId
    );

    if (!registrant) continue;

    const seed = hashIdentity(registrant.email || registrant.phone);
    const total = STATUS_WEIGHTS.reduce((sum, [, weight]) => sum + weight, 0);

    let roll = seed % total;
    let resolved: CRMStatus = "new_lead";

    for (const [status, weight] of STATUS_WEIGHTS) {
      roll -= weight;

      if (roll < 0) {
        resolved = status;
        break;
      }
    }

    if (registration.crmStatus !== resolved) {
      mutate((database) => {
        const target = database.marketingRegistrations.find(
          (item) => item.id === registration.id
        );

        if (target) {
          target.crmStatus = resolved;
        }
      });

      changed += 1;
    }
  }

  return changed;
}

/* -----------------------------------------------------------------------------
   Breakdowns

   These partition REGISTRATIONS, so the buckets sum to the number of
   registrations (students / prospects). They never sum to visitors.
   -------------------------------------------------------------------------- */

export function buildBreakdown(
  registrations: MarketingRegistration[]
): Record<CRMStatus, number> {
  const breakdown: Record<CRMStatus, number> = {
    enrolled: 0,
    accepted: 0,
    admitted: 0,
    lead: 0,
    new_lead: 0,
  };

  for (const registration of registrations) {
    breakdown[registration.crmStatus] += 1;
  }

  return breakdown;
}

export async function getBreakdownForEvent(
  eventId: string
): Promise<Record<CRMStatus, number>> {
  await simulateLatency(120);

  return buildBreakdown(
    getDb().marketingRegistrations.filter(
      (item) => item.eventId === eventId
    )
  );
}

/** Breakdown across every event — used by the Marketing Admin dashboard. */
export async function getOverallBreakdown(): Promise<
  Record<CRMStatus, number>
> {
  await simulateLatency(150);

  return buildBreakdown(getDb().marketingRegistrations);
}

/**
 * Registrations with a given CRM status for an event — the drill-down behind
 * clicking a status in the breakdown.
 */
export async function listByStatus(
  eventId: string,
  status: CRMStatus
): Promise<MarketingRegistration[]> {
  await simulateLatency(150);

  return clone(
    getDb().marketingRegistrations.filter(
      (item) =>
        item.eventId === eventId &&
        item.crmStatus === status
    )
  );
}

export const CRM_ORDER = CRM_STATUS_ORDER;