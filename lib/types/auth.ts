import type { AppModule } from "./common";

/* =============================================================================
   Mock authentication.

   NOT production authentication. There is no token, no session signature and
   no server verification. The real platform will replace this with AURAK
   SSO / EUMS. These types are the seam: keep them stable and the swap is a
   service-level change only.
   ========================================================================== */

export type UserRole =
  | "campus_admin"
  | "campus_staff"
  | "campus_user"
  | "marketing_admin"
  | "marketing_staff";

/** The person currently signed in, as far as the UI is concerned. */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  module: AppModule;
  initials: string;
  jobTitle?: string;

  campusUserId?: string;
  marketingStaffId?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export type LoginErrorCode =
  | "ACCOUNT_NOT_RECOGNISED"
  | "INCORRECT_PASSWORD";

export type LoginResult =
  | {
      ok: true;
      user: AuthUser;
      redirectTo: string;
    }
  | {
      ok: false;
      code: LoginErrorCode;
      message: string;
    };

export interface StoredSession {
  user: AuthUser;
  signedInAt: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isRestoring: boolean;
  signIn: (credentials: LoginCredentials) => Promise<LoginResult>;
  signOut: () => void;
}