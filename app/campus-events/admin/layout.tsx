"use client";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { AdminShell } from "@/components/layout/AdminShell";
import { CAMPUS_ADMIN_NAV } from "@/lib/config/navigation";

export default function CampusAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allow={["campus_admin"]}>
      <AdminShell
        moduleLabel="Campus Events"
        navItems={CAMPUS_ADMIN_NAV}
      >
        {children}
      </AdminShell>
    </RoleGuard>
  );
}