import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import {
  AuditProvenanceModel,
  DataSourceModel,
  EnergyMetricModel,
  IngestionRunModel,
  PolicySchemeModel,
  RpoRecordModel,
} from '../models/index.js';
import {
  createIngestionRunSchema,
  createMetricSchema,
  createSourceSchema,
} from '../schemas/domainSchemas.js';
import { DEMO_SEED_FIXTURES, runDemoSeed } from '../scripts/seedDemo.js';

const sampleId = new mongoose.Types.ObjectId();

describe('Mongoose Model Validation', () => {
  it('validates DataSourceModel URL and required fields', () => {
    const invalid = new DataSourceModel({
      sourceName: 'Invalid Source',
      organization: 'Org',
      sourceUrl: 'ftp://not-http',
      sourceType: 'other',
      accessMethod: 'api',
    });
    const err = invalid.validateSync();
    expect(err?.errors.sourceUrl).toBeDefined();

    const valid = new DataSourceModel({
      sourceName: 'Open Energy Portal',
      organization: 'Public Agency',
      sourceUrl: 'https://example.org/data',
      sourceType: 'public_open_data',
      accessMethod: 'csv',
      isDemoData: false,
    });
    expect(valid.validateSync()).toBeUndefined();
  });

  it('validates EnergyMetricModel provenance and numeric constraints', () => {
    const invalid = new EnergyMetricModel({
      metricName: 'Solar Capacity',
      value: Number.NaN,
      unit: 'MW',
      geographicScope: 'national',
      stateOrRegion: 'India',
      observationDate: new Date(),
      sourceRef: sampleId,
      provenance: {
        originalSource: 'Agency',
        sourceUrl: 'https://example.org',
        retrievedAt: new Date(),
        extractionMethod: 'api',
        confidence: 1.5,
      },
    });
    const err = invalid.validateSync();
    expect(err?.errors.value).toBeDefined();
    expect(err?.errors['provenance.confidence']).toBeDefined();
  });

  it('validates PolicySchemeModel officialUrl and category enum', () => {
    const invalid = new PolicySchemeModel({
      title: 'Test Policy',
      description: 'Valid description length for test.',
      issuingOrganization: 'Ministry',
      recordKind: 'scheme',
      category: 'unknown_cat',
      officialUrl: 'not-a-url',
      sourceRef: sampleId,
    });
    const err = invalid.validateSync();
    expect(err?.errors.category).toBeDefined();
    expect(err?.errors.officialUrl).toBeDefined();
  });

  it('validates RpoRecordModel target percentage bounds', () => {
    const invalid = new RpoRecordModel({
      stateOrOrganization: 'Sample Utility',
      compliancePeriod: 'FY 2025-26',
      targetPercentage: 120,
      sourceRef: sampleId,
    });
    const err = invalid.validateSync();
    expect(err?.errors.targetPercentage).toBeDefined();

    const valid = new RpoRecordModel({
      stateOrOrganization: 'Sample Utility',
      compliancePeriod: 'FY 2025-26',
      targetPercentage: 24.5,
      reportedPercentage: null,
      sourceRef: sampleId,
      isDemoData: true,
    });
    expect(valid.validateSync()).toBeUndefined();
  });

  it('enforces IngestionRunModel record counts and date ordering', async () => {
    const invalidCounts = new IngestionRunModel({
      sourceRef: sampleId,
      startedAt: new Date('2026-01-10T00:00:00Z'),
      status: 'completed',
      recordsProcessed: 5,
      recordsAccepted: 4,
      recordsRejected: 3,
    });
    await expect(invalidCounts.validate()).rejects.toThrow(
      /recordsAccepted \+ recordsRejected/
    );

    const invalidDates = new IngestionRunModel({
      sourceRef: sampleId,
      startedAt: new Date('2026-01-10T00:00:00Z'),
      endedAt: new Date('2026-01-09T00:00:00Z'),
      status: 'completed',
      recordsProcessed: 1,
      recordsAccepted: 1,
      recordsRejected: 0,
    });
    await expect(invalidDates.validate()).rejects.toThrow(/endedAt/);
  });

  it('validates AuditProvenanceModel recordType and URL', () => {
    const valid = new AuditProvenanceModel({
      recordType: 'EnergyMetric',
      recordRef: sampleId,
      originalSource: 'Official Feed',
      sourceUrl: 'https://example.org/feed.csv',
      retrievedAt: new Date(),
      verificationStatus: 'needs_review',
      transformationNotes: 'Normalized units to MW',
      isDemoData: false,
    });
    expect(valid.validateSync()).toBeUndefined();
  });
});

describe('Zod Schema & Demo Seed Safeguards', () => {
  it('validates createSourceSchema and rejects non-HTTP URLs', () => {
    expect(() =>
      createSourceSchema.parse({
        sourceName: 'Demo',
        organization: 'Agency',
        sourceUrl: 'javascript:alert(1)',
        sourceType: 'other',
        accessMethod: 'api',
      })
    ).toThrow();
  });

  it('validates createMetricSchema and createIngestionRunSchema', () => {
    const parsed = createMetricSchema.parse({
      metricName: 'Wind Capacity',
      value: 45,
      unit: 'GW',
      geographicScope: 'national',
      stateOrRegion: 'India',
      observationDate: '2026-01-01',
      sourceRef: sampleId.toString(),
      provenance: {
        originalSource: 'CEA',
        sourceUrl: 'https://example.org/cea',
        retrievedAt: '2026-01-02',
        extractionMethod: 'csv',
        confidence: 0.9,
      },
    });
    expect(parsed.isDemoData).toBe(false);

    expect(() =>
      createIngestionRunSchema.parse({
        sourceRef: sampleId.toString(),
        startedAt: '2026-01-02T00:00:00Z',
        recordsProcessed: 2,
        recordsAccepted: 2,
        recordsRejected: 1,
      })
    ).toThrow(/recordsAccepted/);
  });

  it('marks every DEMO seed fixture explicitly as isDemoData=true and refuses missing URI', async () => {
    expect(DEMO_SEED_FIXTURES.source.isDemoData).toBe(true);
    expect(DEMO_SEED_FIXTURES.metrics.every((m) => m.isDemoData)).toBe(true);
    expect(DEMO_SEED_FIXTURES.policiesAndSchemes.every((p) => p.isDemoData)).toBe(true);
    expect(DEMO_SEED_FIXTURES.rpoRecords.every((r) => r.isDemoData)).toBe(true);
    await expect(runDemoSeed()).rejects.toThrow(/MONGODB_URI is not configured/);
  });
});

