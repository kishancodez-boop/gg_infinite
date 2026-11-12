# Security & Data Integrity Audit (Milestone 14)

## 1. Audit Scope
Inspected the complete GreenGrid India codebase (Milestones 01–10), covering:
- Express application configuration, CORS, security headers, rate limiting, and JSON body limits (`server/src/app.ts`, `server/src/config/env.ts`)
- Authentication, error handling, and Zod validation middleware (`server/src/middleware/*`, `server/src/schemas/*`)
- All `/api` and `/api/v1` routes, controllers, and Mongoose services (`server/src/routes/*`, `server/src/controllers/*`, `server/src/services/*`)
- REA ingestion permission guard, SSRF protections, deduplication, and review/publishing workflow (`server/src/services/rea/*`)
- Calculation & aggregation engines (Solar ROI, National Dashboard, RPO Tracker) and `DEMO` vs `Verified` data separation.

---

## 2. Findings & Severity

| ID | Severity | Finding | Status |
|---|---|---|---|
| SEC-01 | **High** | `POST /api/v1/metrics` and `POST /api/v1/ingestion-runs` in `server/src/routes/v1Routes.ts` lacked `requireAdminAuth`, allowing unauthenticated callers to write metrics and ingestion run records when MongoDB is connected. | **Fixed** |
| SEC-02 | **Medium** | `server/src/app.ts` did not disable `X-Powered-By` or set defensive HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `X-DNS-Prefetch-Control`, `Cross-Origin-Opener-Policy`, `Permissions-Policy`, `Strict-Transport-Security`). | **Fixed** |
| SEC-03 | **Medium** | API routes had no rate-limiting protection against request flooding or abusive simulation/ingestion calls. | **Fixed** |
| SEC-04 | **Low** | `CORS_ORIGIN` could accept `*` alongside `credentials: true`, which browsers reject or treat as overly permissive. | **Fixed** |
| INT-01 | **Medium** | `publishApprovedStagedRecord` in `server/src/services/rea/reviewService.ts` checked `reviewStatus !== 'approved'` but did not explicitly reject staged records with `provenance.verificationStatus === 'rejected'` or invalid/negative `proposedData.value`. | **Fixed** |
| SEC-05 | **Info (Verified Safe)** | `requireAdminAuth` uses `crypto.timingSafeEqual` and fails closed (`403 ADMIN_AUTH_NOT_CONFIGURED`) when `ADMIN_API_KEY` is missing. | **Verified** |
| SEC-06 | **Info (Verified Safe)** | `validateFetchUrl` in `permissionGuard.ts` enforces `https:`, blocks embedded credentials, blocks private/loopback IPv4/IPv6 ranges (`localhost`, `127.0.0.1`, `169.254.169.254`, `10.x`, `172.16-31.x`, `192.168.x`, `::1`, `fc00::/7`, `fe80::/10`), and enforces `allowedDomains`. | **Verified** |
| INT-02 | **Info (Verified Safe)** | `sortBy` query parameters across all list schemas are strictly allowlisted via `z.enum(...)`, regex searches are escaped via `escapeRegex`, and missing metrics in National Dashboard and RPO Tracker return `null` (`"Not available"` in UI) rather than `0`. | **Verified** |

---

## 3. Fixes Implemented
1. **Protected All Write Routes**: Added `requireAdminAuth` to `POST /api/v1/metrics` and `POST /api/v1/ingestion-runs` in `server/src/routes/v1Routes.ts`.
2. **Security Headers & CORS Hardening**: Disabled `x-powered-by`, added defensive security headers middleware, and filtered wildcard `*` from `CORS_ORIGIN` in `server/src/app.ts`.
3. **API Rate Limiting**: Created `server/src/middleware/rateLimit.ts` and mounted it on `/api` in `server/src/app.ts` (`429 RATE_LIMIT_EXCEEDED` with `X-RateLimit-*` and `Retry-After` headers).
4. **Publishing Guard**: Updated `publishApprovedStagedRecord` in `server/src/services/rea/reviewService.ts` to throw `409 VALIDATION_ERRORS_PRESENT` if `provenance.verificationStatus === 'rejected'` or `proposedData.value` is non-finite/negative.

---

## 4. Tests Performed
Added `server/src/__tests__/securityAndIntegrityAudit.test.ts` verifying:
- Security headers and removal of `X-Powered-By`
- Rate limiting (`429 RATE_LIMIT_EXCEEDED`)
- Fail-closed `403`/`401` enforcement across all 15 privileged write and sensitive read routes
- SSRF URL validation (HTTP, loopback, link-local metadata IP, RFC1918 private IPs, IPv6 loopback, embedded credentials, non-allowlisted domains)
- Publishing blocks for `pending_review`, `rejected`, and `approved`+`invalid` staged records
- Duplicate resource (`409 DUPLICATE_RESOURCE`) error handling

---

## 5. Remaining Risks & Limitations
- **Unconfigured MongoDB**: `MONGODB_URI` is not configured in the current environment, so live MongoDB index enforcement, TLS/auth connection security, and persistence were not tested against a live database instance.
- **In-Memory Rate Limiter**: `rateLimit.ts` uses an in-memory `Map` per Node process; multi-instance production deployments should back rate limiting with Redis or an API gateway.
- **Static Secret Auth**: Admin auth relies on a shared `ADMIN_API_KEY` header (`x-admin-key`); multi-user RBAC and key rotation are deferred beyond Milestone 14.
