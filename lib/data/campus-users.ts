import type {
  CampusUser,
  CampusUserSummary,
  CampusUserType,
} from "@/lib/types";
import {
  DEPARTMENTS,
  PROGRAMS,
  getCollege,
  getDepartmentName,
  getProgramName,
} from "@/lib/data/campus-reference";
import {
  createRng,
  hashSeed,
  pickWeighted,
} from "@/lib/data/seed/random";

/* =============================================================================
   MOCK EUMS DIRECTORY

   Internal AURAK students, staff and faculty. In production these come from
   EUMS and are read-only — internal users never type their own college,
   department or program into this application.

   The directory is intentionally large (~416 people). RSVP counts, attendance
   counts and staff search all operate on these real records, so a figure like
   "160 said Yes" is a genuine count rather than a decorative number.

   Generation is deterministic and contains no Date or Math.random call, so the
   same array is produced during server rendering and in the browser.
   ========================================================================== */

const NAMED_USERS: CampusUser[] = [
  {
    id: "cu-2023006308",
    eumsId: "2023006308",
    fullName: "Omar Al Hashmi",
    email: "2023006308@aurak.ac.ae",
    userType: "student",
    initials: "OA",
    collegeId: "college-engineering",
    departmentId: "dept-computer-science",
    programId: "prog-bsc-cs",
    yearOfStudy: 3,
  },
  {
    id: "cu-shalaby",
    eumsId: "STF-1042",
    fullName: "G. Shalaby",
    email: "g.shalaby@aurak.ac.ae",
    userType: "staff",
    initials: "GS",
    departmentId: "dept-management",
    collegeId: "college-business",
  },
  {
    id: "cu-yamanalrashed",
    eumsId: "STF-1188",
    fullName: "T. Yaman Al Rashed",
    email: "t.yamanalrashed@aurak.ac.ae",
    userType: "staff",
    initials: "TR",
    departmentId: "dept-computer-science",
    collegeId: "college-engineering",
  },
  {
    id: "cu-1001",
    eumsId: "2022004411",
    fullName: "Sara Al Mansoori",
    email: "2022004411@aurak.ac.ae",
    userType: "student",
    initials: "SA",
    collegeId: "college-engineering",
    departmentId: "dept-computer-science",
    programId: "prog-bsc-ce",
    yearOfStudy: 4,
  },
  {
    id: "cu-1002",
    eumsId: "2024001120",
    fullName: "Layla Haddad",
    email: "2024001120@aurak.ac.ae",
    userType: "student",
    initials: "LH",
    collegeId: "college-engineering",
    departmentId: "dept-electrical",
    programId: "prog-bsc-ee",
    yearOfStudy: 2,
  },
  {
    id: "cu-1003",
    eumsId: "2023007702",
    fullName: "Bilal Karim",
    email: "2023007702@aurak.ac.ae",
    userType: "student",
    initials: "BK",
    collegeId: "college-engineering",
    departmentId: "dept-mechanical",
    programId: "prog-bsc-me",
    yearOfStudy: 3,
  },
  {
    id: "cu-1004",
    eumsId: "2021003390",
    fullName: "Noura Al Zaabi",
    email: "2021003390@aurak.ac.ae",
    userType: "student",
    initials: "NA",
    collegeId: "college-business",
    departmentId: "dept-accounting-finance",
    programId: "prog-bsba-acc",
    yearOfStudy: 4,
  },
  {
    id: "cu-1005",
    eumsId: "2024002250",
    fullName: "Ibrahim Sultan",
    email: "2024002250@aurak.ac.ae",
    userType: "student",
    initials: "IS",
    collegeId: "college-business",
    departmentId: "dept-management",
    programId: "prog-bsba-mgt",
    yearOfStudy: 1,
  },
  {
    id: "cu-1006",
    eumsId: "2022008814",
    fullName: "Maryam Al Blooshi",
    email: "2022008814@aurak.ac.ae",
    userType: "student",
    initials: "MA",
    collegeId: "college-architecture",
    departmentId: "dept-architecture",
    programId: "prog-barch",
    yearOfStudy: 4,
  },
  {
    id: "cu-1007",
    eumsId: "2023005501",
    fullName: "Rashed Al Nuaimi",
    email: "2023005501@aurak.ac.ae",
    userType: "student",
    initials: "RA",
    collegeId: "college-arts-sciences",
    departmentId: "dept-biotechnology",
    programId: "prog-bsc-biotech",
    yearOfStudy: 2,
  },
  {
    id: "cu-2001",
    eumsId: "FAC-2204",
    fullName: "Dr. Hala Mansour",
    email: "h.mansour@aurak.ac.ae",
    userType: "faculty",
    initials: "HM",
    collegeId: "college-engineering",
    departmentId: "dept-computer-science",
  },
  {
    id: "cu-2002",
    eumsId: "FAC-2311",
    fullName: "Dr. Samir Fadel",
    email: "s.fadel@aurak.ac.ae",
    userType: "faculty",
    initials: "SF",
    collegeId: "college-engineering",
    departmentId: "dept-mechanical",
  },
  {
    id: "cu-2003",
    eumsId: "FAC-2408",
    fullName: "Dr. Amira Kassem",
    email: "a.kassem@aurak.ac.ae",
    userType: "faculty",
    initials: "AK",
    collegeId: "college-business",
    departmentId: "dept-business-marketing",
  },
  {
    id: "cu-2004",
    eumsId: "FAC-2515",
    fullName: "Dr. Tarek Nabil",
    email: "t.nabil@aurak.ac.ae",
    userType: "faculty",
    initials: "TN",
    collegeId: "college-architecture",
    departmentId: "dept-interior-design",
  },
  {
    id: "cu-3001",
    eumsId: "STF-1256",
    fullName: "Huda Al Marzooqi",
    email: "h.almarzooqi@aurak.ac.ae",
    userType: "staff",
    initials: "HA",
    departmentId: "dept-management",
    collegeId: "college-business",
  },
  {
    id: "cu-3002",
    eumsId: "STF-1299",
    fullName: "Khalid Obaid",
    email: "k.obaid@aurak.ac.ae",
    userType: "staff",
    initials: "KO",
    departmentId: "dept-humanities",
    collegeId: "college-arts-sciences",
  },
];

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
  "Karim",
  "Nour",
  "Bilal",
  "Yasmin",
  "Samir",
  "Leila",
  "Imran",
  "Huda",
  "Anwar",
  "Zeina",
  "Ravi",
  "Priya",
  "Arun",
  "Meera",
  "Daniel",
  "Sofia",
  "Marco",
  "Elena",
  "John",
  "Grace",
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
  "Petrov",
  "Novak",
  "Hughes",
  "Bennett",
  "Khoury",
  "Bakr",
  "Sadiq",
  "Hamdan",
  "Rostami",
];

