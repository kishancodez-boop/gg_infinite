import type { FilterQuery } from 'mongoose';
import type { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';
import {
  DataSourceModel,
  EnergyMetricModel,
  IngestionRunModel,
  PolicySchemeModel,
  RpoRecordModel,
} from '../models/index.js';
import type {
  DataSourceDocument,
  EnergyMetricDocument,
  IngestionRunDocument,
  PolicySchemeDocument,
  RpoRecordDocument,
} from '../models/index.js';
import type {
  createIngestionRunSchema,
  createMetricSchema,
  createPolicySchema,
  createRpoSchema,
  createSourceSchema,
  listIngestionRunsQuerySchema,
  listMetricsQuerySchema,
  listPoliciesQuerySchema,
  listRpoQuerySchema,
  listSourcesQuerySchema,
  updateSourceSchema,
} from '../schemas/domainSchemas.js';
import type { PolicyRecordKind } from '../types/domain.js';
import { buildDataModeFilter, executePaginatedQuery } from '../utils/pagination.js';

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listSources(query: z.infer<typeof listSourcesQuerySchema>) {
  const filter: FilterQuery<DataSourceDocument> = {
    ...buildDataModeFilter(query.dataMode),
  };
  if (query.verificationStatus) filter.verificationStatus = query.verificationStatus;
  if (query.sourceType) filter.sourceType = query.sourceType;
  if (query.dataCategory) filter.dataCategory = query.dataCategory;
  if (query.accessMethod) filter.accessMethod = query.accessMethod;
  if (query.active !== undefined) filter.active = query.active === 'true';
  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ sourceName: regex }, { organization: regex }, { domain: regex }];
  }

  return executePaginatedQuery<DataSourceDocument>({
    model: DataSourceModel,
    filter,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    dataMode: query.dataMode,
  });
}

export async function getSourceById(id: string) {
  const doc = await DataSourceModel.findById(id).lean();
  if (!doc) throw new AppError('Data source not found', 404, 'RESOURCE_NOT_FOUND');
  return doc;
}

export async function createSource(payload: z.infer<typeof createSourceSchema>) {
  const created = await DataSourceModel.create(payload);
  return created.toObject();
}

export async function updateSourceById(
  id: string,
  payload: z.infer<typeof updateSourceSchema>
) {
  const updated = await DataSourceModel.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  ).lean();
  if (!updated) throw new AppError('Data source not found', 404, 'RESOURCE_NOT_FOUND');
  return updated;
}

export async function deleteSourceById(id: string) {
  const deleted = await DataSourceModel.findByIdAndDelete(id).lean();
  if (!deleted) throw new AppError('Data source not found', 404, 'RESOURCE_NOT_FOUND');
  return deleted;
}

export async function listMetrics(query: z.infer<typeof listMetricsQuerySchema>) {
  const filter: FilterQuery<EnergyMetricDocument> = {
    ...buildDataModeFilter(query.dataMode),
  };
  if (query.verificationStatus) {
    filter['provenance.verificationStatus'] = query.verificationStatus;
  }
  if (query.geographicScope) filter.geographicScope = query.geographicScope;
  if (query.stateOrRegion) {
    filter.stateOrRegion = new RegExp(escapeRegex(query.stateOrRegion), 'i');
  }
  if (query.metricName) {
    filter.metricName = new RegExp(escapeRegex(query.metricName), 'i');
  }
  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ metricName: regex }, { stateOrRegion: regex }];
  }

  return executePaginatedQuery<EnergyMetricDocument>({
    model: EnergyMetricModel,
    filter,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    dataMode: query.dataMode,
  });
}

export async function getMetricById(id: string) {
  const doc = await EnergyMetricModel.findById(id).lean();
  if (!doc) throw new AppError('Energy metric not found', 404, 'RESOURCE_NOT_FOUND');
  return doc;
}

export async function createMetric(payload: z.infer<typeof createMetricSchema>) {
  const created = await EnergyMetricModel.create(payload);
  return created.toObject();
}

