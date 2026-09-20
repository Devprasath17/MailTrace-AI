-- MailTrace AI Migration 003: Agent Execution Audit Logging & RLS

CREATE TABLE IF NOT EXISTS public.agent_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED', 'NOT_CONFIGURED', 'SKIPPED')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    input_summary JSONB DEFAULT '{}'::jsonb,
    output_summary JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast query performance
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_inv ON public.agent_execution_logs(investigation_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_org ON public.agent_execution_logs(organization_id);

-- Enable RLS
ALTER TABLE public.agent_execution_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view agent execution logs in their organization"
    ON public.agent_execution_logs FOR SELECT
    USING (organization_id = public.get_current_user_org_id());

CREATE POLICY "System and analysts can insert agent execution logs"
    ON public.agent_execution_logs FOR INSERT
    WITH CHECK (organization_id = public.get_current_user_org_id());
