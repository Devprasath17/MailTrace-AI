import { AgentContext, AgentResult, InvestigationAgentState } from '../core/agent.types.js';
import { AgentRegistry } from '../core/agent-registry.js';
import { EmailForensicsAgent } from '../email-forensics/email-forensics.agent.js';
import { ThreatIntelligenceAgent } from '../threat-intelligence/threat-intelligence.agent.js';
import { NetworkIntelligenceAgent } from '../network-intelligence/network-intelligence.agent.js';
import { IOCCorrelationAgent } from '../ioc-correlation/ioc-correlation.agent.js';
import { DeterministicRiskAgent } from '../risk-analysis/risk-analysis.agent.js';
import { AIInvestigationAgent } from '../ai-investigation/ai-investigation.agent.js';
import { EvidenceIntegrityAgent } from '../evidence/evidence.agent.js';
import { ForensicReportAgent } from '../report/report.agent.js';

export class InvestigationOrchestratorAgent {
  public readonly name = 'Investigation Orchestrator Agent';
  private registry: AgentRegistry;

  constructor() {
    this.registry = AgentRegistry.getInstance();
  }

  public async runInvestigation(context: AgentContext): Promise<InvestigationAgentState> {
    const startedAt = new Date().toISOString();

    const state: InvestigationAgentState = {
      investigationId: context.investigationId,
      caseNumber: context.caseNumber,
      organizationId: context.organizationId,
      userId: context.userId,
      rawEmail: context.rawEmailContent,
      agentLogs: [],
      completedAgents: [],
      errors: [],
      startedAt,
      updatedAt: startedAt
    };

    // Phase 1: Evidence Integrity & Email Forensics in parallel
    const evidenceAgent = this.registry.getAgent<EvidenceIntegrityAgent>('Evidence Integrity Agent');
    const forensicsAgent = this.registry.getAgent<EmailForensicsAgent>('Email Forensics Agent');

    const phase1Promises = [];
    if (evidenceAgent) phase1Promises.push(evidenceAgent.execute(context.rawEmailContent, context));
    if (forensicsAgent) phase1Promises.push(forensicsAgent.execute(context.rawEmailContent, context));

    const phase1Results = await Promise.allSettled(phase1Promises);

    for (const res of phase1Results) {
      if (res.status === 'fulfilled') {
        const agentRes: AgentResult = res.value;
        if (agentRes.agent === 'Evidence Integrity Agent' && agentRes.data) {
          state.evidence = agentRes.data;
          state.completedAgents.push(agentRes.agent);
        } else if (agentRes.agent === 'Email Forensics Agent' && agentRes.data) {
          state.forensics = agentRes.data;
          state.completedAgents.push(agentRes.agent);
        }
        if (agentRes.errors) {
          state.errors.push(...agentRes.errors);
        }
      }
    }

    if (!state.forensics) {
      state.updatedAt = new Date().toISOString();
      return state;
    }

    // Phase 2: Threat Intelligence & Network Intelligence in parallel
    const threatAgent = this.registry.getAgent<ThreatIntelligenceAgent>('Threat Intelligence Agent');
    const networkAgent = this.registry.getAgent<NetworkIntelligenceAgent>('Network Intelligence Agent');

    const phase2Promises = [];
    if (threatAgent) phase2Promises.push(threatAgent.execute(state.forensics, context));
    if (networkAgent) phase2Promises.push(networkAgent.execute(state.forensics, context));

    const phase2Results = await Promise.allSettled(phase2Promises);

    for (const res of phase2Results) {
      if (res.status === 'fulfilled') {
        const agentRes: AgentResult = res.value;
        if (agentRes.agent === 'Threat Intelligence Agent') {
          if (agentRes.data) state.threatIntel = agentRes.data;
          state.completedAgents.push(agentRes.agent);
        } else if (agentRes.agent === 'Network Intelligence Agent') {
          if (agentRes.data) state.networkIntel = agentRes.data;
          state.completedAgents.push(agentRes.agent);
        }
        if (agentRes.errors) {
          state.errors.push(...agentRes.errors);
        }
      }
    }

    // Phase 3: Deterministic Risk Scoring
    const riskAgent = this.registry.getAgent<DeterministicRiskAgent>('Deterministic Risk Scoring Agent');
    if (riskAgent) {
      try {
        const riskRes = await riskAgent.execute({
          forensics: state.forensics,
          intelResults: state.threatIntel?.results || []
        }, context);
        if (riskRes.data) state.riskAnalysis = riskRes.data;
        state.completedAgents.push(riskAgent.name);
        if (riskRes.errors) state.errors.push(...riskRes.errors);
      } catch (err: any) {
        state.errors.push({ agent: riskAgent.name, code: 'RISK_AGENT_EXEC_FAIL', message: err?.message || 'Risk calculation failed' });
      }
    }

    // Phase 4: AI Threat Explanation (with Prompt Injection Defense)
    const aiAgent = this.registry.getAgent<AIInvestigationAgent>('AI Investigation Agent');
    if (aiAgent) {
      try {
        const aiRes = await aiAgent.execute({
          forensics: state.forensics,
          riskAnalysis: state.riskAnalysis,
          threatIntel: state.threatIntel?.results || []
        }, context);
        if (aiRes.data) state.aiAssessment = aiRes.data;
        state.completedAgents.push(aiAgent.name);
        if (aiRes.errors) state.errors.push(...aiRes.errors);
      } catch (err: any) {
        state.errors.push({ agent: aiAgent.name, code: 'AI_AGENT_EXEC_FAIL', message: err?.message || 'AI assessment failed' });
      }
    }

    // Phase 5: IOC Correlation Topology
    const iocAgent = this.registry.getAgent<IOCCorrelationAgent>('IOC Correlation Agent');
    if (iocAgent) {
      try {
        const iocRes = await iocAgent.execute({
          forensics: state.forensics,
          threatIntel: state.threatIntel,
          networkIntel: state.networkIntel
        }, context);
        if (iocRes.data) state.correlations = iocRes.data;
        state.completedAgents.push(iocAgent.name);
        if (iocRes.errors) state.errors.push(...iocRes.errors);
      } catch (err: any) {
        state.errors.push({ agent: iocAgent.name, code: 'IOC_AGENT_EXEC_FAIL', message: err?.message || 'IOC correlation failed' });
      }
    }

    // Phase 6: Forensic Report Synthesis
    const reportAgent = this.registry.getAgent<ForensicReportAgent>('Forensic Report Agent');
    if (reportAgent) {
      try {
        const reportRes = await reportAgent.execute(state, context);
        if (reportRes.data) state.report = reportRes.data;
        state.completedAgents.push(reportAgent.name);
        if (reportRes.errors) state.errors.push(...reportRes.errors);
      } catch (err: any) {
        state.errors.push({ agent: reportAgent.name, code: 'REPORT_AGENT_EXEC_FAIL', message: err?.message || 'Report generation failed' });
      }
    }

    state.updatedAt = new Date().toISOString();
    return state;
  }
}
