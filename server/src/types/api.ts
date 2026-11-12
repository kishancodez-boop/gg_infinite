import type { DataMode } from './domain.js';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiListResponse<T> {
  success: true;
  data: T[];
  meta: {
    pagination: PaginationMeta;
    dataMode: DataMode;
    containsDemoData: boolean;
  };
}

export interface ApiItemResponse<T> {
  success: true;
  data: T;
}

