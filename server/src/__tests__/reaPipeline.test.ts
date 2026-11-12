import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import * as dbConfig from '../config/db.js';
import { env } from '../config/env.js';
import {
  AuditProvenanceModel,
  DataSourceModel,
  EnergyMetricModel,
  IngestionRunModel,
  StagedRecordModel,
} from '../models/index.js';
import { computeProposalDiff } from '../services/rea/dedupeAndDiff.js';
import { getDemoFixtureDataset } from '../services/rea/fixtureConnector.js';
import { normalizeAndValidateRows } from '../services/rea/normalizerAndValidator.js';
import { parseSourcePayload } from '../services/rea/parsers.js';
import {
  evaluateSourcePermission,
  safeFetchOfficialResource,
  validateFetchUrl,
} from '../services/rea/permissionGuard.js';
import { runReaIngestion } from '../services/rea/reaPipelineService.js';
import {
  processReviewDecision,
  publishApprovedStagedRecord,
} from '../services/rea/reviewService.js';

const MOCK_SOURCE_ID = '65f1a2b3c4d5e6f7a8b9c0d1';

describe('Milestone 05 — REA Permission Guard & SSRF Protection', () => {
  it('blocks manual-only, needs_review, and inactive sources in live mode', () => {
    const manualRes = evaluateSourcePermission(
      {
        sourceName: 'MNRE Portal',
        domain: 'mnre.gov.in',
        sourceUrl: 'https://mnre.gov.in',
        verificationStatus: 'verified',
        accessMethod: 'manual',
        active: true,
      },
      'live'
    );
    expect(manualRes.allowed).toBe(false);
    expect(manualRes.code).toBe('MANUAL_ONLY_BLOCKED');

    const reviewRes = evaluateSourcePermission(
      {
        sourceName: 'GEDA',
        domain: 'geda.gujarat.gov.in',
        sourceUrl: 'https://geda.gujarat.gov.in',
        verificationStatus: 'needs_review',
        accessMethod: 'api',
        active: true,
      },
      'live'
    );
    expect(reviewRes.allowed).toBe(false);
    expect(reviewRes.code).toBe('SOURCE_NOT_VERIFIED');

    const inactiveRes = evaluateSourcePermission(
      {
        sourceName: 'OGD',
        domain: 'data.gov.in',
        sourceUrl: 'https://api.data.gov.in/resource/123',
        verificationStatus: 'verified',
        accessMethod: 'api',
        active: false,
      },
      'live'
    );
    expect(inactiveRes.allowed).toBe(false);
    expect(inactiveRes.code).toBe('SOURCE_INACTIVE');
  });

  it('allows verified automated HTTPS sources and blocks SSRF/private/http URLs', () => {
    const permitted = evaluateSourcePermission(
      {
        sourceName: 'OGD API',
        domain: 'data.gov.in',
        sourceUrl: 'https://api.data.gov.in/resource/test',
        verificationStatus: 'verified',
        accessMethod: 'api',
        active: true,
      },
      'live'
    );
    expect(permitted.allowed).toBe(true);
    expect(permitted.code).toBe('ALLOWED_LIVE');

    expect(validateFetchUrl('http://api.data.gov.in/test', ['data.gov.in']).valid).toBe(false);
    expect(validateFetchUrl('https://localhost:3000/secret', ['localhost']).valid).toBe(false);
    expect(validateFetchUrl('https://127.0.0.1/admin', ['127.0.0.1']).valid).toBe(false);
    expect(validateFetchUrl('https://169.254.169.254/latest/meta-data', ['169.254.169.254']).valid).toBe(false);
    expect(validateFetchUrl('https://10.0.0.5/internal', ['10.0.0.5']).valid).toBe(false);
    expect(validateFetchUrl('https://evil.example.com/data', ['data.gov.in']).valid).toBe(false);
  });

  it('explicitly labels fixture mode as ALLOWED_DEMO_FIXTURE', () => {
    const res = evaluateSourcePermission(
      {
        sourceName: 'MNRE Portal',
        domain: 'mnre.gov.in',
        sourceUrl: 'https://mnre.gov.in',
        verificationStatus: 'verified',
        accessMethod: 'manual',
        active: true,
      },
      'fixture'
    );
    expect(res.allowed).toBe(true);
    expect(res.code).toBe('ALLOWED_DEMO_FIXTURE');
  });
});

