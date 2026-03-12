-- Security: add missing RLS policies for tables that had RLS enabled but no policies.
-- Without policies, RLS-enabled tables deny all access by default (Supabase/PostgreSQL).

-- ============================================================================
-- recall_campaign_patients
-- practice_id lives on recall_campaigns (parent). Join via campaign_id.
-- ============================================================================

DROP POLICY IF EXISTS "Practice access only" ON recall_campaign_patients;
CREATE POLICY "Practice access only"
  ON recall_campaign_patients FOR ALL
  USING (
    campaign_id IN (
      SELECT id FROM recall_campaigns
      WHERE practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
    )
    OR (SELECT role = 'super_admin' FROM users WHERE id = auth.uid())
  );

-- ============================================================================
-- policy_acknowledgments
-- practice_id lives on compliance_policies (parent). Join via policy_id.
-- ============================================================================

DROP POLICY IF EXISTS "Practice access only" ON policy_acknowledgments;
CREATE POLICY "Practice access only"
  ON policy_acknowledgments FOR ALL
  USING (
    policy_id IN (
      SELECT id FROM compliance_policies
      WHERE practice_id = (SELECT practice_id FROM users WHERE id = auth.uid())
    )
    OR (SELECT role = 'super_admin' FROM users WHERE id = auth.uid())
  );
