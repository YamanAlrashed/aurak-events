import type {
  CampusAttendance,
  CampusEvent,
  CampusEventTicket,
  CampusRsvp,
  CampusUser,
  EventPhoto,
  EventRating,
  RSVPStatus,
  TargetAudience,
} from "@/lib/types";
import { CAMPUS_USERS } from "@/lib/data/campus-users";
import {
  getBuilding,
  getHostingDepartment,
} from "@/lib/data/campus-reference";
import { campusQrCode } from "@/lib/utils/id";
import { mockPhotoToken } from "@/lib/utils/mockPhoto";
import {
  parseEventMoment,
  toISODate,
} from "@/lib/utils/dates";
import {
  chance,
  createRng,
  hashSeed,
  pickWeighted,
  randomInt,
  type Rng,
} from "@/lib/data/seed/random";

export interface GalleryRecord {
  eventId: string;
  publishedAt: string | null;
  archived: boolean;
}

export interface CampusSeed {
  campusEvents: CampusEvent[];
  campusRsvps: CampusRsvp[];
  campusTickets: CampusEventTicket[];
  campusAttendance: CampusAttendance[];
  galleries: GalleryRecord[];
  eventPhotos: EventPhoto[];
  eventRatings: EventRating[];
}

interface EventBlueprint {
  id: string;
  name: string;
  description: string;
  dayOffset: number;
  startTime: string;
  endTime: string;
  buildingId: string;
  room?: string;
  locationName?: string;
  hostingDepartmentId: string;
  audience: TargetAudience;
  explicitStatus?:
    | "archived"
    | "cancelled";
  showAverageRatingToUsers: boolean;
  responseRate: number;
  hasGallery?: boolean;
  photoCount?: number;
}

function audience(
  userTypes:
    TargetAudience["userTypes"],
  collegeIds: string[] = [],
  departmentIds: string[] = [],
  programIds: string[] = []
): TargetAudience {
  return {
    userTypes,
    collegeIds,
    departmentIds,
    programIds,
  };
}

