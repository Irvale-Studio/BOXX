-- Email log table for tracking all automated and manual email sends
CREATE TABLE IF NOT EXISTS email_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type  TEXT NOT NULL,
  recipient   TEXT NOT NULL,
  subject     TEXT,
  status      TEXT NOT NULL DEFAULT 'sent',
  error       TEXT,
  resend_id   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_log_created_at ON email_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_email_type ON email_log(email_type);
