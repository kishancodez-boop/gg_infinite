# GreenGrid India — REA Safe Data Ingestion Engine (Milestone 05)

## 1. Pipeline Architecture

The Reverse Engineering Agent (REA) processes data through a strict, auditable 10-step pipeline:

```text
Source Registry -> Permission Check -> Fetch / Demo Fixture -> Parse (CSV/JSON)
  -> Normalize -> Validate (Zod) -> Deduplicate & Change Detection (SHA-256)
  -> Stage for Human Review -> Human Decision (Approve / Reject / Correction)
  -> Publish Approved -> AuditProvenance Log
```

## 2. Permission, SSRF & Safety Guardrails

- **Registered Sources Only:** `evaluateSourcePermission` (`server/src/services/rea/permissionGuard.ts`) inspects `DataSource` before any live fetch.
- **Blocked by Default:**
  - `manual`-only sources (`MANUAL_ONLY_BLOCKED`)
  - `needs_review`, `rejected`, or `unverified` sources (`SOURCE_NOT_VERIFIED`)
  - Inactive sources (`SOURCE_INACTIVE`)
- **SSRF & Transport Protections (`validateFetchUrl` & `safeFetchOfficialResource`):**
  - Requires `https:` protocol and rejects embedded credentials.
  - Blocks `localhost`, `.local`, `.internal`, loopback (`127.0.0.1`, `::1`), link-local/metadata (`169.254.0.0/16`), and RFC1918 private IP ranges.
  - Enforces host matching against the registered `DataSource.domain`.
  - Validates redirect targets (max 2 hops), `Content-Type` allowlist (`application/json`, `text/csv`, `text/plain`), 10s request timeout, and 2 MB response size cap.

## 3. Demo Fixture Mode vs Live Mode

Because no currently registered official source has both documented automated access AND configured API credentials (`data.gov.in` requires a registered API key and Resource ID), Milestone 05 includes a local `[DEMO]` CSV/JSON fixture connector (`server/src/services/rea/fixtureConnector.ts`).

- All fixture runs set `isDemoData: true`, `sourceMode: 'fixture'`, and `fixtureLabel: 'DEMO_LOCAL_CSV_FIXTURE_V1'` (or `JSON`).
- Dry-run mode (`dryRun: true`) parses, normalizes, validates, and reports projected diffs without mutating MongoDB.

## 4. Human Review & Audit Trail

- Staged records are saved in `StagedRecord` (`reviewStatus: 'pending_review'`).
- Publishing is blocked (`409 REVIEW_APPROVAL_REQUIRED`) unless `reviewStatus === 'approved'`.
- All ingestion, review, and publish endpoints are protected by `requireDatabase` (`503`) and write operations are protected by `requireAdminAuth` (`ADMIN_API_KEY`).
- Every block, stage, approval, rejection, correction request, and publish writes an `AuditProvenance` entry.

