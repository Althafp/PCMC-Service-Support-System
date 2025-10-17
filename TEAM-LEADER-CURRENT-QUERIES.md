# 👔 Team Leader - Current Database Query Logic

## 🎯 **Strict Query Documentation**

Only the actual database queries currently being used for Team Leader role after login.

---

## 📊 **TEAM LEADER DASHBOARD**

### **Query 1: Get Team Members**
```sql
SELECT id
FROM users
WHERE team_leader_id = 'TEAM_LEADER_UUID'
  AND is_active = true;
```

**Purpose:** Get IDs of all technicians assigned to this team leader

**Returns:** Array of user IDs

**Example Result:**
```
['uuid-1', 'uuid-2', 'uuid-3']
```

---

### **Query 2: Get Pending Reports (Dashboard)**
```sql
SELECT 
  id,
  title,
  status,
  created_at,
  approval_status,
  rejection_remarks,
  users.full_name  -- Via foreign key join
FROM service_reports
WHERE technician_id IN ('uuid-1', 'uuid-2', 'uuid-3')  -- From Query 1
  AND (approval_status IS NULL OR approval_status = 'pending')
  AND status != 'draft'
ORDER BY created_at DESC;
```

**Purpose:** Show pending reports from team members

**Filter Logic:**
1. Technician must be under this team leader (`team_leader_id` match)
2. Report must be pending approval
3. Exclude drafts

---

### **Query 3: Get Approval Stats**
```sql
SELECT approval_status
FROM service_reports
WHERE technician_id IN ('uuid-1', 'uuid-2', 'uuid-3')  -- Team member IDs
```

**Purpose:** Count pending approvals

**Processing:**
```javascript
// Client-side counting
pendingApprovals = reportData.filter(r => 
  r.approval_status === 'pending' || r.approval_status === null
).length;
```

---

## 📋 **TEAM REPORTS PAGE**

### **Query 1: Get Team Members**
```sql
SELECT id
FROM users
WHERE team_leader_id = 'TEAM_LEADER_UUID'
  AND is_active = true;
```

**Same as dashboard Query 1**

---

### **Query 2: Get All Team Reports**
```sql
SELECT 
  id,
  title,
  status,
  complaint_no,
  complaint_type,
  location,
  created_at,
  approval_status,
  rejection_remarks,
  technician.full_name,      -- Foreign key join
  technician.employee_id     -- Foreign key join
FROM service_reports
WHERE technician_id IN (/* team member IDs */)
  AND status != 'draft'
ORDER BY created_at DESC;
```

**Purpose:** Show ALL reports from team members (excluding drafts)

**Filter Logic:**
1. Technician must be in team (`team_leader_id` match)
2. **Exclude drafts** (`.neq('status', 'draft')`)
3. All statuses: submitted, approved, rejected

---

## ✅ **REPORT APPROVAL LIST PAGE**

### **Query 1: Get Team Members**
```sql
SELECT id
FROM users
WHERE team_leader_id = 'TEAM_LEADER_UUID'
  AND is_active = true;
```

**Same as above**

---

### **Query 2: Get Submitted Reports (Pending Approval)**
```sql
SELECT 
  id,
  title,
  status,
  complaint_no,
  complaint_type,
  location,
  created_at,
  approval_status,
  rejection_remarks,
  technician.full_name,
  technician.employee_id
FROM service_reports
WHERE technician_id IN (/* team member IDs */)
  AND status = 'submitted'  -- Only submitted reports
ORDER BY created_at DESC;
```

**Purpose:** Show reports awaiting approval

**Filter Logic:**
1. Technician must be in team
2. **Only submitted status** (`.eq('status', 'submitted')`)
3. These are reports needing action

---

## 👥 **TEAM MEMBERS PAGE**

### **Query: Get Team Members Details**
```sql
SELECT 
  id,
  full_name,
  employee_id,
  email,
  mobile,
  designation,
  zone,
  is_active
FROM users
WHERE team_leader_id = 'TEAM_LEADER_UUID'
ORDER BY full_name;
```

**Purpose:** Show all technicians under this team leader

**Returns:** Full details of each team member

---

## 🔑 **KEY FILTERING LOGIC**

### **Primary Filter:**
```sql
WHERE team_leader_id = 'LOGGED_IN_TEAM_LEADER_UUID'
```

**This is the MAIN filter for team leaders!**

All queries start with:
1. Get users where `team_leader_id = current_user.id`
2. Get their IDs
3. Query reports where `technician_id IN (those_ids)`

---

## 📊 **COMPLETE QUERY FLOW**

### **Step-by-Step:**

