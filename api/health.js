const { getReadySql, databaseConfigured, getConnectionString } = require('../server/db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!databaseConfigured()) {
    return res.status(503).json({ ok: false, database: 'not_configured', env: 'DATABASE_URL / POSTGRES_URL / NEON_DATABASE_URL' });
  }
  try {
    const sql = await getReadySql();
    const rows = await sql`SELECT now() AS now`;
    return res.status(200).json({ ok: true, database: 'connected', now: rows[0]?.now || null, connection: getConnectionString().includes('neon.tech') ? 'neon' : 'postgres' });
  } catch (e) {
    return res.status(503).json({ ok: false, database: 'connection_failed', error: e.message || 'Database connection failed' });
  }
};
