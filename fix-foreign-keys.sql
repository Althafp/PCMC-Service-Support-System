-- Fix foreign key constraints for team_leader_id and manager_id
-- Run this in your Supabase SQL Editor

-- First, drop any existing foreign key constraints if they exist
DO $$ 
BEGIN
    -- Drop team_leader_id foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_team_leader_id_fkey'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_team_leader_id_fkey;
    END IF;
    
    -- Drop manager_id foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_manager_id_fkey'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_manager_id_fkey;
    END IF;
END $$;

-- Now add proper foreign key constraints with ON DELETE SET NULL
-- This allows team leaders/managers to be deleted without breaking user records

-- Add foreign key for team_leader_id
ALTER TABLE users 
ADD CONSTRAINT users_team_leader_id_fkey 
FOREIGN KEY (team_leader_id) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- Add foreign key for manager_id
ALTER TABLE users 
ADD CONSTRAINT users_manager_id_fkey 
FOREIGN KEY (manager_id) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- Verify the constraints were added
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'users'
    AND kcu.column_name IN ('team_leader_id', 'manager_id');

-- Test inserting a user with null team_leader_id (should work for team leaders)
-- This is just a test - don't run this if you don't want to create a test user
-- INSERT INTO users (id, email, full_name, employee_id, role, is_active, team_leader_id, manager_id)
-- VALUES (
--     gen_random_uuid(),
--     'test@example.com',
--     'Test User',
--     'TEST-001',
--     'team_leader',
--     true,
--     NULL,  -- team_leader_id should be NULL for team leaders
--     '61f661c3-47e8-4fad-828d-56a5539bccfb'  -- manager_id
-- );
