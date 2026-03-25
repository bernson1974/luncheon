-- In-app notices (e.g. when host cancels; participants see on next visit).
-- Run in Neon SQL Editor once.

CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_token TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'invitation_cancelled',
  body TEXT NOT NULL,
  lunch_date_id TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_unread
  ON user_notifications (user_token)
  WHERE read_at IS NULL;
