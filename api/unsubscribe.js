const crypto = require('crypto');
const { getReadySql } = require('../server/db');

function verifyToken(token) {
  try {
    const secret = process.env.ADMIN_SECRET || '';
    if (!secret || !token) return null;

    const [payload, sig] = String(token).split('.');
    if (!payload || !sig) return null;

    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    return Buffer.from(payload, 'base64url').toString('utf8').trim().toLowerCase();
  } catch {
    return null;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');

  const email = verifyToken(req.query?.token);
  if (!email) return res.status(400).send('Keçərsiz abunəlikdən çıxma linki.');

  try {
    const sql = await getReadySql();
    if (!sql) return res.status(503).send('Xidmət hazırda əlçatan deyil.');

    await sql`UPDATE subscribers SET status='unsubscribed', updated_at=now() WHERE email=${email}`;

    return res.status(200).send(`<!doctype html>
<html lang="az"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aurex Studio</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f8ff;color:#17324d;display:grid;place-items:center;min-height:100vh;margin:0;padding:20px">
<div style="max-width:520px;background:white;border:1px solid #dce9f8;border-radius:18px;padding:32px;text-align:center">
<h1 style="margin-top:0">Abunəlik dayandırıldı</h1>
<p>Bu e-poçt ünvanına Aurex Studio newsletter mesajları artıq göndərilməyəcək.</p>
<a href="/" style="color:#245ea8">Aurex Studio ana səhifəsi</a>
</div></body></html>`);
  } catch (error) {
    console.error('unsubscribe:', error.message);
    return res.status(500).send('Abunəlikdən çıxma zamanı xəta baş verdi.');
  }
};
