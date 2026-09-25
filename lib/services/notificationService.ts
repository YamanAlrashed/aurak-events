import type {
  AppNotification,
  CampusEvent,
  CampusUser,
  TargetAudience,
} from "@/lib/types";
import {
  clone,
  getDb,
  mutate,
  simulateLatency,
} from "@/lib/data/store";
import {
  CAMPUS_USERS,
  getCampusUser,
} from "@/lib/data/campus-users";
import { createId } from "@/lib/utils/id";
import { formatEventDate } from "@/lib/utils/dates";

export function matchesAudience(
  user: CampusUser,
  audience: TargetAudience
): boolean {
  if (
    !audience.userTypes.includes(
      user.userType
    )
  ) {
    return false;
  }

  if (
    audience.programIds
      .length > 0
  ) {
    return Boolean(
      user.programId &&
        audience.programIds.includes(
          user.programId
        )
    );
  }

  if (
    audience.departmentIds
      .length > 0
  ) {
    return Boolean(
      user.departmentId &&
        audience.departmentIds.includes(
          user.departmentId
        )
    );
  }

  if (
    audience.collegeIds
      .length > 0
  ) {
    return Boolean(
      user.collegeId &&
        audience.collegeIds.includes(
          user.collegeId
        )
    );
  }

  return true;
}

export function countAudience(
  audience: TargetAudience
): number {
  return CAMPUS_USERS.filter(
    (user) =>
      matchesAudience(
        user,
        audience
      )
  ).length;
}

const SEED_RECIPIENTS = [
  "cu-2023006308",
  "cu-yamanalrashed",
  "cu-shalaby",
] as const;

let seedAttempted =
  false;

function ensureSeeded(): void {
  if (
    seedAttempted ||
    typeof window ===
      "undefined"
  ) {
    return;
  }

  seedAttempted = true;

  const db = getDb();

  if (
    db.notifications.length >
    0
  ) {
    return;
  }

  mutate((database) => {
    for (
      const userId
      of SEED_RECIPIENTS
    ) {
      const user =
        getCampusUser(
          userId
        );

      if (!user) {
        continue;
      }

      for (
        const event
        of database.campusEvents
      ) {
        if (
          event.status ===
          "archived"
        ) {
          continue;
        }

        if (
          matchesAudience(
            user,
            event.targetAudience
          )
        ) {
          database.notifications.push(
            {
              id: `nt-new-${event.id}-${userId}`,

              recipientUserId:
                userId,

              module:
                "campus-events",

              type:
                "new_event",

              title:
                event.name,

              body:
                `A new event has been published for ${formatEventDate(
                  event.date
                )}.`,

              eventId:
                event.id,

              href:
                `/campus-events/user/events/${event.id}`,

              createdAt:
                event.createdAt,

              read: false,
            }
          );
        }

        const attended =
          database.campusAttendance.some(
            (item) =>
              item.eventId ===
                event.id &&
              item.userId ===
                userId &&
              item.checkedIn
          );

        const hasPhotos =
          database.eventPhotos.some(
            (photo) =>
              photo.eventId ===
              event.id
          );

        if (
          attended &&
          hasPhotos
        ) {
          const gallery =
            database.galleries.find(
              (item) =>
                item.eventId ===
                event.id
            );

          database.notifications.push(
            {
              id: `nt-photos-${event.id}-${userId}`,

              recipientUserId:
                userId,

              module:
                "campus-events",

              type:
                "photos_available",

              title:
                "Photos are ready",

              body:
                `Photos from ${event.name} are now available.`,

              eventId:
                event.id,

              href:
                `/campus-events/user/events/${event.id}`,

              createdAt:
                gallery
                  ?.publishedAt ??
                event.createdAt,

              read: false,
            }
          );
        }
      }
    }
  });
}

export async function listForUser(
  userId: string
): Promise<
  AppNotification[]
> {
  await simulateLatency();

  ensureSeeded();

  return clone(
    getDb()
      .notifications.filter(
        (item) =>
          item.recipientUserId ===
          userId
      )
      .sort((a, b) =>
        b.createdAt.localeCompare(
          a.createdAt
        )
      )
  );
}

export async function getUnreadCount(
  userId: string
): Promise<number> {
  await simulateLatency(
    80
  );

  ensureSeeded();

  return getDb()
    .notifications.filter(
      (item) =>
        item.recipientUserId ===
          userId &&
        !item.read
    ).length;
}

export async function markRead(
  notificationId: string
): Promise<void> {
  await simulateLatency(
    80
  );

  mutate((db) => {
    const notification =
      db.notifications.find(
        (item) =>
          item.id ===
          notificationId
      );

    if (notification) {
      notification.read =
        true;
    }
  });
}

export async function markAllRead(
  userId: string
): Promise<void> {
  await simulateLatency(
    150
  );

  mutate((db) => {
    db.notifications
      .filter(
        (item) =>
          item.recipientUserId ===
          userId
      )
      .forEach(
        (item) => {
          item.read = true;
        }
      );
  });
}

export async function notifyNewEvent(
  event: CampusEvent
): Promise<number> {
  await simulateLatency(
    200
  );

  const now =
    new Date().toISOString();

  const recipients =
    CAMPUS_USERS.filter(
      (user) =>
        matchesAudience(
          user,
          event.targetAudience
        )
    );

  mutate((db) => {
    for (
      const user
      of recipients
    ) {
      db.notifications.push({
        id:
          createId("nt"),

        recipientUserId:
          user.id,

        module:
          "campus-events",

        type:
          "new_event",

        title:
          event.name,

        body:
          `A new event has been published for ${formatEventDate(
            event.date
          )}.`,

        eventId:
          event.id,

        href:
          `/campus-events/user/events/${event.id}`,

        createdAt: now,

        read: false,
      });
    }
  });

  return recipients.length;
}

export async function notifyPhotosAvailable(
  eventId: string
): Promise<number> {
  await simulateLatency(
    200
  );

  const db = getDb();

  const event =
    db.campusEvents.find(
      (item) =>
        item.id ===
        eventId
    );

  if (!event) {
    return 0;
  }

  const attendeeIds =
    db.campusAttendance
      .filter(
        (item) =>
          item.eventId ===
            eventId &&
          item.checkedIn
      )
      .map(
        (item) =>
          item.userId
      );

  const now =
    new Date().toISOString();

  mutate((database) => {
    for (
      const userId
      of attendeeIds
    ) {
      database.notifications.push(
        {
          id:
            createId("nt"),

          recipientUserId:
            userId,

          module:
            "campus-events",

          type:
            "photos_available",

          title:
            "Photos are ready",

          body:
            `Photos from ${event.name} are now available.`,

          eventId,

          href:
            `/campus-events/user/events/${eventId}`,

          createdAt: now,

          read: false,
        }
      );
    }
  });

  return attendeeIds.length;
}

export function removeNotificationsForEvent(
  eventId: string
): void {
  mutate((db) => {
    db.notifications =
      db.notifications.filter(
        (item) =>
          item.eventId !==
          eventId
      );
  });
}