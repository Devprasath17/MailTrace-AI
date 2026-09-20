import { Request, Response } from 'express';
import { AgentRegistry } from '../agents/core/agent-registry.js';
import { AgentLogger } from '../agents/core/agent-logger.js';
import { getSupabaseAdmin } from '../config/supabase.js';

export class AgentsController {
  public static async listAgents(req: Request, res: Response) {
    try {
      const registry = AgentRegistry.getInstance();
      const agents = registry.getAllAgents().map(a => ({
        name: a.name,
        description: a.description
      }));

      return res.status(200).json({ agents });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to list agents. ' + (error?.message || '') });
    }
  }

  public static async getInvestigationAgentLogs(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Investigation ID is required' });
      }

      const supabase = getSupabaseAdmin();
      let logs: any[] = [];

      if (supabase) {
        const { data, error } = await supabase
          .from('agent_execution_logs')
          .select('*')
          .eq('investigation_id', id)
          .order('started_at', { ascending: true });

        if (!error && data) {
          logs = data.map(d => ({
            id: d.id,
            investigationId: d.investigation_id,
            organizationId: d.organization_id,
            agentName: d.agent_name,
            status: d.status,
            startedAt: d.started_at,
            completedAt: d.completed_at,
            durationMs: d.duration_ms,
            inputSummary: d.input_summary,
            outputSummary: d.output_summary,
            errorMessage: d.error_message
          }));
        }
      }

      if (logs.length === 0) {
        logs = AgentLogger.getLogsForInvestigation(id);
      }

      return res.status(200).json({ investigationId: id, logs });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch agent execution logs. ' + (error?.message || '') });
    }
  }
}
