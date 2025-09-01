-- JWT Claims-based RLS policies to avoid infinite recursion
-- Run this in your Supabase SQL Editor

-- First, drop ALL existing policies to start completely fresh
DROP POLICY IF EXISTS "Admins full access" ON users;
DROP POLICY IF EXISTS "Users own profile access" ON users;
DROP POLICY IF EXISTS "Users own profile update" ON users;
DROP POLICY IF EXISTS "Team leaders see their team" ON users;
DROP POLICY IF EXISTS "Managers see their team leaders" ON users;
DROP POLICY IF EXISTS "Managers see technicians under their team leaders" ON users;
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

-- TEMPORARILY DISABLE RLS to allow immediate access
-- We'll create a simple policy that allows authenticated users to access their own profile
-- and then handle team visibility in the application layer

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Enable RLS again
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create the simplest possible policies that won't cause recursion

-- Policy 1: Users can always access their own profile (no subqueries)
CREATE POLICY "Users own profile"
ON users
FOR ALL
TO authenticated
USING (id = auth.uid());

-- Policy 2: Service role (for admin functions) can access everything
CREATE POLICY "Service role full access"
ON users
FOR ALL
TO service_role
USING (true);

-- That's it! No other policies to avoid recursion
-- Team visibility will be handled in the application layer

-- Verify the policies
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
