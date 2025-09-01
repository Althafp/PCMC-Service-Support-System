/*
  # Create users table with role-based authentication

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `full_name` (text)
      - `employee_id` (text, unique)
      - `date_of_birth` (date)
      - `mobile` (text)
      - `designation` (text)
      - `role` (enum: admin, manager, team_leader, technical_executive, technician)
      - `department` (text)
      - `username` (text, unique)
      - `zone` (text)
      - `team` (text)
      - `is_active` (boolean, default true)
      - `profile_picture` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policies for role-based access
*/

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'team_leader', 'technical_executive', 'technician');

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  employee_id text UNIQUE NOT NULL,
  date_of_birth date,
  mobile text,
  designation text,
  role user_role NOT NULL DEFAULT 'technician',
  department text,
  username text UNIQUE NOT NULL,
  zone text,
  team text,
  is_active boolean DEFAULT true,
  profile_picture text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Managers can read team users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can manage users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );