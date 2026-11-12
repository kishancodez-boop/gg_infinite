export type RpoCategory = 'solar' | 'non_solar' | 'wind' | 'hpo' | 'total' | 'other';
export type RpoEntityType = 'state' | 'discom' | 'utility' | 'other';
export type RpoDataMode = 'all' | 'verified' | 'demo';

export interface RpoSummaryQuery {
  dataMode?: RpoDataMode;
  state?: string;
  discomName?: string;
  entityType?: RpoEntityType | '';
  category?: RpoCategory | '';
  compliancePeriod?: string;
}

export interface ComputedRpoRecord {
  id: string;
  stateOrOrganization: string;
  entityType: RpoEntityType;
  state: string | null;
  discomName: string | null;
  compliancePeriod: string;
  category: RpoCategory;
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

