-- Fix RLS infinite recursion by using simpler policies
-- Run this in your Supabase SQL Editor

-- First, drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Team leaders can view their team members" ON users;
DROP POLICY IF EXISTS "Managers can view their team leaders" ON users;
DROP POLICY IF EXISTS "Managers can view technicians under their team leaders" ON users;
DROP POLICY IF EXISTS "Team leaders can view own profile" ON users;
DROP POLICY IF EXISTS "Managers can view own profile" ON users;
DROP POLICY IF EXISTS "Team leaders can update own profile" ON users;
DROP POLICY IF EXISTS "Managers can update own profile" ON users;

-- Create a single, simple policy that allows users to view their team hierarchy
-- This policy uses a function to avoid recursion
CREATE OR REPLACE FUNCTION can_view_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
  current_user_id UUID;
BEGIN
  -- Get current user's role and ID
  current_user_id := auth.uid();
  SELECT role INTO current_user_role FROM users WHERE id = current_user_id;
  
  -- Admin can view everyone
  IF current_user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Users can always view themselves
  IF current_user_id = target_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Team leaders can view their assigned technicians
  IF current_user_role = 'team_leader' THEN
    RETURN EXISTS (
      SELECT 1 FROM users 
      WHERE id = target_user_id 
      AND team_leader_id = current_user_id
    );
  END IF;
  
  -- Managers can view their team leaders and technicians under them
  IF current_user_role = 'manager' THEN
    RETURN EXISTS (
      SELECT 1 FROM users 
      WHERE id = target_user_id 
      AND (
        manager_id = current_user_id 
        OR 
        team_leader_id IN (
          SELECT id FROM users 
          WHERE manager_id = current_user_id AND role = 'team_leader'
        )
      )
    );
  END IF;
  
  -- Default: deny access
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the main policy using the function
CREATE POLICY "Users can view their team hierarchy"
ON users
FOR SELECT
TO authenticated
USING (can_view_user(id));

-- Create update policy for own profile
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Create insert policy for admins
CREATE POLICY "Admins can insert users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create delete policy for admins
CREATE POLICY "Admins can delete users"
ON users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
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
