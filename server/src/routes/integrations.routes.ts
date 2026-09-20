import { Router } from 'express';
import { IntegrationsController } from '../controllers/integrations.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';

const router = Router();

router.get('/', authenticateUser, IntegrationsController.getStatus);
router.get('/activity', authenticateUser, IntegrationsController.getIntegrationActivity);

router.post(
  '/:provider/test',
  authenticateUser,
  IntegrationsController.testConnection
);

router.post(
  '/:provider/configure',
  authenticateUser,
  requireRoles(['SUPER_ADMIN', 'SECURITY_ADMIN']),
  IntegrationsController.configureIntegration
);

export default router;
