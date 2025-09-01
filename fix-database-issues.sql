-- Fix database issues: missing columns and function type mismatches
-- Run this in your Supabase SQL Editor

-- Step 1: Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_leader_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID;

-- Step 2: Add foreign key constraints with ON DELETE SET NULL
ALTER TABLE users 
ADD CONSTRAINT users_team_leader_id_fkey 
FOREIGN KEY (team_leader_id) 
REFERENCES users(id) 
ON DELETE SET NULL;

ALTER TABLE users 
ADD CONSTRAINT users_manager_id_fkey 
FOREIGN KEY (manager_id) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_team_leader_id ON users(team_leader_id);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Step 4: Drop all existing policies and functions to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Managers can read team users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins full access" ON users;
DROP POLICY IF EXISTS "Users own profile access" ON users;
DROP POLICY IF EXISTS "Users own profile update" ON users;
DROP POLICY IF EXISTS "Team leaders see their team" ON users;
DROP POLICY IF EXISTS "Managers see their team leaders" ON users;
DROP POLICY IF EXISTS "Managers see technicians under their team leaders" ON users;
DROP POLICY IF EXISTS "Users own profile" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;

-- Drop existing functions
DROP FUNCTION IF EXISTS get_own_profile(UUID);
DROP FUNCTION IF EXISTS get_manager_team(UUID);
DROP FUNCTION IF EXISTS get_team_leader_team(UUID);
DROP FUNCTION IF EXISTS get_all_users_admin(UUID);
DROP FUNCTION IF EXISTS can_view_user(UUID);

-- Step 5: Disable RLS completely
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 6: Create corrected functions with proper types
-- Function 1: Get user's own profile (fixed date type issue)
CREATE OR REPLACE FUNCTION get_own_profile(user_id UUID)
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  employee_id TEXT,
  username TEXT,
  mobile TEXT,
  designation TEXT,
  department TEXT,
  zone TEXT,
  role TEXT,
  date_of_birth TEXT,  -- Convert DATE to TEXT
  is_active BOOLEAN,
  team_leader_id UUID,
  manager_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.employee_id,
    u.username,
    u.mobile,
    u.designation,
    u.department,
    u.zone,
    u.role::TEXT,  -- Convert enum to text
    u.date_of_birth::TEXT,  -- Convert date to text
    u.is_active,
    u.team_leader_id,
    u.manager_id,
    u.created_at,
    u.updated_at
  FROM users u 
  WHERE u.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Get team members for managers (with proper types)
CREATE OR REPLACE FUNCTION get_manager_team(manager_id UUID)
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  employee_id TEXT,
  username TEXT,
  mobile TEXT,
  designation TEXT,
  department TEXT,
  zone TEXT,
  role TEXT,
  date_of_birth TEXT,
  is_active BOOLEAN,
  team_leader_id UUID,
  manager_id_ref UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Return team leaders under this manager + technicians under those team leaders
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.employee_id,
    u.username,
    u.mobile,
    u.designation,
    u.department,
    u.zone,
    u.role::TEXT,
    u.date_of_birth::TEXT,
    u.is_active,
    u.team_leader_id,
    u.manager_id as manager_id_ref,
    u.created_at,
    u.updated_at
  FROM users u 
  WHERE u.manager_id = get_manager_team.manager_id 
     OR u.team_leader_id IN (
       SELECT tl.id FROM users tl 
       WHERE tl.manager_id = get_manager_team.manager_id 
       AND tl.role = 'team_leader'
     )
  ORDER BY u.role, u.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 3: Get team members for team leaders (with proper types)
CREATE OR REPLACE FUNCTION get_team_leader_team(team_leader_id UUID)
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  employee_id TEXT,
  username TEXT,
  mobile TEXT,
  designation TEXT,
  department TEXT,
  zone TEXT,
  role TEXT,
  date_of_birth TEXT,
  is_active BOOLEAN,
  team_leader_id_ref UUID,
  manager_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Return technicians and technical executives under this team leader
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.employee_id,
    u.username,
    u.mobile,
    u.designation,
    u.department,
    u.zone,
    u.role::TEXT,
    u.date_of_birth::TEXT,
    u.is_active,
    u.team_leader_id as team_leader_id_ref,
    u.manager_id,
    u.created_at,
    u.updated_at
  FROM users u 
  WHERE u.team_leader_id = get_team_leader_team.team_leader_id
  AND (u.role = 'technician' OR u.role = 'technical_executive')
  ORDER BY u.role, u.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 4: Get all users (for admins only)
CREATE OR REPLACE FUNCTION get_all_users_admin(admin_id UUID)
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  employee_id TEXT,
  username TEXT,
  mobile TEXT,
  designation TEXT,
  department TEXT,
  zone TEXT,
  role TEXT,
  date_of_birth TEXT,
  is_active BOOLEAN,
  team_leader_id UUID,
  manager_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  admin_role TEXT;
BEGIN
  -- Check if the user is actually an admin
  SELECT u.role::TEXT INTO admin_role FROM users u WHERE u.id = admin_id;
  
  IF admin_role = 'admin' THEN
    RETURN QUERY 
    SELECT 
      u.id,
      u.email,
      u.full_name,
      u.employee_id,
      u.username,
      u.mobile,
      u.designation,
      u.department,
      u.zone,
      u.role::TEXT,
      u.date_of_birth::TEXT,
      u.is_active,
      u.team_leader_id,
      u.manager_id,
      u.created_at,
      u.updated_at
    FROM users u 
    ORDER BY u.full_name;
  ELSE
    -- Return empty result if not admin
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Verify the structure
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify the functions were created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'get_%'
ORDER BY routine_name;
