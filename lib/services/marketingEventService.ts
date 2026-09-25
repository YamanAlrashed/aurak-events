import type {
  AssignedStaff,
  EventStatus,
  MarketingEvent,
  MarketingEventInput,
} from "@/lib/types";
import { clone, getDb, mutate, simulateLatency } from "@/lib/data/store";
import { getStaffMember } from "@/lib/data/marketing-reference";
import { createId, registrationCode } from "@/lib/utils/id";
import {
  compareByStart,
  deriveEventStatus,
  isToday,
  isWithinNextDays,
  todayISO,
} from "@/lib/utils/dates";
import {
  DELETABLE_STATUSES,
  EDITABLE_STATUSES,
} from "@/lib/utils/constants";

/* =============================================================================
   MARKETING EVENT SERVICE

   Marketing events are separate from campus events in every respect: emirate
   locations (including Al Ain), event types, assigned staff, departure time,
   driver details and a public registration link.
   ========================================================================== */

export interface MarketingEventFilter {
  status?: EventStatus | "all";
  search?: string;
  /** Restricts to events this staff member is assigned to. */
  assignedStaffId?: string;
}

function matchesSearch(
  event: MarketingEvent,
  search: string
): boolean {
  const needle = search.trim().toLowerCase();

  if (!needle) {
    return true;
  }

  return (
    event.name.toLowerCase().includes(needle) ||
    event.location.venueName.toLowerCase().includes(needle)
  );
}

export async function listEvents(
  filter: MarketingEventFilter = {}
): Promise<MarketingEvent[]> {
  await simulateLatency();

  const {
    status = "all",
    search = "",
    assignedStaffId,
  } = filter;

  return clone(
    getDb()
      .marketingEvents.filter((event) => {
        if (
          status !== "all" &&
          deriveEventStatus(event) !== status
        ) {
          return false;
        }

        if (
          assignedStaffId &&
          !event.assignedStaff.some(
            (staff) => staff.staffId === assignedStaffId
          )
        ) {
          return false;
        }

        return matchesSearch(event, search);
      })
      .sort(compareByStart)
  );
}

export async function getEvent(
  id: string
): Promise<MarketingEvent | null> {
  await simulateLatency(120);

  const event = getDb().marketingEvents.find(
    (item) => item.id === id
  );

  return event ? clone(event) : null;
}

/** Public registration link lookup. No authentication is involved. */
export async function getEventByCode(
  code: string
): Promise<MarketingEvent | null> {
  await simulateLatency(150);

  const normalised = code.trim().toLowerCase();

  const event = getDb().marketingEvents.find(
    (item) =>
      item.publicRegistrationCode.toLowerCase() === normalised
  );

  return event ? clone(event) : null;
}

/* -----------------------------------------------------------------------------
   Staff views
   -------------------------------------------------------------------------- */

export interface StaffEventGroups {
  today: MarketingEvent[];
  upcoming: MarketingEvent[];
  assigned: MarketingEvent[];
  past: MarketingEvent[];
}

/**
 * Staff home groupings.
 *
 * "assigned" is every event this person is on, regardless of date. "today" and
 * "upcoming" are scoped to their assignments too, so staff are not shown trips
 * they are not part of.
 */
export async function getStaffEvents(
  staffId: string | undefined
): Promise<StaffEventGroups> {
  await simulateLatency();

  const events = getDb().marketingEvents;

  const assigned = events
    .filter((event) =>
      staffId
        ? event.assignedStaff.some(
            (staff) => staff.staffId === staffId
          )
        : false
    )
    .sort(compareByStart);

  const today = assigned.filter(
    (event) => isToday(event.date)
  );

  const upcoming = assigned.filter(
    (event) =>
      !isToday(event.date) &&
      event.date > todayISO()
  );

  const past = assigned
    .filter(
      (event) => event.date < todayISO()
    )
    .sort(
      (a, b) => compareByStart(b, a)
    );

  return clone({
    today,
    upcoming,
    assigned,
    past,
  });
}

/* -----------------------------------------------------------------------------
   Dashboard
   -------------------------------------------------------------------------- */

export interface MarketingDashboardData {
  upcoming: MarketingEvent[];
  thisWeek: MarketingEvent[];
  live: MarketingEvent[];
  recentlyCompleted: MarketingEvent[];
  counts: {
    upcoming: number;
    thisWeek: number;
    completed: number;
    total: number;
  };
}

export async function getDashboardData(): Promise<MarketingDashboardData> {
  await simulateLatency();

  const events = getDb().marketingEvents;

  const withStatus = events.map((event) => ({
    event,
    status: deriveEventStatus(event),
  }));

  const upcoming = withStatus
    .filter(
      (item) => item.status === "upcoming"
    )
    .map(
      (item) => item.event
    )
    .sort(compareByStart);

  const live = withStatus
    .filter(
      (item) => item.status === "live"
    )
    .map(
      (item) => item.event
    )
    .sort(compareByStart);

  const thisWeek = upcoming.filter(
    (event) => isWithinNextDays(event.date, 7)
  );

  const recentlyCompleted = withStatus
    .filter(
      (item) => item.status === "completed"
    )
    .map(
      (item) => item.event
    )
    .sort(
      (a, b) => compareByStart(b, a)
    )
    .slice(0, 5);

  return clone({
    upcoming: upcoming.slice(0, 6),
    thisWeek,
    live,
    recentlyCompleted,
    counts: {
      upcoming: upcoming.length,
      thisWeek: thisWeek.length,
      completed: withStatus.filter(
        (item) => item.status === "completed"
      ).length,
      total: events.length,
    },
  });
}

