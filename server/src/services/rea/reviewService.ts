import { AppError } from '../../middleware/errorHandler.js';
import {
  AuditProvenanceModel,
  DataSourceModel,
  EnergyMetricModel,
  StagedRecordModel,
} from '../../models/index.js';
import type { DataMode, ReviewStatus } from '../../types/domain.js';
import { executePaginatedQuery } from '../../utils/pagination.js';

export interface ListReviewQueueQuery {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  dataMode: DataMode;
  reviewStatus?: ReviewStatus;
  changeType?: 'new' | 'unchanged' | 'updated';
  sourceRef?: string;
}

export async function listReviewQueue(query: ListReviewQueueQuery) {
  const filter: Record<string, unknown> = {};
  if (query.reviewStatus) filter.reviewStatus = query.reviewStatus;
  if (query.changeType) filter.changeType = query.changeType;
  if (query.sourceRef) filter.sourceRef = query.sourceRef;

  return executePaginatedQuery({
    model: StagedRecordModel,
    filter,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy || 'createdAt',
    sortOrder: query.sortOrder || 'desc',
    dataMode: query.dataMode || 'all',
  });
}

export async function getStagedRecordById(id: string) {
  const item = await StagedRecordModel.findById(id)
    .populate('sourceRef', 'sourceName organization domain verificationStatus accessMethod')
    .populate('ingestionRunRef', 'status sourceMode fixtureLabel startedAt')
    .lean();

  if (!item) {
    throw new AppError('Staged review record not found.', 404, 'STAGED_RECORD_NOT_FOUND');
  }
  return item;
}

export async function publishApprovedStagedRecord(stagedRecordId: string, actor = 'admin-reviewer') {
  const staged = await StagedRecordModel.findById(stagedRecordId);
  if (!staged) {
    throw new AppError('Staged review record not found.', 404, 'STAGED_RECORD_NOT_FOUND');
  }

  if (staged.reviewStatus !== 'approved') {
    throw new AppError(
      `Cannot publish staged record with reviewStatus="${staged.reviewStatus}". Human approval is required before publishing.`,
      409,
      'REVIEW_APPROVAL_REQUIRED'
    );
  }

  const source = await DataSourceModel.findById(staged.sourceRef).lean();
  const confidenceScore =
    staged.provenance.confidence === 'high'
      ? 0.9
      : staged.provenance.confidence === 'low'
        ? 0.4
        : 0.7;

  const metricPayload = {
    metricName: staged.proposedData.metricName,
    value: staged.proposedData.value,
    unit: staged.proposedData.unit,
    geographicScope: staged.proposedData.geographicScope,
    stateOrRegion: staged.proposedData.stateOrRegion,
    observationDate: staged.proposedData.observationDate,
    sourceRef: staged.sourceRef,
    provenance: {
      sourceUrl: staged.provenance.sourceUrl,
      originalSource: source?.organization ?? 'Registered Official Source',
      retrievedAt: staged.provenance.retrievedAt,
      publishedAt: staged.provenance.publishedAt ?? undefined,
      extractionMethod: source?.accessMethod ?? 'csv',
      confidence: confidenceScore,
      verificationStatus: staged.provenance.verificationStatus,
    },
    isDemoData: staged.isDemoData,
  };

  let metricDoc = await EnergyMetricModel.findOne({
    sourceRef: staged.sourceRef,
    metricName: staged.proposedData.metricName,
    stateOrRegion: staged.proposedData.stateOrRegion,
    observationDate: staged.proposedData.observationDate,
  });

  if (metricDoc) {
    metricDoc.value = metricPayload.value;
    metricDoc.unit = metricPayload.unit;
    metricDoc.geographicScope = metricPayload.geographicScope;
    metricDoc.provenance = metricPayload.provenance;
    metricDoc.isDemoData = metricPayload.isDemoData;
    await metricDoc.save();
  } else {
    metricDoc = await EnergyMetricModel.create(metricPayload);
  }

  const publishedAt = new Date();
  staged.publishedRecordId = metricDoc._id;
  staged.publishedAt = publishedAt;
  await staged.save();

  await AuditProvenanceModel.create({
    recordType: 'EnergyMetric',
    recordRef: metricDoc._id,
    originalSource: source?.organization ?? 'Registered Source',
    sourceUrl: staged.provenance.sourceUrl,
    retrievedAt: staged.provenance.retrievedAt,
    verificationStatus: staged.provenance.verificationStatus,
    transformationNotes: `Published approved staged record ${String(staged._id)} into EnergyMetric (${staged.proposedData.metricName}, ${staged.proposedData.stateOrRegion}).`,
    action: 'published',
    actor,
    isDemoData: staged.isDemoData,
  });

  return {
    stagedRecord: staged.toObject(),
    publishedMetric: metricDoc.toObject(),
  };
}

export async function processReviewDecision(input: {
  stagedRecordId: string;
  decision: 'approve' | 'reject' | 'request_correction';
  reviewNotes?: string;
  reviewedBy?: string;
  publishOnApprove?: boolean;
}) {
  const staged = await StagedRecordModel.findById(input.stagedRecordId);
  if (!staged) {
    throw new AppError('Staged review record not found.', 404, 'STAGED_RECORD_NOT_FOUND');
  }

  const statusMap: Record<typeof input.decision, ReviewStatus> = {
    approve: 'approved',
    reject: 'rejected',
    request_correction: 'needs_correction',
  };

  const auditActionMap = {
    approve: 'approved',
    reject: 'rejected',
    request_correction: 'correction_requested',
  } as const;

  const actor = input.reviewedBy?.trim() || 'admin-reviewer';
  staged.reviewStatus = statusMap[input.decision];
  staged.reviewNotes = input.reviewNotes?.trim() ?? '';
  staged.reviewedBy = actor;
  staged.reviewedAt = new Date();
  await staged.save();

  const source = await DataSourceModel.findById(staged.sourceRef).lean();
  await AuditProvenanceModel.create({
    recordType: 'StagedRecord',
    recordRef: staged._id,
    originalSource: source?.organization ?? 'Registered Source',
    sourceUrl: staged.provenance.sourceUrl,
    retrievedAt: staged.provenance.retrievedAt,
    verificationStatus: staged.provenance.verificationStatus,
    transformationNotes: `Review decision "${input.decision}" by ${actor}. ${staged.reviewNotes}`.trim(),
    action: auditActionMap[input.decision],
    actor,
    isDemoData: staged.isDemoData,
  });

  if (input.decision === 'approve' && input.publishOnApprove) {
    return publishApprovedStagedRecord(String(staged._id), actor);
  }

  return {
    stagedRecord: staged.toObject(),
    publishedMetric: null,
  };
}

export async function listAuditLogs(query: {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  dataMode: DataMode;
  recordType?: string;
}) {
  const filter: Record<string, unknown> = {};
  if (query.recordType) filter.recordType = query.recordType;

  return executePaginatedQuery({
    model: AuditProvenanceModel,
    filter,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy || 'createdAt',
    sortOrder: query.sortOrder || 'desc',
    dataMode: query.dataMode || 'all',
  });
}
