import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';
import {
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
import * as domainService from '../services/domainService.js';
import type { PolicyRecordKind } from '../types/domain.js';

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    void fn(req, res, next).catch(next);
  };
}

export const getSources = asyncHandler(async (req, res) => {
  const query = req.query as unknown as z.infer<typeof listSourcesQuerySchema>;
  const result = await domainService.listSources(query);
  res.status(200).json(result);
});

export const getSource = asyncHandler(async (req, res) => {
  const item = await domainService.getSourceById(String(req.params.id));
  res.status(200).json({ success: true, data: item });
});

export const postSource = asyncHandler(async (req, res) => {
  const payload = req.body as z.infer<typeof createSourceSchema>;
  const created = await domainService.createSource(payload);
  res.status(201).json({ success: true, data: created });
});

export const patchSource = asyncHandler(async (req, res) => {
  const payload = req.body as z.infer<typeof updateSourceSchema>;
  const updated = await domainService.updateSourceById(String(req.params.id), payload);
  res.status(200).json({ success: true, data: updated });
});

export const deleteSource = asyncHandler(async (req, res) => {
  const deleted = await domainService.deleteSourceById(String(req.params.id));
  res.status(200).json({ success: true, data: deleted });
});

export const getMetrics = asyncHandler(async (req, res) => {
  const query = req.query as unknown as z.infer<typeof listMetricsQuerySchema>;
  const result = await domainService.listMetrics(query);
  res.status(200).json(result);
});

export const getMetric = asyncHandler(async (req, res) => {
  const item = await domainService.getMetricById(String(req.params.id));
  res.status(200).json({ success: true, data: item });
});

export const postMetric = asyncHandler(async (req, res) => {
  const payload = req.body as z.infer<typeof createMetricSchema>;
  const created = await domainService.createMetric(payload);
  res.status(201).json({ success: true, data: created });
});

export function makePolicyHandlers(kind: PolicyRecordKind) {
  return {
    list: asyncHandler(async (req, res) => {
      const query = req.query as unknown as z.infer<typeof listPoliciesQuerySchema>;
      const result = await domainService.listPoliciesOrSchemes(query, kind);
      res.status(200).json(result);
    }),
    getById: asyncHandler(async (req, res) => {
      const item = await domainService.getPolicyOrSchemeById(String(req.params.id), kind);
      res.status(200).json({ success: true, data: item });
    }),
    create: asyncHandler(async (req, res) => {
      const payload = req.body as z.infer<typeof createPolicySchema>;
      const created = await domainService.createPolicyOrScheme(payload, kind);
      res.status(201).json({ success: true, data: created });
    }),
  };
}

export const getRpoRecords = asyncHandler(async (req, res) => {
  const query = req.query as unknown as z.infer<typeof listRpoQuerySchema>;
  const result = await domainService.listRpoRecords(query);
  res.status(200).json(result);
});

export const getRpoSummary = asyncHandler(async (req, res) => {
  const query = req.query as unknown as z.infer<typeof listRpoQuerySchema>;
  const { getRpoTrackerSummary } = await import('../services/rpo/rpoAnalyticsService.js');
  const summary = await getRpoTrackerSummary(query);
  res.status(200).json({ data: summary });
});

export const getRpoRecord = asyncHandler(async (req, res) => {
  const item = await domainService.getRpoRecordById(String(req.params.id));
  res.status(200).json({ success: true, data: item });
});

export const postRpoRecord = asyncHandler(async (req, res) => {
  const payload = req.body as z.infer<typeof createRpoSchema>;
  const created = await domainService.createRpoRecord(payload);
  res.status(201).json({ success: true, data: created });
});

export const getIngestionRuns = asyncHandler(async (req, res) => {
  const query = req.query as unknown as z.infer<typeof listIngestionRunsQuerySchema>;
  const result = await domainService.listIngestionRuns(query);
  res.status(200).json(result);
});

export const getIngestionRun = asyncHandler(async (req, res) => {
  const item = await domainService.getIngestionRunById(String(req.params.id));
  res.status(200).json({ success: true, data: item });
});

export const postIngestionRun = asyncHandler(async (req, res) => {
  const payload = req.body as z.infer<typeof createIngestionRunSchema>;
  const created = await domainService.createIngestionRun(payload);
  res.status(201).json({ success: true, data: created });
});

