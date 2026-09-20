import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getSupabaseAdmin } from '../config/supabase.js';
import { MemoryStoreService } from '../services/store.service.js';
import { VirusTotalService } from '../integrations/virustotal.service.js';
import { GeoIPService } from '../integrations/geoip.service.js';

export class IndicatorsController {
  public static async listIndicators(req: AuthenticatedRequest, res: Response) {
    try {
      const supabase = getSupabaseAdmin();
      const orgId = req.user?.organizationId || '00000000-0000-0000-0000-000000000001';
      const { type, severity, verdict, search } = req.query;

      let allItems: any[] = [];

      if (!supabase) {
        allItems = MemoryStoreService.getIndicators();
      } else {
        const { data, error } = await supabase
          .from('indicators')
          .select(`
            *,
            investigations (id, case_number, title, threat_type, severity, risk_score)
          `)
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          allItems = data;
        } else {
          allItems = MemoryStoreService.getIndicators();
        }
      }

      // Calculate Real Database-Derived Summary Statistics
      const summaryStats = {
        total: allItems.length,
        malicious: allItems.filter(i => (i.risk_score || i.riskScore || 0) >= 70).length,
        suspicious: allItems.filter(i => {
          const s = i.risk_score || i.riskScore || 0;
          return s >= 40 && s < 70;
        }).length,
        clean: allItems.filter(i => {
          const s = i.risk_score || i.riskScore || 0;
          return s > 0 && s < 40;
        }).length,
        unverified: allItems.filter(i => (i.risk_score || i.riskScore || 0) === 0).length
      };

      // Apply Filters
      let filtered = [...allItems];

      if (type && type !== 'ALL') {
        filtered = filtered.filter(i => String(i.type).toUpperCase() === String(type).toUpperCase());
      }

      if (search) {
        const s = String(search).toLowerCase();
        filtered = filtered.filter(i => 
          String(i.value).toLowerCase().includes(s) ||
          String(i.type).toLowerCase().includes(s) ||
          String(i.investigations?.case_number || '').toLowerCase().includes(s)
        );
      }

      if (severity && severity !== 'ALL') {
        filtered = filtered.filter(i => {
          const score = i.risk_score || i.riskScore || 0;
          if (severity === 'CRITICAL') return score >= 85;
          if (severity === 'HIGH') return score >= 70 && score < 85;
          if (severity === 'MEDIUM') return score >= 40 && score < 70;
          if (severity === 'LOW') return score > 0 && score < 40;
          if (severity === 'INFORMATIONAL') return score === 0;
          return true;
        });
      }

      if (verdict && verdict !== 'ALL') {
        filtered = filtered.filter(i => {
          const score = i.risk_score || i.riskScore || 0;
          if (verdict === 'MALICIOUS') return score >= 70;
          if (verdict === 'SUSPICIOUS') return score >= 40 && score < 70;
          if (verdict === 'CLEAN') return score > 0 && score < 40;
          if (verdict === 'UNVERIFIED') return score === 0;
          return true;
        });
      }

      return res.status(200).json({
        data: filtered,
        total: filtered.length,
        summary: summaryStats
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve indicators. ' + (err?.message || '') });
    }
  }

  public static async getIndicatorDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const supabase = getSupabaseAdmin();
      const orgId = req.user?.organizationId || '00000000-0000-0000-0000-000000000001';

      let indicator: any = null;

      if (supabase) {
        const { data } = await supabase
          .from('indicators')
          .select(`
            *,
            investigations (id, case_number, title, threat_type, severity, risk_score, created_at)
          `)
          .eq('id', id)
          .eq('organization_id', orgId)
          .single();

        indicator = data;
      }

      if (!indicator) {
        indicator = MemoryStoreService.getIndicators().find(i => i.id === id || i.value === id);
      }

      if (!indicator) {
        return res.status(404).json({ error: 'Indicator record not found.' });
      }

      // Fetch Real Threat Intelligence if VirusTotal or GeoIP applicable
      let threatIntel = null;
      let networkIntel = null;

      const indType = String(indicator.type).toUpperCase();
      const indValue = indicator.value;

      if (indType === 'IP') {
        networkIntel = await GeoIPService.geolocateIp(indValue);
        threatIntel = await VirusTotalService.checkIndicator('IP', indValue);
      } else if (indType === 'DOMAIN') {
        threatIntel = await VirusTotalService.checkIndicator('DOMAIN', indValue);
      } else if (indType === 'URL') {
        threatIntel = await VirusTotalService.checkIndicator('URL', indValue);
      }

      // Related Evidence and Timeline
      let relatedEvidence: any[] = [];
      if (supabase) {
        const { data: evData } = await supabase
          .from('evidence')
          .select('*')
          .eq('organization_id', orgId)
          .eq('investigation_id', indicator.investigation_id);

        if (evData) relatedEvidence = evData;
      } else {
        relatedEvidence = MemoryStoreService.getEvidence();
      }

      const timeline = [
        {
          event: 'Discovered in Investigation',
          timestamp: indicator.created_at || new Date().toISOString(),
          details: `Observed in case ${indicator.investigations?.case_number || 'MT-CASE'}`
        }
      ];

      if (threatIntel && threatIntel.status === 'FOUND') {
        timeline.push({
          event: 'Threat Intelligence Analyzed',
          timestamp: new Date().toISOString(),
          details: `VirusTotal malicious detections: ${threatIntel.maliciousCount || 0}/${(threatIntel.maliciousCount || 0) + (threatIntel.harmlessCount || 0)}`
        });
      }

      return res.status(200).json({
        indicator,
        threatIntel,
        networkIntel,
        relatedEvidence,
        timeline
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch indicator details. ' + (err?.message || '') });
    }
  }
}
