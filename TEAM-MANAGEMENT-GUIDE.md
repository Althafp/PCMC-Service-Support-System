# 👥 Team Management System - Complete Guide

## 📋 Overview

A complete team management system for managers to create teams, add technicians, and assign team leaders.

---

## 🗄️ Step 1: Database Setup

### Run this SQL in your Supabase SQL Editor:

```sql
-- File: setup-teams-management.sql
```

This creates:
- ✅ `teams` table with proper structure
- ✅ `team_id` and `team_name` columns in `users` table
- ✅ RLS policies for proper access control
- ✅ Indexes for performance

---

## 🎯 Features

### For Managers:

1. **Create Teams** ✅
   - Unique team names per manager
   - Optional zone assignment
   - Active/inactive status

2. **Add Technicians** ✅
   - Create new technicians using the same edge function
   - Automatically assign to team
   - Set manager_id automatically
   - Optional project & department selection

3. **Assign Team Leader** ✅
   - Select any team member as team leader
   - Updates both team and all members
   - Visual indicator for team leaders

4. **Manage Team Members** ✅
   - View all team members
   - Remove members from team
   - See member details

5. **Edit/Delete Teams** ✅
   - Activate/deactivate teams
   - Delete teams (unassigns all members)
   - Edit team details

---

## 📊 Database Structure

### Teams Table:
```
id                UUID (PK)
team_name         TEXT (Unique per manager)
manager_id        UUID (FK → users.id)
team_leader_id    UUID (FK → users.id) [Optional]
zone              TEXT [Optional]
is_active         BOOLEAN (Default: true)
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

### Users Table Updates:
```
team_id           UUID (FK → teams.id) [NEW]
team_name         TEXT [NEW]
team_leader_id    UUID (FK → users.id) [Existing]
manager_id        UUID (FK → users.id) [Existing]
```

---

## 🔄 Workflow

### Creating a Team:

1. Manager clicks "Create New Team"
2. Enters team name and optional zone
3. Team is created and appears in the list

### Adding Technicians:

1. Manager clicks "Add" on a team card
2. Fills in technician details (same form as admin)
3. Edge function creates user with:
   - `role: 'technician'`
   - `manager_id: current_manager_id`
   - `team_id: selected_team_id`
   - `team_name: selected_team_name`
   - `team_leader_id: null` (assigned later)

### Assigning Team Leader:

1. Manager clicks "Leader" on a team card
2. Sees list of all team members
3. Clicks on a member to assign as team leader
4. System updates:
   - `teams.team_leader_id`
   - `team_leader_id` for ALL team members

### Viewing Team:

1. Manager clicks "View" on a team card
2. Sees all team members with details
3. Can remove members from team

---

## 🎨 UI Components

### Main Page: `TeamManagementNew.tsx`

Features:
- Grid layout of team cards
- Each card shows:
  - Team name
  - Zone
  - Active status
  - Current team leader
  - Action buttons (View, Add, Leader, Toggle, Delete)

### Add Technician Modal: `AddTechnicianModal.tsx`

Features:
- Complete user creation form
- Password generator
- Department & Project dropdowns
- Auto-assignment to team
- Uses same edge function as admin

---

## 🔐 Security & Access Control

### RLS Policies:

**Teams Table:**
- ✅ Managers can manage their own teams
- ✅ Team leaders can view their teams
- ✅ Technicians can view their assigned teams
- ✅ Admins can view all teams

**Users Table:**
- ✅ Existing policies maintained
- ✅ Team assignments controlled by manager

---

## 🚀 Usage Instructions

### For Developers:

1. **Run SQL Setup:**
   ```bash
   # Copy setup-teams-management.sql contents
   # Paste in Supabase SQL Editor
   # Execute
   ```

2. **Already Integrated:**
   - ✅ Routing updated in `App.tsx`
   - ✅ Using `TeamManagementNew` component
   - ✅ Edge function already supports team assignments

3. **Test Flow:**
   ```
   Login as Manager
   → Navigate to Team Management
   → Create Team
   → Add Technicians
   → Assign Team Leader
   → View Team Members
   ```

### For Managers:

1. **Access:** Click "Team Management" in sidebar

2. **Create Team:**
   - Click "Create New Team"
   - Enter team name (required)
   - Enter zone (optional)
   - Click "Create Team"

3. **Add Members:**
   - Click "Add" on team card
   - Fill in technician details
   - Generate password
   - Click "Create Technician"

4. **Assign Leader:**
   - Click "Leader" on team card
   - Click on desired team member
   - Confirmation: Member becomes team leader

5. **Manage:**
   - Click "View" to see all members
   - Click trash icon to remove members
   - Click "Deactivate" to disable team
   - Click "Delete" to remove team

---

## 📱 Features by Role

### Manager:
- ✅ Create multiple teams
- ✅ Add technicians to teams
- ✅ Assign team leaders
- ✅ View team members
- ✅ Remove members
- ✅ Activate/deactivate teams
- ✅ Delete teams

### Team Leader (auto-assigned):
- ✅ View their team
- ✅ Approve reports from team members
- ✅ Access team reports

### Technician (auto-assigned):
- ✅ Knows which team they're in
- ✅ Can see team leader
- ✅ Submits reports to team leader

### Admin:
- ✅ Can view all teams
- ✅ Can create managers & technicians directly

---

## 🔄 Data Flow

```
Manager Creates Team
    ↓
Creates Technician
    ↓
Edge Function → Create User
    ↓
Update User: team_id, team_name, manager_id
    ↓
Assign Team Leader
    ↓
Update Team: team_leader_id
Update All Members: team_leader_id
    ↓
Complete Team Structure
```

---

## ⚡ Key Benefits

1. **Simplified Hierarchy:**
   - Manager → Teams → Technicians → Team Leaders
   - Clear reporting structure

2. **Flexibility:**
   - Multiple teams per manager
   - Any team member can be team leader
   - Easy member reassignment

3. **Automation:**
   - Auto-assignment to manager
   - Batch team leader updates
   - Proper cascade on deletion

4. **User Experience:**
   - Visual team cards
   - Quick actions
   - Real-time updates

---

## 🎯 Next Steps for Production

1. ✅ Run SQL setup
2. ✅ Test team creation
3. ✅ Test technician creation
4. ✅ Test team leader assignment
5. ⏭️ Optional: Add team analytics
6. ⏭️ Optional: Add bulk member import

---

## 🐛 Troubleshooting

**Issue:** Teams table doesn't exist
**Solution:** Run `setup-teams-management.sql`

**Issue:** Can't create technicians
**Solution:** Check edge function is deployed

**Issue:** Team leader not updating
**Solution:** Check RLS policies are applied

**Issue:** Members not showing
**Solution:** Verify team_id is set correctly

---

## 📝 Summary

**Files Created/Modified:**
- ✅ `setup-teams-management.sql` - Database setup
- ✅ `TeamManagementNew.tsx` - Main manager page
- ✅ `AddTechnicianModal.tsx` - Add technician component
- ✅ `App.tsx` - Routing updated

**Database Tables:**
- ✅ `teams` (new)
- ✅ `users` (updated with team_id, team_name)

**Features:**
- ✅ Complete team management
- ✅ Technician creation via edge function
- ✅ Team leader assignment
- ✅ Member management
- ✅ Team activation/deletion

**Ready to use!** 🚀

