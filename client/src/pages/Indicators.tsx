import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { 
  Fingerprint, 
  Search, 
  ShieldAlert, 
  RefreshCw, 
  Download, 
  Filter, 
  XCircle,
  Eye,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock
} from 'lucide-react';
import { IOCDetailDrawer } from '../components/indicators/IOCDetailDrawer';

export const Indicators: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [verdictFilter, setVerdictFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['indicators', typeFilter, severityFilter, verdictFilter, search],
    queryFn: async () => {
      const res = await api.get('/indicators', {
        params: {
          type: typeFilter,
          severity: severityFilter,
          verdict: verdictFilter,
          search
        }
      });
      return res.data;
    }
  });

  const list = data?.data || [];
  const summary = data?.summary || { total: 0, malicious: 0, suspicious: 0, clean: 0, unverified: 0 };

  const handleClearFilters = () => {
    setTypeFilter('ALL');
    setSeverityFilter('ALL');
    setVerdictFilter('ALL');
    setSearch('');
  };

  const handleExportCSV = () => {
    if (list.length === 0) return;
    const headers = ['Type', 'Value', 'Risk Score', 'Case Number', 'Discovered Date'];
    const rows = list.map((item: any) => [
      item.type,
      `"${item.value}"`,
      item.risk_score || item.riskScore || 0,
      item.investigations?.case_number || 'N/A',
      item.created_at || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: (string | number)[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MailTrace_IOCs_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityBadge = (score: number) => {
    if (score >= 85) return <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">CRITICAL</span>;
    if (score >= 70) return <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/20">HIGH</span>;
    if (score >= 40) return <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">MEDIUM</span>;
    if (score > 0) return <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">LOW</span>;
    return <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700">INFO</span>;
  };

  const getVerdictBadge = (score: number) => {
    if (score >= 70) return <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-400 border border-rose-500/20"><ShieldAlert className="h-3 w-3" /> Malicious</span>;
    if (score >= 40) return <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20"><AlertTriangle className="h-3 w-3" /> Suspicious</span>;
    if (score > 0) return <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="h-3 w-3" /> Clean</span>;
    return <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400 border border-slate-700"><HelpCircle className="h-3 w-3" /> Unverified</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Fingerprint className="h-5 w-5 text-cyan-400" />
            <span>Indicators (IOCs)</span>
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">Centralized view of indicators extracted from analyzed email investigations.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={list.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Database-Derived Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-4 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Total Indicators</span>
          <span className="mt-2 text-2xl font-extrabold text-slate-100 block">{summary.total}</span>
        </div>

        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 block">Malicious</span>
          <span className="mt-2 text-2xl font-extrabold text-rose-400 block">{summary.malicious}</span>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">Suspicious</span>
          <span className="mt-2 text-2xl font-extrabold text-amber-400 block">{summary.suspicious}</span>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">Clean</span>
          <span className="mt-2 text-2xl font-extrabold text-emerald-400 block">{summary.clean}</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-4 text-center col-span-2 lg:col-span-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Unverified</span>
          <span className="mt-2 text-2xl font-extrabold text-slate-400 block">{summary.unverified}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 rounded-xl border border-slate-800 bg-[#0b101d] p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search IP, Domain, URL, Hash, Email, or Case Number..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900 py-1.5 pl-9 pr-4 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="IP">IP Address</option>
            <option value="DOMAIN">Domain</option>
            <option value="URL">URL</option>
            <option value="HASH">SHA-256 Hash</option>
            <option value="EMAIL">Sender Email</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical (85+)</option>
            <option value="HIGH">High (70-84)</option>
            <option value="MEDIUM">Medium (40-69)</option>
            <option value="LOW">Low (1-39)</option>
            <option value="INFORMATIONAL">Info (0)</option>
          </select>

          <select
            value={verdictFilter}
            onChange={(e) => setVerdictFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Verdicts</option>
            <option value="MALICIOUS">Malicious</option>
            <option value="SUSPICIOUS">Suspicious</option>
            <option value="CLEAN">Clean</option>
            <option value="UNVERIFIED">Unverified</option>
          </select>

          {(typeFilter !== 'ALL' || severityFilter !== 'ALL' || verdictFilter !== 'ALL' || search) && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Indicators Data Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-xs text-slate-400">
          <Clock className="h-4 w-4 animate-spin text-cyan-400 mr-2" />
          Loading extracted indicators...
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-12 text-center space-y-3">
          <Fingerprint className="mx-auto h-10 w-10 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-300">No indicators found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Indicators extracted from analyzed email investigations will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-[#0b101d] overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Indicator Value</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4">Investigation</th>
                <th className="py-3 px-4">Discovered Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {list.map((ind: any) => {
                const score = ind.risk_score || ind.riskScore || 0;
                return (
                  <tr key={ind.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-cyan-400">{ind.type}</td>
                    <td className="py-3 px-4 font-mono text-slate-200 break-all">{ind.value}</td>
                    <td className="py-3 px-4">{getSeverityBadge(score)}</td>
                    <td className="py-3 px-4">{getVerdictBadge(score)}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {ind.investigations?.case_number || 'Case Record'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(ind.created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedIndicatorId(ind.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-cyan-400 hover:bg-slate-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* IOC Detail Drawer */}
      {selectedIndicatorId && (
        <IOCDetailDrawer
          indicatorId={selectedIndicatorId}
          onClose={() => setSelectedIndicatorId(null)}
        />
      )}
    </div>
  );
};
