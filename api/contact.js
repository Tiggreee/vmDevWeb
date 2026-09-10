// Formulario de contacto de vmdev.lat — funcion serverless en Vercel.
//
// Reemplaza al servicio Express de server/index.js, que quedo suspendido.
// Misma validacion y mismo esquema en Postgres; ademas manda aviso por correo,
// que es lo que faltaba: antes un mensaje entraba a la base y nadie se enteraba.
//
// Variables de entorno:
//   DATABASE_URL      Postgres (Neon, Supabase o cualquiera). Requerida.
//   ALLOWED_ORIGINS   Origenes separados por coma. Requerida en produccion.
//   RESEND_API_KEY    Opcional. Si esta, manda aviso por correo.
//   NOTIFY_EMAIL      A donde llega el aviso. Default: tiggreee@vmdev.lat.

const crypto = require('node:crypto');
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'tiggreee@vmdev.lat';

// El pool se reusa entre invocaciones mientras la instancia siga caliente.
let pool;
const getPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1
    });
  }
  return pool;
};

let tableReady = false;
const ensureTable = async (client) => {
  if (tableReady) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL,
      idea TEXT NOT NULL,
      source_ip TEXT,
      user_agent TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  tableReady = true;
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const notify = async ({ nombre, email, idea }) => {
  if (!RESEND_API_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'vmdev.lat <onboarding@resend.dev>',
        to: [NOTIFY_EMAIL],
        reply_to: email,
        subject: `Contacto desde vmdev.lat — ${nombre}`,
        text: `${nombre} <${email}>\n\n${idea}`
      })
    });
  } catch (error) {
    // Un fallo del correo no debe tumbar la respuesta: el mensaje ya esta guardado.
    console.error('notify error:', error.message);
  }
};

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (origin && ALLOWED_ORIGINS.length && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ ok: false, error: 'Origin not allowed' });
  }

  const { nombre, email, idea } = req.body || {};

  if (!nombre || !email || !idea) {
    return res.status(400).json({ ok: false, error: 'Missing fields' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: 'Invalid email' });
  }
  if (String(idea).length > 5000) {
    return res.status(400).json({ ok: false, error: 'Message too long' });
  }

  const id = crypto.randomUUID();
  const source_ip = req.headers['x-forwarded-for'] || '';
  const user_agent = req.headers['user-agent'] || '';

  try {
    const client = getPool();
    await ensureTable(client);
    await client.query(
      `INSERT INTO contacts (id, nombre, email, idea, source_ip, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, nombre, email, idea, source_ip, user_agent]
    );
    await notify({ nombre, email, idea });
    return res.status(200).json({ ok: true, id });
  } catch (error) {
    console.error('DB error:', error.message);
    return res.status(500).json({ ok: false, error: 'Database error' });
  }
};
