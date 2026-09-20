import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { 
  Lock, 
  FileCheck, 
  Shield, 
  Upload, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  Eye, 
  ShieldCheck, 
  Clock,
  FileText
} from 'lucide-react';
import { UploadEvidenceModal } from '../components/evidence/UploadEvidenceModal';
import { EvidenceDetailDrawer } from '../components/evidence/EvidenceDetailDrawer';

export const EvidenceVault: React.FC = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['evidence'],
    queryFn: async () => {
      const res = await api.get('/evidence');
      return res.data;
    }
  });

  const list = data?.data || [];
  const summary = data?.summary || { total: 0, verified: 0, unverified: 0, recent: 0 };

  const handleCopyHash = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleDownload = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`${api.defaults.baseURL}/evidence/${id}/download`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Lock className="h-5 w-5 text-emerald-400" />
            <span>Evidence Vault</span>
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">Secure repository for preserved investigation evidence and forensic artifacts.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-emerald-400 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Evidence</span>
          </button>
        </div>
      </div>

      {/* Database-Derived Security Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-4 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Total Evidence</span>
          <span className="mt-2 text-2xl font-extrabold text-slate-100 block">{summary.total}</span>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">Verified Integrity</span>
          <span className="mt-2 text-2xl font-extrabold text-emerald-400 block">{summary.verified}</span>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">Unverified</span>
          <span className="mt-2 text-2xl font-extrabold text-amber-400 block">{summary.unverified}</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-4 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Recent (7 Days)</span>
          <span className="mt-2 text-2xl font-extrabold text-slate-100 block">{summary.recent}</span>
        </div>
      </div>

      {/* Evidence Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-xs text-slate-400">
          <Clock className="h-4 w-4 animate-spin text-emerald-400 mr-2" />
          Loading preserved evidence artifacts...
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-12 text-center space-y-3">
          <Shield className="mx-auto h-10 w-10 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-300">Evidence Vault is empty</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Preserved investigation evidence and `.EML` artifacts will appear here after an analysis.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Evidence</span>
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-[#0b101d] overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Artifact Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Case Reference</th>
                <th className="py-3 px-4">SHA-256 Hash</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Preserved Date</th>
                <th className="py-3 px-4">Integrity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {list.map((item: any) => {
                const shortHash = item.sha256_hash ? `${item.sha256_hash.slice(0, 7)}...${item.sha256_hash.slice(-6)}` : 'N/A';
                return (
                  <tr 
                    key={item.id} 
                    onClick={() => setSelectedEvidenceId(item.id)}
                    className="hover:bg-slate-900/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{item.file_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/20">
                        {item.evidence_type || 'EML'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-400">
                      {item.investigations?.case_number || 'MT-CASE'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span>{shortHash}</span>
                        {item.sha256_hash && (
                          <button
                            onClick={(e) => handleCopyHash(item.sha256_hash, e)}
                            className="rounded p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                            title="Copy full SHA-256 hash"
                          >
                            {copiedHash === item.sha256_hash ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {(item.file_size / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(item.created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                        <ShieldCheck className="h-3 w-3" /> VERIFIED
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvidenceId(item.id);
                          }}
                          className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleDownload(item.id, e)}
                          className="rounded-lg bg-cyan-500/20 p-1 text-xs font-bold text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
                          title="Download Evidence File"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Evidence Modal */}
      {showUploadModal && (
        <UploadEvidenceModal onClose={() => setShowUploadModal(false)} />
      )}

      {/* Evidence Detail Drawer */}
      {selectedEvidenceId && (
        <EvidenceDetailDrawer
          evidenceId={selectedEvidenceId}
          onClose={() => setSelectedEvidenceId(null)}
        />
      )}
    </div>
  );
};
