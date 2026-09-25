# AURAK Events & Marketing Platform — Prototype Notes

Frontend-only prototype. Next.js App Router, TypeScript, Tailwind CSS v4.

**Nothing in this build is production software.** There is no server, no
database and no real authentication. All application state lives in the
browser's `localStorage` under the key `aurak.mock-db.v1`.

## Two modules, one platform

| Module | Roles | Audience |
|---|---|---|
| Campus Events | `campus_admin`, `campus_staff`, `campus_user` | Existing AURAK students, staff and faculty |
| Marketing | `marketing_admin`, `marketing_staff` | Prospective students and their guests |

Campus internal users and Marketing prospects are **separate data models**
(`CampusUser` vs `MarketingRegistrant`) and must stay separate.

## Business rules encoded in the code

1. **Target audience controls notifications only.** Every published campus
   event is visible to every internal user. The rule lives in one function:
   `matchesAudience()` in `lib/services/notificationService.ts`. No list query
   filters events by audience.

2. **RSVP is not attendance.** RSVP is an intention
   (`lib/services/campusRsvpService.ts`); attendance exists only as a QR
   check-in record (`lib/services/campusAttendanceService.ts`).

3. **One QR per user + event.** It is issued for Yes or Maybe and hidden when
   the user chooses No.

4. **Photo notifications go to attendees**, meaning `checkedIn === true` —
   never to people who only replied to the RSVP.

5. **Galleries stay browsable for 24 months**, then become archived. Photos are
   never automatically deleted and Campus Admin keeps archive access.

6. **Only checked-in attendees can rate an event.** Campus users see the average
   and count when the admin toggle allows it. Only Campus Admin sees individual
   comments and suggestions.

7. **Visitors are not students.** `students` represents registered prospects.
   `visitors` is the sum of `visitorCount` across check-ins, where
   `visitorCount` includes the prospect themselves. These figures are never
   added together.

8. **CRM status and event attribution are separate.** CRM status can change over
   time. Attribution remains attached to `MarketingRegistration.eventId`.

9. **Marketing staff only see assigned events.** Staff assignment exists only in
   the Marketing module and must never be added to Campus events.

10. **Campus locations are Building A, Building G and Building K only.**
    Al Ain belongs to Marketing locations and is not a Campus building.

## Sign-in accounts

All prototype accounts use the password `Aurak`.

| Email | Role |
|---|---|
| g.shalaby@aurak.ac.ae | Campus Events Admin |
| t.yamanalrashed@aurak.ac.ae | Campus Events Staff |
| 2023006308@aurak.ac.ae | Campus Events User |
| d.hindash@aurak.ac.ae | Marketing Admin |
| y.alrashed@aurak.ac.ae | Marketing Staff |

## Marketing public registration

### Pre-registration

Fields:

- Full Name
- Phone
- Email
- Program of Interest
- Intake
- Emirate of Residence

Pre-registration does **not** collect a guest count.

A unique QR is generated for the registrant and event.

### Walk-in registration

Fields:

- Full Name
- Phone
- Email
- Program of Interest
- Intake
- Emirate of Residence
- Number of Guests / Visitors

Visitor count means the **total number of people physically arriving, including
the prospect**.

Example:

- Prospect + 2 companions
- Students / Prospects = 1
- Visitors = 3

Do not use a family-count metric.

## Marketing CRM

The prototype contains a mock service standing in for Meritto.

CRM statuses:

- Enrolled
- Accepted
- Admitted
- Lead
- New Lead

`New Lead` means the prospect was not found in the mock CRM.

Event/source attribution and current CRM status remain separate.

## What is mocked, and where to replace it

| Concern | Current implementation | Replace in |
|---|---|---|
| Authentication | Shared prototype password compared in the browser | `lib/services/authService.ts`, `lib/context/AuthContext.tsx` |
| User directory / EUMS | Deterministic generated Campus directory | `lib/data/campus-users.ts` |
| Persistence | Browser `localStorage` | `lib/data/store.ts` and service implementations |
| Campus QR | Deterministic prototype QR | `components/shared/MockQrCode.tsx` |
| Marketing QR | Deterministic prototype QR | `components/shared/MockQrCode.tsx` |
| QR scanning | Sample codes / manual simulation, no camera | `components/shared/MockQrScanner.tsx` |
| CRM / Meritto | Hash-based deterministic mock status | `lib/services/mockCrmService.ts` |
| Photo storage | Gradient mock images | `lib/utils/mockPhoto.ts`, `lib/services/galleryService.ts` |
| Notifications | In-app records only | `lib/services/notificationService.ts` |
| Export | Client-side CSV using `Blob` | `lib/services/exportService.ts` |
| Gallery archiving | Evaluated when data is read | Replace with a scheduled backend job |

## Future AURAK integration

Production infrastructure may later replace the mock pieces with:

- AURAK SSO
- OIDC / OAuth2 / SAML as appropriate
- EUMS integration
- Meritto integration
- Node / TypeScript backend
- PostgreSQL
- production file/object storage
- scheduled jobs
- email / push notification provider
- real QR scanner
- Docker-based deployment
- backups
- university domain and infrastructure

The application should **not store AURAK passwords**.

DBeaver is a database client, not the backend.

## Architecture direction

Long-term preference:

- Next.js / TypeScript frontend
- Node / TypeScript backend
- PostgreSQL
- modular monolith
- portable deployment
- service abstraction so mock services can later be replaced by real APIs
- Docker when infrastructure is introduced

## Resetting demo data

Both admin dashboards include a **Reset demo data** control.

Resetting:

- removes browser-side changes made during the demo
- rebuilds the original deterministic seed data
- reloads the application

This feature is prototype-only and should be removed when a real backend is
connected.