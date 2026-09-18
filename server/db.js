const { neon } = require('@neondatabase/serverless');

let sqlClient = null;
let readyPromise = null;

function getConnectionString() {
  const raw = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.NEON_DATABASE_URL || '';
  return String(raw).trim().replace(/^psql\s+/i, '').trim().replace(/^['\"]|['\"]$/g, '');
}

function getSql() {
  const url = getConnectionString();
  if (!url) return null;
  if (!/^postgres(?:ql)?:\/\//i.test(url)) return null;
  if (!sqlClient) sqlClient = neon(url);
  return sqlClient;
}

async function ensureSchema(sql) {
  if (!sql) return false;
  if (!readyPromise) {
    readyPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS site_state (
          id text PRIMARY KEY,
          content jsonb NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS contact_messages (
          id bigserial PRIMARY KEY,
          name text NOT NULL,
          email text NOT NULL,
          subject text DEFAULT '',
          message text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          is_read boolean NOT NULL DEFAULT false
        )
      `;
      await sql`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS name text`;
      await sql`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS email text`;
      await sql`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS subject text DEFAULT ''`;
      await sql`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS message text`;
      await sql`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()`;
      await sql`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false`;
      await sql`
        CREATE TABLE IF NOT EXISTS subscribers (
          id bigserial PRIMARY KEY,
          email text UNIQUE NOT NULL,
          status text NOT NULL DEFAULT 'active',
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'`;
      await sql`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()`;
      await sql`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()`;
      return true;
    })().catch((err) => {
      readyPromise = null;
      throw err;
    });
  }
  return readyPromise;
}

async function getReadySql() {
  const sql = getSql();
  if (!sql) return null;
  await ensureSchema(sql);
  return sql;
}

function databaseConfigured() {
  return !!getConnectionString();
}

module.exports = { getSql, getReadySql, ensureSchema, databaseConfigured, getConnectionString };
