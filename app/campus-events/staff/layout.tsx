import { RoleGuard } from "@/components/layout/RoleGuard";
import { MobileShell } from "@/components/layout/MobileShell";

export default function CampusStaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allow={["campus_staff"]}>
      <MobileShell moduleLabel="Campus Events · Staff">
        {children}
      </MobileShell>
    </RoleGuard>
  );
}