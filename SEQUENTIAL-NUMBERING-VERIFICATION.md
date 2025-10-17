# ✅ Sequential Numbering - Database Setup Verification

## 🗄️ **Your Database Table:**

```sql
CREATE TABLE public.complaint_number_counter (
  id INTEGER NOT NULL DEFAULT 1,
  current_number INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT complaint_number_counter_pkey PRIMARY KEY (id),
  CONSTRAINT single_row_check CHECK ((id = 1))
) TABLESPACE pg_default;
```

**Perfect! ✅ Table is created correctly!**

---

## 🔧 **Required Database Function:**

Make sure you also have this function in your database:

```sql
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
```

---

## 🧪 **Verify Setup - Run These Queries:**

### **Test 1: Check Table Exists**
```sql
SELECT * FROM complaint_number_counter;
```

**Expected Result:**
```
id | current_number | updated_at
---|----------------|------------
1  | 0              | 2025-10-16 ...
```

**If empty or error:**
```sql
-- Insert initial row
INSERT INTO complaint_number_counter (id, current_number)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;
```

---

### **Test 2: Check Function Exists**
```sql
SELECT get_next_complaint_number();
```

**Expected Result:**
```
COMP-00001
```

**Run again:**
```sql
SELECT get_next_complaint_number();
```

**Expected Result:**
```
COMP-00002
```

**Check counter:**
```sql
SELECT * FROM complaint_number_counter;
```

**Should show:**
```
id | current_number | updated_at
---|----------------|------------
1  | 2              | 2025-10-16 ... (just now)
```

✅ **If you see this, sequential numbering is working!**

---

### **Test 3: Check Permissions**
```sql
-- Grant permissions
GRANT SELECT, UPDATE ON complaint_number_counter TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_complaint_number() TO authenticated;
```

---

## 🔄 **Complete Workflow:**

### **The Flow:**

```
┌─────────────────────────────────────────────┐
│ 1. TECHNICIAN SUBMITS REPORT                │
├─────────────────────────────────────────────┤
│ complaint_no: COMP-1760642449787            │
│ status: 'submitted'                         │
│ approval_status: 'pending'                  │
└─────────────────────┬───────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│ 2. TEAM LEADER REVIEWS                      │
├─────────────────────────────────────────────┤
│ Sees: COMP-1760642449787                    │
│ Reviews all details                         │
│ Draws/loads signature                       │
│ Clicks: "Approve Report"                    │
└─────────────────────┬───────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│ 3. SYSTEM CALLS DATABASE FUNCTION           │
├─────────────────────────────────────────────┤
│ Code executes:                              │
│ const { data } = await supabase             │
│   .rpc('get_next_complaint_number');        │
│                                             │
│ Database executes:                          │
│ UPDATE complaint_number_counter             │
│ SET current_number = current_number + 1     │
│ WHERE id = 1                                │
│ RETURNING current_number;                   │
│                                             │
│ Returns: 1 (or next number)                 │
│ Formats: COMP-00001                         │
└─────────────────────┬───────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│ 4. REPORT UPDATED IN DATABASE               │
├─────────────────────────────────────────────┤
│ UPDATE service_reports                      │
│ SET                                         │
│   complaint_no = 'COMP-00001',              │
│   status = 'approved',                      │
│   approval_status = 'approve',              │
│   tl_signature = [...],                     │
│   approved_at = NOW(),                      │
│   approved_by = [team_leader_id]            │
│ WHERE id = [report_id];                     │
└─────────────────────┬───────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│ 5. SUCCESS MESSAGE SHOWN                    │
├─────────────────────────────────────────────┤
│ Alert: "Report approved successfully!       │
│         Sequential Complaint Number:        │
│         COMP-00001"                         │
└─────────────────────────────────────────────┘
```

---

## 📊 **Database Tracking:**

### **Track Counter Updates:**
```sql
-- See current counter value
SELECT 
  id,
  current_number,
  updated_at,
  to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as last_updated
FROM complaint_number_counter;
```

