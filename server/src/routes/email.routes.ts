import { Router } from 'express';
import multer from 'multer';
import { EmailController } from '../controllers/email.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';

const upload = multer({
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB max EML file limit
});

const router = Router();

router.post(
  '/analyze',
  authenticateUser,
  requireRoles(['SUPER_ADMIN', 'SECURITY_ADMIN', 'SOC_ANALYST', 'INCIDENT_RESPONDER']),
  upload.any(),
  EmailController.analyzeEmail
);

export default router;
