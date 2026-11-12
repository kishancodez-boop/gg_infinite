import type { Request, Response } from 'express';
import type { NationalDashboardQuery } from '../schemas/dashboardSchemas.js';
import { getNationalDashboardData } from '../services/dashboard/nationalDashboardService.js';

export async function getNationalDashboard(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as NationalDashboardQuery;
  const summary = await getNationalDashboardData(query);
  res.status(200).json({ data: summary });
}

