import { ParsedEmailData, RiskAnalysisResult, AIAnalysisResult, ThreatIntelResult } from '../../types/index.js';

export type AgentStatus = 
  | 'PENDING' 
  | 'RUNNING' 
  | 'COMPLETED' 
  | 'PARTIAL' 
  | 'FAILED' 
  | 'NOT_CONFIGURED' 
  | 'SKIPPED';

export interface AgentContext {
  investigationId: string;
  caseNumber: string;
  organizationId: string;
  userId: string;
  rawEmailContent: Buffer | string;
  fileName?: string;
  isLocalDevStore?: boolean;
}

export interface AgentError {
  agent: string;
  code: string;
  message: string;
  details?: any;
}

export interface AgentResult<T = any> {
  agent: string;
  status: AgentStatus;
  data?: T;
  errors?: AgentError[];
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

export interface AgentExecutionRecord {
  id: string;
  investigationId: string;
  organizationId: string;
  agentName: string;
  status: AgentStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  inputSummary?: Record<string, any>;
  outputSummary?: Record<string, any>;
  errorMessage?: string;
}

export interface NetworkIntelResultSummary {
  publicIpsCount: number;
  privateIpsCount: number;
  results: ThreatIntelResult[];
}

export interface ThreatIntelResultSummary {
  indicatorsChecked: number;
  maliciousDetections: number;
  results: ThreatIntelResult[];
}

export interface CorrelationResult {
  nodesCount: number;
  edgesCount: number;
  nodes: any[];
  edges: any[];
}

export interface EvidenceResult {
  id: string;
  fileName: string;
  fileSize: number;
  sha256Hash: string;
  storagePath: string;
  preservedAt: string;
}

export interface ReportResult {
  reportId: string;
  generatedAt: string;
  executiveSummary: string;
  caseRef: string;
}

export interface InvestigationAgentState {
  investigationId: string;
  caseNumber: string;
  organizationId: string;
  userId: string;
  rawEmail: Buffer | string;
  forensics?: ParsedEmailData;
  threatIntel?: ThreatIntelResultSummary;
  networkIntel?: NetworkIntelResultSummary;
  correlations?: CorrelationResult;
  riskAnalysis?: RiskAnalysisResult;
  aiAssessment?: AIAnalysisResult;
  evidence?: EvidenceResult;
  report?: ReportResult;
  agentLogs: AgentExecutionRecord[];
  completedAgents: string[];
  errors: AgentError[];
  startedAt: string;
  updatedAt: string;
}
