import type { Request, Response } from 'express';
import {
  getStagedRecordById,
  listAuditLogs,
  listReviewQueue,
  processReviewDecision,
  publishApprovedStagedRecord,
} from '../services/rea/reviewService.js';
import { runReaIngestion } from '../services/rea/reaPipelineService.js';

export async function postReaIngest(req: Request, res: Response): Promise<void> {
  const result = await runReaIngestion(req.body);
  res.status(result.dryRun ? 200 : 201).json({ data: result });
}

export async function getReviewQueue(req: Request, res: Response): Promise<void> {
  const result = await listReviewQueue(req.query as never);
  res.status(200).json(result);
}

export async function getReviewQueueItem(req: Request, res: Response): Promise<void> {
  const item = await getStagedRecordById(String(req.params.id));
  res.status(200).json({ data: item });
}

export async function postReviewDecision(req: Request, res: Response): Promise<void> {
  const result = await processReviewDecision({
    stagedRecordId: String(req.params.id),
    ...req.body,
  });
  res.status(200).json({ data: result });
}

export async function postPublishStagedRecord(req: Request, res: Response): Promise<void> {
  const result = await publishApprovedStagedRecord(String(req.params.id));
  res.status(200).json({ data: result });
}

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  const result = await listAuditLogs(req.query as never);
  res.status(200).json(result);
}

