-- ================================================================
-- Department Forms Assignment System
-- ================================================================
-- This allows admins to control which forms are available to which departments
-- For now: Only "service_report" form exists
-- Future: Can add more forms (inspection_form, maintenance_form, etc.)

-- Step 1: Create forms table (for future extensibility)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.forms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_name text NOT NULL,
  description text NULL,
  form_type text NOT NULL DEFAULT 'service_report',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT forms_pkey PRIMARY KEY (id),
  CONSTRAINT forms_name_unique UNIQUE (name)
) TABLESPACE pg_default;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_forms_is_active 
  ON public.forms USING btree (is_active) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow admins full access to forms"
  ON public.forms
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Allow all users to view active forms"
  ON public.forms
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Step 2: Create department_forms junction table
-- ================================================================
CREATE TABLE IF NOT EXISTS public.department_forms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL,
  form_id uuid NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT department_forms_pkey PRIMARY KEY (id),
  CONSTRAINT department_forms_unique UNIQUE (department_id, form_id),
  CONSTRAINT department_forms_department_id_fkey 
    FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE CASCADE,
  CONSTRAINT department_forms_form_id_fkey 
    FOREIGN KEY (form_id) REFERENCES forms (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_department_forms_department_id 
  ON public.department_forms USING btree (department_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_department_forms_form_id 
  ON public.department_forms USING btree (form_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_department_forms_enabled 
  ON public.department_forms USING btree (is_enabled) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.department_forms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow admins full access to department_forms"
  ON public.department_forms
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Allow managers to view department_forms for their departments"
  ON public.department_forms
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM manager_departments md
      WHERE md.manager_id = auth.uid()
      AND md.department_id = department_forms.department_id
    )
  );

CREATE POLICY "Allow technicians to view their department forms"
  ON public.department_forms
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.department_id = department_forms.department_id
    )
  );

-- Step 3: Insert default "Service Report" form
-- ================================================================
INSERT INTO public.forms (name, display_name, description, form_type, is_active)
VALUES (
  'service_report',
  'Service Report',
  'Standard service report form for field technicians',
  'service_report',
  true
)
ON CONFLICT (name) DO NOTHING;

-- Step 4: Auto-assign service_report to all existing departments
-- ================================================================
INSERT INTO public.department_forms (department_id, form_id, is_enabled)
SELECT 
  d.id as department_id,
  f.id as form_id,
  true as is_enabled
FROM departments d
CROSS JOIN forms f
WHERE f.name = 'service_report'
ON CONFLICT (department_id, form_id) DO NOTHING;

-- Step 5: Create function to auto-assign forms to new departments
-- ================================================================
CREATE OR REPLACE FUNCTION assign_default_forms_to_new_department()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-assign all active forms to the new department
  INSERT INTO department_forms (department_id, form_id, is_enabled)
  SELECT 
    NEW.id,
    f.id,
    true
  FROM forms f
  WHERE f.is_active = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_assign_forms_to_new_department ON departments;
CREATE TRIGGER trigger_assign_forms_to_new_department
  AFTER INSERT ON departments
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_forms_to_new_department();

-- Step 6: Grant permissions
-- ================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.department_forms TO authenticated;

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Check forms
SELECT * FROM forms ORDER BY name;

-- Check department-form assignments
SELECT 
  d.name as department_name,
  f.display_name as form_name,
  df.is_enabled
FROM department_forms df
JOIN departments d ON df.department_id = d.id
JOIN forms f ON df.form_id = f.id
ORDER BY d.name, f.display_name;

-- Check which forms a specific department has access to
-- Replace 'DEPARTMENT_ID' with actual ID
/*
SELECT 
  f.name,
  f.display_name,
  df.is_enabled
FROM department_forms df
JOIN forms f ON df.form_id = f.id
WHERE df.department_id = 'DEPARTMENT_ID'
  AND df.is_enabled = true;
*/

-- ================================================================
-- USAGE NOTES
-- ================================================================
/*
1. All existing departments now have "Service Report" form enabled by default

2. New departments will automatically get all active forms assigned

3. Admins can enable/disable forms for specific departments in General Settings

4. Technicians will only see forms that are:
   - Active in forms table (is_active = true)
   - Enabled for their department (department_forms.is_enabled = true)

5. Future forms: Just INSERT into forms table, and they'll auto-assign to all departments
   Example:
   INSERT INTO forms (name, display_name, description, form_type)
   VALUES ('inspection_form', 'Equipment Inspection', 'Detailed equipment inspection checklist', 'inspection');
*/