const GENERATED_COUNT = 400;

function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function buildDirectory(): CampusUser[] {
  const users: CampusUser[] = [
    ...NAMED_USERS,
  ];

  const usedEmails = new Set(
    users.map((user) =>
      user.email.toLowerCase()
    )
  );

  const rng = createRng(
    hashSeed(
      "aurak-campus-directory-v1"
    )
  );

  for (
    let index = 0;
    index < GENERATED_COUNT;
    index += 1
  ) {
    const firstName =
      FIRST_NAMES[
        (index * 13 + 5) %
          FIRST_NAMES.length
      ];

    const lastName =
      LAST_NAMES[
        (index * 7 + 3) %
          LAST_NAMES.length
      ];

    const userType =
      pickWeighted<CampusUserType>(
        rng,
        {
          student: 72,
          faculty: 18,
          staff: 10,
        }
      );

    const department =
      DEPARTMENTS[
        index %
          DEPARTMENTS.length
      ];

    const departmentPrograms =
      PROGRAMS.filter(
        (program) =>
          program.departmentId ===
          department.id
      );

    const isStudent =
      userType === "student";

    const fullName = isStudent
      ? `${firstName} ${lastName}`
      : userType === "faculty"
        ? `Dr. ${firstName} ${lastName}`
        : `${firstName} ${lastName}`;

    const eumsId = isStudent
      ? `${2022 + (index % 4)}${String(
          100000 + index * 3
        ).slice(1)}`
      : userType === "faculty"
        ? `FAC-${3000 + index}`
        : `STF-${4000 + index}`;

    let email = isStudent
      ? `${eumsId}@aurak.ac.ae`
      : `${firstName[0].toLowerCase()}.${slug(
          lastName
        )}@aurak.ac.ae`;

    let suffix = 2;

    while (
      usedEmails.has(
        email.toLowerCase()
      )
    ) {
      email = isStudent
        ? `${eumsId}${suffix}@aurak.ac.ae`
        : `${firstName[0].toLowerCase()}.${slug(
            lastName
          )}${suffix}@aurak.ac.ae`;

      suffix += 1;
    }

    usedEmails.add(
      email.toLowerCase()
    );

    users.push({
      id: `cu-gen-${index}`,
      eumsId,
      fullName,
      email,
      userType,
      initials:
        initialsOf(fullName),
      collegeId:
        department.collegeId,
      departmentId:
        department.id,
      programId:
        isStudent &&
        departmentPrograms.length > 0
          ? departmentPrograms[
              index %
                departmentPrograms.length
            ].id
          : undefined,
      yearOfStudy: isStudent
        ? 1 + (index % 4)
        : undefined,
    });
  }

  return users;
}

export const CAMPUS_USERS: CampusUser[] =
  buildDirectory();

export const DEMO_CAMPUS_USER_IDS = [
  "cu-2023006308",
  "cu-shalaby",
  "cu-yamanalrashed",
] as const;

const usersById = new Map(
  CAMPUS_USERS.map((user) => [
    user.id,
    user,
  ])
);

export function getCampusUser(
  id?: string
): CampusUser | undefined {
  return id
    ? usersById.get(id)
    : undefined;
}

export function getCampusUserByEmail(
  email: string
): CampusUser | undefined {
  const normalised = email
    .trim()
    .toLowerCase();

  return CAMPUS_USERS.find(
    (user) =>
      user.email.toLowerCase() ===
      normalised
  );
}

export function toCampusUserSummary(
  user: CampusUser
): CampusUserSummary {
  return {
    id: user.id,
    fullName: user.fullName,
    eumsId: user.eumsId,
    userType: user.userType,
    collegeName: getCollege(
      user.collegeId
    )?.shortName,
    departmentName:
      getDepartmentName(
        user.departmentId
      ),
    programName: getProgramName(
      user.programId
    ),
    initials: user.initials,
  };
}

export function getCampusUserSummary(
  id: string
): CampusUserSummary | undefined {
  const user =
    getCampusUser(id);

  return user
    ? toCampusUserSummary(user)
    : undefined;
}

export function searchCampusUsers(
  query: string
): CampusUser[] {
  const needle = query
    .trim()
    .toLowerCase();

  if (!needle) return [];

  return CAMPUS_USERS.filter(
    (user) =>
      user.fullName
        .toLowerCase()
        .includes(needle) ||
      user.eumsId
        .toLowerCase()
        .includes(needle) ||
      user.email
        .toLowerCase()
        .includes(needle)
  );
}