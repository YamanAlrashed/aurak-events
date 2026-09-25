import type {
  CRMStatus,
  MarketingAttendance,
  MarketingRegistrant,
  MarketingRegistrantInput,
  MarketingRegistration,
  MarketingRegistrationDetail,
  MarketingScanResult,
  RegistrationType,
} from "@/lib/types";
import { clone, getDb, mutate, simulateLatency } from "@/lib/data/store";
import {
  createId,
  marketingQrCode,
} from "@/lib/utils/id";
import {
  getIntakeLabel,
  getProgramOfInterestName,
} from "@/lib/data/marketing-reference";
import { resolveStatus } from "@/lib/services/mockCrmService";

/* =============================================================================
   MARKETING REGISTRATION SERVICE

   PRE-REGISTRATION  - online, before the event, via the public link.
                       Never asks for a guest count.

   WALK-IN           - at the event, via the public QR or by staff.
                       Asks for the number of guests.

   Either way the QR code is unique to registrant + event.

   These people are EXTERNAL prospects. They have no AURAK account and are
   never treated as authenticated campus users.
   ========================================================================== */

function buildDetail(
  registration: MarketingRegistration
): MarketingRegistrationDetail | null {
  const db = getDb();

  const registrant =
    db.marketingRegistrants.find(
      (item) =>
        item.id === registration.registrantId
    );

  if (!registrant) {
    return null;
  }

  const attendance =
    db.marketingAttendance.find(
      (item) =>
        item.registrationId === registration.id
    ) ?? null;

  return {
    registration,
    registrant,
    programOfInterestName:
      getProgramOfInterestName(
        registrant.programOfInterestId
      ),
    intakeLabel:
      getIntakeLabel(registrant.intakeId),
    attendance,
  };
}

/* -----------------------------------------------------------------------------
   Creating registrations
   -------------------------------------------------------------------------- */

export interface RegistrationResult {
  registration: MarketingRegistration;
  registrant: MarketingRegistrant;
  /** New Lead means the prospect was not found in the CRM. */
  crmStatus: CRMStatus;
}

async function createRegistration(
  eventId: string,
  input: MarketingRegistrantInput,
  registrationType: RegistrationType,
  declaredGuestCount?: number
): Promise<RegistrationResult> {
  const now = new Date().toISOString();

  /* CRM resolution happens once, at creation, and is stored on the record. */
  const crmStatus = await resolveStatus({
    email: input.email,
    phone: input.phone,
  });

  const registrantId = createId("mr");
  const registrationId = createId("mrg");

  const registrant: MarketingRegistrant = {
    id: registrantId,
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    programOfInterestId:
      input.programOfInterestId,
    intakeId: input.intakeId,
    /* The form guarantees a value before submit; "" can never reach here. */
    emirate:
      input.emirate === ""
        ? "other"
        : input.emirate,
    createdAt: now,
  };

  const registration: MarketingRegistration = {
    id: registrationId,
    eventId,
    registrantId,
    registrationType,
    qrCode: marketingQrCode(
      eventId,
      registrationId
    ),
    registeredAt: now,
    crmStatus,
    declaredGuestCount,
  };

  mutate((db) => {
    db.marketingRegistrants.push(registrant);
    db.marketingRegistrations.push(registration);
  });

  return clone({
    registration,
    registrant,
    crmStatus,
  });
}

/** Online pre-registration. No guest count is collected. */
export async function preRegister(
  eventId: string,
  input: MarketingRegistrantInput
): Promise<RegistrationResult> {
  await simulateLatency(600);

  return createRegistration(
    eventId,
    input,
    "pre_registered"
  );
}

/** Walk-in registration, which does collect a guest count. */
export async function registerWalkIn(
  eventId: string,
  input: MarketingRegistrantInput,
  guestCount: number
): Promise<RegistrationResult> {
  await simulateLatency(600);

  return createRegistration(
    eventId,
    input,
    "walk_in",
    Math.max(
      0,
      Math.round(guestCount)
    )
  );
}

/* -----------------------------------------------------------------------------
   Reading
   -------------------------------------------------------------------------- */

export interface RegistrationFilter {
  search?: string;
  registrationType?:
    | RegistrationType
    | "all";
  crmStatus?:
    | CRMStatus
    | "all";
  attendance?:
    | "all"
    | "attended"
    | "not_attended";
}

export async function listRegistrations(
  eventId: string,
  filter: RegistrationFilter = {}
): Promise<MarketingRegistrationDetail[]> {
  await simulateLatency();

  const {
    search = "",
    registrationType = "all",
    crmStatus = "all",
    attendance = "all",
  } = filter;

  const needle =
    search.trim().toLowerCase();

  const details = getDb()
    .marketingRegistrations.filter(
      (item) => item.eventId === eventId
    )
    .map(buildDetail)
    .filter(
      (
        value
      ): value is MarketingRegistrationDetail =>
        value !== null
    )
    .filter((detail) => {
      if (
        registrationType !== "all" &&
        detail.registration.registrationType !==
          registrationType
      ) {
        return false;
      }

      if (
        crmStatus !== "all" &&
        detail.registration.crmStatus !== crmStatus
      ) {
        return false;
      }

      const checkedIn = Boolean(
        detail.attendance?.checkedIn
      );

      if (
        attendance === "attended" &&
        !checkedIn
      ) {
        return false;
      }

      if (
        attendance === "not_attended" &&
        checkedIn
      ) {
        return false;
      }

      if (!needle) {
        return true;
      }

      return (
        detail.registrant.fullName
          .toLowerCase()
          .includes(needle) ||
        detail.registrant.email
          .toLowerCase()
          .includes(needle) ||
        detail.registrant.phone
          .toLowerCase()
          .includes(needle)
      );
    })
    .sort(
      (a, b) =>
        a.registrant.fullName.localeCompare(
          b.registrant.fullName
        )
    );

  return clone(details);
}

