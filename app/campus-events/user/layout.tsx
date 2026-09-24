"use client";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { MobileShell } from "@/components/layout/MobileShell";
import { CAMPUS_USER_TABS } from "@/lib/config/navigation";

export default function CampusUserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allow={["campus_user"]}>
      <MobileShell
        moduleLabel="Campus Events"
        tabs={CAMPUS_USER_TABS}
      >
        {children}
      </MobileShell>
    </RoleGuard>
  );
}
