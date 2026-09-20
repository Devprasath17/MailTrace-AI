import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { History, Shield } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      const res = await api.get('/audit-logs');
      return res.data;
    }
  });

  const list = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800/80 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
          <History className="h-5 w-5 text-cyan-400" />
          <span>Security Audit Trail Logs</span>
        </h1>
        <p className="mt-0.5 text-xs text-slate-400">Compliance activity record of all security analyst actions, case creations, and status changes</p>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-xs text-slate-400">Loading audit logs...</div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-12 text-center">
          <Shield className="mx-auto h-8 w-8 text-slate-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-300">No audit log records recorded yet</h3>
          <p className="text-xs text-slate-500 mt-1">Audit log records are recorded automatically when analysts execute email threat analyses.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-[#0b101d] overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Resource Type</th>
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {list.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="py-3 px-4 font-bold text-cyan-400">{log.action}</td>
                  <td className="py-3 px-4 text-slate-300">{log.resource_type}</td>
                  <td className="py-3 px-4 text-slate-500 truncate max-w-[120px]">{log.user_id || 'System'}</td>
                  <td className="py-3 px-4 text-slate-400 truncate max-w-xs">{JSON.stringify(log.metadata_json)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
