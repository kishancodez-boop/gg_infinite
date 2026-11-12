import type { FilterQuery } from 'mongoose';
import { EnergyMetricModel, type EnergyMetricDocument } from '../../models/index.js';
import type { NationalDashboardQuery } from '../../schemas/dashboardSchemas.js';
import { buildDataModeFilter } from '../../utils/pagination.js';

export type MetricTechnology = 'solar' | 'wind' | 'other';

export interface DashboardMetricInput {
  _id: unknown;
  metricName: string;
  value: number;
  unit: string;
  geographicScope: string;
  stateOrRegion: string;
  observationDate: Date | string;
  isDemoData: boolean;
  provenance: {
    originalSource: string;
    sourceUrl: string;
    retrievedAt: Date | string;
    verificationStatus: string;
  };
}

export interface NationalDashboardSummary {
  kpis: {
    totalRenewableCapacityMw: number | null;
    solarCapacityMw: number | null;
    windCapacityMw: number | null;
    otherRenewableCapacityMw: number | null;
    latestGeneration: {
      value: number;
      unit: string;
      metricName: string;
      observationDate: string;
      stateOrRegion: string;
      isDemoData: boolean;
    } | null;
  };
  energyMix: Array<{
    technology: 'Solar' | 'Wind' | 'Other Renewable';
    capacityMw: number;
    sharePercent: number;
  }>;
  stateRankings: Array<{
    rank: number;
    stateOrRegion: string;
    capacityMw: number;
    solarMw: number | null;
    windMw: number | null;
    otherMw: number | null;
    isDemoData: boolean;
  }>;
  trends: Array<{
    date: string;
    capacityMw: number | null;
    generationValue: number | null;
    generationUnit: string | null;
  }>;
  recentUpdates: Array<{
    id: string;
    metricName: string;
    value: number;
    unit: string;
    stateOrRegion: string;
    observationDate: string;
    isDemoData: boolean;
    sourceName: string;
    sourceUrl: string;
    retrievedAt: string;
    verificationStatus: string;
  }>;
  meta: {
    recordCount: number;
    hasDemoData: boolean;
    hasVerifiedData: boolean;
    lastUpdatedAt: string | null;
    availableStates: string[];
  };
}

function classifyTechnology(metricName: string): MetricTechnology {
  const lower = metricName.toLowerCase();
  if (lower.includes('solar') || lower.includes('pv')) return 'solar';
  if (lower.includes('wind')) return 'wind';
  return 'other';
}

function isGenerationMetric(metric: DashboardMetricInput): boolean {
  const name = metric.metricName.toLowerCase();
  const unit = metric.unit.toLowerCase();
  return (
    name.includes('generation') ||
    unit === 'mu' ||
    unit === 'gwh' ||
    unit === 'mwh' ||
    unit === 'kwh'
  );
}

