export interface SolarRoiInputs {
  monthlyConsumptionKwh: number;
  monthlyBillInr?: number | null;
  electricityTariffInrPerKwh: number;
  useRecommendedCapacity?: boolean;
  capacityKw?: number | null;
  installationCostPerKwInr: number;
  initialInstallationCostInr?: number | null;
  subsidyInr?: number;
  systemLifetimeYears: number;
  dailyGenerationPerKwKwh: number;
  performanceFactor: number;
  annualDegradationPct?: number;
  annualTariffEscalationPct?: number;
  annualMaintenanceInr?: number;
}

export interface YearlyCashFlowRow {
  year: number;
  generationKwh: number;
  usableGenerationKwh: number;
  effectiveTariffInr: number;
  grossSavingsInr: number;
  maintenanceCostInr: number;
  netCashFlowInr: number;
  cumulativeCashFlowInr: number;
}

export interface SolarRoiResult {
  assumptions: {
    monthlyConsumptionKwh: number;
    monthlyBillInr: number | null;
    dailyConsumptionKwh: number;
    annualConsumptionKwh: number;
    electricityTariffInrPerKwh: number;
    useRecommendedCapacity: boolean;
    effectiveCapacityKw: number;
    installationCostPerKwInr: number;
    systemLifetimeYears: number;
    dailyGenerationPerKwKwh: number;
    performanceFactor: number;
    annualDegradationPct: number;
    annualTariffEscalationPct: number;
    annualMaintenanceInr: number;
    subsidyInr: number;
  };
  summary: {
    recommendedCapacityKw: number;
    effectiveCapacityKw: number;
    grossInstallationCostInr: number;
    netInvestmentInr: number;
    year1GenerationKwh: number;
    year1UsableGenerationKwh: number;
    monthlySavingsInr: number;
    annualSavingsInr: number;
    annualNetSavingsInr: number;
    simplePaybackYears: number | null;
    lifetimeGenerationKwh: number;
    lifetimeNetSavingsInr: number;
    roiPercent: number | null;
  };
  cashFlows: YearlyCashFlowRow[];
  warnings: string[];
}

