-- Test RLS policies for each role
-- Run this in your Supabase SQL Editor after applying the policies

-- Test 1: Check what an admin can see
-- (Should see all users)
SELECT 
  'Admin View Test' as test_type,
  COUNT(*) as total_users_visible,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins_visible,
  COUNT(CASE WHEN role = 'manager' THEN 1 END) as managers_visible,
  COUNT(CASE WHEN role = 'team_leader' THEN 1 END) as team_leaders_visible,
  COUNT(CASE WHEN role IN ('technician', 'technical_executive') THEN 1 END) as technicians_visible
FROM users;

-- Test 2: Check what a manager can see (replace with actual manager ID)
-- (Should see team leaders under them + technicians under those team leaders)
-- Replace 'MANAGER_UUID_HERE' with an actual manager's UUID from your database
/*
SELECT 
  'Manager View Test' as test_type,
  u.full_name,
  u.role,
  u.employee_id
FROM users u
WHERE EXISTS (
  SELECT 1 FROM users m
  WHERE m.id = 'MANAGER_UUID_HERE'  -- Replace with actual manager UUID
  AND m.role = 'manager'
  AND (
    u.manager_id = m.id 
    OR 
    u.team_leader_id IN (
      SELECT id FROM users 
      WHERE manager_id = m.id AND role = 'team_leader'
    )
  )
)
ORDER BY u.role, u.full_name;
*/

-- Test 3: Check what a team leader can see (replace with actual team leader ID)
-- (Should see technicians under them)
-- Replace 'TEAM_LEADER_UUID_HERE' with an actual team leader's UUID from your database
/*
SELECT 
  'Team Leader View Test' as test_type,
  u.full_name,
  u.role,
  u.employee_id
FROM users u
WHERE EXISTS (
  SELECT 1 FROM users tl
  WHERE tl.id = 'TEAM_LEADER_UUID_HERE'  -- Replace with actual team leader UUID
  AND tl.role = 'team_leader'
  AND u.team_leader_id = tl.id
  AND (u.role = 'technician' OR u.role = 'technical_executive')
)
ORDER BY u.role, u.full_name;
*/

-- Test 4: Check current user assignments
SELECT 
  'Current Team Structure' as info,
  m.full_name as manager_name,
  m.employee_id as manager_id,
  tl.full_name as team_leader_name,
  tl.employee_id as team_leader_id,
  t.full_name as technician_name,
  t.employee_id as technician_id,
  t.role as technician_role
FROM users m
LEFT JOIN users tl ON tl.manager_id = m.id AND tl.role = 'team_leader'
LEFT JOIN users t ON t.team_leader_id = tl.id AND (t.role = 'technician' OR t.role = 'technical_executive')
WHERE m.role = 'manager'
ORDER BY m.full_name, tl.full_name, t.full_name;

-- Test 5: Check if there are any users without proper assignments
SELECT 
  'Users without proper assignments' as issue,
  full_name,
  employee_id,
  role,
  team_leader_id,
  manager_id
FROM users 
WHERE (
  (role = 'technician' OR role = 'technical_executive') AND team_leader_id IS NULL
) OR (
  role = 'team_leader' AND manager_id IS NULL
) OR (
  role = 'manager' AND id NOT IN (
    SELECT DISTINCT manager_id FROM users WHERE manager_id IS NOT NULL
  )
)
ORDER BY role, full_name;
