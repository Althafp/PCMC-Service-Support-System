-- Fix missing columns in service_reports table
-- Run this in your Supabase SQL Editor

-- Add missing columns to service_reports table
ALTER TABLE service_reports ADD COLUMN IF NOT EXISTS jb_temperature DECIMAL(5, 2);
ALTER TABLE service_reports ADD COLUMN IF NOT EXISTS approval_notes TEXT;
ALTER TABLE service_reports ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE service_reports ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE service_reports ADD COLUMN IF NOT EXISTS equipment_remarks JSONB;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'service_reports' 
AND table_schema = 'public'
ORDER BY ordinal_position;
