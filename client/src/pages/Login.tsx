import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await login(email, password);
    setLoading(false);

    if (err) {
      if (err.message?.toLowerCase().includes('email not confirmed')) {
        setError('Email not confirmed. Please check your email inbox to confirm your account, or disable "Confirm Email" in your Supabase Auth Provider settings for instant login.');
      } else {
        setError(err.message || 'Invalid email or password credentials.');
      }
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090d16] px-4 py-12 text-slate-100 font-sans">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight">MailTrace AI Login</h2>
          <p className="mt-1 text-xs text-slate-400">Sign in to your SOC analyst workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-[#0b101d] p-6 shadow-2xl space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-950 bg-rose-950/40 p-3 text-xs text-rose-300 space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Authentication Error</span>
              </div>
              <p className="text-[11px] leading-relaxed">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300">Work Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@organization.com"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-4 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-4 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Workspace'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Don't have an analyst account?{' '}
          <Link to="/register" className="font-semibold text-cyan-400 hover:underline">
            Register Organization
          </Link>
        </p>
      </div>
    </div>
  );
};