describe('Milestone 05 — REA Parsing, Normalization, Validation & Diffing', () => {
  it('parses DEMO CSV and JSON fixtures and rejects invalid rows cleanly', () => {
    const csvFixture = getDemoFixtureDataset('csv');
    const csvRows = parseSourcePayload(csvFixture.payload, 'csv');
    expect(csvRows).toHaveLength(4);

    const { accepted, errors } = normalizeAndValidateRows(csvRows, MOCK_SOURCE_ID);
    expect(accepted).toHaveLength(3);
    expect(errors).toHaveLength(1);
    expect(errors[0].rowIndex).toBe(4);
    expect(errors[0].field).toBe('value');

    const jsonFixture = getDemoFixtureDataset('json');
    const jsonRows = parseSourcePayload(jsonFixture.payload, 'json');
    const jsonResult = normalizeAndValidateRows(jsonRows, MOCK_SOURCE_ID);
    expect(jsonResult.accepted).toHaveLength(2);
    expect(jsonResult.errors).toHaveLength(0);
  });

  it('detects new, unchanged (duplicate), and updated records deterministically', () => {
    const csvFixture = getDemoFixtureDataset('csv');
    const [proposal] = normalizeAndValidateRows(
      parseSourcePayload(csvFixture.payload, 'csv'),
      MOCK_SOURCE_ID
    ).accepted;

    const newDiff = computeProposalDiff(proposal, null, null);
    expect(newDiff.changeType).toBe('new');

    const dupPending = computeProposalDiff(proposal, null, proposal.contentHash);
    expect(dupPending.changeType).toBe('unchanged');

    const dupPublished = computeProposalDiff(
      proposal,
      {
        metricName: proposal.proposedData.metricName,
        value: proposal.proposedData.value,
        unit: proposal.proposedData.unit,
        geographicScope: proposal.proposedData.geographicScope,
        stateOrRegion: proposal.proposedData.stateOrRegion,
        observationDate: proposal.proposedData.observationDate,
      },
      null
    );
    expect(dupPublished.changeType).toBe('unchanged');

    const updatedDiff = computeProposalDiff(
      proposal,
      {
        metricName: proposal.proposedData.metricName,
        value: proposal.proposedData.value - 100,
        unit: proposal.proposedData.unit,
        geographicScope: proposal.proposedData.geographicScope,
        stateOrRegion: proposal.proposedData.stateOrRegion,
        observationDate: proposal.proposedData.observationDate,
      },
      null
    );
    expect(updatedDiff.changeType).toBe('updated');
    expect(updatedDiff.changeSummary).toContain('value:');
  });
});

