const { getReadySql } = require('../server/db');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const subject = String(req.body?.subject || '').trim();
  const message = String(req.body?.message || '').trim();
  if (!name || !EMAIL_RE.test(email) || !message) return res.status(400).json({ error: 'Məlumatları düzgün doldurun.' });
  if (name.length > 120 || email.length > 320 || subject.length > 200 || message.length > 5000) return res.status(400).json({ error: 'Məlumat həddindən artıq uzundur.' });
  try {
    const sql = await getReadySql();
    if (!sql) return res.status(503).json({ error: 'Database bağlantısı qurulmayıb.' });
    await sql`INSERT INTO contact_messages(name,email,subject,message) VALUES(${name},${email},${subject},${message})`;
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('contact api:', e.message);
    return res.status(500).json({ error: 'Mesajı saxlamaq mümkün olmadı.' });
  }
};
