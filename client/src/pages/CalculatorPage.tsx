import {
  AlertTriangle,
  Calculator,
  Info,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { SolarCharts } from '../components/calculator/SolarCharts';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Table,
} from '../components/ui';
import type { TableColumn } from '../components/ui';
import {
  buildComparisonScenarios,
  calculateSolarRoi,
  formatInr,
  type SolarRoiInputs,
  type YearlyCashFlowRow,
} from '../utils/solarRoiEngine';

interface CalculatorFormState {
  monthlyConsumptionKwh: string;
  monthlyBillInr: string;
  electricityTariffInrPerKwh: string;
  useRecommendedCapacity: boolean;
  capacityKw: string;
  installationCostPerKwInr: string;
  initialInstallationCostInr: string;
  subsidyInr: string;
  systemLifetimeYears: string;
  dailyGenerationPerKwKwh: string;
  performanceFactor: string;
  annualDegradationPct: string;
  annualTariffEscalationPct: string;
  annualMaintenanceInr: string;
}

const DEFAULT_FORM: CalculatorFormState = {
  monthlyConsumptionKwh: '450',
  monthlyBillInr: '',
  electricityTariffInrPerKwh: '7.5',
  useRecommendedCapacity: true,
  capacityKw: '4',
  installationCostPerKwInr: '55000',
  initialInstallationCostInr: '',
  subsidyInr: '0',
  systemLifetimeYears: '25',
  dailyGenerationPerKwKwh: '4.0',
  performanceFactor: '0.80',
  annualDegradationPct: '0.5',
  annualTariffEscalationPct: '3.0',
  annualMaintenanceInr: '2500',
};

