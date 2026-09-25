import type {
  CampusEvent,
  CampusEventInput,
  EventStatus,
} from "@/lib/types";
import {
  clone,
  getDb,
  mutate,
  simulateLatency,
} from "@/lib/data/store";
import {
  getBuilding,
  getHostingDepartment,
} from "@/lib/data/campus-reference";
import { createId } from "@/lib/utils/id";
import {
  compareByStart,
  deriveEventStatus,
  isWithinNextDays,
  todayISO,
} from "@/lib/utils/dates";
import {
  DELETABLE_STATUSES,
  EDITABLE_STATUSES,
} from "@/lib/utils/constants";
import {
  notifyNewEvent,
  removeNotificationsForEvent,
} from "@/lib/services/notificationService";

export interface CampusEventFilter {
  status?: EventStatus | "all";
  search?: string;
  buildingId?: string;
  includeArchived?: boolean;
}

function matchesSearch(
  event: CampusEvent,
  search: string
): boolean {
  const needle = search
    .trim()
    .toLowerCase();

  if (!needle) {
    return true;
  }

  return (
    event.name
      .toLowerCase()
      .includes(needle) ||
    event.hostingDepartmentName
      .toLowerCase()
      .includes(needle) ||
    event.location.buildingName
      .toLowerCase()
      .includes(needle) ||
    (event.location.locationName ?? "")
      .toLowerCase()
      .includes(needle) ||
    (event.location.room ?? "")
      .toLowerCase()
      .includes(needle)
  );
}

export async function listEvents(
  filter: CampusEventFilter = {}
): Promise<CampusEvent[]> {
  await simulateLatency();

  const {
    status = "all",
    search = "",
    buildingId,
    includeArchived,
  } = filter;

  return clone(
    getDb()
      .campusEvents.filter(
        (event) => {
          const derived =
            deriveEventStatus(
              event
            );

          if (
            !includeArchived &&
            derived === "archived"
          ) {
            return false;
          }

          if (
            status !== "all" &&
            derived !== status
          ) {
            return false;
          }

          if (
            buildingId &&
            event.location
              .buildingId !==
              buildingId
          ) {
            return false;
          }

          return matchesSearch(
            event,
            search
          );
        }
      )
      .sort(compareByStart)
  );
}

export async function getEvent(
  id: string
): Promise<CampusEvent | null> {
  await simulateLatency(120);

  const event =
    getDb().campusEvents.find(
      (item) => item.id === id
    );

  return event
    ? clone(event)
    : null;
}

export interface CampusDashboardData {
  upcoming: CampusEvent[];
  thisWeek: CampusEvent[];
  live: CampusEvent[];
  recentlyCompleted: CampusEvent[];
  counts: {
    upcoming: number;
    thisWeek: number;
    completed: number;
    archived: number;
  };
}

export async function getDashboardData(): Promise<CampusDashboardData> {
  await simulateLatency();

  const events =
    getDb().campusEvents;

  const withStatus =
    events.map((event) => ({
      event,
      status:
        deriveEventStatus(
          event
        ),
    }));

  const upcoming =
    withStatus
      .filter(
        (item) =>
          item.status ===
          "upcoming"
      )
      .map(
        (item) =>
          item.event
      )
      .sort(compareByStart);

  const live =
    withStatus
      .filter(
        (item) =>
          item.status ===
          "live"
      )
      .map(
        (item) =>
          item.event
      )
      .sort(compareByStart);

  const thisWeek =
    upcoming.filter((event) =>
      isWithinNextDays(
        event.date,
        7
      )
    );

  const recentlyCompleted =
    withStatus
      .filter(
        (item) =>
          item.status ===
          "completed"
      )
      .map(
        (item) =>
          item.event
      )
      .sort((a, b) =>
        compareByStart(
          b,
          a
        )
      )
      .slice(0, 5);

  return clone({
    upcoming:
      upcoming.slice(0, 6),

    thisWeek,
    live,
    recentlyCompleted,

    counts: {
      upcoming:
        upcoming.length,

      thisWeek:
        thisWeek.length,

      completed:
        withStatus.filter(
          (item) =>
            item.status ===
            "completed"
        ).length,

      archived:
        withStatus.filter(
          (item) =>
            item.status ===
            "archived"
        ).length,
    },
  });
}