/* -----------------------------------------------------------------------------
   Mutations
   -------------------------------------------------------------------------- */

function buildAssignedStaff(
  staffIds: string[]
): AssignedStaff[] {
  const assignedAt = new Date().toISOString();

  return staffIds
    .map((staffId) => {
      const member = getStaffMember(staffId);

      if (!member) {
        return null;
      }

      return {
        staffId: member.id,
        name: member.name,
        department: member.department,
        initials: member.initials,
        assignedAt,
      } satisfies AssignedStaff;
    })
    .filter(
      (value): value is AssignedStaff => value !== null
    );
}

function normaliseDriver(
  driver: MarketingEventInput["driver"]
): MarketingEvent["driver"] {
  if (!driver) {
    return undefined;
  }

  const name = driver.name.trim();
  const phone = driver.phone.trim();

  if (!name && !phone) {
    return undefined;
  }

  return {
    name,
    phone,
  };
}

export async function createEvent(
  input: MarketingEventInput,
  createdByUserId: string
): Promise<MarketingEvent> {
  await simulateLatency();

  const now = new Date().toISOString();
  const id = createId("mk");

  const event: MarketingEvent = {
    id,
    name: input.name.trim(),
    type: input.type,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    departureTime:
      input.departureTime?.trim() || undefined,
    location: {
      emirate: input.location.emirate,
      venueName: input.location.venueName.trim(),
      mapUrl:
        input.location.mapUrl?.trim() || undefined,
    },
    description:
      input.description?.trim() || undefined,
    status: "upcoming",
    assignedStaff: buildAssignedStaff(
      input.assignedStaffIds
    ),
    driver: normaliseDriver(input.driver),
    publicRegistrationCode: registrationCode(id),
    createdAt: now,
    updatedAt: now,
    createdByUserId,
  };

  mutate((db) => {
    db.marketingEvents.push(event);
  });

  return clone(event);
}

export function canEditEvent(
  event: MarketingEvent
): boolean {
  return EDITABLE_STATUSES.includes(
    deriveEventStatus(event)
  );
}

export function canDeleteEvent(
  event: MarketingEvent
): boolean {
  return DELETABLE_STATUSES.includes(
    deriveEventStatus(event)
  );
}

export async function updateEvent(
  id: string,
  input: MarketingEventInput
): Promise<MarketingEvent> {
  await simulateLatency();

  return clone(
    mutate((db) => {
      const event = db.marketingEvents.find(
        (item) => item.id === id
      );

      if (!event) {
        throw new Error("Event not found.");
      }

      if (!canEditEvent(event)) {
        throw new Error(
          "Only upcoming or cancelled events can be edited. Completed events are preserved."
        );
      }

      event.name = input.name.trim();
      event.type = input.type;
      event.date = input.date;
      event.startTime = input.startTime;
      event.endTime = input.endTime;
      event.departureTime =
        input.departureTime?.trim() || undefined;

      event.location = {
        emirate: input.location.emirate,
        venueName: input.location.venueName.trim(),
        mapUrl:
          input.location.mapUrl?.trim() || undefined,
      };

      event.description =
        input.description?.trim() || undefined;

      event.assignedStaff = buildAssignedStaff(
        input.assignedStaffIds
      );

      event.driver = normaliseDriver(input.driver);

      event.updatedAt =
        new Date().toISOString();

      return event;
    })
  );
}

/** Deletes the event and every registration, attendance and feedback record. */
export async function deleteEvent(
  id: string
): Promise<void> {
  await simulateLatency();

  mutate((db) => {
    const event = db.marketingEvents.find(
      (item) => item.id === id
    );

    if (!event) {
      throw new Error("Event not found.");
    }

    if (!canDeleteEvent(event)) {
      throw new Error(
        "Only upcoming or cancelled events can be deleted. Completed events are preserved."
      );
    }

    const registrationIds =
      db.marketingRegistrations
        .filter(
          (item) => item.eventId === id
        )
        .map(
          (item) => item.id
        );

    const registrantIds =
      db.marketingRegistrations
        .filter(
          (item) => item.eventId === id
        )
        .map(
          (item) => item.registrantId
        );

    db.marketingEvents =
      db.marketingEvents.filter(
        (item) => item.id !== id
      );

    db.marketingRegistrations =
      db.marketingRegistrations.filter(
        (item) => item.eventId !== id
      );

    db.marketingAttendance =
      db.marketingAttendance.filter(
        (item) =>
          !registrationIds.includes(
            item.registrationId
          )
      );

    db.staffFeedback =
      db.staffFeedback.filter(
        (item) => item.eventId !== id
      );

    /* A prospect with no remaining registration is removed too. */
    db.marketingRegistrants =
      db.marketingRegistrants.filter(
        (registrant) =>
          !registrantIds.includes(registrant.id) ||
          db.marketingRegistrations.some(
            (item) =>
              item.registrantId === registrant.id
          )
      );
  });
}

export async function cancelEvent(
  id: string
): Promise<MarketingEvent> {
  await simulateLatency();

  return clone(
    mutate((db) => {
      const event = db.marketingEvents.find(
        (item) => item.id === id
      );

      if (!event) {
        throw new Error("Event not found.");
      }

      event.status = "cancelled";
      event.updatedAt =
        new Date().toISOString();

      return event;
    })
  );
}