function toMwIfCapacity(metric: DashboardMetricInput): number | null {
  if (isGenerationMetric(metric)) return null;
  const unit = metric.unit.trim().toLowerCase();
  if (unit === 'mw') return metric.value;
  if (unit === 'gw') return metric.value * 1000;
  if (unit === 'kw') return metric.value / 1000;
  return null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function toIsoDate(val: Date | string): string {
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? String(val) : d.toISOString();
}

export function computeNationalDashboardSummary(
  metrics: DashboardMetricInput[],
  technologyFilter: 'all' | MetricTechnology = 'all'
): NationalDashboardSummary {
  const filtered =
    technologyFilter === 'all'
      ? metrics
      : metrics.filter((m) => classifyTechnology(m.metricName) === technologyFilter);

  let solarSum = 0;
  let hasSolar = false;
  let windSum = 0;
  let hasWind = false;
  let otherSum = 0;
  let hasOther = false;

  let latestGeneration: NationalDashboardSummary['kpis']['latestGeneration'] = null;
  let latestRetrievedAt: Date | null = null;
  let hasDemoData = false;
  let hasVerifiedData = false;

  const stateMap = new Map<
    string,
    {
      solar: number | null;
      wind: number | null;
      other: number | null;
      total: number;
      isDemoData: boolean;
    }
  >();

  const trendMap = new Map<
    string,
    {
      capacityMw: number | null;
      generationValue: number | null;
      generationUnit: string | null;
    }
  >();

  const statesSet = new Set<string>();

  for (const metric of filtered) {
    if (metric.isDemoData) hasDemoData = true;
    else hasVerifiedData = true;

    if (metric.stateOrRegion) {
      statesSet.add(metric.stateOrRegion);
    }

    const retrievedDate = new Date(metric.provenance.retrievedAt);
    if (!Number.isNaN(retrievedDate.getTime())) {
      if (!latestRetrievedAt || retrievedDate > latestRetrievedAt) {
        latestRetrievedAt = retrievedDate;
      }
    }

    const dateKey = toIsoDate(metric.observationDate).slice(0, 10);
    const tech = classifyTechnology(metric.metricName);

    if (isGenerationMetric(metric)) {
      const obsDate = new Date(metric.observationDate);
      if (
        !latestGeneration ||
        obsDate.getTime() > new Date(latestGeneration.observationDate).getTime()
      ) {
        latestGeneration = {
          value: metric.value,
          unit: metric.unit,
          metricName: metric.metricName,
          observationDate: toIsoDate(metric.observationDate),
          stateOrRegion: metric.stateOrRegion,
          isDemoData: metric.isDemoData,
        };
      }

      const tEntry = trendMap.get(dateKey) ?? {
        capacityMw: null,
        generationValue: null,
        generationUnit: null,
      };
      tEntry.generationValue = round2((tEntry.generationValue ?? 0) + metric.value);
      tEntry.generationUnit = metric.unit;
      trendMap.set(dateKey, tEntry);
      continue;
    }

    const capMw = toMwIfCapacity(metric);
    if (capMw === null) continue;

    if (tech === 'solar') {
      solarSum += capMw;
      hasSolar = true;
    } else if (tech === 'wind') {
      windSum += capMw;
      hasWind = true;
    } else {
      otherSum += capMw;
      hasOther = true;
    }

    const tEntry = trendMap.get(dateKey) ?? {
      capacityMw: null,
      generationValue: null,
      generationUnit: null,
    };
    tEntry.capacityMw = round2((tEntry.capacityMw ?? 0) + capMw);
    trendMap.set(dateKey, tEntry);

    const scope = metric.geographicScope.toLowerCase();
    const stateLower = metric.stateOrRegion.trim().toLowerCase();
    if (scope === 'state' && stateLower !== 'india' && stateLower !== 'all india') {
      const entry = stateMap.get(metric.stateOrRegion) ?? {
        solar: null,
        wind: null,
        other: null,
        total: 0,
        isDemoData: false,
      };
      if (tech === 'solar') entry.solar = round2((entry.solar ?? 0) + capMw);
      else if (tech === 'wind') entry.wind = round2((entry.wind ?? 0) + capMw);
      else entry.other = round2((entry.other ?? 0) + capMw);
      entry.total = round2(entry.total + capMw);
      if (metric.isDemoData) entry.isDemoData = true;
      stateMap.set(metric.stateOrRegion, entry);
    }
  }

  const solarCapacityMw = hasSolar ? round2(solarSum) : null;
  const windCapacityMw = hasWind ? round2(windSum) : null;
  const otherRenewableCapacityMw = hasOther ? round2(otherSum) : null;
  const hasAnyCapacity = hasSolar || hasWind || hasOther;
  const totalRenewableCapacityMw = hasAnyCapacity
    ? round2(solarSum + windSum + otherSum)
    : null;

  const energyMix: NationalDashboardSummary['energyMix'] = [];
  if (totalRenewableCapacityMw && totalRenewableCapacityMw > 0) {
    if (solarCapacityMw !== null && solarCapacityMw > 0) {
      energyMix.push({
        technology: 'Solar',
        capacityMw: solarCapacityMw,
        sharePercent: round2((solarCapacityMw / totalRenewableCapacityMw) * 100),
      });
    }
    if (windCapacityMw !== null && windCapacityMw > 0) {
      energyMix.push({
        technology: 'Wind',
        capacityMw: windCapacityMw,
        sharePercent: round2((windCapacityMw / totalRenewableCapacityMw) * 100),
      });
    }
    if (otherRenewableCapacityMw !== null && otherRenewableCapacityMw > 0) {
      energyMix.push({
        technology: 'Other Renewable',
        capacityMw: otherRenewableCapacityMw,
        sharePercent: round2((otherRenewableCapacityMw / totalRenewableCapacityMw) * 100),
      });
    }
  }

  const stateRankings = Array.from(stateMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .map(([stateOrRegion, data], idx) => ({
      rank: idx + 1,
      stateOrRegion,
      capacityMw: data.total,
      solarMw: data.solar,
      windMw: data.wind,
      otherMw: data.other,
      isDemoData: data.isDemoData,
    }));

  const trends = Array.from(trendMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, val]) => ({
      date,
      capacityMw: val.capacityMw,
      generationValue: val.generationValue,
      generationUnit: val.generationUnit,
    }));

  const recentUpdates = [...filtered]
    .sort(
      (a, b) =>
        new Date(b.observationDate).getTime() - new Date(a.observationDate).getTime()
    )
    .slice(0, 8)
    .map((m) => ({
      id: String(m._id),
      metricName: m.metricName,
      value: m.value,
      unit: m.unit,
      stateOrRegion: m.stateOrRegion,
      observationDate: toIsoDate(m.observationDate).slice(0, 10),
      isDemoData: m.isDemoData,
      sourceName: m.provenance.originalSource,
      sourceUrl: m.provenance.sourceUrl,
      retrievedAt: toIsoDate(m.provenance.retrievedAt).slice(0, 10),
      verificationStatus: m.provenance.verificationStatus,
    }));

  return {
    kpis: {
      totalRenewableCapacityMw,
      solarCapacityMw,
      windCapacityMw,
      otherRenewableCapacityMw,
      latestGeneration,
    },
    energyMix,
    stateRankings,
    trends,
    recentUpdates,
    meta: {
      recordCount: filtered.length,
      hasDemoData,
      hasVerifiedData,
      lastUpdatedAt: latestRetrievedAt ? latestRetrievedAt.toISOString() : null,
      availableStates: Array.from(statesSet).sort((a, b) => a.localeCompare(b)),
    },
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getNationalDashboardData(
  query: NationalDashboardQuery
): Promise<NationalDashboardSummary> {
  const filter: FilterQuery<EnergyMetricDocument> = {
    ...buildDataModeFilter(query.dataMode),
  };

  if (query.stateOrRegion) {
    filter.stateOrRegion = new RegExp(escapeRegex(query.stateOrRegion), 'i');
  }

  if (query.fromDate || query.toDate) {
    const dateRange: Record<string, Date> = {};
    if (query.fromDate) dateRange.$gte = query.fromDate;
    if (query.toDate) dateRange.$lte = query.toDate;
    filter.observationDate = dateRange;
  }

  const metrics = await EnergyMetricModel.find(filter)
    .sort({ observationDate: -1 })
    .limit(500)
    .lean();

  return computeNationalDashboardSummary(
    metrics as unknown as DashboardMetricInput[],
    query.technology
  );
}

