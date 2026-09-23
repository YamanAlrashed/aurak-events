import type {
  CountBucket,
  EventStatus,
  ISODate,
  ISODateTime,
  TimeString,
} from "./common";

/* =============================================================================
   Marketing events target PROSPECTIVE students and their guests.
   Nothing here shares a person model with Campus Events.
   ========================================================================== */

export type MarketingEventType =
  | "open_day"
  | "school_visit"
  | "school_workshop"
  | "exhibition"
  | "information_session"
  | "other";

export type Emirate =
  | "ras_al_khaimah"
  | "dubai"
  | "sharjah"
  | "abu_dhabi"
  | "ajman"
  | "umm_al_quwain"
  | "fujairah"
  | "al_ain"
  | "other";

export interface MarketingLocation {
  emirate: Emirate;
  venueName: string;
  mapUrl?: string;
}

/* =============================================================================
   Staff assignment
   ========================================================================== */

export type StaffDepartment =
  | "admission"
  | "student_recruitment"
  | "call_center";

export interface MarketingStaffMember {
  id: string;
  name: string;
  department: StaffDepartment;
  email?: string;
  phone?: string;
  initials: string;
}

export interface AssignedStaff {
  staffId: string;
  name: string;
  department: StaffDepartment;
  initials: string;
  assignedAt: ISODateTime;
}

export interface DriverDetails {
  name: string;
  phone: string;
}

/* =============================================================================
   Marketing Event
   ========================================================================== */

export interface MarketingEvent {
  id: string;
  name: string;
  type: MarketingEventType;

  date: ISODate;
  startTime: TimeString;
  endTime: TimeString;
  departureTime?: TimeString;

  location: MarketingLocation;
  description?: string;

  status: EventStatus;

  assignedStaff: AssignedStaff[];
  driver?: DriverDetails;

  publicRegistrationCode: string;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  createdByUserId: string;
}

export interface MarketingEventInput {
  name: string;
  type: MarketingEventType;
  date: ISODate;
  startTime: TimeString;
  endTime: TimeString;
  departureTime?: string;
  location: MarketingLocation;
  description?: string;
  assignedStaffIds: string[];
  driver?: DriverDetails;
}

/* =============================================================================
   Prospective registrant
   ========================================================================== */

export interface ProgramOfInterest {
  id: string;
  name: string;
  collegeName: string;
}

export interface Intake {
  id: string;
  label: string;
}

export interface MarketingRegistrant {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  programOfInterestId: string;
  intakeId: string;
  emirate: Emirate;
  createdAt: ISODateTime;
}

export interface MarketingRegistrantInput {
  fullName: string;
  phone: string;
  email: string;
  programOfInterestId: string;
  intakeId: string;
  emirate: Emirate | "";
}

/* =============================================================================
   Registration
   ========================================================================== */

export type RegistrationType = "pre_registered" | "walk_in";

export type CRMStatus =
  | "enrolled"
  | "accepted"
  | "admitted"
  | "lead"
  | "new_lead";

export interface MarketingRegistration {
  id: string;
  eventId: string;
  registrantId: string;
  registrationType: RegistrationType;

  qrCode: string;

  registeredAt: ISODateTime;
  crmStatus: CRMStatus;

  declaredGuestCount?: number;
}

export interface MarketingRegistrationDetail {
  registration: MarketingRegistration;
  registrant: MarketingRegistrant;
  programOfInterestName: string;
  intakeLabel: string;
  attendance: MarketingAttendance | null;
}

/* =============================================================================
   Attendance and visitors
   ========================================================================== */

export interface MarketingAttendance {
  id: string;
  eventId: string;
  registrationId: string;
  checkedIn: boolean;
  checkedInAt: ISODateTime | null;
  checkedInByStaffId: string | null;
  visitorCount: number;
}

export type MarketingScanResult =
  | {
      outcome: "ready_to_check_in";
      detail: MarketingRegistrationDetail;
    }
  | {
      outcome: "already_checked_in";
      detail: MarketingRegistrationDetail;
      checkedInAt: ISODateTime;
      visitorCount: number;
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
   Staff feedback
   ========================================================================== */

export interface StaffFeedback {
  id: string;
  eventId: string;
  staffId: string;
  staffName: string;
  staffDepartment: StaffDepartment;
  rating?: number;
  comment: string;
  suggestions?: string;
  submittedAt: ISODateTime;
}

export interface StaffFeedbackInput {
  rating?: number;
  comment: string;
  suggestions?: string;
}

/* =============================================================================
   Dashboard and analytics
   ========================================================================== */

export interface MarketingEventStats {
  visitors: number;
  students: number;
  attended: number;
  totalRegistrations: number;
  preRegistered: number;
  walkIn: number;
  crmBreakdown: Record<CRMStatus, number>;
}

export interface MarketingAnalytics {
  byProgramOfInterest: CountBucket[];
  byIntake: CountBucket[];
  byEmirate: CountBucket[];
  byCrmStatus: CountBucket[];
  byRegistrationType: CountBucket[];
  stats: MarketingEventStats;
}