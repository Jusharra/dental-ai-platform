-- =====================================================
-- Recall campaign helper functions
-- =====================================================

-- Increment contacted count and recalculate success_rate
CREATE OR REPLACE FUNCTION increment_campaign_contacted(cid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE recall_campaigns
  SET
    contacted_count  = contacted_count + 1,
    success_rate     = CASE
                         WHEN (contacted_count + 1) > 0
                         THEN ROUND((appointments_booked::DECIMAL / (contacted_count + 1)) * 100, 1)
                         ELSE 0
                       END,
    updated_at       = NOW()
  WHERE id = cid;
END;
$$ LANGUAGE plpgsql;

-- Increment appointments_booked and recalculate success_rate
CREATE OR REPLACE FUNCTION increment_campaign_booked(cid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE recall_campaigns
  SET
    appointments_booked = appointments_booked + 1,
    success_rate        = CASE
                            WHEN contacted_count > 0
                            THEN ROUND(((appointments_booked + 1)::DECIMAL / contacted_count) * 100, 1)
                            ELSE 0
                          END,
    updated_at          = NOW()
  WHERE id = cid;
END;
$$ LANGUAGE plpgsql;
