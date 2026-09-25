import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Briefcase, Search, Filter, Shield, ChevronRight, Trash2 } from 'lucide-react';

export const Investigations: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['investigations', statusFilter, severityFilter, search],
    queryFn: async () => {
      const res = await api.get('/investigations', {
        params: { status: statusFilter, severity: severityFilter, search }
      });
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/investigations/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigations'] });
    }
  });

  const handleDelete = (id: string, caseNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm(`Are you sure you want to delete investigation case ${caseNumber} and its reports?`)) {
      deleteMutation.mutate(id);
    }
  };

  const list = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Briefcase className="h-5 w-5 text-cyan-400" />
            <span>Investigation Cases</span>
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">Manage, inspect, update, and delete active security incidents & forensic reports</p>
        </div>

        <Link
          to="/analyze"
          className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 self-start sm:self-auto"
        >
          + New Investigation
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-xl border border-slate-800 bg-[#0b101d] p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by case number or email subject..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900 py-1.5 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="CONTAINED">Contained</option>
            <option value="RESOLVED">Resolved</option>
            <option value="FALSE_POSITIVE">False Positive</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Table / Empty State */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-xs text-slate-400">Loading cases...</div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-12 text-center">
          <Shield className="mx-auto h-8 w-8 text-slate-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-300">No matching investigation cases found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting search filters or submit a new email for forensic analysis.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-[#0b101d] overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Case #</th>
                <th className="py-3 px-4">Title / Subject</th>
                <th className="py-3 px-4">Threat Classification</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {list.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-cyan-400 flex items-center gap-1.5">
                    <span>{inv.case_number}</span>
                    {inv.is_demo && (
                      <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/30">
                        DEMO
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-200 max-w-sm truncate">{inv.title}</td>
                  <td className="py-3.5 px-4 text-slate-300">{inv.threat_type}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                      inv.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      inv.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {inv.severity}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-100">{inv.risk_score}/100</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/20">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right flex items-center justify-end gap-3">
                    <Link to={`/investigations/${inv.id}`} className="text-cyan-400 hover:underline font-semibold inline-flex items-center gap-1">
                      <span>Inspect</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>

                    <button
                      onClick={(e) => handleDelete(inv.id, inv.case_number, e)}
                      title="Delete Investigation & Reports"
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded hover:bg-slate-800"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
