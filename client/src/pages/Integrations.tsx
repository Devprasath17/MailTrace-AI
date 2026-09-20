import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Key, 
  RefreshCw, 
  Zap, 
  ShieldAlert, 
  Globe, 
  Database,
  Clock
} from 'lucide-react';
import { ConfigureIntegrationModal } from '../components/integrations/ConfigureIntegrationModal';

export const Integrations: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedConfigureProvider, setSelectedConfigureProvider] = useState<{ key: string; name: string } | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { testing?: boolean; success?: boolean; message?: string }>>({});

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['integrationsStatus'],
    queryFn: async () => {
      const res = await api.get('/integrations');
      return res.data;
    }
  });

  const { data: activityData } = useQuery({
    queryKey: ['integrationsActivity'],
    queryFn: async () => {
      const res = await api.get('/integrations/activity');
      return res.data;
    }
  });

  const integrations = data?.integrations || [];
  const activityList = activityData?.activity || [];

  const handleTestConnection = async (providerKey: string) => {
    setTestResults(prev => ({ ...prev, [providerKey]: { testing: true } }));
    try {
      const res = await api.post(`/integrations/${providerKey}/test`);
      setTestResults(prev => ({
        ...prev,
        [providerKey]: { testing: false, success: res.data.success, message: res.data.message }
      }));
      refetch();
      queryClient.invalidateQueries({ queryKey: ['integrationsActivity'] });
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [providerKey]: { testing: false, success: false, message: err.response?.data?.message || err.message || 'Connection test failed.' }
      }));
    }
  };

  const getProviderIcon = (key: string) => {
    switch (key) {
      case 'gemini': return <Cpu className="h-5 w-5 text-cyan-400" />;
      case 'virustotal': return <ShieldAlert className="h-5 w-5 text-rose-400" />;
      case 'geoip': return <Globe className="h-5 w-5 text-emerald-400" />;
      case 'supabase': return <Database className="h-5 w-5 text-amber-400" />;
      default: return <Zap className="h-5 w-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Cpu className="h-5 w-5 text-cyan-400" />
            <span>Integrations</span>
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">Configure threat intelligence, geolocation, AI, storage, and authentication services.</p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${isRefetching ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Integration Cards */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-xs text-slate-400">
          <Clock className="h-4 w-4 animate-spin text-cyan-400 mr-2" />
          Checking external integration health & API status...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((item: any) => {
            const result = testResults[item.key];
            return (
              <div key={item.key} className="rounded-xl border border-slate-800 bg-[#0b101d] p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-lg bg-slate-900 p-2 border border-slate-800">
                        {getProviderIcon(item.key)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">{item.provider}</h3>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{item.category}</span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold border ${
                      item.status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      item.status === 'ERROR' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {item.status === 'CONNECTED' ? (
                        <><CheckCircle2 className="h-3.5 w-3.5" /> Connected</>
                      ) : item.status === 'ERROR' ? (
                        <><AlertTriangle className="h-3.5 w-3.5" /> Error</>
                      ) : (
                        <><AlertTriangle className="h-3.5 w-3.5" /> Not Configured</>
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{item.purpose}</p>

                  <div className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">Credential Secret:</span>
                    <code className="font-mono text-xs text-slate-300">{item.maskedKey}</code>
                  </div>

                  {/* Live Connection Test Inline Alert */}
                  {result && !result.testing && (
                    <div className={`rounded-lg p-2.5 text-xs border ${
                      result.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                    }`}>
                      <span className="font-bold block text-[11px]">{result.success ? 'Connection Verified' : 'Connection Failed'}</span>
                      <p className="text-[11px]">{result.message}</p>
                    </div>
                  )}
                </div>

                {/* Card Action Controls */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => handleTestConnection(item.key)}
                    disabled={result?.testing}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-cyan-400 hover:bg-slate-700 disabled:opacity-50"
                  >
                    <Zap className={`h-3.5 w-3.5 ${result?.testing ? 'animate-spin' : ''}`} />
                    <span>{result?.testing ? 'Testing...' : 'Test Connection'}</span>
                  </button>

                  <button
                    onClick={() => setSelectedConfigureProvider({ key: item.key, name: item.provider })}
                    className="flex items-center gap-1.5 rounded-lg bg-cyan-500/20 px-3.5 py-1.5 text-xs font-bold text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
                  >
                    <Key className="h-3.5 w-3.5" />
                    <span>Configure</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Integration Activity Log Section */}
      <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Clock className="h-4 w-4 text-cyan-400" />
          <span>Integration Activity & Audit History</span>
        </h3>

        {activityList.length === 0 ? (
          <p className="text-xs text-slate-500">No integration activity recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Integration Provider</th>
                  <th className="py-2.5 px-4">Event Action</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Latency</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activityList.map((act: any) => (
                  <tr key={act.id} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-4 font-bold text-cyan-400 capitalize">{act.integration}</td>
                    <td className="py-2.5 px-4 text-slate-200 font-mono text-[11px]">{act.event}</td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                        act.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {act.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 font-mono">{act.duration}</td>
                    <td className="py-2.5 px-4 text-slate-500 text-[11px]">{new Date(act.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Configure Modal */}
      {selectedConfigureProvider && (
        <ConfigureIntegrationModal
          providerKey={selectedConfigureProvider.key}
          providerTitle={selectedConfigureProvider.name}
          onClose={() => setSelectedConfigureProvider(null)}
        />
      )}
    </div>
  );
};
