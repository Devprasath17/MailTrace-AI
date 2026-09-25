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
    return this.investigations;
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
    return this.indicators;
  }

  public static addEvidence(item: any) {
    this.evidence.unshift(item);
  }

  public static getEvidence() {
    return this.evidence;
  }

  public static addAuditLog(item: any) {
    this.auditLogs.unshift(item);
  }

  public static getAuditLogs() {
    return this.auditLogs;
  }
}
