# 📋 Draft Complaint Number Flow - Complete Guide

## ✅ **COMPLETE COMPLAINT NUMBER LIFECYCLE**

---

## 🔄 **The Complete Flow:**

```
┌─────────────────────────────────────────────┐
│ STEP 1: NEW REPORT CREATED                  │
├─────────────────────────────────────────────┤
│ Complaint Number: COMP-1760642449787        │
│ (Auto-generated with timestamp)             │
└─────────────────────┬───────────────────────┘
                      ↓
         ┌────────────┴────────────┐
         │                         │
┌────────▼────────┐   ┌───────────▼──────────┐
│ SAVE AS DRAFT   │   │ SUBMIT DIRECTLY      │
├─────────────────┤   ├──────────────────────┤
│ Number changes  │   │ Number stays         │
│ to:             │   │ COMP-1760642449787   │
│ DRAFT-user123-  │   │                      │
│ 1760642449787   │   │ Status: submitted    │
│                 │   │                      │
│ Status: draft   │   │ Goes to Team Leader  │
└────────┬────────┘   └──────────┬───────────┘
         │                       │
         │                       ↓
         │            ┌──────────────────────┐
         │            │ TEAM LEADER APPROVES │
         │            ├──────────────────────┤
         │            │ Number changes to:   │
         │            │ COMP-00001           │
         │            │ (Sequential)         │
         │            └──────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ STEP 2: CONTINUE DRAFT                      │
├─────────────────────────────────────────────┤
│ User opens draft from Drafts page           │
│ Sees: DRAFT-user123-1760642449787           │
│                                             │
│ User can:                                   │
│ A) Keep as is                               │
│ B) Change to custom number (e.g. COMP-12345)│
└─────────────────────┬───────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│ STEP 3: SUBMIT DRAFT                        │
├─────────────────────────────────────────────┤
│ System checks complaint number format:      │
│                                             │
│ IF starts with "DRAFT-":                    │
│   → Convert to COMP-{timestamp}             │
│   → DRAFT-user123-... becomes COMP-17606... │
│                                             │
│ IF custom number (e.g. COMP-12345):         │
│   → Keep custom number                      │
│   → Stays as COMP-12345                     │
│                                             │
│ Status: submitted                           │
│ Goes to Team Leader                         │
└─────────────────────┬───────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│ STEP 4: TEAM LEADER APPROVAL                │
├─────────────────────────────────────────────┤
│ Current: COMP-1760642... or COMP-12345      │
│                                             │
│ Team Leader clicks "Approve"                │
│ System assigns sequential number:           │
│ COMP-00001 (or next available)              │
│                                             │
│ Replaces temporary number                   │
│ Status: approved                            │
└─────────────────────────────────────────────┘
```

---

## 📊 **Detailed Examples:**

### **Example 1: Direct Submission**
```
1. New Report → COMP-1760642449787
2. Submit → COMP-1760642449787 (unchanged)
3. Approve → COMP-00001 (sequential)
```

### **Example 2: Save as Draft, Continue, Submit**
```
1. New Report → COMP-1760642449787
2. Save Draft → DRAFT-user123-1760642449787
3. Continue → DRAFT-user123-1760642449787
4. Submit → COMP-1760642500000 (new COMP- format)
5. Approve → COMP-00002 (sequential)
```

### **Example 3: Save as Draft, Edit Number, Submit**
```
1. New Report → COMP-1760642449787
2. Save Draft → DRAFT-user123-1760642449787
3. Continue → DRAFT-user123-1760642449787
4. User changes to → COMP-CUSTOM-001
5. Submit → COMP-CUSTOM-001 (keeps custom)
6. Approve → COMP-00003 (sequential)
```

---

## 💻 **Code Implementation:**

### **Save as Draft:**
```javascript
// In handleSaveDraft()
if (!isDraftMode) {
  const timestamp = Date.now();
  draftComplaintNo = `DRAFT-${user.id}-${timestamp}`;
}
// Saves: DRAFT-abc-123-1760642449787
```

### **Submit Draft:**
```javascript
// In handleSubmit()
let finalComplaintNo = formData.complaint_no;

if (isDraftMode && finalComplaintNo?.startsWith('DRAFT-')) {
  // Convert DRAFT- to COMP- format
  const timestamp = Date.now();
  finalComplaintNo = `COMP-${timestamp}`;
  console.log('Converting draft to submission format:', finalComplaintNo);
}
// Result: COMP-1760642500000
```

### **Team Leader Approval:**
```javascript
// In handleApproval() - Team Leader page
if (action === 'approve') {
  const { data: sequentialNumber } = await supabase
    .rpc('get_next_complaint_number');
  
  updateData.complaint_no = sequentialNumber;
  // Result: COMP-00001, COMP-00002, etc.
}
```

---

## 🎯 **Visual Indicator:**

### **In Step 1 Complaint Number Field:**

