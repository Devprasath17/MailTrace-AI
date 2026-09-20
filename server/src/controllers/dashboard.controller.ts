import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getSupabaseAdmin } from '../config/supabase.js';
import { MemoryStoreService } from '../services/store.service.js';

export class DashboardController {
  public static async getSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const supabase = getSupabaseAdmin();
      const orgId = req.user?.organizationId || '00000000-0000-0000-0000-000000000001';

      let list: any[] = [];

      if (!supabase) {
        list = MemoryStoreService.getInvestigations(orgId);
      } else {
        const { data } = await supabase
          .from('investigations')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false });
        list = data || [];
      }

      const totalInvestigations = list.length;
      const openInvestigations = list.filter(i => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length;
      const criticalInvestigations = list.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length;
      const resolvedInvestigations = list.filter(i => i.status === 'RESOLVED' || i.status === 'CONTAINED').length;

      const totalRiskSum = list.reduce((acc, i) => acc + (i.risk_score || 0), 0);
      const avgRiskScore = totalInvestigations > 0 ? Math.round(totalRiskSum / totalInvestigations) : 0;

      const threatBreakdown: Record<string, number> = {};
      list.forEach(i => {
        const type = i.threat_type || 'UNKNOWN';
        threatBreakdown[type] = (threatBreakdown[type] || 0) + 1;
      });

      const recentActivity = list.slice(0, 5).map(i => ({
        id: i.id,
        caseNumber: i.case_number,
        title: i.title,
        severity: i.severity,
        status: i.status,
        threatType: i.threat_type,
        riskScore: i.risk_score,
        createdAt: i.created_at
      }));

      return res.status(200).json({
        metrics: {
          totalInvestigations,
          openInvestigations,
          criticalInvestigations,
          resolvedInvestigations,
          avgRiskScore
        },
        threatBreakdown,
        recentActivity
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch dashboard summary metrics. ' + (err?.message || '') });
    }
  }
}
