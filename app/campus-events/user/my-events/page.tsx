import { PageHeader } from "@/components/layout/PageHeader";

export default function CampusUserMyEventsPage() {
  return (
    <div className="page space-y-6">
      <PageHeader
        title="My Events"
        subtitle="Your RSVPs and events you attended."
      />

      <div className="card card-pad">
        <p className="meta-text">
          My Events arrives in Phase 7.
        </p>
      </div>
    </div>
  );
}