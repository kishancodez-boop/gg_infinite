import type { Request, Response } from 'express';
import { buildHealthPayload, buildSystemStatusPayload } from '../services/systemService.js';

export function getHealth(_req: Request, res: Response): void {
  const payload = buildHealthPayload();
  // Return 200 so dev monitors and frontend status checks receive the JSON payload
  // while still accurately reporting database.connected = false when unconfigured/disconnected.
  res.status(200).json(payload);
}

export function getSystemStatus(_req: Request, res: Response): void {
  const payload = buildSystemStatusPayload();
  res.status(200).json(payload);
}

