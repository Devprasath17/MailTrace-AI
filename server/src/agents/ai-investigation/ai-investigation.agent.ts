import { InvestigationAgent } from '../core/agent.interface.js';
import { AgentContext, AgentResult } from '../core/agent.types.js';
import { ParsedEmailData, AIAnalysisResult, RiskAnalysisResult, ThreatIntelResult } from '../../types/index.js';
import { GeminiService } from '../../integrations/gemini.service.js';
import { AgentLogger } from '../core/agent-logger.js';

export interface AIInvestigationInput {
  forensics: ParsedEmailData;
  riskAnalysis?: RiskAnalysisResult;
  threatIntel?: ThreatIntelResult[];
}

export class AIInvestigationAgent implements InvestigationAgent<AIInvestigationInput, AIAnalysisResult> {
  public readonly name = 'AI Investigation Agent';
  public readonly description = 'Leverages LLM reasoning to explain threats, assess attacker intent, and detect phishing techniques with prompt injection defense.';

  public async execute(input: AIInvestigationInput, context: AgentContext): Promise<AgentResult<AIAnalysisResult>> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    try {
      const riskSignals = input.riskAnalysis?.signals || [];

      // Prompt injection defense: sanitize raw body text sample
      const safeBody = (input.forensics.bodyPlain || '')
        .slice(0, 1500)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/system:\s*/gi, 'untrusted_text: ');

      // Use copied/wrapped input with defensive boundary for Gemini
      const sanitizedForensics: ParsedEmailData = {
        ...input.forensics,
        bodyPlain: `<untrusted_email_body_evidence>\n${safeBody}\n</untrusted_email_body_evidence>`
      };

      const aiResponse = await GeminiService.analyzeEmail(sanitizedForensics, riskSignals);
      const durationMs = Date.now() - startTime;
      const completedAt = new Date().toISOString();

      if (aiResponse.status === 'UNCONFIGURED') {
        await AgentLogger.logExecution({
          id: `exec-${Date.now()}-ai`,
          investigationId: context.investigationId,
          organizationId: context.organizationId,
          agentName: this.name,
          status: 'NOT_CONFIGURED',
          startedAt,
          completedAt,
          durationMs,
          outputSummary: { message: 'Gemini API key is not configured.' }
        });

        return {
          agent: this.name,
          status: 'NOT_CONFIGURED',
          data: aiResponse.result,
          startedAt,
          completedAt,
          durationMs
        };
      }

      if (aiResponse.status === 'ERROR') {
        await AgentLogger.logExecution({
          id: `exec-${Date.now()}-ai`,
          investigationId: context.investigationId,
          organizationId: context.organizationId,
          agentName: this.name,
          status: 'FAILED',
          startedAt,
          completedAt,
          durationMs,
          errorMessage: aiResponse.result?.explanation || 'AI analysis error'
        });

        return {
          agent: this.name,
          status: 'FAILED',
          data: aiResponse.result,
          errors: [{ agent: this.name, code: 'AI_MODEL_ERROR', message: aiResponse.result?.explanation || 'AI analysis error' }],
          startedAt,
          completedAt,
          durationMs
        };
      }

      await AgentLogger.logExecution({
        id: `exec-${Date.now()}-ai`,
        investigationId: context.investigationId,
        organizationId: context.organizationId,
        agentName: this.name,
        status: 'COMPLETED',
        startedAt,
        completedAt,
        durationMs,
        inputSummary: { subject: input.forensics.subject },
        outputSummary: { 
          classification: aiResponse.result?.classification, 
          attackType: aiResponse.result?.attackType,
          confidence: aiResponse.result?.confidence
        }
      });

      return {
        agent: this.name,
        status: 'COMPLETED',
        data: aiResponse.result,
        startedAt,
        completedAt,
        durationMs
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      const completedAt = new Date().toISOString();

      await AgentLogger.logExecution({
        id: `exec-${Date.now()}-ai`,
        investigationId: context.investigationId,
        organizationId: context.organizationId,
        agentName: this.name,
        status: 'FAILED',
        startedAt,
        completedAt,
        durationMs,
        errorMessage: error?.message || 'AI Investigation agent failed'
      });

      return {
        agent: this.name,
        status: 'FAILED',
        errors: [{ agent: this.name, code: 'AI_AGENT_EXCEPTION', message: error?.message || 'AI Investigation agent failed' }],
        startedAt,
        completedAt,
        durationMs
      };
    }
  }
}
