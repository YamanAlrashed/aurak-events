import { PageHeader } from "@/components/layout/PageHeader";

export default function MarketingStaffHomePage() {
  return (
    <div className="page space-y-6">
      <PageHeader
        title="My Events"
        subtitle="Today, upcoming, and events you're assigned to."
      />

      <div className="card card-pad">
        <p className="meta-text">
          Marketing Staff screens arrive in Phase 9.
        </p>
      </div>
    </div>
  );
}