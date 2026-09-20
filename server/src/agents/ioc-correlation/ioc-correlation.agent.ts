import { InvestigationAgent } from '../core/agent.interface.js';
import { AgentContext, AgentResult, CorrelationResult, ThreatIntelResultSummary, NetworkIntelResultSummary } from '../core/agent.types.js';
import { ParsedEmailData } from '../../types/index.js';
import { AgentLogger } from '../core/agent-logger.js';

export interface IOCCorrelationInput {
  forensics?: ParsedEmailData;
  threatIntel?: ThreatIntelResultSummary;
  networkIntel?: NetworkIntelResultSummary;
}

export class IOCCorrelationAgent implements InvestigationAgent<IOCCorrelationInput, CorrelationResult> {
  public readonly name = 'IOC Correlation Agent';
  public readonly description = 'Correlates observed indicators (sender, IPs, URLs, attachments) into a visual graph topology.';

  public async execute(input: IOCCorrelationInput, context: AgentContext): Promise<AgentResult<CorrelationResult>> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    try {
      const nodes: any[] = [];
      const edges: any[] = [];
      const forensics = input.forensics;

      const emailId = `email-${context.investigationId}`;
      
      nodes.push({
        id: emailId,
        type: 'emailNode',
        position: { x: 300, y: 50 },
        data: {
          label: context.caseNumber || 'EMAIL EVIDENCE',
          subject: forensics?.subject || 'Email Subject',
          fromAddress: forensics?.fromAddress || 'Unknown Sender'
        }
      });

      if (forensics?.fromAddress) {
        const senderId = `sender-${forensics.fromAddress}`;
        nodes.push({
          id: senderId,
          type: 'senderNode',
          position: { x: 100, y: 180 },
          data: { label: forensics.fromAddress, type: 'Sender' }
        });
        edges.push({ id: `e-${emailId}-${senderId}`, source: emailId, target: senderId, animated: true });
      }

      let yOffset = 180;
      let nodeIdx = 0;

      // Correlate IPs
      if (forensics?.ips && forensics.ips.length > 0) {
        forensics.ips.slice(0, 5).forEach((ip) => {
          const ipNodeId = `ip-${ip}`;
          const xPos = 150 + (nodeIdx % 3) * 220;
          const currentY = yOffset + Math.floor(nodeIdx / 3) * 120;
          nodeIdx++;

          const geoData = input.networkIntel?.results.find(r => r.indicator === ip)?.details;

          nodes.push({
            id: ipNodeId,
            type: 'indicatorNode',
            position: { x: xPos, y: currentY },
            data: {
              label: ip,
              indicatorType: 'IP',
              details: geoData ? `${geoData.country || ''} ${geoData.city || ''}`.trim() : 'IP Address'
            }
          });
          edges.push({ id: `e-${emailId}-${ipNodeId}`, source: emailId, target: ipNodeId });
        });
      }

      // Correlate URLs & Domains
      if (forensics?.urls && forensics.urls.length > 0) {
        forensics.urls.slice(0, 5).forEach((urlObj) => {
          const urlNodeId = `url-${Buffer.from(urlObj.url).toString('hex').slice(0, 10)}`;
          const xPos = 150 + (nodeIdx % 3) * 220;
          const currentY = yOffset + Math.floor(nodeIdx / 3) * 120;
          nodeIdx++;

          const vtData = input.threatIntel?.results.find(r => r.indicator === urlObj.url)?.details;

          nodes.push({
            id: urlNodeId,
            type: 'indicatorNode',
            position: { x: xPos, y: currentY },
            data: {
              label: urlObj.domain || urlObj.url.slice(0, 30),
              indicatorType: 'URL',
              riskScore: vtData?.maliciousCount ? vtData.maliciousCount * 10 : 0
            }
          });
          edges.push({ id: `e-${emailId}-${urlNodeId}`, source: emailId, target: urlNodeId });
        });
      }

      // Correlate Extracted Indicators (Email/Domain)
      if (forensics?.indicators && forensics.indicators.length > 0) {
        forensics.indicators.forEach((ind, i) => {
          const indNodeId = `ind-${ind.type}-${i}`;
          const xPos = 150 + (nodeIdx % 3) * 220;
          const currentY = yOffset + Math.floor(nodeIdx / 3) * 120;
          nodeIdx++;

          nodes.push({
            id: indNodeId,
            type: 'indicatorNode',
            position: { x: xPos, y: currentY },
            data: {
              label: ind.value,
              indicatorType: ind.type,
              riskScore: ind.riskScore
            }
          });
          edges.push({ id: `e-${emailId}-${indNodeId}`, source: emailId, target: indNodeId });
        });
      }

      const durationMs = Date.now() - startTime;
      const completedAt = new Date().toISOString();

      const correlationResult: CorrelationResult = {
        nodesCount: nodes.length,
        edgesCount: edges.length,
        nodes,
        edges
      };

      await AgentLogger.logExecution({
        id: `exec-${Date.now()}-ioc`,
        investigationId: context.investigationId,
        organizationId: context.organizationId,
        agentName: this.name,
        status: 'COMPLETED',
        startedAt,
        completedAt,
        durationMs,
        inputSummary: { ips: forensics?.ips?.length || 0, urls: forensics?.urls?.length || 0 },
        outputSummary: { nodesCount: nodes.length, edgesCount: edges.length }
      });

      return {
        agent: this.name,
        status: 'COMPLETED',
        data: correlationResult,
        startedAt,
        completedAt,
        durationMs
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      const completedAt = new Date().toISOString();

      await AgentLogger.logExecution({
        id: `exec-${Date.now()}-ioc`,
        investigationId: context.investigationId,
        organizationId: context.organizationId,
        agentName: this.name,
        status: 'FAILED',
        startedAt,
        completedAt,
        durationMs,
        errorMessage: error?.message || 'IOC correlation failed'
      });

      return {
        agent: this.name,
        status: 'FAILED',
        errors: [{ agent: this.name, code: 'CORRELATION_ERROR', message: error?.message || 'IOC correlation failed' }],
        startedAt,
        completedAt,
        durationMs
      };
    }
  }
}
