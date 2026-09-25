import type {
  AssignedStaff,
  CRMStatus,
  Emirate,
  MarketingAttendance,
  MarketingEvent,
  MarketingEventType,
  MarketingRegistrant,
  MarketingRegistration,
  RegistrationType,
  StaffFeedback,
} from "@/lib/types";
import {
  INTAKES,
  MARKETING_STAFF,
  PROGRAMS_OF_INTEREST,
  getStaffMember,
} from "@/lib/data/marketing-reference";
import {
  marketingQrCode,
  registrationCode,
} from "@/lib/utils/id";
import {
  parseEventMoment,
  toISODate,
} from "@/lib/utils/dates";
import {
  chance,
  createRng,
  hashSeed,
  pick,
  pickWeighted,
  randomInt,
  type Rng,
} from "@/lib/data/seed/random";

export interface MarketingSeed {
  marketingEvents: MarketingEvent[];
  marketingRegistrants: MarketingRegistrant[];
  marketingRegistrations: MarketingRegistration[];
  marketingAttendance: MarketingAttendance[];
  staffFeedback: StaffFeedback[];
}

interface MarketingBlueprint {
  id: string;
  name: string;
  type: MarketingEventType;
  dayOffset: number;
  startTime: string;
  endTime: string;
  departureTime?: string;
  emirate: Emirate;
  venueName: string;
  mapUrl?: string;
  description?: string;
  staffIds: string[];
  driver?: {
    name: string;
    phone: string;
  };
  registrationCount: number;
  walkInShare: number;
  turnoutRate: number;
}

const FIRST_NAMES = [
  "Ahmed",
  "Fatima",
  "Mohammed",
  "Aisha",
  "Khalid",
  "Mariam",
  "Yousef",
  "Noura",
  "Omar",
  "Latifa",
  "Saeed",
  "Hessa",
  "Rashid",
  "Shamma",
  "Hamad",
  "Alya",
  "Sultan",
  "Reem",
  "Majid",
  "Salama",
  "Tariq",
  "Dana",
  "Faisal",
  "Lina",
  "Nasser",
  "Rana",
  "Adel",
  "Hind",
  "Ziad",
  "Sara",
  "Ravi",
  "Priya",
  "Arun",
  "Meera",
  "Daniel",
  "Sofia",
  "Marco",
  "Elena",
  "Aryan",
  "Zainab",
];

const LAST_NAMES = [
  "Al Mansoori",
  "Al Zaabi",
  "Al Nuaimi",
  "Al Blooshi",
  "Al Hashmi",
  "Al Suwaidi",
  "Al Marzooqi",
  "Al Shamsi",
  "Al Ali",
  "Al Kaabi",
  "Haddad",
  "Karim",
  "Mansour",
  "Fadel",
  "Kassem",
  "Nabil",
  "Obaid",
  "Saleh",
  "Darwish",
  "Younes",
  "Rahman",
  "Iqbal",
  "Nair",
  "Menon",
  "Fernandes",
  "Silva",
];

const EMIRATES: Emirate[] = [
  "ras_al_khaimah",
  "dubai",
  "sharjah",
  "abu_dhabi",
  "ajman",
  "umm_al_quwain",
  "fujairah",
  "al_ain",
];

