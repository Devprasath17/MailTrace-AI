-- MailTrace AI Migration 004: Demo Data Support & Filtering Index

ALTER TABLE public.investigations ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.email_analyses ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.indicators ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.agent_execution_logs ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

-- Indexes for performance filtering on demo vs real records
CREATE INDEX IF NOT EXISTS idx_investigations_is_demo ON public.investigations(is_demo);
CREATE INDEX IF NOT EXISTS idx_indicators_is_demo ON public.indicators(is_demo);
CREATE INDEX IF NOT EXISTS idx_evidence_is_demo ON public.evidence(is_demo);