**If continuing draft:**
```
┌────────────────────────────────────┐
│ Complaint Number *                 │
│ ┌────────────────────────────────┐ │
│ │ DRAFT-user123-1760642449787    │ │
│ └────────────────────────────────┘ │
│ ⚠️ Draft format - Will convert to  │
│    COMP- format on submit          │
└────────────────────────────────────┘
```

**If custom number:**
```
┌────────────────────────────────────┐
│ Complaint Number *                 │
│ ┌────────────────────────────────┐ │
│ │ COMP-12345                     │ │
│ └────────────────────────────────┘ │
│ ✓ COMP-12345                       │
└────────────────────────────────────┘
```

---

## 📋 **Complete Workflow Examples:**

### **Scenario A: Quick Report (No Draft)**
```
Technician:
  1. New Report → COMP-1760642449787
  2. Fill all steps
  3. Submit → COMP-1760642449787

Team Leader:
  4. Review report
  5. Approve → COMP-00001 ✅
```

### **Scenario B: Save Draft, Continue Later**
```
Day 1 - Technician:
  1. New Report → COMP-1760642449787
  2. Fill Steps 1-3
  3. Click Back → Save as Draft
  4. Number becomes: DRAFT-user123-1760642449787
  5. Saved in database

Day 2 - Technician:
  6. Open Drafts
  7. Click "Continue"
  8. Sees: DRAFT-user123-1760642449787
  9. Can change to: COMP-MYCUSTOM-001
  10. Complete remaining steps
  11. Submit
  12. If kept DRAFT- format → Converts to COMP-1760642500000
      If changed to COMP-MYCUSTOM-001 → Keeps COMP-MYCUSTOM-001

Team Leader:
  13. Review report
  14. Approve → COMP-00002 ✅
```

---

## 🗄️ **Database Changes:**

### **Draft Creation:**
```sql
INSERT INTO service_reports 
(complaint_no, status, ...) 
VALUES ('DRAFT-user123-1760642449787', 'draft', ...);
```

### **Continue Draft (Submit):**
```sql
UPDATE service_reports 
SET 
  complaint_no = 'COMP-1760642500000',  -- Converted!
  status = 'submitted',
  approval_status = 'pending'
WHERE id = [draft_id];
```

### **Team Leader Approval:**
```sql
UPDATE service_reports 
SET 
  complaint_no = 'COMP-00001',  -- Sequential!
  status = 'approved',
  approval_status = 'approve',
  tl_signature = [...],
  approved_at = NOW()
WHERE id = [report_id];
```

---

## ✅ **Summary:**

| Stage | Complaint Number Format | Example |
|-------|------------------------|---------|
| New Report | `COMP-{timestamp}` | COMP-1760642449787 |
| Save as Draft | `DRAFT-{userId}-{timestamp}` | DRAFT-user123-1760642449787 |
| Continue Draft | Same as saved | DRAFT-user123-1760642449787 |
| User can edit | Any format | COMP-CUSTOM-001 |
| Submit Draft | `COMP-{timestamp}` or custom | COMP-1760642500000 |
| Approved | `COMP-{5-digit-sequential}` | COMP-00001 |

---

## 🎯 **Key Points:**

1. ✅ **DRAFT-** format is temporary (only while draft)
2. ✅ User can change complaint number in draft
3. ✅ On submit, DRAFT- converts to COMP-
4. ✅ Custom numbers (COMP-12345) are preserved
5. ✅ Team Leader approval assigns official sequential number
6. ✅ Sequential number (COMP-00001) is final and permanent

---

## 🧪 **Test the Flow:**

### **Test 1: Draft → Submit Conversion**
```
1. New Report
2. Save as Draft
3. Go to Drafts page
4. See: DRAFT-user123-...
5. Click "Continue"
6. Check Step 1: Shows DRAFT-...
7. Complete report and Submit
8. Check database: Should be COMP-... (not DRAFT-)
```

### **Test 2: Edit Draft Number**
```
1. Continue a draft
2. Change complaint number from DRAFT-... to COMP-MYTEST
3. Submit
4. Check database: Should be COMP-MYTEST
5. Team Leader approves
6. Check database: Should be COMP-00001 (sequential replaces custom)
```

---

## 📝 **Console Logs:**

**When submitting a draft:**
```
📝 Converting draft complaint number to submission format: COMP-1760642500000
```

**When submitting with custom number:**
```
(No conversion message - keeps custom number)
```

**When team leader approves:**
```
✅ Assigned sequential complaint number: COMP-00001
```

---

## 🎉 **Complete!**

Your complaint number flow now has:
- ✅ DRAFT- format for saved drafts
- ✅ Auto-conversion to COMP- on submit
- ✅ User can edit to custom number
- ✅ Sequential numbering on approval
- ✅ Clear visual indicators
- ✅ Proper format transitions

**The complaint number lifecycle is fully implemented!** 📊✅