### **See All Approved Reports with Sequential Numbers:**
```sql
SELECT 
  complaint_no,
  status,
  approval_status,
  approved_at,
  ROW_NUMBER() OVER (ORDER BY approved_at) as approval_sequence
FROM service_reports
WHERE approval_status = 'approve'
ORDER BY approved_at;
```

**Expected Result:**
```
complaint_no | status   | approval_status | approved_at         | approval_sequence
-------------|----------|-----------------|---------------------|------------------
COMP-00001   | approved | approve         | 2025-10-16 10:00:00 | 1
COMP-00002   | approved | approve         | 2025-10-16 10:15:00 | 2
COMP-00003   | approved | approve         | 2025-10-16 10:30:00 | 3
```

---

## 🔍 **Verify Code Connection:**

### **In Team Leader Approval Code:**

**File:** `src/pages/team-leader/EnhancedReportApproval.tsx`

**Code that uses your table:**
```javascript
if (action === 'approve') {
  // Calls your database function
  const { data: sequentialNumber, error: seqError } = await supabase
    .rpc('get_next_complaint_number');
  
  if (seqError) {
    alert('Error assigning complaint number. Please check setup.');
    throw seqError;
  }
  
  // Uses the sequential number
  updateData.complaint_no = sequentialNumber; // e.g., "COMP-00001"
  console.log('Assigned sequential complaint number:', sequentialNumber);
}

// Updates report
await supabase
  .from('service_reports')
  .update(updateData)
  .eq('id', reportId);
```

**This code:**
1. ✅ Calls `get_next_complaint_number()`
2. ✅ Gets next sequential number from your counter table
3. ✅ Updates report with COMP-00XXX format
4. ✅ Counter increments automatically

---

## 🧪 **Complete Test:**

### **Step-by-Step Test:**

**1. Check Current Counter:**
```sql
SELECT current_number FROM complaint_number_counter WHERE id = 1;
-- Let's say it shows: 0
```

**2. Submit a Report:**
- As technician: Create and submit report
- Complaint #: COMP-1760642449787

**3. Approve Report:**
- As team leader: Open report
- Click "Approve Report"

**4. Check Alert:**
```
Should show:
"Report approved successfully!
Sequential Complaint Number: COMP-00001"
```

**5. Check Database:**
```sql
-- Check report was updated
SELECT complaint_no, status, approval_status 
FROM service_reports 
WHERE id = [report_id];

Expected:
complaint_no: COMP-00001
status: approved
approval_status: approve

-- Check counter incremented
SELECT current_number FROM complaint_number_counter WHERE id = 1;

Expected:
current_number: 1
```

**6. Approve Another Report:**
```
Next approval should give: COMP-00002
Counter should be: 2
```

---

## 🎯 **Counter Lifecycle:**

```
Initial State:
complaint_number_counter.current_number = 0

First Approval:
  UPDATE ... SET current_number = 0 + 1 = 1
  Returns: 1
  Formats: COMP-00001
  Counter now: 1

Second Approval:
  UPDATE ... SET current_number = 1 + 1 = 2
  Returns: 2
  Formats: COMP-00002
  Counter now: 2

Third Approval:
  UPDATE ... SET current_number = 2 + 1 = 3
  Returns: 3
  Formats: COMP-00003
  Counter now: 3
```

---

## ✅ **Verification Checklist:**

- [x] complaint_number_counter table exists
- [ ] Table has initial row with id=1, current_number=0
- [ ] get_next_complaint_number() function exists
- [ ] Function returns COMP-00001 when tested
- [ ] Permissions granted to authenticated users
- [ ] Team leader approval code calls the function
- [ ] Sequential numbers assigned correctly

---

## 🚀 **Everything Connected!**

Your setup:
- ✅ Database table created
- ✅ Function ready (check if exists)
- ✅ Code calls the function on approval
- ✅ Complete workflow implemented

**Test the approval flow and sequential numbering should work!** 📊✅

**Just make sure the `get_next_complaint_number()` function exists in your database!**

