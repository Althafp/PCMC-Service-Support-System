/*
  # Create service reports table

  1. New Tables
    - `service_reports`
      - `id` (uuid, primary key)
      - `complaint_no` (text, unique)
      - `complaint_type` (text)
      - `project_phase` (text)
      - `system_type` (text)
      - `date` (date)
      - `jb_sl_no` (text)
      - `zone` (text)
      - `location` (text)
      - `ward_no` (text)
      - `ps_limits` (text)
      - `pole_id` (text)
      - `rfp_no` (text)
      - `latitude` (decimal)
      - `longitude` (decimal)
      - Image fields and checklist data
      - Status and approval fields
      - Technician details

  2. Security
    - Enable RLS on `service_reports` table
    - Add policies for role-based access
*/

CREATE TYPE report_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS service_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_no text UNIQUE NOT NULL,
  complaint_type text NOT NULL,
  project_phase text NOT NULL,
  system_type text NOT NULL,
  date date NOT NULL,
  jb_sl_no text,
  zone text NOT NULL,
  location text NOT NULL,
  ward_no text,
  ps_limits text,
  pole_id text,
  rfp_no text,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  before_image_url text,
  after_image_url text,
  raw_power_supply_images text[],
  ups_input_image_url text,
  ups_output_image_url text,
  thermistor_image_url text,
  thermistor_temperature decimal(5, 2),
  checklist_data jsonb,
  nature_of_complaint text,
  field_team_remarks text,
  customer_feedback text,
  rejection_remarks text,
  tl_name text,
  tl_signature text,
  tl_mobile text,
  tech_engineer text,
  tech_signature text,
  tech_mobile text,
  technician_id uuid REFERENCES users(id),
  status report_status DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reports"
  ON service_reports
  FOR SELECT
  TO authenticated
  USING (technician_id = auth.uid());

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

CREATE POLICY "Technicians can create and update own reports"
  ON service_reports
  FOR ALL
  TO authenticated
  USING (technician_id = auth.uid());

CREATE POLICY "Team leaders can approve/reject reports"
  ON service_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'team_leader')
    )
  );