import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Shield, User, Building } from 'lucide-react';

export const Settings: React.FC = () => {
  const { profile, user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800/80 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
          <SettingsIcon className="h-5 w-5 text-cyan-400" />
          <span>Analyst Profile & Security Settings</span>
        </h1>
        <p className="mt-0.5 text-xs text-slate-400">View user role, assigned organization, and Supabase security configuration</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#0b101d] p-6 max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">{profile?.full_name || 'Security Analyst'}</h2>
            <p className="text-xs text-slate-400">{user?.email || 'analyst@mailtrace.local'}</p>
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-800 pt-6 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
            <span className="text-slate-400 font-medium">Assigned Organization</span>
            <span className="font-semibold text-slate-200">{profile?.organization_name || 'MailTrace SOC'}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
            <span className="text-slate-400 font-medium">RBAC Security Role</span>
            <span className="rounded bg-cyan-500/10 px-2.5 py-0.5 font-bold text-cyan-400 border border-cyan-500/20">
              {profile?.role || 'SOC_ANALYST'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
            <span className="text-slate-400 font-medium">PostgreSQL RLS Status</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" /> Row Level Security Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
