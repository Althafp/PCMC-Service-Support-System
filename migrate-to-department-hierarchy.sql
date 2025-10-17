-- ========================================
-- MIGRATE TO DEPARTMENT-BASED HIERARCHY
-- ========================================

-- This migration adds department_id to teams table
-- so that teams belong to specific departments

-- 1. Add department_id column to teams table
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- 2. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_teams_department_id ON public.teams(department_id);

-- 3. Update existing teams with their manager's first department (if any)
-- This ensures existing data isn't broken
UPDATE public.teams t
SET department_id = (
  SELECT md.department_id 
  FROM public.manager_departments md
  WHERE md.manager_id = t.manager_id
  LIMIT 1
)
WHERE t.department_id IS NULL 
AND EXISTS (
  SELECT 1 FROM public.manager_departments md2
  WHERE md2.manager_id = t.manager_id
);

-- 4. Add constraint comment for documentation
COMMENT ON COLUMN public.teams.department_id IS 'Department this team belongs to. Managers can only see teams in their assigned departments.';

-- Done! Teams now belong to departments
-- Next: Update frontend to filter by department

