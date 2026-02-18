# AI Career Path OS

This repository contains the AI Career Path OS API + web app scaffold and product specifications.

## Runtime Baseline

### 1) Install

```bash
npm install
```

### 2) Environment

```bash
cp .env.example .env
```

Key vars:
- `PORT`
- `STORE_BACKEND` (`memory` or `postgres`)
- `DATABASE_URL`
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`, `APP_PORT` (for Docker Compose)

### 3) Run fullstack dev mode (default)

```bash
npm test
npm run dev
```

- Frontend app: `http://localhost:5173`
- API: `http://localhost:3000`
- Health: `http://localhost:3000/health`

### 4) Run production-style API serving built frontend

```bash
npm start
```

### 5) Run with Postgres (local DB)

```bash
STORE_BACKEND=postgres DATABASE_URL=postgres://career:career@localhost:5432/career_intel_os npm run start:postgres
```

### 6) Run with Postgres (Docker Compose)

```bash
npm run docker:up
```

Services:
- API: `http://localhost:${APP_PORT:-3000}`
- Postgres: `localhost:${POSTGRES_PORT:-5432}`

Useful commands:

```bash
npm run docker:logs
npm run docker:down
```

## CI Baseline

GitHub Actions workflow:
- File: `.github/workflows/ci.yml`
- Triggers: push + pull request on `main`
- Matrix: Node `20`, `22`
- Steps: checkout, `npm install`, `npm test`

If tests fail, CI fails the build.

## Docs

- `/Users/utku/career-intel-os/docs/ux_spec.md`
- `/Users/utku/career-intel-os/docs/architecture.md`
- `/Users/utku/career-intel-os/docs/ops_spec.md`
- `/Users/utku/career-intel-os/docs/implementation_backlog.md`
- `/Users/utku/career-intel-os/docs/api_openapi.yaml`
- `/Users/utku/career-intel-os/docs/data_dictionary.md`

## Notes

- Postgres schema bootstrap runs on API startup when `STORE_BACKEND=postgres`.
- `LLM_ENABLED` defaults to `false`; deterministic scoring/scenario modules are used by default.
- Taxonomy enrichment adapters are optional and fallback to local mappings when external keys are disabled.
- Debug panels are disabled in user flow; optional diagnostics route is `/admin` only when `VITE_DEBUG_UI=true`.
