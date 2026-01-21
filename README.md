# Studio Gallery

Full-stack React + FastAPI + MongoDB application for curated image galleries.

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

- Admin UI: http://localhost:3000
- API: http://localhost:8000/api/health

## Structure

```
backend/   FastAPI service, image processing, API
frontend/  React admin + client gallery
ops/       nginx config for SPA + API proxy
```

## Highlights

- High-resolution image serving with explicit thumb/display/original variants
- Secure share links with optional passwords (bcrypt)
- Cursor-style UI: minimal, calm, developer-grade hierarchy
