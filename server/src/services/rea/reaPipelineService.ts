import { AppError } from '../../middleware/errorHandler.js';
import {
  AuditProvenanceModel,
  DataSourceModel,
  EnergyMetricModel,
  IngestionRunModel,
  StagedRecordModel,
} from '../../models/index.js';
import type { ChangeType, IngestionMode, IngestionStatus } from '../../types/domain.js';
import { computeProposalDiff } from './dedupeAndDiff.js';
import { getDemoFixtureDataset } from './fixtureConnector.js';
import { normalizeAndValidateRows, type RowValidationError } from './normalizerAndValidator.js';
import { parseSourcePayload } from './parsers.js';
import { evaluateSourcePermission, safeFetchOfficialResource } from './permissionGuard.js';

export interface RunReaIngestionInput {
  sourceId: string;
  mode: IngestionMode;
  format: 'csv' | 'json';
  dryRun: boolean;
  targetUrl?: string;
  actor?: string;
  fetchImpl?: typeof fetch;
}

export interface StagedPreviewItem {
  stagedRecordId?: string;
  naturalKey: string;
  contentHash: string;
  changeType: ChangeType;
  changeSummary: string;
  proposedData: {
    metricName: string;
    value: number;
    unit: string;
    geographicScope: string;
    stateOrRegion: string;
    observationDate: Date;
  };
  provenance: {
    sourceUrl: string;
    retrievedAt: Date;
    publishedAt: Date | null;
    extractionMethod: string;
    verificationStatus: string;
    confidence: 'high' | 'medium' | 'low';
    notes: string;
  };
  isDemoData: boolean;
}

export interface RunReaIngestionResult {
  dryRun: boolean;
  isDemoData: boolean;
  sourceMode: IngestionMode;
  fixtureLabel: string | null;
  ingestionRunId: string | null;
  status: IngestionStatus;
  source: {
    id: string;
    sourceName: string;
    domain: string;
    verificationStatus: string;
    accessMethod: string;
  };
  permission: {
    allowed: boolean;
    code: string;
    reason: string;
  };
  summary: {
    recordsProcessed: number;
    recordsAccepted: number;
    recordsRejected: number;
    recordsStaged: number;
    recordsDuplicate: number;
    recordsChanged: number;
  };
  validationErrors: RowValidationError[];
  previews: StagedPreviewItem[];
}

