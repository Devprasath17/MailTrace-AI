import axios from 'axios';
import { env } from '../config/env.js';
import { ThreatIntelResult } from '../types/index.js';

export class VirusTotalService {
  private static readonly BASE_URL = 'https://www.virustotal.com/api/v3';

  /**
   * Check reputation of an IP, domain, or URL on VirusTotal
   */
  public static async checkIndicator(type: 'IP' | 'DOMAIN' | 'URL', value: string): Promise<ThreatIntelResult> {
    if (!env.VIRUSTOTAL_API_KEY) {
      return {
        provider: 'VirusTotal',
        indicator: value,
        status: 'UNCONFIGURED',
        details: { message: 'VirusTotal integration is not configured. Add VIRUSTOTAL_API_KEY in server settings.' }
      };
    }

    try {
      let endpoint = '';

      if (type === 'IP') {
        endpoint = `${this.BASE_URL}/ip_addresses/${encodeURIComponent(value)}`;
      } else if (type === 'DOMAIN') {
        endpoint = `${this.BASE_URL}/domains/${encodeURIComponent(value)}`;
      } else if (type === 'URL') {
        // VirusTotal URL ID is base64url without padding
        const urlId = Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        endpoint = `${this.BASE_URL}/urls/${urlId}`;
      } else {
        return {
          provider: 'VirusTotal',
          indicator: value,
          status: 'NOT_FOUND',
          details: { message: 'Unsupported indicator type for VirusTotal lookup.' }
        };
      }

      const response = await axios.get(endpoint, {
        headers: { 'x-apikey': env.VIRUSTOTAL_API_KEY },
        timeout: 8000
      });

      const stats = response.data?.data?.attributes?.last_analysis_stats || {};
      const reputation = response.data?.data?.attributes?.reputation || 0;

      return {
        provider: 'VirusTotal',
        indicator: value,
        status: 'FOUND',
        reputation,
        maliciousCount: stats.malicious || 0,
        suspiciousCount: stats.suspicious || 0,
        harmlessCount: stats.harmless || 0,
        details: {
          lastAnalysisDate: response.data?.data?.attributes?.last_analysis_date,
          tags: response.data?.data?.attributes?.tags || []
        }
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          provider: 'VirusTotal',
          indicator: value,
          status: 'NOT_FOUND',
          maliciousCount: 0,
          suspiciousCount: 0,
          harmlessCount: 0,
          details: { message: 'Indicator not found in VirusTotal database.' }
        };
      }

      console.error(`VirusTotal lookup error for ${value}:`, error?.message);
      return {
        provider: 'VirusTotal',
        indicator: value,
        status: 'ERROR',
        details: { message: `VirusTotal query failed: ${error?.message || 'Network Error'}` }
      };
    }
  }
}