export interface ScenarioComparisonItem {
  id: 'conservative' | 'base' | 'optimistic';
  label: string;
  assumptionDiffNote: string;
  result: SolarRoiResult;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatInr(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function calculateSolarRoi(raw: SolarRoiInputs): SolarRoiResult {
  const warnings: string[] = [];

  const monthlyConsumptionKwh = Math.max(0, raw.monthlyConsumptionKwh);
  const monthlyBillInr =
    raw.monthlyBillInr !== undefined && raw.monthlyBillInr !== null
      ? Math.max(0, raw.monthlyBillInr)
      : null;
  const electricityTariffInrPerKwh = Math.max(0, raw.electricityTariffInrPerKwh);
  const installationCostPerKwInr = Math.max(0, raw.installationCostPerKwInr);
  const subsidyInr = Math.max(0, raw.subsidyInr ?? 0);
  const systemLifetimeYears = Math.min(40, Math.max(1, Math.round(raw.systemLifetimeYears)));
  const dailyGenerationPerKwKwh = Math.max(0, raw.dailyGenerationPerKwKwh);
  const performanceFactor = Math.min(1, Math.max(0, raw.performanceFactor));
  const annualDegradationPct = Math.min(10, Math.max(0, raw.annualDegradationPct ?? 0));
  const annualTariffEscalationPct = Math.min(
    20,
    Math.max(0, raw.annualTariffEscalationPct ?? 0)
  );
  const annualMaintenanceInr = Math.max(0, raw.annualMaintenanceInr ?? 0);

  const dailyConsumptionKwh = round2(monthlyConsumptionKwh / 30);
  const annualConsumptionKwh = round2(monthlyConsumptionKwh * 12);

  const generationDenominator = dailyGenerationPerKwKwh * performanceFactor;
  let recommendedCapacityKw = 0;
  if (generationDenominator <= 0) {
    warnings.push(
      'Daily generation per kW and performance factor must both be > 0 to recommend system capacity.'
    );
  } else if (dailyConsumptionKwh > 0) {
    recommendedCapacityKw = round2(dailyConsumptionKwh / generationDenominator);
  } else {
    warnings.push('Monthly consumption is 0 kWh; recommended solar capacity is 0 kW.');
  }

  const useRecommendedCapacity =
    raw.useRecommendedCapacity ?? (raw.capacityKw === undefined || raw.capacityKw === null);
  const effectiveCapacityKw = round2(
    useRecommendedCapacity
      ? recommendedCapacityKw
      : Math.max(0, raw.capacityKw ?? recommendedCapacityKw)
  );

  const grossInstallationCostInr = round2(
    raw.initialInstallationCostInr !== undefined && raw.initialInstallationCostInr !== null
      ? Math.max(0, raw.initialInstallationCostInr)
      : effectiveCapacityKw * installationCostPerKwInr
  );

  let netInvestmentInr = round2(grossInstallationCostInr - subsidyInr);
  if (subsidyInr > grossInstallationCostInr) {
    netInvestmentInr = 0;
    warnings.push(
      'Entered subsidy exceeds gross installation cost; net initial investment is clamped to ₹0.'
    );
  }

  const year1GenerationKwh = round2(
    effectiveCapacityKw * dailyGenerationPerKwKwh * 365 * performanceFactor
  );
  const year1UsableGenerationKwh = round2(Math.min(year1GenerationKwh, annualConsumptionKwh));
  const annualSavingsInr = round2(year1UsableGenerationKwh * electricityTariffInrPerKwh);
  const annualNetSavingsInr = round2(annualSavingsInr - annualMaintenanceInr);
  const monthlySavingsInr = round2(annualNetSavingsInr / 12);

  let simplePaybackYears: number | null = null;
  if (netInvestmentInr <= 0) {
    simplePaybackYears = 0;
  } else if (annualNetSavingsInr <= 0) {
    warnings.push(
      'Annual net savings are ₹0 or negative; simple payback period cannot be reached under current assumptions.'
    );
  } else {
    simplePaybackYears = round2(netInvestmentInr / annualNetSavingsInr);
  }

  const cashFlows: YearlyCashFlowRow[] = [];
  let cumulativeCashFlow = -netInvestmentInr;
  let lifetimeGenerationKwh = 0;
  let lifetimeNetSavingsInr = 0;

  for (let year = 1; year <= systemLifetimeYears; year += 1) {
    const degradationMultiplier = Math.pow(1 - annualDegradationPct / 100, year - 1);
    const escalationMultiplier = Math.pow(1 + annualTariffEscalationPct / 100, year - 1);

    const generationKwh = round2(year1GenerationKwh * degradationMultiplier);
    const usableGenerationKwh = round2(Math.min(generationKwh, annualConsumptionKwh));
    const effectiveTariffInr = round2(electricityTariffInrPerKwh * escalationMultiplier);
    const grossSavingsInr = round2(usableGenerationKwh * effectiveTariffInr);
    const maintenanceCostInr = round2(annualMaintenanceInr);
    const netCashFlowInr = round2(grossSavingsInr - maintenanceCostInr);
    cumulativeCashFlow = round2(cumulativeCashFlow + netCashFlowInr);

    lifetimeGenerationKwh += generationKwh;
    lifetimeNetSavingsInr += netCashFlowInr;

    cashFlows.push({
      year,
      generationKwh,
      usableGenerationKwh,
      effectiveTariffInr,
      grossSavingsInr,
      maintenanceCostInr,
      netCashFlowInr,
      cumulativeCashFlowInr: cumulativeCashFlow,
    });
  }

  lifetimeGenerationKwh = round2(lifetimeGenerationKwh);
  lifetimeNetSavingsInr = round2(lifetimeNetSavingsInr);

  let roiPercent: number | null = null;
  if (netInvestmentInr <= 0) {
    warnings.push('ROI percentage is not defined when net initial investment is ₹0.');
  } else {
    roiPercent = round2(
      ((lifetimeNetSavingsInr - netInvestmentInr) / netInvestmentInr) * 100
    );
  }

  return {
    assumptions: {
      monthlyConsumptionKwh,
      monthlyBillInr,
      dailyConsumptionKwh,
      annualConsumptionKwh,
      electricityTariffInrPerKwh,
      useRecommendedCapacity,
      effectiveCapacityKw,
      installationCostPerKwInr,
      systemLifetimeYears,
      dailyGenerationPerKwKwh,
      performanceFactor,
      annualDegradationPct,
      annualTariffEscalationPct,
      annualMaintenanceInr,
      subsidyInr,
    },
    summary: {
      recommendedCapacityKw,
      effectiveCapacityKw,
      grossInstallationCostInr,
      netInvestmentInr,
      year1GenerationKwh,
      year1UsableGenerationKwh,
      monthlySavingsInr,
      annualSavingsInr,
      annualNetSavingsInr,
      simplePaybackYears,
      lifetimeGenerationKwh,
      lifetimeNetSavingsInr,
      roiPercent,
    },
    cashFlows,
    warnings,
  };
}

export function buildComparisonScenarios(baseInputs: SolarRoiInputs): ScenarioComparisonItem[] {
  const baseResult = calculateSolarRoi(baseInputs);
  const pf = baseResult.assumptions.performanceFactor;

  const conservativeResult = calculateSolarRoi({
    ...baseInputs,
    performanceFactor: round2(Math.max(0.5, pf * 0.9)),
    installationCostPerKwInr: round2(baseInputs.installationCostPerKwInr * 1.1),
    initialInstallationCostInr:
      baseInputs.initialInstallationCostInr !== undefined &&
      baseInputs.initialInstallationCostInr !== null
        ? round2(baseInputs.initialInstallationCostInr * 1.1)
        : null,
    electricityTariffInrPerKwh: round2(baseInputs.electricityTariffInrPerKwh * 0.9),
  });

  const optimisticResult = calculateSolarRoi({
    ...baseInputs,
    performanceFactor: round2(Math.min(0.95, pf * 1.05)),
    installationCostPerKwInr: round2(baseInputs.installationCostPerKwInr * 0.92),
    initialInstallationCostInr:
      baseInputs.initialInstallationCostInr !== undefined &&
      baseInputs.initialInstallationCostInr !== null
        ? round2(baseInputs.initialInstallationCostInr * 0.92)
        : null,
    electricityTariffInrPerKwh: round2(baseInputs.electricityTariffInrPerKwh * 1.1),
  });

  return [
    {
      id: 'conservative',
      label: 'Conservative',
      assumptionDiffNote:
        'Performance factor −10%, installation cost +10%, tariff −10% (mathematical stress case).',
      result: conservativeResult,
    },
    {
      id: 'base',
      label: 'Base Case',
      assumptionDiffNote: 'Uses your exact current inputs and assumptions.',
      result: baseResult,
    },
    {
      id: 'optimistic',
      label: 'Optimistic',
      assumptionDiffNote:
        'Performance factor +5% (max 0.95), installation cost −8%, tariff +10% (mathematical upside).',
      result: optimisticResult,
    },
  ];
}

