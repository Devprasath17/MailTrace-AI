import crypto from 'crypto';
import { InvestigationAgent } from '../core/agent.interface.js';
import { AgentContext, AgentResult, EvidenceResult } from '../core/agent.types.js';
import { AgentLogger } from '../core/agent-logger.js';

export class EvidenceIntegrityAgent implements InvestigationAgent<Buffer | string, EvidenceResult> {
  public readonly name = 'Evidence Integrity Agent';
  public readonly description = 'Calculates cryptographic SHA-256 hashes and verifies evidence chain of custody for raw EML artifacts.';

  public async execute(input: Buffer | string, context: AgentContext): Promise<AgentResult<EvidenceResult>> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    try {
      const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf-8');
      const sha256Hash = crypto.createHash('sha256').update(buffer).digest('hex');
      const fileSize = buffer.length;
      const fileName = context.fileName || `evidence-${context.caseNumber || Date.now()}.eml`;
      const storagePath = `raw_emails/${context.organizationId}/${context.investigationId}/${fileName}`;

      const evidenceData: EvidenceResult = {
        id: `ev-${context.investigationId}`,
        fileName,
        fileSize,
        sha256Hash,
        storagePath,
        preservedAt: startedAt
      };

      const durationMs = Date.now() - startTime;
      const completedAt = new Date().toISOString();

      await AgentLogger.logExecution({
        id: `exec-${Date.now()}-evidence`,
        investigationId: context.investigationId,
        organizationId: context.organizationId,
        agentName: this.name,
        status: 'COMPLETED',
        startedAt,
        completedAt,
        durationMs,
        inputSummary: { fileSize, fileName },
        outputSummary: { sha256Hash, storagePath }
      });

      return {
        agent: this.name,
        status: 'COMPLETED',
        data: evidenceData,
        startedAt,
        completedAt,
        durationMs
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      const completedAt = new Date().toISOString();

      await AgentLogger.logExecution({
        id: `exec-${Date.now()}-evidence`,
        investigationId: context.investigationId,
        organizationId: context.organizationId,
        agentName: this.name,
        status: 'FAILED',
        startedAt,
        completedAt,
        durationMs,
        errorMessage: error?.message || 'Evidence hashing failed'
      });

      return {
        agent: this.name,
        status: 'FAILED',
        errors: [{ agent: this.name, code: 'EVIDENCE_HASH_ERROR', message: error?.message || 'Evidence hashing failed' }],
        startedAt,
        completedAt,
        durationMs
      };
    }
  }
}
