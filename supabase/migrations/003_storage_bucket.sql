-- ============================================================
-- Uzury Platform — Storage Bucket & Policies
-- Run this in: Supabase Dashboard → SQL Editor
-- Purpose: Creates the 'documents' storage bucket and allows
--          anon/authenticated users to upload and read files.
-- ============================================================

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow all operations for now (just like our tables)
CREATE POLICY "Allow public read access on documents bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents');

CREATE POLICY "Allow public upload on documents bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow public update on documents bucket"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'documents');

CREATE POLICY "Allow public delete on documents bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents');
