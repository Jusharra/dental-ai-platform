-- HIPAA: Enable pgcrypto extension for DB-level cryptographic functions.
-- Application-level AES-256-GCM encryption (via src/lib/encryption.ts) is used
-- for the most sensitive PHI columns: medical_conditions, allergies, medications.
-- Encrypted values are stored as TEXT (prefixed "enc:v1:...") in those columns.
-- The app transparently detects and decrypts these values on read.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Convert sensitive PHI columns from JSONB to TEXT so encrypted strings can be stored.
-- Existing NULL values remain NULL. Non-null JSONB values are cast to TEXT
-- (they will appear as plaintext JSON until re-saved through the application,
--  at which point the app will write the encrypted form).

ALTER TABLE patients
  ALTER COLUMN medical_conditions TYPE TEXT USING medical_conditions::TEXT,
  ALTER COLUMN allergies TYPE TEXT USING allergies::TEXT,
  ALTER COLUMN medications TYPE TEXT USING medications::TEXT;
