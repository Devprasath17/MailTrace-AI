import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { 
  X, 
  FileCheck, 
  Lock, 
  ShieldCheck, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  Clock, 
  Briefcase, 
  User,
  ShieldAlert
} from 'lucide-react';

interface Props {
  evidenceId: string | null;
  onClose: () => void;
}

export const EvidenceDetailDrawer: React.FC<Props> = ({ evidenceId, onClose }) => {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['evidenceDetail', evidenceId],
    queryFn: async () => {
      const res = await api.get(`/evidence/${evidenceId}`);
      return res.data;
    },
    enabled: !!evidenceId
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      setVerifying(true);
      const res = await api.post(`/evidence/${evidenceId}/verify`);
      return res.data;
    },
    onSuccess: (data) => {
      setVerifying(false);
      setVerifyMessage(data.message || 'Integrity match verified.');
      queryClient.invalidateQueries({ queryKey: ['evidenceDetail', evidenceId] });
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
    },
    onError: (err: any) => {
      setVerifying(false);
      setVerifyMessage(err.response?.data?.error || 'Integrity check failed.');
    }
  });

  if (!evidenceId) return null;

  const evidence = data?.evidence;
  const chainOfCustody = data?.chainOfCustody || [];

  const handleCopyHash = () => {
    if (evidence?.sha256_hash) {
      navigator.clipboard.writeText(evidence.sha256_hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    window.open(`${api.defaults.baseURL}/evidence/${evidenceId}/download`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-[#0b101d] border-l border-slate-800 p-6 space-y-6 overflow-y-auto text-slate-200 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Preserved Artifact</span>
            <h2 className="text-base font-mono font-bold text-slate-100 flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>{evidence?.file_name || evidenceId}</span>
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-xs text-slate-400">
            <Clock className="h-4 w-4 animate-spin text-emerald-400 mr-2" />
            Loading cryptographic metadata and chain of custody...
          </div>
        ) : error || !evidence ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center text-xs text-slate-400">
            Unable to load evidence record details.
          </div>
        ) : (
          <div className="space-y-6">

            {/* Evidence Metadata */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Artifact Metadata</h3>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-slate-500">Evidence ID:</span> <span className="font-mono text-slate-300 block">{evidence.id}</span></div>
                <div><span className="text-slate-500">Artifact Type:</span> <span className="font-bold text-cyan-400 block">{evidence.evidence_type || 'EML'}</span></div>
                <div><span className="text-slate-500">File Size:</span> <span className="font-semibold text-slate-200 block">{(evidence.file_size / 1024).toFixed(1)} KB ({evidence.file_size} Bytes)</span></div>
                <div><span className="text-slate-500">Preserved Date:</span> <span className="font-semibold text-slate-200 block">{new Date(evidence.created_at || Date.now()).toLocaleString()}</span></div>
                <div><span className="text-slate-500">Case Reference:</span> <span className="font-mono text-cyan-400 block">{evidence.investigations?.case_number || 'General Vault'}</span></div>
                <div><span className="text-slate-500">Storage Path:</span> <span className="font-mono text-[11px] text-slate-400 block truncate">{evidence.storage_path || 'evidence/vault'}</span></div>
              </div>
            </div>

            {/* Cryptographic SHA-256 Integrity */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span>SHA-256 Cryptographic Digest</span>
                </h3>
                <button
                  onClick={() => verifyMutation.mutate()}
                  disabled={verifying}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${verifying ? 'animate-spin' : ''}`} />
                  <span>Verify Integrity</span>
                </button>
              </div>

              <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 flex items-center justify-between gap-3">
                <code className="font-mono text-xs text-slate-200 break-all">{evidence.sha256_hash}</code>
                <button
                  onClick={handleCopyHash}
                  className="shrink-0 rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              {verifyMessage && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-300">
                  {verifyMessage}
                </div>
              )}
            </div>

            {/* Chain of Custody Timeline */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Lock className="h-4 w-4 text-cyan-400" />
                <span>Chronological Chain of Custody</span>
              </h3>

              <div className="space-y-3 text-xs">
                {chainOfCustody.map((step: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 border-l-2 border-emerald-500/40 pl-3 py-1">
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{step.stage}</span>
                        <span className="text-[10px] text-slate-500">{new Date(step.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{step.detail}</p>
                      <span className="text-[10px] text-slate-500 font-mono">Actor: {step.actor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence Security & Download Controls */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Storage & Security Policy</h3>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                <div><span className="text-slate-500 block text-[10px]">Storage Provider:</span> Supabase Cloud Storage Vault</div>
                <div><span className="text-slate-500 block text-[10px]">Access Protection:</span> RLS Multi-Tenant Org Policy</div>
                <div><span className="text-slate-500 block text-[10px]">Audit Logging:</span> Enabled (Immutable Log)</div>
                <div><span className="text-slate-500 block text-[10px]">Digest Validation:</span> Verified SHA-256</div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Preserved Evidence Artifact</span>
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
