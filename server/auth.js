const crypto = require('crypto');

function secret() {
  return process.env.ADMIN_SECRET || '';
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  try {
    if (!token || !secret()) return false;
    const [body, sig] = token.split('.');
    if (!body || !sig) return false;
    const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!data.exp || Date.now() > data.exp) return false;
    return data;
  } catch {
    return false;
  }
}

function requireAdmin(req, res) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const user = verifyToken(token);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return user;
}

module.exports = { signToken, verifyToken, requireAdmin };
