# vmDev Web

![CI](https://github.com/Tiggreee/vmDevWeb/actions/workflows/ci.yml/badge.svg)

Personal portfolio for Victor Salgado (vmDev), focused on US job opportunities in full stack engineering.

Live site: https://tiggreee.github.io/vmDevWeb/

## Professional focus
- Recruiter-friendly product narrative (clear value, process, and outcomes)
- Frontend reliability with progressive enhancement and accessibility basics
- Contact pipeline with abuse controls and API fallback strategy
- Production-aware backend setup (security headers, CORS allowlist, rate limit, PostgreSQL SSL)

## Stack
- Frontend: HTML, CSS, vanilla JavaScript
- Contact API: Node.js, Express, PostgreSQL

## Current features
- Recruiter-focused English landing page
- Smooth section navigation with active state
- Responsive layout with accessible skip link and focus states
- Contact form with spam honeypot and dual delivery path:
  - API (`POST /api/contact`) when `data-api-url` is configured
  - `mailto` fallback when API is unavailable
- Backend hardening:
  - Helmet + rate limit
  - strict CORS via `ALLOWED_ORIGINS`
  - PostgreSQL SSL configuration for production

## Architecture
1. Static frontend is served independently (GitHub Pages compatible)
2. Contact form submits to `POST /api/contact` when `data-api-url` is set
3. API validates payload, applies anti-bot honeypot, and persists to PostgreSQL
4. If API is unavailable, frontend falls back to `mailto` to prevent lead loss

## Quality and validation
- CI workflow: `.github/workflows/ci.yml`
- On every push/PR:
  - install dependencies with `npm ci`
  - run `npm run check`
  - run `npm run build`
- On push/manual (non-PR):
  - run smoke test against an in-process mock API (deterministic in CI)
  - optionally target a real deployment by setting `CONTACT_API_URL`

## Engineering decisions and tradeoffs
1. Vanilla frontend instead of framework:
   - Pros: low complexity, fast load, easier control of output
   - Tradeoff: fewer abstractions for large-scale UI state
2. Dedicated contact API instead of mail-only:
   - Pros: persistence, validation, observability, anti-abuse controls
   - Tradeoff: requires runtime + database operations
3. API + mail fallback dual path:
   - Pros: resilient lead capture when API is unavailable
   - Tradeoff: adds a second delivery branch to maintain

## Impact targets
- Fast first render and low dependency footprint
- Reliable message intake with validation and abuse mitigation
- Clear technical story for hiring managers and engineering interviewers

## Project structure
- `index.html`: page markup and metadata
- `styles.css`: visual system and responsive behavior
- `main.js`: UI interactions and contact flow
- `server/index.js`: contact API and health endpoint
- `assets/`: static media files

## Local development
1. Install dependencies:
```bash
npm install
```
2. Start API in watch mode:
```bash
npm run dev
```
3. Configure `.env` from `.env.example`.
4. Serve the frontend with any static server and set:
```txt
data-api-url="http://localhost:8787/api/contact"
```
5. Health check:
```bash
curl http://localhost:8787/api/health
```

## Environment variables
- `PORT` (default `8787`)
- `ALLOWED_ORIGINS` (comma-separated)
- `DATABASE_URL` (required)
- `PGSSL_DISABLE_VERIFY` (optional, defaults to secure verification)

## Scripts
- `npm start`
- `npm run dev`
- `npm run check`
- `npm run lint`
- `npm run test`
- `npm run typecheck`
- `npm run build`

## Next upgrades
1. Add visual benchmark screenshots and Lighthouse summary
2. Add endpoint-level tests with isolated test database
3. Add deployment health dashboard and SLA-style status notes
