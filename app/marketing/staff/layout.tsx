import { RoleGuard } from "@/components/layout/RoleGuard";
import { MobileShell } from "@/components/layout/MobileShell";

export default function MarketingStaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allow={["marketing_staff"]}>
      <MobileShell moduleLabel="Marketing · Staff">
        {children}
      </MobileShell>
    </RoleGuard>
  );
}