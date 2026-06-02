const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('node:crypto');
const { Pool } = require('pg');

const app = express();

const PORT = Number(process.env.PORT || 8787);
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('Missing DATABASE_URL environment variable');
}

const isLocalDb = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');
const DISABLE_SSL_VERIFY = process.env.PGSSL_DISABLE_VERIFY === 'true';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: isLocalDb
    ? false
    : {
        rejectUnauthorized: !DISABLE_SSL_VERIFY
      }
});

if (IS_PROD && ALLOWED_ORIGINS.length === 0) {
  throw new Error('Missing ALLOWED_ORIGINS in production environment');
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('CORS origin is not allowed'));
  }
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '150kb' }));

app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 80,
    standardHeaders: true,
    legacyHeaders: false
  })
);

const initDatabase = async () => {
  await pool.query(`
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
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'vmdev-contact-api',
    time: new Date().toISOString()
  });
});

app.post('/api/contact', async (req, res) => {
  try {
    const { nombre = '', email = '', idea = '', website = '' } = req.body || {};

    if (typeof website === 'string' && website.trim() !== '') {
      res.status(200).json({ ok: true });
      return;
    }

    const payload = {
      nombre: String(nombre).trim(),
      email: String(email).trim(),
      idea: String(idea).trim()
    };

    if (!payload.nombre || !payload.email || !payload.idea) {
      res.status(400).json({ ok: false, error: 'Missing required fields' });
      return;
    }

    if (!isValidEmail(payload.email)) {
      res.status(400).json({ ok: false, error: 'Invalid email format' });
      return;
    }

    if (payload.nombre.length > 120 || payload.email.length > 160 || payload.idea.length > 1600) {
      res.status(400).json({ ok: false, error: 'Field length out of range' });
      return;
    }

    await pool.query(
      `
      INSERT INTO contacts (id, nombre, email, idea, source_ip, user_agent, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'new')
      `,
      [
        crypto.randomUUID(),
        payload.nombre,
        payload.email,
        payload.idea,
        req.ip || '',
        req.get('user-agent') || ''
      ]
    );

    res.status(201).json({ ok: true });
  } catch (_error) {
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Route not found' });
});

const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`[vmdev-api] listening on :${PORT}`);
    });
  } catch (error) {
    console.error('[vmdev-api] database init failed', error);
    process.exit(1);
  }
};

startServer();
