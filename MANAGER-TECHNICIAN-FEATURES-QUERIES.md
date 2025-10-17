# 📊 Manager & Technician Features - Database Queries Summary

## 🎯 **Major Changes Overview**

### **Architectural Shift:**
- ❌ **OLD:** Manager-based hierarchy (filter by `manager_id`)
- ✅ **NEW:** Department-based hierarchy (filter by `department_id`)

---

## 👤 **MANAGER ROLE - Features & Queries**

### **1. Department Selection (Login Flow)**

**Feature:** Manager must select department after login

**Query:**
```sql
-- Fetch all departments manager has access to
SELECT 
  d.id,
  d.name,
  d.is_active
FROM manager_departments md
JOIN departments d ON md.department_id = d.id
WHERE md.manager_id = 'MANAGER_UUID'
  AND d.is_active = true
ORDER BY d.name;
```

**Tables Used:**
- `manager_departments` (junction table)
- `departments`

**Result:** Manager sees list of departments to choose from

---

### **2. Dashboard Statistics**

**Feature:** Shows team members, reports, and stats for selected department

**Query 1 - Get Team Members:**
```sql
-- Get ALL technicians/team leaders in selected department
SELECT 
  id,
  full_name,
  employee_id,
  role,
  mobile,
  zone,
  team_id,
  team_name,
  is_active
FROM users
WHERE department_id = 'SELECTED_DEPT_UUID'
  AND role IN ('technician', 'team_leader')
  AND is_active = true
ORDER BY full_name;
```

**Query 2 - Get Reports:**
```sql
-- Get reports from department members
SELECT 
  sr.*
FROM service_reports sr
WHERE sr.technician_id IN (
  SELECT id FROM users 
  WHERE department_id = 'SELECTED_DEPT_UUID'
  AND role IN ('technician', 'team_leader')
)
AND sr.status != 'draft'
ORDER BY sr.created_at DESC;
```

**OLD Query (WRONG):**
```sql
-- ❌ OLD: Filtered by manager_id
SELECT * FROM users
WHERE manager_id = 'MANAGER_UUID'
  AND department_id = 'DEPT_UUID';
```

**NEW Query (CORRECT):**
```sql
-- ✅ NEW: Filters ONLY by department_id
SELECT * FROM users
WHERE department_id = 'DEPT_UUID'
  AND role IN ('technician', 'team_leader');
```

**Tables Used:**
- `users`
- `service_reports`

**Key Change:** No `manager_id` filter! Multiple managers can see same data.

---

### **3. Team Management**

**Feature:** Create teams, assign members, manage team leaders

**Query 1 - Fetch Teams:**
```sql
-- Get all teams in selected department
SELECT 
  t.id,
  t.team_name,
  t.team_leader_id,
  t.zone,
  t.is_active,
  t.created_at,
  tl.full_name as team_leader_name,
  tl.employee_id as team_leader_emp_id
FROM teams t
LEFT JOIN users tl ON t.team_leader_id = tl.id
WHERE t.department_id = 'SELECTED_DEPT_UUID'
ORDER BY t.created_at DESC;
```

**Query 2 - Fetch Unassigned Members:**
```sql
-- Get unassigned technicians/team leaders in department
SELECT 
  id,
  full_name,
  employee_id,
  email,
  mobile,
  zone,
  designation,
  role,
  is_active
FROM users
WHERE department_id = 'SELECTED_DEPT_UUID'
  AND role IN ('technician', 'team_leader')
  AND team_id IS NULL
  AND is_active = true
ORDER BY full_name;
```

**Query 3 - Fetch Team Members:**
```sql
-- Get members of a specific team
SELECT 
  id,
  full_name,
  employee_id,
  email,
  mobile,
  zone,
  designation,
  is_active
FROM users
WHERE team_id = 'TEAM_UUID'
  AND is_active = true
ORDER BY full_name;
```