const BLUEPRINTS: MarketingBlueprint[] =
  [
    {
      id: "mk-open-day-spring",
      name:
        "AURAK Open Day — Spring Intake",
      type: "open_day",
      dayOffset: -12,
      startTime: "09:00",
      endTime: "16:00",
      emirate:
        "ras_al_khaimah",
      venueName:
        "AURAK Main Campus",
      mapUrl:
        "https://maps.google.com/?q=American+University+of+Ras+Al+Khaimah",
      description:
        "Campus-wide open day with school tours, programme talks, scholarship information and on-the-spot admissions.",
      staffIds: [
        "staff-jumana",
        "staff-ali",
        "staff-yousef",
        "staff-laura",
        "staff-yaman",
        "staff-fares",
        "staff-salma",
        "staff-malak",
      ],
      registrationCount: 219,
      walkInShare: 0.46,
      turnoutRate: 0.82,
    },
    {
      id: "mk-school-visit-dubai",
      name:
        "School Visit — Dubai International Academy",
      type: "school_visit",
      dayOffset: -4,
      startTime: "10:00",
      endTime: "12:30",
      departureTime: "07:30",
      emirate: "dubai",
      venueName:
        "Dubai International Academy",
      mapUrl:
        "https://maps.google.com/?q=Dubai+International+Academy",
      description:
        "Grade 12 presentation followed by a question and answer session with the admissions team.",
      staffIds: [
        "staff-fatmeh",
        "staff-patson",
        "staff-shehab",
        "staff-abeer",
      ],
      driver: {
        name: "Rami Aboud",
        phone:
          "+971 50 118 4477",
      },
      registrationCount: 64,
      walkInShare: 0.62,
      turnoutRate: 0.77,
    },
    {
      id: "mk-exhibition-sharjah",
      name:
        "Najah Education Exhibition — Sharjah",
      type: "exhibition",
      dayOffset: -26,
      startTime: "11:00",
      endTime: "19:00",
      departureTime: "08:00",
      emirate: "sharjah",
      venueName:
        "Sharjah Expo Centre",
      mapUrl:
        "https://maps.google.com/?q=Expo+Centre+Sharjah",
      description:
        "Three-day regional education exhibition. AURAK stand in Hall 2.",
      staffIds: [
        "staff-jumana",
        "staff-aruzhan",
        "staff-miadah",
        "staff-amer",
        "staff-imad",
        "staff-osama",
      ],
      driver: {
        name: "Sami Khalil",
        phone:
          "+971 55 903 2214",
      },
      registrationCount: 138,
      walkInShare: 0.71,
      turnoutRate: 0.84,
    },
    {
      id: "mk-workshop-ajman",
      name:
        "Engineering Workshop — Ajman Academy",
      type: "school_workshop",
      dayOffset: 5,
      startTime: "09:30",
      endTime: "12:00",
      departureTime: "07:00",
      emirate: "ajman",
      venueName:
        "Ajman Academy",
      mapUrl:
        "https://maps.google.com/?q=Ajman+Academy",
      description:
        "Hands-on robotics and civil engineering activities for grades 10 to 12.",
      staffIds: [
        "staff-yousef",
        "staff-laura",
        "staff-yaman",
        "staff-nahom",
      ],
      driver: {
        name: "Imran Dawood",
        phone:
          "+971 52 447 9012",
      },
      registrationCount: 41,
      walkInShare: 0.1,
      turnoutRate: 0,
    },
    {
      id:
        "mk-info-session-abudhabi",
      name:
        "Information Session — Abu Dhabi",
      type:
        "information_session",
      dayOffset: 13,
      startTime: "17:00",
      endTime: "19:00",
      departureTime: "14:00",
      emirate: "abu_dhabi",
      venueName:
        "Rosewood Abu Dhabi",
      mapUrl:
        "https://maps.google.com/?q=Rosewood+Abu+Dhabi",
      description:
        "Evening session for parents and prospective students on programmes, scholarships and admissions.",
      staffIds: [
        "staff-ali",
        "staff-aruzhan",
        "staff-yasmine",
        "staff-dany",
      ],
      registrationCount: 28,
      walkInShare: 0.07,
      turnoutRate: 0,
    },
    {
      id: "mk-open-day-alain",
      name:
        "Recruitment Trip — Al Ain Schools",
      type: "other",
      dayOffset: 27,
      startTime: "09:00",
      endTime: "15:00",
      departureTime: "06:00",
      emirate: "al_ain",
      venueName:
        "Al Ain Schools Cluster",
      mapUrl:
        "https://maps.google.com/?q=Al+Ain",
      description:
        "Two-school recruitment trip covering programme talks and one-to-one counselling.",
      staffIds: [
        "staff-patson",
        "staff-arshad",
        "staff-pom",
      ],
      driver: {
        name: "Yaseen Bakr",
        phone:
          "+971 56 220 7781",
      },
      registrationCount: 12,
      walkInShare: 0,
      turnoutRate: 0,
    },
  ];

