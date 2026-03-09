-- Additional performance indexes
-- support_tickets: admin layout runs a count by status on every page load
CREATE INDEX IF NOT EXISTS idx_support_tickets_status
  ON support_tickets(status);

CREATE INDEX IF NOT EXISTS idx_support_tickets_practice_status
  ON support_tickets(practice_id, status);

-- support_ticket_messages: ticket detail fetches by ticket_id + is_internal
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_internal
  ON support_ticket_messages(ticket_id, is_internal);
