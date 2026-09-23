// ─────────────────────────────────────────────────────────────────────────────
// Meritto field mapping
// Maps OUR registration data → the JSON body Meritto expects.
//
// ⚠️ The keys on the LEFT are placeholders. Replace them with the exact field
// keys from the university's Meritto instance (ask the Meritto admin for the
// lead form field keys, custom fields, and allowed dropdown values).
// ─────────────────────────────────────────────────────────────────────────────
function buildLeadPayload(reg) {
  const [firstName, ...rest] = (reg.name || '').trim().split(/\s+/);
  return {
    name: reg.name,
    first_name: firstName || '',
    last_name: rest.join(' '),
    email: reg.email,
    mobile: reg.phone || '',
    course: reg.program_interest || '',
    source: process.env.MERITTO_SOURCE || 'AURAK Events Platform',
    sub_source: reg.event_category,
    campaign: reg.event_title,
    // custom field examples — rename to the real Meritto keys
    event_name: reg.event_title,
    event_date: reg.event_start ? new Date(reg.event_start).toISOString().split('T')[0] : '',
    consent: reg.marketing_consent ? 'Yes' : 'No'
  };
}

function buildAttendancePayload(reg) {
  return {
    ...buildLeadPayload(reg),
    lead_stage: 'Event Attended',          // placeholder — use the real stage/activity name
    activity: `Attended: ${reg.event_title}`,
    attended_at: reg.checked_in_at
  };
}

module.exports = { buildLeadPayload, buildAttendancePayload };
