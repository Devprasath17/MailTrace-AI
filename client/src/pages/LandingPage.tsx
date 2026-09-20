import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, SearchCode, Cpu, Lock, Fingerprint, Network, ChevronRight, CheckCircle2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-[#0b101d]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">MailTrace <span className="text-cyan-400">AI</span></span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-xs font-semibold text-slate-300 hover:text-slate-100 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 mb-6">
          <Shield className="h-3.5 w-3.5" />
          <span>Enterprise Email Forensic Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-100 max-w-4xl mx-auto leading-tight">
          From suspicious email to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">actionable forensic intelligence</span>.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Detect email spoofing, parse authentication signals, query live threat intelligence, leverage Gemini AI for attack explanations, and preserve cryptographic evidence integrity.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/analyze" className="flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 transition-all">
            <span>Analyze an Email</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link to="/login" className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-6 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors">
            <span>SOC Analyst Login</span>
          </Link>
        </div>
      </section>

      {/* Core Capability Grid */}
      <section className="py-16 bg-[#0b101d] border-y border-slate-800/80 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">Designed for SOC & Incident Response Teams</h2>
            <p className="mt-2 text-sm text-slate-400">Everything needed to dissect, correlate, and preserve email threat evidence.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <SearchCode className="h-6 w-6 text-cyan-400 mb-4" />
              <h3 className="text-base font-bold text-slate-200">Native Email Parser</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">Parses raw .EML headers, extract SPF/DKIM/DMARC alignment status, and builds deterministic Received hop timeline routes.</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <Cpu className="h-6 w-6 text-blue-400 mb-4" />
              <h3 className="text-base font-bold text-slate-200">Gemini AI Threat Classifier</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">Leverages Google Gemini to categorize attacks (BEC, Phishing, Malware), explain social engineering signals, and advise remediations.</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <Fingerprint className="h-6 w-6 text-emerald-400 mb-4" />
              <h3 className="text-base font-bold text-slate-200">VirusTotal & GeoIP Threat Intel</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">Runs automated reputation queries on extracted IPs, domains, and URLs with automatic private network detection.</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <Network className="h-6 w-6 text-amber-400 mb-4" />
              <h3 className="text-base font-bold text-slate-200">Interactive Investigation Graph</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">Visualizes relational entity links across Emails, Senders, Domains, URLs, IPs, and Geolocation nodes in React Flow.</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <Lock className="h-6 w-6 text-rose-400 mb-4" />
              <h3 className="text-base font-bold text-slate-200">SHA-256 Evidence Integrity</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">Computes verified SHA-256 digests for all submitted raw evidence stored securely in Supabase Storage.</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <CheckCircle2 className="h-6 w-6 text-cyan-400 mb-4" />
              <h3 className="text-base font-bold text-slate-200">Explainable Risk Engine</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">Deterministic signal-based scoring algorithm delivering full itemized breakdown for every risk point awarded.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-xs text-slate-500 border-t border-slate-800/80">
        <p>MailTrace AI — Detect. Trace. Explain. Investigate.</p>
      </footer>
    </div>
  );
};