```sql
-- STEP 1: Team Leader Logs In
-- System has: user.id = '123-456-789' (team leader UUID)

-- STEP 2: Get Team Members
SELECT id FROM users
WHERE team_leader_id = '123-456-789'
  AND is_active = true;

-- Returns: ['tech-1', 'tech-2', 'tech-3']

-- STEP 3: Get Reports from Team Members
SELECT * FROM service_reports
WHERE technician_id IN ('tech-1', 'tech-2', 'tech-3')
  AND status != 'draft'  -- Important: No drafts!
ORDER BY created_at DESC;

-- STEP 4 (Optional): Filter by Status
-- For Approval List:
  AND status = 'submitted'

-- For Pending Dashboard:
  AND (approval_status IS NULL OR approval_status = 'pending')

-- For All Reports:
  (no additional status filter)
```

---

## 🚫 **WHAT TEAM LEADERS CANNOT SEE**

### **Drafts are Hidden:**
```sql
-- All team leader queries include:
WHERE status != 'draft'
-- OR
WHERE status = 'submitted'

-- Result: Drafts are NEVER visible to team leaders
```

**Drafts ONLY visible to:**
- The technician who created them (`.eq('technician_id', user.id).eq('status', 'draft')`)

---

## 📋 **SUMMARY TABLE**

| Page | Query Purpose | WHERE Clause |
|------|---------------|--------------|
| **Dashboard** | Get pending reports | `team_leader_id = X` → `technician_id IN (...)` + `approval_status = pending` + `status != 'draft'` |
| **Team Reports** | Get all team reports | `team_leader_id = X` → `technician_id IN (...)` + `status != 'draft'` |
| **Approval List** | Get reports to approve | `team_leader_id = X` → `technician_id IN (...)` + `status = 'submitted'` |
| **Team Members** | Get team members | `team_leader_id = X` |

---

## 🎯 **CURRENT FILTERING LOGIC**

### **For Team Leader:**
```
1. Filter: users.team_leader_id = TEAM_LEADER_UUID
2. Get: Array of technician IDs
3. Filter: service_reports.technician_id IN (technician_ids)
4. Additional: status != 'draft'
5. Result: All non-draft reports from team members
```

### **NOT Using:**
- ❌ `department_id` for team leader queries
- ❌ `manager_id` for team leader queries
- ❌ `team_id` for filtering

### **ONLY Using:**
- ✅ `team_leader_id` in users table
- ✅ `technician_id` in service_reports table
- ✅ `status` to exclude drafts

---

## 📝 **EXACT QUERIES BEING USED**

### **1. Get Team Members:**
```sql
SELECT id
FROM users
WHERE team_leader_id = 'TEAM_LEADER_UUID'
  AND is_active = true;
```

### **2. Get Team Reports:**
```sql
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
LEFT JOIN users u ON sr.technician_id = u.id
WHERE sr.technician_id IN (
  SELECT id FROM users WHERE team_leader_id = 'TEAM_LEADER_UUID' AND is_active = true
)
AND sr.status != 'draft'
ORDER BY sr.created_at DESC;
```

### **3. Get Submitted Reports (Approval Queue):**
```sql
SELECT 
  sr.id,
  sr.title,
  sr.status,
  sr.complaint_no,
  sr.complaint_type,
  sr.location,
  sr.created_at,
  sr.approval_status,
  u.full_name,
  u.employee_id
FROM service_reports sr
LEFT JOIN users u ON sr.technician_id = u.id
WHERE sr.technician_id IN (
  SELECT id FROM users WHERE team_leader_id = 'TEAM_LEADER_UUID'
)
AND sr.status = 'submitted'
ORDER BY sr.created_at DESC;
```

### **4. Get Pending Stats:**
```sql
SELECT approval_status
FROM service_reports
WHERE technician_id IN (
  SELECT id FROM users WHERE team_leader_id = 'TEAM_LEADER_UUID'
);

-- Then count where approval_status = 'pending' OR NULL
```

---

## 🎯 **SIMPLE EXPLANATION**

**Team Leader sees reports from:**
```
Team Leader UUID = ABC-123
    ↓
Find: All users where team_leader_id = ABC-123
    ↓
Get their IDs: [tech-1, tech-2, tech-3]
    ↓
Find: All service_reports where technician_id IN (tech-1, tech-2, tech-3)
    ↓
Filter: status != 'draft'
    ↓
Result: All team reports (no drafts)
```

---

## ✅ **TABLES INVOLVED**

1. **users** - To find team members
   - Filter: `team_leader_id = X`
   
2. **service_reports** - To get reports
   - Filter: `technician_id IN (...)`
   - Exclude: `status = 'draft'`

**That's it! Simple, clean, team-based filtering.** 🎯


