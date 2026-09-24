import { PageHeader } from "@/components/layout/PageHeader";

export default function MarketingAdminDashboardPage() {
  return (
    <div className="page space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Recruitment events, registrations and visitors."
      />

      <div className="card card-pad">
        <p className="meta-text">
          Marketing Admin dashboard arrives in Phase 8.
        </p>
      </div>
    </div>
  );
}