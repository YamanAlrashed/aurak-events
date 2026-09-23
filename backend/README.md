# AURAK Events — Backend

Node.js + Express 5 + PostgreSQL REST API for the University Marketing & Events Platform.
The Next.js frontend lives in the repo root; this folder is the API only.

## Structure

```
backend/
├── server.js              # app setup, route mounting, starts Meritto worker
├── db.js                  # pg connection pool
├── middleware/            # auth (JWT + roles), upload (multer), errorHandler
├── controllers/           # auth, users, events, registrations, checkin, photos, analytics, crm
├── routes/                # one router per controller
├── services/              # meritto.js (API adapter), merittoFieldMap.js, crmWorker.js, crmQueue.js
├── scripts/initDb.js      # creates tables / loads seed data
└── uploads/               # gallery photos (dev only)
db/
├── schema.sql             # all tables
├── seed.sql               # sample data (password for all users: password123)
└── queries.sql            # main JOIN queries
docs/
├── api-contract.md        # every endpoint + request/response shapes (for the frontend)
└── data-layer.md          # tables & relationships
```

## Run locally

1. Install PostgreSQL and create a database: `CREATE DATABASE aurak_events;`
2. Setup:
   ```bash
   cd backend
   npm install
   cp .env.example .env        # then edit DATABASE_URL and JWT_SECRET
   npm run db:reset            # creates tables + sample data (⚠️ drops existing tables)
   npm run dev                 # http://localhost:5000
   ```
3. Check: `http://localhost:5000/api/health`

Frontend (repo root) runs on `http://localhost:3000` — already allowed by CORS (`CLIENT_URL`).
In the Next.js app set `NEXT_PUBLIC_API_URL=http://localhost:5000` in `.env.local`.

Hosted DB (Render / Neon / Supabase): paste their connection string into `DATABASE_URL` and set `DB_SSL=true`.

## Meritto integration

Registrations and check-ins of **prospective students who ticked the consent box** are written to
`crm_sync_jobs` in the same DB transaction. A background worker (every 30s) sends them to Meritto
and retries with backoff if Meritto fails. Admins can monitor/retry via `/api/crm/*`.

| `MERITTO_MODE` | Behaviour |
|---|---|
| `mock` (default) | No network calls. Fake lead IDs like `MOCK-E6B686F752`. Use for development & demos. |
| `live` | Real calls to `MERITTO_BASE_URL + MERITTO_LEAD_PATH` with `access-key` / `secret-key` headers. |
| `off` | No jobs created or processed. |

**To switch to live**, get from the university's Meritto admin:

- API access keys (`access-key`, `secret-key`) — ideally a sandbox first
- The correct base URL + lead create/update endpoint for our instance
- Field keys for name, email, mobile, course, source, campaign + any custom fields → update `services/merittoFieldMap.js`
- Lead source / campaign values to use, and how duplicates (same email/phone) are handled
- How to record "attended event" (activity vs. lead stage) and the response format (where the lead ID is)

Only `services/meritto.js` and `services/merittoFieldMap.js` need to change — nothing else touches Meritto.

## Notes / future work

- Photos are stored on local disk (`backend/uploads`). For production move to S3 / Cloudflare R2 / Supabase Storage.
- Facial recognition was evaluated and left out (privacy/consent under UAE PDPL). Attendance uses QR check-in.
