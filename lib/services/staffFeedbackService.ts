import type {
  StaffFeedback,
  StaffFeedbackInput,
} from "@/lib/types";
import {
  clone,
  getDb,
  mutate,
  simulateLatency,
} from "@/lib/data/store";
import { getStaffMember } from "@/lib/data/marketing-reference";
import { createId } from "@/lib/utils/id";

/* =============================================================================
   STAFF FEEDBACK SERVICE

   Marketing staff leave feedback on an event they worked. Admin reads it inside
   that event. Comment is required; rating and suggestions are optional.
   ========================================================================== */

export async function listForEvent(
  eventId: string
): Promise<StaffFeedback[]> {
  await simulateLatency();

  return clone(
    getDb()
      .staffFeedback.filter(
        (item) =>
          item.eventId === eventId
      )
      .sort(
        (a, b) =>
          b.submittedAt.localeCompare(
            a.submittedAt
          )
      )
  );
}

export async function getMyFeedback(
  eventId: string,
  staffId: string
): Promise<StaffFeedback | null> {
  await simulateLatency(120);

  const feedback =
    getDb().staffFeedback.find(
      (item) =>
        item.eventId === eventId &&
        item.staffId === staffId
    );

  return feedback
    ? clone(feedback)
    : null;
}

export async function submitFeedback(
  eventId: string,
  staffId: string,
  input: StaffFeedbackInput
): Promise<
  | {
      ok: true;
      feedback: StaffFeedback;
    }
  | {
      ok: false;
      reason: "unknown_staff";
    }
> {
  await simulateLatency(400);

  const member =
    getStaffMember(staffId);

  if (!member) {
    return {
      ok: false,
      reason: "unknown_staff",
    };
  }

  const now =
    new Date().toISOString();

  const feedback =
    mutate((db) => {
      const existing =
        db.staffFeedback.find(
          (item) =>
            item.eventId ===
              eventId &&
            item.staffId ===
              staffId
        );

      if (existing) {
        existing.rating =
          input.rating;

        existing.comment =
          input.comment.trim();

        existing.suggestions =
          input.suggestions?.trim() ||
          undefined;

        existing.submittedAt =
          now;

        return existing;
      }

      const created:
        StaffFeedback = {
        id: createId("sf"),
        eventId,
        staffId: member.id,
        staffName:
          member.name,
        staffDepartment:
          member.department,
        rating:
          input.rating,
        comment:
          input.comment.trim(),
        suggestions:
          input.suggestions?.trim() ||
          undefined,
        submittedAt: now,
      };

      db.staffFeedback.push(
        created
      );

      return created;
    });

  return {
    ok: true,
    feedback:
      clone(feedback),
  };
}

/** Feedback counts per event, for list badges. */
export async function getFeedbackCounts(
  eventIds: string[]
): Promise<
  Record<string, number>
> {
  await simulateLatency(120);

  const feedback =
    getDb().staffFeedback;

  const result: Record<
    string,
    number
  > = {};

  for (const eventId of eventIds) {
    result[eventId] =
      feedback.filter(
        (item) =>
          item.eventId === eventId
      ).length;
  }

  return result;
}

/** Average of the optional staff ratings, or null when nobody rated. */
export async function getAverageRating(
  eventId: string
): Promise<{
  average: number;
  count: number;
} | null> {
  await simulateLatency(100);

  const rated = getDb()
    .staffFeedback.filter(
      (item) =>
        item.eventId === eventId
    )
    .map(
      (item) => item.rating
    )
    .filter(
      (
        rating
      ): rating is number =>
        typeof rating === "number"
    );

  if (rated.length === 0) {
    return null;
  }

  return {
    average:
      rated.reduce(
        (sum, value) =>
          sum + value,
        0
      ) / rated.length,
    count: rated.length,
  };
}