# MediConnect 🏥

> **German telehealth platform** — video consultations, digital health records, smart appointment management, and an AI-powered doctor assistant. Built for Germany, compliant with DSGVO/GDPR.

---

## Table of contents

- [What is MediConnect?](#what-is-mediconnect)
- [The problem we solve](#the-problem-we-solve)
- [Core features](#core-features)
- [Architecture overview](#architecture-overview)
- [Tech stack](#tech-stack)
- [Monorepo structure](#monorepo-structure)
- [Database schema](#database-schema)
- [Role-based access control](#role-based-access-control)
- [Medical knowledge base](#medical-knowledge-base)
- [Prerequisites](#prerequisites)
- [Local development setup](#local-development-setup)
- [Environment variables](#environment-variables)
- [Running the project](#running-the-project)
- [Demo users](#demo-users)
- [Deploying to production](#deploying-to-production)
- [CI/CD pipeline](#cicd-pipeline)
- [Cursor MCP tools](#cursor-mcp-tools)
- [Team ownership](#team-ownership)
- [Branch and PR rules](#branch-and-pr-rules)
- [Germany-specific requirements](#germany-specific-requirements)
- [End-to-end test flow](#end-to-end-test-flow)

---

## What is MediConnect?

MediConnect is a full-stack telehealth platform built specifically for the German healthcare market. It connects patients and doctors through video consultation, gives doctors a complete view of a patient's medical history during a call, automates appointment booking with calendar and email sync, and provides an AI assistant that can look up clinical guidelines, drug interactions, and research literature in real time.

---

## The problem we solve

In Germany, you need a physical appointment for almost every health issue. For patients who are too sick to travel, facing an urgent but non-emergency situation, or simply living far from their doctor, this is a significant barrier. MediConnect solves this by providing:

- A video consultation room with the patient's full medical context visible to the doctor
- An AI assistant that helps doctors look up information without leaving the consultation
- Appointment booking that syncs directly to Google Calendar with automated email reminders
- A digital health record that replaces paper-based systems while respecting German insurance classifications (GKV/PKV) and clinical coding standards (ICD-10-GM, STIKO)

---

## Core features

### 1. Video consultation — E1

- Room creation via **beyondPresence SDK** when a doctor starts a call
- Doctor sees a patient info sidebar during the call (allergies, medications, recent diagnoses)
- Patient receives a join link via email and Google Calendar invite
- Patient waiting room — auto-joins when the doctor starts
- Post-call: doctor writes notes, AI generates a structured SOAP summary
- Hospital admins upload their own clinical documents (protocols, formularies) to a knowledge base used by the AI during consultations

### 2. Medical dashboard — E2

- **Patient profile** — name, date of birth, blood type, allergies (highlighted), emergency contact
- **Medical history timeline** — diagnoses with ICD-10-GM codes, chronological, filterable
- **Vaccination records** — status badges based on the official German STIKO/RKI schedule (Aktuell / Fällig / Überfällig)
- **Medications list** — drug name, dosage, frequency (German format: "1x täglich"), prescriber, dates
- **Insurance panel** — GKV or PKV, insurer name, policy number, expiry warning
- **Doctor private notes** — only the assigned doctor can see these (enforced at API level, not just UI)
- **Lab results** — PDF/image uploads linked to visit dates, downloadable by patient

### 3. Appointments and queue management — E3

- Doctor sets weekly availability slots (15/30/45-minute blocks)
- Patient books from available slots — max 2 future bookings at a time
- On booking confirmed:
  - Google Calendar event created for both doctor and patient via MCP
  - Confirmation email sent with video room link via Gmail MCP
  - Reminder email sent 1 hour before the appointment
- **Doctor queue dashboard** — today's list with real-time status chips (Wartend / Im Gespräch / Erledigt / Nicht erschienen)
- **Patient queue widget** — "Sie sind Nummer X in der Warteschlange" with estimated wait time, polling every 30 seconds

### 4. Doctor AI agent — E4

- Floating chat widget on all doctor pages, powered by **Claude API** (claude-sonnet-4-20250514)
- Auto-injects current patient context (diagnoses, medications, allergies) when the doctor is on a patient page
- **Tools the agent can call:**
  - `lookup_icd10(query)` — NIH Clinical Tables API (free)
  - `search_pubmed(query)` — NCBI E-utilities, 35M+ articles (free)
  - `get_drug_info(drug_name)` — OpenFDA drug labels and adverse events (free)
  - `check_drug_interaction(drugs[])` — RxNorm interaction API (free)
  - `get_dosage_guideline(drug, weight, age)` — DrugBank EU (freemium)
- **RAG retrieval** — searches hospital-specific documents and AWMF German clinical guidelines stored in pgvector
- **ElevenLabs TTS** — "Read aloud" speaker button on every AI response
- All responses in German, with source citations

### 5. Auth and RBAC — E5

- Four roles: `DOCTOR` / `NURSE` / `PATIENT` / `ADMIN`
- Role stored on the user record, checked in Next.js middleware on every route
- Each role routes to its own dashboard
- All restrictions enforced at the API route level — not just in the UI
- Nurse-specific medication administration view with "Verabreicht" checkboxes
- Doctor prescription writer with German drug name autocomplete and drug interaction alerts
- Full audit log of every patient record access (for DSGVO compliance)

---

## Architecture overview

```
Browser
  └─ Vercel (Next.js 14 — all apps/*)
       ├─ apps/web           Auth shell, routing, shared layout
       ├─ apps/video         Video consultation pages + API
       ├─ apps/dashboard     Medical record pages + API
       ├─ apps/appointments  Booking, queue pages + API
       ├─ apps/ai-agent      Doctor AI chat + streaming API
       └─ apps/admin         RBAC, users, medications + API

Google Cloud (Frankfurt — europe-west3)
  ├─ Cloud Run              AI agent microservice, KB ingestion worker
  ├─ Cloud SQL (Postgres 15) Primary database + pgvector for RAG
  ├─ Cloud Storage          Lab results, documents, recordings
  └─ Secret Manager         All API keys and credentials

External services
  ├─ Supabase (pgvector)    Vector store for RAG embeddings
  ├─ beyondPresence         Video room creation and hosting
  ├─ ElevenLabs             Text-to-speech for doctor AI agent
  ├─ Google Calendar MCP    Appointment calendar sync
  ├─ Gmail MCP              Email notifications
  └─ Medical APIs           ICD-10, PubMed, OpenFDA, RxNorm, DrugBank EU
```

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack, Vercel-native, RSC support |
| UI | Tailwind CSS + shadcn/ui | Rapid, consistent component building |
| UI generation | v0.dev (via MCP) | AI-generated components wired in Cursor |
| Data fetching | React Query | Queue polling, caching, background refetch |
| ORM | Prisma | Type-safe DB access, migrations |
| Database | PostgreSQL 15 + pgvector | Relations + vector search for RAG |
| Auth | NextAuth (credentials) per app | Session per origin; seeded users (see `packages/db/prisma/seed.ts`) |
| AI | Claude API (Anthropic) | Doctor agent, SOAP summaries, triage |
| Embeddings | Hugging Face Inference (BGE-large-en-v1.5) | RAG document embeddings |
| Voice | ElevenLabs TTS | Doctor agent read-aloud |
| Video | beyondPresence SDK | GDPR-compliant video rooms |
| Calendar | Google Calendar API via MCP | Appointment sync |
| Email | Gmail API via MCP | Notifications and reminders |
| Frontend deploy | Vercel | Edge network, preview deploys on PR |
| Backend deploy | Google Cloud Run | Serverless containers, Frankfurt region |
| Storage | Google Cloud Storage | EU-region document and recording storage |
| Infra-as-code | Terraform | Reproducible GCP infrastructure |
| CI/CD | GitHub Actions | Lint → test → build → deploy pipeline |
| Monorepo | Turborepo + pnpm | Parallel builds, caching, workspace linking |

---

## Monorepo structure

```
mediconnect/
├── apps/
│   ├── web/                # Entry redirect → dashboard `/login`
│   ├── video/              # E1: Video consultation
│   ├── dashboard/          # E2: Medical dashboard
│   ├── appointments/       # E3: Appointments and queue
│   ├── ai-agent/           # E4: Doctor AI agent (also runs as Cloud Run service)
│   └── admin/              # E5+E6: RBAC, user management, medications
├── packages/
│   ├── db/                 # Prisma schema, client, migrations, seed
│   ├── ui/                 # Shared shadcn/ui components
│   ├── types/              # Shared TypeScript interfaces
│   ├── auth/               # NextAuth config, requireRole(), getCurrentUser()
│   ├── api-client/         # Shared fetch utilities
│   └── knowledge-base/     # RAG helpers, medical API clients
├── infra/
│   ├── terraform/          # GCP infrastructure as code
│   ├── docker/             # Local dev: docker-compose (Postgres+pgvector, Redis, MinIO, Mailhog)
│   └── scripts/            # Deployment and env-check scripts
├── .github/
│   ├── workflows/          # GitHub Actions CI/CD pipeline
│   └── CODEOWNERS          # Auto-assigns reviewers by folder
├── turbo.json              # Turborepo pipeline config
├── pnpm-workspace.yaml     # pnpm workspace roots
└── .env.example            # All required environment variables
```

### Importing shared packages

```typescript
import { prisma }                           from '@mediconnect/db'
import { type Patient, type Appointment }   from '@mediconnect/types'
import { Button, Card, StatusBadge }        from '@mediconnect/ui'
import { requireRole, getCurrentUser }      from '@mediconnect/auth'
import { searchKnowledgeBase, lookupICD10 } from '@mediconnect/knowledge-base'
```

---

## Database schema

Key tables and their purpose:

| Table | Purpose |
|---|---|
| `Hospital` | Multi-tenant root — all users and data scoped here |
| `User` | Auth record with `role` (DOCTOR/NURSE/PATIENT/ADMIN) and `hospitalId` |
| `Doctor` | Specialty, license number, languages |
| `Patient` | DOB, blood type, allergies, language preference |
| `PatientDoctor` | Many-to-many assignment, `isPrimary` flag |
| `Insurance` | GKV or PKV, insurer name, policy number, expiry |
| `MedicalHistory` | Diagnoses with ICD-10-GM code, notes, attachments |
| `Vaccination` | Vaccine name, date, batch, next due date, STIKO status |
| `Medication` | Drug, dosage, frequency, prescriber, start/end date |
| `Appointment` | Scheduled time, status, video room URL, queue position |
| `AvailabilitySlot` | Doctor's weekly recurring schedule |
| `KnowledgeChunk` | RAG chunks — `embedding vector(1536)`, scoped by `hospitalId` |
| `DoctorNote` | Private notes — NEVER exposed to patients or nurses |
| `LabResult` | PDF/image lab results with LOINC code |
| `MedicationAdministration` | Nurse confirmation records per dose |
| `AuditLog` | DSGVO compliance — every patient record access logged |

Full schema is in `packages/db/prisma/schema.prisma`.

---

## Role-based access control

| Permission | Doctor | Nurse | Patient | Admin |
|---|:---:|:---:|:---:|:---:|
| Full patient record | ✓ | — | Own only | ✓ |
| Write diagnoses | ✓ | — | — | — |
| Prescribe medications | ✓ | — | — | — |
| View medications | ✓ | ✓ | Own only | ✓ |
| Mark medication administered | — | ✓ | — | — |
| Start video call | ✓ | — | — | — |
| Join video call | — | — | ✓ | — |
| Book appointments | — | — | ✓ | — |
| View queue | ✓ | ✓ | Own position | ✓ |
| Doctor private notes | ✓ | — | — | — |
| AI agent access | ✓ | — | — | — |
| Upload knowledge base | — | — | — | ✓ |
| Manage users | — | — | — | ✓ |
| Assign doctor–patient | — | — | — | ✓ |
| View audit log | — | — | — | ✓ |

All restrictions are enforced at the API route level. The UI respects them too, but never rely on the UI alone for security.

---

## Medical knowledge base

The doctor AI agent uses a three-layer RAG architecture:

**Layer 1 — Hospital-specific** (pgvector, scoped by `hospitalId`)
Admin uploads PDFs or DOCX files → chunked at 500 tokens with 50-token overlap → embedded via OpenAI → stored in `KnowledgeChunk` table.

**Layer 2 — German clinical standards** (pgvector, shared across hospitals)
- [AWMF Leitlinien](https://www.awmf.org/leitlinien) — 1,000+ German clinical practice guidelines (public PDFs)
- [NVL National Care Guidelines](https://www.versorgungsleitlinien.de) — Asthma, COPD, Diabetes, Depression, Hypertension, Chronic back pain
- [STIKO vaccination schedule](https://www.rki.de) — Robert Koch Institut, updated annually

**Layer 3 — Live API tools** (called by Claude on demand)

| Tool | API | Cost |
|---|---|---|
| ICD-10 code lookup | NIH Clinical Tables API | Free |
| Research literature | PubMed NCBI E-utilities | Free (API key) |
| Drug labels and adverse events | OpenFDA Drug API | Free (API key) |
| Drug interaction check | RxNorm API (NLM) | Free |
| EU drug dosage guidelines | DrugBank EU API | Freemium (free dev key) |
| WHO disease statistics | WHO GHO OData API | Free |
| ICD-11 (upgrade path) | WHO ICD-11 API | Free (registration) |

For vaccination status: STIKO schedule is stored as structured data in the DB (vaccine, age range, interval). Patient vaccination status is auto-computed by comparing their records against the schedule.

---

## Prerequisites

Make sure you have these installed before starting:

```bash
node --version    # >= 20.0.0
pnpm --version    # >= 9.0.0  →  npm install -g pnpm
docker --version  # Docker Desktop or Docker Engine
```

You also need accounts (all free at the dev tier) for:

- [Supabase](https://supabase.com) — PostgreSQL + pgvector
- [Anthropic](https://console.anthropic.com) — Claude API key
- [Hugging Face](https://huggingface.co/settings/tokens) — Inference API token for embeddings
- [ElevenLabs](https://elevenlabs.io) — TTS API key
- [beyondPresence](https://beyondpresence.io) — video API key
- [NCBI](https://www.ncbi.nlm.nih.gov/account/) — PubMed API key (free)
- [OpenFDA](https://open.fda.gov/apis/authentication/) — drug API key (free)
- [DrugBank](https://go.drugbank.com) — EU drug API key (free dev)
- GCP project with billing enabled — [console.cloud.google.com](https://console.cloud.google.com)
- Google OAuth credentials — for Calendar + Gmail MCP integration

---

## Local development setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/mediconnect
cd mediconnect

# 2. Install all dependencies (pnpm handles all workspaces)
pnpm install

# 3. Copy the environment variable template
cp .env.example .env.local
# Open .env.local and fill in your API keys (see Environment variables section)

# 4. Start local backing services (Postgres + pgvector, Redis, MinIO, Mailhog)
cp infra/docker/.env.example infra/docker/.env
docker compose -f infra/docker/docker-compose.yml up -d
```

Docker Compose starts four core services (see `infra/docker/docker-compose.yml`):

| Service | Port | Purpose |
|---|---|---|
| PostgreSQL 15 + pgvector | 5432 | Primary database |
| Redis | 6379 | Session cache, job queue |
| MinIO | 9000 / 9001 | Local replacement for Google Cloud Storage |
| Mailhog | 1025 / 8025 | Catches all outgoing emails for inspection |

Open [http://localhost:8025](http://localhost:8025) to see emails. Open [http://localhost:9001](http://localhost:9001) to browse files in MinIO (user: `minioadmin`, password: `minioadmin`).

**RAG / embeddings:** Use **Hugging Face Inference** (`feature-extraction` on `hf-inference`, default model `BAAI/bge-large-en-v1.5`): set `HUGGINGFACE_API_TOKEN` or `HF_TOKEN`, and optionally `HF_EMBEDDING_MODEL` / `EMBEDDING_DIMENSIONS` (see `.env.example`). Verify the token with `pnpm --filter @mediconnect/knowledge-base test:hf` (or `pnpm test --filter=@mediconnect/knowledge-base`, which loads root `.env` and runs integration tests when a token is present). For Featherless chat (default `Qwen/Qwen3-14B`), set `LLM_BASE_URL`, `LLM_API_KEY`, and `LLM_MODEL`. Try the KB demo UI: `pnpm dev --filter=@mediconnect/ai-agent` → [http://localhost:3004/chat](http://localhost:3004/chat). Run `pnpm db:migrate` so `KnowledgeChunk.embeddingVector` exists (use `prisma migrate resolve` / baseline if the DB was created earlier with `db:push`). Chunks that still lack vectors can be embedded via `POST /api/admin/knowledge/backfill-embeddings` (admin session, optional JSON body `{ "limit": 32 }`).

```bash
# 5. Apply the database schema
pnpm db:migrate

# 6. Seed demo users and sample data
pnpm db:seed

# 7. Start the development server (all apps in parallel)
pnpm dev
```

The web app runs at [http://localhost:3000](http://localhost:3000).

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in each value. Here is what each one is for:

```bash
# Database
DATABASE_URL              # PostgreSQL connection string (local: see docker-compose.yml)

# Auth (NextAuth)
NEXTAUTH_SECRET           # Required — signing key for JWT/session (same value can be used for all apps locally)
NEXTAUTH_URL              # Per app origin, e.g. http://localhost:3002 for dashboard

# Google OAuth (Calendar + Gmail MCP)
GOOGLE_CLIENT_ID          # From GCP Console → APIs & Services → Credentials
GOOGLE_CLIENT_SECRET      # Same location

# Supabase (pgvector for RAG)
SUPABASE_URL              # From your Supabase project settings
SUPABASE_ANON_KEY         # Public anon key
SUPABASE_SERVICE_KEY      # Service role key (keep secret)

# AI
ANTHROPIC_API_KEY         # Claude API — console.anthropic.com
OPENAI_API_KEY            # For embeddings (text-embedding-ada-002)

# Medical APIs (all free at dev tier)
NCBI_API_KEY              # PubMed — ncbi.nlm.nih.gov/account
OPENFDA_API_KEY           # Drug API — open.fda.gov/apis/authentication
DRUGBANK_API_KEY          # EU drug DB — go.drugbank.com

# Video
BEYOND_PRESENCE_API_KEY   # beyondPresence dashboard
BEYOND_PRESENCE_API_URL   # https://api.beyondpresence.io

# Voice
ELEVENLABS_API_KEY        # elevenlabs.io dashboard
ELEVENLABS_VOICE_ID       # German doctor voice ID from your ElevenLabs account

# Storage (local uses MinIO)
GCS_BUCKET_NAME           # mediconnect-documents-local
GCS_ENDPOINT              # http://localhost:9000
GCS_ACCESS_KEY            # minioadmin
GCS_SECRET_KEY            # minioadmin

# App
NEXT_PUBLIC_APP_URL       # http://localhost:3000
```

---

## Running the project

```bash
# Start everything (all 6 apps simultaneously via Turborepo)
pnpm dev

# Start only one app (faster for focused work)
pnpm dev --filter=@mediconnect/dashboard
pnpm dev --filter=@mediconnect/appointments
pnpm dev --filter=@mediconnect/ai-agent

# Build all apps
pnpm build

# Run tests
pnpm test

# Run tests for one app only
pnpm test --filter=@mediconnect/dashboard

# Lint all packages
pnpm lint

# Open Prisma Studio (visual database browser)
pnpm db:studio

# Re-run seed (useful if you break local data)
pnpm db:seed

# Type-check all packages
pnpm type-check
```

---

## Demo users

These are seeded automatically by `pnpm db:seed`. Use them to test every role:

| Email | Password | Role | Notes |
|---|---|---|---|
| `dr.mueller@mediconnect.de` | `password123` | DOCTOR | Specialty: Allgemeinmedizin, assigned to patient Weber |
| `nurse.schmidt@mediconnect.de` | `password123` | NURSE | Can view medications, cannot see doctor notes |
| `patient.weber@mediconnect.de` | `password123` | PATIENT | Blood type A+, allergy: Penicillin, GKV/TK insurance |
| `admin.bauer@mediconnect.de` | `password123` | ADMIN | Full access including audit log |

Patient Weber is seeded with: 3 medical history entries, 4 vaccinations, 2 active medications, TK health insurance.

Hospital: **Klinikum Stuttgart** — Stuttgart, Germany.

---

## Deploying to production

All infrastructure is in `infra/terraform/` and targets **GCP Frankfurt (europe-west3)** for GDPR/DSGVO compliance.

### Step 1 — GCP project setup

```bash
gcloud projects create mediconnect-prod
gcloud config set project mediconnect-prod
# Enable billing in the GCP Console
```

### Step 2 — Create Terraform state bucket

```bash
gsutil mb -l europe-west3 gs://mediconnect-terraform-state
gsutil versioning set on gs://mediconnect-terraform-state
```

### Step 3 — Deploy infrastructure

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # fill in your values
terraform init
terraform plan
terraform apply
```

This creates: Cloud SQL (PostgreSQL 15), Cloud Run services, GCS buckets, Secret Manager, Artifact Registry, VPC with private networking.

### Step 4 — Store secrets in Secret Manager

```bash
gcloud secrets versions add ANTHROPIC_API_KEY --data-file=- <<< "sk-ant-..."
gcloud secrets versions add DATABASE_URL --data-file=- <<< "postgresql://..."
# Repeat for all secrets in .env.example
```

### Step 5 — Set up Vercel

```bash
npx vercel --cwd apps/web      # link to your GitHub org repo
# Set all env vars in the Vercel dashboard
# Set root directory to: apps/web
```

### Step 6 — Set GitHub Actions secrets

```bash
gh secret set VERCEL_TOKEN       --org your-org
gh secret set GCP_SA_KEY         --org your-org   # service account JSON
gh secret set DATABASE_URL       --org your-org
gh secret set GCP_PROJECT_ID     --org your-org
gh secret set VERCEL_ORG_ID      --org your-org
gh secret set VERCEL_PROJECT_ID  --org your-org
```

### Step 7 — Run migrations and seed production

```bash
DATABASE_URL="postgresql://..." pnpm db:migrate
DATABASE_URL="postgresql://..." pnpm db:seed
```

### Step 8 — First deploy

```bash
git push origin main   # triggers the full CI/CD pipeline
```

---

## CI/CD pipeline

Every push to `main` triggers the full pipeline via GitHub Actions (`.github/workflows/ci-cd.yml`):

```
Push to main
  ├── Lint + type-check (all packages in parallel)
  ├── Unit tests (spins up a test Postgres)
  ├── Build (Turborepo — only rebuilds changed packages)
  ├── Deploy to Vercel (Next.js frontend)
  ├── Build Docker images → push to Artifact Registry
  ├── Deploy Cloud Run services (ai-agent, kb-ingestion)
  └── Run DB migrations
```

Pull requests run lint + type-check + tests only — no deploy. CODEOWNERS auto-assigns the right reviewer based on which folder was changed.

---

## Cursor MCP tools

Each team member should add these to their Cursor MCP config to use ElevenLabs, v0, and beyondPresence directly from the Cursor AI composer.

**Config file location:**
- Mac/Linux: `~/.cursor/mcp.json`
- Windows: `%APPDATA%\Cursor\mcp.json`

```json
{
  "mcpServers": {
    "elevenlabs": {
      "command": "npx",
      "args": ["-y", "@elevenlabs/mcp"],
      "env": {
        "ELEVENLABS_API_KEY": "your_elevenlabs_key"
      }
    },
    "v0": {
      "command": "npx",
      "args": ["-y", "v0-mcp"],
      "env": {
        "V0_API_KEY": "your_v0_api_key"
      }
    },
    "beyondpresence": {
      "command": "node",
      "args": ["./infra/mcp/beyondpresence.js"],
      "env": {
        "BEYOND_PRESENCE_API_KEY": "your_key"
      }
    }
  }
}
```

Restart Cursor after saving. Go to **Settings → MCP** to verify the green connection dots.

**Using v0 in Cursor:** Prompt the AI composer with `"Use v0 to generate a [component description]"` and Cursor will call v0, receive the component, and insert it directly into your file — no browser round-trip needed.

---

## Team ownership

Each epic has a dedicated owner who works primarily in one `apps/` folder. Team members can work fully in parallel because there is zero overlap between app folders.

| Epic | Folder | Owner |
|---|---|---|
| Monorepo shell + auth + infra | `apps/web`, `packages/*`, `infra/` | Tech lead |
| E1 — Video consultation | `apps/video`, `packages/knowledge-base` | Member 1 |
| E2 — Medical dashboard | `apps/dashboard` | Member 2 |
| E3 — Appointments and queue | `apps/appointments` | Member 3 |
| E4 — Doctor AI agent | `apps/ai-agent`, `packages/knowledge-base` | Member 4 |
| E5+E6 — RBAC, admin, medications | `apps/admin`, `packages/auth` | Member 5 |

**The golden rule:** Never modify `packages/db/prisma/schema.prisma` in a feature branch. DB schema changes always go through a dedicated PR reviewed by the tech lead first — then your feature branch can pull main and use the updated schema.

---

## Branch and PR rules

**Branch naming:**
```
e{epic-number}/{short-description}

Examples:
  e1/video-room-creation
  e2/vaccination-status-badges
  e3/google-calendar-sync
  e4/pubmed-search-tool
  e5/nurse-medication-view
```

**Never push directly to `main`.** It is branch-protected and requires a passing CI run and at least one approval.

**PR title format:**
```
[E{N}] Short description
[E2] Add vaccination status badges with STIKO logic
[E3] Sync appointment to Google Calendar on booking confirmed
```

**Merge strategy:** Squash merge always — keeps the main branch history clean and readable.

---

## Germany-specific requirements

These apply to the entire codebase and must be respected by all team members:

- **Data residency** — all data stored in GCP Frankfurt (`europe-west3`) for DSGVO compliance
- **Diagnosis codes** — use ICD-10-GM (German modification), not US ICD-10-CM
- **Drug names** — show German trade names alongside generic names (DrugBank EU / ABDATA)
- **Vaccination schedule** — STIKO (Robert Koch Institut), not CDC or WHO generic
- **Insurance classification** — always distinguish GKV (gesetzlich) from PKV (privat)
- **Email compliance** — all emails must include an unsubscribe link (DSGVO Art. 21)
- **Recording consent** — both parties must explicitly consent before any call can be recorded
- **Date format** — `DD.MM.YYYY` throughout the entire UI, never `MM/DD/YYYY`
- **Medication frequency labels** (German):

| Enum value | German label |
|---|---|
| `ONCE_DAILY` | 1x täglich |
| `TWICE_DAILY` | 2x täglich |
| `THREE_TIMES_DAILY` | 3x täglich |
| `AS_NEEDED` | Bei Bedarf |
| `WEEKLY` | 1x wöchentlich |

- **Prescription dosage notation** — use German Rezept format: `"1-0-1"` means morning / noon / evening
- **Primary language** — all UI text in German. English only as a fallback for developer-facing labels.

---

## End-to-end test flow

Use this 20-step flow to verify the complete MVP is working correctly after any significant change:

1. Log in as `patient.weber@mediconnect.de`
2. Book an appointment with Dr. Mueller (tomorrow at 10:00 Uhr)
3. Verify: Google Calendar event created for both doctor and patient
4. Verify: confirmation email visible in Mailhog at [localhost:8025](http://localhost:8025)
5. Log in as `dr.mueller@mediconnect.de`
6. Open queue dashboard → Weber appears with status **Wartend**
7. Click **Anrufen** → beyondPresence video room opens in left panel
8. Verify: right sidebar shows Weber's allergies (Penicillin) and active medications
9. Open AI chat widget → type `"Welche Medikamente nimmt dieser Patient?"`
10. Verify: Claude responds with Weber's medications pulled from injected patient context
11. Click the speaker icon on the AI response → ElevenLabs reads it aloud in German
12. Type `"Was sind die aktuellen Leitlinien für Hypertonie?"` → AI retrieves AWMF guideline via RAG
13. Type `"Wechselwirkungen zwischen Metformin und Ibuprofen?"` → Claude calls drug interaction tool
14. Close AI chat → click **Gespräch beenden**
15. Post-call notes modal appears → type notes → click **Speichern**
16. Verify: appointment status is now **Erledigt** in the queue
17. Log in as `nurse.schmidt@mediconnect.de`
18. Verify: can see Weber's medication schedule, can check off "Verabreicht"
19. Verify: doctor private notes section does not appear anywhere in the nurse view
20. Log in as `admin.bauer@mediconnect.de` → upload a PDF to the hospital knowledge base → verify chunk count appears

All 20 steps passing = MVP complete.

---

## License

Private — all rights reserved. Not open source.

---

*Built with care for the German healthcare system. Patient data is always stored in the EU and handled in accordance with DSGVO/GDPR.*