# GitHub Epic E1 — copy into Issues / Projects

Use **Epic** (milestone or parent issue): **E1 — Video consultation**

Branch prefix: `e1/` · PR title: `[E1] …`

## Child issues (paste title + body)

### 1. `[E1] Beyond Presence room creation + persist session on appointment`

**Body:** Implement server-side room creation (Beyond Presence API when `BEYOND_PRESENCE_*` + LiveKit/Pipecat env configured; otherwise Jitsi stub). Persist `videoRoomUrl` / `videoSessionId` on `Appointment`. Doctor-only `POST` to start call.

**Acceptance:** Starting a call writes DB fields; patient can open the same join URL after doctor starts.

---

### 2. `[E1] Doctor call layout: video + patient context sidebar`

**Body:** Doctor route shows embedded video + sidebar: allergies, medications, recent diagnoses (from Prisma). German UI.

**Acceptance:** Demo patient seed shows Penicillin allergy and meds in sidebar.

---

### 3. `[E1] Patient waiting room + join when doctor starts`

**Body:** Patient route polls appointment until `callStartedAt` / status allows join; show Warteraum copy until then.

**Acceptance:** Patient sees waiting state before doctor starts; video appears after start.

---

### 4. `[E1] Post-call notes + structured SOAP summary (Claude)`

**Body:** End call flow: free-text notes, optional Claude SOAP (`ANTHROPIC_API_KEY`), persist `soapSummary` / `soapStructured` on appointment.

**Acceptance:** Notes saved; with API key, SOAP generated; without key, deterministic stub SOAP from notes.

---

### 5. `[E1] Hospital document upload pipeline for consultation-time RAG`

**Body:** Admin UI + API: upload/paste text → chunk → `KnowledgeChunk` rows with `metadata.kind = hospital_upload`. Retrieval helper for consultation context (lexical rank using `@mediconnect/knowledge-base`).

**Acceptance:** Admin can add chunks; API returns ranked chunks for a query.

---

### Cross-epic (link only)

### `[E3] Calendar invite + email with join link`

**Body:** Per readme E1 narrative: confirmation email + Google Calendar with video link. Implemented under Epic E3; link this issue as dependency from E1 patient join story.

---

## Labels (suggested)

`epic:E1`, `area:video`, `area:api`, `area:admin`
