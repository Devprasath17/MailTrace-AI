-- MailTrace AI Migration 002: Row Level Security (RLS) & Multi-Tenant Isolation

-- Helper function to get current user's organization_id safely
CREATE OR REPLACE FUNCTION public.get_current_user_org_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM public.profiles 
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper function to get current user's role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM public.profiles 
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_intelligence_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

-- ORGANIZATIONS POLICIES
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
CREATE POLICY "Users can view their own organization"
    ON public.organizations FOR SELECT
    USING (id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Authenticated users can insert organizations during registration" ON public.organizations;
CREATE POLICY "Authenticated users can insert organizations during registration"
    ON public.organizations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
CREATE POLICY "Users can view profiles in their organization"
    ON public.profiles FOR SELECT
    USING (organization_id = public.get_current_user_org_id() OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profile during registration" ON public.profiles;
CREATE POLICY "Users can insert their own profile during registration"
    ON public.profiles FOR INSERT
    WITH CHECK (user_id = auth.uid() OR id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update any profile in their organization" ON public.profiles;
CREATE POLICY "Admins can update any profile in their organization"
    ON public.profiles FOR UPDATE
    USING (
        organization_id = public.get_current_user_org_id() 
        AND public.get_current_user_role() IN ('SUPER_ADMIN', 'SECURITY_ADMIN')
    );

-- INVESTIGATIONS POLICIES
DROP POLICY IF EXISTS "Users can view investigations in their organization" ON public.investigations;
CREATE POLICY "Users can view investigations in their organization"
    ON public.investigations FOR SELECT
    USING (organization_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Analysts and Responders can insert investigations" ON public.investigations;
CREATE POLICY "Analysts and Responders can insert investigations"
    ON public.investigations FOR INSERT
    WITH CHECK (
        organization_id = public.get_current_user_org_id() 
        AND public.get_current_user_role() IN ('SUPER_ADMIN', 'SECURITY_ADMIN', 'SOC_ANALYST', 'INCIDENT_RESPONDER')
    );

DROP POLICY IF EXISTS "Analysts and Responders can update investigations" ON public.investigations;
CREATE POLICY "Analysts and Responders can update investigations"
    ON public.investigations FOR UPDATE
    USING (
        organization_id = public.get_current_user_org_id() 
        AND public.get_current_user_role() IN ('SUPER_ADMIN', 'SECURITY_ADMIN', 'SOC_ANALYST', 'INCIDENT_RESPONDER')
    );

-- EMAIL ANALYSES POLICIES
DROP POLICY IF EXISTS "Users can view email analyses in their organization" ON public.email_analyses;
CREATE POLICY "Users can view email analyses in their organization"
    ON public.email_analyses FOR SELECT
    USING (organization_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Analysts can create email analyses" ON public.email_analyses;
CREATE POLICY "Analysts can create email analyses"
    ON public.email_analyses FOR INSERT
    WITH CHECK (
        organization_id = public.get_current_user_org_id() 
        AND public.get_current_user_role() IN ('SUPER_ADMIN', 'SECURITY_ADMIN', 'SOC_ANALYST', 'INCIDENT_RESPONDER')
    );

-- EMAIL HEADERS POLICIES
DROP POLICY IF EXISTS "Users can view email headers in their organization" ON public.email_headers;
CREATE POLICY "Users can view email headers in their organization"
    ON public.email_headers FOR SELECT
    USING (email_analysis_id IN (SELECT id FROM public.email_analyses WHERE organization_id = public.get_current_user_org_id()));

DROP POLICY IF EXISTS "Analysts can insert email headers" ON public.email_headers;
CREATE POLICY "Analysts can insert email headers"
    ON public.email_headers FOR INSERT
    WITH CHECK (email_analysis_id IN (SELECT id FROM public.email_analyses WHERE organization_id = public.get_current_user_org_id()));

-- INDICATORS POLICIES
DROP POLICY IF EXISTS "Users can view indicators in their organization" ON public.indicators;
CREATE POLICY "Users can view indicators in their organization"
    ON public.indicators FOR SELECT
    USING (organization_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Analysts can create indicators" ON public.indicators;
CREATE POLICY "Analysts can create indicators"
    ON public.indicators FOR INSERT
    WITH CHECK (
        organization_id = public.get_current_user_org_id() 
        AND public.get_current_user_role() IN ('SUPER_ADMIN', 'SECURITY_ADMIN', 'SOC_ANALYST', 'INCIDENT_RESPONDER')
    );

-- THREAT INTELLIGENCE RESULTS POLICIES
DROP POLICY IF EXISTS "Users can view threat intel results in their organization" ON public.threat_intelligence_results;
CREATE POLICY "Users can view threat intel results in their organization"
    ON public.threat_intelligence_results FOR SELECT
    USING (indicator_id IN (SELECT id FROM public.indicators WHERE organization_id = public.get_current_user_org_id()));

DROP POLICY IF EXISTS "Analysts can insert threat intel results" ON public.threat_intelligence_results;
CREATE POLICY "Analysts can insert threat intel results"
    ON public.threat_intelligence_results FOR INSERT
    WITH CHECK (indicator_id IN (SELECT id FROM public.indicators WHERE organization_id = public.get_current_user_org_id()));

-- EVIDENCE POLICIES
DROP POLICY IF EXISTS "Users can view evidence in their organization" ON public.evidence;
CREATE POLICY "Users can view evidence in their organization"
    ON public.evidence FOR SELECT
    USING (organization_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Analysts can insert evidence" ON public.evidence;
CREATE POLICY "Analysts can insert evidence"
    ON public.evidence FOR INSERT
    WITH CHECK (
        organization_id = public.get_current_user_org_id() 
        AND public.get_current_user_role() IN ('SUPER_ADMIN', 'SECURITY_ADMIN', 'SOC_ANALYST', 'INCIDENT_RESPONDER')
    );

-- REPORTS POLICIES
DROP POLICY IF EXISTS "Users can view reports in their organization" ON public.reports;
CREATE POLICY "Users can view reports in their organization"
    ON public.reports FOR SELECT
    USING (organization_id = public.get_current_user_org_id());

DROP POLICY IF EXISTS "Analysts can generate reports" ON public.reports;
CREATE POLICY "Analysts can generate reports"
    ON public.reports FOR INSERT
    WITH CHECK (
        organization_id = public.get_current_user_org_id() 
        AND public.get_current_user_role() IN ('SUPER_ADMIN', 'SECURITY_ADMIN', 'SOC_ANALYST', 'INCIDENT_RESPONDER')
    );

-- INVESTIGATION NOTES POLICIES
DROP POLICY IF EXISTS "Users can view notes for investigations in their organization" ON public.investigation_notes;
CREATE POLICY "Users can view notes for investigations in their organization"
    ON public.investigation_notes FOR SELECT
    USING (investigation_id IN (SELECT id FROM public.investigations WHERE organization_id = public.get_current_user_org_id()));

DROP POLICY IF EXISTS "Analysts can insert notes for investigations in their organization" ON public.investigation_notes;
CREATE POLICY "Analysts can insert notes for investigations in their organization"
    ON public.investigation_notes FOR INSERT
    WITH CHECK (investigation_id IN (SELECT id FROM public.investigations WHERE organization_id = public.get_current_user_org_id()));

-- INVESTIGATION STATUS HISTORY POLICIES
DROP POLICY IF EXISTS "Users can view status history for investigations in their organization" ON public.investigation_status_history;
CREATE POLICY "Users can view status history for investigations in their organization"
    ON public.investigation_status_history FOR SELECT
    USING (investigation_id IN (SELECT id FROM public.investigations WHERE organization_id = public.get_current_user_org_id()));

DROP POLICY IF EXISTS "Analysts can insert status history for investigations in their organization" ON public.investigation_status_history;
CREATE POLICY "Analysts can insert status history for investigations in their organization"
    ON public.investigation_status_history FOR INSERT
    WITH CHECK (investigation_id IN (SELECT id FROM public.investigations WHERE organization_id = public.get_current_user_org_id()));

-- AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (
        organization_id = public.get_current_user_org_id() 
        AND public.get_current_user_role() IN ('SUPER_ADMIN', 'SECURITY_ADMIN')
    );

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (organization_id = public.get_current_user_org_id());

-- INTEGRATION SETTINGS POLICIES
DROP POLICY IF EXISTS "Admins can manage integration settings" ON public.integration_settings;
CREATE POLICY "Admins can manage integration settings"
    ON public.integration_settings FOR ALL
    USING (
        organization_id = public.get_current_user_org_id() 
        AND public.get_current_user_role() IN ('SUPER_ADMIN', 'SECURITY_ADMIN')
    );

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS update_investigations_updated_at ON public.investigations;
CREATE TRIGGER update_investigations_updated_at BEFORE UPDATE ON public.investigations FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
