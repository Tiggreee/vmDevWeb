const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const app = express();

const PORT = Number(process.env.PORT || 8787);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'messages.json');

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origen no permitido por CORS'));
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

const ensureDataFile = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch (_error) {
    await fs.writeFile(DATA_FILE, '[]', 'utf8');
  }
};

const readMessages = async () => {
  await ensureDataFile();
  const content = await fs.readFile(DATA_FILE, 'utf8');
  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : [];
};

const writeMessages = async (messages) => {
  await fs.writeFile(DATA_FILE, JSON.stringify(messages, null, 2), 'utf8');
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
      res.status(400).json({ ok: false, error: 'Faltan campos requeridos' });
      return;
    }

    if (!isValidEmail(payload.email)) {
      res.status(400).json({ ok: false, error: 'Email invalido' });
      return;
    }

    if (payload.nombre.length > 120 || payload.email.length > 160 || payload.idea.length > 1600) {
      res.status(400).json({ ok: false, error: 'Campos fuera de rango' });
      return;
    }

    const messages = await readMessages();

    messages.push({
      id: crypto.randomUUID(),
      ...payload,
      createdAt: new Date().toISOString(),
      sourceIp: req.ip,
      userAgent: req.get('user-agent') || ''
    });

    await writeMessages(messages);

    res.status(201).json({ ok: true });
  } catch (_error) {
    res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
});

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`[vmdev-api] listening on :${PORT}`);
});
