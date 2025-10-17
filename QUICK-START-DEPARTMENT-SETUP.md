# 🚀 Quick Start - Department Setup Guide

## ⚠️ **IMPORTANT: Run Database Migration First!**

Before using the new department-based system, you **MUST** run this SQL:

### **Step 1: Copy and Run SQL**

**File:** `migrate-to-department-hierarchy.sql`

```sql
-- Copy the entire file contents
-- Go to: Supabase Dashboard → SQL Editor
-- Paste and Execute
```

**What this does:**
- ✅ Adds `department_id` column to teams table
- ✅ Migrates existing teams to departments
- ✅ Creates necessary indexes

---

## 📋 **Step 2: Assign Departments to Managers**

### **In Admin Panel:**

1. **Login as Admin**
2. **Go to: General Settings**
3. **Click: "Manager Departments" tab**
4. **Click: "Assign Departments" button**
5. **Select a manager**
6. **Check departments** (e.g., Field, DC, Operations)
7. **Click: "Assign Departments"**

**Example:**
```
Manager: John Smith
Departments: 
  ☑ Field
  ☑ DC
  
→ John can now work in both Field and DC
```

---

## 🎯 **Step 3: Test Manager Flow**

### **Login as Manager:**

1. **Login with manager credentials**
2. **You'll see Department Selection screen**
   - Shows all assigned departments as cards
   - Click any department to enter

3. **Department Selected!**
   - See department name in navbar
   - All pages now scoped to that department

4. **Create a Team:**
   - Go to Team Management
   - Click "Create New Team"
   - Team auto-assigned to current department ✅

5. **Create a Technician:**
   - Click "Create User"
   - Technician auto-assigned to current department ✅

6. **Switch Departments:**
   - Click department pill in navbar
   - Click "Switch Department"
   - Select different department
   - See different data!

---

## 🐛 **Troubleshooting**

### **Issue: "0 teams found" or "0 users found"**

**Cause:** Database migration not run OR teams don't have department_id

**Solution:**
```sql
-- 1. Run the migration SQL first
-- 2. Check if teams have department_id:
SELECT id, team_name, department_id FROM teams;

-- 3. If department_id is NULL, update:
UPDATE teams SET department_id = (
  SELECT department_id FROM manager_departments 
  WHERE manager_id = teams.manager_id 
  LIMIT 1
) WHERE department_id IS NULL;
```

### **Issue: "Manager has no departments assigned"**

**Cause:** No entries in `manager_departments` table

**Solution:**
1. Login as Admin
2. General Settings → Manager Departments
3. Assign departments to manager

### **Issue: "ReportsOverview error"**

**Cause:** Fixed! Was a `selectedDepartment` undefined issue

**Solution:** Already fixed in code ✅

---

## 📊 **Verify Setup**

### **Check Database:**

```sql
-- 1. Check teams have department_id
SELECT t.team_name, t.department_id, d.name as department_name
FROM teams t
LEFT JOIN departments d ON t.department_id = d.id
WHERE t.manager_id = 'YOUR_MANAGER_ID';

-- 2. Check manager has departments assigned
SELECT m.full_name, d.name as department_name
FROM manager_departments md
JOIN users m ON md.manager_id = m.id
JOIN departments d ON md.department_id = d.id
WHERE m.role = 'manager';

-- 3. Check technicians have department_id
SELECT full_name, department_id 
FROM users 
WHERE role = 'technician' AND manager_id = 'YOUR_MANAGER_ID';
```

### **Expected Results:**

**Teams Query:**
```
team_name       | department_id | department_name
----------------|---------------|----------------
North Zone Team | abc-123-...   | Field
South Zone Team | def-456-...   | DC
```

**Manager Departments Query:**
```
full_name   | department_name
------------|----------------
John Smith  | Field
John Smith  | DC
```

**Technicians Query:**
```
full_name  | department_id
-----------|---------------
Alice      | abc-123-...
Bob        | abc-123-...
```

---

## ✅ **Checklist**

Before reporting issues, verify:

- [ ] SQL migration executed in Supabase
- [ ] Departments created (Admin → General Settings → Departments)
- [ ] Manager assigned to departments (Admin → General Settings → Manager Departments)
- [ ] Technicians have department_id set
- [ ] Teams have department_id set
- [ ] Browser refreshed after changes
- [ ] Console logs checked for actual data

---

## 🎯 **Quick Fix Commands**

### **If existing teams don't show:**

```sql
-- Update all teams to manager's first department
UPDATE teams t
SET department_id = (
  SELECT md.department_id 
  FROM manager_departments md
  WHERE md.manager_id = t.manager_id
  LIMIT 1
)
WHERE t.department_id IS NULL;
```

### **If existing technicians don't show:**

```sql
-- Update technicians to manager's first department
UPDATE users u
SET department_id = (
  SELECT md.department_id 
  FROM manager_departments md
  WHERE md.manager_id = u.manager_id
  LIMIT 1
)
WHERE u.role = 'technician' 
  AND u.department_id IS NULL
  AND u.manager_id IS NOT NULL;
```

---

## 🚀 **After Setup:**

You should see:
- ✅ Department selection on manager login
- ✅ Department name in navbar
- ✅ Teams filtered by department
- ✅ Technicians filtered by department
- ✅ Reports filtered by department
- ✅ Can switch departments anytime

---

## 📝 **Summary**

**3 Simple Steps:**

1. **Run SQL** - `migrate-to-department-hierarchy.sql`
2. **Assign Departments** - Admin → General Settings → Manager Departments
3. **Test** - Login as manager, select department, create team!

**That's it!** 🎉

If you still see 0 teams/users after this, check the console logs to see what data is actually being fetched.

