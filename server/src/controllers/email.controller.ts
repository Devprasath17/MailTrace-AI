import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { InvestigationOrchestratorAgent } from '../agents/orchestrator/orchestrator.agent.js';
import { AgentContext } from '../agents/core/agent.types.js';
import { getSupabaseAdmin } from '../config/supabase.js';
import { MemoryStoreService, MemoryInvestigation } from '../services/store.service.js';

export class EmailController {
  public static async analyzeEmail(req: AuthenticatedRequest, res: Response) {
    try {
      let rawEmailContent: Buffer | string = '';
      const uploadedFile = req.file || (req.files && Array.isArray(req.files) && req.files.length > 0 ? (req.files as any[])[0] : null);

      if (uploadedFile && uploadedFile.buffer) {
        rawEmailContent = uploadedFile.buffer;
      } else if (req.body?.rawHeaders || req.body?.rawEmail || req.body?.emlContent || req.body?.content) {
        rawEmailContent = req.body.rawEmail || req.body.rawHeaders || req.body.emlContent || req.body.content;
      } else if (typeof req.body === 'string' && req.body.trim().length > 0) {
        rawEmailContent = req.body;
      } else {
        return res.status(400).json({ error: 'No email content provided. Please upload an .eml file or paste raw email headers.' });
      }

      const dbRecordId = `inv-${Date.now()}`;
      const caseId = `MT-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const orgId = req.user?.organizationId || '00000000-0000-0000-0000-000000000001';
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';

      const context: AgentContext = {
        investigationId: dbRecordId,
        caseNumber: caseId,
        organizationId: orgId,
        userId,
        rawEmailContent,
        fileName: uploadedFile?.originalname || 'submitted-email.eml'
      };

      // Run Multi-Agent Investigation Workflow
      const orchestrator = new InvestigationOrchestratorAgent();
      const state = await orchestrator.runInvestigation(context);

      const parsedEmail = state.forensics;
      if (!parsedEmail) {
        const errorDetail = state.errors.map(e => e.message).join('; ') || 'Multi-agent email forensics analysis failed to extract headers.';
        return res.status(400).json({ error: `Email analysis failed: ${errorDetail}` });
      }

      const riskAnalysis = state.riskAnalysis || {
        overallScore: 0,
        riskScore: 0,
        severity: 'LOW',
        threatLevel: 'INFO',
        threatType: 'UNKNOWN',
        signals: []
      };

      // Save to Supabase PostgreSQL if available
      const supabase = getSupabaseAdmin();
      let activeId = dbRecordId;

      if (supabase) {
        const { data: inv, error: invErr } = await supabase
          .from('investigations')
          .insert({
            case_number: caseId,
            organization_id: orgId,
            title: parsedEmail.subject || 'Suspicious Email Investigation',
            status: 'OPEN',
            severity: riskAnalysis.severity,
            threat_type: riskAnalysis.threatType,
            risk_score: riskAnalysis.riskScore,
            created_by: userId
          })
          .select()
          .single();

        if (!invErr && inv) {
          activeId = inv.id;

          await supabase.from('email_analyses').insert({
            investigation_id: inv.id,
            organization_id: orgId,
            sender_address: parsedEmail.fromAddress,
            reply_to: parsedEmail.replyTo,
            return_path: parsedEmail.returnPath,
            subject: parsedEmail.subject,
            date: parsedEmail.date ? new Date(parsedEmail.date).toISOString() : null,
            message_id: parsedEmail.messageId,
            spf_status: parsedEmail.spfStatus,
            dkim_status: parsedEmail.dkimStatus,
            dmarc_status: parsedEmail.dmarcStatus,
            raw_headers: parsedEmail.rawHeaders,
            body_plain: parsedEmail.bodyPlain,
            body_html: parsedEmail.bodyHtml,
            ai_analysis_json: state.aiAssessment || {},
            risk_breakdown_json: riskAnalysis
          });

          await supabase.from('reports').insert({
            investigation_id: inv.id,
            organization_id: orgId,
            title: `Forensic Threat Report: ${parsedEmail.subject || caseId}`,
            summary: state.aiAssessment?.explanation || `Forensic investigation report for case ${caseId}. Risk score: ${riskAnalysis.riskScore}/100. Threat classification: ${riskAnalysis.threatType}.`,
            generated_by: userId
          });
        }
      }

      // Memory Store Fallback
      if (activeId === dbRecordId) {
        const memRecord: MemoryInvestigation = {
          id: dbRecordId,
          case_number: caseId,
          organization_id: orgId,
          title: parsedEmail.subject || 'Suspicious Email Investigation',
          status: 'OPEN',
          severity: riskAnalysis.severity,
          threat_type: riskAnalysis.threatType,
          risk_score: riskAnalysis.riskScore,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email_analyses: [{
            id: 'ea-' + Date.now(),
            investigation_id: dbRecordId,
            sender_address: parsedEmail.fromAddress,
            reply_to: parsedEmail.replyTo,
            return_path: parsedEmail.returnPath,
            subject: parsedEmail.subject,
            spf_status: parsedEmail.spfStatus,
            dkim_status: parsedEmail.dkimStatus,
            dmarc_status: parsedEmail.dmarcStatus,
            raw_headers: parsedEmail.rawHeaders,
            body_plain: parsedEmail.bodyPlain,
            ai_analysis_json: state.aiAssessment || {},
            risk_breakdown_json: riskAnalysis
          }],
          indicators: parsedEmail.indicators.map((ind, i) => ({
            id: `ind-${Date.now()}-${i}`,
            type: ind.type,
            value: ind.value,
            risk_score: ind.riskScore,
            created_at: new Date().toISOString()
          })),
          evidence: [{
            id: 'ev-' + Date.now(),
            file_name: uploadedFile?.originalname || 'submitted-email.eml',
            file_size: typeof rawEmailContent === 'string' ? Buffer.byteLength(rawEmailContent) : rawEmailContent.length,
            sha256_hash: state.evidence?.sha256Hash || parsedEmail.sha256Hash,
            created_at: new Date().toISOString()
          }],
          reports: [{
            id: 'rep-' + Date.now(),
            investigation_id: dbRecordId,
            title: `Forensic Threat Report: ${parsedEmail.subject || caseId}`,
            summary: state.aiAssessment?.explanation || `Forensic investigation report for case ${caseId}. Risk score: ${riskAnalysis.riskScore}/100. Threat classification: ${riskAnalysis.threatType}.`,
            created_at: new Date().toISOString()
          }],
          investigation_notes: [],
          investigation_status_history: []
        };

        MemoryStoreService.addInvestigation(memRecord);
      }

      return res.status(200).json({
        investigationId: activeId,
        caseNumber: caseId,
        parsedEmail,
        riskAnalysis,
        aiAnalysis: {
          status: state.aiAssessment ? 'SUCCESS' : 'UNCONFIGURED',
          result: state.aiAssessment
        },
        threatIntelligence: state.threatIntel?.results || [],
        correlations: state.correlations,
        completedAgents: state.completedAgents
      });
    } catch (error: any) {
      console.error('Email Analysis Multi-Agent Controller Error:', error);
      return res.status(500).json({ error: 'Failed to analyze email content. ' + (error?.message || '') });
    }
  }
}