const FEEDBACK_COMMENTS = [
  "Strong turnout and very engaged parents. The stand location worked well.",
  "We ran out of printed brochures by midday. Bring more next time.",
  "School coordination was excellent, students were well prepared.",
  "Traffic on the return leg was heavy; we should leave earlier.",
  "Good quality leads, several students asked about scholarships specifically.",
  "The venue had no reliable internet, so tablet registration was slow.",
];

const FEEDBACK_SUGGESTIONS = [
  "Add a second banner facing the main entrance.",
  "Bring a portable printer for on-the-spot application forms.",
  "Assign one person purely to walk-in registration.",
  "Schedule the departure thirty minutes earlier.",
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

function buildAssignedStaff(
  staffIds: string[],
  assignedAt: string
): AssignedStaff[] {
  return staffIds
    .map((staffId) => {
      const member =
        getStaffMember(
          staffId
        );

      if (!member) {
        return null;
      }

      return {
        staffId: member.id,
        name: member.name,
        department:
          member.department,
        initials:
          member.initials,
        assignedAt,
      } satisfies AssignedStaff;
    })
    .filter(
      (
        value
      ): value is AssignedStaff =>
        value !== null
    );
}

function seedCrmStatus(
  rng: Rng
): CRMStatus {
  return pickWeighted<CRMStatus>(
    rng,
    {
      enrolled: 15,
      accepted: 11,
      admitted: 22,
      lead: 41,
      new_lead: 11,
    }
  );
}

export function buildMarketingSeed(): MarketingSeed {
  const marketingEvents: MarketingEvent[] =
    [];

  const marketingRegistrants: MarketingRegistrant[] =
    [];

  const marketingRegistrations: MarketingRegistration[] =
    [];

  const marketingAttendance: MarketingAttendance[] =
    [];

  const staffFeedback: StaffFeedback[] =
    [];

  let registrantCounter = 0;

  for (
    const blueprint
    of BLUEPRINTS
  ) {
    const rng = createRng(
      hashSeed(
        `marketing-${blueprint.id}`
      )
    );

    const date = offsetDate(
      blueprint.dayOffset
    );

    const createdAt = isoAt(
      offsetDate(
        blueprint.dayOffset -
          40
      ),
      "10:00"
    );

    const isPast =
      blueprint.dayOffset < 0;

    const event: MarketingEvent =
      {
        id: blueprint.id,
        name: blueprint.name,
        type: blueprint.type,
        date,
        startTime:
          blueprint.startTime,
        endTime:
          blueprint.endTime,
        departureTime:
          blueprint.departureTime,
        location: {
          emirate:
            blueprint.emirate,
          venueName:
            blueprint.venueName,
          mapUrl:
            blueprint.mapUrl,
        },
        description:
          blueprint.description,
        status: "upcoming",
        assignedStaff:
          buildAssignedStaff(
            blueprint.staffIds,
            createdAt
          ),
        driver:
          blueprint.driver,
        publicRegistrationCode:
          registrationCode(
            blueprint.id
          ),
        createdAt,
        updatedAt:
          createdAt,
        createdByUserId:
          "acct-marketing-admin",
      };

    marketingEvents.push(
      event
    );

    for (
      let i = 0;
      i <
      blueprint.registrationCount;
      i += 1
    ) {
      registrantCounter += 1;

      const firstName =
        pick(
          rng,
          FIRST_NAMES
        );

      const lastName =
        pick(
          rng,
          LAST_NAMES
        );

      const fullName =
        `${firstName} ${lastName}`;

      const registrantId =
        `mr-${registrantCounter}`;

      const registrationType:
        RegistrationType =
        chance(
          rng,
          blueprint.walkInShare
        )
          ? "walk_in"
          : "pre_registered";

      const registeredAt =
        registrationType ===
        "walk_in"
          ? isoAt(
              date,
              blueprint.startTime,
              randomInt(
                rng,
                5,
                240
              )
            )
          : isoAt(
              offsetDate(
                blueprint.dayOffset -
                  randomInt(
                    rng,
                    2,
                    25
                  )
              ),
              "11:00",
              randomInt(
                rng,
                0,
                600
              )
            );

      marketingRegistrants.push(
        {
          id:
            registrantId,
          fullName,
          phone: `+971 5${randomInt(
            rng,
            0,
            8
          )} ${randomInt(
            rng,
            100,
            999
          )} ${randomInt(
            rng,
            1000,
            9999
          )}`,
          email: `${firstName.toLowerCase()}.${lastName
            .toLowerCase()
            .replace(
              /[^a-z]/g,
              ""
            )}${registrantCounter}@example.com`,
          programOfInterestId:
            pick(
              rng,
              PROGRAMS_OF_INTEREST
            ).id,
          intakeId:
            pick(
              rng,
              INTAKES
            ).id,
          emirate:
            pick(
              rng,
              EMIRATES
            ),
          createdAt:
            registeredAt,
        }
      );

      const registrationId =
        `mrg-${registrantCounter}`;

      const declaredGuestCount =
        registrationType ===
        "walk_in"
          ? randomInt(
              rng,
              0,
              3
            )
          : undefined;

      marketingRegistrations.push(
        {
          id:
            registrationId,
          eventId:
            event.id,
          registrantId,
          registrationType,
          qrCode:
            marketingQrCode(
              event.id,
              registrationId
            ),
          registeredAt,
          crmStatus:
            seedCrmStatus(
              rng
            ),
          declaredGuestCount,
        }
      );

      if (isPast) {
        const checkedIn =
          chance(
            rng,
            blueprint.turnoutRate
          );

        const companions =
          pickWeighted<
            | "0"
            | "1"
            | "2"
            | "3"
            | "4"
          >(rng, {
            "0": 26,
            "1": 30,
            "2": 24,
            "3": 14,
            "4": 6,
          });

        marketingAttendance.push(
          {
            id: `mat-${registrationId}`,
            eventId:
              event.id,
            registrationId,
            checkedIn,
            checkedInAt:
              checkedIn
                ? isoAt(
                    date,
                    blueprint.startTime,
                    randomInt(
                      rng,
                      0,
                      300
                    )
                  )
                : null,
            checkedInByStaffId:
              checkedIn
                ? pick(
                    rng,
                    blueprint.staffIds
                  )
                : null,
            visitorCount:
              checkedIn
                ? 1 +
                  Number(
                    companions
                  )
                : 0,
          }
        );
      }
    }

    if (isPast) {
      const contributors =
        blueprint.staffIds.filter(
          () =>
            chance(
              rng,
              0.55
            )
        );

      for (
        const staffId
        of contributors
      ) {
        const member =
          MARKETING_STAFF.find(
            (staff) =>
              staff.id ===
              staffId
          );

        if (!member) {
          continue;
        }

        staffFeedback.push({
          id: `sf-${blueprint.id}-${staffId}`,
          eventId:
            event.id,
          staffId:
            member.id,
          staffName:
            member.name,
          staffDepartment:
            member.department,
          rating:
            randomInt(
              rng,
              3,
              5
            ),
          comment:
            pick(
              rng,
              FEEDBACK_COMMENTS
            ),
          suggestions:
            chance(
              rng,
              0.5
            )
              ? pick(
                  rng,
                  FEEDBACK_SUGGESTIONS
                )
              : undefined,
          submittedAt:
            isoAt(
              offsetDate(
                blueprint.dayOffset +
                  1
              ),
              "09:30"
            ),
        });
      }
    }
  }

  return {
    marketingEvents,
    marketingRegistrants,
    marketingRegistrations,
    marketingAttendance,
    staffFeedback,
  };
}