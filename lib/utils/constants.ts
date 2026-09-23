import type {
  CRMStatus,
  EventStatus,
  NotificationType,
  RegistrationType,
  RSVPStatus,
  UserRole,
} from "@/lib/types";

/* =============================================================================
   Platform constants
   ========================================================================== */

export const APP_NAME = "AURAK Events & Marketing";
export const UNIVERSITY_NAME = "American University of Ras Al Khaimah";

/* -----------------------------------------------------------------------------
   MOCK AUTHENTICATION

   WARNING: prototype only. A shared plaintext password compared in the browser
   is not authentication and provides no security whatsoever. It exists so the
   frontend can be demonstrated before AURAK SSO / EUMS is connected, and it
   must be deleted when real authentication is introduced.
   -------------------------------------------------------------------------- */

export const MOCK_PASSWORD = "Aurak";

/** localStorage key holding the mock session. Not a credential store. */
export const SESSION_STORAGE_KEY = "aurak.mock-session.v1";

/** Simulated network latency for mock services, in milliseconds. */
export const MOCK_LATENCY_MS = 350;

/* -----------------------------------------------------------------------------
   Routing
   -------------------------------------------------------------------------- */

export const ROLE_HOME_ROUTES: Record<UserRole, string> = {
  campus_admin: "/campus-events/admin",
  campus_staff: "/campus-events/staff",
  campus_user: "/campus-events/user",
  marketing_admin: "/marketing/admin",
  marketing_staff: "/marketing/staff",
};

export const LOGIN_ROUTE = "/";

export const ROLE_LABELS: Record<UserRole, string> = {
  campus_admin: "Campus Events Admin",
  campus_staff: "Campus Events Staff",
  campus_user: "AURAK Member",
  marketing_admin: "Marketing Admin",
  marketing_staff: "Marketing Staff",
};

/* -----------------------------------------------------------------------------
   Event status

   badgeClass values map onto the classes already defined in globals.css.
   -------------------------------------------------------------------------- */

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  upcoming: "Upcoming",
  live: "Live",
  completed: "Completed",
  archived: "Archived",
  cancelled: "Cancelled",
};

export const EVENT_STATUS_BADGE_CLASS: Record<EventStatus, string> = {
  upcoming: "badge-upcoming",
  live: "badge-live",
  completed: "badge-completed",
  archived: "badge-archived",
  cancelled: "badge-cancelled",
};

/** Statuses an admin is allowed to edit or delete. */
export const EDITABLE_STATUSES: EventStatus[] = ["upcoming", "cancelled"];
export const DELETABLE_STATUSES: EventStatus[] = ["upcoming", "cancelled"];

/* -----------------------------------------------------------------------------
   RSVP
   -------------------------------------------------------------------------- */

export const RSVP_LABELS: Record<RSVPStatus, string> = {
  yes: "Yes",
  maybe: "Maybe",
  no: "No",
};

export const RSVP_BADGE_CLASS: Record<RSVPStatus, string> = {
  yes: "badge-success",
  maybe: "badge-warning",
  no: "badge-neutral",
};

/** RSVP answers that issue a QR code. "no" does not. */
export const RSVP_WITH_QR: RSVPStatus[] = ["yes", "maybe"];

/* -----------------------------------------------------------------------------
   Gallery
   -------------------------------------------------------------------------- */

/** Galleries stay browsable this long before becoming archived. */
export const GALLERY_ACTIVE_MONTHS = 24;

/* -----------------------------------------------------------------------------
   Notifications
   -------------------------------------------------------------------------- */

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  new_event: "New Event",
  event_reminder: "Reminder",
  photos_available: "Photos Available",
};

/* -----------------------------------------------------------------------------
   Marketing CRM

   new_lead means the registrant was not found in the CRM.
   -------------------------------------------------------------------------- */

export const CRM_STATUS_LABELS: Record<CRMStatus, string> = {
  enrolled: "Enrolled",
  accepted: "Accepted",
  admitted: "Admitted",
  lead: "Lead",
  new_lead: "New Lead",
};

/** Display order: furthest along the funnel first. */
export const CRM_STATUS_ORDER: CRMStatus[] = [
  "enrolled",
  "accepted",
  "admitted",
  "lead",
  "new_lead",
];

export const CRM_STATUS_BADGE_CLASS: Record<CRMStatus, string> = {
  enrolled: "badge-success",
  accepted: "badge-info",
  admitted: "badge-brand",
  lead: "badge-warning",
  new_lead: "badge-neutral",
};

/* -----------------------------------------------------------------------------
   Registration type
   -------------------------------------------------------------------------- */

export const REGISTRATION_TYPE_LABELS: Record<RegistrationType, string> = {
  pre_registered: "Pre-registered",
  walk_in: "Walk-in",
};

export const REGISTRATION_TYPE_BADGE_CLASS: Record<RegistrationType, string> = {
  pre_registered: "badge-info",
  walk_in: "badge-brand",
};

/** Maximum guests selectable in the walk-in numeric stepper. */
export const MAX_GUESTS = 10;