import { Router } from 'express';
import { AgentsController } from '../controllers/agents.controller.js';

const router = Router();

router.get('/', AgentsController.listAgents);
router.get('/investigations/:id', AgentsController.getInvestigationAgentLogs);

export default router;
