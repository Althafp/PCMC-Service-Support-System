-- Setup Sequential Complaint Numbering System
-- Run this in your Supabase SQL Editor

-- Step 1: Create counter table for sequential numbering
CREATE TABLE IF NOT EXISTS complaint_number_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  current_number INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row_check CHECK (id = 1)
);

-- Insert initial row (if not exists)
INSERT INTO complaint_number_counter (id, current_number)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create function to get next complaint number
CREATE OR REPLACE FUNCTION get_next_complaint_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INTEGER;
  formatted_num TEXT;
BEGIN
  -- Increment and get the next number atomically
  UPDATE complaint_number_counter
  SET current_number = current_number + 1,
      updated_at = NOW()
  WHERE id = 1
  RETURNING current_number INTO next_num;
  
  -- Format as COMP-00XXX (5 digits with leading zeros)
  formatted_num := 'COMP-' || LPAD(next_num::TEXT, 5, '0');
  
  RETURN formatted_num;
END;
$$;

-- Step 3: Test the function
SELECT get_next_complaint_number(); -- Should return COMP-00001
SELECT get_next_complaint_number(); -- Should return COMP-00002
SELECT get_next_complaint_number(); -- Should return COMP-00003

-- Step 4: Check current counter value
SELECT * FROM complaint_number_counter;

-- Step 5: Optional - Reset counter (ONLY IF NEEDED)
-- UNCOMMENT AND RUN IF YOU WANT TO RESET THE COUNTER
-- UPDATE complaint_number_counter SET current_number = 0 WHERE id = 1;

-- Step 6: Grant permissions
GRANT SELECT, UPDATE ON complaint_number_counter TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_complaint_number() TO authenticated;

-- Step 7: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_service_reports_complaint_no ON service_reports(complaint_no);
CREATE INDEX IF NOT EXISTS idx_service_reports_status ON service_reports(status);
CREATE INDEX IF NOT EXISTS idx_service_reports_approval_status ON service_reports(approval_status);

-- SUCCESS! Sequential numbering is now set up.
-- The function get_next_complaint_number() will be called from the app when approving reports.

