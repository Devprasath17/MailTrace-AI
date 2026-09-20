import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  FileText, 
  SearchCode, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Cpu, 
  Lock, 
  Network, 
  Globe, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api } from '../lib/api';

export const AnalyzeEmail: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleRunAnalysis = async () => {
    setError('');
    if (activeTab === 'upload' && !file) {
      setError('Please select an .EML email file to analyze.');
      return;
    }
    if (activeTab === 'paste' && !rawText.trim()) {
      setError('Please paste raw email headers or body text.');
      return;
    }

    setAnalyzing(true);
    setProgressStep('Parsing headers & metadata...');

    try {
      const formData = new FormData();
      if (activeTab === 'upload' && file) {
        formData.append('emlFile', file);
      } else {
        formData.append('rawHeaders', rawText);
      }

      setTimeout(() => setProgressStep('Checking SPF, DKIM, DMARC authentication...'), 600);
      setTimeout(() => setProgressStep('Querying VirusTotal & IP Geolocation threat intelligence...'), 1200);
      setTimeout(() => setProgressStep('Running Google Gemini AI threat classification...'), 1800);
      setTimeout(() => setProgressStep('Computing SHA-256 evidence integrity hash...'), 2400);

      const res = await api.post('/email/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setAnalysisResult(res.data);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.error || 'Failed to complete email analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="border-b border-slate-800/80 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
          <SearchCode className="h-5 w-5 text-cyan-400" />
          <span>Email Threat Forensic Hub</span>
        </h1>
        <p className="mt-0.5 text-xs text-slate-400">Upload `.EML` files or paste raw headers for real-time threat intelligence lookups</p>
      </div>

      {/* Input Selection Card */}
      {!analysisResult && (
        <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-6 shadow-xl space-y-6">
          <div className="flex gap-4 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'upload' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UploadCloud className="h-4 w-4" />
              <span>Upload .EML File</span>
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'paste' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Paste Raw Headers / Body</span>
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-950 bg-rose-950/40 p-3 text-xs text-rose-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'upload' ? (
            <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center hover:border-cyan-500/40 transition-colors bg-slate-900/30">
              <UploadCloud className="mx-auto h-10 w-10 text-cyan-400 mb-3" />
              <label className="cursor-pointer text-xs font-bold text-cyan-400 hover:underline">
                <span>Select an .eml email file</span>
                <input type="file" accept=".eml,.msg" onChange={handleFileChange} className="hidden" />
              </label>
              <p className="mt-1 text-[11px] text-slate-500">Supports standard MIME .EML forensic email formats (Max 15MB)</p>
              {file && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-200 border border-slate-700">
                  <FileText className="h-4 w-4 text-cyan-400" />
                  <span className="font-semibold">{file.name}</span>
                  <span className="text-[10px] text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Raw Email Headers & MIME Body</label>
              <textarea
                rows={10}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste RFC 822 / MIME raw email headers starting with Received:, From:, Subject:..."
                className="w-full rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
                  <span>Analyzing Email...</span>
                </>
              ) : (
                <>
                  <SearchCode className="h-4 w-4" />
                  <span>Execute Forensic Analysis</span>
                </>
              )}
            </button>
          </div>

          {analyzing && (
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4 text-center">
              <span className="block text-xs font-bold text-cyan-400 animate-pulse">{progressStep}</span>
            </div>
          )}
        </div>
      )}

      {/* Analysis Output View */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Header Summary Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-800 bg-[#0b101d] p-5 gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Case Reference</span>
              <h2 className="text-lg font-bold text-slate-100 font-mono">{analysisResult.caseNumber}</h2>
              <p className="text-xs text-slate-400 mt-1">Subject: <span className="text-slate-200 font-medium">{analysisResult.parsedEmail.subject}</span></p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setAnalysisResult(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
              >
                Analyze Another Email
              </button>
              <button
                onClick={() => navigate(`/investigations/${analysisResult.investigationId}`)}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400"
              >
                <span>Open Case</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Risk Score Gauge & Authentication Badges */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Score Widget */}
            <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-6 text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">MailTrace Risk Score</span>
              <div className="mt-4 flex justify-center">
                <div className={`flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 ${
                  analysisResult.riskAnalysis.riskScore >= 75 ? 'border-rose-500 text-rose-400' :
                  analysisResult.riskAnalysis.riskScore >= 40 ? 'border-amber-500 text-amber-400' :
                  'border-emerald-500 text-emerald-400'
                }`}>
                  <span className="text-3xl font-extrabold">{analysisResult.riskAnalysis.riskScore}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">/ 100</span>
                </div>
              </div>
              <span className={`mt-3 inline-block rounded px-2.5 py-0.5 text-xs font-bold ${
                analysisResult.riskAnalysis.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                analysisResult.riskAnalysis.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {analysisResult.riskAnalysis.severity} SEVERITY — {analysisResult.riskAnalysis.threatType}
              </span>
            </div>

            {/* Authentication Signals (SPF / DKIM / DMARC) */}
            <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0b101d] p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Email Authentication Verification</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">SPF Result</span>
                  <div className="mt-1 flex items-center justify-center gap-1 font-bold text-xs">
                    {analysisResult.parsedEmail.spfStatus === 'PASS' ? (
                      <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> PASS</span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1"><XCircle className="h-4 w-4" /> {analysisResult.parsedEmail.spfStatus}</span>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">DKIM Result</span>
                  <div className="mt-1 flex items-center justify-center gap-1 font-bold text-xs">
                    {analysisResult.parsedEmail.dkimStatus === 'PASS' ? (
                      <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> PASS</span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> {analysisResult.parsedEmail.dkimStatus}</span>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">DMARC Result</span>
                  <div className="mt-1 flex items-center justify-center gap-1 font-bold text-xs">
                    {analysisResult.parsedEmail.dmarcStatus === 'PASS' ? (
                      <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> PASS</span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1"><XCircle className="h-4 w-4" /> {analysisResult.parsedEmail.dmarcStatus}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sender Details */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs space-y-1">
                <div><span className="text-slate-500 font-medium">From:</span> <span className="text-slate-200 font-mono">{analysisResult.parsedEmail.fromAddress}</span></div>
                <div><span className="text-slate-500 font-medium">Reply-To:</span> <span className="text-slate-200 font-mono">{analysisResult.parsedEmail.replyTo || 'None'}</span></div>
                <div><span className="text-slate-500 font-medium">Return-Path:</span> <span className="text-slate-200 font-mono">{analysisResult.parsedEmail.returnPath || 'None'}</span></div>
              </div>
            </div>
          </div>

          {/* Gemini AI Explanation Section */}
          <div className="rounded-xl border border-cyan-500/30 bg-[#0b101d] p-6 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400">
              <Cpu className="h-5 w-5" />
              <h3 className="text-sm font-bold">Google Gemini AI Threat Explanation</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{analysisResult.aiAnalysis.result?.explanation}</p>

            {analysisResult.aiAnalysis.result?.riskFactors?.length > 0 && (
              <div className="mt-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">Observed Risk Factors:</span>
                <ul className="mt-1 space-y-1">
                  {analysisResult.aiAnalysis.result.riskFactors.map((rf: string, idx: number) => (
                    <li key={idx} className="text-xs text-amber-300 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                      <span>{rf}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Itemized Risk Breakdown */}
          <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Explainable Risk Signal Audit</h3>
            <div className="space-y-2">
              {analysisResult.riskAnalysis.signals.map((sig: any, index: number) => (
                <div key={index} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs">
                  <div>
                    <span className="font-bold text-rose-400">+{sig.score} Pts</span>
                    <span className="ml-3 font-semibold text-slate-200">{sig.title}</span>
                    <p className="text-slate-400 mt-0.5 text-[11px]">{sig.description}</p>
                  </div>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">{sig.code}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cryptographic Evidence Hash Integrity */}
          <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-emerald-400" />
              <div>
                <span className="font-bold text-slate-200">Evidence SHA-256 Digest Verified</span>
                <span className="block text-[11px] font-mono text-slate-400">{analysisResult.parsedEmail.sha256Hash}</span>
              </div>
            </div>
            <span className="rounded bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
              Integrity Preserved
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
