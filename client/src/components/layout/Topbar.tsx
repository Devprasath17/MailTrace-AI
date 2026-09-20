import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, Bell, User, LogOut, Search, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopbarProps {
  setMobileOpen: (open: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ setMobileOpen }) => {
  const { profile, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/investigations?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-[#0b101d]/90 px-4 backdrop-blur-md lg:px-6">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setMobileOpen(true)}
          className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-72 lg:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cases, IPs, domains, hashes... (Press Enter)" 
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-1.5 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
        </form>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg border border-slate-800 p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-cyan-400"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-800 bg-[#0b101d] p-4 text-xs shadow-2xl z-50">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                <span className="font-bold text-slate-200">Security System Notifications</span>
                <button onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-slate-300">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="rounded-lg bg-slate-900 p-2.5 text-slate-300">
                  <span className="font-bold text-cyan-400 block">MailTrace Engine Online</span>
                  <span className="text-[11px] text-slate-400">All email parsing and forensic risk scoring services are fully operational.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-800"></div>

        {/* User Profile Badge (Clickable to Settings) */}
        <Link to="/settings" className="flex items-center gap-3 rounded-lg p-1 hover:bg-slate-800/50 transition-colors">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden text-left md:block">
            <span className="block text-xs font-semibold text-slate-200">{profile?.full_name || 'Security Analyst'}</span>
            <span className="block text-[10px] text-slate-400">{profile?.role || 'SOC_ANALYST'}</span>
          </div>
        </Link>

        <button 
          onClick={() => logout()}
          title="Sign Out"
          className="ml-1 rounded-lg p-1.5 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
