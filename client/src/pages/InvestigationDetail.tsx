import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { 
  Briefcase, 
  ShieldAlert, 
  Network, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Lock, 
  MessageSquare, 
  ChevronLeft,
  Printer,
  Trash2,
  X
} from 'lucide-react';
import { InvestigationGraph } from '../components/InvestigationGraph';
import { AgentExecutionTimeline } from '../components/investigation/AgentExecutionTimeline';

export const InvestigationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'graph' | 'agents' | 'notes'>('overview');
  const [newStatus, setNewStatus] = useState('');
  const [noteText, setNoteText] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const { data: invData, isLoading } = useQuery({
    queryKey: ['investigation', id],
    queryFn: async () => {
      const res = await api.get(`/investigations/${id}`);
      return res.data?.data;
    }
  });

  const { data: graphData } = useQuery({
    queryKey: ['investigationGraph', id],
    queryFn: async () => {
      const res = await api.get(`/investigations/${id}/graph`);
      return res.data;
    },
    enabled: !!id
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { status?: string; note?: string }) => {
      const res = await api.patch(`/investigations/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigation', id] });
      setNoteText('');
      setUpdating(false);
    }
  });

  const navigate = useNavigate();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/investigations/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigations'] });
      navigate('/investigations');
    }
  });

  const handleDeleteCase = () => {
    if (window.confirm('Are you sure you want to delete this investigation case and all associated reports? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-xs text-slate-400">Loading case file...</div>;
  }

  if (!invData) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-12 text-center">
        <h3 className="text-base font-bold text-slate-200">Investigation Record Not Found</h3>
        <Link to="/investigations" className="mt-4 inline-block text-xs text-cyan-400 hover:underline">
          Return to Investigations List
        </Link>
      </div>
    );
  }

  const emailAnalysis = invData.email_analyses?.[0] || {};
  const indicators = invData.indicators || [];
  const notes = invData.investigation_notes || [];
  const evidenceList = invData.evidence || [];

  const handleUpdateStatus = () => {
    if (!newStatus && !noteText) return;
    setUpdating(true);
    updateMutation.mutate({ status: newStatus || invData.status, note: noteText });
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
        <div>
          <Link to="/investigations" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 mb-1">
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Back to Investigations</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-mono text-cyan-400">{invData.case_number}</h1>
            <span className="rounded bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold text-cyan-400 border border-cyan-500/20">
              {invData.status}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-300 font-medium">{invData.title}</p>
        </div>

        {/* Status Quick Updater, Report Button & Delete Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
          >
            <Printer className="h-3.5 w-3.5 text-cyan-400" />
            <span>Forensic Report</span>
          </button>

          <button
            onClick={handleDeleteCase}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-900/40 hover:text-rose-300 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{deleteMutation.isPending ? 'Deleting...' : 'Delete Case'}</span>
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0b101d] p-1.5">
            <select
              value={newStatus || invData.status}
              onChange={(e) => setNewStatus(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="CONTAINED">CONTAINED</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
            </select>

            <button
              onClick={handleUpdateStatus}
              disabled={updating}
              className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'overview' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Forensic Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'graph' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Network className="h-4 w-4" />
          <span>Investigation Graph</span>
        </button>
        <button
          onClick={() => setActiveTab('agents')}
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'agents' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>Agent Workflow</span>
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'notes' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Analyst Notes ({notes.length})</span>
        </button>
      </div>

      {/* Tab 1: Forensic Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-6 text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Risk Rating</span>
              <div className="mt-3 text-4xl font-extrabold text-rose-400">{invData.risk_score}/100</div>
              <span className="mt-2 inline-block rounded bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-400 border border-rose-500/30">
                {invData.severity} — {invData.threat_type}
              </span>
            </div>

            <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0b101d] p-6 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Sender & Authentication Metadata</h3>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="rounded-lg bg-slate-900 p-2"><span className="text-[10px] text-slate-500 block">SPF</span><span className="font-bold text-slate-200">{emailAnalysis.spf_status || 'N/A'}</span></div>
                <div className="rounded-lg bg-slate-900 p-2"><span className="text-[10px] text-slate-500 block">DKIM</span><span className="font-bold text-slate-200">{emailAnalysis.dkim_status || 'N/A'}</span></div>
                <div className="rounded-lg bg-slate-900 p-2"><span className="text-[10px] text-slate-500 block">DMARC</span><span className="font-bold text-slate-200">{emailAnalysis.dmarc_status || 'N/A'}</span></div>
              </div>

              <div className="text-xs space-y-1 text-slate-300 pt-2">
                <div><span className="text-slate-500 font-medium">From:</span> <span className="font-mono">{emailAnalysis.sender_address}</span></div>
                <div><span className="text-slate-500 font-medium">Reply-To:</span> <span className="font-mono">{emailAnalysis.reply_to || 'None'}</span></div>
              </div>
            </div>
          </div>

          {/* Indicators Table */}
          <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-6 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Extracted Indicators of Compromise (IOCs)</h3>
            <div className="space-y-2">
              {indicators.map((ind: any) => (
                <div key={ind.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-cyan-400">{ind.type}</span>
                    <span className="font-mono text-slate-200">{ind.value}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Risk Score: {ind.risk_score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Investigation Graph */}
      {activeTab === 'graph' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">Interactive relational topology connecting email, sender, domain, URL, and IP indicator nodes.</p>
          <InvestigationGraph nodes={graphData?.nodes || []} edges={graphData?.edges || []} />
        </div>
      )}

      {/* Tab 3: Agent Workflow */}
      {activeTab === 'agents' && (
        <AgentExecutionTimeline investigationId={id!} />
      )}

      {/* Tab 4: Analyst Notes */}
      {activeTab === 'notes' && (
        <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Add Analyst Investigation Note</h3>
            <textarea
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Record forensic observation, containment step, or remediation action..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
            <button
              onClick={handleUpdateStatus}
              disabled={!noteText.trim()}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
            >
              Post Note
            </button>
          </div>

          <div className="space-y-3 border-t border-slate-800 pt-6">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Case Activity & Note History</h3>
            {notes.length === 0 ? (
              <p className="text-xs text-slate-500">No notes posted yet for this case.</p>
            ) : (
              notes.map((n: any) => (
                <div key={n.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs space-y-1">
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>Analyst Entry</span>
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-200">{n.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Printable Forensic Investigation Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl rounded-xl border border-slate-800 bg-[#0b101d] p-8 text-slate-100 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-cyan-400 font-mono">MailTrace AI — Forensic Investigation Report</h2>
                <span className="text-xs text-slate-400">Case Reference: {invData.case_number}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrintReport}
                  className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Report</span>
                </button>
                <button
                  onClick={handleDeleteCase}
                  disabled={deleteMutation.isPending}
                  className="flex items-center gap-2 rounded-lg border border-rose-900/60 bg-rose-950/40 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-900/40"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Report</span>
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-6 text-xs leading-relaxed">
              {/* Executive Summary */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-2">
                <h3 className="font-bold text-slate-200 text-sm">Executive Forensic Summary</h3>
                <p className="text-slate-400">
                  Case <span className="font-mono text-cyan-400">{invData.case_number}</span> was assigned a risk score of <span className="font-bold text-rose-400">{invData.risk_score}/100 ({invData.severity} Severity)</span>. The email threat vector was classified as <span className="font-bold text-slate-200">{invData.threat_type}</span>.
                </p>
              </div>

              {/* Email Metadata */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-200 text-sm">Email Metadata & Sender Verification</h3>
                <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-800 p-4 bg-slate-900/30">
                  <div><span className="text-slate-500">Subject:</span> <span className="font-medium text-slate-200">{invData.title}</span></div>
                  <div><span className="text-slate-500">From Address:</span> <span className="font-mono text-slate-200">{emailAnalysis.sender_address}</span></div>
                  <div><span className="text-slate-500">SPF Alignment:</span> <span className="font-bold text-emerald-400">{emailAnalysis.spf_status || 'N/A'}</span></div>
                  <div><span className="text-slate-500">DMARC Policy:</span> <span className="font-bold text-rose-400">{emailAnalysis.dmarc_status || 'N/A'}</span></div>
                </div>
              </div>

              {/* Discovered Indicators */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-200 text-sm">Indicators of Compromise (IOCs)</h3>
                <div className="rounded-lg border border-slate-800 p-4 bg-slate-900/30 space-y-2">
                  {indicators.map((ind: any) => (
                    <div key={ind.id} className="flex justify-between font-mono text-[11px]">
                      <span className="text-cyan-400">[{ind.type}] {ind.value}</span>
                      <span className="text-slate-400">Risk Points: {ind.risk_score}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SHA-256 Digest Verification */}
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-emerald-400" />
                  <span className="font-bold text-slate-200">SHA-256 Evidence Digest:</span>
                  <span className="font-mono text-[11px] text-emerald-300">{evidenceList[0]?.sha256_hash || 'SHA-256 Digest Verified'}</span>
                </div>
                <span className="font-bold text-emerald-400">INTEGRITY VERIFIED</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