**Query 4 - Fetch Team Leaders (for dropdown):**
```sql
-- Get all team leaders in department (for temporary assignment)
SELECT 
  t.team_leader_id as id,
  tl.full_name,
  tl.employee_id,
  t.team_name as current_team_name,
  t.id as current_team_id
FROM teams t
JOIN users tl ON t.team_leader_id = tl.id
WHERE t.department_id = 'SELECTED_DEPT_UUID'
  AND t.team_leader_id IS NOT NULL;
```

**Tables Used:**
- `teams`
- `users`

**Key Change:** 
- OLD: `WHERE teams.manager_id = 'MANAGER_UUID'`
- NEW: `WHERE teams.department_id = 'DEPT_UUID'`

---

### **4. Reports Overview**

**Feature:** View all reports from department with filters

**Query:**
```sql
-- Get reports from department members
SELECT 
  sr.id,
  sr.title,
  sr.status,
  sr.complaint_no,
  sr.complaint_type,
  sr.location,
  sr.created_at,
  sr.approval_status,
  sr.rejection_remarks,
  u.full_name as technician_name,
  u.employee_id as technician_emp_id
FROM service_reports sr
JOIN users u ON sr.technician_id = u.id
WHERE u.department_id = 'SELECTED_DEPT_UUID'
  AND sr.status != 'draft'
ORDER BY sr.created_at DESC;
```

**With Team Leader Filter:**
```sql
-- Filter reports by specific team leader
SELECT sr.*
FROM service_reports sr
JOIN users u ON sr.technician_id = u.id
WHERE u.department_id = 'SELECTED_DEPT_UUID'
  AND u.team_leader_id = 'TEAM_LEADER_UUID'
  AND sr.status != 'draft';
```

**Tables Used:**
- `service_reports`
- `users`

---

### **5. Analytics**

**Feature:** Department-wide analytics (reports, performance, trends)

**Query:**
```sql
-- Get all department members for analytics
SELECT 
  id,
  full_name,
  role,
  zone,
  is_active
FROM users
WHERE department_id = 'SELECTED_DEPT_UUID'
  AND role IN ('technician', 'team_leader');

-- Then fetch their reports
SELECT 
  sr.id,
  sr.status,
  sr.approval_status,
  sr.created_at,
  sr.complaint_type,
  sr.zone,
  sr.technician_id
FROM service_reports sr
WHERE sr.technician_id IN (
  SELECT id FROM users 
  WHERE department_id = 'SELECTED_DEPT_UUID'
)
AND sr.status != 'draft';
```

**Tables Used:**
- `users`
- `service_reports`

---

### **6. Create Technician**

**Feature:** Manager can create new technicians in their current department

**Query Used:**
```sql
-- No direct query - uses Edge Function
-- But technician is created with:
{
  "department_id": "MANAGER_SELECTED_DEPT_UUID",
  "manager_id": null,  -- ← Key change!
  "role": "technician"
}
```

**Key Change:**
- OLD: `manager_id` set to manager's ID
- NEW: `manager_id` set to `null`

---

## 👷 **TECHNICIAN ROLE - Features & Queries**

### **1. Form Access Check**

**Feature:** Technician can only fill forms enabled for their department

**Query 1 - Get User's Department:**
```sql
SELECT 
  department_id,
  department
FROM users
WHERE id = 'TECHNICIAN_UUID';
```

**Query 2 - Check Form Access:**
```sql
-- Check if service_report is enabled for department
SELECT 
  df.is_enabled,
  f.name,
  f.display_name
FROM department_forms df
JOIN forms f ON df.form_id = f.id
WHERE df.department_id = 'TECHNICIAN_DEPT_UUID'
  AND f.name = 'service_report'
  AND f.is_active = true;
```

**Tables Used:**
- `users`
- `department_forms`
- `forms`

**Result:** 
- If `is_enabled = true` → Show form
- If `is_enabled = false` → Show "Access Restricted" message

---

### **2. My Reports**

**Feature:** View own reports (submitted + drafts)

