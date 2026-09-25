"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { MobileShell } from "@/components/layout/MobileShell";
import { CAMPUS_USER_TABS } from "@/lib/config/navigation";
import { getUnreadCount } from "@/lib/services/notificationService";
import { useAuth } from "@/lib/context/AuthContext";

const NOTIFICATIONS_HREF =
  "/campus-events/user/notifications";

function CampusUserShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } =
    useAuth();

  const pathname =
    usePathname();

  const [
    unread,
    setUnread,
  ] = useState(0);

  const campusUserId =
    user?.campusUserId;

  const refresh =
    useCallback(async () => {
      if (!campusUserId) {
        return;
      }

      setUnread(
        await getUnreadCount(
          campusUserId
        )
      );
    }, [campusUserId]);

  /*
   * Re-check on navigation so opening / reading notifications
   * refreshes the bottom-tab badge.
   */
  useEffect(() => {
    void refresh();
  }, [refresh, pathname]);

  return (
    <MobileShell
      moduleLabel="Campus Events"
      tabs={
        CAMPUS_USER_TABS
      }
      badges={{
        [NOTIFICATIONS_HREF]:
          unread,
      }}
    >
      {children}
    </MobileShell>
  );
}

export default function CampusUserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard
      allow={[
        "campus_user",
      ]}
    >
      <CampusUserShell>
        {children}
      </CampusUserShell>
    </RoleGuard>
  );
}