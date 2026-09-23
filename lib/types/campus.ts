import type {
  CampusLocation,
  EventStatus,
  ISODate,
  ISODateTime,
  TimeString,
} from "./common";

/* =============================================================================
   Internal AURAK people.

   These are existing university members. In production they come from EUMS.
   They NEVER type their own profile information into this app.
   Keep this model entirely separate from MarketingRegistrant.
   ========================================================================== */

export type CampusUserType = "student" | "staff" | "faculty";

export interface College {
  id: string;
  name: string;
  shortName: string;
}

export interface Department {
  id: string;
  name: string;
  collegeId: string;
}

export interface Program {
  id: string;
  name: string;
  departmentId: string;
  collegeId: string;
}

export interface HostingDepartment {
  id: string;
  name: string;
}

export interface CampusUser {
  id: string;
  eumsId: string;
  fullName: string;
  email: string;
  userType: CampusUserType;
  initials: string;

  collegeId?: string;
  departmentId?: string;
  programId?: string;
  yearOfStudy?: number;
}

export interface CampusUserSummary {
  id: string;
  fullName: string;
  eumsId: string;
  userType: CampusUserType;
  collegeName?: string;
  departmentName?: string;
  programName?: string;
  initials: string;
}

/* =============================================================================
   Target Audience

   BUSINESS RULE: this controls WHO RECEIVES THE NOTIFICATION only.
   Every published event is visible to every internal AURAK user.
   ========================================================================== */

export interface TargetAudience {
  userTypes: CampusUserType[];
  collegeIds: string[];
  departmentIds: string[];
  programIds: string[];
}

/* =============================================================================
   Campus Event
   ========================================================================== */

export interface CampusEvent {
  id: string;
  name: string;
  description?: string;

  date: ISODate;
  startTime: TimeString;
  endTime: TimeString;

  location: CampusLocation;
  hostingDepartmentId: string;
  hostingDepartmentName: string;

  targetAudience: TargetAudience;

  status: EventStatus;

  showAverageRatingToUsers: boolean;

  coverImageUrl?: string;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  createdByUserId: string;
  archivedAt?: ISODateTime;
  cancelledAt?: ISODateTime;
}

export interface CampusEventInput {
  name: string;
  description?: string;
  date: ISODate;
  startTime: TimeString;
  endTime: TimeString;
  location: CampusLocation;
  hostingDepartmentId: string;
  targetAudience: TargetAudience;
  showAverageRatingToUsers: boolean;
}

/* =============================================================================
   RSVP

   RSVP IS NOT ATTENDANCE.
   ========================================================================== */

export type RSVPStatus = "yes" | "maybe" | "no";

export interface CampusRsvp {
  id: string;
  eventId: string;
  userId: string;
  status: RSVPStatus;
  respondedAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface RsvpBreakdown {
  yes: number;
  maybe: number;
  no: number;
  totalResponses: number;
}

/* =============================================================================
   QR ticket
   ========================================================================== */

export interface CampusEventTicket {
  id: string;
  eventId: string;
  userId: string;
  qrCode: string;
  issuedAt: ISODateTime;
}

/* =============================================================================
   Attendance
   ========================================================================== */

export type CheckInMethod = "qr" | "manual";

export interface CampusAttendance {
  id: string;
  eventId: string;
  userId: string;
  checkedIn: boolean;
  checkedInAt: ISODateTime | null;
  checkedInByStaffId: string | null;
  method: CheckInMethod | null;
}

export interface CampusAttendeeRow {
  user: CampusUserSummary;
  rsvpStatus: RSVPStatus | null;
  checkedIn: boolean;
  checkedInAt: ISODateTime | null;
}

export type CampusScanResult =
  | {
      outcome: "ready_to_check_in";
      user: CampusUserSummary;
      rsvpStatus: RSVPStatus | null;
    }
  | {
      outcome: "already_checked_in";
      user: CampusUserSummary;
      rsvpStatus: RSVPStatus | null;
      checkedInAt: ISODateTime;
    }
  | {
      outcome: "invalid_code";
      scannedValue: string;
    }
  | {
      outcome: "wrong_event";
      scannedValue: string;
      belongsToEventName: string;
    };

/* =============================================================================
   Gallery
   ========================================================================== */

export type GalleryStatus = "empty" | "active" | "archived";

export interface EventPhoto {
  id: string;
  eventId: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  uploadedAt: ISODateTime;
  uploadedByUserId: string;
}

export interface EventGallery {
  eventId: string;
  status: GalleryStatus;
  photos: EventPhoto[];
  publishedAt: ISODateTime | null;
  archivesOn: ISODate | null;
}

/* =============================================================================
   Ratings
   ========================================================================== */

export interface EventRating {
  id: string;
  eventId: string;
  userId: string;
  stars: number;
  comment?: string;
  suggestion?: string;
  submittedAt: ISODateTime;
}

export interface RatingSummary {
  average: number;
  count: number;
  distribution: [number, number, number, number, number];
}