export async function createEvent(
  input: CampusEventInput,
  createdByUserId: string
): Promise<CampusEvent> {
  await simulateLatency();

  const now =
    new Date().toISOString();

  const event: CampusEvent = {
    id: createId("ce"),

    name:
      input.name.trim(),

    description:
      input.description
        ?.trim() ||
      undefined,

    date:
      input.date,

    startTime:
      input.startTime,

    endTime:
      input.endTime,

    location: {
      buildingId:
        input.location
          .buildingId,

      buildingName:
        getBuilding(
          input.location
            .buildingId
        )?.name ??
        input.location
          .buildingName,

      room:
        input.location.room
          ?.trim() ||
        undefined,

      locationName:
        input.location
          .locationName
          ?.trim() ||
        undefined,
    },

    hostingDepartmentId:
      input.hostingDepartmentId,

    hostingDepartmentName:
      getHostingDepartment(
        input.hostingDepartmentId
      )?.name ?? "Other",

    targetAudience:
      input.targetAudience,

    status: "upcoming",

    showAverageRatingToUsers:
      input.showAverageRatingToUsers,

    createdAt: now,
    updatedAt: now,

    createdByUserId,
  };

  mutate((db) => {
    db.campusEvents.push(
      event
    );
  });

  await notifyNewEvent(
    event
  );

  return clone(event);
}

export function canEditEvent(
  event: CampusEvent
): boolean {
  return EDITABLE_STATUSES.includes(
    deriveEventStatus(event)
  );
}

export function canDeleteEvent(
  event: CampusEvent
): boolean {
  return DELETABLE_STATUSES.includes(
    deriveEventStatus(event)
  );
}

export async function updateEvent(
  id: string,
  input: CampusEventInput
): Promise<CampusEvent> {
  await simulateLatency();

  return clone(
    mutate((db) => {
      const event =
        db.campusEvents.find(
          (item) =>
            item.id === id
        );

      if (!event) {
        throw new Error(
          "Event not found."
        );
      }

      if (
        !canEditEvent(event)
      ) {
        throw new Error(
          "Only upcoming or cancelled events can be edited. Completed and archived events are preserved."
        );
      }

      event.name =
        input.name.trim();

      event.description =
        input.description
          ?.trim() ||
        undefined;

      event.date =
        input.date;

      event.startTime =
        input.startTime;

      event.endTime =
        input.endTime;

      event.location = {
        buildingId:
          input.location
            .buildingId,

        buildingName:
          getBuilding(
            input.location
              .buildingId
          )?.name ??
          input.location
            .buildingName,

        room:
          input.location.room
            ?.trim() ||
          undefined,

        locationName:
          input.location
            .locationName
            ?.trim() ||
          undefined,
      };

      event.hostingDepartmentId =
        input.hostingDepartmentId;

      event.hostingDepartmentName =
        getHostingDepartment(
          input.hostingDepartmentId
        )?.name ?? "Other";

      event.targetAudience =
        input.targetAudience;

      event.showAverageRatingToUsers =
        input.showAverageRatingToUsers;

      event.updatedAt =
        new Date().toISOString();

      return event;
    })
  );
}

export async function deleteEvent(
  id: string
): Promise<void> {
  await simulateLatency();

  mutate((db) => {
    const event =
      db.campusEvents.find(
        (item) =>
          item.id === id
      );

    if (!event) {
      throw new Error(
        "Event not found."
      );
    }

    if (
      !canDeleteEvent(
        event
      )
    ) {
      throw new Error(
        "Only upcoming or cancelled events can be deleted. Completed events are preserved."
      );
    }

    db.campusEvents =
      db.campusEvents.filter(
        (item) =>
          item.id !== id
      );

    db.campusRsvps =
      db.campusRsvps.filter(
        (item) =>
          item.eventId !== id
      );

    db.campusTickets =
      db.campusTickets.filter(
        (item) =>
          item.eventId !== id
      );

    db.campusAttendance =
      db.campusAttendance.filter(
        (item) =>
          item.eventId !== id
      );

    db.galleries =
      db.galleries.filter(
        (item) =>
          item.eventId !== id
      );

    db.eventPhotos =
      db.eventPhotos.filter(
        (item) =>
          item.eventId !== id
      );

    db.eventRatings =
      db.eventRatings.filter(
        (item) =>
          item.eventId !== id
      );
  });

  removeNotificationsForEvent(
    id
  );
}

