const { getReadySql } = require('../server/db');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 320) return res.status(400).json({ code: 'invalid', message: 'Düzgün e-poçt ünvanı daxil edin.' });
  try {
    const sql = await getReadySql();
    if (!sql) return res.status(503).json({ code: 'database_offline', message: 'Abunə sistemi hazırda aktiv deyil.' });
    const existing = await sql`SELECT id,status FROM subscribers WHERE email = ${email} LIMIT 1`;
    if (existing.length) {
      if (existing[0].status === 'active') return res.status(409).json({ code: 'duplicate', message: 'Bu e-poçt artıq abunədir.' });
      await sql`UPDATE subscribers SET status='active', updated_at=now() WHERE id=${existing[0].id}`;
      return res.status(200).json({ ok: true, message: 'Abunəliyiniz yenidən aktiv edildi.' });
    }
    await sql`INSERT INTO subscribers(email,status) VALUES(${email},'active')`;
    return res.status(200).json({ ok: true, message: 'Abunəliyiniz qeydə alındı.' });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ code: 'duplicate', message: 'Bu e-poçt artıq abunədir.' });
    console.error('subscribe api:', e.message);
    return res.status(500).json({ code: 'error', message: 'Abunəlik zamanı xəta baş verdi.' });
  }
};
