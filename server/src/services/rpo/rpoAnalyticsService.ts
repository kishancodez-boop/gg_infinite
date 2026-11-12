import type { FilterQuery } from 'mongoose';
import type { z } from 'zod';
import { RpoRecordModel, type RpoRecordDocument } from '../../models/index.js';
import type { listRpoQuerySchema } from '../../schemas/domainSchemas.js';
import { buildDataModeFilter } from '../../utils/pagination.js';

export interface RpoMetricInput {
  _id: unknown;
  stateOrOrganization: string;
  entityType: 'state' | 'discom' | 'utility' | 'other';
  state?: string | null;
  discomName?: string | null;
  compliancePeriod: string;
  category: string;
  targetPercentage: number;
  reportedPercentage?: number | null;
  targetEnergyMu?: number | null;
  achievedEnergyMu?: number | null;
  lastVerifiedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  verificationStatus: string;
  isDemoData: boolean;
  sourceRef?:
    | {
        _id?: unknown;
        sourceName?: string;
        organization?: string;
        domain?: string;
        sourceUrl?: string;
        verificationStatus?: string;
      }
    | unknown;
}

export interface ComputedRpoRecord {
  id: string;
  stateOrOrganization: string;
  entityType: 'state' | 'discom' | 'utility' | 'other';
  state: string | null;
  discomName: string | null;
  compliancePeriod: string;
  category: string;
  targetPercentage: number;
  reportedPercentage: number | null;
  targetEnergyMu: number | null;
  achievedEnergyMu: number | null;
  compliancePercent: number | null;
  complianceGapPercent: number | null;
  complianceGapMu: number | null;
  complianceStatus: 'compliant' | 'shortfall' | 'unavailable';
  verificationStatus: string;
  isDemoData: boolean;
  lastUpdatedAt: string | null;
  source: {
    sourceName: string;
    sourceUrl: string | null;
  };
}

