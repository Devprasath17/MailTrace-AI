import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    organizationId?: string;
    role?: string;
  };
}

export const authenticateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const supabase = getSupabaseAdmin();

  const isDevMode = env.LOCAL_DEV_STORE || !supabase;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (isDevMode) {
      req.user = {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'analyst@mailtrace.local',
        organizationId: '00000000-0000-0000-0000-000000000001',
        role: 'SUPER_ADMIN'
      };
      return next();
    }
    return res.status(401).json({ error: 'Authentication required. Authorization header missing.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!supabase) {
      if (isDevMode) {
        req.user = {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'analyst@mailtrace.local',
          organizationId: '00000000-0000-0000-0000-000000000001',
          role: 'SUPER_ADMIN'
        };
        return next();
      }
      return res.status(401).json({ error: 'Supabase authentication service unavailable.' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      if (isDevMode) {
        req.user = {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'analyst@mailtrace.local',
          organizationId: '00000000-0000-0000-0000-000000000001',
          role: 'SUPER_ADMIN'
        };
        return next();
      }
      return res.status(401).json({ error: 'Invalid or expired authorization token.' });
    }

    // Fetch profile and organization mapping
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email || '',
      organizationId: profile?.organization_id || '00000000-0000-0000-0000-000000000001',
      role: profile?.role || 'SOC_ANALYST'
    };

    next();
  } catch (err: any) {
    if (isDevMode) {
      req.user = {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'analyst@mailtrace.local',
        organizationId: '00000000-0000-0000-0000-000000000001',
        role: 'SUPER_ADMIN'
      };
      return next();
    }
    return res.status(401).json({ error: 'Authentication check encountered an exception.' });
  }
};
