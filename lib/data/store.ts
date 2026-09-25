import type {
  AppNotification,
  CampusAttendance,
  CampusEvent,
  CampusEventTicket,
  CampusRsvp,
  EventPhoto,
  EventRating,
  MarketingAttendance,
  MarketingEvent,
  MarketingRegistrant,
  MarketingRegistration,
  StaffFeedback,
} from "@/lib/types";
import {
  buildCampusSeed,
  ensureDemoUserState,
  type GalleryRecord,
} from "@/lib/data/seed/campus-seed";
import { buildMarketingSeed } from "@/lib/data/seed/marketing-seed";
import {
  readJson,
  removeKey,
  writeJson,
} from "@/lib/utils/storage";
import { MOCK_LATENCY_MS } from "@/lib/utils/constants";

export type {
  GalleryRecord,
};

export interface MockDatabase {
  schemaVersion: number;

  campusEvents:
    CampusEvent[];

  campusRsvps:
    CampusRsvp[];

  campusTickets:
    CampusEventTicket[];

  campusAttendance:
    CampusAttendance[];

  galleries:
    GalleryRecord[];

  eventPhotos:
    EventPhoto[];

  eventRatings:
    EventRating[];

  notifications:
    AppNotification[];

  marketingEvents:
    MarketingEvent[];

  marketingRegistrants:
    MarketingRegistrant[];

  marketingRegistrations:
    MarketingRegistration[];

  marketingAttendance:
    MarketingAttendance[];

  staffFeedback:
    StaffFeedback[];
}

const DB_STORAGE_KEY =
  "aurak.mock-db.v1";

const SCHEMA_VERSION = 1;

let database:
  MockDatabase | null = null;

function emptyDatabase(): MockDatabase {
  return {
    schemaVersion:
      SCHEMA_VERSION,

    campusEvents: [],
    campusRsvps: [],
    campusTickets: [],
    campusAttendance: [],
    galleries: [],
    eventPhotos: [],
    eventRatings: [],
    notifications: [],

    marketingEvents: [],
    marketingRegistrants: [],
    marketingRegistrations: [],
    marketingAttendance: [],
    staffFeedback: [],
  };
}

function buildSeededDatabase(): MockDatabase {
  const campus =
    ensureDemoUserState(
      buildCampusSeed()
    );

  const marketing =
    buildMarketingSeed();

  return {
    schemaVersion:
      SCHEMA_VERSION,

    campusEvents:
      campus.campusEvents,

    campusRsvps:
      campus.campusRsvps,

    campusTickets:
      campus.campusTickets,

    campusAttendance:
      campus.campusAttendance,

    galleries:
      campus.galleries,

    eventPhotos:
      campus.eventPhotos,

    eventRatings:
      campus.eventRatings,

    notifications: [],

    marketingEvents:
      marketing.marketingEvents,

    marketingRegistrants:
      marketing.marketingRegistrants,

    marketingRegistrations:
      marketing.marketingRegistrations,

    marketingAttendance:
      marketing.marketingAttendance,

    staffFeedback:
      marketing.staffFeedback,
  };
}

function persist(): void {
  if (
    !database ||
    typeof window ===
      "undefined"
  ) {
    return;
  }

  writeJson(
    DB_STORAGE_KEY,
    database
  );
}

function load(): MockDatabase {
  if (database) {
    return database;
  }

  if (
    typeof window ===
    "undefined"
  ) {
    return emptyDatabase();
  }

  const stored =
    readJson<MockDatabase>(
      DB_STORAGE_KEY
    );

  if (
    stored &&
    stored.schemaVersion ===
      SCHEMA_VERSION
  ) {
    database = stored;
  } else {
    database =
      buildSeededDatabase();

    persist();
  }

  return database;
}

export function getDb(): MockDatabase {
  return load();
}

export function mutate<T>(
  change: (
    db: MockDatabase
  ) => T
): T {
  const db = load();

  const result =
    change(db);

  persist();

  return result;
}

export function isSeeded(): boolean {
  return (
    typeof window !==
      "undefined" &&
    load().campusEvents
      .length > 0
  );
}

export function resetMockData(): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  removeKey(
    DB_STORAGE_KEY
  );

  database =
    buildSeededDatabase();

  persist();
}

export function simulateLatency(
  ms: number =
    MOCK_LATENCY_MS
): Promise<void> {
  return new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        ms
      )
  );
}

export function clone<T>(
  value: T
): T {
  return JSON.parse(
    JSON.stringify(value)
  ) as T;
}