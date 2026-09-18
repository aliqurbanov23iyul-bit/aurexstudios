const defaultContent = require('../data/default-content.json');
const { getReadySql, databaseConfigured } = require('../server/db');
const { requireAdmin } = require('../server/auth');

module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  if (req.method === 'GET') {
    try {
      const sql = await getReadySql();
      if (!sql) return res.status(200).json({ content: defaultContent, database: { connected: false, configured: false } });
      const rows = await sql`SELECT content, updated_at FROM site_state WHERE id = 'main' LIMIT 1`;
      if (rows.length) return res.status(200).json({ content: rows[0].content, updated_at: rows[0].updated_at, database: { connected: true, configured: true } });
      await sql`
        INSERT INTO site_state(id, content, updated_at)
        VALUES('main', ${JSON.stringify(defaultContent)}::jsonb, now())
        ON CONFLICT(id) DO NOTHING
      `;
      return res.status(200).json({ content: defaultContent, database: { connected: true, configured: true } });
    } catch (e) {
      console.error('admin-content GET:', e.message);
      return res.status(200).json({ content: defaultContent, database: { connected: false, configured: databaseConfigured(), error: e.message } });
    }
  }

  if (req.method === 'PUT') {
    const content = req.body?.content;
    if (!content || typeof content !== 'object' || Array.isArray(content)) return res.status(400).json({ error: 'Invalid content' });
    try {
      const sql = await getReadySql();
      if (!sql) return res.status(503).json({ error: 'Database bağlantısı qurulmayıb.' });
      await sql`
        INSERT INTO site_state(id, content, updated_at)
        VALUES('main', ${JSON.stringify(content)}::jsonb, now())
        ON CONFLICT(id) DO UPDATE SET content = EXCLUDED.content, updated_at = now()
      `;
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('admin-content PUT:', e.message);
      return res.status(500).json({ error: 'Database-ə yazmaq mümkün olmadı.', detail: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
