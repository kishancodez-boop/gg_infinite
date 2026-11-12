export type DashboardTechnology = 'all' | 'solar' | 'wind' | 'other';
export type DashboardDataMode = 'all' | 'verified' | 'demo';

export interface NationalDashboardQuery {
  dataMode?: DashboardDataMode;
  stateOrRegion?: string;
  technology?: DashboardTechnology;
  fromDate?: string;
  toDate?: string;
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

