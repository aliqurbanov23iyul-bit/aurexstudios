CREATE TABLE IF NOT EXISTS site_state (
  id text PRIMARY KEY,
  content jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  subject text DEFAULT '',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_read boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS subscribers (
  id bigserial PRIMARY KEY,
  email text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
