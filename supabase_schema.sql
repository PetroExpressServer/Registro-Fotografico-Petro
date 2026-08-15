-- ============================================================
-- REGISTRO FOTOGRÁFICO PETROASEO - SUPABASE DATABASE & STORAGE SCHEMA
-- SCHEMA ACTUALIZADO PARA MULTI-SUPERVISOR Y PERSISTENCIA DE FOTOS
-- ============================================================

-- 1. Create Storage Bucket for Photos (record-photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('record-photos', 'record-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for Public Access
DROP POLICY IF EXISTS "Public Read record-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload record-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Update record-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete record-photos" ON storage.objects;

CREATE POLICY "Public Read record-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'record-photos');

CREATE POLICY "Public Upload record-photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'record-photos');

CREATE POLICY "Public Update record-photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'record-photos');

CREATE POLICY "Public Delete record-photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'record-photos');


-- 2. Create Master Records Table (Daily Reports per Contract and Date)
CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY, -- Format: {contract}_{date} e.g. PRINCIPAL_2026-08-15
  contract TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 3. Create Shift Supervisors Table (record_shifts)
CREATE TABLE IF NOT EXISTS record_shifts (
  id TEXT PRIMARY KEY, -- Format: {contract}_{date}_{shift} e.g. PRINCIPAL_2026-08-15_turno1
  record_id TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  contract TEXT NOT NULL,
  date TEXT NOT NULL,
  shift TEXT NOT NULL, -- turno1, turno2, turno3, otras
  supervisor TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_record_shift UNIQUE (record_id, shift)
);

CREATE INDEX IF NOT EXISTS idx_record_shifts_record_id ON record_shifts(record_id);


-- 4. Create Individual Photos Table (record_photos)
-- Granular storage per slot_id. Unique constraint on (record_id, slot_id) prevents overwriting other slots.
CREATE TABLE IF NOT EXISTS record_photos (
  id TEXT PRIMARY KEY, -- Format: {contract}_{date}_{slot_id} e.g. PRINCIPAL_2026-08-15_t1_06
  record_id TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  contract TEXT NOT NULL,
  date TEXT NOT NULL,
  shift TEXT NOT NULL, -- turno1, turno2, turno3, otras
  slot_id TEXT NOT NULL,
  slot_title TEXT,
  supervisor TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_record_slot UNIQUE (record_id, slot_id)
);

CREATE INDEX IF NOT EXISTS idx_record_photos_record_id ON record_photos(record_id);
CREATE INDEX IF NOT EXISTS idx_record_photos_contract_date ON record_photos(contract, date);


-- 5. Create Independent Audit Log Table
CREATE TABLE IF NOT EXISTS record_audit (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  contract TEXT NOT NULL,
  date TEXT NOT NULL,
  slot_id TEXT,
  supervisor TEXT NOT NULL,
  action TEXT NOT NULL, -- UPLOAD, REPLACE, DELETE, CLEAR
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_record_audit_record_id ON record_audit(record_id);


-- 6. Create Supervisors Table (List of registered supervisor names)
CREATE TABLE IF NOT EXISTS supervisors (
  name TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 7. Create Settings Table (Document template configuration)
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  config JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 8. Enable Row Level Security & Public Access Policies
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public read records" ON records;
DROP POLICY IF EXISTS "Public insert records" ON records;
DROP POLICY IF EXISTS "Public update records" ON records;
DROP POLICY IF EXISTS "Public delete records" ON records;

DROP POLICY IF EXISTS "Public read record_shifts" ON record_shifts;
DROP POLICY IF EXISTS "Public insert record_shifts" ON record_shifts;
DROP POLICY IF EXISTS "Public update record_shifts" ON record_shifts;
DROP POLICY IF EXISTS "Public delete record_shifts" ON record_shifts;

DROP POLICY IF EXISTS "Public read record_photos" ON record_photos;
DROP POLICY IF EXISTS "Public insert record_photos" ON record_photos;
DROP POLICY IF EXISTS "Public update record_photos" ON record_photos;
DROP POLICY IF EXISTS "Public delete record_photos" ON record_photos;

DROP POLICY IF EXISTS "Public read record_audit" ON record_audit;
DROP POLICY IF EXISTS "Public insert record_audit" ON record_audit;

DROP POLICY IF EXISTS "Public read supervisors" ON supervisors;
DROP POLICY IF EXISTS "Public insert supervisors" ON supervisors;
DROP POLICY IF EXISTS "Public update supervisors" ON supervisors;

DROP POLICY IF EXISTS "Public read settings" ON settings;
DROP POLICY IF EXISTS "Public insert settings" ON settings;
DROP POLICY IF EXISTS "Public update settings" ON settings;

-- Records Policies
CREATE POLICY "Public read records" ON records FOR SELECT USING (true);
CREATE POLICY "Public insert records" ON records FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update records" ON records FOR UPDATE USING (true);
CREATE POLICY "Public delete records" ON records FOR DELETE USING (true);

-- Record Shifts Policies
CREATE POLICY "Public read record_shifts" ON record_shifts FOR SELECT USING (true);
CREATE POLICY "Public insert record_shifts" ON record_shifts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update record_shifts" ON record_shifts FOR UPDATE USING (true);
CREATE POLICY "Public delete record_shifts" ON record_shifts FOR DELETE USING (true);

-- Record Photos Policies
CREATE POLICY "Public read record_photos" ON record_photos FOR SELECT USING (true);
CREATE POLICY "Public insert record_photos" ON record_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update record_photos" ON record_photos FOR UPDATE USING (true);
CREATE POLICY "Public delete record_photos" ON record_photos FOR DELETE USING (true);

-- Record Audit Policies
CREATE POLICY "Public read record_audit" ON record_audit FOR SELECT USING (true);
CREATE POLICY "Public insert record_audit" ON record_audit FOR INSERT WITH CHECK (true);

-- Supervisors Policies
CREATE POLICY "Public read supervisors" ON supervisors FOR SELECT USING (true);
CREATE POLICY "Public insert supervisors" ON supervisors FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update supervisors" ON supervisors FOR UPDATE USING (true);

-- Settings Policies
CREATE POLICY "Public read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Public insert settings" ON settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update settings" ON settings FOR UPDATE USING (true);

-- 9. Enable Realtime Publications for instant multi-device synchronization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'record_photos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE record_photos;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'record_shifts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE record_shifts;
  END IF;
END $$;
