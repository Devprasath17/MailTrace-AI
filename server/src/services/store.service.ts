export interface MemoryInvestigation {
  id: string;
  case_number: string;
  organization_id: string;
  title: string;
  status: string;
  severity: string;
  threat_type: string;
  risk_score: number;
  created_by?: string;
  assigned_to?: string;
  is_demo?: boolean;
  created_at: string;
  updated_at: string;
  email_analyses?: any[];
  indicators?: any[];
  evidence?: any[];
  reports?: any[];
  investigation_notes?: any[];
  investigation_status_history?: any[];
}

export class MemoryStoreService {
  private static investigations: MemoryInvestigation[] = [];
  private static indicators: any[] = [];
  private static evidence: any[] = [];
  private static auditLogs: any[] = [];

  public static addInvestigation(inv: MemoryInvestigation) {
    this.investigations.unshift(inv);
  }

  public static getInvestigations(orgId?: string) {
    this.ensureDemoData();
    return this.investigations;
  }

  public static ensureDemoData() {
    if (this.investigations.length > 0) return;

    const orgId = '00000000-0000-0000-0000-000000000001';
    const demoRecords: MemoryInvestigation[] = [
      {
        id: 'inv-demo-001',
        case_number: 'DEMO-PHISHING-001',
        organization_id: orgId,
        title: '[DEMO] Urgent CEO Wire Transfer Request',
        status: 'OPEN',
        severity: 'HIGH',
        threat_type: 'PHISHING',
        risk_score: 82,
        is_demo: true,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        email_analyses: [{
          sender_address: 'ceo-office@payroll-example.com',
          subject: '[DEMO] Urgent CEO Wire Transfer Request',
          spf_status: 'FAIL',
          dkim_status: 'FAIL',
          dmarc_status: 'FAIL',
          body_plain: 'High-risk targeted phishing attempt spoofing executive leadership requesting urgent wire transfer authorization.'
        }],
        indicators: [
          { id: 'ind-d1', type: 'IP', value: '198.51.100.45', risk_score: 75, is_demo: true, metadata_json: { source: 'DEMO_DATA' } },
          { id: 'ind-d2', type: 'DOMAIN', value: 'payroll-example.com', risk_score: 80, is_demo: true, metadata_json: { source: 'DEMO_DATA' } },
          { id: 'ind-d3', type: 'URL', value: 'http://login-verify-account.payroll-example.com/auth', risk_score: 85, is_demo: true, metadata_json: { source: 'DEMO_DATA' } }
        ]
      },
      {
        id: 'inv-demo-002',
        case_number: 'DEMO-SUSPICIOUS-002',
        organization_id: orgId,
        title: '[DEMO] Unusual Document Share Notification',
        status: 'OPEN',
        severity: 'MEDIUM',
        threat_type: 'SUSPICIOUS',
        risk_score: 58,
        is_demo: true,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        email_analyses: [{
          sender_address: 'notifications@docs-sharing-example.org',
          subject: '[DEMO] Unusual Document Share Notification',
          spf_status: 'PASS',
          dkim_status: 'NEUTRAL',
          dmarc_status: 'NONE',
          body_plain: 'Suspicious email containing external document sharing link originating from newly observed domain.'
        }],
        indicators: [
          { id: 'ind-d4', type: 'DOMAIN', value: 'docs-sharing-example.org', risk_score: 50, is_demo: true, metadata_json: { source: 'DEMO_DATA' } },
          { id: 'ind-d5', type: 'URL', value: 'https://docs-sharing-example.org/v/file-991', risk_score: 60, is_demo: true, metadata_json: { source: 'DEMO_DATA' } }
        ]
      },
      {
        id: 'inv-demo-003',
        case_number: 'DEMO-MALICIOUS-LINK-003',
        organization_id: orgId,
        title: '[DEMO] Overdue Invoice Payment & Receipt Attachment',
        status: 'IN_PROGRESS',
        severity: 'CRITICAL',
        threat_type: 'CREDENTIAL_HARVESTING',
        risk_score: 94,
        is_demo: true,
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        email_analyses: [{
          sender_address: 'billing-alert@accounts-verify-example.net',
          subject: '[DEMO] Overdue Invoice Payment & Receipt Attachment',
          spf_status: 'FAIL',
          dkim_status: 'FAIL',
          dmarc_status: 'FAIL',
          body_plain: 'Critical threat involving fake billing notification redirecting users to malicious credential harvesting portal.'
        }],
        indicators: [
          { id: 'ind-d6', type: 'IP', value: '203.0.113.88', risk_score: 90, is_demo: true, metadata_json: { source: 'DEMO_DATA' } },
          { id: 'ind-d7', type: 'URL', value: 'http://auth-portal.accounts-verify-example.net/signin', risk_score: 95, is_demo: true, metadata_json: { source: 'DEMO_DATA' } },
          { id: 'ind-d8', type: 'HASH', value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', risk_score: 90, is_demo: true, metadata_json: { algorithm: 'SHA-256', source: 'DEMO_DATA' } }
        ]
      },
      {
        id: 'inv-demo-004',
        case_number: 'DEMO-SPOOFED-SENDER-004',
        organization_id: orgId,
        title: '[DEMO] IT Service Desk Mandatory Password Reset',
        status: 'OPEN',
        severity: 'HIGH',
        threat_type: 'BUSINESS_EMAIL_COMPROMISE',
        risk_score: 78,
        is_demo: true,
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        email_analyses: [{
          sender_address: 'support@it-servicedesk-example.com',
          subject: '[DEMO] IT Service Desk Mandatory Password Reset',
          spf_status: 'SOFTFAIL',
          dkim_status: 'FAIL',
          dmarc_status: 'FAIL',
          body_plain: 'Business email compromise tactic mimicking internal IT support desk with password expiry lure.'
        }],
        indicators: [
          { id: 'ind-d9', type: 'DOMAIN', value: 'it-servicedesk-example.com', risk_score: 70, is_demo: true, metadata_json: { source: 'DEMO_DATA' } },
          { id: 'ind-d10', type: 'URL', value: 'http://password-reset.it-servicedesk-example.com/reset', risk_score: 80, is_demo: true, metadata_json: { source: 'DEMO_DATA' } }
        ]
      },
      {
        id: 'inv-demo-005',
        case_number: 'DEMO-SAFE-EMAIL-005',
        organization_id: orgId,
        title: '[DEMO] Weekly Engineering Guild Newsletter',
        status: 'RESOLVED',
        severity: 'LOW',
        threat_type: 'SAFE',
        risk_score: 5,
        is_demo: true,
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        email_analyses: [{
          sender_address: 'newsletter@eng-guild-example.org',
          subject: '[DEMO] Weekly Engineering Guild Newsletter',
          spf_status: 'PASS',
          dkim_status: 'PASS',
          dmarc_status: 'PASS',
          body_plain: 'Legitimate internal technical newsletter with verified SPF, DKIM, and DMARC authentication.'
        }],
        indicators: [
          { id: 'ind-d11', type: 'DOMAIN', value: 'eng-guild-example.org', risk_score: 0, is_demo: true, metadata_json: { source: 'DEMO_DATA' } }
        ]
      }
    ];

    this.investigations = demoRecords;
    for (const rec of demoRecords) {
      if (rec.indicators) this.indicators.push(...rec.indicators);
      this.evidence.push({
        id: `ev-${rec.case_number.toLowerCase()}`,
        investigation_id: rec.id,
        file_name: `${rec.case_number.toLowerCase()}.eml`,
        file_size: 2048,
        sha256_hash: `demo-hash-${rec.case_number.toLowerCase()}`,
        evidence_type: 'EML',
        is_demo: true,
        created_at: rec.created_at,
        investigations: { case_number: rec.case_number, title: rec.title }
      });
    }
  }

  public static getInvestigationById(id: string) {
    return this.investigations.find(i => i.id === id || i.case_number === id);
  }

  public static updateInvestigation(id: string, updates: Partial<MemoryInvestigation>, note?: string, authorId?: string) {
    const inv = this.getInvestigationById(id);
    if (!inv) return null;

    const oldStatus = inv.status;
    Object.assign(inv, updates, { updated_at: new Date().toISOString() });

    if (updates.status && updates.status !== oldStatus) {
      if (!inv.investigation_status_history) inv.investigation_status_history = [];
      inv.investigation_status_history.unshift({
        id: 'hist-' + Date.now(),
        investigation_id: id,
        changed_by: authorId,
        old_status: oldStatus,
        new_status: updates.status,
        comment: note || `Status updated to ${updates.status}`,
        created_at: new Date().toISOString()
      });
    }

    if (note) {
      if (!inv.investigation_notes) inv.investigation_notes = [];
      inv.investigation_notes.unshift({
        id: 'note-' + Date.now(),
        investigation_id: id,
        author_id: authorId,
        content: note,
        created_at: new Date().toISOString()
      });
    }

    return inv;
  }

  public static deleteInvestigation(id: string): boolean {
    const idx = this.investigations.findIndex(i => i.id === id || i.case_number === id);
    if (idx !== -1) {
      this.investigations.splice(idx, 1);
      return true;
    }
    return false;
  }

  public static addIndicators(items: any[]) {
    this.indicators.unshift(...items);
  }

  public static getIndicators() {
    this.ensureDemoData();
    return this.indicators;
  }

  public static addEvidence(item: any) {
    this.evidence.unshift(item);
  }

  public static getEvidence() {
    this.ensureDemoData();
    return this.evidence;
  }

  public static addAuditLog(item: any) {
    this.auditLogs.unshift(item);
  }

  public static getAuditLogs() {
    return this.auditLogs;
  }
}
