import axios from 'axios';
import { EmailParserService } from '../services/emailParser.service.js';
import { ThreatIntelResult } from '../types/index.js';

export class GeoIPService {
  /**
   * Geolocate public IP addresses
   */
  public static async geolocateIp(ip: string): Promise<ThreatIntelResult> {
    if (EmailParserService.isPrivateIp(ip)) {
      return {
        provider: 'IP_Geolocation',
        indicator: ip,
        status: 'FOUND',
        details: {
          isPrivate: true,
          label: 'Private/local IP — public geolocation unavailable',
          country: 'Internal Network',
          countryCode: 'INT',
          region: 'Private Range',
          city: 'Local',
          org: 'Private Infrastructure'
        }
      };
    }

    try {
      const response = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 5000 });
      const data = response.data;

      if (data.error) {
        return {
          provider: 'IP_Geolocation',
          indicator: ip,
          status: 'NOT_FOUND',
          details: { message: data.reason || 'IP geolocation lookup failed' }
        };
      }

      return {
        provider: 'IP_Geolocation',
        indicator: ip,
        status: 'FOUND',
        details: {
          isPrivate: false,
          country: data.country_name || 'Unknown',
          countryCode: data.country_code || '',
          region: data.region || 'Unknown',
          city: data.city || 'Unknown',
          latitude: data.latitude,
          longitude: data.longitude,
          asn: data.asn,
          org: data.org || data.asn_org || 'Unknown Provider',
          label: 'IP Geolocation'
        }
      };
    } catch (error: any) {
      console.error(`GeoIP lookup error for ${ip}:`, error?.message);
      return {
        provider: 'IP_Geolocation',
        indicator: ip,
        status: 'ERROR',
        details: { message: 'Geolocation service query failed.' }
      };
    }
  }
}
