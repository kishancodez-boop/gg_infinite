import type { FilterQuery, Model, SortOrder } from 'mongoose';
import type { ApiListResponse, PaginationMeta } from '../types/api.js';
import type { DataMode } from '../types/domain.js';

export function buildDataModeFilter(dataMode: DataMode): Record<string, unknown> {
  if (dataMode === 'verified') {
    return { isDemoData: false };
  }
  if (dataMode === 'demo') {
    return { isDemoData: true };
  }
  return {};
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export interface PaginatedQueryOptions<T> {
  model: Model<T>;
  filter: FilterQuery<T>;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  dataMode: DataMode;
  populate?: { path: string; select?: string };
}

export async function executePaginatedQuery<T extends { isDemoData?: boolean }>({
  model,
  filter,
  page,
  limit,
  sortBy,
  sortOrder,
  dataMode,
  populate,
}: PaginatedQueryOptions<T>): Promise<ApiListResponse<T>> {
  const skip = (page - 1) * limit;
  const sortDirection: SortOrder = sortOrder === 'asc' ? 1 : -1;

  const findQuery = model
    .find(filter)
    .sort({ [sortBy]: sortDirection })
    .skip(skip)
    .limit(limit);

  if (populate) {
    findQuery.populate(populate.path, populate.select);
  }

  const [items, total] = await Promise.all([
    findQuery.lean<T[]>(),
    model.countDocuments(filter),
  ]);

  return {
    success: true,
    data: items,
    meta: {
      pagination: buildPaginationMeta(page, limit, total),
      dataMode,
      containsDemoData: items.some((item) => Boolean(item.isDemoData)),
    },
  };
}

