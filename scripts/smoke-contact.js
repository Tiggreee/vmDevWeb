const http = require('node:http');

const getBaseUrl = () => {
  const configuredUrl = (process.env.CONTACT_API_URL || '').trim();
  return configuredUrl ? configuredUrl.replace(/\/$/, '') : '';
};

const startLocalMockApi = async () => {
  const server = http.createServer(async (req, res) => {
    const respond = (statusCode, body) => {
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };

    if (req.method === 'GET' && req.url === '/api/health') {
      respond(200, { ok: true, service: 'mock-contact-api' });
      return;
    }

    if (req.method === 'POST' && req.url === '/api/contact') {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }

      let payload;
      try {
        payload = JSON.parse(body || '{}');
      } catch (_error) {
        respond(400, { ok: false, error: 'Invalid JSON' });
        return;
      }

      if (typeof payload.website === 'string' && payload.website.trim() !== '') {
        respond(200, { ok: true });
        return;
      }

      respond(201, { ok: true });
      return;
    }

    respond(404, { ok: false, error: 'Route not found' });
  });

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to resolve local smoke API address');
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      })
  };
};

const run = async () => {
  const configuredBaseUrl = getBaseUrl();
  const mockApi = configuredBaseUrl ? null : await startLocalMockApi();
  const baseUrl = configuredBaseUrl || mockApi.baseUrl;

  try {
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    if (!healthResponse.ok) {
      throw new Error(`Health check failed with status ${healthResponse.status}`);
    }

    const payload = {
      nombre: 'Smoke Check',
      email: 'smoke@example.com',
      idea: 'Smoke validation run',
      website: 'bot-check'
    };

    const contactResponse = await fetch(`${baseUrl}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!contactResponse.ok) {
      throw new Error(`Contact endpoint failed with status ${contactResponse.status}`);
    }

    const body = await contactResponse.json();
    if (!body || body.ok !== true) {
      throw new Error('Contact endpoint returned unexpected payload');
    }

    console.log(`smoke:ok ${baseUrl}`);
  } finally {
    if (mockApi) {
      await mockApi.close();
    }
  }
};

run().catch((error) => {
  console.error(`smoke:fail ${error.message}`);
  process.exit(1);
});