export async function runReaIngestion(
  input: RunReaIngestionInput
): Promise<RunReaIngestionResult> {
  const source = await DataSourceModel.findById(input.sourceId).lean();
  if (!source) {
    throw new AppError('Registered data source not found.', 404, 'SOURCE_NOT_FOUND');
  }

  const permission = evaluateSourcePermission(source, input.mode);
  if (!permission.allowed) {
    await AuditProvenanceModel.create({
      recordType: 'DataSource',
      recordRef: source._id,
      originalSource: source.organization,
      sourceUrl: source.sourceUrl,
      retrievedAt: new Date(),
      verificationStatus: source.verificationStatus,
      transformationNotes: `REA blocked automated ingestion (${permission.code}): ${permission.reason}`,
      action: 'blocked',
      actor: input.actor ?? 'rea-engine',
      isDemoData: input.mode === 'fixture' || source.isDemoData,
    });

    throw new AppError(permission.reason, 403, 'SOURCE_PERMISSION_BLOCKED');
  }

  const startedAt = new Date();
  let payloadText = '';
  let sourceUrl = source.sourceUrl;
  let extractionMethod = `rea_${input.format}_parser`;
  let fixtureLabel: string | null = null;
  let isDemoData = source.isDemoData;

  if (input.mode === 'fixture') {
    const fixture = getDemoFixtureDataset(input.format);
    payloadText = fixture.payload;
    fixtureLabel = fixture.fixtureLabel;
    extractionMethod = fixture.extractionMethod;
    isDemoData = true;
  } else {
    const fetchResult = await safeFetchOfficialResource(
      input.targetUrl ?? source.sourceUrl,
      [source.domain],
      { fetchImpl: input.fetchImpl }
    );
    payloadText = fetchResult.body;
    sourceUrl = fetchResult.finalUrl;
  }

  const rawRows = parseSourcePayload(payloadText, input.format);
  const { accepted, errors } = normalizeAndValidateRows(rawRows, String(source._id));

  const previews: StagedPreviewItem[] = [];
  let duplicateCount = 0;
  let changedCount = 0;

  for (const proposal of accepted) {
    const [existingMetric, existingPending] = await Promise.all([
      EnergyMetricModel.findOne({
        sourceRef: source._id,
        metricName: proposal.proposedData.metricName,
        stateOrRegion: proposal.proposedData.stateOrRegion,
        observationDate: proposal.proposedData.observationDate,
      }).lean(),
      StagedRecordModel.findOne({
        naturalKey: proposal.naturalKey,
        reviewStatus: { $in: ['pending_review', 'approved'] },
      })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const diff = computeProposalDiff(
      proposal,
      existingMetric
        ? {
            metricName: existingMetric.metricName,
            value: existingMetric.value,
            unit: existingMetric.unit,
            geographicScope: existingMetric.geographicScope,
            stateOrRegion: existingMetric.stateOrRegion,
            observationDate: existingMetric.observationDate,
          }
        : null,
      existingPending?.contentHash ?? null
    );

    if (diff.changeType === 'unchanged') {
      duplicateCount += 1;
    } else if (diff.changeType === 'updated') {
      changedCount += 1;
    }

    previews.push({
      naturalKey: proposal.naturalKey,
      contentHash: proposal.contentHash,
      changeType: diff.changeType,
      changeSummary: diff.changeSummary,
      proposedData: proposal.proposedData,
      provenance: {
        sourceUrl,
        retrievedAt: startedAt,
        publishedAt: proposal.publishedAt,
        extractionMethod,
        verificationStatus: isDemoData ? 'unverified' : source.verificationStatus,
        confidence: proposal.confidence,
        notes: proposal.notes,
      },
      isDemoData,
    });
  }

  const stageableItems = previews.filter((item) => item.changeType !== 'unchanged');

  let status: IngestionStatus = 'completed';
  if (input.dryRun) {
    status = 'dry_run';
  } else if (accepted.length === 0 && errors.length > 0) {
    status = 'failed';
  } else if (errors.length > 0) {
    status = 'partial';
  }

  let ingestionRunId: string | null = null;

  if (!input.dryRun) {
    const runDoc = await IngestionRunModel.create({
      sourceRef: source._id,
      startedAt,
      endedAt: new Date(),
      status,
      recordsProcessed: rawRows.length,
      recordsAccepted: accepted.length,
      recordsRejected: errors.length,
      recordsDuplicate: duplicateCount,
      recordsChanged: changedCount,
      validationErrors: errors.slice(0, 50),
      isDryRun: false,
      sourceMode: input.mode,
      fixtureLabel,
      errorSummary:
        errors.length > 0
          ? `${errors.length} row(s) failed schema validation.`
          : null,
      isDemoData,
    });

    ingestionRunId = String(runDoc._id);

    for (const item of stageableItems) {
      const stagedDoc = await StagedRecordModel.create({
        sourceRef: source._id,
        ingestionRunRef: runDoc._id,
        naturalKey: item.naturalKey,
        contentHash: item.contentHash,
        changeType: item.changeType,
        changeSummary: item.changeSummary,
        proposedData: item.proposedData,
        provenance: item.provenance,
        reviewStatus: 'pending_review',
        isDemoData: item.isDemoData,
      });

      item.stagedRecordId = String(stagedDoc._id);

      await AuditProvenanceModel.create({
        recordType: 'StagedRecord',
        recordRef: stagedDoc._id,
        originalSource: source.organization,
        sourceUrl: item.provenance.sourceUrl,
        retrievedAt: item.provenance.retrievedAt,
        verificationStatus: item.provenance.verificationStatus,
        transformationNotes: `Staged ${item.changeType} metric "${item.proposedData.metricName}" (${item.proposedData.stateOrRegion}) for human review. ${item.changeSummary}`,
        action: 'staged',
        actor: input.actor ?? 'rea-engine',
        isDemoData: item.isDemoData,
      });
    }
  }

  return {
    dryRun: input.dryRun,
    isDemoData,
    sourceMode: input.mode,
    fixtureLabel,
    ingestionRunId,
    status,
    source: {
      id: String(source._id),
      sourceName: source.sourceName,
      domain: source.domain,
      verificationStatus: source.verificationStatus,
      accessMethod: source.accessMethod,
    },
    permission: {
      allowed: permission.allowed,
      code: permission.code,
      reason: permission.reason,
    },
    summary: {
      recordsProcessed: rawRows.length,
      recordsAccepted: accepted.length,
      recordsRejected: errors.length,
      recordsStaged: input.dryRun ? 0 : stageableItems.length,
      recordsDuplicate: duplicateCount,
      recordsChanged: changedCount,
    },
    validationErrors: errors,
    previews,
  };
}

