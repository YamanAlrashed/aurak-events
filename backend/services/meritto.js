// ─────────────────────────────────────────────────────────────────────────────
// Meritto (NoPaperForms) API adapter
// The rest of the app ONLY talks to Meritto through this file.
//
// MERITTO_MODE=mock → no network calls, returns fake lead IDs (for dev/demo)
// MERITTO_MODE=live → real HTTPS calls using access-key / secret-key headers
// Endpoint path + payload keys must be confirmed with the university's
// Meritto admin / API docs (developer.nopaperforms.com).
// ─────────────────────────────────────────────────────────────────────────────
const crypto = require('crypto');
const { buildLeadPayload, buildAttendancePayload } = require('./merittoFieldMap');

const mode = () => (process.env.MERITTO_MODE || 'mock').toLowerCase();

async function callMeritto(payload) {
  const { MERITTO_BASE_URL, MERITTO_LEAD_PATH, MERITTO_ACCESS_KEY, MERITTO_SECRET_KEY } = process.env;
  if (!MERITTO_ACCESS_KEY || !MERITTO_SECRET_KEY) {
    throw new Error('MERITTO_ACCESS_KEY / MERITTO_SECRET_KEY are not set');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${MERITTO_BASE_URL}${MERITTO_LEAD_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-key': MERITTO_ACCESS_KEY,
        'secret-key': MERITTO_SECRET_KEY
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { raw: text }; }
    if (!res.ok) {
      const err = new Error(`Meritto HTTP ${res.status}: ${text.slice(0, 300)}`);
      err.retryable = res.status >= 500 || res.status === 429;
      throw err;
    }
    // Lead ID location depends on Meritto's response format — adjust once confirmed
    const leadId = body?.data?.lead_id || body?.lead_id || body?.data?.id || body?.id || null;
    return { leadId, body };
  } finally {
    clearTimeout(timeout);
  }
}

// Create the lead, or update it if Meritto already has this email/phone
async function upsertLead(reg) {
  const payload = buildLeadPayload(reg);
  if (mode() === 'mock') {
    const leadId = reg.meritto_lead_id || `MOCK-${crypto.createHash('md5').update(reg.email).digest('hex').slice(0, 10).toUpperCase()}`;
    return { leadId, body: { mock: true, sent: payload } };
  }
  return callMeritto(payload);
}

// Record that the lead attended the event
async function logAttendance(reg) {
  const payload = buildAttendancePayload(reg);
  if (mode() === 'mock') {
    return { leadId: reg.meritto_lead_id || null, body: { mock: true, sent: payload } };
  }
  return callMeritto(payload);
}

module.exports = { upsertLead, logAttendance, mode };