export async function cancelEvent(
  id: string
): Promise<CampusEvent> {
  await simulateLatency();

  return clone(
    mutate((db) => {
      const event =
        db.campusEvents.find(
          (item) =>
            item.id === id
        );

      if (!event) {
        throw new Error(
          "Event not found."
        );
      }

      event.status =
        "cancelled";

      event.cancelledAt =
        new Date().toISOString();

      event.updatedAt =
        event.cancelledAt;

      return event;
    })
  );
}

export async function archiveEvent(
  id: string
): Promise<CampusEvent> {
  await simulateLatency();

  return clone(
    mutate((db) => {
      const event =
        db.campusEvents.find(
          (item) =>
            item.id === id
        );

      if (!event) {
        throw new Error(
          "Event not found."
        );
      }

      if (
        deriveEventStatus(
          event
        ) === "upcoming"
      ) {
        throw new Error(
          "Upcoming events cannot be archived."
        );
      }

      event.status =
        "archived";

      event.archivedAt =
        new Date().toISOString();

      event.updatedAt =
        event.archivedAt;

      const gallery =
        db.galleries.find(
          (item) =>
            item.eventId ===
            id
        );

      if (gallery) {
        gallery.archived =
          true;
      }

      return event;
    })
  );
}

export async function restoreEvent(
  id: string
): Promise<CampusEvent> {
  await simulateLatency();

  return clone(
    mutate((db) => {
      const event =
        db.campusEvents.find(
          (item) =>
            item.id === id
        );

      if (!event) {
        throw new Error(
          "Event not found."
        );
      }

      event.status =
        event.date >=
        todayISO()
          ? "upcoming"
          : "completed";

      event.archivedAt =
        undefined;

      event.updatedAt =
        new Date().toISOString();

      const gallery =
        db.galleries.find(
          (item) =>
            item.eventId ===
            id
        );

      if (gallery) {
        gallery.archived =
          false;
      }

      return event;
    })
  );
}

export async function setRatingVisibility(
  id: string,
  visible: boolean
): Promise<CampusEvent> {
  await simulateLatency(
    150
  );

  return clone(
    mutate((db) => {
      const event =
        db.campusEvents.find(
          (item) =>
            item.id === id
        );

      if (!event) {
        throw new Error(
          "Event not found."
        );
      }

      event.showAverageRatingToUsers =
        visible;

      event.updatedAt =
        new Date().toISOString();

      return event;
    })
  );
}

export interface BuildingEventCount {
  buildingId: string;
  buildingName: string;
  campus?: string;
  upcomingCount: number;
}

export async function getEventsByBuilding(): Promise<
  BuildingEventCount[]
> {
  await simulateLatency();

  const events =
    getDb().campusEvents;

  const counts =
    new Map<
      string,
      number
    >();

  for (
    const event
    of events
  ) {
    const status =
      deriveEventStatus(
        event
      );

    if (
      status !== "upcoming" &&
      status !== "live"
    ) {
      continue;
    }

    counts.set(
      event.location
        .buildingId,
      (counts.get(
        event.location
          .buildingId
      ) ?? 0) + 1
    );
  }

  const {
    CAMPUS_BUILDINGS,
  } = await import(
    "@/lib/data/campus-reference"
  );

  return CAMPUS_BUILDINGS.map(
    (building) => ({
      buildingId:
        building.id,

      buildingName:
        building.name,

      campus:
        building.campus,

      upcomingCount:
        counts.get(
          building.id
        ) ?? 0,
    })
  );
}