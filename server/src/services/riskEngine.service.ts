import { ParsedEmailData, RiskAnalysisResult, RiskSignal, ThreatIntelResult } from '../types/index.js';

export class RiskEngineService {
  /**
   * Calculate a deterministic explainable risk score and categorization
   */
  public static calculateRisk(parsedEmail: ParsedEmailData, intelResults: ThreatIntelResult[] = []): RiskAnalysisResult {
    const signals: RiskSignal[] = [];
    let totalScore = 0;

    // --- 1. Authentication Signals ---
    if (parsedEmail.spfStatus === 'FAIL') {
      signals.push({
        code: 'AUTH_SPF_FAIL',
        score: 20,
        title: 'SPF Authentication Failed',
        description: 'The sending server IP address was not authorized by the domain SPF policy.',
        category: 'AUTH'
      });
      totalScore += 20;
    } else if (parsedEmail.spfStatus === 'SOFTFAIL') {
      signals.push({
        code: 'AUTH_SPF_SOFTFAIL',
        score: 10,
        title: 'SPF SoftFail',
        description: 'The sending server IP is not explicitly listed in the SPF policy.',
        category: 'AUTH'
      });
      totalScore += 10;
    }

    if (parsedEmail.dmarcStatus === 'FAIL') {
      signals.push({
        code: 'AUTH_DMARC_FAIL',
        score: 20,
        title: 'DMARC Policy Violation',
        description: 'The email failed DMARC alignment checks, indicating unverified email origin.',
        category: 'AUTH'
      });
      totalScore += 20;
    }

    if (parsedEmail.dkimStatus === 'FAIL') {
      signals.push({
        code: 'AUTH_DKIM_FAIL',
        score: 15,
        title: 'DKIM Signature Invalid',
        description: 'The digital signature on the email could not be verified or was modified in transit.',
        category: 'AUTH'
      });
      totalScore += 15;
    }

    // --- 2. Sender Signals ---
    const senderDomain = this.getDomainFromEmail(parsedEmail.fromAddress);

    if (parsedEmail.replyTo && senderDomain) {
      const replyToDomain = this.getDomainFromEmail(parsedEmail.replyTo);
      if (replyToDomain && replyToDomain !== senderDomain) {
        signals.push({
          code: 'SENDER_REPLYTO_MISMATCH',
          score: 15,
          title: 'Reply-To Domain Mismatch',
          description: `Replies are directed to (${parsedEmail.replyTo}), which differs from sender domain (${senderDomain}).`,
          category: 'SENDER'
        });
        totalScore += 15;
      }
    }

    if (parsedEmail.returnPath && senderDomain) {
      const returnPathDomain = this.getDomainFromEmail(parsedEmail.returnPath);
      if (returnPathDomain && returnPathDomain !== senderDomain) {
        signals.push({
          code: 'SENDER_RETURNPATH_MISMATCH',
          score: 10,
          title: 'Return-Path Mismatch',
          description: `Return-Path (${parsedEmail.returnPath}) does not match From domain (${senderDomain}).`,
          category: 'SENDER'
        });
        totalScore += 10;
      }
    }

    if (parsedEmail.fromDisplayName && senderDomain) {
      const displayNameLower = parsedEmail.fromDisplayName.toLowerCase();
      const majorBrands = ['microsoft', 'paypal', 'apple', 'google', 'amazon', 'wellsfargo', 'chase', 'bankofamerica', 'docusign', 'netflix'];
      const impersonatedBrand = majorBrands.find(b => displayNameLower.includes(b) && !senderDomain.includes(b));

      if (impersonatedBrand) {
        signals.push({
          code: 'SENDER_BRAND_IMPERSONATION',
          score: 25,
          title: 'Brand Impersonation Signal',
          description: `Display name contains "${parsedEmail.fromDisplayName}", but sending domain is "${senderDomain}".`,
          category: 'SENDER'
        });
        totalScore += 25;
      }
    }

    // --- 3. URL Heuristics Signals ---
    let urlIpCount = 0;
    let urlShortenerCount = 0;
    let urlHarvestCount = 0;

    parsedEmail.urls.forEach(u => {
      if (u.heuristics.includes('IP-based URL host')) urlIpCount++;
      if (u.heuristics.includes('URL shortener service')) urlShortenerCount++;
      if (u.heuristics.includes('Credential harvesting keyword in path')) urlHarvestCount++;
    });

    if (urlIpCount > 0) {
      signals.push({
        code: 'URL_IP_HOST',
        score: 25,
        title: 'IP Address URL Detected',
        description: `Found ${urlIpCount} link(s) pointing directly to raw IP addresses instead of domain names.`,
        category: 'URL'
      });
      totalScore += 25;
    }

    if (urlShortenerCount > 0) {
      signals.push({
        code: 'URL_SHORTENER_USED',
        score: 15,
        title: 'URL Shortening Service Used',
        description: `Found ${urlShortenerCount} link(s) using URL redirection/shortener services.`,
        category: 'URL'
      });
      totalScore += 15;
    }

    if (urlHarvestCount > 0) {
      signals.push({
        code: 'URL_CREDENTIAL_HARVESTING',
        score: 20,
        title: 'Credential Harvesting Target Link',
        description: `Found ${urlHarvestCount} link(s) pointing to login/verification paths.`,
        category: 'URL'
      });
      totalScore += 20;
    }

    // --- 4. External Threat Intelligence Signals ---
    intelResults.forEach(res => {
      if (res.maliciousCount && res.maliciousCount > 0) {
        const intelScore = Math.min(res.maliciousCount * 10, 35);
        signals.push({
          code: 'THREAT_INTEL_MALICIOUS',
          score: intelScore,
          title: `Threat Intel Flagged Indicator (${res.indicator})`,
          description: `${res.provider} reported ${res.maliciousCount} security engine detections for indicator ${res.indicator}.`,
          category: 'INTEL'
        });
        totalScore += intelScore;
      }
    });

    // Cap maximum score at 100
    const finalScore = Math.min(Math.max(totalScore, 0), 100);

    // Determine Severity
    let severity: RiskAnalysisResult['severity'] = 'LOW';
    if (finalScore >= 80) severity = 'CRITICAL';
    else if (finalScore >= 55) severity = 'HIGH';
    else if (finalScore >= 30) severity = 'MEDIUM';

    // Determine Threat Classification
    let threatType: RiskAnalysisResult['threatType'] = 'SAFE';
    if (finalScore >= 75) {
      if (urlHarvestCount > 0 || signals.some(s => s.code === 'SENDER_BRAND_IMPERSONATION')) {
        threatType = 'CREDENTIAL_HARVESTING';
      } else if (signals.some(s => s.code === 'SENDER_REPLYTO_MISMATCH') && signals.some(s => s.code === 'AUTH_DMARC_FAIL')) {
        threatType = 'BUSINESS_EMAIL_COMPROMISE';
      } else {
        threatType = 'PHISHING';
      }
    } else if (finalScore >= 30) {
      threatType = 'SUSPICIOUS';
    }

    return {
      riskScore: finalScore,
      threatType,
      severity,
      signals
    };
  }

  private static getDomainFromEmail(email: string): string {
    if (!email || !email.includes('@')) return '';
    return email.split('@')[1].toLowerCase().trim();
  }
}
