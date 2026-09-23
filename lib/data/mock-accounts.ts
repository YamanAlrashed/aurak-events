import type { AuthUser } from "@/lib/types";

/* =============================================================================
   MOCK SIGN-IN ACCOUNTS

   Prototype only. Every account shares one plaintext password (see
   MOCK_PASSWORD in lib/utils/constants.ts) compared in the browser. This is
   not authentication and must be removed when AURAK SSO / EUMS is connected.
   ========================================================================== */

export const MOCK_ACCOUNTS: AuthUser[] = [
  {
    id: "acct-campus-admin",
    email: "g.shalaby@aurak.ac.ae",
    fullName: "G. Shalaby",
    role: "campus_admin",
    module: "campus-events",
    initials: "GS",
    jobTitle: "Campus Events Administration",
    campusUserId: "cu-shalaby",
  },
  {
    id: "acct-campus-staff",
    email: "t.yamanalrashed@aurak.ac.ae",
    fullName: "T. Yaman Al Rashed",
    role: "campus_staff",
    module: "campus-events",
    initials: "TR",
    jobTitle: "Event Operations",
    campusUserId: "cu-yamanalrashed",
  },
  {
    id: "acct-campus-user",
    email: "2023006308@aurak.ac.ae",
    fullName: "Omar Al Hashmi",
    role: "campus_user",
    module: "campus-events",
    initials: "OA",
    jobTitle: "Student · Computer Science",
    campusUserId: "cu-2023006308",
  },
  {
    id: "acct-marketing-admin",
    email: "d.hindash@aurak.ac.ae",
    fullName: "D. Hindash",
    role: "marketing_admin",
    module: "marketing",
    initials: "DH",
    jobTitle: "Marketing & Recruitment",
  },
  {
    id: "acct-marketing-staff",
    email: "y.alrashed@aurak.ac.ae",
    fullName: "Y. Al Rashed",
    role: "marketing_staff",
    module: "marketing",
    initials: "YR",
    jobTitle: "Call Center",
    marketingStaffId: "staff-yaman",
  },
];

export function findMockAccount(email: string): AuthUser | undefined {
  const normalised = email.trim().toLowerCase();
  return MOCK_ACCOUNTS.find(
    (account) => account.email.toLowerCase() === normalised
  );
}