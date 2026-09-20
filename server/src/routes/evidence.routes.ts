import { Router } from 'express';
import multer from 'multer';
import { EvidenceController } from '../controllers/evidence.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';

const upload = multer({
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max evidence file limit
});

const router = Router();

router.get('/', authenticateUser, EvidenceController.listEvidence);
router.get('/:id', authenticateUser, EvidenceController.getEvidenceDetails);
router.get('/:id/download', authenticateUser, EvidenceController.downloadEvidence);

router.post(
  '/',
  authenticateUser,
  requireRoles(['SUPER_ADMIN', 'SECURITY_ADMIN', 'SOC_ANALYST', 'INCIDENT_RESPONDER']),
  upload.single('file'),
  EvidenceController.uploadEvidence
);

router.post(
  '/:id/verify',
  authenticateUser,
  requireRoles(['SUPER_ADMIN', 'SECURITY_ADMIN', 'SOC_ANALYST', 'INCIDENT_RESPONDER']),
  EvidenceController.verifyIntegrity
);

export default router;
