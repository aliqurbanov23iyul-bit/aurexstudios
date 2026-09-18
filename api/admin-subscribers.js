const { getReadySql } = require('../server/db');
const { requireAdmin } = require('../server/auth');

module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const sql = await getReadySql();
    if (!sql) {
      if (req.method === 'GET') return res.status(200).json({ subscribers: [], total: 0, page: 1, limit: 50, counts: { total: 0, active: 0, unsubscribed: 0 } });
      return res.status(503).json({ error: 'Database bağlantısı qurulmayıb.' });
    }

    if (req.method === 'GET') {
      const search = String(req.query?.search || '').trim();
      const status = ['active','unsubscribed'].includes(req.query?.status) ? req.query.status : '';
      const page = Math.max(1, parseInt(req.query?.page || '1', 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit || '50', 10) || 50));
      const offset = (page - 1) * limit;
      let rows, totalRows;

      if (search && status) {
        rows = await sql`SELECT id,email,status,created_at,updated_at FROM subscribers WHERE email ILIKE ${'%' + search + '%'} AND status=${status} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
        totalRows = await sql`SELECT COUNT(*)::int AS count FROM subscribers WHERE email ILIKE ${'%' + search + '%'} AND status=${status}`;
      } else if (search) {
        rows = await sql`SELECT id,email,status,created_at,updated_at FROM subscribers WHERE email ILIKE ${'%' + search + '%'} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
        totalRows = await sql`SELECT COUNT(*)::int AS count FROM subscribers WHERE email ILIKE ${'%' + search + '%'}`;
      } else if (status) {
        rows = await sql`SELECT id,email,status,created_at,updated_at FROM subscribers WHERE status=${status} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
        totalRows = await sql`SELECT COUNT(*)::int AS count FROM subscribers WHERE status=${status}`;
      } else {
        rows = await sql`SELECT id,email,status,created_at,updated_at FROM subscribers ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
        totalRows = await sql`SELECT COUNT(*)::int AS count FROM subscribers`;
      }

      const counts = await sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='active')::int AS active, COUNT(*) FILTER (WHERE status='unsubscribed')::int AS unsubscribed FROM subscribers`;
      return res.status(200).json({ subscribers: rows, total: totalRows[0]?.count || 0, page, limit, counts: counts[0] || { total: 0, active: 0, unsubscribed: 0 } });
    }

    if (req.method === 'PATCH') {
      const id = Number(req.body?.id);
      const status = req.body?.status;
      if (!Number.isFinite(id) || !['active','unsubscribed'].includes(status)) return res.status(400).json({ error: 'Invalid request' });
      await sql`UPDATE subscribers SET status=${status}, updated_at=now() WHERE id=${id}`;
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const id = Number(req.body?.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'Missing id' });
      await sql`DELETE FROM subscribers WHERE id=${id}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('admin-subscribers:', e.message);
    return res.status(500).json({ error: 'Abunəçiləri yükləmək mümkün olmadı.' });
  }
};
