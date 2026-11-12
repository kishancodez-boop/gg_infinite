import type { Request, Response } from 'express';
import { SolarCalculationModel } from '../models/index.js';
import {
  buildComparisonScenarios,
  calculateSolarRoi,
} from '../services/calculator/solarRoiEngine.js';
import { executePaginatedQuery } from '../utils/pagination.js';

export async function postSimulateSolarRoi(req: Request, res: Response): Promise<void> {
  const result = calculateSolarRoi(req.body);
  const scenarios = buildComparisonScenarios(req.body);
  res.status(200).json({
    data: {
      ...result,
      scenarios,
    },
  });
}

export async function postSaveSolarCalculation(req: Request, res: Response): Promise<void> {
  const result = calculateSolarRoi(req.body);
  const created = await SolarCalculationModel.create({
    label: req.body.label ?? 'Solar ROI Simulation',
    inputs: req.body,
    assumptions: result.assumptions,
    resultsSummary: result.summary,
    isDemoData: Boolean(req.body.isDemoData),
  });
  res.status(201).json({ data: created.toObject() });
}

export async function getSolarCalculationHistory(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    dataMode: 'verified' | 'demo' | 'all';
  };
  const result = await executePaginatedQuery({
    model: SolarCalculationModel,
    filter: {},
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy || 'createdAt',
    sortOrder: query.sortOrder || 'desc',
    dataMode: query.dataMode || 'all',
  });
  res.status(200).json(result);
}