export interface RpoTrackerSummaryResponse {
  kpis: {
    totalRecords: number;
    compliantCount: number;
    shortfallCount: number;
    unavailableCount: number;
    averageCompliancePercent: number | null;
    totalTargetEnergyMu: number | null;
    totalAchievedEnergyMu: number | null;
    totalEnergyGapMu: number | null;
  };
  records: ComputedRpoRecord[];
  meta: {
    hasDemoData: boolean;
    hasVerifiedData: boolean;
    lastUpdatedAt: string | null;
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function toIsoOrNull(val: Date | string | null | undefined): string | null {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function computeRpoRecordMetrics(record: RpoMetricInput): ComputedRpoRecord {
  const targetEnergyMu =
    record.targetEnergyMu !== undefined && record.targetEnergyMu !== null
      ? record.targetEnergyMu
      : null;
  const achievedEnergyMu =
    record.achievedEnergyMu !== undefined && record.achievedEnergyMu !== null
      ? record.achievedEnergyMu
      : null;
  const reportedPercentage =
    record.reportedPercentage !== undefined && record.reportedPercentage !== null
      ? record.reportedPercentage
      : null;

  let compliancePercent: number | null = null;
  if (targetEnergyMu !== null && targetEnergyMu > 0 && achievedEnergyMu !== null) {
    compliancePercent = round2((achievedEnergyMu / targetEnergyMu) * 100);
  } else if (record.targetPercentage > 0 && reportedPercentage !== null) {
    compliancePercent = round2((reportedPercentage / record.targetPercentage) * 100);
  }

  const complianceGapPercent =
    reportedPercentage !== null
      ? round2(record.targetPercentage - reportedPercentage)
      : null;

  const complianceGapMu =
    targetEnergyMu !== null && achievedEnergyMu !== null
      ? round2(targetEnergyMu - achievedEnergyMu)
      : null;

  let complianceStatus: ComputedRpoRecord['complianceStatus'] = 'unavailable';
  if (compliancePercent !== null) {
    complianceStatus = compliancePercent >= 100 ? 'compliant' : 'shortfall';
  }

  const sourceObj =
    record.sourceRef && typeof record.sourceRef === 'object'
      ? (record.sourceRef as {
          sourceName?: string;
          organization?: string;
          sourceUrl?: string;
        })
      : null;

  return {
    id: String(record._id),
    stateOrOrganization: record.stateOrOrganization,
    entityType: record.entityType,
    state: record.state ?? null,
    discomName: record.discomName ?? null,
    compliancePeriod: record.compliancePeriod,
    category: record.category,
    targetPercentage: record.targetPercentage,
    reportedPercentage,
    targetEnergyMu,
    achievedEnergyMu,
    compliancePercent,
    complianceGapPercent,
    complianceGapMu,
    complianceStatus,
    verificationStatus: record.verificationStatus,
    isDemoData: record.isDemoData,
    lastUpdatedAt:
      toIsoOrNull(record.lastVerifiedAt) ?? toIsoOrNull(record.updatedAt),
    source: {
      sourceName: sourceObj?.sourceName || sourceObj?.organization || 'Official Registry',
      sourceUrl: sourceObj?.sourceUrl ?? null,
    },
  };
}

export function computeRpoSummary(
  rawRecords: RpoMetricInput[]
): RpoTrackerSummaryResponse {
  const records = rawRecords.map(computeRpoRecordMetrics);

  let compliantCount = 0;
  let shortfallCount = 0;
  let unavailableCount = 0;
  let complianceSum = 0;
  let complianceCount = 0;
  let targetEnergySum = 0;
  let hasTargetEnergy = false;
  let achievedEnergySum = 0;
  let hasAchievedEnergy = false;
  let hasDemoData = false;
  let hasVerifiedData = false;
  let latestUpdated: Date | null = null;

  for (const r of records) {
    if (r.isDemoData) hasDemoData = true;
    else hasVerifiedData = true;

    if (r.complianceStatus === 'compliant') compliantCount += 1;
    else if (r.complianceStatus === 'shortfall') shortfallCount += 1;
    else unavailableCount += 1;

    if (r.compliancePercent !== null) {
      complianceSum += r.compliancePercent;
      complianceCount += 1;
    }

    if (r.targetEnergyMu !== null) {
      targetEnergySum += r.targetEnergyMu;
      hasTargetEnergy = true;
    }
    if (r.achievedEnergyMu !== null) {
      achievedEnergySum += r.achievedEnergyMu;
      hasAchievedEnergy = true;
    }

    if (r.lastUpdatedAt) {
      const d = new Date(r.lastUpdatedAt);
      if (!Number.isNaN(d.getTime()) && (!latestUpdated || d > latestUpdated)) {
        latestUpdated = d;
      }
    }
  }

  const totalTargetEnergyMu = hasTargetEnergy ? round2(targetEnergySum) : null;
  const totalAchievedEnergyMu = hasAchievedEnergy ? round2(achievedEnergySum) : null;
  const totalEnergyGapMu =
    totalTargetEnergyMu !== null && totalAchievedEnergyMu !== null
      ? round2(totalTargetEnergyMu - totalAchievedEnergyMu)
      : null;

  return {
    kpis: {
      totalRecords: records.length,
      compliantCount,
      shortfallCount,
      unavailableCount,
      averageCompliancePercent:
        complianceCount > 0 ? round2(complianceSum / complianceCount) : null,
      totalTargetEnergyMu,
      totalAchievedEnergyMu,
      totalEnergyGapMu,
    },
    records,
    meta: {
      hasDemoData,
      hasVerifiedData,
      lastUpdatedAt: latestUpdated ? latestUpdated.toISOString() : null,
    },
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getRpoTrackerSummary(
  query: z.infer<typeof listRpoQuerySchema>
): Promise<RpoTrackerSummaryResponse> {
  const filter: FilterQuery<RpoRecordDocument> = {
    ...buildDataModeFilter(query.dataMode),
  };
  if (query.verificationStatus) filter.verificationStatus = query.verificationStatus;
  if (query.entityType) filter.entityType = query.entityType;
  if (query.category) filter.category = query.category;
  if (query.compliancePeriod) {
    filter.compliancePeriod = new RegExp(escapeRegex(query.compliancePeriod), 'i');
  }
  if (query.stateOrOrganization) {
    filter.stateOrOrganization = new RegExp(escapeRegex(query.stateOrOrganization), 'i');
  }
  if (query.state) {
    const stateRegex = new RegExp(escapeRegex(query.state), 'i');
    filter.$and = [
      ...(Array.isArray(filter.$and) ? filter.$and : []),
      { $or: [{ state: stateRegex }, { stateOrOrganization: stateRegex }] },
    ];
  }
  if (query.discomName) {
    const discomRegex = new RegExp(escapeRegex(query.discomName), 'i');
    filter.$and = [
      ...(Array.isArray(filter.$and) ? filter.$and : []),
      { $or: [{ discomName: discomRegex }, { stateOrOrganization: discomRegex }] },
    ];
  }

  const docs = await RpoRecordModel.find(filter)
    .populate('sourceRef', 'sourceName organization domain sourceUrl verificationStatus')
    .sort({ [query.sortBy || 'createdAt']: query.sortOrder === 'asc' ? 1 : -1 })
    .limit(200)
    .lean();

  return computeRpoSummary(docs as unknown as RpoMetricInput[]);
}

