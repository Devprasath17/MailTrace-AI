import axios from 'axios';
import { supabase, isSupabaseConfigured } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`,
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