describe('Milestone 05 — REA Pipeline & Review Workflow (Mocked Persistence)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('dry-run mode parses/validates without writing IngestionRun, StagedRecord, or AuditProvenance', async () => {
    vi.spyOn(DataSourceModel, 'findById').mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: MOCK_SOURCE_ID,
        sourceName: 'MNRE Portal',
        organization: 'MNRE',
        domain: 'mnre.gov.in',
        sourceUrl: 'https://mnre.gov.in',
        verificationStatus: 'verified',
        accessMethod: 'manual',
        active: true,
        isDemoData: false,
      }),
    } as never);

    vi.spyOn(EnergyMetricModel, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    } as never);
    vi.spyOn(StagedRecordModel, 'findOne').mockReturnValue({
      sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
    } as never);

    const createRunSpy = vi.spyOn(IngestionRunModel, 'create');
    const createStagedSpy = vi.spyOn(StagedRecordModel, 'create');
    const createAuditSpy = vi.spyOn(AuditProvenanceModel, 'create');

    const result = await runReaIngestion({
      sourceId: MOCK_SOURCE_ID,
      mode: 'fixture',
      format: 'csv',
      dryRun: true,
    });

    expect(result.dryRun).toBe(true);
    expect(result.isDemoData).toBe(true);
    expect(result.status).toBe('dry_run');
    expect(result.summary.recordsProcessed).toBe(4);
    expect(result.summary.recordsAccepted).toBe(3);
    expect(result.summary.recordsRejected).toBe(1);
    expect(result.summary.recordsStaged).toBe(0);
    expect(createRunSpy).not.toHaveBeenCalled();
    expect(createStagedSpy).not.toHaveBeenCalled();
    expect(createAuditSpy).not.toHaveBeenCalled();
  });

  it('requires human approval before publishing and creates AuditProvenance on approve+publish', async () => {
    const stagedId = '65f1a2b3c4d5e6f7a8b9c0d9';
    const fakeMetricId = '65f1a2b3c4d5e6f7a8b9c0e1';

    const pendingDoc = {
      _id: stagedId,
      sourceRef: MOCK_SOURCE_ID,
      reviewStatus: 'pending_review',
      reviewNotes: '',
      reviewedBy: '',
      reviewedAt: null as Date | null,
      publishedRecordId: null as string | null,
      publishedAt: null as Date | null,
      isDemoData: true,
      proposedData: {
        metricName: 'Solar Installed Capacity (DEMO)',
        value: 18450,
        unit: 'MW',
        geographicScope: 'state',
        stateOrRegion: 'Rajasthan',
        observationDate: new Date('2025-12-31T00:00:00.000Z'),
      },
      provenance: {
        sourceUrl: 'https://mnre.gov.in',
        retrievedAt: new Date('2026-01-15T00:00:00.000Z'),
        publishedAt: null,
        extractionMethod: 'demo_fixture_csv_v1',
        verificationStatus: 'unverified',
        confidence: 'high',
        notes: '',
      },
      save: vi.fn().mockResolvedValue(true),
      toObject: function toObject() {
        return { ...this };
      },
    };

    vi.spyOn(StagedRecordModel, 'findById').mockResolvedValue(pendingDoc as never);
    await expect(publishApprovedStagedRecord(stagedId)).rejects.toMatchObject({
      statusCode: 409,
      code: 'REVIEW_APPROVAL_REQUIRED',
    });

    vi.spyOn(DataSourceModel, 'findById').mockReturnValue({
      lean: vi.fn().mockResolvedValue({ organization: 'MNRE' }),
    } as never);
    vi.spyOn(EnergyMetricModel, 'findOne').mockResolvedValue(null as never);
    const createMetricSpy = vi.spyOn(EnergyMetricModel, 'create').mockResolvedValue({
      _id: fakeMetricId,
      toObject: () => ({ _id: fakeMetricId, isDemoData: true }),
    } as never);
    const createAuditSpy = vi
      .spyOn(AuditProvenanceModel, 'create')
      .mockResolvedValue({} as never);

    const decisionRes = await processReviewDecision({
      stagedRecordId: stagedId,
      decision: 'approve',
      reviewNotes: 'Verified DEMO fixture schema',
      reviewedBy: 'reviewer-1',
      publishOnApprove: true,
    });

    expect(pendingDoc.reviewStatus).toBe('approved');
    expect(createMetricSpy).toHaveBeenCalledTimes(1);
    expect(createAuditSpy).toHaveBeenCalledTimes(2); // 1 for approval, 1 for publish
    expect(decisionRes.publishedMetric).toEqual({ _id: fakeMetricId, isDemoData: true });
  });
});

describe('Milestone 05 — REA HTTP Endpoints Database Guard', () => {
  const app = createApp();

  it('returns 503 DATABASE_UNAVAILABLE for REA endpoints when MongoDB is disconnected', async () => {
    const endpoints = [
      request(app).get('/api/v1/rea/review-queue'),
      request(app).get('/api/v1/rea/audit-logs'),
      request(app)
        .post('/api/v1/rea/ingest')
        .send({ sourceId: MOCK_SOURCE_ID, mode: 'fixture', format: 'csv', dryRun: true }),
      request(app)
        .post(`/api/v1/rea/review-queue/${MOCK_SOURCE_ID}/decision`)
        .send({ decision: 'approve' }),
      request(app).post(`/api/v1/rea/review-queue/${MOCK_SOURCE_ID}/publish`),
    ];

    for (const reqPromise of endpoints) {
      const res = await reqPromise;
      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    }
  });
});

