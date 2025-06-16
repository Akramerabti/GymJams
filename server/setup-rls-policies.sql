-- Supabase Storage Security Policies
-- Copy and paste these commands in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard → Your Project → SQL Editor

-- 1. Enable Row Level Security on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Service role can manage all files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view gym-bros images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view user uploads" ON storage.objects;

-- 3. Service role policy (critical for your backend to work)
CREATE POLICY "Service role can manage all files" ON storage.objects
FOR ALL USING (
  bucket_id = 'uploads' 
  AND auth.jwt() ->> 'role' = 'service_role'
);

-- 4. Public read access for profile images (needed for app functionality)
CREATE POLICY "Public can view profile images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'profile-images'
);

-- 5. Public read access for gym-bros images
CREATE POLICY "Public can view gym-bros images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'gym-bros'
);

-- 6. Public read access for product images
CREATE POLICY "Public can view product images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'products'
);

-- 7. Public read access for user uploads (general uploads)
CREATE POLICY "Public can view user uploads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'user-uploads'
);

-- 8. Allow read access for any uploads that don't follow folder structure (legacy support)
CREATE POLICY "Public can view legacy uploads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads'
);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
