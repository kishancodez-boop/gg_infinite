# GreenGrid India — Policies & Government Schemes Explorer (Milestone 06)

## 1. Overview

The Policies & Government Schemes Explorer (`/policies`) provides a searchable, filterable directory of Indian renewable-energy policies and government schemes backed by the `PolicyScheme` and `DataSource` Mongoose models.

## 2. API Endpoints

All endpoints are guarded by `requireDatabase` (`503 DATABASE_UNAVAILABLE` when MongoDB is disconnected or unconfigured) and validated with Zod schemas:

- `GET /api/v1/policies` — Public paginated list of policies (supports `recordKind=all` to return both policies and schemes).
- `GET /api/v1/policies/:id` — Public detail lookup with populated `sourceRef`.
- `GET /api/v1/schemes` — Public paginated list of schemes.
- `GET /api/v1/schemes/:id` — Public detail lookup with populated `sourceRef`.
- `POST /api/v1/policies` & `POST /api/v1/schemes` — Protected by `requireAdminAuth` (fail closed with `403 ADMIN_AUTH_NOT_CONFIGURED` when `ADMIN_API_KEY` is unset).

### Supported Query Filters

- `search`: Case-insensitive regex match across `title`, `description`, and `issuingOrganization`.
- `recordKind`: `policy`, `scheme`, or `all`.
- `jurisdiction`: `central` or `state`.
- `stateOrRegion`: Case-insensitive state/region filter.
- `technology`: `solar`, `wind`, `hybrid`, `storage`, `grid`, `efficiency`, `general`.
- `schemeCategory`: `subsidy`, `incentive`, `regulatory_policy`, `tariff_order`, `mission`, `other`.
- `issuingOrganization`: Case-insensitive issuing authority filter.
- `status`: `active`, `inactive`, `unknown`.
- `dataMode`: `verified` (default on API), `demo`, or `all`.
- `page`, `limit`, `sortBy` (`effectiveDate`, `lastVerifiedAt`, `createdAt`, `title`), `sortOrder` (`asc`, `desc`).

## 3. Data Provenance & Demo Rules

- **No Invented Details:** Eligibility, subsidies, benefits, effective/expiry dates, and last-verified dates are never fabricated. Missing fields render `"Not available"` in the UI.
- **Demo Separation:** Demo records carry `isDemoData: true` and are visibly labeled with `DEMO` badges and an explicit warning banner in the detail drawer.
- **Current Limitation:** `MONGODB_URI` is currently unconfigured; when disconnected, `/policies` displays an honest `503 Service Unavailable` state instead of fabricated fallback rows.

