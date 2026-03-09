-- Support Ticket System
-- Tables: support_tickets, support_ticket_messages
-- Sequence for ticket_number (ST-001, ST-002, …)

-- ── Sequence + auto-number function ──────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS support_ticket_seq START 1;

CREATE OR REPLACE FUNCTION next_ticket_number()
RETURNS TEXT LANGUAGE sql AS $$
  SELECT 'ST-' || LPAD(nextval('support_ticket_seq')::TEXT, 3, '0');
$$;

-- ── Tables ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number   TEXT        UNIQUE NOT NULL DEFAULT next_ticket_number(),
  practice_id     UUID        NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  created_by      UUID        NOT NULL REFERENCES users(id),
  category        TEXT        NOT NULL CHECK (category IN ('technical_issue','billing','feature_request','training')),
  subject         TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  priority        TEXT        NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID        NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id   UUID        NOT NULL REFERENCES users(id),
  sender_role TEXT        NOT NULL CHECK (sender_role IN ('practice_user','super_admin')),
  body        TEXT        NOT NULL,
  is_internal BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Trigger: update updated_at on new message ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_ticket_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE support_tickets SET updated_at = NOW() WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ticket_updated_at ON support_ticket_messages;
CREATE TRIGGER trg_ticket_updated_at
  AFTER INSERT ON support_ticket_messages
  FOR EACH ROW EXECUTE FUNCTION update_ticket_updated_at();

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_support_tickets_practice_id ON support_tickets(practice_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status      ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON support_ticket_messages(ticket_id);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE support_tickets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- support_tickets: practice users see own practice; super_admin sees all
CREATE POLICY "practice_users_see_own_tickets" ON support_tickets
  FOR SELECT USING (
    practice_id = (
      SELECT practice_id FROM users WHERE id = auth.uid() LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "practice_users_insert_tickets" ON support_tickets
  FOR INSERT WITH CHECK (
    practice_id = (
      SELECT practice_id FROM users WHERE id = auth.uid() LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "admin_update_tickets" ON support_tickets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- support_ticket_messages: practice users see non-internal messages on own tickets
-- super_admin sees all
CREATE POLICY "practice_users_see_messages" ON support_ticket_messages
  FOR SELECT USING (
    (
      is_internal = FALSE
      AND ticket_id IN (
        SELECT id FROM support_tickets WHERE practice_id = (
          SELECT practice_id FROM users WHERE id = auth.uid() LIMIT 1
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "practice_users_insert_messages" ON support_ticket_messages
  FOR INSERT WITH CHECK (
    (
      sender_id = auth.uid()
      AND is_internal = FALSE
      AND ticket_id IN (
        SELECT id FROM support_tickets WHERE practice_id = (
          SELECT practice_id FROM users WHERE id = auth.uid() LIMIT 1
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
