import { InvestigationAgent } from '../core/agent.interface.js';
import { AgentContext, AgentResult } from '../core/agent.types.js';
import { ParsedEmailData, RiskAnalysisResult, ThreatIntelResult } from '../../types/index.js';
import { RiskEngineService } from '../../services/riskEngine.service.js';
import { AgentLogger } from '../core/agent-logger.js';

export interface DeterministicRiskInput {
  forensics: ParsedEmailData;
  intelResults?: ThreatIntelResult[];
}

export class DeterministicRiskAgent implements InvestigationAgent<DeterministicRiskInput, RiskAnalysisResult> {
  public readonly name = 'Deterministic Risk Scoring Agent';
  public readonly description = 'Computes rule-based, explainable 0-100 risk score and categorizes threat severity based on header signals and intel findings.';

  public async execute(input: DeterministicRiskInput, context: AgentContext): Promise<AgentResult<RiskAnalysisResult>> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    try {
      const riskResult = RiskEngineService.calculateRisk(input.forensics, input.intelResults || []);
      const durationMs = Date.now() - startTime;
      const completedAt = new Date().toISOString();

      await AgentLogger.logExecution({
        id: `exec-${Date.now()}-risk`,
        investigationId: context.investigationId,
        organizationId: context.organizationId,
        agentName: this.name,
        status: 'COMPLETED',
        startedAt,
        completedAt,
        durationMs,
        inputSummary: { spf: input.forensics.spfStatus, dmarc: input.forensics.dmarcStatus },
        outputSummary: { riskScore: riskResult.riskScore, severity: riskResult.severity, threatType: riskResult.threatType, signalsCount: riskResult.signals.length }
      });

      return {
        agent: this.name,
        status: 'COMPLETED',
        data: riskResult,
        startedAt,
        completedAt,
        durationMs
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      const completedAt = new Date().toISOString();

      await AgentLogger.logExecution({
        id: `exec-${Date.now()}-risk`,
        investigationId: context.investigationId,
        organizationId: context.organizationId,
        agentName: this.name,
        status: 'FAILED',
        startedAt,
        completedAt,
        durationMs,
        errorMessage: error?.message || 'Risk engine calculation error'
      });

      return {
        agent: this.name,
        status: 'FAILED',
        errors: [{ agent: this.name, code: 'RISK_CALCULATION_ERROR', message: error?.message || 'Risk engine calculation error' }],
        startedAt,
        completedAt,
        durationMs
      };
    }
  }
}
