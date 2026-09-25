import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Shield, Briefcase, AlertTriangle, CheckCircle2, SearchCode, ArrowUpRight, Activity } from 'lucide-react';

interface SummaryResponse {
  metrics: {
    totalInvestigations: number;
    openInvestigations: number;
    criticalInvestigations: number;
    resolvedInvestigations: number;
    avgRiskScore: number;
  };
  threatBreakdown: Record<string, number>;
  recentActivity: Array<{
    id: string;
    caseNumber: string;
    title: string;
    severity: string;
    status: string;
    threatType: string;
    riskScore: number;
    isDemo?: boolean;
    createdAt: string;
  }>;
}

export const Dashboard: React.FC = () => {
  const { data, isLoading, isError } = useQuery<SummaryResponse>({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const res = await api.get('/dashboard/summary');
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
          <span className="text-xs font-medium">Loading Security Metrics...</span>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalInvestigations: 0,
    openInvestigations: 0,
    criticalInvestigations: 0,
    resolvedInvestigations: 0,
    avgRiskScore: 0
  };

  const recentList = data?.recentActivity || [];
  const hasData = metrics.totalInvestigations > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Activity className="h-5 w-5 text-cyan-400" />
            <span>SOC Security Dashboard</span>
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">Real-time threat intelligence overview</p>
        </div>

        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20 transition-all self-start sm:self-auto"
        >
          <SearchCode className="h-4 w-4" />
          <span>Analyze Email</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Cases</span>
            <Briefcase className="h-4 w-4 text-cyan-400" />
          </div>
          <span className="mt-2 block text-2xl font-extrabold text-slate-100">{metrics.totalInvestigations}</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Open Investigations</span>
            <Activity className="h-4 w-4 text-amber-400" />
          </div>
          <span className="mt-2 block text-2xl font-extrabold text-amber-400">{metrics.openInvestigations}</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Critical Threats</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <span className="mt-2 block text-2xl font-extrabold text-rose-400">{metrics.criticalInvestigations}</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Resolved Cases</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="mt-2 block text-2xl font-extrabold text-emerald-400">{metrics.resolvedInvestigations}</span>
        </div>
      </div>

      {/* Content Body: Empty State or Active Tables */}
      {!hasData ? (
        <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-slate-500 border border-slate-800">
            <Shield className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-200">No investigations yet</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Analyze your first suspicious email to start building intelligence and tracking indicators.
          </p>
          <Link
            to="/analyze"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20"
          >
            <SearchCode className="h-4 w-4" />
            <span>Analyze First Email</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200">Recent Investigations</h2>
            <Link to="/investigations" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0b101d] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Case #</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Threat Type</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-cyan-400 flex items-center gap-1.5">
                      <span>{item.caseNumber}</span>
                      {item.isDemo && (
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/30">
                          DEMO
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200 truncate max-w-xs">{item.title}</td>
                    <td className="py-3 px-4 text-slate-300">{item.threatType}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                        item.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        item.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-100">{item.riskScore}/100</td>
                    <td className="py-3 px-4">
                      <span className="inline-block rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/20">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link to={`/investigations/${item.id}`} className="text-cyan-400 hover:underline font-semibold">
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
