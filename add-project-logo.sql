-- ================================================================
-- Add Logo Support to Projects
-- ================================================================
-- Allows admins to upload and associate logos with projects
-- Logos will be displayed in PDF reports

-- Step 1: Add logo_url column to projects table
-- ================================================================
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS logo_url TEXT NULL;

-- Add comment
COMMENT ON COLUMN public.projects.logo_url IS 'URL to project logo stored in Supabase Storage';

-- Step 2: Create storage bucket for project logos
-- ================================================================
-- IMPORTANT: Create the bucket FIRST before running policies!

-- Create the bucket (make it PUBLIC so PDFs can access logos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-logos',
  'project-logos',
  true,  -- Public bucket
  524288,  -- 512KB max file size
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 524288,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

-- Step 3: Set up storage policies for project logos
-- ================================================================
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public to view project logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to upload project logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to update project logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to delete project logos" ON storage.objects;

-- Allow public to view logos
CREATE POLICY "Allow public to view project logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-logos');

-- Allow admins to upload logos
CREATE POLICY "Allow admins to upload project logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-logos' 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Allow admins to update logos
CREATE POLICY "Allow admins to update project logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-logos' 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Allow admins to delete logos
CREATE POLICY "Allow admins to delete project logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-logos' 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- ================================================================
-- VERIFICATION
-- ================================================================
-- Check if column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects' AND column_name = 'logo_url';

-- View projects with logos
SELECT 
  id,
  name,
  logo_url,
  is_active
FROM projects
ORDER BY name;

-- ================================================================
-- USAGE NOTES
-- ================================================================
/*
STORAGE BUCKET SETUP (Manual in Supabase Dashboard):
1. Go to Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name: "project-logos"
4. Public: YES (so PDFs can access logos)
5. Click "Create"

UPLOAD FLOW:
1. Admin uploads logo file (PNG, JPG, SVG)
2. File stored in: project-logos/{project-id}/{filename}
3. Public URL generated automatically
4. URL saved to projects.logo_url

PDF INTEGRATION:
1. When generating PDF, fetch report.project_id
2. Get project.logo_url from projects table
3. If logo exists, download and embed in PDF header
4. Display small (e.g., 40x40px) next to report title

RECOMMENDED IMAGE SPECS:
- Format: PNG or JPG (transparent PNG preferred)
- Size: 200x200px to 500x500px (will be scaled down)
- Max file size: 500KB
- Aspect ratio: Square or landscape
*/

