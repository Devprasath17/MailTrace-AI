import { Router } from 'express';
import { InvestigationsController } from '../controllers/investigations.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';

const router = Router();

router.get(
  '/',
  authenticateUser,
  InvestigationsController.listInvestigations
);

router.get(
  '/:id',
  authenticateUser,
  InvestigationsController.getInvestigationById
);

router.patch(
  '/:id',
  authenticateUser,
  requireRoles(['SUPER_ADMIN', 'SECURITY_ADMIN', 'SOC_ANALYST', 'INCIDENT_RESPONDER']),
  InvestigationsController.updateInvestigation
);

router.delete(
  '/:id',
  authenticateUser,
  requireRoles(['SUPER_ADMIN', 'SECURITY_ADMIN', 'SOC_ANALYST', 'INCIDENT_RESPONDER']),
  InvestigationsController.deleteInvestigation
);

router.get(
  '/:id/graph',
  authenticateUser,
  InvestigationsController.getInvestigationGraph
);

export default router;