const BLUEPRINTS: EventBlueprint[] = [
  {
    id: "ce-ai-workshop",
    name:
      "AI & Machine Learning Workshop",
    description:
      "A hands-on introduction to practical machine learning, covering model training, evaluation and deployment. Laptops required. Open to all AURAK members.",
    dayOffset: 6,
    startTime: "14:00",
    endTime: "17:00",
    buildingId: "building-k",
    room: "K-204",
    locationName:
      "Innovation Lab",
    hostingDepartmentId:
      "host-engineering",
    audience: audience(
      ["student", "faculty"],
      ["college-engineering"],
      ["dept-computer-science"]
    ),
    showAverageRatingToUsers: true,
    responseRate: 0.52,
  },
  {
    id: "ce-career-fair",
    name: "Career Fair 2026",
    description:
      "Meet more than forty employers across engineering, business, architecture and the sciences. Bring printed copies of your CV.",
    dayOffset: 2,
    startTime: "09:00",
    endTime: "16:00",
    buildingId: "building-a",
    locationName: "Main Hall",
    hostingDepartmentId:
      "host-student-life",
    audience: audience([
      "student",
      "staff",
      "faculty",
    ]),
    showAverageRatingToUsers: true,
    responseRate: 0.58,
  },
  {
    id: "ce-clubs-fair",
    name: "Student Clubs Fair",
    description:
      "Discover every student club on campus, speak to committee members and sign up on the spot.",
    dayOffset: 0,
    startTime: "08:00",
    endTime: "20:00",
    buildingId: "building-a",
    locationName: "Atrium",
    hostingDepartmentId:
      "host-student-life",
    audience: audience([
      "student",
    ]),
    showAverageRatingToUsers: true,
    responseRate: 0.46,
  },
  {
    id: "ce-entrepreneurship",
    name:
      "Entrepreneurship Bootcamp",
    description:
      "Two sessions on validating an idea, building a lean business case and pitching to investors.",
    dayOffset: 14,
    startTime: "10:00",
    endTime: "13:00",
    buildingId: "building-g",
    room: "G-110",
    hostingDepartmentId:
      "host-business",
    audience: audience(
      ["student"],
      ["college-business"]
    ),
    showAverageRatingToUsers: true,
    responseRate: 0.3,
  },
  {
    id: "ce-cybersecurity",
    name:
      "Cybersecurity Seminar",
    description:
      "Industry speakers on threat modelling, secure development and incident response in the UAE context.",
    dayOffset: 21,
    startTime: "11:00",
    endTime: "13:30",
    buildingId: "building-k",
    room: "K-301",
    hostingDepartmentId:
      "host-engineering",
    audience: audience(
      ["student", "faculty"],
      ["college-engineering"]
    ),
    showAverageRatingToUsers: false,
    responseRate: 0.26,
  },
  {
    id: "ce-smart-cities",
    name:
      "Guest Lecture: Smart Cities",
    description:
      "Postponed. A new date will be announced by the School of Engineering.",
    dayOffset: 10,
    startTime: "15:00",
    endTime: "16:30",
    buildingId: "building-g",
    room: "G-205",
    hostingDepartmentId:
      "host-engineering",
    audience: audience(
      ["student", "faculty"],
      ["college-engineering"]
    ),
    explicitStatus:
      "cancelled",
    showAverageRatingToUsers: true,
    responseRate: 0.14,
  },
  {
    id: "ce-research-day",
    name:
      "Engineering Research Day",
    description:
      "Poster presentations and demonstrations from final-year and postgraduate engineering projects.",
    dayOffset: -7,
    startTime: "09:30",
    endTime: "15:00",
    buildingId: "building-k",
    locationName:
      "Exhibition Floor",
    hostingDepartmentId:
      "host-engineering",
    audience: audience(
      ["student", "faculty"],
      ["college-engineering"]
    ),
    showAverageRatingToUsers: true,
    responseRate: 0.55,
    hasGallery: true,
    photoCount: 10,
  },
  {
    id: "ce-leadership-talk",
    name:
      "Business Leadership Talk",
    description:
      "A conversation with regional business leaders on career paths, leadership and the UAE job market.",
    dayOffset: -21,
    startTime: "13:00",
    endTime: "15:00",
    buildingId: "building-g",
    room: "G-Auditorium",
    hostingDepartmentId:
      "host-business",
    audience: audience(
      ["student", "staff"],
      ["college-business"]
    ),
    showAverageRatingToUsers: false,
    responseRate: 0.38,
    hasGallery: true,
    photoCount: 8,
  },
  {
    id: "ce-orientation",
    name:
      "Freshman Orientation",
    description:
      "Welcome session for new students: campus tour, academic advising and student services introduction.",
    dayOffset: -60,
    startTime: "08:30",
    endTime: "14:00",
    buildingId: "building-a",
    locationName: "Main Hall",
    hostingDepartmentId:
      "host-admissions",
    audience: audience([
      "student",
    ]),
    showAverageRatingToUsers: true,
    responseRate: 0.5,
    hasGallery: true,
    photoCount: 12,
  },
  {
    id: "ce-robotics-expo",
    name: "Robotics Expo 2024",
    description:
      "Archived event. Student robotics teams demonstrated autonomous navigation and manipulation projects.",
    dayOffset: -800,
    startTime: "10:00",
    endTime: "16:00",
    buildingId: "building-k",
    locationName: "Robotics Lab",
    hostingDepartmentId:
      "host-engineering",
    audience: audience(
      ["student", "faculty"],
      ["college-engineering"]
    ),
    explicitStatus:
      "archived",
    showAverageRatingToUsers: true,
    responseRate: 0.33,
    hasGallery: true,
    photoCount: 9,
  },
];

function offsetDate(
  dayOffset: number
): string {
  const date = new Date();

  date.setHours(
    12,
    0,
    0,
    0
  );

  date.setDate(
    date.getDate() +
      dayOffset
  );

  return toISODate(date);
}

function isoAt(
  date: string,
  time: string,
  minuteShift = 0
): string {
  const moment =
    parseEventMoment(
      date,
      time
    );

  moment.setMinutes(
    moment.getMinutes() +
      minuteShift
  );

  return moment.toISOString();
}

function hasStarted(
  date: string,
  startTime: string
): boolean {
  return (
    parseEventMoment(
      date,
      startTime
    ).getTime() <= Date.now()
  );
}

const RATING_COMMENTS = [
  "Very well organised, the speakers were excellent.",
  "Good content but the room was too small for the number of people.",
  "Learned a lot. Would attend again next year.",
  "Start was delayed by about twenty minutes.",
  "Great hands-on sections. More time for questions would help.",
  "Useful for my final year project. Thank you.",
  "The catering ran out early in the afternoon.",
  "Excellent event overall, clear and practical.",
];

const RATING_SUGGESTIONS = [
  "Please share the slides afterwards.",
  "Consider running this twice so more students can attend.",
  "A larger venue next time.",
  "More industry speakers would be valuable.",
];