**Query:**
```sql
-- Get all reports created by this technician
SELECT 
  id,
  complaint_no,
  complaint_type,
  status,
  location,
  created_at,
  approval_status
FROM service_reports
WHERE technician_id = 'TECHNICIAN_UUID'
ORDER BY created_at DESC;
```

**Tables Used:**
- `service_reports`

**No Change:** Same as before

---

### **3. Drafts**

**Feature:** View reports in draft status

**Query:**
```sql
-- Get draft reports only
SELECT 
  id,
  complaint_no,
  complaint_type,
  location,
  created_at,
  updated_at
FROM service_reports
WHERE technician_id = 'TECHNICIAN_UUID'
  AND status = 'draft'
ORDER BY updated_at DESC;
```

**Tables Used:**
- `service_reports`

**Important:** Drafts are ONLY visible to the creating technician (no other roles see drafts)

---

### **4. Create Report**

**Feature:** Submit new service report with automatic project assignment

**Query 1 - Check Form Access:**
```sql
-- Before showing form, check access
SELECT df.is_enabled
FROM department_forms df
JOIN users u ON u.department_id = df.department_id
JOIN forms f ON df.form_id = f.id
WHERE u.id = 'TECHNICIAN_UUID'
  AND f.name = 'service_report'
  AND df.is_enabled = true;
```

**Query 2 - Get User Info for Report:**
```sql
-- Get technician details for auto-fill
SELECT 
  full_name,
  mobile,
  signature,
  team_leader_id,
  project_id,  -- ← Will be copied to report
  department_id
FROM users
WHERE id = 'TECHNICIAN_UUID';
```

**Insert Report (Trigger Auto-Sets project_id):**
```sql
-- When report is inserted, trigger runs:
INSERT INTO service_reports (
  technician_id,
  complaint_no,
  complaint_type,
  -- ... other fields
  status
) VALUES (
  'TECHNICIAN_UUID',
  'DRAFT-{userId}-{timestamp}',
  'Maintenance',
  -- ...
  'draft'
);

-- Trigger automatically sets:
UPDATE service_reports
SET project_id = (
  SELECT project_id FROM users WHERE id = NEW.technician_id
)
WHERE id = NEW.id;
```

**Tables Used:**
- `users`
- `service_reports`
- `department_forms`
- Trigger: `trigger_set_report_project`

---

## 📊 **KEY DATABASE TABLES**

### **1. users**
```
Columns used for filtering:
- id (UUID)
- role (technician, team_leader, manager, admin)
- department_id (UUID) ← PRIMARY FILTER
- project_id (UUID) ← For logo in PDF
- team_id (UUID)
- team_leader_id (UUID)
- manager_id (UUID) ← NOT USED for filtering anymore
- is_active (BOOLEAN)
```

**Key Change:**
- OLD: `manager_id` used for filtering
- NEW: `department_id` used for filtering, `manager_id` optional

---

### **2. teams**
```
Columns:
- id (UUID)
- team_name (TEXT)
- manager_id (UUID) ← For reference only
- department_id (UUID) ← PRIMARY FILTER
- team_leader_id (UUID)
- zone (TEXT)
- is_active (BOOLEAN)
```

**Key Change:**
- OLD: Filtered by `manager_id`
- NEW: Filtered by `department_id`

---

### **3. service_reports**
```
Columns:
- id (UUID)
- technician_id (UUID)
- project_id (UUID) ← NEW! Auto-set via trigger
- complaint_no (TEXT)
- status (draft, submitted, approved, rejected)
- approval_status (pending, approve, reject)
- department_id (if exists)
- created_at
```

**Key Change:**
- NEW: `project_id` column
- Trigger: Auto-copies from technician's project

---

### **4. department_forms**
```
Columns:
- id (UUID)
- department_id (UUID)
- form_id (UUID)
- is_enabled (BOOLEAN)
```

**Purpose:** Control which forms technicians can access per department

---

### **5. manager_departments**
```
Columns:
- id (UUID)
- manager_id (UUID)
- department_id (UUID)
```

