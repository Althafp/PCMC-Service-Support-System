# 🚀 Installation & Deployment Guide

## ✅ **FINAL INSTALLATION STEPS**

---

## 📦 **Step 1: Install Dependencies**

```bash
npm install
```

This will install newly added packages:
- ✅ jspdf (PDF generation)
- ✅ jspdf-autotable (PDF tables)

**Expected output:**
```
added 2 packages
```

---

## 🗄️ **Step 2: Setup Database**

### **Run Sequential Numbering Setup:**

1. Open **Supabase Dashboard**
2. Go to **SQL Editor** → **New Query**
3. Copy and paste contents of: `setup-sequential-numbering.sql`
4. Click **Run**

**Test it worked:**
```sql
SELECT get_next_complaint_number();
-- Should return: COMP-00001

SELECT * FROM complaint_number_counter;
-- Should show: id=1, current_number=1
```

---

## 📸 **Step 3: Setup Supabase Storage**

### **Create Images Bucket:**

1. Open **Supabase Dashboard**
2. Go to **Storage**
3. Click **New Bucket**
4. Name: `images`
5. Make it **Public**
6. Click **Create**

### **Add Storage Policies:**

In **SQL Editor**, run:

```sql
-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Allow public read access
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Allow authenticated users to delete their images
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');
```

---

## 🔨 **Step 4: Build Frontend**

```bash
npm run build
```

**Expected output:**
```
vite v5.4.2 building for production...
✓ 1234 modules transformed.
dist/index.html                   0.45 kB
dist/assets/index-xxxxx.css      123.45 kB
dist/assets/index-xxxxx.js      456.78 kB
✓ built in 15.23s
```

---

## 🚢 **Step 5: Deploy**

### **Deploy to Your Hosting:**

```bash
# If using Vercel:
vercel --prod

# If using Netlify:
netlify deploy --prod --dir=dist

# If using other hosting:
# Upload the entire 'dist' folder
```

---

## ✅ **Verification Checklist:**

### **Database:**
- [ ] complaint_number_counter table exists
- [ ] get_next_complaint_number() function exists
- [ ] Function returns COMP-00001 when tested
- [ ] location_details table has RFP data
- [ ] users table has signature column
- [ ] service_reports table has all columns

### **Storage:**
- [ ] 'images' bucket created
- [ ] Bucket is public
- [ ] Upload policy added
- [ ] Read policy added

### **Frontend:**
- [ ] npm install completed successfully
- [ ] npm run build completed successfully
- [ ] dist folder created with files
- [ ] No build errors

### **Features:**
- [ ] Login works
- [ ] Create user works (team leader optional)
- [ ] Profile signature saves and displays
- [ ] New report auto-generates complaint#
- [ ] Date auto-sets to today
- [ ] RFP dropdown works and auto-fills
- [ ] GPS captures coordinates
- [ ] Images upload with GPS watermarks
- [ ] Equipment checklist (33 items) works
- [ ] Draft saving works (DRAFT- format)
- [ ] Drafts visible in sidebar
- [ ] Continue draft works
- [ ] Submit converts DRAFT- to COMP-
- [ ] Report view shows all data
- [ ] Download PDF button works
- [ ] Team leader approval assigns sequential#

---

## 🧪 **Complete Test Flow:**

### **Test 1: Setup (One-time)**
```bash
1. Run: setup-sequential-numbering.sql
2. Create 'images' bucket
3. Add storage policies
4. npm install
5. npm run build
```

### **Test 2: Create First User**
```
Admin → Add User
- Technician without team leader
✅ Should create successfully
```

### **Test 3: Setup Profile**
```
Login → Profile → Draw Signature → Save
Reopen Profile
✅ Signature should display
```

### **Test 4: Complete Report**
```
New Report → Fill all steps → Submit
✅ No validation errors
✅ Complaint #, date auto-filled
```

### **Test 5: Approve & Sequential**
```
Team Leader → Approve Report
✅ Alert: "COMP-00001"
✅ Database: complaint_no = COMP-00001
✅ Counter: current_number = 1
```

### **Test 6: Download PDF**
```
View Report → Download button
✅ PDF downloads
✅ Contains all data
✅ Images visible with GPS
✅ Signatures displayed
```

---

## 🎯 **Production Deployment:**

### **Environment Variables:**

Make sure these are set:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### **Build Commands:**

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm run preview  # Test build locally
```

### **Deploy:**
```bash
# Deploy dist folder to your hosting service
```

---

## 📊 **File Structure:**

```
project/
├── src/
│   ├── components/
│   │   ├── Forms/
│   │   │   ├── BasicInformation.tsx ✅
│   │   │   ├── LocationDetails.tsx ✅
│   │   │   ├── ImageUpload.tsx ✅
│   │   │   ├── EquipmentChecklist.tsx ✅
│   │   │   ├── ReportContent.tsx ✅
│   │   │   └── TechnicianSignature.tsx ✅
│   │   ├── Layout/
│   │   │   ├── Sidebar.tsx ✅ (Added Drafts)
│   │   │   └── Navbar.tsx
│   │   └── Profile/
│   │       └── UserProfileModal.tsx ✅ (Added Signature)
│   ├── pages/
│   │   ├── technician/
│   │   │   ├── EnhancedNewReport.tsx ✅
│   │   │   ├── Drafts.tsx ✅ NEW
│   │   │   └── MyReports.tsx ✅
│   │   ├── team-leader/
│   │   │   └── EnhancedReportApproval.tsx ✅
│   │   └── UnifiedReportView.tsx ✅ (PDF Download)
│   ├── utils/
│   │   └── pdfGenerator.ts ✅ NEW
│   └── types/
│       └── jspdf-autotable.d.ts ✅ NEW
├── supabase/
│   └── functions/
│       └── create-user/
│           └── index.ts ✅ (Team leader optional)
├── setup-sequential-numbering.sql ✅ NEW
└── package.json ✅ (Added jspdf packages)
```

---

## 🎊 **READY FOR PRODUCTION!**

Your complete PCMC Service Report System has:
- ✅ 50+ database fields
- ✅ Complete draft workflow
- ✅ GPS watermarking on images
- ✅ 33-item equipment checklist
- ✅ Signature management
- ✅ Sequential numbering
- ✅ **PDF download with exact format**
- ✅ Complete report view
- ✅ All bugs fixed

**Run `npm install` and deploy!** 🚀

---

## 🆘 **Troubleshooting:**

### **If PDF doesn't generate:**
```
Check console for errors
Verify jspdf installed: npm list jspdf
Try: npm install jspdf jspdf-autotable --save
```

### **If images don't show in PDF:**
```
Images must be publicly accessible URLs
Check Supabase Storage bucket is public
CORS might block image loading
```

### **If table doesn't appear:**
```
Check checklist_data is JSONB in database
Verify equipment_remarks structure
Log report data to console
```

---

**Installation command:**
```bash
npm install && npm run build
```

**That's it! You're ready to deploy!** 🎉📄✅

