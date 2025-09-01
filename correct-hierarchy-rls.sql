-- Correct RLS policies for the 5-role hierarchy
-- Run this in your Supabase SQL Editor

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view their team hierarchy" ON users;
DROP POLICY IF EXISTS "Team leaders can view their team members" ON users;
DROP POLICY IF EXISTS "Managers can view their team leaders" ON users;
DROP POLICY IF EXISTS "Managers can view technicians under their team leaders" ON users;
DROP POLICY IF EXISTS "Team leaders can view own profile" ON users;
DROP POLICY IF EXISTS "Managers can view own profile" ON users;
DROP POLICY IF EXISTS "Team leaders can update own profile" ON users;
DROP POLICY IF EXISTS "Managers can update own profile" ON users;

-- Drop any functions that might exist
DROP FUNCTION IF EXISTS can_view_user(UUID);

-- Policy 1: Admins can do everything (read, insert, update, delete all users)
CREATE POLICY "Admins full access"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Policy 2: Users can always read and update their own profile
CREATE POLICY "Users own profile access"
ON users
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users own profile update"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Policy 3: Team Leaders can see technicians and technical executives under them
CREATE POLICY "Team leaders see their team"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users tl
    WHERE tl.id = auth.uid() 
    AND tl.role = 'team_leader'
    AND users.team_leader_id = tl.id
    AND (users.role = 'technician' OR users.role = 'technical_executive')
  )
);

-- Policy 4: Managers can see team leaders under them
CREATE POLICY "Managers see their team leaders"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users m
    WHERE m.id = auth.uid() 
    AND m.role = 'manager'
    AND users.manager_id = m.id
    AND users.role = 'team_leader'
  )
);

-- Policy 5: Managers can see technicians and technical executives under their team leaders
CREATE POLICY "Managers see technicians under their team leaders"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users m
    JOIN users tl ON tl.manager_id = m.id
    WHERE m.id = auth.uid() 
    AND m.role = 'manager'
    AND tl.role = 'team_leader'
    AND users.team_leader_id = tl.id
    AND (users.role = 'technician' OR users.role = 'technical_executive')
  )
);

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;
