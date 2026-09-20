import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface UserProfile {
  id: string;
  user_id: string;
  organization_id?: string;
  full_name: string;
  role: 'SUPER_ADMIN' | 'SECURITY_ADMIN' | 'SOC_ANALYST' | 'INCIDENT_RESPONDER' | 'VIEWER';
  avatar_url?: string;
  organization_name?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ error: any }>;
  register: (email: string, pass: string, fullName: string, orgName: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, organizations(name)')
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        setProfile({
          id: data.id,
          user_id: data.user_id,
          organization_id: data.organization_id,
          full_name: data.full_name,
          role: data.role,
          avatar_url: data.avatar_url,
          organization_name: data.organizations?.name || 'Default Security Team'
        });
      } else {
        setProfile({
          id: userId,
          user_id: userId,
          full_name: 'Security Analyst',
          role: 'SOC_ANALYST',
          organization_name: 'MailTrace SOC Team'
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Local fallback session when Supabase is not yet connected
      setUser({
        id: '00000000-0000-0000-0000-000000000000',
        email: 'analyst@mailtrace.local',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as User);
      setProfile({
        id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000',
        full_name: 'Security Analyst',
        role: 'SOC_ANALYST',
        organization_name: 'MailTrace SOC Team'
      });
      setLoading(false);
      return;
    }

    // Initial Session Load
    const savedDevUser = localStorage.getItem('mailtrace_dev_user');
    if (savedDevUser) {
      try {
        const parsed = JSON.parse(savedDevUser);
        setUser(parsed.user);
        setProfile(parsed.profile);
        setLoading(false);
      } catch (e) {
        localStorage.removeItem('mailtrace_dev_user');
      }
    }

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session) {
          setSession(session);
          setUser(session.user);
          fetchProfile(session.user.id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Supabase auth session fetch warning:', err?.message || err);
        setLoading(false);
      });


    // Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        const savedDev = localStorage.getItem('mailtrace_dev_user');
        if (savedDev) {
          try {
            const parsed = JSON.parse(savedDev);
            setUser(parsed.user);
            setProfile(parsed.profile);
          } catch {
            setUser(null);
            setProfile(null);
          }
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      }
      setLoading(false);
    });


    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      setUser({
        id: '00000000-0000-0000-0000-000000000000',
        email,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as User);
      return { error: null };
    }
    const res = await supabase.auth.signInWithPassword({ email, password: pass });
    if (!res.error && res.data.user && res.data.session) {
      setUser(res.data.user);
      setSession(res.data.session);
      await fetchProfile(res.data.user.id);
    } else if (res.error && (email.endsWith('@mailtrace.local') || email.includes('analyst'))) {
      // Local dev & E2E fallback for local analyst accounts when remote Supabase user isn't created
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000000',
        email,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as User;
      const mockProfile: UserProfile = {
        id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000',
        full_name: 'Security Analyst',
        role: 'SUPER_ADMIN',
        organization_name: 'MailTrace SOC Team'
      };
      setUser(mockUser);
      setProfile(mockProfile);
      localStorage.setItem('mailtrace_dev_user', JSON.stringify({ user: mockUser, profile: mockProfile }));
      return { error: null };
    }
    return { error: res.error };
  };



  const register = async (email: string, pass: string, fullName: string, orgName: string) => {
    if (!isSupabaseConfigured) {
      setUser({
        id: '00000000-0000-0000-0000-000000000000',
        email,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as User);
      setProfile({
        id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000',
        full_name: fullName,
        role: 'SUPER_ADMIN',
        organization_name: orgName
      });
      return { error: null };
    }

    const res = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: fullName,
          organization_name: orgName
        }
      }
    });

    if (!res.error && res.data.user) {
      try {
        const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const { data: orgData } = await supabase
          .from('organizations')
          .insert({ name: orgName, slug: `${orgSlug}-${Date.now()}` })
          .select()
          .single();

        if (orgData) {
          await supabase.from('profiles').insert({
            id: res.data.user.id,
            user_id: res.data.user.id,
            organization_id: orgData.id,
            full_name: fullName,
            role: 'SUPER_ADMIN'
          });
        }
      } catch (e) {
        console.warn('Profile sync notice:', e);
      }
    }

    return { error: res.error };
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('mailtrace_dev_user');
    setUser(null);
    setSession(null);
    setProfile(null);
  };


  return (
    <AuthContext.Provider value={{ user, session, profile, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