export function buildCampusSeed(): CampusSeed {
  const campusEvents: CampusEvent[] =
    [];

  const campusRsvps: CampusRsvp[] =
    [];

  const campusTickets: CampusEventTicket[] =
    [];

  const campusAttendance: CampusAttendance[] =
    [];

  const galleries: GalleryRecord[] =
    [];

  const eventPhotos: EventPhoto[] =
    [];

  const eventRatings: EventRating[] =
    [];

  let photoSeed = 0;

  for (
    const blueprint
    of BLUEPRINTS
  ) {
    const rng: Rng =
      createRng(
        hashSeed(
          `campus-${blueprint.id}`
        )
      );

    const date =
      offsetDate(
        blueprint.dayOffset
      );

    const building =
      getBuilding(
        blueprint.buildingId
      );

    const hosting =
      getHostingDepartment(
        blueprint.hostingDepartmentId
      );

    const createdAt = isoAt(
      offsetDate(
        blueprint.dayOffset -
          30
      ),
      "09:00"
    );

    const event: CampusEvent = {
      id: blueprint.id,
      name: blueprint.name,
      description:
        blueprint.description,
      date,
      startTime:
        blueprint.startTime,
      endTime:
        blueprint.endTime,
      location: {
        buildingId:
          blueprint.buildingId,
        buildingName:
          building?.name ??
          "Unknown building",
        room:
          blueprint.room,
        locationName:
          blueprint.locationName,
      },
      hostingDepartmentId:
        blueprint.hostingDepartmentId,
      hostingDepartmentName:
        hosting?.name ??
        "Other",
      targetAudience:
        blueprint.audience,
      status:
        blueprint.explicitStatus ??
        "upcoming",
      showAverageRatingToUsers:
        blueprint.showAverageRatingToUsers,
      createdAt,
      updatedAt: createdAt,
      createdByUserId:
        "cu-shalaby",
      archivedAt:
        blueprint.explicitStatus ===
        "archived"
          ? isoAt(
              offsetDate(
                blueprint.dayOffset +
                  30
              ),
              "09:00"
            )
          : undefined,
      cancelledAt:
        blueprint.explicitStatus ===
        "cancelled"
          ? isoAt(
              offsetDate(-3),
              "11:00"
            )
          : undefined,
    };

    campusEvents.push(event);

    const started =
      hasStarted(
        date,
        blueprint.startTime
      );

    const respondents: CampusUser[] =
      CAMPUS_USERS.filter(() =>
        chance(
          rng,
          blueprint.responseRate
        )
      );

    for (
      const user
      of respondents
    ) {
      const status =
        pickWeighted<RSVPStatus>(
          rng,
          {
            yes: 66,
            maybe: 20,
            no: 14,
          }
        );

      const respondedAt =
        isoAt(
          offsetDate(
            blueprint.dayOffset -
              randomInt(
                rng,
                1,
                14
              )
          ),
          "10:00",
          randomInt(
            rng,
            0,
            600
          )
        );

      campusRsvps.push({
        id: `rsvp-${blueprint.id}-${user.id}`,
        eventId: event.id,
        userId: user.id,
        status,
        respondedAt,
        updatedAt:
          respondedAt,
      });

      if (
        status === "yes" ||
        status === "maybe"
      ) {
        campusTickets.push({
          id: `tk-${blueprint.id}-${user.id}`,
          eventId: event.id,
          userId: user.id,
          qrCode:
            campusQrCode(
              event.id,
              user.id
            ),
          issuedAt:
            respondedAt,
        });

        if (
          started &&
          blueprint.explicitStatus !==
            "cancelled"
        ) {
          const showUpRate =
            status === "yes"
              ? 0.74
              : 0.31;

          const checkedIn =
            chance(
              rng,
              showUpRate
            );

          campusAttendance.push(
            {
              id: `att-${blueprint.id}-${user.id}`,
              eventId:
                event.id,
              userId:
                user.id,
              checkedIn,
              checkedInAt:
                checkedIn
                  ? isoAt(
                      date,
                      blueprint.startTime,
                      randomInt(
                        rng,
                        -10,
                        95
                      )
                    )
                  : null,
              checkedInByStaffId:
                checkedIn
                  ? "acct-campus-staff"
                  : null,
              method:
                checkedIn
                  ? "qr"
                  : null,
            }
          );
        }
      }
    }

    if (
      blueprint.hasGallery
    ) {
      const publishedAt =
        isoAt(
          offsetDate(
            blueprint.dayOffset +
              2
          ),
          "16:00"
        );

      galleries.push({
        eventId: event.id,
        publishedAt,
        archived:
          blueprint.explicitStatus ===
          "archived",
      });

      for (
        let i = 0;
        i <
        (blueprint.photoCount ??
          8);
        i += 1
      ) {
        photoSeed += 1;

        eventPhotos.push({
          id: `ph-${blueprint.id}-${i}`,
          eventId:
            event.id,
          url:
            mockPhotoToken(
              photoSeed
            ),
          caption:
            i === 0
              ? `${blueprint.name} — opening`
              : undefined,
          uploadedAt:
            publishedAt,
          uploadedByUserId:
            "cu-shalaby",
        });
      }
    }

    if (
      started &&
      blueprint.explicitStatus !==
        "cancelled"
    ) {
      const attendees =
        campusAttendance.filter(
          (record) =>
            record.eventId ===
              event.id &&
            record.checkedIn
        );

      for (
        const attendee
        of attendees
      ) {
        if (
          !chance(rng, 0.34)
        ) {
          continue;
        }

        const stars =
          pickWeighted<
            "3" | "4" | "5"
          >(rng, {
            "3": 14,
            "4": 38,
            "5": 48,
          });

        const includeComment =
          chance(rng, 0.45);

        const includeSuggestion =
          chance(rng, 0.22);

        eventRatings.push({
          id: `rt-${blueprint.id}-${attendee.userId}`,
          eventId:
            event.id,
          userId:
            attendee.userId,
          stars: Number(
            stars
          ),
          comment:
            includeComment
              ? RATING_COMMENTS[
                  randomInt(
                    rng,
                    0,
                    RATING_COMMENTS.length -
                      1
                  )
                ]
              : undefined,
          suggestion:
            includeSuggestion
              ? RATING_SUGGESTIONS[
                  randomInt(
                    rng,
                    0,
                    RATING_SUGGESTIONS.length -
                      1
                  )
                ]
              : undefined,
          submittedAt:
            isoAt(
              offsetDate(
                blueprint.dayOffset +
                  1
              ),
              "12:00",
              randomInt(
                rng,
                0,
                600
              )
            ),
        });
      }
    }
  }

  return {
    campusEvents,
    campusRsvps,
    campusTickets,
    campusAttendance,
    galleries,
    eventPhotos,
    eventRatings,
  };
}

