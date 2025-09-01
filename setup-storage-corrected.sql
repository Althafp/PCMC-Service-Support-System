-- Corrected Supabase Storage Setup for Image Uploads
-- Run this in your Supabase SQL Editor

-- 1. Create a helper function for image management
CREATE OR REPLACE FUNCTION get_storage_url(bucket_name TEXT, file_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return the standard Supabase storage URL format
  RETURN 'https://' || current_setting('app.settings.supabase_url') || '/storage/v1/object/public/' || bucket_name || '/' || file_path;
END;
$$;

-- 2. Create a table to track image uploads (optional but useful)
CREATE TABLE IF NOT EXISTS image_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  bucket_name TEXT NOT NULL DEFAULT 'images',
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_image_uploads_uploaded_by ON image_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_image_uploads_uploaded_at ON image_uploads(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_image_uploads_bucket_name ON image_uploads(bucket_name);

-- 4. Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON image_uploads TO authenticated;

-- 5. Create a function to log image uploads
CREATE OR REPLACE FUNCTION log_image_upload(
  p_file_path TEXT,
  p_file_name TEXT,
  p_file_size BIGINT,
  p_mime_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_upload_id UUID;
BEGIN
  INSERT INTO image_uploads (file_path, file_name, file_size, mime_type, uploaded_by)
  VALUES (p_file_path, p_file_name, p_file_size, p_mime_type, auth.uid())
  RETURNING id INTO v_upload_id;
  
  RETURN v_upload_id;
END;
$$;

-- 6. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION log_image_upload TO authenticated;

-- 7. Create a view for easy access to image information with computed URLs
CREATE OR REPLACE VIEW image_uploads_view AS
SELECT 
  iu.id,
  iu.file_path,
  iu.file_name,
  iu.file_size,
  iu.mime_type,
  iu.uploaded_by,
  iu.uploaded_at,
  get_storage_url(iu.bucket_name, iu.file_path) as public_url,
  u.email as uploaded_by_email,
  u.full_name as uploaded_by_name
FROM image_uploads iu
LEFT JOIN users u ON iu.uploaded_by = u.id
ORDER BY iu.uploaded_at DESC;

-- 8. Grant access to the view
GRANT SELECT ON image_uploads_view TO authenticated;

-- 9. Test the setup (optional)
-- SELECT * FROM image_uploads_view;
-- SELECT get_storage_url('images', 'test/example.jpg');
