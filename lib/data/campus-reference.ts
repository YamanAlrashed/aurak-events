import type {
  CampusBuildingOption,
  CampusLocation,
  CampusUserType,
  College,
  Department,
  HostingDepartment,
  Option,
  Program,
} from "@/lib/types";

/* =============================================================================
   MOCK REFERENCE DATA — Campus Events

   In production this comes from EUMS. Every screen resolves names through the
   helpers at the bottom of this file rather than hardcoding labels, so adding
   a college, department, program or building is a change to this file only.
   ========================================================================== */

/* -----------------------------------------------------------------------------
   Colleges
   -------------------------------------------------------------------------- */

export const COLLEGES: College[] = [
  {
    id: "college-engineering",
    name: "School of Engineering",
    shortName: "Engineering",
  },
  {
    id: "college-business",
    name: "School of Business",
    shortName: "Business",
  },
  {
    id: "college-arts-sciences",
    name: "School of Arts and Sciences",
    shortName: "Arts & Sciences",
  },
  {
    id: "college-architecture",
    name: "School of Architecture, Art and Design",
    shortName: "Architecture",
  },
];

/* -----------------------------------------------------------------------------
   Academic departments
   -------------------------------------------------------------------------- */

export const DEPARTMENTS: Department[] = [
  // Engineering
  {
    id: "dept-computer-science",
    name: "Computer Science and Engineering",
    collegeId: "college-engineering",
  },
  {
    id: "dept-electrical",
    name: "Electrical Engineering",
    collegeId: "college-engineering",
  },
  {
    id: "dept-mechanical",
    name: "Mechanical Engineering",
    collegeId: "college-engineering",
  },
  {
    id: "dept-civil",
    name: "Civil and Infrastructure Engineering",
    collegeId: "college-engineering",
  },
  {
    id: "dept-chemical",
    name: "Chemical and Petroleum Engineering",
    collegeId: "college-engineering",
  },

  // Business
  {
    id: "dept-accounting-finance",
    name: "Accounting and Finance",
    collegeId: "college-business",
  },
  {
    id: "dept-management",
    name: "Management",
    collegeId: "college-business",
  },
  {
    id: "dept-business-marketing",
    name: "Marketing",
    collegeId: "college-business",
  },

  // Arts and Sciences
  {
    id: "dept-biotechnology",
    name: "Biotechnology",
    collegeId: "college-arts-sciences",
  },
  {
    id: "dept-math-physics",
    name: "Mathematics and Physics",
    collegeId: "college-arts-sciences",
  },
  {
    id: "dept-humanities",
    name: "Humanities and Social Sciences",
    collegeId: "college-arts-sciences",
  },

  // Architecture
  {
    id: "dept-architecture",
    name: "Architecture",
    collegeId: "college-architecture",
  },
  {
    id: "dept-interior-design",
    name: "Interior Design",
    collegeId: "college-architecture",
  },
];

/* -----------------------------------------------------------------------------
   Programs
   -------------------------------------------------------------------------- */

export const PROGRAMS: Program[] = [
  {
    id: "prog-bsc-cs",
    name: "BSc Computer Science",
    departmentId: "dept-computer-science",
    collegeId: "college-engineering",
  },
  {
    id: "prog-bsc-ce",
    name: "BSc Computer Engineering",
    departmentId: "dept-computer-science",
    collegeId: "college-engineering",
  },
  {
    id: "prog-msc-cs",
    name: "MSc Computer Science",
    departmentId: "dept-computer-science",
    collegeId: "college-engineering",
  },
  {
    id: "prog-bsc-ee",
    name: "BSc Electrical Engineering",
    departmentId: "dept-electrical",
    collegeId: "college-engineering",
  },
  {
    id: "prog-bsc-me",
    name: "BSc Mechanical Engineering",
    departmentId: "dept-mechanical",
    collegeId: "college-engineering",
  },
  {
    id: "prog-bsc-cve",
    name: "BSc Civil Engineering",
    departmentId: "dept-civil",
    collegeId: "college-engineering",
  },
  {
    id: "prog-bsc-che",
    name: "BSc Chemical Engineering",
    departmentId: "dept-chemical",
    collegeId: "college-engineering",
  },
  {
    id: "prog-bsc-pe",
    name: "BSc Petroleum Engineering",
    departmentId: "dept-chemical",
    collegeId: "college-engineering",
  },
  {
    id: "prog-bsba-acc",
    name: "BSBA Accounting",
    departmentId: "dept-accounting-finance",
    collegeId: "college-business",
  },
  {
    id: "prog-bsba-fin",
    name: "BSBA Finance",
    departmentId: "dept-accounting-finance",
    collegeId: "college-business",
  },
  {
    id: "prog-bsba-mgt",
    name: "BSBA Management",
    departmentId: "dept-management",
    collegeId: "college-business",
  },
  {
    id: "prog-mba",
    name: "Master of Business Administration",
    departmentId: "dept-management",
    collegeId: "college-business",
  },
  {
    id: "prog-bsba-mkt",
    name: "BSBA Marketing",
    departmentId: "dept-business-marketing",
    collegeId: "college-business",
  },
  {
    id: "prog-bsc-biotech",
    name: "BSc Biotechnology",
    departmentId: "dept-biotechnology",
    collegeId: "college-arts-sciences",
  },
  {
    id: "prog-bsc-math",
    name: "BSc Mathematics",
    departmentId: "dept-math-physics",
    collegeId: "college-arts-sciences",
  },
  {
    id: "prog-ba-english",
    name: "BA English Language and Literature",
    departmentId: "dept-humanities",
    collegeId: "college-arts-sciences",
  },
  {
    id: "prog-barch",
    name: "Bachelor of Architecture",
    departmentId: "dept-architecture",
    collegeId: "college-architecture",
  },
  {
    id: "prog-bsc-interior",
    name: "BSc Interior Design",
    departmentId: "dept-interior-design",
    collegeId: "college-architecture",
  },
];

