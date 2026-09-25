import type {
  CampusEventTicket,
  CampusRsvp,
  RSVPStatus,
  RsvpBreakdown,
} from "@/lib/types";
import {
  clone,
  getDb,
  mutate,
  simulateLatency,
} from "@/lib/data/store";
import { campusQrCode } from "@/lib/utils/id";

export async function getRsvpForUser(
  eventId: string,
  userId: string
): Promise<CampusRsvp | null> {
  await simulateLatency(100);

  const rsvp =
    getDb().campusRsvps.find(
      (item) =>
        item.eventId ===
          eventId &&
        item.userId === userId
    );

  return rsvp
    ? clone(rsvp)
    : null;
}

export async function getRsvpsForUser(
  userId: string
): Promise<CampusRsvp[]> {
  await simulateLatency();

  return clone(
    getDb().campusRsvps.filter(
      (item) =>
        item.userId === userId
    )
  );
}

export async function getBreakdown(
  eventId: string
): Promise<RsvpBreakdown> {
  await simulateLatency(
    120
  );

  const rsvps =
    getDb().campusRsvps.filter(
      (item) =>
        item.eventId ===
        eventId
    );

  const yes =
    rsvps.filter(
      (item) =>
        item.status === "yes"
    ).length;

  const maybe =
    rsvps.filter(
      (item) =>
        item.status ===
        "maybe"
    ).length;

  const no =
    rsvps.filter(
      (item) =>
        item.status === "no"
    ).length;

  return {
    yes,
    maybe,
    no,
    totalResponses:
      yes + maybe + no,
  };
}

export async function getBreakdowns(
  eventIds: string[]
): Promise<
  Record<
    string,
    RsvpBreakdown
  >
> {
  await simulateLatency(
    120
  );

  const result: Record<
    string,
    RsvpBreakdown
  > = {};

  for (
    const eventId
    of eventIds
  ) {
    const rsvps =
      getDb().campusRsvps.filter(
        (item) =>
          item.eventId ===
          eventId
      );

    const yes =
      rsvps.filter(
        (item) =>
          item.status ===
          "yes"
      ).length;

    const maybe =
      rsvps.filter(
        (item) =>
          item.status ===
          "maybe"
      ).length;

    const no =
      rsvps.filter(
        (item) =>
          item.status ===
          "no"
      ).length;

    result[eventId] = {
      yes,
      maybe,
      no,
      totalResponses:
        yes +
        maybe +
        no,
    };
  }

  return result;
}

export async function setRsvp(
  eventId: string,
  userId: string,
  status: RSVPStatus
): Promise<{
  rsvp: CampusRsvp;
  ticket:
    CampusEventTicket | null;
}> {
  await simulateLatency(
    200
  );

  const now =
    new Date().toISOString();

  return clone(
    mutate((db) => {
      let rsvp =
        db.campusRsvps.find(
          (item) =>
            item.eventId ===
              eventId &&
            item.userId ===
              userId
        );

      if (rsvp) {
        rsvp.status =
          status;

        rsvp.updatedAt =
          now;
      } else {
        rsvp = {
          id: `rsvp-${eventId}-${userId}`,
          eventId,
          userId,
          status,
          respondedAt:
            now,
          updatedAt: now,
        };

        db.campusRsvps.push(
          rsvp
        );
      }

      let ticket:
        CampusEventTicket | null =
        null;

      if (
        status === "no"
      ) {
        db.campusTickets =
          db.campusTickets.filter(
            (item) =>
              !(
                item.eventId ===
                  eventId &&
                item.userId ===
                  userId
              )
          );
      } else {
        const existing =
          db.campusTickets.find(
            (item) =>
              item.eventId ===
                eventId &&
              item.userId ===
                userId
          );

        if (existing) {
          ticket =
            existing;
        } else {
          ticket = {
            id: `tk-${eventId}-${userId}`,
            eventId,
            userId,

            qrCode:
              campusQrCode(
                eventId,
                userId
              ),

            issuedAt:
              now,
          };

          db.campusTickets.push(
            ticket
          );
        }
      }

      return {
        rsvp,
        ticket,
      };
    })
  );
}

export async function getTicket(
  eventId: string,
  userId: string
): Promise<
  CampusEventTicket | null
> {
  await simulateLatency(
    100
  );

  const ticket =
    getDb().campusTickets.find(
      (item) =>
        item.eventId ===
          eventId &&
        item.userId ===
          userId
    );

  return ticket
    ? clone(ticket)
    : null;
}