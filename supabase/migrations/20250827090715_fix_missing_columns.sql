/*
  # Fix missing columns and add team hierarchy tracking

  1. Add missing columns to users table
    - `team_leader_id` (uuid, references users.id)
    - `manager_id` (uuid, references users.id)

  2. Add missing columns to service_reports table
    - `title` (text) - for report title/description
    - `approval_status` (text) - for approval tracking
    - `team_leader_id` (uuid, references users.id) - for team leader assignment

  3. Update existing tables with proper constraints
*/

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS team_leader_id uuid REFERENCES users(id),
ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES users(id);

-- Add missing columns to service_reports table
ALTER TABLE service_reports 
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS team_leader_id uuid REFERENCES users(id);

-- Update existing records to have default values
UPDATE service_reports 
SET title = COALESCE(title, 'Service Report - ' || complaint_no),
    approval_status = COALESCE(approval_status, 'pending')
WHERE title IS NULL OR approval_status IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_team_leader_id ON users(team_leader_id);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_service_reports_team_leader_id ON service_reports(team_leader_id);
CREATE INDEX IF NOT EXISTS idx_service_reports_technician_id ON service_reports(technician_id);

-- Update RLS policies to use new columns
DROP POLICY IF EXISTS "Team leaders and above can read all reports" ON service_reports;
CREATE POLICY "Team leaders and above can read all reports"
  ON service_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'team_leader')
    )
  );

-- Add policy for team leaders to read reports from their team
CREATE POLICY "Team leaders can read team reports"
  ON service_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'team_leader' AND id = service_reports.team_leader_id
    )
  );

-- Add policy for managers to read reports from their team hierarchy
CREATE POLICY "Managers can read team hierarchy reports"
  ON service_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u1
      JOIN users u2 ON u2.manager_id = u1.id
      WHERE u1.id = auth.uid() AND u1.role = 'manager' 
      AND (service_reports.technician_id = u2.id OR service_reports.team_leader_id = u2.id)
    )
  );
