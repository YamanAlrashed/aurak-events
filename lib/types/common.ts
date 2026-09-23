/* =============================================================================
   Shared primitives used by both Campus Events and Marketing.
   ========================================================================== */

/** Calendar date, no time. Example: "2026-10-14" */
export type ISODate = string;

/** Full timestamp. Example: "2026-10-14T09:30:00.000Z" */
export type ISODateTime = string;

/** 24-hour clock time, no date. Example: "14:30" */
export type TimeString = string;

/** The two top-level products in the platform. */
export type AppModule = "campus-events" | "marketing";

/* -----------------------------------------------------------------------------
   Event lifecycle
   -------------------------------------------------------------------------- */

export type EventStatus =
  | "upcoming"
  | "live"
  | "completed"
  | "archived"
  | "cancelled";

/* -----------------------------------------------------------------------------
   Location
   -------------------------------------------------------------------------- */

export interface CampusBuildingOption {
  id: string;
  name: string;
  campus?: string;
}

export interface CampusLocation {
  buildingId: string;
  buildingName: string;
  room?: string;
  locationName?: string;
}

/* -----------------------------------------------------------------------------
   Notifications
   -------------------------------------------------------------------------- */

export type NotificationType =
  | "new_event"
  | "event_reminder"
  | "photos_available";

export interface AppNotification {
  id: string;
  recipientUserId: string;
  module: AppModule;
  type: NotificationType;
  title: string;
  body: string;
  eventId?: string;
  href?: string;
  createdAt: ISODateTime;
  read: boolean;
}

/* -----------------------------------------------------------------------------
   Small helpers used across forms, filters and services
   -------------------------------------------------------------------------- */

export interface Option<TValue extends string = string> {
  value: TValue;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface CountBucket {
  id: string;
  label: string;
  count: number;
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export type LoadState = "idle" | "loading" | "ready" | "error";

export type SortDirection = "asc" | "desc";