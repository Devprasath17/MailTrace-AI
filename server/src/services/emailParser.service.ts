import { simpleParser, ParsedMail, HeaderValue } from 'mailparser';
import crypto from 'crypto';
import { ParsedEmailData, ReceivedHop, ExtractedUrl, ExtractedIndicator } from '../types/index.js';

export class EmailParserService {
  /**
   * Parse raw EML string or Buffer into structured forensic email data
   */
  public static async parseEmail(rawContent: Buffer | string): Promise<ParsedEmailData> {
    const contentBuffer = typeof rawContent === 'string' ? Buffer.from(rawContent, 'utf-8') : rawContent;
    const sha256Hash = crypto.createHash('sha256').update(contentBuffer).digest('hex');

    const parsed: ParsedMail = await simpleParser(contentBuffer);

    // Extract Basic Headers
    const fromObj = parsed.from?.value?.[0];
    const fromAddress = fromObj?.address?.toLowerCase() || '';
    const fromDisplayName = fromObj?.name || '';
    
    const replyTo = parsed.replyTo?.value?.[0]?.address?.toLowerCase() || '';
    
    const returnPathHeader = this.getHeaderString(parsed.headers, 'return-path');
    const returnPath = this.cleanEmailAddress(returnPathHeader) || '';

    const toAddresses = parsed.to ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to])
      .flatMap(addr => addr.value.map(v => v.address?.toLowerCase() || ''))
      .filter(Boolean) : [];

    const ccAddresses = parsed.cc ? (Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc])
      .flatMap(addr => addr.value.map(v => v.address?.toLowerCase() || ''))
      .filter(Boolean) : [];

    const bccAddresses = parsed.bcc ? (Array.isArray(parsed.bcc) ? parsed.bcc : [parsed.bcc])
      .flatMap(addr => addr.value.map(v => v.address?.toLowerCase() || ''))
      .filter(Boolean) : [];

    const subject = parsed.subject || '(No Subject)';
    const date = parsed.date ? parsed.date.toISOString() : undefined;
    const messageId = parsed.messageId || '';

    // Convert raw headers into text
    let rawHeaders = '';
    parsed.headers.forEach((val, key) => {
      rawHeaders += `${key}: ${this.formatHeaderValue(val)}\n`;
    });

    // Parse Authentication Results (SPF, DKIM, DMARC)
    const spfStatus = this.parseSpfStatus(parsed.headers, rawHeaders);
    const dkimStatus = this.parseDkimStatus(parsed.headers, rawHeaders);
    const dmarcStatus = this.parseDmarcStatus(parsed.headers, rawHeaders);

    // Parse Received Hop Routing Timeline
    const receivedHops = this.parseReceivedHops(parsed.headers);

    // Body Extraction
    const bodyPlain = parsed.text || '';
    const bodyHtml = typeof parsed.html === 'string' ? parsed.html : '';

    // Extract URLs, Domains, IPs
    const fullTextContent = `${bodyPlain} ${bodyHtml} ${rawHeaders}`;
    const urls = this.extractUrls(fullTextContent);
    const domains = this.extractDomains(fullTextContent, fromAddress, urls);
    const ips = this.extractIps(fullTextContent, receivedHops);

    // Aggregate Indicators of Compromise (IOCs)
    const indicators: ExtractedIndicator[] = [];

    ips.forEach(ip => {
      indicators.push({
        type: 'IP',
        value: ip,
        riskScore: this.isPrivateIp(ip) ? 0 : 20,
        metadata: { isPrivate: this.isPrivateIp(ip) }
      });
    });

    domains.forEach(domain => {
      indicators.push({
        type: 'DOMAIN',
        value: domain,
        riskScore: 10,
        metadata: {}
      });
    });

    urls.forEach(urlObj => {
      indicators.push({
        type: 'URL',
        value: urlObj.url,
        riskScore: urlObj.heuristics.length > 0 ? 40 : 15,
        metadata: { heuristics: urlObj.heuristics, domain: urlObj.domain }
      });
    });

    if (fromAddress) {
      indicators.push({
        type: 'EMAIL',
        value: fromAddress,
        riskScore: 5,
        metadata: { role: 'sender' }
      });
    }

    indicators.push({
      type: 'HASH',
      value: sha256Hash,
      riskScore: 0,
      metadata: { algorithm: 'SHA-256' }
    });

    return {
      fromAddress,
      fromDisplayName,
      replyTo,
      returnPath,
      toAddresses,
      ccAddresses,
      bccAddresses,
      subject,
      date,
      messageId,
      spfStatus,
      dkimStatus,
      dmarcStatus,
      rawHeaders,
      bodyPlain,
      bodyHtml,
      receivedHops,
      urls,
      domains,
      ips,
      indicators,
      sha256Hash
    };
  }

  // --- Helper Methods ---

  private static getHeaderString(headers: Map<string, HeaderValue>, key: string): string {
    const val = headers.get(key.toLowerCase());
    return val ? this.formatHeaderValue(val) : '';
  }

  private static formatHeaderValue(val: HeaderValue): string {
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.map(v => (typeof v === 'string' ? v : JSON.stringify(v))).join('; ');
    if (val && typeof val === 'object' && 'value' in val) return String(val.value);
    return JSON.stringify(val);
  }

  private static cleanEmailAddress(raw: string): string {
    const match = raw.match(/<([^>]+)>/) || raw.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return match ? match[1].toLowerCase() : raw.trim().toLowerCase();
  }

  private static parseSpfStatus(headers: Map<string, HeaderValue>, rawHeaders: string): ParsedEmailData['spfStatus'] {
    const authResults = this.getHeaderString(headers, 'authentication-results').toLowerCase();
    const receivedSpf = this.getHeaderString(headers, 'received-spf').toLowerCase();
    const combined = `${authResults} ${receivedSpf} ${rawHeaders.toLowerCase()}`;

    if (combined.includes('spf=pass') || combined.includes('spf pass')) return 'PASS';
    if (combined.includes('spf=fail') || combined.includes('spf fail') || combined.includes('spf=hardfail')) return 'FAIL';
    if (combined.includes('spf=softfail') || combined.includes('spf softfail')) return 'SOFTFAIL';
    if (combined.includes('spf=neutral') || combined.includes('spf neutral')) return 'NEUTRAL';
    if (combined.includes('spf=none')) return 'NONE';
    if (combined.includes('spf=temperror')) return 'TEMPERROR';
    if (combined.includes('spf=permerror')) return 'PERMERROR';

    return 'NOT_AVAILABLE';
  }

  private static parseDkimStatus(headers: Map<string, HeaderValue>, rawHeaders: string): ParsedEmailData['dkimStatus'] {
    const authResults = this.getHeaderString(headers, 'authentication-results').toLowerCase();
    const combined = `${authResults} ${rawHeaders.toLowerCase()}`;

    if (combined.includes('dkim=pass') || combined.includes('dkim pass')) return 'PASS';
    if (combined.includes('dkim=fail') || combined.includes('dkim fail')) return 'FAIL';
    if (combined.includes('dkim=neutral') || combined.includes('dkim neutral')) return 'NEUTRAL';
    if (combined.includes('dkim=none')) return 'NONE';

    return 'NOT_AVAILABLE';
  }

  private static parseDmarcStatus(headers: Map<string, HeaderValue>, rawHeaders: string): ParsedEmailData['dmarcStatus'] {
    const authResults = this.getHeaderString(headers, 'authentication-results').toLowerCase();
    const combined = `${authResults} ${rawHeaders.toLowerCase()}`;

    if (combined.includes('dmarc=pass') || combined.includes('dmarc pass')) return 'PASS';
    if (combined.includes('dmarc=fail') || combined.includes('dmarc fail') || combined.includes('dmarc=action=reject') || combined.includes('dmarc=action=quarantine')) return 'FAIL';
    if (combined.includes('dmarc=none')) return 'NONE';

    return 'NOT_AVAILABLE';
  }

  private static parseReceivedHops(headers: Map<string, HeaderValue>): ReceivedHop[] {
    const receivedVal = headers.get('received');
    if (!receivedVal) return [];

    const rawList: string[] = Array.isArray(receivedVal)
      ? receivedVal.map(v => this.formatHeaderValue(v))
      : [this.formatHeaderValue(receivedVal)];

    const hops: ReceivedHop[] = [];

    rawList.forEach((hopStr, index) => {
      const fromMatch = hopStr.match(/from\s+([^\s]+)/i);
      const byMatch = hopStr.match(/by\s+([^\s]+)/i);
      const ipMatch = hopStr.match(/\[(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]/);
      const dateMatch = hopStr.match(/;\s*(.+)$/);

      hops.push({
        hopOrder: index + 1,
        fromServer: fromMatch ? fromMatch[1] : undefined,
        byServer: byMatch ? byMatch[1] : undefined,
        senderIp: ipMatch ? ipMatch[1] : undefined,
        timestamp: dateMatch ? dateMatch[1].trim() : undefined
      });
    });

    return hops;
  }

  private static extractUrls(text: string): ExtractedUrl[] {
    const urlRegex = /(https?:\/\/[^\s<>"'{}|\\^`]+)/g;
    const matches = Array.from(new Set(text.match(urlRegex) || []));

    return matches.slice(0, 50).map(rawUrl => {
      let cleaned = rawUrl.replace(/[.,;)]+$/, '');
      let domain = '';
      let protocol = '';
      let hostname = '';
      let path = '';
      let query = '';
      const heuristics: string[] = [];

      try {
        const parsedUrl = new URL(cleaned);
        protocol = parsedUrl.protocol;
        hostname = parsedUrl.hostname;
        domain = hostname;
        path = parsedUrl.pathname;
        query = parsedUrl.search;

        // Heuristics Checks
        if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(hostname)) {
          heuristics.push('IP-based URL host');
        }
        if (['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'rb.gy', 'cutt.ly'].includes(hostname.toLowerCase())) {
          heuristics.push('URL shortener service');
        }
        if (hostname.split('.').length > 4) {
          heuristics.push('Excessive subdomain depth');
        }
        if (cleaned.length > 150) {
          heuristics.push('Unusually long URL length');
        }
        if (path.toLowerCase().includes('login') || path.toLowerCase().includes('verify') || path.toLowerCase().includes('signin') || path.toLowerCase().includes('account')) {
          heuristics.push('Credential harvesting keyword in path');
        }
        if (/\.[a-z]{2,}\.[a-z]{2,}/i.test(hostname) && !hostname.endsWith('.co.uk') && !hostname.endsWith('.com.au')) {
          heuristics.push('Double TLD / suspicious domain structure');
        }
      } catch (err) {
        domain = cleaned.split('/')[2] || cleaned;
      }

      return {
        url: cleaned,
        domain,
        protocol,
        hostname,
        path,
        query,
        heuristics
      };
    });
  }

  private static extractDomains(text: string, senderEmail: string, urls: ExtractedUrl[]): string[] {
    const domainsSet = new Set<string>();

    if (senderEmail && senderEmail.includes('@')) {
      domainsSet.add(senderEmail.split('@')[1].toLowerCase());
    }

    urls.forEach(u => {
      if (u.domain) domainsSet.add(u.domain.toLowerCase());
    });

    const domainRegex = /\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
    const matches = text.match(domainRegex) || [];

    matches.slice(0, 100).forEach(d => {
      const cleanD = d.toLowerCase().trim();
      if (!cleanD.endsWith('.png') && !cleanD.endsWith('.jpg') && !cleanD.endsWith('.css') && !cleanD.endsWith('.js') && cleanD.includes('.')) {
        domainsSet.add(cleanD);
      }
    });

    return Array.from(domainsSet).slice(0, 30);
  }

  private static extractIps(text: string, hops: ReceivedHop[]): string[] {
    const ipSet = new Set<string>();

    hops.forEach(h => {
      if (h.senderIp) ipSet.add(h.senderIp);
    });

    const ipRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
    const matches = text.match(ipRegex) || [];

    matches.forEach(ip => ipSet.add(ip));

    return Array.from(ipSet).slice(0, 20);
  }

  public static isPrivateIp(ip: string): boolean {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return false;

    // 10.0.0.0 - 10.255.255.255
    if (parts[0] === 10) return true;

    // 172.16.0.0 - 172.31.255.255
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

    // 192.168.0.0 - 192.168.255.255
    if (parts[0] === 192 && parts[1] === 168) return true;

    // 127.0.0.1 (Loopback)
    if (parts[0] === 127) return true;

    // 169.254.0.0 (Link-local)
    if (parts[0] === 169 && parts[1] === 254) return true;

    return false;
  }
}
