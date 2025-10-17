# 🔄 Department-Based Hierarchy Migration Guide

## 🎯 Goal

**Manager with multiple departments selects which department to work in, and manages only that department's teams and members.**

---

## 📊 Current vs New Structure

### Current:
```
Manager A
  └─ All Teams
      └─ All Technicians
```

### New:
```
Manager A (has: Field, DC departments)
  ↓ (Login and SELECT department)
  
If selects "Field":
  Manager A → Field Department
    └─ Teams in Field
        └─ Technicians in Field
        
If selects "DC":
  Manager A → DC Department
    └─ Teams in DC
        └─ Technicians in DC
```

---

## 🗄️ Database Changes Needed

### Step 1: Update Teams Table

**Add department_id to teams:**
```sql
ALTER TABLE public.teams 
ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

CREATE INDEX idx_teams_department_id ON public.teams(department_id);
```

**Why:** Teams need to belong to a department

### Step 2: Data Already Exists ✅

**You already have:**
- ✅ `manager_departments` table (manager → multiple departments)
- ✅ `users.department_id` (user → one department)
- ✅ `departments` table

---

## 🔧 Implementation Steps

### STEP 1: Database Migration (SQL)

**File:** `migrate-to-department-hierarchy.sql`

```sql
-- 1. Add department_id to teams
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_teams_department_id ON public.teams(department_id);

-- 2. Update existing teams with manager's first department (temporary)
-- This ensures no broken data
UPDATE public.teams t
SET department_id = (
  SELECT md.department_id 
  FROM public.manager_departments md
  WHERE md.manager_id = t.manager_id
  LIMIT 1
)
WHERE t.department_id IS NULL;

-- Done!
```

### STEP 2: Create Department Selection Screen

**After manager login, show department selection:**

**File:** `src/pages/manager/DepartmentSelection.tsx`

Features:
- Shows all departments assigned to this manager
- Manager clicks one to enter
- Stores selected department in context
- All subsequent pages use this department

### STEP 3: Create Department Context

**File:** `src/contexts/DepartmentContext.tsx`

Stores:
- Selected department ID
- Selected department name
- Function to change department

### STEP 4: Update Manager Pages

**All manager pages filter by selected department:**

Files to update:
- `ManagerDashboard.tsx` - Stats for selected department only
- `TeamManagementNew.tsx` - Teams in selected department only
- `ReportsOverview.tsx` - Reports from selected department only
- `Analytics.tsx` - Analytics for selected department only

### STEP 5: Update Admin User Management

**Show hierarchy:**
```
Admin View:
  Manager A
    ├─ Department: Field
    │   ├─ Team 1
    │   │   ├─ Technician 1
    │   │   └─ Technician 2
    │   └─ Team 2
    │       └─ Technician 3
    └─ Department: DC
        └─ Team 3
            ├─ Technician 4
            └─ Technician 5
```

### STEP 6: Update Team Creation

When manager creates team:
- Auto-assign department_id = selectedDepartment
- Team belongs to that department

### STEP 7: Update Technician Creation

When manager creates technician:
- Auto-assign department_id = selectedDepartment
- Technician belongs to that department

---

## 🔄 User Flows

### Manager Login Flow:

```
1. Manager logs in with credentials
    ↓
2. Redirected to Department Selection
    ↓
3. Shows all assigned departments (from manager_departments)
    ↓
4. Manager clicks "Field Department"
    ↓
5. Department context set to Field
    ↓
6. Redirected to Dashboard
    ↓
7. All data filtered by Field department
```

### Manager Switching Department:

```
1. Manager working in Field
    ↓
2. Clicks "Switch Department" (in navbar or sidebar)
    ↓
3. Department selection screen appears
    ↓
4. Selects "DC"
    ↓
5. Context updates
    ↓
6. Dashboard reloads with DC data only
```

### Creating Team:

```
1. Manager in Field department
    ↓
2. Goes to Team Management
    ↓
3. Clicks "Create Team"
    ↓
4. Enters team name
    ↓
5. System auto-sets: department_id = Field
    ↓
6. Team created in Field department only
```

---

## 📝 Simple Changes Summary

### Database:
1. ✅ Add `department_id` to `teams` table
2. ✅ `manager_departments` table (already exists)
3. ✅ `users.department_id` (already exists)

### Frontend:

**NEW Files (4):**
1. `DepartmentSelection.tsx` - Department picker after login
2. `DepartmentContext.tsx` - Store selected department
3. `migrate-to-department-hierarchy.sql` - Database migration
4. `DepartmentSwitcher.tsx` - Component to change department (optional)

**UPDATE Files (6):**
1. `ManagerDashboard.tsx` - Filter by selected department
2. `TeamManagementNew.tsx` - Filter teams, auto-assign department
3. `ReportsOverview.tsx` - Filter reports by department
4. `Analytics.tsx` - Filter analytics by department
5. `UserManagementHierarchical.tsx` - Group by manager → department
6. `App.tsx` - Add department selection route

---

## 🎯 Key Queries

### Before (ALL data):
```typescript
// Get all teams for this manager
supabase.from('teams')
  .eq('manager_id', managerId)
```

### After (Filtered by department):
```typescript
// Get teams for this manager in SELECTED department
supabase.from('teams')
  .eq('manager_id', managerId)
  .eq('department_id', selectedDepartmentId)
```

---

## ⚡ Quick Impact Analysis

| Feature | Change Required | Complexity |
|---------|----------------|------------|
| Database | Add 1 column to teams | Low |
| Department Selection | New page | Medium |
| Department Context | New context | Low |
| Manager Dashboard | Add filter | Low |
| Team Management | Add filter + auto-assign | Medium |
| Reports | Add filter | Low |
| Analytics | Add filter | Low |
| Admin View | Restructure hierarchy | Medium |

**Total Estimated Time:** 2-3 hours  
**Risk Level:** Medium (affects manager workflow)  
**Benefit:** High (proper department isolation)

---

## 🚀 Should I Proceed?

I can implement this in the following order:

1. **Database migration** (SQL file)
2. **Department Context** (state management)
3. **Department Selection page** (after login)
4. **Update all manager pages** (filter by department)
5. **Update admin user management** (hierarchical view)
6. **Testing checklist**

**Ready to proceed with implementation?** 

This will ensure:
- ✅ Manager A in Field department only sees Field teams/technicians
- ✅ Manager A can switch to DC department to see DC teams/technicians
- ✅ Complete separation between departments
- ✅ Clean, organized admin view

Shall I start implementing? I'll create each component step-by-step.

