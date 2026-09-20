import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { X, Key, Eye, EyeOff, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface Props {
  providerKey: string;
  providerTitle: string;
  onClose: () => void;
}

export const ConfigureIntegrationModal: React.FC<Props> = ({ providerKey, providerTitle, onClose }) => {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/integrations/${providerKey}/configure`, { apiKey });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrationsStatus'] });
      onClose();
    }
  });

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // First dynamically update server memory key if provided
      if (apiKey) {
        await api.post(`/integrations/${providerKey}/configure`, { apiKey });
      }
      const res = await api.post(`/integrations/${providerKey}/test`);
      setTestResult({ success: res.data.success, message: res.data.message });
      queryClient.invalidateQueries({ queryKey: ['integrationsStatus'] });
    } catch (err: any) {
      setTestResult({ success: false, message: err.response?.data?.message || err.message || 'Connection test failed.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0b101d] p-6 text-slate-100 shadow-2xl space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Key className="h-4 w-4 text-cyan-400" />
              <span>Configure {providerTitle}</span>
            </h3>
            <p className="text-xs text-slate-400">Manage credentials and server connection settings.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1.5">API Key / Integration Token</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API key string (e.g. AIzaSy... or 601b0f...)..."
                className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 pr-10 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Keys are securely processed server-side and never exposed to client browsers.
            </p>
          </div>

          {/* Test Result Display */}
          {testResult && (
            <div className={`rounded-lg p-3 text-xs border ${
              testResult.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}>
              <span className="font-bold block mb-0.5">
                {testResult.success ? 'Connection Test Successful' : 'Connection Test Failed'}
              </span>
              <p className="text-[11px]">{testResult.message}</p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-cyan-400 hover:bg-slate-700 disabled:opacity-50"
          >
            <Clock className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Testing...' : 'Test Connection'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={!apiKey.trim() || saveMutation.isPending}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
            >
              Save Key
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
