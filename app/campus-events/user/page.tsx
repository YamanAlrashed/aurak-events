import { PageHeader } from "@/components/layout/PageHeader";

export default function CampusUserHomePage() {
  return (
    <div className="page space-y-6">
      <PageHeader
        title="Events"
        subtitle="What's happening at AURAK."
      />

      <div className="card card-pad">
        <p className="meta-text">
          Campus User home arrives in Phase 7.
        </p>
      </div>
    </div>
  );
}