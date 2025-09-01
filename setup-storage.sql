-- Setup Supabase Storage for Image Uploads
-- Run this in your Supabase SQL Editor

-- 1. Create the storage bucket for images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- 2. Create storage policies for the images bucket

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to view images
CREATE POLICY "Allow authenticated users to view images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

-- Policy: Allow users to update their own images
CREATE POLICY "Allow users to update their own images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

-- Policy: Allow users to delete their own images
CREATE POLICY "Allow users to delete their own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

-- 3. Create a function to get public URLs for images
CREATE OR REPLACE FUNCTION get_image_url(bucket_name TEXT, file_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN 'https://' || current_setting('app.settings.supabase_url') || '/storage/v1/object/public/' || bucket_name || '/' || file_path;
END;
$$;

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- 5. Create a trigger to automatically set file metadata
CREATE OR REPLACE FUNCTION handle_new_image()
RETURNS TRIGGER AS $$
BEGIN
  -- Set metadata for new images
  NEW.metadata = COALESCE(NEW.metadata, '{}'::jsonb) || 
    jsonb_build_object(
      'uploaded_by', auth.uid(),
      'uploaded_at', now(),
      'file_size', NEW.metadata->>'size',
      'mime_type', NEW.metadata->>'mimetype'
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on storage.objects
CREATE TRIGGER on_image_upload
  BEFORE INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'images')
  EXECUTE FUNCTION handle_new_image();

-- 6. Create a view for easy access to image information
CREATE OR REPLACE VIEW image_uploads AS
SELECT 
  id,
  name,
  bucket_id,
  owner,
  metadata,
  created_at,
  updated_at,
  get_image_url(bucket_id, name) as public_url
FROM storage.objects
WHERE bucket_id = 'images';

-- Grant access to the view
GRANT SELECT ON image_uploads TO authenticated;

-- 7. Optional: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_id ON storage.objects(bucket_id);
CREATE INDEX IF NOT EXISTS idx_storage_objects_owner ON storage.objects(owner);
CREATE INDEX IF NOT EXISTS idx_storage_objects_created_at ON storage.objects(created_at);

-- 8. Test the setup (optional - remove after testing)
-- INSERT INTO storage.objects (bucket_id, name, owner, metadata)
-- VALUES ('images', 'test/test.jpg', auth.uid(), '{"size": 1024, "mimetype": "image/jpeg"}'::jsonb);

-- SELECT * FROM image_uploads;