**Purpose:** Many-to-many relationship (manager ↔ departments)

---

### **6. projects**
```
Columns:
- id (UUID)
- name (TEXT)
- logo_url (TEXT) ← NEW!
- is_active (BOOLEAN)
```

**Purpose:** Store project info and logos for PDF branding

---

### **7. forms**
```
Columns:
- id (UUID)
- name (TEXT) - 'service_report'
- display_name (TEXT) - 'Service Report'
- form_type (TEXT)
- is_active (BOOLEAN)
```

**Purpose:** Define available form types

---

## 🔄 **FEATURE COMPARISON**

### **MANAGER DASHBOARD**

#### **OLD Features:**
```sql
-- ❌ Showed only technicians with manager_id = their ID
SELECT * FROM users
WHERE manager_id = 'MANAGER_UUID'
  AND department_id = 'DEPT_UUID';
```

#### **NEW Features:**
```sql
-- ✅ Shows ALL technicians in selected department
SELECT * FROM users
WHERE department_id = 'SELECTED_DEPT_UUID'
  AND role IN ('technician', 'team_leader');

-- ✅ Multiple managers can see same technicians
-- ✅ Department-scoped statistics
-- ✅ Department switcher in navbar
```

**Query Pattern:**
```
OLD: .eq('manager_id', user.id).eq('department_id', dept.id)
NEW: .eq('department_id', dept.id).in('role', ['technician', 'team_leader'])
```

---

### **MANAGER TEAM MANAGEMENT**

#### **Features:**
1. ✅ Create teams in selected department
2. ✅ View all teams in department (not just their own)
3. ✅ Assign unassigned members to teams
4. ✅ Create new technicians (auto-assigned to current department)
5. ✅ Edit team (name, zone, team leader)
6. ✅ Remove members from team
7. ✅ Delete teams
8. ✅ View team members in modal

#### **Queries:**

**Fetch Teams:**
```sql
-- Get all teams in department
SELECT 
  t.*,
  tl.full_name as leader_name,
  tl.employee_id as leader_emp_id
FROM teams t
LEFT JOIN users tl ON t.team_leader_id = tl.id
WHERE t.department_id = 'SELECTED_DEPT_UUID'
ORDER BY t.created_at DESC;
```

**Fetch Unassigned Members:**
```sql
-- Technicians + Team Leaders without a team
SELECT 
  id, full_name, employee_id, email, 
  mobile, zone, designation, role
FROM users
WHERE department_id = 'SELECTED_DEPT_UUID'
  AND role IN ('technician', 'team_leader')
  AND team_id IS NULL
  AND is_active = true
ORDER BY full_name;
```

**Assign Member to Team:**
```sql
-- When adding member to team
UPDATE users
SET 
  team_id = 'TEAM_UUID',
  team_name = 'Team Alpha',
  role = CASE 
    WHEN role = 'team_leader' THEN 'technician'  -- Convert team leaders
    ELSE role 
  END
WHERE id = 'MEMBER_UUID';
```

**Remove Member from Team:**
```sql
-- Unassign member from team
UPDATE users
SET 
  team_id = NULL,
  team_name = NULL,
  team_leader_id = NULL
WHERE id = 'MEMBER_UUID';
```

**Update Team:**
```sql
-- Update team details
UPDATE teams
SET 
  team_name = 'New Name',
  zone = 'Zone A',
  team_leader_id = 'LEADER_UUID',
  updated_at = NOW()
WHERE id = 'TEAM_UUID';

-- Update all team members
UPDATE users
SET 
  team_name = 'New Name',
  team_leader_id = 'LEADER_UUID'
WHERE team_id = 'TEAM_UUID';
```

**Tables Used:**
- `teams`
- `users`

**Key Change:**
- OLD: `WHERE teams.manager_id = 'MANAGER_UUID'`
- NEW: `WHERE teams.department_id = 'DEPT_UUID'`

---

### **MANAGER REPORTS OVERVIEW**