function parseNonNegative(value: string, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function CalculatorPage() {
  const [form, setForm] = useState<CalculatorFormState>(DEFAULT_FORM);

  const validationErrors = useMemo(() => {
    const errors: Partial<Record<keyof CalculatorFormState, string>> = {};
    const checkNum = (
      field: keyof CalculatorFormState,
      label: string,
      min: number,
      max: number,
      allowEmpty = false
    ) => {
      const raw = form[field];
      if (typeof raw !== 'string') return;
      if (allowEmpty && raw.trim() === '') return;
      const num = Number(raw);
      if (raw.trim() === '' || !Number.isFinite(num) || num < min || num > max) {
        errors[field] = `${label} must be between ${min} and ${max}.`;
      }
    };

    checkNum('monthlyConsumptionKwh', 'Monthly consumption', 0, 1_000_000);
    checkNum('monthlyBillInr', 'Monthly bill', 0, 100_000_000, true);
    checkNum('electricityTariffInrPerKwh', 'Electricity tariff', 0, 100);
    if (!form.useRecommendedCapacity) {
      checkNum('capacityKw', 'Solar capacity', 0, 10_000);
    }
    checkNum('installationCostPerKwInr', 'Installation cost per kW', 0, 1_000_000);
    checkNum('initialInstallationCostInr', 'Initial installation cost', 0, 1_000_000_000, true);
    checkNum('subsidyInr', 'Subsidy', 0, 1_000_000_000);
    checkNum('systemLifetimeYears', 'System lifetime', 1, 40);
    checkNum('dailyGenerationPerKwKwh', 'Daily generation', 0, 12);
    checkNum('performanceFactor', 'Performance factor', 0, 1);
    checkNum('annualDegradationPct', 'Annual degradation', 0, 10);
    checkNum('annualTariffEscalationPct', 'Tariff escalation', 0, 20);
    checkNum('annualMaintenanceInr', 'Annual maintenance', 0, 10_000_000);

    return errors;
  }, [form]);

  const inputs: SolarRoiInputs = useMemo(
    () => ({
      monthlyConsumptionKwh: parseNonNegative(form.monthlyConsumptionKwh, 0),
      monthlyBillInr:
        form.monthlyBillInr.trim() === '' ? null : parseNonNegative(form.monthlyBillInr, 0),
      electricityTariffInrPerKwh: parseNonNegative(form.electricityTariffInrPerKwh, 0),
      useRecommendedCapacity: form.useRecommendedCapacity,
      capacityKw: form.useRecommendedCapacity ? null : parseNonNegative(form.capacityKw, 0),
      installationCostPerKwInr: parseNonNegative(form.installationCostPerKwInr, 0),
      initialInstallationCostInr:
        form.initialInstallationCostInr.trim() === ''
          ? null
          : parseNonNegative(form.initialInstallationCostInr, 0),
      subsidyInr: parseNonNegative(form.subsidyInr, 0),
      systemLifetimeYears: Math.min(40, Math.max(1, parseNonNegative(form.systemLifetimeYears, 25))),
      dailyGenerationPerKwKwh: parseNonNegative(form.dailyGenerationPerKwKwh, 0),
      performanceFactor: Math.min(1, parseNonNegative(form.performanceFactor, 0.8)),
      annualDegradationPct: Math.min(10, parseNonNegative(form.annualDegradationPct, 0.5)),
      annualTariffEscalationPct: Math.min(
        20,
        parseNonNegative(form.annualTariffEscalationPct, 3)
      ),
      annualMaintenanceInr: parseNonNegative(form.annualMaintenanceInr, 0),
    }),
    [form]
  );

  const result = useMemo(() => calculateSolarRoi(inputs), [inputs]);
  const scenarios = useMemo(() => buildComparisonScenarios(inputs), [inputs]);

  const updateField = <K extends keyof CalculatorFormState>(
    key: K,
    value: CalculatorFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const cashFlowColumns: TableColumn<YearlyCashFlowRow>[] = [
    {
      key: 'year',
      header: 'Year',
      render: (row) => <span className="font-semibold text-[#102A25]">Year {row.year}</span>,
    },
    {
      key: 'generation',
      header: 'Generation (kWh)',
      render: (row) => <span>{row.generationKwh.toLocaleString('en-IN')} kWh</span>,
    },
    {
      key: 'tariff',
      header: 'Tariff (₹/kWh)',
      render: (row) => <span>₹{row.effectiveTariffInr.toFixed(2)}</span>,
    },
    {
      key: 'grossSavings',
      header: 'Gross Savings',
      render: (row) => <span>{formatInr(row.grossSavingsInr)}</span>,
    },
    {
      key: 'maintenance',
      header: 'Maintenance',
      render: (row) => <span className="text-[#64736B]">{formatInr(row.maintenanceCostInr)}</span>,
    },
    {
      key: 'netCashFlow',
      header: 'Net Cash Flow',
      render: (row) => (
        <span className={row.netCashFlowInr >= 0 ? 'font-medium text-[#16A36A]' : 'text-[#B91C1C]'}>
          {formatInr(row.netCashFlowInr)}
        </span>
      ),
    },
    {
      key: 'cumulative',
      header: 'Cumulative Cash Flow',
      render: (row) => (
        <span
          className={
            row.cumulativeCashFlowInr >= 0
              ? 'font-semibold text-[#16A36A]'
              : 'font-medium text-[#17231F]'
          }
        >
          {formatInr(row.cumulativeCashFlowInr)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Solar ROI Calculator"
        description="Estimate rooftop solar sizing, payback period, and lifetime cash flows using transparent, user-editable assumptions."
        breadcrumbs={[{ label: 'Solar ROI Calculator' }]}
        badge={
          <Badge variant="warning" icon={<Calculator className="w-3 h-3" />}>
            User-Assumption Simulator
          </Badge>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setForm(DEFAULT_FORM)}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Inputs
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Input Form */}
        <div className="xl:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Consumption &amp; Tariff Assumptions</CardTitle>
              <CardDescription>
                Tariff is treated strictly as your assumption — not a verified utility rate.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Monthly Consumption (kWh)"
                type="number"
                min={0}
                value={form.monthlyConsumptionKwh}
                onChange={(e) => updateField('monthlyConsumptionKwh', e.target.value)}
                error={validationErrors.monthlyConsumptionKwh}
              />
              <Input
                label="Monthly Bill (INR, Optional)"
                type="number"
                min={0}
                placeholder="Optional reference"
                value={form.monthlyBillInr}
                onChange={(e) => updateField('monthlyBillInr', e.target.value)}
                error={validationErrors.monthlyBillInr}
              />
              <Input
                label="Electricity Tariff (₹ / kWh)"
                type="number"
                min={0}
                step="0.1"
                value={form.electricityTariffInrPerKwh}
                onChange={(e) => updateField('electricityTariffInrPerKwh', e.target.value)}
                error={validationErrors.electricityTariffInrPerKwh}
              />
              <Input
                label="Tariff Escalation (% / yr)"
                type="number"
                min={0}
                max={20}
                step="0.5"
                value={form.annualTariffEscalationPct}
                onChange={(e) => updateField('annualTariffEscalationPct', e.target.value)}
                error={validationErrors.annualTariffEscalationPct}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Solar System &amp; Generation</CardTitle>
              <CardDescription>
                Choose auto-recommended capacity or enter a custom kW size.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-medium text-[#17231F] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.useRecommendedCapacity}
                  onChange={(e) => updateField('useRecommendedCapacity', e.target.checked)}
                  className="rounded border-[#DCE6DF] text-[#16A36A] focus:ring-[#16A36A]"
                />
                Auto-recommend solar capacity from monthly consumption
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!form.useRecommendedCapacity ? (
                  <Input
                    label="Custom Capacity (kW)"
                    type="number"
                    min={0}
                    step="0.5"
                    value={form.capacityKw}
                    onChange={(e) => updateField('capacityKw', e.target.value)}
                    error={validationErrors.capacityKw}
                  />
                ) : (
                  <div className="rounded-lg border border-[#DCE6DF] bg-[#F5F8F5] px-3 py-2 text-xs">
                    <span className="text-[#64736B] block">Recommended Capacity</span>
                    <span className="text-base font-bold text-[#102A25]">
                      {result.summary.recommendedCapacityKw} kW
                    </span>
                  </div>
                )}
                <Input
                  label="System Lifetime (Years)"
                  type="number"
                  min={1}
                  max={40}
                  value={form.systemLifetimeYears}
                  onChange={(e) => updateField('systemLifetimeYears', e.target.value)}
                  error={validationErrors.systemLifetimeYears}
                />
                <Input
                  label="Daily Generation (kWh/kW/day)"
                  type="number"
                  min={0}
                  max={12}
                  step="0.1"
                  value={form.dailyGenerationPerKwKwh}
                  onChange={(e) => updateField('dailyGenerationPerKwKwh', e.target.value)}
                  error={validationErrors.dailyGenerationPerKwKwh}
                />
                <Input
                  label="Performance Factor (0–1)"
                  type="number"
                  min={0}
                  max={1}
                  step="0.05"
                  value={form.performanceFactor}
                  onChange={(e) => updateField('performanceFactor', e.target.value)}
                  error={validationErrors.performanceFactor}
                />
                <Input
                  label="Annual Degradation (%)"
                  type="number"
                  min={0}
                  max={10}
                  step="0.1"
                  value={form.annualDegradationPct}
                  onChange={(e) => updateField('annualDegradationPct', e.target.value)}
                  error={validationErrors.annualDegradationPct}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Financial &amp; Subsidy Inputs</CardTitle>
              <CardDescription>
                Subsidy defaults to ₹0 and is only applied if explicitly entered by you.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Install Cost (₹ / kW)"
                type="number"
                min={0}
                step="1000"
                value={form.installationCostPerKwInr}
                onChange={(e) => updateField('installationCostPerKwInr', e.target.value)}
                error={validationErrors.installationCostPerKwInr}
              />
              <Input
                label="Total Install Override (₹, Opt.)"
                type="number"
                min={0}
                placeholder="Auto: kW × ₹/kW"
                value={form.initialInstallationCostInr}
                onChange={(e) => updateField('initialInstallationCostInr', e.target.value)}
                error={validationErrors.initialInstallationCostInr}
              />
              <Input
                label="User-Entered Subsidy (₹)"
                type="number"
                min={0}
                step="1000"
                value={form.subsidyInr}
                onChange={(e) => updateField('subsidyInr', e.target.value)}
                error={validationErrors.subsidyInr}
              />
              <Input
                label="Annual Maintenance (₹ / yr)"
                type="number"
                min={0}
                step="500"
                value={form.annualMaintenanceInr}
                onChange={(e) => updateField('annualMaintenanceInr', e.target.value)}
                error={validationErrors.annualMaintenanceInr}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Results Dashboard & Assumptions Summary */}
        <div className="xl:col-span-7 space-y-6">
          {result.warnings.length > 0 ? (
            <div className="rounded-xl border border-[#F4B942]/70 bg-[#FFFBEB] p-4 space-y-1 text-xs text-[#17231F]">
              <div className="flex items-center gap-2 font-semibold text-[#B45309]">
                <AlertTriangle className="w-4 h-4" />
                Calculation Edge-Case Notice
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[#64736B]">
                {result.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-[#64736B]">Recommended / Active Size</p>
                <p className="text-xl font-bold text-[#102A25] mt-1">
                  {result.summary.effectiveCapacityKw} kW
                </p>
                <p className="text-[11px] text-[#64736B] mt-0.5">
                  Recommended: {result.summary.recommendedCapacityKw} kW
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-[#64736B]">Estimated Install Cost</p>
                <p className="text-xl font-bold text-[#102A25] mt-1">
                  {formatInr(result.summary.grossInstallationCostInr)}
                </p>
                <p className="text-[11px] text-[#64736B] mt-0.5">
                  Net Investment: {formatInr(result.summary.netInvestmentInr)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-[#64736B]">Est. Annual Generation</p>
                <p className="text-xl font-bold text-[#16A36A] mt-1">
                  {result.summary.year1GenerationKwh.toLocaleString('en-IN')} kWh
                </p>
                <p className="text-[11px] text-[#64736B] mt-0.5">
                  Year 1 usable: {result.summary.year1UsableGenerationKwh.toLocaleString('en-IN')}{' '}
                  kWh
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-[#64736B]">Monthly Net Savings (Yr 1)</p>
                <p className="text-xl font-bold text-[#16A36A] mt-1">
                  {formatInr(result.summary.monthlySavingsInr)}
                </p>
                <p className="text-[11px] text-[#64736B] mt-0.5">
                  Annual Net: {formatInr(result.summary.annualNetSavingsInr)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-[#64736B]">Estimated Payback Period</p>
                <p className="text-xl font-bold text-[#102A25] mt-1">
                  {result.summary.simplePaybackYears !== null
                    ? `${result.summary.simplePaybackYears} yrs`
                    : 'Not reachable'}
                </p>
                <p className="text-[11px] text-[#64736B] mt-0.5">
                  Simple payback on net cost
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-[#64736B]">
                  Lifetime Net Savings ({result.assumptions.systemLifetimeYears} yrs)
                </p>
                <p className="text-xl font-bold text-[#16A36A] mt-1">
                  {formatInr(result.summary.lifetimeNetSavingsInr)}
                </p>
                <p className="text-[11px] text-[#64736B] mt-0.5">
                  ROI:{' '}
                  {result.summary.roiPercent !== null
                    ? `${result.summary.roiPercent}%`
                    : 'Undefined (₹0 net cost)'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Assumptions Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Active Assumptions Summary</CardTitle>
              <CardDescription>
                All results above are derived transparently from these editable parameters.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[#64736B] block">Daily Consumption</span>
                <span className="font-semibold text-[#17231F]">
                  {result.assumptions.dailyConsumptionKwh} kWh/day
                </span>
              </div>
              <div>
                <span className="text-[#64736B] block">Tariff</span>
                <span className="font-semibold text-[#17231F]">
                  ₹{result.assumptions.electricityTariffInrPerKwh}/kWh
                </span>
              </div>
              <div>
                <span className="text-[#64736B] block">Performance Factor</span>
                <span className="font-semibold text-[#17231F]">
                  {result.assumptions.performanceFactor}
                </span>
              </div>
              <div>
                <span className="text-[#64736B] block">User Subsidy</span>
                <span className="font-semibold text-[#17231F]">
                  {formatInr(result.assumptions.subsidyInr)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* What-If Simulator */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#16A36A]" />
                <CardTitle>What-If Simulator &amp; Scenario Comparison</CardTitle>
              </div>
              <CardDescription>
                Adjust sliders for immediate recalculation. Scenarios below are mathematical
                sensitivity comparisons, not official forecasts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <label className="space-y-1 block">
                  <span className="font-medium text-[#17231F] flex justify-between">
                    <span>Monthly Consumption</span>
                    <span>{inputs.monthlyConsumptionKwh} kWh</span>
                  </span>
                  <input
                    aria-label="What-if monthly consumption"
                    type="range"
                    min={100}
                    max={2000}
                    step={50}
                    value={Math.min(2000, Math.max(100, inputs.monthlyConsumptionKwh))}
                    onChange={(e) => updateField('monthlyConsumptionKwh', e.target.value)}
                    className="w-full accent-[#16A36A]"
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="font-medium text-[#17231F] flex justify-between">
                    <span>Electricity Tariff</span>
                    <span>₹{inputs.electricityTariffInrPerKwh}/kWh</span>
                  </span>
                  <input
                    aria-label="What-if electricity tariff"
                    type="range"
                    min={3}
                    max={15}
                    step={0.5}
                    value={Math.min(15, Math.max(3, inputs.electricityTariffInrPerKwh))}
                    onChange={(e) => updateField('electricityTariffInrPerKwh', e.target.value)}
                    className="w-full accent-[#16A36A]"
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="font-medium text-[#17231F] flex justify-between">
                    <span>Install Cost / kW</span>
                    <span>{formatInr(inputs.installationCostPerKwInr)}</span>
                  </span>
                  <input
                    aria-label="What-if install cost per kW"
                    type="range"
                    min={35000}
                    max={85000}
                    step={1000}
                    value={Math.min(85000, Math.max(35000, inputs.installationCostPerKwInr))}
                    onChange={(e) => updateField('installationCostPerKwInr', e.target.value)}
                    className="w-full accent-[#16A36A]"
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="font-medium text-[#17231F] flex justify-between">
                    <span>Performance Factor</span>
                    <span>{inputs.performanceFactor}</span>
                  </span>
                  <input
                    aria-label="What-if performance factor"
                    type="range"
                    min={0.55}
                    max={0.95}
                    step={0.05}
                    value={Math.min(0.95, Math.max(0.55, inputs.performanceFactor))}
                    onChange={(e) => updateField('performanceFactor', e.target.value)}
                    className="w-full accent-[#16A36A]"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className={`rounded-xl border p-3.5 space-y-2 ${
                      scenario.id === 'base'
                        ? 'border-[#16A36A] bg-[#F5F8F5]'
                        : 'border-[#DCE6DF] bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#102A25]">
                        {scenario.label}
                      </span>
                      <Badge
                        variant={
                          scenario.id === 'optimistic'
                            ? 'success'
                            : scenario.id === 'conservative'
                              ? 'warning'
                              : 'forest'
                        }
                      >
                        {scenario.result.summary.roiPercent !== null
                          ? `${scenario.result.summary.roiPercent}% ROI`
                          : 'N/A'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[#64736B] leading-relaxed">
                      {scenario.assumptionDiffNote}
                    </p>
                    <div className="text-xs space-y-0.5 pt-1 border-t border-[#DCE6DF]">
                      <p>
                        Net Cost: <strong>{formatInr(scenario.result.summary.netInvestmentInr)}</strong>
                      </p>
                      <p>
                        Payback:{' '}
                        <strong>
                          {scenario.result.summary.simplePaybackYears !== null
                            ? `${scenario.result.summary.simplePaybackYears} yrs`
                            : 'Not reachable'}
                        </strong>
                      </p>
                      <p>
                        Lifetime Net:{' '}
                        <strong>{formatInr(scenario.result.summary.lifetimeNetSavingsInr)}</strong>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Visual Analytics */}
      <SolarCharts
        cashFlows={result.cashFlows}
        netInvestmentInr={result.summary.netInvestmentInr}
      />

      {/* Year-by-Year Cash-Flow Table */}
      <Card>
        <CardHeader>
          <CardTitle>Year-by-Year Cash-Flow Schedule</CardTitle>
          <CardDescription>
            Full {result.assumptions.systemLifetimeYears}-year projection with{' '}
            {result.assumptions.annualDegradationPct}% annual panel degradation and{' '}
            {result.assumptions.annualTariffEscalationPct}% tariff escalation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table
            columns={cashFlowColumns}
            data={result.cashFlows}
            rowKey={(row) => String(row.year)}
          />
        </CardContent>
      </Card>

      {/* Accuracy & Disclaimers */}
      <Card className="bg-[#F5F8F5]/80">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#102A25]" />
            <CardTitle>Accuracy &amp; Important Disclaimers</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-xs text-[#64736B] space-y-1.5 leading-relaxed">
          <p>
            This simulator provides mathematical estimates based on your inputs —{' '}
            <strong className="text-[#17231F]">not guaranteed financial returns</strong>.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Actual solar generation depends on location, local irradiance, weather, roof tilt,
              shading, and installation quality.
            </li>
            <li>
              Electricity tariffs vary significantly across Indian states, DISCOMs, consumer
              categories, and slab structures.
            </li>
            <li>
              Government subsidies depend on current eligibility and official MNRE / state nodal
              agency rules; this calculator never assumes or inserts subsidies automatically.
            </li>
            <li>
              Installation costs vary by vendor, equipment tier, structural mounting, and site
              conditions.
            </li>
            <li>
              Actual payback periods and ROI may differ from simulated projections.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

