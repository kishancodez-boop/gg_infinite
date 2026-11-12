# GreenGrid India — Solar ROI Calculator & Financial Simulator (Milestone 07)

## 1. Overview

The Solar ROI Calculator (`/calculator`) lets users estimate rooftop solar capacity, installation cost, simple payback period, ROI percentage, and multi-year cash flows using transparent, editable assumptions. It works client-side even when MongoDB is unconfigured, and also exposes a stateless `POST /api/v1/calculator/simulate` endpoint.

## 2. Calculation Formulas

- **Daily Consumption (kWh/day):** `monthlyConsumptionKwh / 30`
- **Recommended Capacity (kW):** `dailyConsumptionKwh / (dailyGenerationPerKwKwh * performanceFactor)`
- **Year 1 Generation (kWh):** `effectiveCapacityKw * dailyGenerationPerKwKwh * 365 * performanceFactor`
- **Usable Annual Generation (kWh):** `min(yearGenerationKwh, annualConsumptionKwh)`
- **Annual Gross Savings (INR):** `usableGenerationKwh * effectiveTariffInrPerKwh`
- **Net Initial Investment (INR):** `max(0, grossInstallationCostInr - userEnteredSubsidyInr)`
- **Simple Payback Period (years):** `netInvestmentInr / annualNetSavingsInr` (or `null` with warning when `annualNetSavingsInr <= 0`)
- **Year-by-Year Degradation & Escalation (Year `t`):**
  - `generation(t) = year1Generation * (1 - degradationPct / 100)^(t - 1)`
  - `tariff(t) = baseTariff * (1 + escalationPct / 100)^(t - 1)`
  - `netCashFlow(t) = min(generation(t), annualConsumption) * tariff(t) - annualMaintenanceInr`
- **Lifetime ROI (%):** `((lifetimeNetSavingsInr - netInvestmentInr) / netInvestmentInr) * 100` (undefined when `netInvestmentInr === 0`)

### Example Calculation

- Inputs: `450 kWh/month`, `₹8/kWh`, `4.0 kWh/kW/day`, `0.80` performance factor, `₹50,000/kW`, `₹0` subsidy, `25 years`, `0.5%` degradation, `3%` tariff escalation, `₹2,000/yr` maintenance.
- `dailyConsumption = 15 kWh/day` → `recommendedCapacity = 15 / 3.2 = 4.69 kW` → `grossCost = ₹2,34,500`.

## 3. Comparison Scenarios & Limitations

- **Conservative / Base Case / Optimistic** are mathematical sensitivity scenarios (`±` performance factor, cost, and tariff), **not official forecasts**.
- Tariffs and subsidies are never silently invented; subsidy defaults to `₹0`.
- Actual solar output and payback depend on location, irradiance, shading, vendor pricing, DISCOM tariff slabs, and official subsidy rules.

