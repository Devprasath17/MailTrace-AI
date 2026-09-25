import axios from 'axios';
import { supabase, isSupabaseConfigured } from './supabase';

const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl && envUrl.trim() !== '' && envUrl !== '/api') {
    const cleanUrl = envUrl.trim().replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  
  // If running locally in browser, default to backend port 5000
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api';
  }
  
  // Direct production fallback to live Render backend service
  return 'https://mailtrace-ai-server.onrender.com/api';
};

export const api = axios.create({
  baseURL: getBaseUrl()
});

// Auto-attach Supabase Auth Token and handle FormData boundaries
api.interceptors.request.use(async (config) => {
  // If request data is FormData, remove Content-Type header to allow Axios/browser to set boundary automatically
  if (config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }

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
