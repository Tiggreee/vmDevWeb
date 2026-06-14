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

app.get("/privacy", (req, res) => {
  res.send(`
    <h1>Privacy Policy</h1>
    <p>vmDev no comparte, vende ni transfiere tus datos personales a terceros.</p>
    <p>La información enviada mediante el formulario de contacto se utiliza únicamente para responder a tu mensaje.</p>
    <p>Si deseas solicitar acceso o eliminación de tus datos, envía un correo a soporte@vmdev.lat.</p>
  `);
});

app.get("/terms", (req, res) => {
  res.send(`
    <h1>Terms of Service</h1>
    <p>Al utilizar este sitio aceptas que la información enviada mediante el formulario de contacto será procesada únicamente para fines de comunicación profesional.</p>
    <p>No se garantiza disponibilidad continua del servicio y el uso indebido del formulario puede resultar en bloqueo automático.</p>
  `);
});

app.get("/datadeletion", (req, res) => {
  res.send(`
    <h1>Data Deletion Instructions</h1>
    <p>Para solicitar la eliminación de tus datos, envía un correo a soporte@vmdev.lat.</p>
  `);
});

app.post('/api/contact', async (req, res) => {
  const { nombre, email, idea } = req.body;

  if (!nombre || !email || !idea) {
    return res.status(400).json({ ok: false, error: 'Missing fields' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: 'Invalid email' });
  }

  const id = crypto.randomUUID();
  const source_ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const user_agent = req.headers['user-agent'] || '';

  try {
    await pool.query(
      `
      INSERT INTO contacts (id, nombre, email, idea, source_ip, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [id, nombre, email, idea, source_ip, user_agent]
    );

    res.status(200).json({ ok: true, id });
  } catch (error) {
    console.error('DB error:', error);
    res.status(500).json({ ok: false, error: 'Database error' });
  }
});

app.listen(PORT, async () => {
  await initDatabase();
  console.log(`Server running on port ${PORT}`);
});
