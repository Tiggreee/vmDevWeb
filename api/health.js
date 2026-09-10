// Health check del API de contacto.
module.exports = (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'vmdev-contact-api',
    time: new Date().toISOString()
  });
};
