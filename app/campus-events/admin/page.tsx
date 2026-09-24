import { PageHeader } from "@/components/layout/PageHeader";

export default function CampusAdminDashboardPage() {
  return (
    <div className="page space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Upcoming events, this week, and recently completed."
      />

      <div className="card card-pad">
        <p className="meta-text">
          Campus Events Admin dashboard arrives in Phase 5.
        </p>
      </div>
    </div>
  );
}