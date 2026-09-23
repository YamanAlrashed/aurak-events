import type { AuthUser, LoginCredentials, LoginResult } from "@/lib/types";
import { findMockAccount, MOCK_ACCOUNTS } from "@/lib/data/mock-accounts";
import {
  MOCK_LATENCY_MS,
  MOCK_PASSWORD,
  ROLE_HOME_ROUTES,
} from "@/lib/utils/constants";

/* =============================================================================
   MOCK AUTHENTICATION SERVICE

   PROTOTYPE ONLY — this is not authentication:
     - the password is a shared plaintext constant in the client bundle
     - the comparison happens in the browser
     - no session is verified by any server
     - anyone can bypass it entirely with devtools

   It exists so the frontend can be demonstrated and reviewed before AURAK
   SSO / EUMS is available.
   ========================================================================== */

function delay(ms = MOCK_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function signIn(
  credentials: LoginCredentials
): Promise<LoginResult> {
  await delay();

  const account = findMockAccount(credentials.email);

  if (!account) {
    return {
      ok: false,
      code: "ACCOUNT_NOT_RECOGNISED",
      message: "Account not recognized.",
    };
  }

  if (credentials.password !== MOCK_PASSWORD) {
    return {
      ok: false,
      code: "INCORRECT_PASSWORD",
      message: "Incorrect password.",
    };
  }

  return {
    ok: true,
    user: account,
    redirectTo: ROLE_HOME_ROUTES[account.role],
  };
}

export function getHomeRoute(user: AuthUser): string {
  return ROLE_HOME_ROUTES[user.role];
}

export async function listDemoAccounts(): Promise<AuthUser[]> {
  await delay(0);
  return MOCK_ACCOUNTS;
}