#### **Features:**
1. ✅ View all reports from department
2. ✅ Filter by team leader
3. ✅ Filter by status
4. ✅ Search reports
5. ✅ No access to drafts

#### **Queries:**

**Fetch Department Members:**
```sql
SELECT id, team_leader_id
FROM users
WHERE department_id = 'SELECTED_DEPT_UUID'
  AND role IN ('technician', 'team_leader');
```

**Fetch Reports:**
```sql
-- Get reports from department
SELECT 
  sr.id,
  sr.title,
  sr.status,
  sr.complaint_no,
  sr.complaint_type,
  sr.location,
  sr.created_at,
  sr.approval_status,
  sr.rejection_remarks,
  u.full_name as tech_name,
  u.employee_id as tech_emp_id
FROM service_reports sr
JOIN users u ON sr.technician_id = u.id
WHERE u.department_id = 'SELECTED_DEPT_UUID'
  AND sr.status != 'draft'  -- ← Exclude drafts
ORDER BY sr.created_at DESC;
```

**With Team Leader Filter:**
```sql
SELECT sr.*
FROM service_reports sr
JOIN users u ON sr.technician_id = u.id
WHERE u.department_id = 'SELECTED_DEPT_UUID'
  AND u.team_leader_id = 'TEAM_LEADER_UUID'
  AND sr.status != 'draft';
```

**Tables Used:**
- `service_reports`
- `users`

**Important:** `.neq('status', 'draft')` prevents managers from seeing draft reports

---

### **MANAGER ANALYTICS**

#### **Features:**
1. ✅ Department-wide report statistics
2. ✅ Technician performance metrics
3. ✅ Zone-wise breakdown
4. ✅ Approval rate tracking

#### **Query:**
```sql
-- Get department team members
SELECT 
  id,
  full_name,
  role,
  zone,
  is_active
FROM users
WHERE department_id = 'SELECTED_DEPT_UUID'
  AND role IN ('technician', 'team_leader');

-- Get all reports from these members
SELECT 
  id,
  status,
  approval_status,
  created_at,
  complaint_type,
  zone,
  technician_id
FROM service_reports
WHERE technician_id IN (/* member ids */)
  AND status != 'draft';
```

**Tables Used:**
- `users`
- `service_reports`

---

## 👷 **TECHNICIAN FEATURES**

### **1. Form Access Control**

**Feature:** Can only access forms enabled for their department

**Query Flow:**
```sql
-- Step 1: Get technician's department
SELECT department_id, department
FROM users
WHERE id = 'TECHNICIAN_UUID';

-- Step 2: Check if service_report form is enabled
SELECT 
  df.is_enabled,
  f.name,
  f.display_name
FROM department_forms df
JOIN forms f ON df.form_id = f.id
WHERE df.department_id = 'TECH_DEPT_UUID'
  AND f.name = 'service_report';
```

**Result:**
- `is_enabled = true` → Show form
- `is_enabled = false` → Show "Access Restricted"

**Tables Used:**
- `users`
- `department_forms`
- `forms`

---

### **2. Create Report (Auto Project Assignment)**

**Feature:** Reports automatically get technician's project

**Query Before Insert:**
```sql
-- Get technician details
SELECT 
  full_name,
  mobile,
  signature,
  team_leader_id,
  project_id,  -- ← This will be copied to report
  department_id
FROM users
WHERE id = 'TECHNICIAN_UUID';
```

**Insert Report:**
```sql
INSERT INTO service_reports (
  technician_id,
  complaint_no,
  complaint_type,
  -- ... fields
  status
  -- project_id NOT included in INSERT
) VALUES (
  'TECHNICIAN_UUID',
  'DRAFT-...',
  'Maintenance',
  -- ...
  'draft'
);

-- TRIGGER RUNS AUTOMATICALLY:
-- Sets project_id from technician's project
```

**Trigger Logic:**
```sql
-- Trigger: trigger_set_report_project
NEW.project_id := (
  SELECT project_id FROM users WHERE id = NEW.technician_id
);
```

