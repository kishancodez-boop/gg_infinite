import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { env } from '../config/env.js';
import {
  AuditProvenanceModel,
  DataSourceModel,
  EnergyMetricModel,
  IngestionRunModel,
  PolicySchemeModel,
  RpoRecordModel,
} from '../models/index.js';

/**
 * Explicitly labeled DEMO fixtures for layout and API testing only.
 * Never represents official live government statistics, schemes, or compliance determinations.
 */
export const DEMO_SEED_FIXTURES = {
  source: {
    sourceName: '[DEMO] Sample Renewable Energy Data Portal',
    organization: '[DEMO] Sample Energy Agency',
    sourceUrl: 'https://example.org/demo-renewable-energy-source',
    sourceType: 'other' as const,
    accessMethod: 'manual' as const,
    verificationStatus: 'unverified' as const,
    lastCheckedAt: new Date('2026-01-15T00:00:00.000Z'),
    active: true,
    isDemoData: true,
  },
  metrics: [
    {
      metricName: '[DEMO] Sample Solar Capacity Fixture',
      value: 100,
      unit: 'MW (DEMO)',
      geographicScope: 'national' as const,
      stateOrRegion: 'India (DEMO)',
      observationDate: new Date('2026-01-01T00:00:00.000Z'),
      provenance: {
        originalSource: '[DEMO] Sample Fixture Only',
        sourceUrl: 'https://example.org/demo-renewable-energy-source',
        retrievedAt: new Date('2026-01-15T00:00:00.000Z'),
        publishedAt: null,
        extractionMethod: 'manual' as const,
        confidence: 0,
        verificationStatus: 'unverified' as const,
      },
      isDemoData: true,
    },
  ],
  policiesAndSchemes: [
    {
      title: '[DEMO] Sample Rooftop Solar Policy Fixture',
      description:
        'DEMO PLACEHOLDER ONLY: Illustrates policy record structure without fabricating real government terms or subsidies.',
      issuingOrganization: '[DEMO] Sample Ministry Fixture',
      recordKind: 'policy' as const,
      category: 'solar' as const,
      jurisdiction: 'central' as const,
      stateOrRegion: null,
      officialUrl: 'https://example.org/demo-policy',
      effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
      verificationStatus: 'unverified' as const,
      isDemoData: true,
    },
    {
      title: '[DEMO] Sample Solar Incentive Scheme Fixture',
      description:
        'DEMO PLACEHOLDER ONLY: Illustrates scheme record structure without fabricating official subsidy amounts or eligibility.',
      issuingOrganization: '[DEMO] Sample State Nodal Agency Fixture',
      recordKind: 'scheme' as const,
      category: 'solar' as const,
      jurisdiction: 'state' as const,
      stateOrRegion: 'Sample State (DEMO)',
      officialUrl: 'https://example.org/demo-scheme',
      effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
      verificationStatus: 'unverified' as const,
      isDemoData: true,
    },
  ],
  rpoRecords: [
    {
      stateOrOrganization: '[DEMO] Sample Utility Fixture',
      entityType: 'utility' as const,
      compliancePeriod: 'FY 2025-26 (DEMO)',
      category: 'solar' as const,
      targetPercentage: 10,
      reportedPercentage: null,
      verificationStatus: 'unverified' as const,
      isDemoData: true,
    },
  ],
};

export async function runDemoSeed(): Promise<void> {
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed DEMO data when NODE_ENV=production.');
  }

  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured in server/.env. Cannot seed MongoDB.');
  }

  await connectDatabase();
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Failed to establish MongoDB connection for seeding.');
  }

  try {
    const source = await DataSourceModel.findOneAndUpdate(
      { sourceUrl: DEMO_SEED_FIXTURES.source.sourceUrl },
      { $set: DEMO_SEED_FIXTURES.source },
      { upsert: true, new: true, runValidators: true }
    );

    await Promise.all([
      EnergyMetricModel.deleteMany({ isDemoData: true, sourceRef: source._id }),
      PolicySchemeModel.deleteMany({ isDemoData: true, sourceRef: source._id }),
      RpoRecordModel.deleteMany({ isDemoData: true, sourceRef: source._id }),
      IngestionRunModel.deleteMany({ isDemoData: true, sourceRef: source._id }),
      AuditProvenanceModel.deleteMany({ isDemoData: true }),
    ]);

    const [metric] = await EnergyMetricModel.insertMany(
      DEMO_SEED_FIXTURES.metrics.map((m) => ({ ...m, sourceRef: source._id }))
    );

    await PolicySchemeModel.insertMany(
      DEMO_SEED_FIXTURES.policiesAndSchemes.map((p) => ({ ...p, sourceRef: source._id }))
    );

    await RpoRecordModel.insertMany(
      DEMO_SEED_FIXTURES.rpoRecords.map((r) => ({ ...r, sourceRef: source._id }))
    );

    await IngestionRunModel.create({
      sourceRef: source._id,
      startedAt: new Date('2026-01-15T00:00:00.000Z'),
      endedAt: new Date('2026-01-15T00:00:05.000Z'),
      status: 'dry_run',
      recordsProcessed: 4,
      recordsAccepted: 4,
      recordsRejected: 0,
      errorSummary: null,
      isDemoData: true,
    });

    if (metric) {
      await AuditProvenanceModel.create({
        recordType: 'EnergyMetric',
        recordRef: metric._id,
        originalSource: '[DEMO] Sample Fixture Only',
        sourceUrl: DEMO_SEED_FIXTURES.source.sourceUrl,
        retrievedAt: new Date('2026-01-15T00:00:00.000Z'),
        verificationStatus: 'unverified',
        transformationNotes: 'DEMO fixture seeded explicitly via seedDemo.ts',
        isDemoData: true,
      });
    }

    console.info('[Seed] Explicit DEMO seed completed successfully.');
  } finally {
    await disconnectDatabase();
  }
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && currentFile === process.argv[1]) {
  runDemoSeed().catch((err) => {
    console.error('[Seed] Failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
}

