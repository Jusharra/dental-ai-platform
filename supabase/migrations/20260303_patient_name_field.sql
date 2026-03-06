-- ============================================================================
-- Add patient_name as primary name field, auto-split to first/last via trigger
-- ============================================================================

-- 1. Add patient_name column
ALTER TABLE patients ADD COLUMN patient_name TEXT;

-- 2. Backfill from existing first_name + last_name
UPDATE patients SET patient_name = TRIM(first_name || ' ' || last_name);

-- 3. Make patient_name required, first_name/last_name nullable
ALTER TABLE patients ALTER COLUMN patient_name SET NOT NULL;
ALTER TABLE patients ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN last_name DROP NOT NULL;

-- 4. Trigger function: auto-split patient_name into first_name / last_name
CREATE OR REPLACE FUNCTION split_patient_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.first_name := split_part(NEW.patient_name, ' ', 1);
  -- Everything after the first space is the last name
  IF position(' ' IN NEW.patient_name) > 0 THEN
    NEW.last_name := TRIM(substring(NEW.patient_name FROM position(' ' IN NEW.patient_name) + 1));
  ELSE
    NEW.last_name := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach trigger (fires on INSERT or when patient_name is updated)
CREATE TRIGGER trigger_split_patient_name
BEFORE INSERT OR UPDATE OF patient_name ON patients
FOR EACH ROW
EXECUTE FUNCTION split_patient_name();
