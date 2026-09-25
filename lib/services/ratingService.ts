import type {
  EventRating,
  RatingSummary,
} from "@/lib/types";
import {
  clone,
  getDb,
  mutate,
  simulateLatency,
} from "@/lib/data/store";

const EMPTY_SUMMARY:
  RatingSummary = {
    average: 0,
    count: 0,
    distribution: [
      0,
      0,
      0,
      0,
      0,
    ],
  };

export async function getSummary(
  eventId: string
): Promise<RatingSummary> {
  await simulateLatency(
    120
  );

  const ratings =
    getDb().eventRatings.filter(
      (item) =>
        item.eventId ===
        eventId
    );

  if (
    ratings.length === 0
  ) {
    return {
      ...EMPTY_SUMMARY,
    };
  }

  const distribution: [
    number,
    number,
    number,
    number,
    number,
  ] = [0, 0, 0, 0, 0];

  let total = 0;

  for (
    const rating
    of ratings
  ) {
    total +=
      rating.stars;

    const index =
      Math.min(
        4,
        Math.max(
          0,
          rating.stars - 1
        )
      );

    distribution[index] +=
      1;
  }

  return {
    average:
      total /
      ratings.length,

    count:
      ratings.length,

    distribution,
  };
}

export async function getSummaries(
  eventIds: string[]
): Promise<
  Record<
    string,
    RatingSummary
  >
> {
  await simulateLatency(
    120
  );

  const all =
    getDb().eventRatings;

  const result: Record<
    string,
    RatingSummary
  > = {};

  for (
    const eventId
    of eventIds
  ) {
    const ratings =
      all.filter(
        (item) =>
          item.eventId ===
          eventId
      );

    if (
      ratings.length ===
      0
    ) {
      result[eventId] = {
        ...EMPTY_SUMMARY,
      };

      continue;
    }

    const distribution: [
      number,
      number,
      number,
      number,
      number,
    ] = [
      0,
      0,
      0,
      0,
      0,
    ];

    let total = 0;

    for (
      const rating
      of ratings
    ) {
      total +=
        rating.stars;

      distribution[
        Math.min(
          4,
          Math.max(
            0,
            rating.stars -
              1
          )
        )
      ] += 1;
    }

    result[eventId] = {
      average:
        total /
        ratings.length,

      count:
        ratings.length,

      distribution,
    };
  }

  return result;
}

export async function listRatings(
  eventId: string
): Promise<EventRating[]> {
  await simulateLatency();

  return clone(
    getDb()
      .eventRatings.filter(
        (item) =>
          item.eventId ===
          eventId
      )
      .sort((a, b) =>
        b.submittedAt.localeCompare(
          a.submittedAt
        )
      )
  );
}

export async function getUserRating(
  eventId: string,
  userId: string
): Promise<
  EventRating | null
> {
  await simulateLatency(
    100
  );

  const rating =
    getDb().eventRatings.find(
      (item) =>
        item.eventId ===
          eventId &&
        item.userId ===
          userId
    );

  return rating
    ? clone(rating)
    : null;
}

export async function canUserRate(
  eventId: string,
  userId: string
): Promise<boolean> {
  await simulateLatency(
    80
  );

  return getDb()
    .campusAttendance.some(
      (item) =>
        item.eventId ===
          eventId &&
        item.userId ===
          userId &&
        item.checkedIn
    );
}

export interface RatingInput {
  stars: number;
  comment?: string;
  suggestion?: string;
}

export async function submitRating(
  eventId: string,
  userId: string,
  input: RatingInput
): Promise<
  | {
      ok: true;
      rating:
        EventRating;
    }
  | {
      ok: false;
      reason:
        "not_checked_in";
    }
> {
  await simulateLatency(
    350
  );

  const attended =
    getDb()
      .campusAttendance.some(
        (item) =>
          item.eventId ===
            eventId &&
          item.userId ===
            userId &&
          item.checkedIn
      );

  if (!attended) {
    return {
      ok: false,
      reason:
        "not_checked_in",
    };
  }

  const now =
    new Date().toISOString();

  const rating =
    mutate((db) => {
      const existing =
        db.eventRatings.find(
          (item) =>
            item.eventId ===
              eventId &&
            item.userId ===
              userId
        );

      if (existing) {
        existing.stars =
          input.stars;

        existing.comment =
          input.comment
            ?.trim() ||
          undefined;

        existing.suggestion =
          input.suggestion
            ?.trim() ||
          undefined;

        existing.submittedAt =
          now;

        return existing;
      }

      const created:
        EventRating = {
          id: `rt-${eventId}-${userId}`,

          eventId,
          userId,

          stars:
            input.stars,

          comment:
            input.comment
              ?.trim() ||
            undefined,

          suggestion:
            input.suggestion
              ?.trim() ||
            undefined,

          submittedAt:
            now,
        };

      db.eventRatings.push(
        created
      );

      return created;
    });

  return {
    ok: true,
    rating:
      clone(rating),
  };
}