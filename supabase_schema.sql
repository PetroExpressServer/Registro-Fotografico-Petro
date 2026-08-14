-- ============================================================
-- REGISTRO FOTOGRÁFICO PETROASEO - SUPABASE DATABASE & STORAGE SCHEMA
-- ============================================================

-- 1. Create Storage Bucket for Photos (record-photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('record-photos', 'record-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for Public Access
CREATE POLICY "Public Read record-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'record-photos');

CREATE POLICY "Public Upload record-photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'record-photos');

CREATE POLICY "Public Update record-photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'record-photos');

CREATE POLICY "Public Delete record-photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'record-photos');


-- 2. Create Master Records Table (Daily Reports)
CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY, -- Format: {contract}_{date} e.g. PRINCIPAL_2026-08-08
  contract TEXT NOT NULL,
  date TEXT NOT NULL,
  supervisor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 3. Create Individual Photos Table (No Overwriting by different supervisors)
CREATE TABLE IF NOT EXISTS record_photos (
  id TEXT PRIMARY KEY, -- Format: {contract}_{date}_{slot_id}
  record_id TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  contract TEXT NOT NULL,
  date TEXT NOT NULL,
  slot_id TEXT NOT NULL,
  slot_title TEXT,
  supervisor TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_record_photos_record_id ON record_photos(record_id);
CREATE INDEX IF NOT EXISTS idx_record_photos_contract_date ON record_photos(contract, date);


-- 4. Create Independent Audit Log Table
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


-- 5. Create Supervisors Table
CREATE TABLE IF NOT EXISTS supervisors (
  name TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 6. Create Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  config JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 7. Enable Row Level Security & Public Access Policies
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Records Policies
CREATE POLICY "Public read records" ON records FOR SELECT USING (true);
CREATE POLICY "Public insert records" ON records FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update records" ON records FOR UPDATE USING (true);
CREATE POLICY "Public delete records" ON records FOR DELETE USING (true);

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
