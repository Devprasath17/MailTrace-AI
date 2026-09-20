import { InvestigationAgent } from '../core/agent.interface.js';
import { AgentContext, AgentResult, InvestigationAgentState, ReportResult } from '../core/agent.types.js';
import { AgentLogger } from '../core/agent-logger.js';

export class ForensicReportAgent implements InvestigationAgent<InvestigationAgentState, ReportResult> {
  public readonly name = 'Forensic Report Agent';
  public readonly description = 'Synthesizes executive summary, structured forensic findings, timeline analysis, and remediation advisories.';

  public async execute(state: InvestigationAgentState, context: AgentContext): Promise<AgentResult<ReportResult>> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    try {
      const caseRef = state.caseNumber || `MT-${Date.now().toString().slice(-6)}`;
      const score = state.riskAnalysis?.riskScore ?? 0;
      const level = state.riskAnalysis?.severity || 'LOW';
      const attackType = state.aiAssessment?.attackType || 'Unclassified Email Threat';
      
      const executiveSummary = `Investigation ${caseRef} completed with deterministic risk score ${score}/100 (${level}). ` +
        `Primary threat classification: ${attackType}. ` +
        `Extracted ${state.forensics?.urls.length || 0} URL(s) and ${state.forensics?.ips.length || 0} IP(s). ` +
        `Authentication status: SPF=${state.forensics?.spfStatus || 'UNKNOWN'}, DKIM=${state.forensics?.dkimStatus || 'UNKNOWN'}, DMARC=${state.forensics?.dmarcStatus || 'UNKNOWN'}.`;

      const reportResult: ReportResult = {
        reportId: `rep-${state.investigationId}`,
        generatedAt: startedAt,
        executiveSummary,
        caseRef
      };

      const durationMs = Date.now() - startTime;
      const completedAt = new Date().toISOString();

      await AgentLogger.logExecution({
        id: `exec-${Date.now()}-report`,
        investigationId: context.investigationId,
        organizationId: context.organizationId,
        agentName: this.name,
        status: 'COMPLETED',
        startedAt,
        completedAt,
        durationMs,
        inputSummary: { completedAgentsCount: state.completedAgents.length },
        outputSummary: { caseRef, riskScore: score, threatLevel: level }
      });

      return {
        agent: this.name,
        status: 'COMPLETED',
        data: reportResult,
        startedAt,
        completedAt,
        durationMs
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      const completedAt = new Date().toISOString();

      await AgentLogger.logExecution({
        id: `exec-${Date.now()}-report`,
        investigationId: context.investigationId,
        organizationId: context.organizationId,
        agentName: this.name,
        status: 'FAILED',
        startedAt,
        completedAt,
        durationMs,
        errorMessage: error?.message || 'Report synthesis failed'
      });

      return {
        agent: this.name,
        status: 'FAILED',
        errors: [{ agent: this.name, code: 'REPORT_SYNTHESIS_ERROR', message: error?.message || 'Report synthesis failed' }],
        startedAt,
        completedAt,
        durationMs
      };
    }
  }
}