describe('Milestone 05 — Security Audit: Fail-Closed Auth, Publish Guards & Fetch Limits', () => {
  const app = createApp();
  const originalAdminKey = env.ADMIN_API_KEY;

  afterEach(() => {
    vi.restoreAllMocks();
    (env as { ADMIN_API_KEY?: string }).ADMIN_API_KEY = originalAdminKey;
  });

  it('fails closed (403 ADMIN_AUTH_NOT_CONFIGURED) on all /api/v1/rea/* routes when ADMIN_API_KEY is unset', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);
    (env as { ADMIN_API_KEY?: string }).ADMIN_API_KEY = undefined;

    const endpoints = [
      request(app).get('/api/v1/rea/review-queue'),
      request(app).get(`/api/v1/rea/review-queue/${MOCK_SOURCE_ID}`),
      request(app).get('/api/v1/rea/audit-logs'),
      request(app)
        .post('/api/v1/rea/ingest')
        .send({ sourceId: MOCK_SOURCE_ID, mode: 'fixture', format: 'csv', dryRun: true }),
      request(app)
        .post(`/api/v1/rea/review-queue/${MOCK_SOURCE_ID}/decision`)
        .send({ decision: 'approve' }),
      request(app).post(`/api/v1/rea/review-queue/${MOCK_SOURCE_ID}/publish`),
    ];

    for (const reqPromise of endpoints) {
      const res = await reqPromise;
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ADMIN_AUTH_NOT_CONFIGURED');
    }
  });

  it('returns 401 when x-admin-key is missing and 403 when invalid on /api/v1/rea/* routes', async () => {
    vi.spyOn(dbConfig, 'isDatabaseConnected').mockReturnValue(true);
    (env as { ADMIN_API_KEY?: string }).ADMIN_API_KEY = 'audit-secret-key';

    const missingKeyRes = await request(app).get('/api/v1/rea/review-queue');
    expect(missingKeyRes.status).toBe(401);
    expect(missingKeyRes.body.error.code).toBe('UNAUTHORIZED');

    const badKeyRes = await request(app)
      .get('/api/v1/rea/audit-logs')
      .set('x-admin-key', 'wrong-key');
    expect(badKeyRes.status).toBe(403);
    expect(badKeyRes.body.error.code).toBe('FORBIDDEN');
  });

  it('blocks publishing of rejected and needs_correction records (409 REVIEW_APPROVAL_REQUIRED)', async () => {
    for (const status of ['rejected', 'needs_correction'] as const) {
      vi.spyOn(StagedRecordModel, 'findById').mockResolvedValueOnce({
        _id: '65f1a2b3c4d5e6f7a8b9c0d9',
        reviewStatus: status,
      } as never);

      await expect(
        publishApprovedStagedRecord('65f1a2b3c4d5e6f7a8b9c0d9')
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'REVIEW_APPROVAL_REQUIRED',
      });
    }
  });

  it('blocks redirects to unallowlisted hosts and aborts oversized streaming bodies', async () => {
    const redirectFetch = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: 'https://evil.example.com/payload.json' },
      })
    );

    await expect(
      safeFetchOfficialResource('https://api.data.gov.in/resource/test', ['data.gov.in'], {
        fetchImpl: redirectFetch as unknown as typeof fetch,
      })
    ).rejects.toThrow(/not in the registered source domain allowlist/i);

    const largeStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(1024));
        controller.enqueue(new Uint8Array(1024));
        controller.close();
      },
    });
    const oversizedFetch = vi.fn().mockResolvedValue(
      new Response(largeStream, {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    await expect(
      safeFetchOfficialResource('https://api.data.gov.in/resource/test', ['data.gov.in'], {
        maxBytes: 1500,
        fetchImpl: oversizedFetch as unknown as typeof fetch,
      })
    ).rejects.toThrow(/exceeds max limit/i);
  });
});