export function ensureDemoUserState(
  seed: CampusSeed
): CampusSeed {
  const demoUserId =
    "cu-2023006308";

  const now =
    new Date().toISOString();

  function upsertRsvp(
    eventId: string,
    status: RSVPStatus
  ) {
    const existing =
      seed.campusRsvps.find(
        (rsvp) =>
          rsvp.eventId ===
            eventId &&
          rsvp.userId ===
            demoUserId
      );

    if (existing) {
      existing.status =
        status;
      existing.updatedAt =
        now;
    } else {
      seed.campusRsvps.push({
        id: `rsvp-${eventId}-${demoUserId}`,
        eventId,
        userId:
          demoUserId,
        status,
        respondedAt: now,
        updatedAt: now,
      });
    }

    if (status !== "no") {
      const hasTicket =
        seed.campusTickets.some(
          (ticket) =>
            ticket.eventId ===
              eventId &&
            ticket.userId ===
              demoUserId
        );

      if (!hasTicket) {
        seed.campusTickets.push(
          {
            id: `tk-${eventId}-${demoUserId}`,
            eventId,
            userId:
              demoUserId,
            qrCode:
              campusQrCode(
                eventId,
                demoUserId
              ),
            issuedAt:
              now,
          }
        );
      }
    }
  }

  function forceCheckIn(
    eventId: string
  ) {
    const existing =
      seed.campusAttendance.find(
        (attendance) =>
          attendance.eventId ===
            eventId &&
          attendance.userId ===
            demoUserId
      );

    const event =
      seed.campusEvents.find(
        (event) =>
          event.id === eventId
      );

    const checkedInAt =
      event
        ? isoAt(
            event.date,
            event.startTime,
            20
          )
        : now;

    if (existing) {
      existing.checkedIn =
        true;
      existing.checkedInAt =
        checkedInAt;
      existing.checkedInByStaffId =
        "acct-campus-staff";
      existing.method =
        "qr";
    } else {
      seed.campusAttendance.push(
        {
          id: `att-${eventId}-${demoUserId}`,
          eventId,
          userId:
            demoUserId,
          checkedIn: true,
          checkedInAt,
          checkedInByStaffId:
            "acct-campus-staff",
          method: "qr",
        }
      );
    }
  }

  upsertRsvp(
    "ce-ai-workshop",
    "yes"
  );

  upsertRsvp(
    "ce-career-fair",
    "maybe"
  );

  upsertRsvp(
    "ce-cybersecurity",
    "no"
  );

  upsertRsvp(
    "ce-research-day",
    "yes"
  );

  forceCheckIn(
    "ce-research-day"
  );

  upsertRsvp(
    "ce-orientation",
    "yes"
  );

  forceCheckIn(
    "ce-orientation"
  );

  seed.eventRatings =
    seed.eventRatings.filter(
      (rating) =>
        !(
          rating.userId ===
            demoUserId &&
          rating.eventId ===
            "ce-research-day"
        )
    );

  return seed;
}