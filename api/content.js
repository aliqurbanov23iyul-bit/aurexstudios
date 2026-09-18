const defaultContent = require('../data/default-content.json');
const { getReadySql } = require('../server/db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store');
  try {
    const sql = await getReadySql();
    if (!sql) return res.status(200).json(defaultContent);
    const rows = await sql`SELECT content FROM site_state WHERE id = 'main' LIMIT 1`;
    if (rows.length) return res.status(200).json(rows[0].content);
    await sql`
      INSERT INTO site_state(id, content, updated_at)
      VALUES('main', ${JSON.stringify(defaultContent)}::jsonb, now())
      ON CONFLICT(id) DO NOTHING
    `;
    return res.status(200).json(defaultContent);
  } catch (e) {
    console.error('content api fallback:', e.message);
    return res.status(200).json(defaultContent);
  }
};
