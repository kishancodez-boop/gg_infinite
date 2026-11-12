export interface FixtureDataset {
  fixtureLabel: string;
  format: 'csv' | 'json';
  payload: string;
  extractionMethod: string;
}

const DEMO_CSV_PAYLOAD = [
  'metricName,value,unit,geographicScope,stateOrRegion,observationDate,publishedAt,notes',
  'Solar Installed Capacity (DEMO),18450,MW,state,Rajasthan,2025-12-31,2026-01-15,[DEMO] Sample fixture row for Rajasthan solar capacity',
  'Solar Installed Capacity (DEMO),14210,MW,state,Gujarat,2025-12-31,2026-01-15,[DEMO] Sample fixture row for Gujarat solar capacity',
  'Wind Installed Capacity (DEMO),10620,MW,state,Tamil Nadu,2025-12-31,2026-01-15,[DEMO] Sample fixture row for Tamil Nadu wind capacity',
  'Utility Solar Capacity (DEMO),-45,MW,state,InvalidRow,2025-12-31,2026-01-15,[DEMO] Intentionally invalid negative value to demonstrate validation rejection',
].join('\n');

const DEMO_JSON_PAYLOAD = JSON.stringify(
  {
    records: [
      {
        metricName: 'Renewable Grid Capacity (DEMO)',
        value: 9820,
        unit: 'MW',
        geographicScope: 'state',
        stateOrRegion: 'Karnataka',
        observationDate: '2025-12-31',
        publishedAt: '2026-01-20',
        notes: '[DEMO] Sample JSON fixture row for Karnataka',
      },
      {
        metricName: 'Renewable Grid Capacity (DEMO)',
        value: 11400,
        unit: 'MW',
        geographicScope: 'state',
        stateOrRegion: 'Maharashtra',
        observationDate: '2025-12-31',
        publishedAt: '2026-01-20',
        notes: '[DEMO] Sample JSON fixture row for Maharashtra',
      },
    ],
  },
  null,
  2
);

export function getDemoFixtureDataset(format: 'csv' | 'json'): FixtureDataset {
  if (format === 'json') {
    return {
      fixtureLabel: 'DEMO_LOCAL_JSON_FIXTURE_V1',
      format: 'json',
      payload: DEMO_JSON_PAYLOAD,
      extractionMethod: 'demo_fixture_json_v1',
    };
  }

  return {
    fixtureLabel: 'DEMO_LOCAL_CSV_FIXTURE_V1',
    format: 'csv',
    payload: DEMO_CSV_PAYLOAD,
    extractionMethod: 'demo_fixture_csv_v1',
  };
}

