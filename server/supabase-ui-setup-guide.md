## Supabase Storage Policies Setup Guide
## Use this guide to manually set up policies in the Supabase Dashboard

### Step 1: Go to Storage > Policies in your Supabase Dashboard

### Step 2: Create these policies one by one:

---

## Policy 1: Service Role Access (CRITICAL)
- **Name**: `Service role can manage all files`
- **Policy Type**: `ALL` (Create, Read, Update, Delete)
- **Target**: `storage.objects`
- **Policy Definition**:
```sql
bucket_id = 'uploads' AND auth.jwt() ->> 'role' = 'service_role'
```

---

## Policy 2: Public Read - Profile Images
- **Name**: `Public can view profile images`
- **Policy Type**: `SELECT` (Read only)
- **Target**: `storage.objects`
- **Policy Definition**:
```sql
bucket_id = 'uploads' AND (storage.foldername(name))[1] = 'profile-images'
```

---

## Policy 3: Public Read - Gym Bros Images
- **Name**: `Public can view gym-bros images`
- **Policy Type**: `SELECT` (Read only)
- **Target**: `storage.objects`
- **Policy Definition**:
```sql
bucket_id = 'uploads' AND (storage.foldername(name))[1] = 'gym-bros'
```

---

## Policy 4: Public Read - Product Images
- **Name**: `Public can view product images`
- **Policy Type**: `SELECT` (Read only)
- **Target**: `storage.objects`
- **Policy Definition**:
```sql
bucket_id = 'uploads' AND (storage.foldername(name))[1] = 'products'
```

---

## Policy 5: Public Read - User Uploads
- **Name**: `Public can view user uploads`
- **Policy Type**: `SELECT` (Read only)
- **Target**: `storage.objects`
- **Policy Definition**:
```sql
bucket_id = 'uploads' AND (storage.foldername(name))[1] = 'user-uploads'
```

---

## Policy 6: Legacy Support (IMPORTANT)
- **Name**: `Public can view all uploads`
- **Policy Type**: `SELECT` (Read only)
- **Target**: `storage.objects`
- **Policy Definition**:
```sql
bucket_id = 'uploads'
```

---

### Step 3: Enable Row Level Security

In the Storage > Policies section, make sure to:
1. Click "Enable RLS" if it's not already enabled
2. Verify all policies are created and active

### Step 4: Test Your App

After setting up the policies:
1. Your app should work normally
2. Images should load properly
3. Uploads should continue to work

---

## Alternative: Use SQL Editor in Dashboard

If you prefer SQL, go to:
1. SQL Editor in Supabase Dashboard
2. Create a new query
3. Copy and paste ONLY the CREATE POLICY statements (not the ALTER TABLE)
4. Run them one by one
