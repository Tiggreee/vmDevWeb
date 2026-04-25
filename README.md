# vmDev Web

Portfolio personal de vmDev con UI futurista, casos reales y flujo de contacto listo para backend.

## Stack
- Frontend: HTML, CSS, JavaScript vanilla
- Backend opcional de contacto: Node.js + Express + PostgreSQL

## Funcionalidades principales
- Navegacion por secciones con scroll suave y estado activo.
- Filtros de proyectos por categoria con empty state.
- Modal accesible con foco controlado (Escape + trap de teclado).
- Animaciones de entrada por seccion (IntersectionObserver).
- Formulario de contacto con validacion y dos modos de envio:
	- API (`POST /api/contact`) cuando configuras `data-api-url`.
	- Fallback a `mailto` cuando no hay backend.
- Hardening SEO: Open Graph, Twitter cards, JSON-LD, `robots.txt`, `sitemap.xml`, `site.webmanifest`.

## Estructura
- `index.html`: markup principal y metadatos SEO.
- `styles.css`: sistema visual, layout, responsive, estados UI.
- `main.js`: interacciones de UI y flujo de contacto.
- `server/index.js`: API de contacto y endpoint de salud.
- `assets/`: recursos visuales.

## Desarrollo local
1. Instala dependencias:

```bash
npm install
```

2. Inicia el backend de contacto:

```bash
npm run dev
```

3. Define variables de entorno en `.env` (basado en `.env.example`) y asegura que `DATABASE_URL` apunte a tu Postgres local o remoto.

4. Sirve el frontend con un servidor estatico (por ejemplo Live Server) y configura el formulario:
	 - En `index.html`, atributo `data-api-url` del formulario:
	 - `http://localhost:8787/api/contact`

5. Comprueba salud de API:

```bash
curl http://localhost:8787/api/health
```

## Variables de entorno
Usa `.env.example` como base:

- `PORT`: puerto del backend (default `8787`)
- `ALLOWED_ORIGINS`: lista separada por comas para CORS
- `DATABASE_URL`: cadena de conexion de PostgreSQL (obligatoria)

## Deploy
- Frontend: GitHub Pages (Deploy from branch).
- Backend: despliega `server/index.js` en un servicio Node (Render, Railway, VPS, etc.) y apunta `data-api-url` al endpoint publicado.
- Base de datos: usa PostgreSQL administrado (Railway Postgres, Neon, Supabase o Render Postgres) y configura `DATABASE_URL` en el entorno del backend.

## Scripts
- `npm start`: levanta API en modo normal
- `npm run dev`: API en watch mode
- `npm run check`: validacion sintactica de `main.js` y `server/index.js`
