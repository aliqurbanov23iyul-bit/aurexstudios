const { signToken } = require('../server/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SECRET) {
    return res.status(503).json({ error: 'Admin environment variables are not configured.' });
  }
  const password = String(req.body?.password || '');
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Şifrə yanlışdır.' });
  const token = signToken({ role: 'admin', exp: Date.now() + 12 * 60 * 60 * 1000 });
  return res.status(200).json({ ok: true, token });
};
