import type { FilterQuery } from 'mongoose';
import type { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';
import {
  GreenFinanceProgramModel,
  GreenJobListingModel,
  type GreenFinanceProgramDocument,
  type GreenJobListingDocument,
} from '../models/index.js';
import type {
  createFinanceSchema,
  createJobSchema,
  listFinanceQuerySchema,
  listJobsQuerySchema,
} from '../schemas/financeJobsSchemas.js';
import { buildDataModeFilter, executePaginatedQuery } from '../utils/pagination.js';

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listFinancePrograms(query: z.infer<typeof listFinanceQuerySchema>) {
  const filter: FilterQuery<GreenFinanceProgramDocument> = {
    ...buildDataModeFilter(query.dataMode),
  };

  if (query.verificationStatus) filter.verificationStatus = query.verificationStatus;
  if (query.financeCategory) filter.financeCategory = query.financeCategory;
  if (query.projectType) filter.supportedProjectTypes = query.projectType;
  if (query.borrowerProfile) filter.borrowerProfiles = query.borrowerProfile;
  if (query.institutionName) {
    filter.institutionName = new RegExp(escapeRegex(query.institutionName), 'i');
  }
  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ programName: regex }, { institutionName: regex }, { description: regex }];
  }

  return executePaginatedQuery<GreenFinanceProgramDocument>({
    model: GreenFinanceProgramModel,
    filter,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    dataMode: query.dataMode,
    populate: {
      path: 'sourceRef',
      select: 'sourceName organization domain sourceUrl verificationStatus',
    },
  });
}

export async function getFinanceProgramById(id: string) {
  const doc = await GreenFinanceProgramModel.findById(id)
    .populate('sourceRef', 'sourceName organization domain sourceUrl verificationStatus')
    .lean();
  if (!doc) throw new AppError('Green finance program not found', 404, 'RESOURCE_NOT_FOUND');
  return doc;
}

export async function createFinanceProgram(payload: z.infer<typeof createFinanceSchema>) {
  const created = await GreenFinanceProgramModel.create(payload);
  return created.toObject();
}

export async function listJobListings(query: z.infer<typeof listJobsQuerySchema>) {
  const filter: FilterQuery<GreenJobListingDocument> = {
    ...buildDataModeFilter(query.dataMode),
  };

  if (query.verificationStatus) filter.verificationStatus = query.verificationStatus;
  if (query.roleCategory) filter.roleCategory = query.roleCategory;
  if (query.experienceLevel) filter.experienceLevel = query.experienceLevel;
  if (query.employmentType) filter.employmentType = query.employmentType;
  if (query.location) {
    const locRegex = new RegExp(escapeRegex(query.location), 'i');
    filter.$and = [
      ...(Array.isArray(filter.$and) ? filter.$and : []),
      { $or: [{ location: locRegex }, { stateOrRegion: locRegex }] },
    ];
  }
  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$and = [
      ...(Array.isArray(filter.$and) ? filter.$and : []),
      {
        $or: [
          { title: regex },
          { organization: regex },
          { description: regex },
          { requiredSkills: regex },
        ],
      },
    ];
  }

  return executePaginatedQuery<GreenJobListingDocument>({
    model: GreenJobListingModel,
    filter,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    dataMode: query.dataMode,
    populate: {
      path: 'sourceRef',
      select: 'sourceName organization domain sourceUrl verificationStatus',
    },
  });
}

export async function getJobListingById(id: string) {
  const doc = await GreenJobListingModel.findById(id)
    .populate('sourceRef', 'sourceName organization domain sourceUrl verificationStatus')
    .lean();
  if (!doc) throw new AppError('Green job listing not found', 404, 'RESOURCE_NOT_FOUND');
  return doc;
}

export async function createJobListing(payload: z.infer<typeof createJobSchema>) {
  const created = await GreenJobListingModel.create(payload);
  return created.toObject();
}

