-- Run this in Neon SQL Editor to add login support.
-- Logged-in users use user.id as creator_token/user_token (no schema change to dates/participants).

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  alias TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
