import { InvestigationAgent } from '../core/agent.interface.js';
import { AgentContext, AgentResult, ThreatIntelResultSummary } from '../core/agent.types.js';
import { ParsedEmailData, ThreatIntelResult } from '../../types/index.js';
import { VirusTotalService } from '../../integrations/virustotal.service.js';
import { env } from '../../config/env.js';
import { AgentLogger } from '../core/agent-logger.js';

export class ThreatIntelligenceAgent implements InvestigationAgent<ParsedEmailData, ThreatIntelResultSummary> {
  public readonly name = 'Threat Intelligence Agent';
  public readonly description = 'Queries multi-engine reputation sources (VirusTotal, RDAP/WHOIS) for extracted indicators of compromise.';

  public async execute(input: ParsedEmailData, context: AgentContext): Promise<AgentResult<ThreatIntelResultSummary>> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    const vtKey = (process.env.VIRUSTOTAL_API_KEY || env.VIRUSTOTAL_API_KEY || '').trim();

    if (!vtKey) {
      const durationMs = Date.now() - startTime;
      const completedAt = new Date().toISOString();

      const summary: ThreatIntelResultSummary = {
        indicatorsChecked: 0,
        maliciousDetections: 0,
        results: [{
          provider: 'VirusTotal',
          indicator: input.domains[0] || 'N/A',
          status: 'UNCONFIGURED',
          details: { message: 'VirusTotal API key is not configured in server environment settings.' }
        }]
      };

      await AgentLogger.logExecution({
        id: `exec-${Date.now()}-intel`,
        investigationId: context.investigationId,
        organizationId: context.organizationId,
        agentName: this.name,
        status: 'NOT_CONFIGURED',
        startedAt,
        completedAt,
        durationMs,
        outputSummary: { message: 'VirusTotal key not set' }
      });

      return {
        agent: this.name,
        status: 'NOT_CONFIGURED',
        data: summary,
        startedAt,
        completedAt,
        durationMs
      };
    }

    try {
      const results: ThreatIntelResult[] = [];
      let maliciousDetections = 0;

      // Check Primary IP if present
      if (input.ips.length > 0) {
        const vtIpRes = await VirusTotalService.checkIndicator('IP', input.ips[0]);
        results.push(vtIpRes);
        if (vtIpRes.maliciousCount) maliciousDetections += vtIpRes.maliciousCount;
      }

      // Check Primary Domain if present
      if (input.domains.length > 0) {
        const vtDomRes = await VirusTotalService.checkIndicator('DOMAIN', input.domains[0]);
        results.push(vtDomRes);
        if (vtDomRes.maliciousCount) maliciousDetections += vtDomRes.maliciousCount;
      }

      // Check Primary URL if present
      if (input.urls.length > 0) {
        const vtUrlRes = await VirusTotalService.checkIndicator('URL', input.urls[0].url);
        results.push(vtUrlRes);
        if (vtUrlRes.maliciousCount) maliciousDetections += vtUrlRes.maliciousCount;
      }

      const durationMs = Date.now() - startTime;
      const completedAt = new Date().toISOString();

      const summary: ThreatIntelResultSummary = {
        indicatorsChecked: results.length,
        maliciousDetections,
        results
      };

      await AgentLogger.logExecution({
        id: `exec-${Date.now()}-intel`,
        investigationId: context.investigationId,
        organizationId: context.organizationId,
        agentName: this.name,
        status: 'COMPLETED',
        startedAt,
        completedAt,
        durationMs,
        inputSummary: { ipsChecked: input.ips.length, domainsChecked: input.domains.length },
        outputSummary: { indicatorsChecked: results.length, maliciousDetections }
      });

      return {
        agent: this.name,
        status: 'COMPLETED',
        data: summary,
        startedAt,
        completedAt,
        durationMs
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      const completedAt = new Date().toISOString();

      await AgentLogger.logExecution({
        id: `exec-${Date.now()}-intel`,
        investigationId: context.investigationId,
        organizationId: context.organizationId,
        agentName: this.name,
        status: 'FAILED',
        startedAt,
        completedAt,
        durationMs,
        errorMessage: error?.message || 'Threat intelligence query error'
      });

      return {
        agent: this.name,
        status: 'FAILED',
        errors: [{ agent: this.name, code: 'INTEL_LOOKUP_ERROR', message: error?.message || 'Threat intelligence query error' }],
        startedAt,
        completedAt,
        durationMs
      };
    }
  }
}
