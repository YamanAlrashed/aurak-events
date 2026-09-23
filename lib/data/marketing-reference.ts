import type {
  Emirate,
  Intake,
  MarketingEventType,
  MarketingStaffMember,
  Option,
  ProgramOfInterest,
  StaffDepartment,
} from "@/lib/types";

/* =============================================================================
   MOCK REFERENCE DATA — Marketing
   ========================================================================== */

/* -----------------------------------------------------------------------------
   Event types
   -------------------------------------------------------------------------- */

export const MARKETING_EVENT_TYPE_LABELS: Record<MarketingEventType, string> = {
  open_day: "Open Day",
  school_visit: "School Visit",
  school_workshop: "School Workshop",
  exhibition: "Exhibition",
  information_session: "Information Session",
  other: "Other",
};

export const MARKETING_EVENT_TYPE_OPTIONS: Option<MarketingEventType>[] = (
  Object.keys(MARKETING_EVENT_TYPE_LABELS) as MarketingEventType[]
).map((value) => ({ value, label: MARKETING_EVENT_TYPE_LABELS[value] }));

/* -----------------------------------------------------------------------------
   Emirates
   -------------------------------------------------------------------------- */

export const EMIRATE_LABELS: Record<Emirate, string> = {
  ras_al_khaimah: "Ras Al Khaimah",
  dubai: "Dubai",
  sharjah: "Sharjah",
  abu_dhabi: "Abu Dhabi",
  ajman: "Ajman",
  umm_al_quwain: "Umm Al Quwain",
  fujairah: "Fujairah",
  al_ain: "Al Ain",
  other: "Other",
};

export const EMIRATE_OPTIONS: Option<Emirate>[] = (
  Object.keys(EMIRATE_LABELS) as Emirate[]
).map((value) => ({ value, label: EMIRATE_LABELS[value] }));

/* -----------------------------------------------------------------------------
   Programs of interest

   What a prospective student picks on the registration form. Phrased for an
   external audience, and separate from the internal PROGRAMS list.
   -------------------------------------------------------------------------- */

export const PROGRAMS_OF_INTEREST: ProgramOfInterest[] = [
  { id: "poi-cs", name: "Computer Science", collegeName: "Engineering" },
  { id: "poi-ce", name: "Computer Engineering", collegeName: "Engineering" },
  { id: "poi-ee", name: "Electrical Engineering", collegeName: "Engineering" },
  { id: "poi-me", name: "Mechanical Engineering", collegeName: "Engineering" },
  { id: "poi-cve", name: "Civil Engineering", collegeName: "Engineering" },
  { id: "poi-che", name: "Chemical Engineering", collegeName: "Engineering" },
  { id: "poi-pe", name: "Petroleum Engineering", collegeName: "Engineering" },
  { id: "poi-acc", name: "Accounting", collegeName: "Business" },
  { id: "poi-fin", name: "Finance", collegeName: "Business" },
  { id: "poi-mgt", name: "Management", collegeName: "Business" },
  { id: "poi-mkt", name: "Marketing", collegeName: "Business" },
  { id: "poi-mba", name: "MBA", collegeName: "Business" },
  {
    id: "poi-biotech",
    name: "Biotechnology",
    collegeName: "Arts & Sciences",
  },
  { id: "poi-arch", name: "Architecture", collegeName: "Architecture" },
  {
    id: "poi-interior",
    name: "Interior Design",
    collegeName: "Architecture",
  },
  { id: "poi-undecided", name: "Still deciding", collegeName: "—" },
];

export const PROGRAM_OF_INTEREST_OPTIONS: Option[] = PROGRAMS_OF_INTEREST.map(
  (p) => ({ value: p.id, label: p.name, description: p.collegeName })
);

export function getProgramOfInterest(
  id?: string
): ProgramOfInterest | undefined {
  return PROGRAMS_OF_INTEREST.find((p) => p.id === id);
}

export function getProgramOfInterestName(id?: string): string {
  return getProgramOfInterest(id)?.name ?? "Not specified";
}

/* -----------------------------------------------------------------------------
   Intakes
   -------------------------------------------------------------------------- */

export const INTAKES: Intake[] = [
  { id: "intake-spring-2027", label: "Spring 2027" },
  { id: "intake-fall-2026", label: "Fall 2026" },
  { id: "intake-spring-2026", label: "Spring 2026" },
  { id: "intake-undecided", label: "Not decided yet" },
];

export const INTAKE_OPTIONS: Option[] = INTAKES.map((i) => ({
  value: i.id,
  label: i.label,
}));

export function getIntake(id?: string): Intake | undefined {
  return INTAKES.find((i) => i.id === id);
}

export function getIntakeLabel(id?: string): string {
  return getIntake(id)?.label ?? "Not specified";
}

/* -----------------------------------------------------------------------------
   Staff directory
   -------------------------------------------------------------------------- */

export const STAFF_DEPARTMENT_LABELS: Record<StaffDepartment, string> = {
  admission: "Admission",
  student_recruitment: "Student Recruitment",
  call_center: "Call Center",
};

/** Render order for the assignment picker groups. */
export const STAFF_DEPARTMENT_ORDER: StaffDepartment[] = [
  "admission",
  "student_recruitment",
  "call_center",
];

/** "Jumana" -> "JU", "Yaman Al Rashed" -> "YR" */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** "Jumana" -> "staff-jumana" */
function staffIdOf(name: string): string {
  return `staff-${name.toLowerCase().replace(/\s+/g, "-")}`;
}

const STAFF_NAMES_BY_DEPARTMENT: Record<StaffDepartment, string[]> = {
  admission: ["Jumana", "Ali", "Fatmeh"],
  student_recruitment: ["Yousef", "Laura", "Patson", "Aruzhan"],
  call_center: [
    "Yaman",
    "Fares",
    "Shehab",
    "Salma",
    "Malak",
    "Miadah",
    "Amer",
    "Yasmine",
    "Imad",
    "Abijith",
    "Arshad",
    "Osama",
    "Abeer",
    "Pom",
    "Nahom",
    "Dany",
  ],
};

export const MARKETING_STAFF: MarketingStaffMember[] =
  STAFF_DEPARTMENT_ORDER.flatMap((department) =>
    STAFF_NAMES_BY_DEPARTMENT[department].map((name) => ({
      id: staffIdOf(name),
      name,
      department,
      initials: initialsOf(name),
    }))
  );

export function getStaffMember(id?: string): MarketingStaffMember | undefined {
  return MARKETING_STAFF.find((s) => s.id === id);
}

export function getStaffByDepartment(
  department: StaffDepartment
): MarketingStaffMember[] {
  return MARKETING_STAFF.filter((s) => s.department === department);
}

/** Grouped shape consumed directly by the multi-select assignment picker. */
export interface StaffGroup {
  department: StaffDepartment;
  label: string;
  members: MarketingStaffMember[];
}

export const STAFF_GROUPS: StaffGroup[] = STAFF_DEPARTMENT_ORDER.map(
  (department) => ({
    department,
    label: STAFF_DEPARTMENT_LABELS[department],
    members: getStaffByDepartment(department),
  })
);