# GreenGrid India — Backend API, Data Models & Provenance Guide

## 1. Endpoints vs. MongoDB Dependency

| Endpoint | Methods | MongoDB Required? | Behavior Without MongoDB |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | No | Returns `200 OK` with `status: "degraded"` and `database.status: "unconfigured"` (or `"disconnected"`). |
| `/api/v1/system/status` | `GET` | No | Returns `200 OK` with `apiStatus: "operational"` and accurate database readiness details. |
| `/api/v1/sources` | `GET` | Yes | Returns `503 DATABASE_UNAVAILABLE` immediately (`requireDatabase` guard). |
| `/api/v1/sources` & `/api/v1/sources/:id` | `POST`, `PATCH`, `DELETE` | Yes + Admin Auth | Protected by `requireAdminAuth` (`403 ADMIN_AUTH_NOT_CONFIGURED` unless `ADMIN_API_KEY` is configured and matched via `x-admin-key`). |
| `/api/v1/metrics` & `/api/v1/metrics/:id` | `GET`, `POST` | Yes | Returns `503 DATABASE_UNAVAILABLE` immediately. |
| `/api/v1/policies` & `/api/v1/policies/:id` | `GET`, `POST` | Yes | Returns `503 DATABASE_UNAVAILABLE` immediately. |
| `/api/v1/schemes` & `/api/v1/schemes/:id` | `GET`, `POST` | Yes | Returns `503 DATABASE_UNAVAILABLE` immediately. |
| `/api/v1/rpo` & `/api/v1/rpo/:id` | `GET`, `POST` | Yes | Returns `503 DATABASE_UNAVAILABLE` immediately. |
| `/api/v1/ingestion-runs` & `/api/v1/ingestion-runs/:id` | `GET`, `POST` | Yes | Returns `503 DATABASE_UNAVAILABLE` immediately. |

---

## 2. Common Query Parameters (`/api/v1/*` List Endpoints)

All list endpoints validate query parameters via **Zod** and return a consistent envelope:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    },
    "dataMode": "verified",
    "containsDemoData": false
  }
}
```

- `page` (default `1`, min `1`) & `limit` (default `20`, max `100`)
- `sortBy` & `sortOrder` (`asc` | `desc`)
- `dataMode`:
  - `verified` (**default**): returns only records where `isDemoData: false`.
  - `demo`: returns only explicitly marked `isDemoData: true` fixtures.
  - `all`: returns both (with `meta.containsDemoData` flagging whether any demo records are present).
- `verificationStatus`: `unverified` | `needs_review` | `verified` | `rejected`
- `search`: case-insensitive keyword filter

### Resource-Specific Filters
- `/api/v1/sources`: `sourceType`, `dataCategory`, `accessMethod`, `active` (`true`|`false`), `verificationStatus`, `search` (matches `sourceName`, `organization`, `domain`)
- `/api/v1/metrics`: `geographicScope` (`national`|`state`|`region`), `stateOrRegion`, `metricName`
- `/api/v1/policies` & `/api/v1/schemes`: `category`, `jurisdiction` (`central`|`state`)
- `/api/v1/rpo`: `stateOrOrganization`, `compliancePeriod`, `category`
- `/api/v1/ingestion-runs`: `status`, `sourceRef`

---

## 3. Mongoose Models (`server/src/models/`)

1. **`DataSource`** (`DataSource.ts`): Official/candidate source registry (`sourceName`, `organization`, `sourceUrl` unique, `sourceType`, `accessMethod`, `verificationStatus`, `lastCheckedAt`, `active`, `isDemoData`).
2. **`EnergyMetric`** (`EnergyMetric.ts`): Quantitative renewable energy indicators (`metricName`, `value`, `unit`, `geographicScope`, `stateOrRegion`, `observationDate`, `sourceRef`, embedded `provenance`, `isDemoData`).
3. **`PolicyScheme`** (`PolicyScheme.ts`): Central/state policies and schemes distinguished by `recordKind` (`policy` | `scheme`) to avoid schema duplication.
4. **`RpoRecord`** (`RpoRecord.ts`): RPO obligation targets (`0–100%`) and optional reported percentages (`0–100%` or `null`), uniquely indexed by `{ stateOrOrganization, compliancePeriod, category, isDemoData }`.
5. **`IngestionRun`** (`IngestionRun.ts`): Auditable ingestion execution logs enforcing `recordsAccepted + recordsRejected <= recordsProcessed` and `endedAt >= startedAt`.
6. **`AuditProvenance`** (`AuditProvenance.ts`): Cross-collection provenance trail (`recordType`, `recordRef` via `refPath`, `originalSource`, `sourceUrl`, `retrievedAt`, `verificationStatus`, `transformationNotes`, `isDemoData`).

---

## 4. Data Provenance & Demo Separation Rules

- **Strict Provenance:** Metrics and audit records store original source name, `http(s)://` source URL, retrieval timestamp, extraction method, confidence (`0–1`), and verification status.
- **Demo Isolation:** Sample fixtures created by `npm --prefix server run seed:demo` (`server/src/scripts/seedDemo.ts`) are explicitly labeled `[DEMO]` and flagged `isDemoData: true`.
- **Production Safety:** `runDemoSeed()` refuses to execute when `NODE_ENV=production` or when `MONGODB_URI` is missing.

---

## 5. MongoDB Setup Instructions

1. Copy `server/.env.example` to `server/.env` (never commit `.env`).
2. Set `MONGODB_URI`:
   - **MongoDB Atlas:** `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/greengrid_india?retryWrites=true&w=majority`
   - **Local MongoDB:** `mongodb://127.0.0.1:27017/greengrid_india`
3. Start the backend (`npm run dev:server`) and verify `GET http://localhost:5000/api/health` shows `database.connected: true`.
4. *(Optional in development)* Run explicit demo fixtures:
   ```bash
   npm --prefix server run seed:demo
   ```

