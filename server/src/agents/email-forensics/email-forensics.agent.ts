import { InvestigationAgent } from '../core/agent.interface.js';
import { AgentContext, AgentResult } from '../core/agent.types.js';
import { EmailParserService } from '../../services/emailParser.service.js';
import { ParsedEmailData } from '../../types/index.js';
import { AgentLogger } from '../core/agent-logger.js';

export class EmailForensicsAgent implements InvestigationAgent<Buffer | string, ParsedEmailData> {
  public readonly name = 'Email Forensics Agent';
  public readonly description = 'Parses raw MIME/EML headers, extracts authentication signals (SPF, DKIM, DMARC), and builds routing timelines.';

  public async execute(input: Buffer | string, context: AgentContext): Promise<AgentResult<ParsedEmailData>> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    try {
      const parsedData = await EmailParserService.parseEmail(input);
      const durationMs = Date.now() - startTime;
      const completedAt = new Date().toISOString();

      const result: AgentResult<ParsedEmailData> = {
        agent: this.name,
        status: 'COMPLETED',
        data: parsedData,
        startedAt,
        completedAt,
        durationMs
      };

      await AgentLogger.logExecution({
        id: `exec-${Date.now()}-forensics`,
        investigationId: context.investigationId,
        organizationId: context.organizationId,
        agentName: this.name,
        status: 'COMPLETED',
        startedAt,
        completedAt,
        durationMs,
        inputSummary: { subject: parsedData.subject, sizeBytes: Buffer.isBuffer(input) ? input.length : Buffer.byteLength(input) },
        outputSummary: { 
          from: parsedData.fromAddress, 
          spf: parsedData.spfStatus, 
          dkim: parsedData.dkimStatus, 
          dmarc: parsedData.dmarcStatus,
          urlsFound: parsedData.urls.length,
          ipsFound: parsedData.ips.length
        }
      });

      return result;
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      const completedAt = new Date().toISOString();

      const result: AgentResult<ParsedEmailData> = {
        agent: this.name,
        status: 'FAILED',
        errors: [{ agent: this.name, code: 'PARSER_ERROR', message: error?.message || 'Failed to parse EML headers' }],
        startedAt,
        completedAt,
        durationMs
      };

      await AgentLogger.logExecution({
        id: `exec-${Date.now()}-forensics`,
        investigationId: context.investigationId,
        organizationId: context.organizationId,
        agentName: this.name,
        status: 'FAILED',
        startedAt,
        completedAt,
        durationMs,
        errorMessage: error?.message || 'Failed to parse email'
      });

      return result;
    }
  }
}
