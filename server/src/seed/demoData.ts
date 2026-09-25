import { getSupabaseAdmin } from '../config/supabase.js';
import { MemoryStoreService } from '../services/store.service.js';

export interface DemoSeedOptions {
  allowDemoSeed?: boolean;
}

export async function seedDemoData(options: DemoSeedOptions = {}): Promise<{ count: number; success: boolean; message: string }> {
  const isProd = process.env.NODE_ENV === 'production';
  const allowSeed = options.allowDemoSeed || process.env.ALLOW_DEMO_SEED === 'true';

  if (isProd && !allowSeed) {
    throw new Error('[Safety Lock] Demo seeding is strictly disabled in production unless ALLOW_DEMO_SEED=true is set.');
  }

  const orgId = '00000000-0000-0000-0000-000000000001';
  const supabase = getSupabaseAdmin();

  const demoRecords = [
    {
      case_number: 'DEMO-PHISHING-001',
      title: '[DEMO] Urgent CEO Wire Transfer Request',
      threat_type: 'PHISHING',
      severity: 'HIGH',
      risk_score: 82,
      sender: 'ceo-office@payroll-example.com',
      spf: 'FAIL',
      dkim: 'FAIL',
      dmarc: 'FAIL',
      summary: 'High-risk targeted phishing attempt spoofing executive executive leadership requesting urgent wire transfer authorization.',
      indicators: [
        { type: 'IP', value: '198.51.100.45', score: 75, meta: { source: 'DEMO_DATA', intelligence_status: 'DEMO' } },
        { type: 'DOMAIN', value: 'payroll-example.com', score: 80, meta: { source: 'DEMO_DATA', intelligence_status: 'DEMO' } },
        { type: 'URL', value: 'http://login-verify-account.payroll-example.com/auth', score: 85, meta: { source: 'DEMO_DATA', intelligence_status: 'DEMO' } }
      ]
    },
    {
      case_number: 'DEMO-SUSPICIOUS-002',
      title: '[DEMO] Unusual Document Share Notification',
      threat_type: 'SUSPICIOUS',
      severity: 'MEDIUM',
      risk_score: 58,
      sender: 'notifications@docs-sharing-example.org',
      spf: 'PASS',
      dkim: 'NEUTRAL',
      dmarc: 'NONE',
      summary: 'Suspicious email containing external document sharing link originating from newly observed domain.',
      indicators: [
        { type: 'DOMAIN', value: 'docs-sharing-example.org', score: 50, meta: { source: 'DEMO_DATA', intelligence_status: 'DEMO' } },
        { type: 'URL', value: 'https://docs-sharing-example.org/v/file-991', score: 60, meta: { source: 'DEMO_DATA', intelligence_status: 'DEMO' } }
      ]
    },
    {
      case_number: 'DEMO-MALICIOUS-LINK-003',
      title: '[DEMO] Overdue Invoice Payment & Receipt Attachment',
      threat_type: 'CREDENTIAL_HARVESTING',
      severity: 'CRITICAL',
      risk_score: 94,
      sender: 'billing-alert@accounts-verify-example.net',
      spf: 'FAIL',
      dkim: 'FAIL',
      dmarc: 'FAIL',
      summary: 'Critical threat involving fake billing notification redirecting users to malicious credential harvesting portal.',
      indicators: [
        { type: 'IP', value: '203.0.113.88', score: 90, meta: { source: 'DEMO_DATA', intelligence_status: 'DEMO' } },
        { type: 'URL', value: 'http://auth-portal.accounts-verify-example.net/signin', score: 95, meta: { source: 'DEMO_DATA', intelligence_status: 'DEMO' } },
        { type: 'HASH', value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', score: 90, meta: { algorithm: 'SHA-256', source: 'DEMO_DATA' } }
      ]
    },
    {
      case_number: 'DEMO-SPOOFED-SENDER-004',
      title: '[DEMO] IT Service Desk Mandatory Password Reset',
      threat_type: 'BUSINESS_EMAIL_COMPROMISE',
      severity: 'HIGH',
      risk_score: 78,
      sender: 'support@it-servicedesk-example.com',
      spf: 'SOFTFAIL',
      dkim: 'FAIL',
      dmarc: 'FAIL',
      summary: 'Business email compromise tactic mimicking internal IT support desk with password expiry lure.',
      indicators: [
        { type: 'DOMAIN', value: 'it-servicedesk-example.com', score: 70, meta: { source: 'DEMO_DATA', intelligence_status: 'DEMO' } },
        { type: 'URL', value: 'http://password-reset.it-servicedesk-example.com/reset', score: 80, meta: { source: 'DEMO_DATA', intelligence_status: 'DEMO' } }
      ]
    },
    {
      case_number: 'DEMO-SAFE-EMAIL-005',
      title: '[DEMO] Weekly Engineering Guild Newsletter',
      threat_type: 'SAFE',
      severity: 'LOW',
      risk_score: 5,
      sender: 'newsletter@eng-guild-example.org',
      spf: 'PASS',
      dkim: 'PASS',
      dmarc: 'PASS',
      summary: 'Legitimate internal technical newsletter with verified SPF, DKIM, and DMARC authentication.',
      indicators: [
        { type: 'DOMAIN', value: 'eng-guild-example.org', score: 0, meta: { source: 'DEMO_DATA', intelligence_status: 'DEMO' } }
      ]
    }
  ];

  let seededCount = 0;

  if (supabase) {
    // Ensure Primary Organization exists
    await supabase.from('organizations').upsert({
      id: orgId,
      name: 'Primary Security Operations Org',
      slug: 'primary-soc-org'
    }, { onConflict: 'id' });

    for (const item of demoRecords) {
      // Upsert investigation by case_number
      const { data: inv, error: invErr } = await supabase
        .from('investigations')
        .upsert({
          case_number: item.case_number,
          organization_id: orgId,
          title: item.title,
          status: 'OPEN',
          severity: item.severity,
          threat_type: item.threat_type,
          risk_score: item.risk_score,
          is_demo: true
        }, { onConflict: 'case_number' })
        .select()
        .single();

      if (!invErr && inv) {
        seededCount++;

        // Email Analysis
        await supabase.from('email_analyses').upsert({
          investigation_id: inv.id,
          organization_id: orgId,
          sender_address: item.sender,
          subject: item.title,
          spf_status: item.spf,
          dkim_status: item.dkim,
          dmarc_status: item.dmarc,
          raw_headers: `Received: from ${item.sender}; SPF=${item.spf}; DKIM=${item.dkim}; DMARC=${item.dmarc}`,
          body_plain: item.summary,
          ai_analysis_json: { status: 'DEMO', explanation: item.summary },
          risk_breakdown_json: { riskScore: item.risk_score, severity: item.severity, threatType: item.threat_type },
          is_demo: true
        });

        // Indicators
        for (const ind of item.indicators) {
          await supabase.from('indicators').insert({
            investigation_id: inv.id,
            organization_id: orgId,
            type: ind.type,
            value: ind.value,
            risk_score: ind.score,
            metadata_json: ind.meta,
            is_demo: true
          });
        }

        // Evidence
        await supabase.from('evidence').insert({
          investigation_id: inv.id,
          organization_id: orgId,
          file_name: `${item.case_number.toLowerCase()}.eml`,
          storage_path: `demo/evidence/${item.case_number.toLowerCase()}.eml`,
          file_size: 2048,
          sha256_hash: `demo-hash-${item.case_number.toLowerCase()}`,
          evidence_type: 'EML',
          is_demo: true
        });

        // Report
        await supabase.from('reports').insert({
          investigation_id: inv.id,
          organization_id: orgId,
          title: `[DEMO] Threat Report: ${item.case_number}`,
          summary: item.summary,
          is_demo: true
        });

        // Agent Execution Logs
        const agents = ['Email Forensics Agent', 'Threat Intelligence Agent', 'Deterministic Risk Scoring Agent', 'AI Investigation Agent'];
        for (const agentName of agents) {
          await supabase.from('agent_execution_logs').insert({
            investigation_id: inv.id,
            organization_id: orgId,
            agent_name: agentName,
            status: 'COMPLETED',
            duration_ms: 100,
            input_summary: { demoCase: item.case_number },
            output_summary: { status: 'DEMO_SUCCESS' },
            is_demo: true
          });
        }
      }
    }
  }

  // Also seed memory store for fallback
  for (const item of demoRecords) {
    const memId = `inv-demo-${item.case_number.toLowerCase()}`;
    const memRecord = {
      id: memId,
      case_number: item.case_number,
      organization_id: orgId,
      title: item.title,
      status: 'OPEN',
      severity: item.severity,
      threat_type: item.threat_type,
      risk_score: item.risk_score,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_demo: true,
      email_analyses: [{
        sender_address: item.sender,
        subject: item.title,
        spf_status: item.spf,
        dkim_status: item.dkim,
        dmarc_status: item.dmarc,
        body_plain: item.summary
      }],
      indicators: item.indicators.map((ind, i) => ({
        id: `ind-demo-${i}`,
        type: ind.type,
        value: ind.value,
        risk_score: ind.score,
        is_demo: true,
        metadata_json: ind.meta
      })),
      evidence: [{
        id: `ev-demo-${item.case_number}`,
        file_name: `${item.case_number.toLowerCase()}.eml`,
        file_size: 2048,
        sha256_hash: `demo-hash-${item.case_number.toLowerCase()}`,
        is_demo: true
      }],
      reports: [{
        id: `rep-demo-${item.case_number}`,
        title: `[DEMO] Threat Report: ${item.case_number}`,
        summary: item.summary,
        is_demo: true
      }],
      investigation_notes: [],
      investigation_status_history: []
    };

    MemoryStoreService.addInvestigation(memRecord);
    MemoryStoreService.addIndicators(memRecord.indicators);
    MemoryStoreService.addEvidence(memRecord.evidence[0]);
  }

  return {
    count: demoRecords.length,
    success: true,
    message: `Successfully seeded ${demoRecords.length} DEMO investigation records.`
  };
}
