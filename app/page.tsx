/**
 * TEMPORARY — design system smoke test.
 * Replaced by the shared login page in Phase 3.
 */
export default function DesignSystemPreview() {
  return (
    <main className="page mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="page-title">Design System Check</h1>
        <p className="page-subtitle">
          Temporary page. If this looks styled, Phase 1 is working.
        </p>
      </header>

      {/* Buttons */}
      <section className="card card-pad space-y-4">
        <h2 className="section-title">Buttons</h2>

        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary">Create Event</button>
          <button className="btn btn-secondary">Export</button>
          <button className="btn btn-ghost">Cancel</button>
          <button className="btn btn-danger-soft">Delete</button>
          <button className="btn btn-primary btn-sm">Small</button>

          <button className="btn btn-primary" disabled>
            Disabled
          </button>
        </div>

        <button className="btn btn-primary btn-touch btn-block sm:w-auto">
          Scan QR (staff touch target)
        </button>
      </section>

      {/* Status badges */}
      <section className="card card-pad space-y-4">
        <h2 className="section-title">Event Status</h2>

        <div className="flex flex-wrap gap-2">
          <span className="badge badge-upcoming">
            <span className="badge-dot" />
            Upcoming
          </span>

          <span className="badge badge-live">
            <span className="badge-dot" />
            Live
          </span>

          <span className="badge badge-completed">Completed</span>
          <span className="badge badge-archived">Archived</span>
          <span className="badge badge-brand">Engineering</span>
        </div>
      </section>

      {/* Stat cards */}
      <section className="space-y-3">
        <h2 className="section-title">Stats</h2>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="stat-card">
            <p className="stat-label">RSVP Yes</p>
            <p className="stat-value">160</p>
            <p className="stat-caption">Not attendance</p>
          </div>

          <div className="stat-card">
            <p className="stat-label">RSVP Maybe</p>
            <p className="stat-value">42</p>
          </div>

          <div className="stat-card">
            <p className="stat-label">Checked In</p>
            <p className="stat-value">127</p>
            <p className="stat-caption">From QR scans</p>
          </div>

          <div className="stat-card">
            <p className="stat-label">Visitors</p>
            <p className="stat-value">649</p>
          </div>
        </div>
      </section>

      {/* Form controls */}
      <section className="card card-pad space-y-4">
        <h2 className="section-title">Form Controls</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label label-required">Event Name</label>
            <input className="input" placeholder="AI Workshop" />
          </div>

          <div>
            <label className="label label-required">Location</label>

            <select className="select" defaultValue="">
              <option value="" disabled>
                Select a building
              </option>
              <option>Building A</option>
              <option>Building G</option>
              <option>Building K</option>
              <option>Al Ain</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="label">Description</label>

            <textarea className="textarea" placeholder="Optional" />

            <p className="field-hint">Optional field.</p>
          </div>

          <div>
            <label className="label">Error state</label>

            <input
              className="input input-error"
              defaultValue="bad value"
            />

            <p className="field-error">This field is required.</p>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="card overflow-hidden">
        <div className="card-header">
          <span className="card-title">Attendees</span>

          <button className="btn btn-secondary btn-sm">
            Export
          </button>
        </div>

        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Department</th>
                <th>RSVP</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Sara Al Mansoori</td>
                <td>Student</td>
                <td>Engineering</td>
                <td>Yes</td>

                <td>
                  <span className="badge badge-success">
                    Checked In
                  </span>
                </td>
              </tr>

              <tr>
                <td>Omar Haddad</td>
                <td>Faculty</td>
                <td>Business</td>
                <td>Maybe</td>

                <td>
                  <span className="badge badge-neutral">
                    Not Checked In
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Alerts */}
      <section className="space-y-3">
        <h2 className="section-title">Alerts</h2>

        <div className="alert alert-error">
          Incorrect password.
        </div>

        <div className="alert alert-success">
          Attendance confirmed.
        </div>

        <div className="alert alert-info">
          Everyone can see this event. Target audience controls notifications
          only.
        </div>

        <div className="alert alert-warning">
          This gallery is archived (older than 24 months).
        </div>
      </section>

      {/* Empty + skeleton */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="card">
          <div className="empty-state">
            <p className="section-title">No events yet</p>

            <p className="meta-text">
              Create your first event to get started.
            </p>

            <button className="btn btn-primary btn-sm mt-2">
              Create Event
            </button>
          </div>
        </div>

        <div className="card card-pad space-y-3">
          <div className="skeleton h-4 w-1/3" />
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-24 w-full" />
        </div>
      </section>
    </main>
  );
}