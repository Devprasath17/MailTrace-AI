import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/summary', authenticateUser, DashboardController.getSummary);

export default router;