export async function getRegistrationDetail(
  registrationId: string
): Promise<MarketingRegistrationDetail | null> {
  await simulateLatency(120);

  const registration =
    getDb().marketingRegistrations.find(
      (item) =>
        item.id === registrationId
    );

  if (!registration) {
    return null;
  }

  const detail =
    buildDetail(registration);

  return detail
    ? clone(detail)
    : null;
}

/** Quick search for the staff screen. */
export async function searchRegistrations(
  eventId: string,
  query: string
): Promise<MarketingRegistrationDetail[]> {
  await simulateLatency(200);

  if (!query.trim()) {
    return [];
  }

  const result =
    await listRegistrations(
      eventId,
      {
        search: query,
      }
    );

  return result.slice(0, 20);
}

/* -----------------------------------------------------------------------------
   Editing

   Staff may correct a prospect's details at check-in — a phone number typed in
   a hurry on a tablet is the common case.
   -------------------------------------------------------------------------- */

export async function updateRegistrant(
  registrantId: string,
  input: MarketingRegistrantInput
): Promise<MarketingRegistrant> {
  await simulateLatency(350);

  return clone(
    mutate((db) => {
      const registrant =
        db.marketingRegistrants.find(
          (item) =>
            item.id === registrantId
        );

      if (!registrant) {
        throw new Error(
          "Registrant not found."
        );
      }

      registrant.fullName =
        input.fullName.trim();

      registrant.phone =
        input.phone.trim();

      registrant.email =
        input.email.trim();

      registrant.programOfInterestId =
        input.programOfInterestId;

      registrant.intakeId =
        input.intakeId;

      if (input.emirate !== "") {
        registrant.emirate =
          input.emirate;
      }

      return registrant;
    })
  );
}

/* -----------------------------------------------------------------------------
   Scanning
   -------------------------------------------------------------------------- */

export async function scanCode(
  eventId: string,
  scannedValue: string
): Promise<MarketingScanResult> {
  await simulateLatency(400);

  const db = getDb();

  const normalised =
    scannedValue.trim().toUpperCase();

  const registration =
    db.marketingRegistrations.find(
      (item) =>
        item.qrCode.toUpperCase() ===
        normalised
    );

  if (!registration) {
    return {
      outcome: "invalid_code",
      scannedValue,
    };
  }

  if (
    registration.eventId !== eventId
  ) {
    const otherEvent =
      db.marketingEvents.find(
        (item) =>
          item.id ===
          registration.eventId
      );

    return {
      outcome: "wrong_event",
      scannedValue,
      belongsToEventName:
        otherEvent?.name ??
        "another event",
    };
  }

  const detail =
    buildDetail(registration);

  if (!detail) {
    return {
      outcome: "invalid_code",
      scannedValue,
    };
  }

  const attendance:
    MarketingAttendance | null =
    detail.attendance;

  if (
    attendance?.checkedIn &&
    attendance.checkedInAt
  ) {
    return clone({
      outcome:
        "already_checked_in",
      detail,
      checkedInAt:
        attendance.checkedInAt,
      visitorCount:
        attendance.visitorCount,
    });
  }

  return clone({
    outcome: "ready_to_check_in",
    detail,
  });
}

/** Sample codes for the mock scanner on the staff screen. */
export async function getScanSamples(
  eventId: string
): Promise<
  Array<{
    code: string;
    label: string;
    hint: string;
  }>
> {
  await simulateLatency(120);

  const db = getDb();

  const registrations =
    db.marketingRegistrations.filter(
      (item) =>
        item.eventId === eventId
    );

  const samples: Array<{
    code: string;
    label: string;
    hint: string;
  }> = [];

  function nameOf(
    registration: MarketingRegistration
  ): string {
    return (
      db.marketingRegistrants.find(
        (item) =>
          item.id ===
          registration.registrantId
      )?.fullName ?? "Registrant"
    );
  }

  const pending =
    registrations.find(
      (registration) => {
        const attendance =
          db.marketingAttendance.find(
            (item) =>
              item.registrationId ===
              registration.id
          );

        return !attendance?.checkedIn;
      }
    );

  const done =
    registrations.find(
      (registration) => {
        const attendance =
          db.marketingAttendance.find(
            (item) =>
              item.registrationId ===
              registration.id
          );

        return attendance?.checkedIn;
      }
    );

  if (pending) {
    samples.push({
      code: pending.qrCode,
      label: nameOf(pending),
      hint: "Not checked in yet",
    });
  }

  if (done) {
    samples.push({
      code: done.qrCode,
      label: nameOf(done),
      hint:
        "Already checked in — duplicate scan",
    });
  }

  samples.push({
    code:
      "AURAK-MK-INVALID-CODE",
    label: "Unrecognised code",
    hint:
      "Demonstrates an invalid scan",
  });

  return samples;
}