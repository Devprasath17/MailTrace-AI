import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';

const router = Router();
router.get('/', authenticateUser, requireRoles(['SUPER_ADMIN', 'SECURITY_ADMIN']), AuditController.listAuditLogs);

export default router;
