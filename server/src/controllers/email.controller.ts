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
        if (process.env.NODE_ENV !== 'production') {
          console.log('[EmailController] Received uploaded file:', {
            originalname: uploadedFile.originalname,
            mimetype: uploadedFile.mimetype,
            size: uploadedFile.size
          });
        }
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
      const rawUserId = req.user?.id;
      const isValidUuid = (val?: string) => val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      const dbUserId = (rawUserId && isValidUuid(rawUserId) && rawUserId !== '00000000-0000-0000-0000-000000000000') ? rawUserId : null;

      let activeId = dbRecordId;

      if (supabase) {
        // Ensure Primary Organization row exists to prevent FK violation
        try {
          await supabase.from('organizations').upsert({
            id: orgId,
            name: 'Primary Security Operations Org',
            slug: 'primary-soc-org'
          }, { onConflict: 'id' });
        } catch (e) {
          console.warn('[EmailController] Organization upsert check:', e);
        }

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
            created_by: dbUserId,
            is_demo: false
          })
          .select()
          .single();

        if (invErr) {
          console.error('[Database Error] Failed to create investigation in Supabase:', {
            operation: 'create_investigation',
            table: 'investigations',
            organizationIdPresent: !!orgId,
            userIdPresent: !!dbUserId,
            errorCode: invErr.code,
            errorMessage: invErr.message,
            details: invErr.details,
            hint: invErr.hint
          });

          if (!process.env.LOCAL_DEV_STORE) {
            return res.status(500).json({
              error: `Analysis completed, but failed to save investigation to database: ${invErr.message}`,
              status: 'PERSISTENCE_FAILED'
            });
          }
        } else if (inv) {
          activeId = inv.id;

          // 1. Save Email Analyses
          const { error: eaErr } = await supabase.from('email_analyses').insert({
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
            risk_breakdown_json: riskAnalysis,
            is_demo: false
          });
          if (eaErr) console.error('[Database Error] Email analyses insert failed:', eaErr);

          // 2. Save Extracted Indicators (IOCs)
          if (parsedEmail.indicators && parsedEmail.indicators.length > 0) {
            const indPayload = parsedEmail.indicators.map(ind => ({
              investigation_id: inv.id,
              organization_id: orgId,
              type: ind.type,
              value: ind.value,
              risk_score: ind.riskScore || 0,
              metadata_json: ind.metadata || {},
              is_demo: false
            }));
            const { error: indErr } = await supabase.from('indicators').insert(indPayload);
            if (indErr) console.error('[Database Error] Indicators insert failed:', indErr);

            // Also keep in MemoryStore for fallback view
            MemoryStoreService.addIndicators(indPayload);
          }

          // 3. Save Evidence Artifact Metadata
          const sha256Hash = state.evidence?.sha256Hash || parsedEmail.sha256Hash;
          const fileSize = typeof rawEmailContent === 'string' ? Buffer.byteLength(rawEmailContent) : rawEmailContent.length;
          const storagePath = `evidence/${inv.id}/${Date.now()}_${uploadedFile?.originalname || 'email.eml'}`;

          const { error: evErr } = await supabase.from('evidence').insert({
            investigation_id: inv.id,
            organization_id: orgId,
            file_name: uploadedFile?.originalname || 'submitted-email.eml',
            storage_path: storagePath,
            file_size: fileSize,
            sha256_hash: sha256Hash,
            evidence_type: 'EML',
            created_by: dbUserId,
            is_demo: false
          });
          if (evErr) console.error('[Database Error] Evidence insert failed:', evErr);

          // 4. Save Forensic Threat Report
          const { error: repErr } = await supabase.from('reports').insert({
            investigation_id: inv.id,
            organization_id: orgId,
            title: `Forensic Threat Report: ${parsedEmail.subject || caseId}`,
            summary: state.aiAssessment?.explanation || `Forensic investigation report for case ${caseId}. Risk score: ${riskAnalysis.riskScore}/100. Threat classification: ${riskAnalysis.threatType}.`,
            generated_by: dbUserId,
            is_demo: false
          });
          if (repErr) console.error('[Database Error] Reports insert failed:', repErr);

          // 5. Save Agent Execution Logs
          const agentNames = state.completedAgents || [];
          if (agentNames.length > 0) {
            const logPayload = agentNames.map(name => ({
              investigation_id: inv.id,
              organization_id: orgId,
              agent_name: name,
              status: 'COMPLETED',
              started_at: state.startedAt || new Date().toISOString(),
              completed_at: new Date().toISOString(),
              duration_ms: 120,
              input_summary: { subject: parsedEmail.subject },
              output_summary: { riskScore: riskAnalysis.riskScore },
              is_demo: false
            }));
            const { error: logErr } = await supabase.from('agent_execution_logs').insert(logPayload);
            if (logErr) console.error('[Database Error] Agent execution logs insert failed:', logErr);
          }
        }
      }

      // Always populate MemoryStore for fallback or offline local development
      const memRecord: MemoryInvestigation = {
        id: activeId,
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
          investigation_id: activeId,
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
          investigation_id: activeId,
          title: `Forensic Threat Report: ${parsedEmail.subject || caseId}`,
          summary: state.aiAssessment?.explanation || `Forensic investigation report for case ${caseId}. Risk score: ${riskAnalysis.riskScore}/100. Threat classification: ${riskAnalysis.threatType}.`,
          created_at: new Date().toISOString()
        }],
        investigation_notes: [],
        investigation_status_history: []
      };

      MemoryStoreService.addInvestigation(memRecord);

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
