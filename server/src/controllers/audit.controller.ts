import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getSupabaseAdmin } from '../config/supabase.js';
import { MemoryStoreService } from '../services/store.service.js';

export class AuditController {
  public static async listAuditLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const supabase = getSupabaseAdmin();
      const orgId = req.user?.organizationId || '00000000-0000-0000-0000-000000000001';

      if (!supabase) {
        const list = MemoryStoreService.getAuditLogs();
        return res.status(200).json({ data: list, total: list.length });
      }

      const { data, count, error } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return res.status(200).json({ data: data || [], total: count || 0 });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve audit log entries. ' + (err?.message || '') });
    }
  }
}
