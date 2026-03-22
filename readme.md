# MediConnect 🏥

> **German telehealth platform (MVP monorepo)** — multi-app Next.js workspace for video visits, charting, appointments, doctor AI chat, and admin KB tools. The sections **What’s implemented** and **Roadmap** describe what the repo actually ships today versus planned work.

---

## Table of contents

- [What is MediConnect?](#what-is-mediconnect)
- [What’s implemented today](#whats-implemented-today)
- [Roadmap / not built yet](#roadmap--not-built-yet)
- [Architecture overview](#architecture-overview)
- [Tech stack](#tech-stack)
- [Monorepo structure](#monorepo-structure)
- [Database schema (Prisma)](#database-schema-prisma)
- [Auth roles (as implemented)](#auth-roles-as-implemented)
- [Medical knowledge & AI](#medical-knowledge--ai)
- [Prerequisites](#prerequisites)
- [Local development setup](#local-development-setup)
- [Environment variables](#environment-variables)
- [Running the project](#running-the-project)
- [Demo users (seed)](#demo-users-seed)
- [Deploying to production](#deploying-to-production)
- [CI/CD](#cicd)
- [Cursor MCP tools](#cursor-mcp-tools)
- [Team ownership](#team-ownership)
- [Branch and PR rules](#branch-and-pr-rules)
- [Germany-specific requirements](#germany-specific-requirements)
- [Smoke-test checklist](#smoke-test-checklist)

---

## What is MediConnect?

MediConnect is a **Turborepo + pnpm** monorepo of Next.js 14 apps sharing **Prisma**, **NextAuth (credentials)**, and **@mediconnect/ui**. It targets German healthcare conventions (GKV/PKV, ICD-10-GM labels in seed data, STIKO-oriented vaccination modeling) while much of the **UI copy is still English** in places.

The **product vision** is telehealth with video, shared records, scheduling, and clinical AI. **Only the items under [What’s implemented today](#whats-implemented-today) are present in code**; older docs that described Google Calendar MCP, full audit logs, or a floating Claude widget on every page were **aspirational** and are listed under [Roadmap](#roadmap--not-built-yet).

---

## What’s implemented today

### `apps/web` — entry redirect

- Root page **redirects** to the **dashboard** app login (`NEXT_PUBLIC_URL_DASHBOARD`, default `http://localhost:3002/login`). It is **not** a multi-role portal shell.

### `apps/dashboard` — medical record UI (E2)

- **NextAuth** + middleware; **MediConnectGlassApp** shell (overview demo metrics, hub links to other apps).
- **Health records** (when a `Patient` row exists for the user): **DashboardShell** tabs — profile, medical history, vaccinations, medications, insurance — backed by **`/api/v1/patients/...`** routes.
- **Nurse** role: profile + medications tab with **administration** API support.
- **Drug search** API for prescribing flows.
- **German i18n** strings exist for many dashboard labels (mixed with English elsewhere).

### `apps/video` — consultation (E1)

- **Doctor**: list appointments, open a **per-appointment call** client (Beyond Presence / LiveKit depending on env).
- **Patient**: hub, **waiting room / call** routes, optional **AI avatar** flow.
- APIs for appointment **start/complete/status**, **patient summary** for the visit, knowledge preview / RAG-related endpoints.
- **SOAP-style note** helper can use **Anthropic** when `ANTHROPIC_API_KEY` is set; otherwise stub behavior (see `apps/video/lib/soap-generate.ts`).

### `apps/appointments` — booking & queue (E3)

- **Patient**: book from **doctor availability rules**, optional **queue** view.
- **Doctor**: **today’s queue** with status transitions; **availability** management APIs.
- **Booking rules**: max **two** future active bookings per patient; **overlap** protection; **video room URL** generated for the appointment.
- **Cron reminder** route (`/api/cron/reminders`) guarded by `CRON_SECRET`.
- **Google Calendar** and **email**: **not production-ready** — `apps/appointments/app/lib/integrations.ts` **logs / stubs** unless `GOOGLE_CALENDAR_ENABLED`, `GMAIL_SENDER_EMAIL`, etc. are wired.

### `apps/ai-agent` — doctor clinical chat (E4)

- **`/chat`**: doctor/admin-only **clinical assistant** backed by **Featherless** (or any OpenAI-compatible server): `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`.
- **Tools** (see `packages/knowledge-base`): **`search_hospital_knowledge`** (pgvector + Hugging Face embeddings), **`get_patient_clinical_summary`** (with care-relationship checks), **`check_drug_interaction`** (**demo stub**, no live RxNorm/FDA call in the tool handler).
- Optional **ElevenLabs** TTS via API route when keys are set.
- **`/` redirects to `/chat`** (no intermediate hub page).

### `apps/admin` — admin shell & KB (E5)

- **NextAuth**; home page **tabs** for RBAC / users / medications are **placeholder copy** (not CRUD UIs).
- **`/knowledge`**: hospital **knowledge upload**, chunk statistics, links to **backfill embeddings** admin API (see `apps/admin/app/api/admin/knowledge/*`).

### Shared packages & local infra

- **`packages/db`**: Prisma schema, migrations, **seed** (`packages/db/prisma/seed.ts`).
- **`packages/auth`**, **`packages/ui`** (including **App Hub** nav and **glass auth** shell), **`packages/knowledge-base`**, **`packages/i18n`**, etc.
- **Docker**: root `docker-compose.yml` builds each app image; `infra/docker/docker-compose.yml` (included) provides **Postgres + pgvector**, **Redis**, **MinIO**, **Mailhog**.

---

## Roadmap / not built yet

These were described in earlier vision docs but are **missing, stubbed, or only partially sketched** in the current repo:

- **Unified web portal** with role-based routing from `apps/web` (beyond redirect-to-dashboard).
- **Production Google Calendar + Gmail** (or MCP-driven) sync for bookings; current implementation is **explicitly stub / log** unless env flags are set.
- **Floating AI widget** embedded in every doctor page; today the doctor uses the **separate ai-agent app** (`/chat`).
- **Claude-first** production chat with **live** PubMed, ICD-10, OpenFDA, RxNorm, DrugBank tools in the **same** path as `/chat` (the shipped assistant uses **Featherless** + the tools listed above).
- **Admin console**: real **user provisioning**, **RBAC editing**, **organization** management — tabs are placeholders.
- **Audit logging** UI and **append-only access logs** (no `AuditLog` model in Prisma today).
- **Doctor private notes** and **lab results** **UIs** wired end-to-end (`DoctorNote` exists in schema; not exposed in dashboard tabs as shipped).
- **AWMF / NVL bulk ingestion** as a pipeline (hospital KB is **upload + embeddings** oriented).
- **End-to-end automated E2E** suite and **GitHub Actions** deploy pipeline as described in older readme sections (see [CI/CD](#cicd)).

---

## Architecture overview

```
Browser (localhost or deployed hosts)
  └─ Six Next.js apps (see docker-compose / pnpm dev ports)
       ├─ apps/web           → redirect to dashboard /login
       ├─ apps/video         → E1 video / call / patient flows
       ├─ apps/dashboard     → E2 chart + glass shell
       ├─ apps/appointments  → E3 book + queue + availability
       ├─ apps/ai-agent      → E4 /chat + APIs
       └─ apps/admin         → E5 placeholders + /knowledge

Data & services
  ├─ PostgreSQL 15 + pgvector (local: Docker; Prisma is source of truth)
  ├─ Redis, MinIO, Mailhog (local Docker — optional for full stack)
  └─ External (optional): Beyond Presence / LiveKit, Hugging Face Inference, Featherless, ElevenLabs, Anthropic (SOAP helper)
```

**Note:** Production deployment to **GCP / Vercel / Cloud Run** is **documented as a target** in `infra/terraform/`; operationally, validate that stack against your own environment.

---

## Tech stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | All `apps/*` |
| Monorepo | Turborepo + pnpm | `turbo.json`, `pnpm-workspace.yaml` |
| UI | Tailwind + shadcn-style components | `packages/ui` |
| Data | Prisma + PostgreSQL | `packages/db` |
| Auth | NextAuth (credentials) | Per-app origin / `NEXTAUTH_URL` |
| Embeddings | Hugging Face Inference | `HF_TOKEN` / `HUGGINGFACE_API_TOKEN` for RAG |
| Doctor chat LLM | OpenAI-compatible (Featherless default) | `LLM_*` env vars |
| Video | Beyond Presence + LiveKit (when configured) | `apps/video` |
| i18n | `@mediconnect/i18n` | Appointments + dashboard strings |

---

## Monorepo structure

```
mediconnect/
├── apps/
│   ├── web/                # Redirect → dashboard login
│   ├── video/              # E1
│   ├── dashboard/          # E2
│   ├── appointments/       # E3
│   ├── ai-agent/           # E4
│   └── admin/              # E5 shell + knowledge
├── packages/
│   ├── db/                 # Prisma schema, migrations, seed
│   ├── ui/
│   ├── auth/
│   ├── knowledge-base/
│   └── …
├── infra/
│   ├── docker/             # Postgres, Redis, MinIO, Mailhog
│   └── terraform/          # Target GCP layout (verify before prod)
├── docker-compose.yml      # Full stack: infra + all Next apps
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```

---

## Database schema (Prisma)

Models in `packages/db/prisma/schema.prisma` include (among others): **`User`**, **`Patient`**, **`Doctor`**, **`PatientDoctor`**, **`Appointment`**, **`DoctorAvailabilityRule`**, **`AvailabilityException`**, **`MedicalHistory`**, **`MedicalHistoryAttachment`**, **`Vaccination`**, **`StikoScheduleRule`**, **`Medication`**, **`MedicationAdministration`**, **`Insurance`**, **`DoctorNote`**, **`KnowledgeChunk`**.

There is **no** separate `LabResult` or `AuditLog` model in the current schema. Features not tied to an API or page should be treated as **not shipped**.

---

## Auth roles (as implemented)

| Role | Typical use in repo |
|---|---|
| `DOCTOR` | Dashboard clinical mode, video doctor routes, appointments queue, ai-agent `/chat` |
| `NURSE` | Dashboard: limited tabs + medication administration |
| `PATIENT` | Dashboard patient mode, appointments booking/queue, video patient routes |
| `ADMIN` | Admin app, ai-agent `/chat`, some cross-doctor queue selection |

**Enforcement** is via **NextAuth session**, **middleware**, and **per-route checks** in API handlers. The **admin UI does not yet implement** full user/role management screens.

---

## Medical knowledge & AI

### Implemented path (doctor `/chat`)

- **Hospital KB**: semantic search over **`KnowledgeChunk`** with **pgvector** (requires embedded chunks; HF token for embeddings).
- **Patient chart tool**: structured summary when **care relationship** rules pass.
- **Drug interaction**: **stub** response only (no live NLM/FDA integration in tool code).

### Roadmap / additional sources

External medical APIs (PubMed, OpenFDA, RxNorm, DrugBank, WHO, ICD APIs) and bulk AWMF ingestion are **not wired** into the production doctor chat loop as described above; they remain **integration candidates**.

**Patient education** RAG and **video** RAG paths also live under `packages/knowledge-base` and related app routes — configure tokens and seed data as in `.env.example` and package scripts (`seed:patient-kb`, etc.).

---

## Prerequisites

```bash
node --version    # >= 18 (>= 20 recommended)
pnpm --version    # align with packageManager in package.json (e.g. 9.x)
docker --version  # for local Postgres stack and/or full compose
```

---

## Local development setup

```bash
git clone <your-repo-url> mediconnect
cd mediconnect
pnpm install

# Environment: repo root (Prisma and Next apps expect root `.env` — see `.env.example`)
cp .env.example .env
# Edit .env — at minimum DATABASE_URL, NEXTAUTH_SECRET, and any LLM/HF/video keys you need

# Infra services only:
cp infra/docker/.env.example infra/docker/.env   # optional; defaults work for many setups
docker compose -f infra/docker/docker-compose.yml up -d

pnpm db:migrate
pnpm db:seed
pnpm dev
```

Default **local** DB URL (matches Docker compose):  
`postgresql://mediconnect:mediconnect@localhost:5432/mediconnect`

**Useful URLs:** Mailhog UI [http://localhost:8025](http://localhost:8025), MinIO console [http://localhost:9001](http://localhost:9001).

**Full stack in Docker** (all apps + infra): from repo root, see comments in `docker-compose.yml` and `package.json` scripts `docker:up` / `docker:build`.

---

## Environment variables

See **`.env.example`** for the authoritative list. Highlights:

- **`DATABASE_URL`** — Postgres for Prisma.
- **`NEXTAUTH_SECRET`**, per-app **`NEXTAUTH_URL`** — required for each Next app you run.
- **`HF_TOKEN` / `HUGGINGFACE_API_TOKEN`** — embeddings for RAG.
- **`LLM_BASE_URL`**, **`LLM_API_KEY`**, **`LLM_MODEL`** — doctor clinical chat (Featherless or compatible).
- **Video**: `BEYOND_PRESENCE_*`, `LIVEKIT_*`, etc., when testing E1.
- **Optional**: `ANTHROPIC_API_KEY` (SOAP helper in video), `ELEVENLABS_*`, `GOOGLE_CALENDAR_ENABLED`, `GMAIL_SENDER_EMAIL`, `CRON_SECRET` (reminders).

---

## Running the project

```bash
pnpm dev                                          # all apps (Turbo)
pnpm dev --filter=@mediconnect/dashboard          # one app; use @mediconnect/<name>
pnpm build
pnpm test
pnpm lint
pnpm type-check
pnpm db:seed
pnpm --filter @mediconnect/db db:studio           # Prisma Studio
```

App ports (default): **web 3000**, **video 3001**, **dashboard 3002**, **appointments 3003**, **ai-agent 3004**, **admin 3005**.

---

## Demo users (seed)

From `packages/db/prisma/seed.ts` — password for all: **`mediconnect-dev`**

| Email | Role |
|---|---|
| `doctor@mediconnect.local` | DOCTOR (Dr. Mueller) |
| `nurse@mediconnect.local` | NURSE |
| `patient@mediconnect.local` | PATIENT (Max Weber — sample history, vaccines, meds, TK insurance) |
| `admin@mediconnect.local` | ADMIN |

Each app has its own **`/login`** origin; use the same credentials.

---

## Deploying to production

`infra/terraform/` and comments in `docker-compose.yml` describe a **target** GCP-oriented layout (Cloud SQL, Cloud Run, etc.). **Validate** networking, secrets, and compliance (DSGVO) for your organization before relying on it. There is **no substitute** for your own runbooks and staging environment.

---

## CI/CD

The repository **does not currently include** a checked-in `.github/workflows/ci-cd.yml` matching the old readme’s full pipeline description. Add GitHub Actions (or other CI) to run **`pnpm lint`**, **`pnpm type-check`**, **`pnpm test`**, and **`pnpm build`** as appropriate for your deployment targets.

---

## Cursor MCP tools

Optional developer ergonomics (ElevenLabs, v0, beyondPresence) via MCP — see previous examples in git history or configure servers in Cursor’s MCP settings. Not required to run the apps locally.

---

## Team ownership

| Area | Folder |
|---|---|
| Entry / env | `apps/web`, root compose |
| Video | `apps/video`, `packages/knowledge-base` (RAG helpers) |
| Dashboard | `apps/dashboard` |
| Appointments | `apps/appointments` |
| AI agent | `apps/ai-agent`, `packages/knowledge-base` |
| Admin | `apps/admin`, `packages/auth` |

---

## Branch and PR rules

Use protected `main`, feature branches, and PR review as your team prefers. Example branch names: `e1/...`, `e2/...`. **Schema changes**: coordinate `packages/db/prisma/schema.prisma` via dedicated reviews/migrations.

---

## Germany-specific requirements

Aspirational rules for production (data residency, ICD-10-GM, STIKO, GKV/PKV labeling, German UI copy, consent for recordings, email compliance) — **apply progressively**; the codebase is **not yet uniformly compliant** with every bullet. Use this list as a **product/engineering checklist**, not a guarantee of current behavior.

---

## Smoke-test checklist

Realistic manual checks (adjust for your env keys):

1. **Seed** DB; sign in **`patient@mediconnect.local`** on **appointments** — book a slot; confirm appointment appears in DB or doctor queue.
2. Sign in **`doctor@mediconnect.local`** on **appointments** — open **queue**, change an appointment status.
3. Open **dashboard** as doctor — open **Health records** / chart tabs for the seeded patient relationship.
4. Open **video** as doctor — see **appointments** list; open a visit (requires video-related env if you expect a real room).
5. Open **ai-agent** `/chat` as doctor — send a message with **`LLM_*`** configured; optional: confirm KB search when chunks are embedded.
6. Open **admin** `/knowledge` as **admin** — upload or verify chunk counts / backfill if applicable.
7. With **Mailhog** up, trigger flows that call email stubs and confirm **log or capture** behavior matches `integrations.ts`.

---

## License

Private — all rights reserved. Not open source.

---

*Goal: care-oriented software for the German healthcare context. Production use requires your own legal, security, and compliance review.*
