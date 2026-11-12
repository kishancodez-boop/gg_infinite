# Green Finance Directory & Green Jobs Portal (Milestone 10)

## 1. Overview
Milestone 10 implements two discovery directories for India's renewable energy ecosystem:
- **Green Finance Directory (`/finance`)**: Lists financing institutions, concessional credit programs, green bonds, grants/VGF, refinance facilities, and risk guarantees.
- **Green Jobs Portal (`/jobs`)**: Lists renewable-energy career pathways, organizations, locations, required skills, experience levels, employment types, and official application/source links.

## 2. Data Integrity & Non-Advisory Guardrails
- **Green Finance**:
  - GreenGrid India is a non-advisory directory. It does **not** invent or quote interest rates, loan terms, eligibility criteria, subsidies, or approval guarantees.
  - Every record displays a `DEMO` badge when `isDemoData: true`, or a `Verified` badge when `verificationStatus: 'verified'` and `isDemoData: false`.
  - Every record carries an `officialSourceUrl` and `lastVerifiedAt` timestamp (`"Not available"` when missing).
- **Green Jobs**:
  - GreenGrid India does **not** invent real vacancies or claim sample/DEMO records are active openings.
  - Users are explicitly advised to verify live vacancy status on the official employer or portal URL.

## 3. API Endpoints
All routes below require MongoDB (`requireDatabase` returns `503 DATABASE_UNAVAILABLE` when disconnected):
- `GET /api/v1/finance` — Paginated, Zod-validated list with `search`, `financeCategory`, `projectType`, `borrowerProfile`, `institutionName`, `verificationStatus`, and `dataMode` (`verified` | `demo` | `all`).
- `GET /api/v1/finance/:id` — Single finance program with populated `sourceRef`.
- `POST /api/v1/finance` — Protected by fail-closed `requireAdminAuth`.
- `GET /api/v1/jobs` — Paginated, Zod-validated list with `search`, `roleCategory`, `location`, `experienceLevel`, `employmentType`, `verificationStatus`, and `dataMode`.
- `GET /api/v1/jobs/:id` — Single job listing with populated `sourceRef`.
- `POST /api/v1/jobs` — Protected by fail-closed `requireAdminAuth`.

## 4. Limitations
- When `MONGODB_URI` is unconfigured, `/finance` and `/jobs` honestly render the `503 DATABASE_UNAVAILABLE` state rather than fabricating records.

