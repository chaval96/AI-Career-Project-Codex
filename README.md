# Career Intelligence OS

This repository contains a runnable **MVP API scaffold** for Career Intelligence OS plus product documentation.

## What is included
- Product and architecture docs in `/Users/utku/career-intel-os/docs`
- A Node.js API server in `/Users/utku/career-intel-os/src` aligned with `/Users/utku/career-intel-os/docs/api_openapi.yaml`
- Storage backends:
  - `memory` (default)
  - `postgres` (persistent)
- Docker setup for API + Postgres in `/Users/utku/career-intel-os/docker-compose.yml`
- Integration tests in `/Users/utku/career-intel-os/tests`

## Install

```bash
npm install
```

## Run (memory backend)

```bash
npm test
npm start
```

Server default: `http://localhost:3000`

Web interface: `http://localhost:3000/`

Health check:

```bash
curl http://localhost:3000/health
```

Example response:

```json
{
  "status": "ok",
  "service": "career-intel-os-api",
  "store_backend": "memory",
  "db_ready": true
}
```

## Run (Postgres backend via Docker)

```bash
npm run docker:up
```

This starts:
- API: `http://localhost:3000`
- Postgres: `localhost:5432`

Stop containers:

```bash
npm run docker:down
```

## Run API against your own Postgres (without Docker)

```bash
STORE_BACKEND=postgres DATABASE_URL=postgres://career:career@localhost:5432/career_intel_os npm start
```

## Implemented API routes
- `POST /v1/auth/magic-link`
- `POST /v1/profile/resume`
- `POST /v1/profile/confirm`
- `GET /v1/taxonomy/roles`
- `POST /v1/assessments/start`
- `POST /v1/assessments/events`
- `POST /v1/assessments/complete`
- `POST /v1/blueprint/generate`
- `GET /v1/blueprint/{blueprint_id}`
- `GET /v1/blueprint/{blueprint_id}/pdf`
- `POST /v1/execution/checkin`

## Interface coverage
- `/` serves the MVP web console with:
  - navigation tabs (Overview, Profile, Assessments, Blueprint, Execution)
  - action buttons wired to live API endpoints
  - activity log showing request results and errors
  - backend/DB readiness status from `/health`

## Repository docs
- `/Users/utku/career-intel-os/docs/whitepaper.md` — investor-grade white paper
- `/Users/utku/career-intel-os/docs/prd.md` — product requirements (MVP + v1 scope)
- `/Users/utku/career-intel-os/docs/data_dictionary.md` — schemas and conventions
- `/Users/utku/career-intel-os/docs/api_openapi.yaml` — OpenAPI v3 backend contract

## Notes
- Postgres tables are created automatically on API startup when `STORE_BACKEND=postgres`.
- Resume parsing and scoring are deterministic scaffold implementations for development.
