import { STAFF_GROUPS } from "@/lib/data/marketing-reference";
import { CAMPUS_BUILDINGS, PROGRAMS } from "@/lib/data/campus-reference";
import { CRM_STATUS_ORDER, CRM_STATUS_LABELS } from "@/lib/utils/constants";

export default function ReferenceDataCheck() {
  return (
    <main className="page mx-auto max-w-3xl space-y-6">
      <h1 className="page-title">Reference Data Check</h1>

      <section className="card card-pad space-y-3">
        <h2 className="section-title">Staff groups</h2>

        {STAFF_GROUPS.map((g) => (
          <div key={g.department}>
            <p className="label">
              {g.label} ({g.members.length})
            </p>

            <div className="flex flex-wrap gap-2">
              {g.members.map((m) => (
                <span key={m.id} className="badge badge-neutral">
                  {m.initials} · {m.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="card card-pad">
        <h2 className="section-title">Buildings</h2>

        <p className="meta-text">
          {CAMPUS_BUILDINGS.map((b) => b.name).join(" · ")}
        </p>
      </section>

      <section className="card card-pad">
        <h2 className="section-title">Programs</h2>

        <p className="meta-text">
          {PROGRAMS.length} programs loaded
        </p>
      </section>

      <section className="card card-pad">
        <h2 className="section-title">CRM statuses</h2>

        <div className="flex flex-wrap gap-2">
          {CRM_STATUS_ORDER.map((s) => (
            <span key={s} className="badge badge-brand">
              {CRM_STATUS_LABELS[s]}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}