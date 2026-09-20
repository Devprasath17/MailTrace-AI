import { InvestigationAgent } from './agent.interface.js';
import { EmailForensicsAgent } from '../email-forensics/email-forensics.agent.js';
import { ThreatIntelligenceAgent } from '../threat-intelligence/threat-intelligence.agent.js';
import { NetworkIntelligenceAgent } from '../network-intelligence/network-intelligence.agent.js';
import { IOCCorrelationAgent } from '../ioc-correlation/ioc-correlation.agent.js';
import { DeterministicRiskAgent } from '../risk-analysis/risk-analysis.agent.js';
import { AIInvestigationAgent } from '../ai-investigation/ai-investigation.agent.js';
import { EvidenceIntegrityAgent } from '../evidence/evidence.agent.js';
import { ForensicReportAgent } from '../report/report.agent.js';

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, InvestigationAgent<any, any>> = new Map();

  private constructor() {
    this.registerDefaultAgents();
  }

  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  private registerDefaultAgents(): void {
    this.register(new EmailForensicsAgent());
    this.register(new ThreatIntelligenceAgent());
    this.register(new NetworkIntelligenceAgent());
    this.register(new IOCCorrelationAgent());
    this.register(new DeterministicRiskAgent());
    this.register(new AIInvestigationAgent());
    this.register(new EvidenceIntegrityAgent());
    this.register(new ForensicReportAgent());
  }

  public register(agent: InvestigationAgent<any, any>): void {
    this.agents.set(agent.name, agent);
  }

  public getAgent<T extends InvestigationAgent<any, any>>(name: string): T | undefined {
    return this.agents.get(name) as T | undefined;
  }

  public getAllAgents(): InvestigationAgent<any, any>[] {
    return Array.from(this.agents.values());
  }
}
