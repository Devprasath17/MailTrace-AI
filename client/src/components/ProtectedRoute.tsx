import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090d16] text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
          <span className="text-sm font-medium tracking-wide">Authenticating MailTrace AI Session...</span>
        </div>
      </div>
    );
  }

  // Development bypass if user is testing offline without Supabase auth connection
  if (!user && !import.meta.env.VITE_SUPABASE_URL?.includes('supabase')) {
    return <Outlet />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090d16] p-6 text-center">
        <div className="max-w-md rounded-xl border border-rose-950 bg-rose-950/20 p-8 text-slate-200 shadow-2xl">
          <h2 className="text-xl font-bold text-rose-400">Access Denied</h2>
          <p className="mt-2 text-sm text-slate-400">Your role ({profile.role}) does not have permission to view this security resource.</p>
          <a href="/dashboard" className="mt-6 inline-block rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold hover:bg-slate-700">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
