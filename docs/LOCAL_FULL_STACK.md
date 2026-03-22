# MediConnect — how apps connect, language, and Docker (full stack)

## How the monorepo is wired

| Mechanism | What it does |
|-----------|----------------|
| **pnpm workspaces** | `apps/*` and `packages/*` share `@mediconnect/db`, `@mediconnect/auth`, `@mediconnect/ui`, `@mediconnect/knowledge-base`, `@mediconnect/i18n`, etc. |
| **Database** | One PostgreSQL schema (Prisma). All Next apps that use `DATABASE_URL` talk to the same DB. |
| **Auth** | NextAuth credentials per app. `getCurrentUser()` uses the session for that origin. Signing in again is required on each port (separate cookies). |
| **App Hub** | `AppHubNav` in `@mediconnect/ui` links **between** apps using absolute URLs from `NEXT_PUBLIC_URL_*` (defaults `http://localhost:3001`–`3005`). Each app is a separate origin; navigation is full page loads to another port. |
| **Web :3000** | Redirects to the dashboard sign-in (`NEXT_PUBLIC_URL_DASHBOARD` + `/login`). Use the dashboard sidebar to open other apps after you log in. |
| **AI agent** | `apps/ai-agent` exposes `/api/v1/chat/kb` etc.; the UI calls **same-origin** `/api/...` only. |
| **Video / LiveKit** | Optional `LIVEKIT_*` env on `apps/video`. beyondPresence and other keys are separate (see root `.env.example`). |

### Gaps to be aware of

- **Cross-app login**: Switching apps via App Hub does not transfer a session; sign in at each app’s `/login` (same seeded emails/passwords) when you need an authenticated session on that origin.
- **Docker**: Root `docker-compose.yml` sets `NEXTAUTH_SECRET` and per-service `NEXTAUTH_URL` for each app container.
- **Type-check**: `packages/knowledge-base` may fail `tsc` until Prisma selects and schema match the KB code (known drift in some branches).

## Is everything in English?

**Mostly UI is English** for product-facing strings:

- `packages/i18n` exposes **English** copy (`locale` is fixed to `"en"` in the provider; `dashboard-translations` and `appointments-translations` are English).
- **Exceptions / mixed:**
  - `apps/dashboard/app/lib/utils.ts` — German medication frequency labels (`1x täglich`, etc.) and vaccination status labels (`Fällig`, `Überfällig`).
  - `apps/dashboard/.../medications-list.tsx` — slot keys `Morgens`, `Mittags`, `Abends` (labels also go through i18n keys; check `meds.slot_*` in translations).
  - **Seed / demo data** (e.g. doctor specialty “Allgemeinmedizin”, hospital names) can be German.
  - **readme.md** describes German market features (DSGVO, STIKO, etc.) — documentation, not runtime UI.

So the codebase is **not 100% English**; dashboard medication/vaccination formatting still uses some German clinical conventions.

## Docker: one command for infra + all six apps

The **root** `docker-compose.yml` **includes** `infra/docker/docker-compose.yml`, so one project brings up:

- **Postgres (pgvector)**, **Redis**, **MinIO**, **Mailhog**
- **web** :3000, **video** :3001, **dashboard** :3002, **appointments** :3003, **ai-agent** :3004, **admin** :3005

### End-to-end steps

1. **Root `.env`** (repo root, next to root `docker-compose.yml`): copy from `compose.env.example` and set at least `NEXTAUTH_SECRET`. For Doctor AI replies, set `LLM_BASE_URL`, `LLM_API_KEY`, and optionally `LLM_MODEL`, `HF_TOKEN`.

2. **Infra-only env (optional)** `infra/docker/.env`: copy from `infra/docker/.env.example` for Postgres/Redis/MinIO/Mailhog ports. Do **not** put full app secrets there (see comments in that compose file).

3. **Database** (on the host, with Postgres reachable at `localhost:5432` after infra is up):

   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

4. **Start the full stack** (sequential builds avoid some Docker Desktop Windows issues):

   ```bash
   pnpm docker:up
   ```

   Or manually: `docker compose build web` … then `docker compose up -d` (see header comments in `docker-compose.yml`).

5. **Open in the browser**

   | App | URL |
   |-----|-----|
   | Portal | http://localhost:3000 |
   | Video | http://localhost:3001 |
   | Dashboard | http://localhost:3002 |
   | Appointments | http://localhost:3003 |
   | Doctor AI | http://localhost:3004/chat |
   | Admin | http://localhost:3005 |

6. **Mailhog** UI: http://localhost:8025 · **MinIO** console: http://localhost:9001 (see `infra/docker/.env.example` for default credentials).

### Local dev without Docker apps

- Infra only: `docker compose -f infra/docker/docker-compose.yml up -d`
- All Next apps on host: `pnpm dev` (Turborepo runs dev tasks in parallel; set `DATABASE_URL` to localhost Postgres).

## Reference: root `docker-compose.yml` structure

The file lives at the **repository root** and:

- `include:` merges **infra/docker/docker-compose.yml**
- Defines **build args** `NEXT_PUBLIC_URL_*` so client-side App Hub URLs match published ports
- Builds each app with the shared **Dockerfile** (`TURBO_FILTER`, `APP_DIR`, `PORT`)

See the actual file in the repo for the full YAML; keep it in sync when adding new services or env vars.
