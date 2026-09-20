import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getSupabaseAdmin } from '../config/supabase.js';
import { MemoryStoreService } from '../services/store.service.js';

export class InvestigationsController {
  public static async listInvestigations(req: AuthenticatedRequest, res: Response) {
    try {
      const supabase = getSupabaseAdmin();
      const orgId = req.user?.organizationId || '00000000-0000-0000-0000-000000000001';

      if (!supabase) {
        let list = MemoryStoreService.getInvestigations(orgId);
        const { status, severity, search } = req.query;

        if (status && status !== 'ALL') {
          list = list.filter(i => i.status === status);
        }
        if (severity && severity !== 'ALL') {
          list = list.filter(i => i.severity === severity);
        }
        if (search) {
          const s = String(search).toLowerCase();
          list = list.filter(i => i.title.toLowerCase().includes(s) || i.case_number.toLowerCase().includes(s));
        }

        return res.status(200).json({ data: list, total: list.length });
      }

      const { status, severity, search } = req.query;

      let query = supabase
        .from('investigations')
        .select('*', { count: 'exact' })
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (status && status !== 'ALL') {
        query = query.eq('status', String(status));
      }

      if (severity && severity !== 'ALL') {
        query = query.eq('severity', String(severity));
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,case_number.ilike.%${search}%`);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      return res.status(200).json({ data: data || [], total: count || 0 });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve investigations. ' + (err?.message || '') });
    }
  }

  public static async getInvestigationById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const supabase = getSupabaseAdmin();
      const orgId = req.user?.organizationId || '00000000-0000-0000-0000-000000000001';


      if (!supabase) {
        const memInv = MemoryStoreService.getInvestigationById(id);
        if (!memInv) {
          return res.status(404).json({ error: 'Investigation record not found.' });
        }
        return res.status(200).json({ data: memInv });
      }

      const { data: inv, error } = await supabase
        .from('investigations')
        .select(`
          *,
          email_analyses (*),
          indicators (*),
          evidence (*),
          investigation_notes (*),
          investigation_status_history (*)
        `)
        .eq('id', id)
        .single();

      if (error || !inv) {
        const memInv = MemoryStoreService.getInvestigationById(id);
        if (memInv) {
          return res.status(200).json({ data: memInv });
        }
        return res.status(404).json({ error: 'Investigation not found or unauthorized.' });
      }


      return res.status(200).json({ data: inv });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch investigation. ' + (err?.message || '') });
    }
  }

  public static async updateInvestigation(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, severity, note } = req.body;
      const supabase = getSupabaseAdmin();
      const orgId = req.user?.organizationId || '00000000-0000-0000-0000-000000000001';

      if (!supabase) {
        const updated = MemoryStoreService.updateInvestigation(id, { status, severity }, note, req.user?.id);
        if (!updated) {
          return res.status(404).json({ error: 'Investigation record not found.' });
        }
        return res.status(200).json({ data: updated });
      }

      const { data: existing } = await supabase
        .from('investigations')
        .select('status')
        .eq('id', id)
        .eq('organization_id', orgId)
        .single();

      if (!existing) {
        return res.status(404).json({ error: 'Investigation record not found.' });
      }

      const updates: Record<string, any> = {};
      if (status) updates.status = status;
      if (severity) updates.severity = severity;

      const { data: updated, error } = await supabase
        .from('investigations')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error) throw error;

      if (status && status !== existing.status) {
        await supabase.from('investigation_status_history').insert({
          investigation_id: id,
          changed_by: req.user?.id,
          old_status: existing.status,
          new_status: status,
          comment: note || `Status updated to ${status}`
        });
      }

      if (note) {
        await supabase.from('investigation_notes').insert({
          investigation_id: id,
          author_id: req.user?.id,
          content: note
        });
      }

      await supabase.from('audit_logs').insert({
        organization_id: orgId,
        user_id: req.user?.id,
        action: 'INVESTIGATION_UPDATED',
        resource_type: 'INVESTIGATION',
        resource_id: id,
        metadata_json: { updates, noteAdded: !!note }
      });

      return res.status(200).json({ data: updated });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to update investigation. ' + (err?.message || '') });
    }
  }

  public static async getInvestigationGraph(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const supabase = getSupabaseAdmin();
      const orgId = req.user?.organizationId || '00000000-0000-0000-0000-000000000001';

      let inv: any = null;

      if (!supabase) {
        inv = MemoryStoreService.getInvestigationById(id);
      } else {
        const { data } = await supabase
          .from('investigations')
          .select(`
            *,
            email_analyses (*),
            indicators (*)
          `)
          .eq('id', id)
          .eq('organization_id', orgId)
          .single();
        inv = data;
      }

      if (!inv) {
        return res.status(404).json({ error: 'Investigation graph not found.' });
      }

      const nodes: any[] = [];
      const edges: any[] = [];

      const emailId = `email-${inv.id}`;
      const emailAnalysis = inv.email_analyses?.[0];

      nodes.push({
        id: emailId,
        type: 'emailNode',
        position: { x: 250, y: 50 },
        data: {
          label: inv.case_number,
          subject: inv.title,
          threatType: inv.threat_type,
          riskScore: inv.risk_score
        }
      });

      if (emailAnalysis?.sender_address) {
        const senderId = `sender-${emailAnalysis.sender_address}`;
        nodes.push({
          id: senderId,
          type: 'senderNode',
          position: { x: 50, y: 180 },
          data: { label: emailAnalysis.sender_address, type: 'Sender' }
        });
        edges.push({ id: `e-${emailId}-${senderId}`, source: emailId, target: senderId, animated: true });
      }

      let yOffset = 180;
      (inv.indicators || []).forEach((ind: any, index: number) => {
        const nodeId = `ind-${ind.id}`;
        const xPos = 250 + (index % 3) * 220;
        const currentY = yOffset + Math.floor(index / 3) * 120;

        nodes.push({
          id: nodeId,
          type: 'indicatorNode',
          position: { x: xPos, y: currentY },
          data: {
            label: ind.value,
            indicatorType: ind.type,
            riskScore: ind.risk_score
          }
        });

        edges.push({ id: `e-${emailId}-${nodeId}`, source: emailId, target: nodeId });
      });

      return res.status(200).json({ nodes, edges });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to generate investigation graph. ' + (err?.message || '') });
    }
  }
}
