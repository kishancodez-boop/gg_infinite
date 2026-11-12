# GreenGrid India — Official Data Source Registry

**Last Checked:** `2026-11-12`

This catalogue documents candidate and verified official Indian renewable-energy data sources stored in `server/src/data/sourceCatalogue.ts`.

> **Data & Ingestion Policy:** An accessible public webpage does **not** grant permission for automated scraping. Sources are marked `verified` only when their official domain and portal role are confirmed for manual reference or documented API key access (`data.gov.in`). Automated ingestion requires explicit `robots.txt`, Terms of Use, and feed verification in Milestone 05.

---

## 1. Verified Official Reference Sources (8)

| Source Name | Organization | Canonical URL | Category | Access Method | Verification Status | Evidence & Access Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Ministry of New and Renewable Energy (MNRE) | MNRE, Govt. of India | `https://mnre.gov.in` | `policies_schemes` | `manual` | `verified` | Official `gov.in` domain confirmed (`2026-11-12`). Publishes central schemes, policies, and physical progress reports. Automated crawling requires `robots.txt` check. |
| Central Electricity Authority (CEA) Portal | CEA, Ministry of Power | `https://cea.nic.in` | `capacity_generation` | `manual` | `verified` | Official `nic.in` domain confirmed (`2026-11-12`). Publishes monthly RE generation reports (PDF/Excel) and installed capacity dashboards. |
| Open Government Data (OGD) Platform India | NIC, Govt. of India | `https://data.gov.in` | `capacity_generation` | `api` | `verified` | Official `gov.in` open-data API documented with registered API key + dataset Resource ID workflow (`2026-11-12`). |
| India Climate & Energy Dashboard (ICED) | NITI Aayog | `https://iced.niti.gov.in` | `capacity_generation` | `manual` | `verified` | Official `niti.gov.in` domain confirmed (`2026-11-12`). Aggregates official energy/climate parameters with downloadable XLS files. |
| Central Electricity Regulatory Commission (CERC) | CERC | `https://cercind.gov.in` | `rpo_regulations` | `manual` | `verified` | Official `gov.in` regulator domain confirmed (`2026-11-12`). Publishes tariff orders and RPO/REC regulatory frameworks (PDF). |
| Solar Energy Corporation of India (SECI) | SECI (MNRE PSU) | `https://www.seci.co.in` | `tenders_opportunities` | `manual` | `verified` | Official PSU portal confirmed (`2026-11-12`). Publishes solar/wind/hybrid tender notices; automated scraping not enabled. |
| Indian Renewable Energy Development Agency (IREDA) | IREDA (MNRE PSU) | `https://www.ireda.in` | `green_finance` | `manual` | `verified` | Official IREDA portal confirmed (`2026-11-12`). Financing schemes and circulars require manual term verification. |
| Bureau of Energy Efficiency (BEE) | BEE, Ministry of Power | `https://www.beeindia.gov.in` | `policies_schemes` | `manual` | `verified` | Official `gov.in` portal confirmed (`2026-11-12`). Energy efficiency & PAT policy reference. |

---

## 2. Candidate Sources Requiring Human Verification (4)

| Source Name | Organization | Canonical URL | Category | Access Method | Verification Status | Why Human Review Is Required |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| CEA Daily Renewable Generation Portal | CEA | `https://gen-re.cea.gov.in` | `solar_wind` | `html_public` | `needs_review` | Sub-portal referenced in CEA search results (`2026-11-12`); `robots.txt`, terms, and direct downloadable feed stability not yet inspected. |
| Gujarat Energy Development Agency (GEDA) | Govt. of Gujarat | `https://geda.gujarat.gov.in` | `state_statistics` | `manual` | `needs_review` | Official `gujarat.gov.in` subdomain identified (`2026-11-12`); `robots.txt` and downloadable state datasets not yet audited. |
| Maharashtra Energy Development Agency (MEDA) | Govt. of Maharashtra | `https://www.mahaurja.com` | `state_statistics` | `manual` | `needs_review` | Dual domain usage (`mahaurja.com` vs `mahaurja.maharashtra.gov.in`) requires human confirmation and terms review. |
| Karnataka Renewable Energy Development Ltd (KREDL) | Govt. of Karnataka | `https://kredl.karnataka.gov.in` | `state_statistics` | `manual` | `needs_review` | Official `karnataka.gov.in` subdomain identified (`2026-11-12`); `robots.txt` and dataset format not yet audited. |

