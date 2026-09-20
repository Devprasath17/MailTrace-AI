import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Cpu, CheckCircle2, AlertTriangle, HelpCircle, XCircle, Clock, ShieldAlert } from 'lucide-react';

export interface AgentExecutionRecord {
  id: string;
  investigationId: string;
  agentName: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'NOT_CONFIGURED' | 'SKIPPED';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  inputSummary?: Record<string, any>;
  outputSummary?: Record<string, any>;
  errorMessage?: string;
}

interface Props {
  investigationId: string;
}

export const AgentExecutionTimeline: React.FC<Props> = ({ investigationId }) => {
  const { data, isLoading, error } = useQuery<{ logs: AgentExecutionRecord[] }>({
    queryKey: ['agentLogs', investigationId],
    queryFn: async () => {
      const res = await api.get(`/agents/investigations/${investigationId}`);
      return res.data;
    },
    enabled: !!investigationId
  });

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-slate-400">
        <Clock className="h-4 w-4 animate-spin text-cyan-400 mr-2" />
        Loading Agent Audit Timeline...
      </div>
    );
  }

  const logs = data?.logs || [];

  const getStatusBadge = (status: AgentExecutionRecord['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            COMPLETED
          </span>
        );
      case 'NOT_CONFIGURED':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <HelpCircle className="h-3 w-3" />
            NOT CONFIGURED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3" />
            FAILED
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold text-cyan-400 border border-cyan-500/20">
            <Clock className="h-3 w-3 animate-spin" />
            RUNNING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#0b101d] p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-cyan-500/10 p-2 border border-cyan-500/20">
            <Cpu className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Multi-Agent Forensic Execution Log</h3>
            <p className="text-xs text-slate-400">Autonomous investigation timeline & failure-isolated agent execution audits</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-cyan-400 border border-slate-700">
          {logs.length} Executed Steps
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-xl border border-slate-800/80 bg-[#0b101d]/60 p-8 text-center text-xs text-slate-400">
          No autonomous agent execution logs recorded yet for this investigation.
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div 
              key={log.id} 
              className="rounded-xl border border-slate-800/80 bg-[#0b101d] p-4 space-y-3 transition-colors hover:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-sm text-slate-200">{log.agentName}</span>
                  {getStatusBadge(log.status)}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{log.durationMs !== undefined ? `${log.durationMs}ms` : ''}</span>
                  <span>{new Date(log.startedAt).toLocaleTimeString()}</span>
                </div>
              </div>

              {log.errorMessage && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-300">
                  <span className="font-semibold">Error:</span> {log.errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                {log.inputSummary && Object.keys(log.inputSummary).length > 0 && (
                  <div className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-sans block mb-1">Input Context</span>
                    <pre className="text-slate-300 whitespace-pre-wrap text-[11px]">
                      {JSON.stringify(log.inputSummary, null, 2)}
                    </pre>
                  </div>
                )}
                {log.outputSummary && Object.keys(log.outputSummary).length > 0 && (
                  <div className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-sans block mb-1">Output Summary</span>
                    <pre className="text-cyan-300 whitespace-pre-wrap text-[11px]">
                      {JSON.stringify(log.outputSummary, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
