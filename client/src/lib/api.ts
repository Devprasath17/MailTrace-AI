import axios from 'axios';
import { supabase, isSupabaseConfigured } from './supabase';

const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl && envUrl.trim() !== '') {
    const cleanUrl = envUrl.trim().replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  
  // If running locally in browser, default to backend port 5000
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api';
  }
  
  // Fallback for production relative proxying
  return '/api';
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auto-attach Supabase Auth Token to Express API calls if Supabase is configured
api.interceptors.request.use(async (config) => {
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        config.headers.Authorization = `Bearer ${data.session.access_token}`;
      }
    } catch (err) {
      // Ignore network errors on session check
    }
  }
  return config;
});
