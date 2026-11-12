import { Router } from 'express';
import { z } from 'zod';
import { getHealth, getSystemStatus } from '../controllers/healthController.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

const statusQuerySchema = z.object({
  detail: z.enum(['basic', 'full']).optional(),
});

router.get('/health', getHealth);
router.get(
  '/v1/system/status',
  validateRequest({ query: statusQuerySchema }),
  getSystemStatus
);

export default router;

