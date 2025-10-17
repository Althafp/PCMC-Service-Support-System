-- ================================================================
-- Link Reports to Projects
-- ================================================================
-- This ensures reports automatically inherit the technician's project
-- and PDFs can display the appropriate project logo

-- Step 1: Add project_id to service_reports table
-- ================================================================
ALTER TABLE public.service_reports
ADD COLUMN IF NOT EXISTS project_id UUID NULL;

-- Add foreign key constraint
ALTER TABLE public.service_reports
DROP CONSTRAINT IF EXISTS service_reports_project_id_fkey;

ALTER TABLE public.service_reports
ADD CONSTRAINT service_reports_project_id_fkey
  FOREIGN KEY (project_id)
  REFERENCES projects (id)
  ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_service_reports_project_id 
  ON public.service_reports USING btree (project_id);

-- Add comment
COMMENT ON COLUMN public.service_reports.project_id IS 'Project associated with this report (inherited from technician)';

-- Step 2: Update existing reports with technician's project
-- ================================================================
-- Populate project_id for existing reports from the technician who created them
UPDATE service_reports sr
SET project_id = (
  SELECT u.project_id
  FROM users u
  WHERE u.id = sr.technician_id
  LIMIT 1
)
WHERE sr.project_id IS NULL
  AND sr.technician_id IS NOT NULL;

-- Step 3: Create function to auto-set project on report creation
-- ================================================================
CREATE OR REPLACE FUNCTION set_report_project_from_technician()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-populate project_id from the technician's project
  IF NEW.technician_id IS NOT NULL AND NEW.project_id IS NULL THEN
    NEW.project_id := (
      SELECT project_id
      FROM users
      WHERE id = NEW.technician_id
      LIMIT 1
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run before INSERT or UPDATE
DROP TRIGGER IF EXISTS trigger_set_report_project ON service_reports;

CREATE TRIGGER trigger_set_report_project
  BEFORE INSERT OR UPDATE ON service_reports
  FOR EACH ROW
  EXECUTE FUNCTION set_report_project_from_technician();

-- ================================================================
-- VERIFICATION
-- ================================================================

-- Check if column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'service_reports' AND column_name = 'project_id';

-- Check reports with projects
SELECT 
  sr.complaint_no,
  sr.technician_id,
  u.full_name as technician_name,
  u.project_id as tech_project_id,
  sr.project_id as report_project_id,
  p.name as project_name,
  p.logo_url as project_logo
FROM service_reports sr
LEFT JOIN users u ON sr.technician_id = u.id
LEFT JOIN projects p ON sr.project_id = p.id
ORDER BY sr.created_at DESC
LIMIT 10;

-- Count reports by project
SELECT 
  p.name as project_name,
  p.logo_url,
  COUNT(sr.id) as report_count
FROM projects p
LEFT JOIN service_reports sr ON sr.project_id = p.id
GROUP BY p.id, p.name, p.logo_url
ORDER BY report_count DESC;

-- ================================================================
-- USAGE NOTES
-- ================================================================
/*
HOW IT WORKS:
1. Technician has project_id set in users table
2. When technician creates a report, trigger runs
3. Trigger copies technician's project_id to report
4. Report now linked to project
5. PDF generator fetches project.logo_url
6. Logo displayed in PDF header

MANUAL PROJECT ASSIGNMENT:
If you need to change a report's project:
  UPDATE service_reports
  SET project_id = 'NEW_PROJECT_UUID'
  WHERE id = 'REPORT_UUID';

AUTOMATIC PROJECT ASSIGNMENT:
All new reports automatically get the technician's project
No manual intervention needed!

LOGO IN PDF:
1. Report has project_id
2. PDF generator queries: SELECT logo_url FROM projects WHERE id = report.project_id
3. If logo_url exists → Downloads and embeds in PDF
4. If no logo → PDF generates without logo
5. Small logo (12x12mm) appears beside "PCMC Service Report" heading
*/


