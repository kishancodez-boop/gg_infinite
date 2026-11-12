import { Router } from 'express';
import {
  getSolarCalculationHistory,
  postSaveSolarCalculation,
  postSimulateSolarRoi,
} from '../controllers/calculatorController.js';
import { getNationalDashboard } from '../controllers/dashboardController.js';
import {
  deleteSource,
  getIngestionRun,
  getIngestionRuns,
  getMetric,
  getMetrics,
  getRpoRecord,
  getRpoRecords,
  getSource,
  getSources,
  makePolicyHandlers,
  patchSource,
  postIngestionRun,
  postMetric,
  postRpoRecord,
  postSource,
} from '../controllers/domainController.js';
import {
  getAuditLogs,
  getReviewQueue,
  getReviewQueueItem,
  postPublishStagedRecord,
  postReaIngest,
  postReviewDecision,
} from '../controllers/reaController.js';
import { requireAdminAuth } from '../middleware/adminAuth.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { validateRequest } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/commonSchemas.js';
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
import {
  listAuditLogsQuerySchema,
  listReviewQueueQuerySchema,
  reviewDecisionSchema,
  runReaIngestSchema,
} from '../schemas/reaSchemas.js';
import {
  listCalculatorHistoryQuerySchema,
  solarRoiSimulateSchema,
} from '../schemas/calculatorSchemas.js';
import { nationalDashboardQuerySchema } from '../schemas/dashboardSchemas.js';

const router = Router();

// All /api/v1 domain data routes require an active MongoDB connection.
// Mounted on specific resource prefixes so unknown /api/v1/* paths still return 404.
router.use(
  ['/sources', '/metrics', '/policies', '/schemes', '/rpo', '/ingestion-runs', '/rea'],
  requireDatabase
);

router.get('/sources', validateRequest({ query: listSourcesQuerySchema }), getSources);
router.get('/sources/:id', validateRequest({ params: idParamSchema }), getSource);
router.post(
  '/sources',
  requireAdminAuth,
  validateRequest({ body: createSourceSchema }),
  postSource
);
router.patch(
  '/sources/:id',
  requireAdminAuth,
  validateRequest({ params: idParamSchema, body: updateSourceSchema }),
  patchSource
);
router.delete(
  '/sources/:id',
  requireAdminAuth,
  validateRequest({ params: idParamSchema }),
  deleteSource
);

router.get('/metrics', validateRequest({ query: listMetricsQuerySchema }), getMetrics);
router.get('/metrics/:id', validateRequest({ params: idParamSchema }), getMetric);
router.post('/metrics', validateRequest({ body: createMetricSchema }), postMetric);

const policyHandlers = makePolicyHandlers('policy');
router.get('/policies', validateRequest({ query: listPoliciesQuerySchema }), policyHandlers.list);
router.get('/policies/:id', validateRequest({ params: idParamSchema }), policyHandlers.getById);
router.post(
  '/policies',
  requireAdminAuth,
  validateRequest({ body: createPolicySchema }),
  policyHandlers.create
);

const schemeHandlers = makePolicyHandlers('scheme');
router.get('/schemes', validateRequest({ query: listPoliciesQuerySchema }), schemeHandlers.list);
router.get('/schemes/:id', validateRequest({ params: idParamSchema }), schemeHandlers.getById);
router.post(
  '/schemes',
  requireAdminAuth,
  validateRequest({ body: createPolicySchema }),
  schemeHandlers.create
);

router.get('/rpo', validateRequest({ query: listRpoQuerySchema }), getRpoRecords);
router.get('/rpo/:id', validateRequest({ params: idParamSchema }), getRpoRecord);
router.post('/rpo', validateRequest({ body: createRpoSchema }), postRpoRecord);

router.get(
  '/ingestion-runs',
  validateRequest({ query: listIngestionRunsQuerySchema }),
  getIngestionRuns
);
router.get(
  '/ingestion-runs/:id',
  validateRequest({ params: idParamSchema }),
  getIngestionRun
);
router.post(
  '/ingestion-runs',
  validateRequest({ body: createIngestionRunSchema }),
  postIngestionRun
);

router.post(
  '/rea/ingest',
  requireAdminAuth,
  validateRequest({ body: runReaIngestSchema }),
  postReaIngest
);
router.get(
  '/rea/review-queue',
  requireAdminAuth,
  validateRequest({ query: listReviewQueueQuerySchema }),
  getReviewQueue
);
router.get(
  '/rea/review-queue/:id',
  requireAdminAuth,
  validateRequest({ params: idParamSchema }),
  getReviewQueueItem
);
router.post(
  '/rea/review-queue/:id/decision',
  requireAdminAuth,
  validateRequest({ params: idParamSchema, body: reviewDecisionSchema }),
  postReviewDecision
);
router.post(
  '/rea/review-queue/:id/publish',
  requireAdminAuth,
  validateRequest({ params: idParamSchema }),
  postPublishStagedRecord
);
router.get(
  '/rea/audit-logs',
  requireAdminAuth,
  validateRequest({ query: listAuditLogsQuerySchema }),
  getAuditLogs
);

// Stateless Solar ROI simulation works even when MongoDB is unavailable.
router.post(
  '/calculator/simulate',
  validateRequest({ body: solarRoiSimulateSchema }),
  postSimulateSolarRoi
);

// Saved calculation history requires both active MongoDB and admin authorization.
router.get(
  '/calculator/history',
  requireDatabase,
  requireAdminAuth,
  validateRequest({ query: listCalculatorHistoryQuerySchema }),
  getSolarCalculationHistory
);
router.post(
  '/calculator/history',
  requireDatabase,
  requireAdminAuth,
  validateRequest({ body: solarRoiSimulateSchema }),
  postSaveSolarCalculation
);

router.get(
  '/dashboard/national',
  requireDatabase,
  validateRequest({ query: nationalDashboardQuerySchema }),
  getNationalDashboard
);

export default router;