export async function listPoliciesOrSchemes(
  query: z.infer<typeof listPoliciesQuerySchema>,
  defaultKind?: PolicyRecordKind
) {
  const filter: FilterQuery<PolicySchemeDocument> = {
    ...buildDataModeFilter(query.dataMode),
  };
  const kind = query.recordKind === 'all' ? undefined : (query.recordKind ?? defaultKind);
  if (kind) filter.recordKind = kind;
  if (query.verificationStatus) filter.verificationStatus = query.verificationStatus;
  if (query.category) filter.category = query.category;
  if (query.schemeCategory) filter.schemeCategory = query.schemeCategory;
  if (query.jurisdiction) filter.jurisdiction = query.jurisdiction;
  if (query.status) filter.status = query.status;
  if (query.stateOrRegion) {
    filter.stateOrRegion = new RegExp(escapeRegex(query.stateOrRegion), 'i');
  }
  if (query.issuingOrganization) {
    filter.issuingOrganization = new RegExp(escapeRegex(query.issuingOrganization), 'i');
  }

  const andConditions: FilterQuery<PolicySchemeDocument>[] = [];
  if (query.technology) {
    andConditions.push({
      $or: [{ technology: query.technology }, { category: query.technology }],
    });
  }
  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    andConditions.push({
      $or: [{ title: regex }, { description: regex }, { issuingOrganization: regex }],
    });
  }
  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  return executePaginatedQuery<PolicySchemeDocument>({
    model: PolicySchemeModel,
    filter,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    dataMode: query.dataMode,
  });
}

export async function getPolicyOrSchemeById(id: string, expectedKind?: PolicyRecordKind) {
  const filter: FilterQuery<PolicySchemeDocument> = { _id: id };
  if (expectedKind) filter.recordKind = expectedKind;
  const doc = await PolicySchemeModel.findOne(filter)
    .populate('sourceRef', 'sourceName organization domain sourceUrl verificationStatus')
    .lean();
  if (!doc) throw new AppError('Policy or scheme not found', 404, 'RESOURCE_NOT_FOUND');
  return doc;
}

export async function createPolicyOrScheme(
  payload: z.infer<typeof createPolicySchema>,
  defaultKind: PolicyRecordKind
) {
  const created = await PolicySchemeModel.create({
    ...payload,
    technology: payload.technology ?? payload.category,
    recordKind: payload.recordKind ?? defaultKind,
  });
  return created.toObject();
}

export async function listRpoRecords(query: z.infer<typeof listRpoQuerySchema>) {
  const filter: FilterQuery<RpoRecordDocument> = {
    ...buildDataModeFilter(query.dataMode),
  };
  if (query.verificationStatus) filter.verificationStatus = query.verificationStatus;
  if (query.entityType) filter.entityType = query.entityType;
  if (query.stateOrOrganization) {
    filter.stateOrOrganization = new RegExp(escapeRegex(query.stateOrOrganization), 'i');
  }
  if (query.state) {
    const stateRegex = new RegExp(escapeRegex(query.state), 'i');
    filter.$or = [{ state: stateRegex }, { stateOrOrganization: stateRegex }];
  }
  if (query.discomName) {
    const discomRegex = new RegExp(escapeRegex(query.discomName), 'i');
    filter.$and = [
      ...(Array.isArray(filter.$and) ? filter.$and : []),
      { $or: [{ discomName: discomRegex }, { stateOrOrganization: discomRegex }] },
    ];
  }
  if (query.compliancePeriod) {
    filter.compliancePeriod = query.compliancePeriod;
  }
  if (query.category) filter.category = query.category;
  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$and = [
      ...(Array.isArray(filter.$and) ? filter.$and : []),
      {
        $or: [
          { stateOrOrganization: regex },
          { state: regex },
          { discomName: regex },
          { compliancePeriod: regex },
        ],
      },
    ];
  }

  return executePaginatedQuery<RpoRecordDocument>({
    model: RpoRecordModel,
    filter,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    dataMode: query.dataMode,
  });
}

export async function getRpoRecordById(id: string) {
  const doc = await RpoRecordModel.findById(id).lean();
  if (!doc) throw new AppError('RPO record not found', 404, 'RESOURCE_NOT_FOUND');
  return doc;
}

export async function createRpoRecord(payload: z.infer<typeof createRpoSchema>) {
  const created = await RpoRecordModel.create(payload);
  return created.toObject();
}

export async function listIngestionRuns(
  query: z.infer<typeof listIngestionRunsQuerySchema>
) {
  const filter: FilterQuery<IngestionRunDocument> = {
    ...buildDataModeFilter(query.dataMode),
  };
  if (query.status) filter.status = query.status;
  if (query.sourceRef) filter.sourceRef = query.sourceRef;

  return executePaginatedQuery<IngestionRunDocument>({
    model: IngestionRunModel,
    filter,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    dataMode: query.dataMode,
  });
}

export async function getIngestionRunById(id: string) {
  const doc = await IngestionRunModel.findById(id).lean();
  if (!doc) throw new AppError('Ingestion run not found', 404, 'RESOURCE_NOT_FOUND');
  return doc;
}

export async function createIngestionRun(
  payload: z.infer<typeof createIngestionRunSchema>
) {
  const created = await IngestionRunModel.create(payload);
  return created.toObject();
}
