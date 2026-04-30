const baseUrl = (process.env.CONTACT_API_URL || 'https://api.vmdev.lat').replace(/\/$/, '');

const run = async () => {
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
};

run().catch((error) => {
  console.error(`smoke:fail ${error.message}`);
  process.exit(1);
});
