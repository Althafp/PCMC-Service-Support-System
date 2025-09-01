-- Add RLS policies for team leaders and managers to view their team members
-- Run this in your Supabase SQL Editor

-- Policy 1: Team Leaders can view their assigned technicians/technical executives
CREATE POLICY "Team leaders can view their team members"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users tl
    WHERE tl.id = auth.uid() 
    AND tl.role = 'team_leader'
    AND users.team_leader_id = tl.id
  )
);

-- Policy 2: Managers can view their assigned team leaders
CREATE POLICY "Managers can view their team leaders"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users m
    WHERE m.id = auth.uid() 
    AND m.role = 'manager'
    AND users.manager_id = m.id
  )
);

-- Policy 3: Managers can view technicians under their team leaders
CREATE POLICY "Managers can view technicians under their team leaders"
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
  )
);

-- Policy 4: Team leaders can view their own profile
CREATE POLICY "Team leaders can view own profile"
ON users
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

-- Policy 5: Managers can view their own profile
CREATE POLICY "Managers can view own profile"
ON users
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

-- Policy 6: Team leaders can update their own profile
CREATE POLICY "Team leaders can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
);

-- Policy 7: Managers can update their own profile
CREATE POLICY "Managers can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
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
