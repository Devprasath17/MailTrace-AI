import { getSupabaseAdmin } from '../../config/supabase.js';
import { AgentExecutionRecord } from './agent.types.js';
import { MemoryStoreService } from '../../services/store.service.js';

export class AgentLogger {
  private static inMemoryLogs: AgentExecutionRecord[] = [];

  public static async logExecution(record: AgentExecutionRecord): Promise<void> {
    const supabase = getSupabaseAdmin();

    this.inMemoryLogs.unshift(record);

    if (supabase) {
      try {
        await supabase.from('agent_execution_logs').insert({
          investigation_id: record.investigationId,
          organization_id: record.organizationId,
          agent_name: record.agentName,
          status: record.status,
          started_at: record.startedAt,
          completed_at: record.completedAt,
          duration_ms: record.durationMs,
          input_summary: record.inputSummary || {},
          output_summary: record.outputSummary || {},
          error_message: record.errorMessage
        });
      } catch (err: any) {
        console.warn(`[AgentLogger] Supabase execution log insert warning:`, err?.message || err);
      }
    }
  }

  public static getLogsForInvestigation(investigationId: string): AgentExecutionRecord[] {
    return this.inMemoryLogs.filter(l => l.investigationId === investigationId);
  }
}
