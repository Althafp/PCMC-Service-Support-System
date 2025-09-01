-- Check if the required columns exist in the users table
-- Run this in your Supabase SQL Editor

-- Check users table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if team_leader_id and manager_id columns exist
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name = 'team_leader_id'
    ) THEN '✅ team_leader_id exists'
    ELSE '❌ team_leader_id missing'
  END as team_leader_status;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name = 'manager_id'
    ) THEN '✅ manager_id exists'
    ELSE '❌ manager_id missing'
  END as manager_status;

-- Check sample data to see if assignments are working
SELECT 
  id,
  full_name,
  role,
  team_leader_id,
  manager_id,
  created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
