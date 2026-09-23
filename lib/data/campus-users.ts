import type { CampusUser, CampusUserSummary } from "@/lib/types";
import {
  getCollege,
  getDepartmentName,
  getProgramName,
} from "@/lib/data/campus-reference";

/* =============================================================================
   MOCK EUMS DIRECTORY

   Internal AURAK students, staff and faculty. In production these records come
   from EUMS and are read-only. Internal users never fill in their own college,
   department or program in this application.
   ========================================================================== */

export const CAMPUS_USERS: CampusUser[] = [
  /* ---- The signed-in Campus User account ------------------------------- */
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

  /* ---- Accounts that also sign in ------------------------------------- */
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

  /* ---- Additional directory records used by lists and check-in --------- */
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

/* =============================================================================
   LOOKUPS
   ========================================================================== */

export function getCampusUser(id?: string): CampusUser | undefined {
  return CAMPUS_USERS.find((u) => u.id === id);
}

export function getCampusUserByEmail(email: string): CampusUser | undefined {
  const normalised = email.trim().toLowerCase();
  return CAMPUS_USERS.find((u) => u.email.toLowerCase() === normalised);
}

/**
 * Flattened, display-ready version used by attendee tables and the staff
 * check-in screen so those views never perform their own lookups.
 */
export function toCampusUserSummary(user: CampusUser): CampusUserSummary {
  return {
    id: user.id,
    fullName: user.fullName,
    eumsId: user.eumsId,
    userType: user.userType,
    collegeName: getCollege(user.collegeId)?.shortName,
    departmentName: getDepartmentName(user.departmentId),
    programName: getProgramName(user.programId),
    initials: user.initials,
  };
}

export function getCampusUserSummary(
  id: string
): CampusUserSummary | undefined {
  const user = getCampusUser(id);
  return user ? toCampusUserSummary(user) : undefined;
}