/* -----------------------------------------------------------------------------
   Buildings and campuses

   Add an entry here to support a new location. Nothing in the application
   branches on a specific building id.
   -------------------------------------------------------------------------- */

export const CAMPUS_BUILDINGS: CampusBuildingOption[] = [
  { id: "building-a", name: "Building A", campus: "Ras Al Khaimah Campus" },
  { id: "building-g", name: "Building G", campus: "Ras Al Khaimah Campus" },
  { id: "building-k", name: "Building K", campus: "Ras Al Khaimah Campus" },
];

/* -----------------------------------------------------------------------------
   Hosting departments

   Deliberately a different list from the academic departments above — a
   Student Life or Admissions event has no academic department.
   -------------------------------------------------------------------------- */

export const HOSTING_DEPARTMENTS: HostingDepartment[] = [
  { id: "host-engineering", name: "Engineering" },
  { id: "host-business", name: "Business" },
  { id: "host-architecture", name: "Architecture" },
  { id: "host-student-life", name: "Student Life" },
  { id: "host-marketing", name: "Marketing" },
  { id: "host-admissions", name: "Admissions" },
  { id: "host-other", name: "Other" },
];

/* -----------------------------------------------------------------------------
   User types
   -------------------------------------------------------------------------- */

export const CAMPUS_USER_TYPE_LABELS: Record<CampusUserType, string> = {
  student: "Student",
  staff: "Staff",
  faculty: "Faculty",
};

export const CAMPUS_USER_TYPE_OPTIONS: Option<CampusUserType>[] = [
  { value: "student", label: "Students" },
  { value: "staff", label: "Staff" },
  { value: "faculty", label: "Faculty" },
];

/* =============================================================================
   LOOKUP HELPERS

   Always resolve display names through these. They return undefined rather
   than throwing so a stale id never crashes a screen.
   ========================================================================== */

export function getCollege(id?: string): College | undefined {
  return COLLEGES.find((c) => c.id === id);
}

export function getDepartment(id?: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.id === id);
}

export function getProgram(id?: string): Program | undefined {
  return PROGRAMS.find((p) => p.id === id);
}

export function getBuilding(id?: string): CampusBuildingOption | undefined {
  return CAMPUS_BUILDINGS.find((b) => b.id === id);
}

export function getHostingDepartment(
  id?: string
): HostingDepartment | undefined {
  return HOSTING_DEPARTMENTS.find((h) => h.id === id);
}

export function getCollegeName(id?: string): string | undefined {
  return getCollege(id)?.shortName;
}

export function getDepartmentName(id?: string): string | undefined {
  return getDepartment(id)?.name;
}

export function getProgramName(id?: string): string | undefined {
  return getProgram(id)?.name;
}

/** Departments belonging to the given colleges. Empty selection = all. */
export function getDepartmentsForColleges(collegeIds: string[]): Department[] {
  if (collegeIds.length === 0) return DEPARTMENTS;
  return DEPARTMENTS.filter((d) => collegeIds.includes(d.collegeId));
}

/** Programs belonging to the given departments. Empty selection = all. */
export function getProgramsForDepartments(departmentIds: string[]): Program[] {
  if (departmentIds.length === 0) return PROGRAMS;
  return PROGRAMS.filter((p) => departmentIds.includes(p.departmentId));
}

/* =============================================================================
   OPTION BUILDERS for <select> and multi-select controls
   ========================================================================== */

export const COLLEGE_OPTIONS: Option[] = COLLEGES.map((c) => ({
  value: c.id,
  label: c.shortName,
  description: c.name,
}));

export const BUILDING_OPTIONS: Option[] = CAMPUS_BUILDINGS.map((b) => ({
  value: b.id,
  label: b.name,
  description: b.campus,
}));

export const HOSTING_DEPARTMENT_OPTIONS: Option[] = HOSTING_DEPARTMENTS.map(
  (h) => ({ value: h.id, label: h.name })
);

export function departmentOptions(collegeIds: string[] = []): Option[] {
  return getDepartmentsForColleges(collegeIds).map((d) => ({
    value: d.id,
    label: d.name,
    description: getCollege(d.collegeId)?.shortName,
  }));
}

export function programOptions(departmentIds: string[] = []): Option[] {
  return getProgramsForDepartments(departmentIds).map((p) => ({
    value: p.id,
    label: p.name,
    description: getDepartment(p.departmentId)?.name,
  }));
}

/* =============================================================================
   DISPLAY
   ========================================================================== */

/**
 * One-line location label.
 *   { building-k, "K-204", "Innovation Lab" } -> "Innovation Lab, Building K (K-204)"
 *   { building-a }                            -> "Building A"
 */
export function formatCampusLocation(location: CampusLocation): string {
  const parts: string[] = [];
  if (location.locationName) parts.push(location.locationName);
  parts.push(location.buildingName);
  const base = parts.join(", ");
  return location.room ? `${base} (${location.room})` : base;
}