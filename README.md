# vmDev Web

Personal portfolio for Victor Salgado (vmDev), focused on US job opportunities in full stack engineering.

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
