import { PageHeader } from "@/components/layout/PageHeader";

export default function CampusStaffHomePage() {
  return (
    <div className="page space-y-6">
      <PageHeader
        title="Today's Events"
        subtitle="Select an event to scan."
      />

      <div className="card card-pad">
        <p className="meta-text">
          Campus Staff check-in arrives in Phase 6.
        </p>
      </div>
    </div>
  );
}