export interface ReceivedHop {
  hopOrder: number;
  fromServer?: string;
  byServer?: string;
  protocol?: string;
  timestamp?: string;
  senderIp?: string;
}

export interface ExtractedUrl {
  url: string;
  domain: string;
  protocol: string;
  hostname: string;
  path: string;
  query: string;
  heuristics: string[];
}

export interface ExtractedIndicator {
  type: 'IP' | 'DOMAIN' | 'URL' | 'EMAIL' | 'HASH';
  value: string;
  riskScore: number;
  metadata?: Record<string, any>;
}

export interface ParsedEmailData {
  fromAddress: string;
  fromDisplayName?: string;
  replyTo?: string;
  returnPath?: string;
  toAddresses: string[];
  ccAddresses: string[];
  bccAddresses: string[];
  subject: string;
  date?: string;
  messageId?: string;
  spfStatus: 'PASS' | 'FAIL' | 'NEUTRAL' | 'SOFTFAIL' | 'NONE' | 'TEMPERROR' | 'PERMERROR' | 'NOT_AVAILABLE';
  dkimStatus: 'PASS' | 'FAIL' | 'NEUTRAL' | 'NONE' | 'NOT_AVAILABLE';
  dmarcStatus: 'PASS' | 'FAIL' | 'NONE' | 'NOT_AVAILABLE';
  rawHeaders: string;
  bodyPlain: string;
  bodyHtml: string;
  receivedHops: ReceivedHop[];
  urls: ExtractedUrl[];
  domains: string[];
  ips: string[];
  indicators: ExtractedIndicator[];
  sha256Hash: string;
}

export interface RiskSignal {
  code: string;
  score: number;
  title: string;
  description: string;
  category: 'AUTH' | 'SENDER' | 'URL' | 'DOMAIN' | 'CONTENT' | 'INTEL';
}

export interface RiskAnalysisResult {
  riskScore: number;
  threatType: 'SAFE' | 'SUSPICIOUS' | 'PHISHING' | 'MALWARE' | 'BUSINESS_EMAIL_COMPROMISE' | 'CREDENTIAL_HARVESTING' | 'SPAM' | 'UNKNOWN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  signals: RiskSignal[];
}

export interface AIAnalysisResult {
  classification: 'SAFE' | 'SUSPICIOUS' | 'PHISHING' | 'MALWARE' | 'BUSINESS_EMAIL_COMPROMISE' | 'CREDENTIAL_HARVESTING' | 'SPAM' | 'UNKNOWN';
  attackType: string;
  confidence: number;
  riskFactors: string[];
  explanation: string;
  recommendedActions: string[];
}

export interface ThreatIntelResult {
  provider: 'VirusTotal' | 'IP_Geolocation' | 'RDAP';
  indicator: string;
  status: 'FOUND' | 'NOT_FOUND' | 'UNCONFIGURED' | 'ERROR';
  reputation?: number;
  maliciousCount?: number;
  suspiciousCount?: number;
  harmlessCount?: number;
  details?: Record<string, any>;
}
