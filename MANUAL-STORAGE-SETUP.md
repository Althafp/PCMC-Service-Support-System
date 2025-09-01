# Manual Supabase Storage Setup Guide

## 🚨 The Issue
The SQL scripts can't create storage buckets because `storage.objects` is a system table with restricted access. You need to set up storage manually through the Supabase Dashboard.

## 📋 Step-by-Step Manual Setup

### Step 1: Create Storage Bucket in Supabase Dashboard

1. **Go to your Supabase Dashboard**
   - Navigate to: `https://supabase.com/dashboard/project/[YOUR-PROJECT-ID]`

2. **Navigate to Storage**
   - Click on **"Storage"** in the left sidebar
   - Click on **"New bucket"**

3. **Create the Images Bucket**
   - **Name**: `images`
   - **Public bucket**: ✅ **Check this** (so images can be viewed)
   - **File size limit**: `10485760` (10MB)
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png` 
     - `image/gif`
     - `image/webp`
   - Click **"Create bucket"**

### Step 2: Set Storage Policies

1. **Click on your `images` bucket**
2. **Go to "Policies" tab**
3. **Click "New Policy"**

#### Policy 1: Allow Uploads
- **Policy name**: `Allow authenticated uploads`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(bucket_id = 'images' AND auth.role() = 'authenticated')
```

#### Policy 2: Allow Viewing
- **Policy name**: `Allow authenticated viewing`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(bucket_id = 'images' AND auth.role() = 'authenticated')
```

#### Policy 3: Allow Updates
- **Policy name**: `Allow user updates`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(bucket_id = 'images' AND auth.role() = 'authenticated')
```

#### Policy 4: Allow Deletes
- **Policy name**: `Allow user deletes`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(bucket_id = 'images' AND auth.role() = 'authenticated')
```

### Step 3: Run the Corrected SQL Script

After creating the bucket manually, run the `setup-storage-corrected.sql` script in your SQL Editor. This will:

- ✅ Create helper functions
- ✅ Create tracking tables
- ✅ Set up proper permissions
- ✅ Create useful views

### Step 4: Test the Setup

1. **Build your project**:
   ```bash
   npm run build
   ```

2. **Test image upload**:
   - Go to `/technician/new-report`
   - Upload a test image
   - Check if it appears in preview
   - Submit the report

3. **Check team leader view**:
   - Go to `/team-leader/approvals/{reportId}`
   - Verify images are visible

## 🔧 Alternative: Use Supabase CLI

If you prefer command line:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref [YOUR-PROJECT-ID]

# Create storage bucket
supabase storage create images --public

# Set policies
supabase storage policy create images "Allow authenticated uploads" --insert --role authenticated
supabase storage policy create images "Allow authenticated viewing" --select --role authenticated
supabase storage policy create images "Allow user updates" --update --role authenticated
supabase storage policy create images "Allow user deletes" --delete --role authenticated
```

## 🚨 Common Issues & Solutions

### Issue 1: "Bucket already exists"
- **Solution**: Skip bucket creation, just set policies

### Issue 2: "Permission denied"
- **Solution**: Make sure you're logged in as project owner

### Issue 3: Images not uploading
- **Solution**: Check browser console for CORS errors

### Issue 4: Images not displaying
- **Solution**: Verify bucket is public and policies are correct

## 📱 Testing Checklist

- [ ] Storage bucket `images` created
- [ ] Bucket is public
- [ ] All 4 policies are set
- [ ] Project builds without errors
- [ ] Image upload works in form
- [ ] Images display in preview
- [ ] Images save with report
- [ ] Images visible to team leaders

## 🆘 If Still Having Issues

1. **Check Supabase Dashboard Storage section**
2. **Verify bucket permissions**
3. **Check browser console for errors**
4. **Verify image URLs in database**
5. **Test with a simple image first (< 1MB)**

## 🎯 Next Steps

Once storage is working:
1. Test with larger images
2. Test multiple image uploads
3. Test image deletion
4. Monitor storage usage
5. Set up image optimization if needed
