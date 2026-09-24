import { PageHeader } from "@/components/layout/PageHeader";

export default function CampusUserLocationsPage() {
  return (
    <div className="page space-y-6">
      <PageHeader
        title="Events by Location"
        subtitle="Browse events by building."
      />

      <div className="card card-pad">
        <p className="meta-text">
          Location browsing arrives in Phase 7.
        </p>
      </div>
    </div>
  );
}
