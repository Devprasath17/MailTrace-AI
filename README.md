# MailTrace AI — AI-Powered Email Threat Detection & Forensic Intelligence Platform

> **Tagline:** Detect. Trace. Explain. Investigate.

MailTrace AI is an enterprise-grade cybersecurity platform that enables security teams, SOC analysts, and incident responders to analyze suspicious emails, parse authentication signals (SPF, DKIM, DMARC), calculate deterministic risk scores, query live threat intelligence, leverage Google Gemini AI for contextual analysis, visualize entity relationships in an interactive investigation graph, preserve SHA-256 evidence integrity, and generate comprehensive forensic reports.

---

## 1. Key Features & Architecture

- **Multi-Agent Orchestration**: Autonomous multi-agent pipeline executing specialized tasks:
  `Orchestrator` → `Email Forensics` → `Threat Intelligence` → `Network Intelligence` → `IOC Correlation` → `Deterministic Risk Analysis` → `AI Investigation` → `Evidence Integrity` → `Forensic Report Agent`.
- **Real Email Parsing**: Native MIME header parsing with `mailparser` extracting sender signals, Received server hop routes, URLs, domains, and IP indicators.
- **Deterministic Explainable Risk Engine**: Signal-based explainable risk scoring with explicit audit breakdowns (+20 SPF failure, +15 Reply-To mismatch, etc.). Risk scores represent deterministic risk signals, not statistical probability.
- **Google Gemini AI Threat Explanation**: Structured AI classification (Phishing, BEC, Credential Harvesting, Malware) with risk factor explanations, prompt injection defense, and recommended remediations.
- **VirusTotal & Network Geolocation Integrations**: Real-time IP, domain, and URL reputation lookups with private IP detection. Network geolocation is explicitly labeled as *Approximate network geolocation*.
- **Interactive Investigation Graph**: Visual representation of Email → Sender → Domain → URL → IP → Geolocation via `@xyflow/react` (React Flow).
- **Multi-Tenant Security & RBAC**: Supabase Auth integration paired with PostgreSQL Row Level Security (RLS) enforcing strict organization isolation across 5 granular roles (`SUPER_ADMIN`, `SECURITY_ADMIN`, `SOC_ANALYST`, `INCIDENT_RESPONDER`, `VIEWER`).
- **Evidence Integrity**: SHA-256 hashing for all uploaded `.EML` files stored securely in Supabase Storage (`email-evidence`).
- **Audit Logging**: Comprehensive activity tracking for compliance and security auditing.
- **Zero Mock Data**: Production pipeline strictly executes real database queries and live API lookups. Unconfigured keys return `NOT_CONFIGURED` without mock output.

---

## 2. Technology Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, TanStack Query, React Router, Zod, React Flow (`@xyflow/react`), Recharts, Lucide React icons.
- **Backend**: Node.js, Express, TypeScript, Zod, Helmet, CORS, Rate Limiting, `mailparser`, Axios.
- **Database & Storage**: Supabase PostgreSQL, Supabase Auth, Row Level Security (RLS), Supabase Storage.
- **AI & Threat Intelligence**: Google Gemini API (`@google/generative-ai`), VirusTotal API v3, IPGeolocation.io API.

---

## 3. Environment Variables Reference

Copy `.env.example` to configure variables:

```bash
# ---------------------------------------------------
# FRONTEND PUBLIC VARIABLES (Vercel Build Settings)
# ---------------------------------------------------
VITE_API_URL=https://your-render-backend-app.onrender.com
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# ---------------------------------------------------
# BACKEND SECRET VARIABLES (Render Environment Settings)
# ---------------------------------------------------
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-vercel-frontend-app.vercel.app

# Supabase Storage & Database Admin
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# External Threat Intelligence & AI APIs (Backend Only)
GEMINI_API_KEY=your-google-gemini-api-key
VIRUSTOTAL_API_KEY=your-virustotal-api-key
IP_GEOLOCATION_API_KEY=your-ipgeolocation-api-key
```

---

## 4. Supabase Database Migration Setup

1. Execute SQL scripts in your Supabase SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_agent_execution_logs.sql`
2. Create a Supabase Storage bucket named `email-evidence` (Private).

---

## 5. Production Deployment Instructions

### Backend Deployment (Render)
1. Connect your GitHub repository to Render and create a **Web Service**.
2. **Build Command**: `cd server && npm install && npm run build`
3. **Start Command**: `cd server && npm start`
4. **Environment Variables**: Set `PORT=5000`, `NODE_ENV=production`, `CLIENT_URL=https://your-app.vercel.app`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `VIRUSTOTAL_API_KEY`, `IP_GEOLOCATION_API_KEY`.
5. Health Check path: `/health`

### Frontend Deployment (Vercel)
1. Connect your GitHub repository to Vercel and create a **New Project**.
2. **Root Directory**: `client`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variables**: Set `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
6. SPA Routing: Automatically handled via `client/vercel.json`.

---

## 6. Automated E2E Testing

Run the Playwright E2E test suite:

```bash
npx playwright test --reporter=list
```

All 16 E2E automated test scenarios pass 100%.

---

## 7. Known Limitations & Technical Notes

- **VirusTotal Public API Limits**: VirusTotal free community tier is limited to 4 requests/minute.
- **IP Geolocation**: Geolocation represents approximate network ASN/BGP routing details, not physical target address location.
- **Gemini Model Candidates**: Automatically falls back through `gemini-1.5-flash`, `gemini-1.5-flash-latest`, `gemini-1.5-pro`, `gemini-2.0-flash-exp`, and `gemini-pro`.
