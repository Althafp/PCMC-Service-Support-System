-- Check the actual enum values for report_status
-- Run this in your Supabase SQL Editor

-- Check report_status enum values
SELECT 
    t.typname,
    string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'report_status'
GROUP BY t.typname;

-- Check if approval_status column exists and its type
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'service_reports' 
AND column_name LIKE '%approval%'
ORDER BY column_name;

-- Check sample data to understand current status values
SELECT DISTINCT 
    status,
    approval_status,
    COUNT(*) as count
FROM service_reports 
GROUP BY status, approval_status
ORDER BY status, approval_status;
