import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Shield, 
  LayoutDashboard, 
  SearchCode, 
  Briefcase, 
  Fingerprint, 
  History, 
  Cpu, 
  Settings,
  Lock,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { profile } = useAuth();
  const userRole = profile?.role || 'SOC_ANALYST';

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Analyze Email', path: '/analyze', icon: SearchCode, roles: ['SUPER_ADMIN', 'SECURITY_ADMIN', 'SOC_ANALYST', 'INCIDENT_RESPONDER'] },
    { label: 'Investigations', path: '/investigations', icon: Briefcase },
    { label: 'Indicators (IOCs)', path: '/indicators', icon: Fingerprint },
    { label: 'Evidence Vault', path: '/evidence', icon: Lock },
    { label: 'Integrations', path: '/integrations', icon: Cpu },
    { label: 'Audit Logs', path: '/audit-logs', icon: History, roles: ['SUPER_ADMIN', 'SECURITY_ADMIN'] },
    { label: 'Settings', path: '/settings', icon: Settings }
  ];

  const filteredNav = navItems.filter(item => !item.roles || item.roles.includes(userRole));

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800/80 bg-[#0b101d] transition-transform duration-300 lg:static lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <Link 
          to="/dashboard" 
          onClick={() => setMobileOpen(false)}
          className="flex h-16 items-center gap-3 border-b border-slate-800/80 px-5 hover:bg-slate-900/40 transition-colors"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-100">MailTrace <span className="text-cyan-400">AI</span></span>
            <span className="block text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Forensic Platform</span>
          </div>
        </Link>

        {/* Organization Badge */}
        <div className="mx-3 mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Organization</span>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 truncate">{profile?.organization_name || 'MailTrace Security'}</span>
            <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-bold text-cyan-400 border border-cyan-500/20">{userRole}</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="mt-4 flex-1 space-y-1 px-3">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="h-3 w-3 opacity-40" />
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-800/80 p-4 text-[11px] text-slate-500 flex justify-between items-center">
          <span>v1.0.0 — Production</span>
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="System Operational"></span>
        </div>
      </aside>
    </>
  );
};
