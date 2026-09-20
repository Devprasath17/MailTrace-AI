import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { 
  X, 
  ShieldAlert, 
  Globe, 
  MapPin, 
  Network, 
  Briefcase, 
  FileCheck, 
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';

interface Props {
  indicatorId: string | null;
  onClose: () => void;
}

export const IOCDetailDrawer: React.FC<Props> = ({ indicatorId, onClose }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['indicatorDetail', indicatorId],
    queryFn: async () => {
      const res = await api.get(`/indicators/${indicatorId}`);
      return res.data;
    },
    enabled: !!indicatorId
  });

  if (!indicatorId) return null;

  const indicator = data?.indicator;
  const threatIntel = data?.threatIntel;
  const networkIntel = data?.networkIntel;
  const relatedEvidence = data?.relatedEvidence || [];
  const timeline = data?.timeline || [];

  const getVerdictBadge = (score: number) => {
    if (score >= 70) {
      return <span className="rounded bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-400 border border-rose-500/20 flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5" /> MALICIOUS</span>;
    }
    if (score >= 40) {
      return <span className="rounded bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-400 border border-amber-500/20 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> SUSPICIOUS</span>;
    }
    if (score > 0) {
      return <span className="rounded bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> CLEAN</span>;
    }
    return <span className="rounded bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-400 border border-slate-700 flex items-center gap-1"><HelpCircle className="h-3.5 w-3.5" /> UNVERIFIED</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-[#0b101d] border-l border-slate-800 p-6 space-y-6 overflow-y-auto text-slate-200 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">Indicator Analysis</span>
            <h2 className="text-base font-mono font-bold text-slate-100 break-all">{indicator?.value || indicatorId}</h2>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-xs text-slate-400">
            <Clock className="h-4 w-4 animate-spin text-cyan-400 mr-2" />
            Loading threat intelligence and correlation metrics...
          </div>
        ) : error || !indicator ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center text-xs text-slate-400">
            Unable to load detailed intelligence for indicator.
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] text-slate-500 uppercase block">Indicator Type</span>
                <span className="font-bold text-cyan-400">{indicator.type}</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-[10px] text-slate-500 uppercase block">Verdict</span>
                {getVerdictBadge(indicator.risk_score || indicator.riskScore || 0)}
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 uppercase block">Risk Rating</span>
                <span className="font-extrabold text-slate-100 text-sm">{indicator.risk_score || indicator.riskScore || 0} / 100</span>
              </div>
            </div>

            {/* Threat Intelligence (VirusTotal) */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-cyan-400" />
                  <span>Threat Intelligence (VirusTotal)</span>
                </h3>
              </div>

              {!threatIntel ? (
                <p className="text-xs text-slate-500">Threat intelligence not queried for this indicator category.</p>
              ) : threatIntel.status === 'UNCONFIGURED' ? (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 inline mr-2" />
                  <span>VirusTotal integration is not configured. Add VIRUSTOTAL_API_KEY in server settings.</span>
                </div>
              ) : threatIntel.status === 'FOUND' ? (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2">
                      <span className="text-[10px] text-rose-400 block font-bold">Malicious</span>
                      <span className="text-base font-extrabold text-rose-400">{threatIntel.maliciousCount || 0}</span>
                    </div>
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2">
                      <span className="text-[10px] text-amber-400 block font-bold">Suspicious</span>
                      <span className="text-base font-extrabold text-amber-400">{threatIntel.suspiciousCount || 0}</span>
                    </div>
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2">
                      <span className="text-[10px] text-emerald-400 block font-bold">Harmless</span>
                      <span className="text-base font-extrabold text-emerald-400">{threatIntel.harmlessCount || 0}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Indicator not found in active threat intelligence databases.</p>
              )}
            </div>

            {/* Network Intelligence (IP Geolocation) */}
            {String(indicator.type).toUpperCase() === 'IP' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-cyan-400" />
                    <span>Network Intelligence</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 italic">Approximate network geolocation</span>
                </div>

                {networkIntel?.details ? (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-slate-500">Country:</span> <span className="font-semibold text-slate-200">{networkIntel.details.country || 'N/A'}</span></div>
                    <div><span className="text-slate-500">City / Region:</span> <span className="font-semibold text-slate-200">{networkIntel.details.city || 'N/A'}, {networkIntel.details.region || ''}</span></div>
                    <div><span className="text-slate-500">ASN / ISP:</span> <span className="font-semibold text-slate-200">{networkIntel.details.asn || ''} {networkIntel.details.org || 'N/A'}</span></div>
                    <div><span className="text-slate-500">Type:</span> <span className="font-semibold text-cyan-400">{networkIntel.details.isPrivate ? 'Private Range' : 'Public IP'}</span></div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Network geolocation unavailable for this address.</p>
                )}
              </div>
            )}

            {/* Related Investigation */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-cyan-400" />
                <span>Associated Investigation</span>
              </h3>

              <div className="flex items-center justify-between rounded-lg bg-slate-900 p-3 text-xs border border-slate-800">
                <div>
                  <span className="font-mono font-bold text-cyan-400 block">{indicator.investigations?.case_number || 'Case File'}</span>
                  <span className="text-slate-300">{indicator.investigations?.title || 'Suspicious Email Investigation'}</span>
                </div>
                {indicator.investigation_id && (
                  <Link 
                    to={`/investigations/${indicator.investigation_id}`}
                    className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:underline"
                  >
                    <span>Open Case</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span>Activity Timeline</span>
              </h3>

              <div className="space-y-2 text-xs">
                {timeline.map((evt: any, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 border-l-2 border-cyan-500/40 pl-3 py-1">
                    <div>
                      <span className="font-semibold text-slate-200 block">{evt.event}</span>
                      <span className="text-slate-400 text-[11px]">{evt.details}</span>
                      <span className="text-slate-500 text-[10px] block mt-0.5">{new Date(evt.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