**Tables Used:**
- `users`
- `service_reports`
- Trigger function

---

### **3. My Reports**

**Feature:** View all own reports (drafts + submitted)

**Query:**
```sql
-- Get all reports (including drafts)
SELECT 
  id,
  complaint_no,
  complaint_type,
  status,
  location,
  created_at,
  approval_status,
  rejection_remarks
FROM service_reports
WHERE technician_id = 'TECHNICIAN_UUID'
ORDER BY created_at DESC;
```

**Tables Used:**
- `service_reports`

---

### **4. Drafts Only**

**Feature:** View draft reports separately

**Query:**
```sql
-- Get draft reports only
SELECT 
  id,
  complaint_no,
  complaint_type,
  location,
  created_at,
  updated_at
FROM service_reports
WHERE technician_id = 'TECHNICIAN_UUID'
  AND status = 'draft'
ORDER BY updated_at DESC;
```

**Tables Used:**
- `service_reports`

---

## 📄 **PDF GENERATION - Queries**

### **Feature:** Download report as PDF with project logo

**Query Flow:**

**Step 1 - Fetch Report:**
```sql
SELECT 
  sr.*,
  u.full_name as tech_name,
  u.employee_id as tech_emp_id,
  u.mobile as tech_mobile,
  tl.full_name as leader_name,
  tl.mobile as leader_mobile
FROM service_reports sr
LEFT JOIN users u ON sr.technician_id = u.id
LEFT JOIN users tl ON sr.team_leader_id = tl.id
WHERE sr.id = 'REPORT_UUID';
```

**Step 2 - Fetch Project Logo (if report has project_id):**
```sql
SELECT logo_url
FROM projects
WHERE id = 'REPORT_PROJECT_UUID';
```

**Result:**
- If `logo_url` exists → Download, convert to base64, add to PDF header
- If no `logo_url` → PDF generates without logo

**Tables Used:**
- `service_reports`
- `users`
- `projects`

---

## 🎯 **CRITICAL QUERIES - Before vs After**

### **Manager Queries:**

| Feature | OLD Query | NEW Query |
|---------|-----------|-----------|
| Get Technicians | `WHERE manager_id = X AND department_id = Y` | `WHERE department_id = Y AND role IN (...)` |
| Get Teams | `WHERE manager_id = X` | `WHERE department_id = Y` |
| Get Reports | `WHERE technician_id IN (SELECT id WHERE manager_id = X)` | `WHERE technician_id IN (SELECT id WHERE department_id = Y)` |

### **Technician Queries:**

| Feature | Query Added |
|---------|-------------|
| Form Access Check | `SELECT is_enabled FROM department_forms WHERE department_id = X AND form_id = Y` |
| Auto Project Link | Trigger copies `users.project_id` to `service_reports.project_id` |

---

## 📋 **SUMMARY**

### **Manager Changes:**
- ✅ Department selection required at login
- ✅ All queries filter by `department_id` (not `manager_id`)
- ✅ Can see ALL members in department
- ✅ Multiple managers can manage same department
- ✅ Create users without setting `manager_id`

### **Technician Changes:**
- ✅ Form access controlled by `department_forms` table
- ✅ Reports auto-linked to technician's project
- ✅ PDF displays project logo automatically
- ✅ Drafts hidden from all other roles

### **Key Tables:**
- `users` - Primary user data
- `service_reports` - Report data
- `teams` - Team structure
- `department_forms` - Form access control
- `manager_departments` - Manager access control
- `projects` - Project data + logos

### **Query Pattern:**
```
OLD: Filter by manager_id ❌
NEW: Filter by department_id ✅
```

---

## 🚀 **Result**

**Flexible, scalable, department-based system where:**
- Managers access departments (not own technicians)
- Technicians belong to departments (not specific managers)
- Reports inherit project logos automatically
- Form access controlled per department
- Multiple managers can collaborate on same department

**All features use department_id as primary filter!** 🎯


