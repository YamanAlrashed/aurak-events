"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/types";
import { useAuth } from "@/lib/context/AuthContext";
import { LOGIN_ROUTE, ROLE_HOME_ROUTES } from "@/lib/utils/constants";

export function RoleGuard({
  allow,
  children,
}: {
  allow: UserRole[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isRestoring } = useAuth();

  const isAllowed = user !== null && allow.includes(user.role);

  useEffect(() => {
    if (isRestoring) return;

    if (!user) {
      router.replace(LOGIN_ROUTE);
      return;
    }

    if (!allow.includes(user.role)) {
      router.replace(ROLE_HOME_ROUTES[user.role]);
    }
  }, [isRestoring, user, allow, router]);

  if (isRestoring || !isAllowed) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-3" aria-hidden>
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-24 w-full" />
        </div>

        <span className="sr-only">Loading</span>
      </div>
    );
  }

  return <>{children}</>;
}