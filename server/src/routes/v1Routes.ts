import { Router } from 'express';
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

const router = Router();

// All /api/v1 domain data routes require an active MongoDB connection.
// Mounted on specific resource prefixes so unknown /api/v1/* paths still return 404.
router.use(
  ['/sources', '/metrics', '/policies', '/schemes', '/rpo', '/ingestion-runs'],
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
router.post('/policies', validateRequest({ body: createPolicySchema }), policyHandlers.create);

const schemeHandlers = makePolicyHandlers('scheme');
router.get('/schemes', validateRequest({ query: listPoliciesQuerySchema }), schemeHandlers.list);
router.get('/schemes/:id', validateRequest({ params: idParamSchema }), schemeHandlers.getById);
router.post('/schemes', validateRequest({ body: createPolicySchema }), schemeHandlers.create);

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

export default router;

