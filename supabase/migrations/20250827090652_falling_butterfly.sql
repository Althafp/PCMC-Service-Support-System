/*
  # Create location details table

  1. New Tables
    - `location_details`
      - `id` (uuid, primary key)
      - `project_phase` (text)
      - `location_type` (text)
      - `rfp_no` (text)
      - `zone` (text)
      - `location` (text)
      - `ward_no` (text)
      - `ps_limits` (text)
      - `no_of_pole` (integer)
      - `pole_id` (text)
      - `jb_sl_no` (text)
      - `no_of_cameras` (integer)
      - `fix_box` (integer)
      - `ptz` (integer)
      - `latitude` (decimal)
      - `longitude` (decimal)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `location_details` table
    - Add policies for role-based access
*/

CREATE TABLE IF NOT EXISTS location_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_phase text NOT NULL,
  location_type text,
  rfp_no text NOT NULL,
  zone text NOT NULL,
  location text NOT NULL,
  ward_no text,
  ps_limits text,
  no_of_pole integer DEFAULT 0,
  pole_id text,
  jb_sl_no text,
  no_of_cameras integer DEFAULT 0,
  fix_box integer DEFAULT 0,
  ptz integer DEFAULT 0,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE location_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read locations"
  ON location_details
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers and above can manage locations"
  ON location_details
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );