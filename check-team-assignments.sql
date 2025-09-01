-- Check current team assignments in the database
-- Run this in your Supabase SQL Editor

-- Check all users and their team relationships
SELECT 
  id,
  full_name,
  email,
  role,
  team_leader_id,
  manager_id,
  is_active,
  created_at
FROM users 
ORDER BY created_at DESC;

-- Check specific team relationships
SELECT 
  'Team Leaders under Managers' as relationship_type,
  m.full_name as manager_name,
  m.employee_id as manager_id,
  tl.full_name as team_leader_name,
  tl.employee_id as team_leader_id
FROM users m
JOIN users tl ON tl.manager_id = m.id
WHERE m.role = 'manager' AND tl.role = 'team_leader'
ORDER BY m.full_name, tl.full_name;

-- Check technicians under team leaders
SELECT 
  'Technicians under Team Leaders' as relationship_type,
  tl.full_name as team_leader_name,
  tl.employee_id as team_leader_id,
  t.full_name as technician_name,
  t.employee_id as technician_id,
  t.role
FROM users tl
JOIN users t ON t.team_leader_id = tl.id
WHERE tl.role = 'team_leader' AND (t.role = 'technician' OR t.role = 'technical_executive')
ORDER BY tl.full_name, t.full_name;

-- Count team members for each manager
SELECT 
  m.full_name as manager_name,
  m.employee_id as manager_id,
  COUNT(tl.id) as team_leaders_count,
  COUNT(t.id) as technicians_count
FROM users m
LEFT JOIN users tl ON tl.manager_id = m.id AND tl.role = 'team_leader'
LEFT JOIN users t ON t.team_leader_id = tl.id AND (t.role = 'technician' OR t.role = 'technical_executive')
WHERE m.role = 'manager'
GROUP BY m.id, m.full_name, m.employee_id
ORDER BY m.full_name;

-- Count team members for each team leader
SELECT 
  tl.full_name as team_leader_name,
  tl.employee_id as team_leader_id,
  COUNT(t.id) as technicians_count
FROM users tl
LEFT JOIN users t ON t.team_leader_id = tl.id AND (t.role = 'technician' OR t.role = 'technical_executive')
WHERE tl.role = 'team_leader'
GROUP BY tl.id, tl.full_name, tl.employee_id
ORDER BY tl.full_name;
