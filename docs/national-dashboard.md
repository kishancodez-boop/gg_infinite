# GreenGrid India — National Renewable Energy Dashboard (Milestone 08)

## 1. Overview

The National Renewable Energy Dashboard (`/`) aggregates stored `EnergyMetric` records from MongoDB via `GET /api/v1/dashboard/national` to present KPI cards, renewable energy mix by technology, state-wise comparisons, capacity/generation trend charts, and source-attributed recent updates.

## 2. API Endpoint & Filters

- `GET /api/v1/dashboard/national` (public read, guarded by `requireDatabase` -> `503 DATABASE_UNAVAILABLE` when MongoDB is disconnected).
- **Validated Query Parameters (`nationalDashboardQuerySchema`):**
  - `dataMode`: `all` (default) | `verified` | `demo`
  - `stateOrRegion`: optional case-insensitive state/region filter
  - `technology`: `all` (default) | `solar` | `wind` | `other`
  - `fromDate` / `toDate`: optional ISO date range (`toDate >= fromDate`)

## 3. Data Integrity & Limitations

- **No Fabricated Numbers:** Missing metrics return `null` and render `"Not available"` instead of `0`.
- **Unit Normalization:** Capacity records in `GW` or `kW` are normalized to `MW` for consistent aggregation; generation records (`MU`, `GWh`, `MWh`, `kWh`) are reported with their original unit.
- **DEMO Labeling:** Any metric with `isDemoData: true` triggers `DEMO` badges and an explicit notice banner.
- **Current Limitation:** `MONGODB_URI` is currently unconfigured; when disconnected, the dashboard shows an honest `503 Service Unavailable` state alongside the live `SystemStatusPanel`.

