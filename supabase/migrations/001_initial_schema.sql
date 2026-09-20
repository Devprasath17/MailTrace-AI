-- MailTrace AI Migration 001: Initial Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles Table (links to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'SOC_ANALYST' CHECK (role IN ('SUPER_ADMIN', 'SECURITY_ADMIN', 'SOC_ANALYST', 'INCIDENT_RESPONDER', 'VIEWER')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Investigations Table
CREATE TABLE IF NOT EXISTS public.investigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number TEXT NOT NULL UNIQUE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CONTAINED', 'RESOLVED', 'FALSE_POSITIVE')),
    severity TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    threat_type TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK (threat_type IN ('SAFE', 'SUSPICIOUS', 'PHISHING', 'MALWARE', 'BUSINESS_EMAIL_COMPROMISE', 'CREDENTIAL_HARVESTING', 'SPAM', 'UNKNOWN')),
    risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Email Analyses Table
CREATE TABLE IF NOT EXISTS public.email_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    sender_address TEXT,
    reply_to TEXT,
    return_path TEXT,
    subject TEXT,
    date TIMESTAMPTZ,
    message_id TEXT,
    spf_status TEXT NOT NULL DEFAULT 'UNKNOWN',
    dkim_status TEXT NOT NULL DEFAULT 'UNKNOWN',
    dmarc_status TEXT NOT NULL DEFAULT 'UNKNOWN',
    raw_headers TEXT,
    body_plain TEXT,
    body_html TEXT,
    ai_analysis_json JSONB DEFAULT '{}'::jsonb,
    risk_breakdown_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Email Headers Hop Timeline
CREATE TABLE IF NOT EXISTS public.email_headers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_analysis_id UUID NOT NULL REFERENCES public.email_analyses(id) ON DELETE CASCADE,
    hop_order INTEGER NOT NULL,
    from_server TEXT,
    by_server TEXT,
    protocol TEXT,
    timestamp TIMESTAMPTZ,
    sender_ip TEXT
);

-- Indicators Table (IOCs)
CREATE TABLE IF NOT EXISTS public.indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('IP', 'DOMAIN', 'URL', 'EMAIL', 'HASH')),
    value TEXT NOT NULL,
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Threat Intelligence Cache / Results Table
CREATE TABLE IF NOT EXISTS public.threat_intelligence_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    indicator_id UUID NOT NULL REFERENCES public.indicators(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    raw_response JSONB DEFAULT '{}'::jsonb,
    summary_json JSONB DEFAULT '{}'::jsonb,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evidence Vault Table
CREATE TABLE IF NOT EXISTS public.evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    sha256_hash TEXT NOT NULL,
    evidence_type TEXT NOT NULL DEFAULT 'EML',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Forensic Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT,
    generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    pdf_storage_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Investigation Notes
CREATE TABLE IF NOT EXISTS public.investigation_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Status Audit History
CREATE TABLE IF NOT EXISTS public.investigation_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Integration Settings
CREATE TABLE IF NOT EXISTS public.integration_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    settings_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_org_provider UNIQUE (organization_id, provider)
);

-- Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_investigations_org ON public.investigations(organization_id);
CREATE INDEX IF NOT EXISTS idx_investigations_status ON public.investigations(status);
CREATE INDEX IF NOT EXISTS idx_investigations_created ON public.investigations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_analyses_investigation ON public.email_analyses(investigation_id);
CREATE INDEX IF NOT EXISTS idx_indicators_investigation ON public.indicators(investigation_id);
CREATE INDEX IF NOT EXISTS idx_indicators_value ON public.indicators(value);
CREATE INDEX IF NOT EXISTS idx_evidence_investigation ON public.evidence(investigation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
