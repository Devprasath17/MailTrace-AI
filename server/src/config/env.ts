import dotenv from 'dotenv';

dotenv.config();

export const env = {
  get PORT() {
    dotenv.config();
    return process.env.PORT || '5000';
  },
  get CLIENT_URL() {
    dotenv.config();
    return process.env.CLIENT_URL || 'http://localhost:5173';
  },
  get SUPABASE_URL() {
    dotenv.config();
    return process.env.SUPABASE_URL || '';
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    dotenv.config();
    return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  },
  get GEMINI_API_KEY() {
    dotenv.config();
    return process.env.GEMINI_API_KEY || '';
  },
  get VIRUSTOTAL_API_KEY() {
    dotenv.config();
    return process.env.VIRUSTOTAL_API_KEY || '';
  },
  get IP_GEOLOCATION_API_KEY() {
    dotenv.config();
    return process.env.IP_GEOLOCATION_API_KEY || '';
  },
  get LOCAL_DEV_STORE() {
    dotenv.config();
    return process.env.LOCAL_DEV_STORE === 'true';
  }
};
