const { getReadySql } = require('../server/db');
const { requireAdmin } = require('../server/auth');

module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const sql = await getReadySql();
    if (!sql) return res.status(200).json([]);
    if (req.method === 'GET') {
      const rows = await sql`SELECT id,name,email,subject,message,created_at,is_read FROM contact_messages ORDER BY created_at DESC LIMIT 100`;
      return res.status(200).json(rows);
    }
    if (req.method === 'PATCH') {
      const id = Number(req.body?.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'Missing id' });
      await sql`UPDATE contact_messages SET is_read=${!!req.body?.is_read} WHERE id=${id}`;
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'DELETE') {
      const id = Number(req.body?.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'Missing id' });
      await sql`DELETE FROM contact_messages WHERE id=${id}`;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('admin-messages:', e.message);
    return res.status(500).json({ error: 'Mesajları yükləmək mümkün olmadı.' });
  }
};
