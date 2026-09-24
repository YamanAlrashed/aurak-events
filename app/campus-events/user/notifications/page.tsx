import { PageHeader } from "@/components/layout/PageHeader";

export default function CampusUserNotificationsPage() {
  return (
    <div className="page space-y-6">
      <PageHeader title="Notifications" />

      <div className="card card-pad">
        <p className="meta-text">
          Notifications arrive in Phase 7.
        </p>
      </div>
    </div>
  );
}