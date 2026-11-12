import type { NextFunction, Request, Response } from 'express';
import {
  createFinanceSchema,
  createJobSchema,
  listFinanceQuerySchema,
  listJobsQuerySchema,
} from '../schemas/financeJobsSchemas.js';
import * as financeJobsService from '../services/financeJobsService.js';

export async function getFinancePrograms(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listFinanceQuerySchema.parse(req.query);
    const result = await financeJobsService.listFinancePrograms(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getFinanceProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await financeJobsService.getFinanceProgramById(String(req.params.id));
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function postFinanceProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createFinanceSchema.parse(req.body);
    const created = await financeJobsService.createFinanceProgram(body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
}

export async function getJobListings(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listJobsQuerySchema.parse(req.query);
    const result = await financeJobsService.listJobListings(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getJobListing(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await financeJobsService.getJobListingById(String(req.params.id));
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function postJobListing(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createJobSchema.parse(req.body);
    const created = await financeJobsService.createJobListing(body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
}
