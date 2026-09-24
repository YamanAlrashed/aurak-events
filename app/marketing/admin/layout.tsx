"use client";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { AdminShell } from "@/components/layout/AdminShell";
import { MARKETING_ADMIN_NAV } from "@/lib/config/navigation";

export default function MarketingAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allow={["marketing_admin"]}>
      <AdminShell moduleLabel="Marketing" navItems={MARKETING_ADMIN_NAV}>
        {children}
      </AdminShell>
    </RoleGuard>
  );
}