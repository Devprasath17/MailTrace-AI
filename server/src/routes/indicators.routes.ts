import { Router } from 'express';
import { IndicatorsController } from '../controllers/indicators.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticateUser, IndicatorsController.listIndicators);
router.get('/:id', authenticateUser, IndicatorsController.getIndicatorDetails);

export default router;
