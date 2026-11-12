# GreenGrid India — RPO Compliance Tracker (Milestone 09)

## 1. Overview

The Renewable Purchase Obligation (RPO) Tracker (`/rpo`) monitors RPO targets, achieved renewable energy (MU), compliance percentages, and compliance gaps across Indian states and distribution companies (DISCOMs) using stored `RpoRecord` and `DataSource` documents.

## 2. Calculations & Null Handling

- **Compliance Percentage:**
  - Computed as `(achievedEnergyMu / targetEnergyMu) * 100` when both energy figures exist (`targetEnergyMu > 0`).
  - Falls back to `(reportedPercentage / targetPercentage) * 100` when energy figures are absent and `reportedPercentage` exists.
  - Otherwise returns `null` (`"Not available"` in the UI — never `0`).
- **Compliance Gap:**
  - `targetEnergyMu - achievedEnergyMu` (MU) or `targetPercentage - reportedPercentage` (%).
  - Positive values indicate a shortfall; `<= 0` indicates compliance met or surplus.

## 3. API Endpoints & Security

- `GET /api/v1/rpo` & `GET /api/v1/rpo/:id` — Paginated RPO records & detail lookup (`requireDatabase`).
- `GET /api/v1/rpo/summary` — Aggregated KPIs, compliance calculations, and source-populated records (`requireDatabase`, Zod-validated filters: `state`, `discomName`, `entityType`, `category`, `compliancePeriod`, `dataMode`).
- `POST /api/v1/rpo` — Protected by both `requireDatabase` (`503`) and fail-closed `requireAdminAuth` (`403`/`401`).

## 4. Limitations

- `MONGODB_URI` is currently unconfigured; when disconnected, `/rpo` displays an honest `503 Service Unavailable` state without fabricating targets or compliance figures.

