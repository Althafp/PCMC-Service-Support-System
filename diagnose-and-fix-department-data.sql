-- ========================================
-- DIAGNOSE AND FIX DEPARTMENT DATA
-- ========================================

-- Run this to check and fix department data issues

-- STEP 1: DIAGNOSE - Check current state
-- ========================================

-- 1.1: Check managers and their assigned departments
SELECT 
  u.full_name as manager_name,
  u.id as manager_id,
  d.name as department_name,
  md.department_id
FROM users u
LEFT JOIN manager_departments md ON u.id = md.manager_id
LEFT JOIN departments d ON md.department_id = d.id
WHERE u.role = 'manager'
ORDER BY u.full_name, d.name;

-- 1.2: Check technicians and team leaders and their department assignments
SELECT 
  u.full_name,
  u.employee_id,
  u.manager_id,
  u.department_id,
  u.department as department_text,
  u.team_id,
  u.role
FROM users u
WHERE u.role IN ('technician', 'team_leader')
ORDER BY u.role, u.full_name;

-- 1.3: Check teams and their department assignments
SELECT 
  t.team_name,
  t.manager_id,
  t.department_id,
  d.name as department_name,
  (SELECT full_name FROM users WHERE id = t.manager_id) as manager_name
FROM teams t
LEFT JOIN departments d ON t.department_id = d.id
ORDER BY manager_name, team_name;

-- STEP 2: FIX - Update NULL department_ids
-- ========================================

-- 2.1: Update technicians and team leaders to their manager's first department
UPDATE users u
SET department_id = (
  SELECT md.department_id 
  FROM manager_departments md
  WHERE md.manager_id = u.manager_id
  LIMIT 1
)
WHERE u.role IN ('technician', 'team_leader')
  AND u.department_id IS NULL
  AND u.manager_id IS NOT NULL;

-- 2.2: Update department text column from department_id
UPDATE users u
SET department = (
  SELECT d.name 
  FROM departments d
  WHERE d.id = u.department_id
)
WHERE u.department_id IS NOT NULL
  AND (u.department IS NULL OR u.department = '');

-- 2.3: Update teams to their manager's first department
UPDATE teams t
SET department_id = (
  SELECT md.department_id 
  FROM manager_departments md
  WHERE md.manager_id = t.manager_id
  LIMIT 1
)
WHERE t.department_id IS NULL
  AND EXISTS (
    SELECT 1 FROM manager_departments md2
    WHERE md2.manager_id = t.manager_id
  );

-- STEP 3: VERIFY - Check after fixes
-- ========================================

-- 3.1: Count technicians and team leaders by department
SELECT 
  d.name as department_name,
  COUNT(CASE WHEN u.role = 'technician' THEN 1 END) as technician_count,
  COUNT(CASE WHEN u.role = 'team_leader' THEN 1 END) as team_leader_count,
  COUNT(u.id) as total_count
FROM departments d
LEFT JOIN users u ON u.department_id = d.id AND u.role IN ('technician', 'team_leader')
GROUP BY d.id, d.name
ORDER BY d.name;

-- 3.2: Count teams by department
SELECT 
  d.name as department_name,
  COUNT(t.id) as team_count
FROM departments d
LEFT JOIN teams t ON t.department_id = d.id
GROUP BY d.id, d.name
ORDER BY d.name;

-- 3.3: Check for orphaned data (no department assigned)
SELECT 
  'Technicians without department' as issue,
  COUNT(*) as count
FROM users
WHERE role = 'technician' AND department_id IS NULL
UNION ALL
SELECT 
  'Team Leaders without department' as issue,
  COUNT(*) as count
FROM users
WHERE role = 'team_leader' AND department_id IS NULL
UNION ALL
SELECT 
  'Teams without department' as issue,
  COUNT(*) as count
FROM teams
WHERE department_id IS NULL;

-- Done! Check results and your app should work now.

