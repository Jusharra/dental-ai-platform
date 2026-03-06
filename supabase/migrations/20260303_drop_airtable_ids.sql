-- Drop legacy airtable_id columns (not migrating from Airtable)
ALTER TABLE patients DROP COLUMN IF EXISTS airtable_id;
ALTER TABLE appointments DROP COLUMN IF EXISTS airtable_id;
