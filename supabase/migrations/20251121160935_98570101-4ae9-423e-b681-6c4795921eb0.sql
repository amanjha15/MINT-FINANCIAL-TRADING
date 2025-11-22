-- Create storage bucket for AI coach chat files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ai-coach-files',
  'ai-coach-files',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'text/plain', 'text/csv', 'text/markdown']
);

-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own chat files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ai-coach-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read their own chat files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ai-coach-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own chat files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ai-coach-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);