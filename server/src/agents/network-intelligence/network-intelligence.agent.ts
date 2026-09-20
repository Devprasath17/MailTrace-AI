import { InvestigationAgent } from '../core/agent.interface.js';
import { AgentContext, AgentResult, NetworkIntelResultSummary } from '../core/agent.types.js';
import { ParsedEmailData, ThreatIntelResult } from '../../types/index.js';
import { GeoIPService } from '../../integrations/geoip.service.js';
import { EmailParserService } from '../../services/emailParser.service.js';
import { AgentLogger } from '../core/agent-logger.js';

export class NetworkIntelligenceAgent implements InvestigationAgent<ParsedEmailData, NetworkIntelResultSummary> {
  public readonly name = 'Network Intelligence Agent';
  public readonly description = 'Analyzes sending IP addresses, network ASN routes, and observed geographic origins.';

  public async execute(input: ParsedEmailData, context: AgentContext): Promise<AgentResult<NetworkIntelResultSummary>> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    try {
      const results: ThreatIntelResult[] = [];
      let publicIpsCount = 0;
      let privateIpsCount = 0;

      for (const ip of input.ips.slice(0, 5)) {
        if (EmailParserService.isPrivateIp(ip)) {
          privateIpsCount++;
          results.push({
            provider: 'IP_Geolocation',
            indicator: ip,
            status: 'FOUND',
            details: {
              isPrivate: true,
              label: 'PUBLIC_GEOLOCATION_UNAVAILABLE (Private/local IP range)',
              country: 'Internal Network',
              city: 'Local Host'
            }
          });
        } else {
          publicIpsCount++;
          const geoRes = await GeoIPService.geolocateIp(ip);
          results.push(geoRes);
        }
      }

      const durationMs = Date.now() - startTime;
      const completedAt = new Date().toISOString();

      const summary: NetworkIntelResultSummary = {
        publicIpsCount,
        privateIpsCount,
        results
      };

      await AgentLogger.logExecution({
        id: `exec-${Date.now()}-network`,
        investigationId: context.investigationId,
        organizationId: context.organizationId,
        agentName: this.name,
        status: 'COMPLETED',
        startedAt,
        completedAt,
        durationMs,
        inputSummary: { ipsAnalyzed: input.ips.length },
        outputSummary: { publicIpsCount, privateIpsCount }
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
        id: `exec-${Date.now()}-network`,
        investigationId: context.investigationId,
        organizationId: context.organizationId,
        agentName: this.name,
        status: 'FAILED',
        startedAt,
        completedAt,
        durationMs,
        errorMessage: error?.message || 'Network intelligence query failed'
      });

      return {
        agent: this.name,
        status: 'FAILED',
        errors: [{ agent: this.name, code: 'NETWORK_GEO_ERROR', message: error?.message || 'Network intelligence query failed' }],
        startedAt,
        completedAt,
        durationMs
      };
    }
  }
}
