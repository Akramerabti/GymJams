-- Simplified Supabase Storage Policies (Dashboard SQL Editor)
-- Go to: Supabase Dashboard → SQL Editor → New Query
-- Copy and paste these commands ONE BY ONE (not all at once)

-- Policy 1: Service role access (CRITICAL - Your backend needs this)
CREATE POLICY "Service role can manage all files" ON storage.objects
FOR ALL USING (
  bucket_id = 'uploads' 
  AND auth.jwt() ->> 'role' = 'service_role'
);

-- Policy 2: Public read for profile images
CREATE POLICY "Public can view profile images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'profile-images'
);

-- Policy 3: Public read for gym-bros images  
CREATE POLICY "Public can view gym-bros images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'gym-bros'
);

-- Policy 4: Public read for product images
CREATE POLICY "Public can view product images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'products'
);

-- Policy 5: Public read for user uploads
CREATE POLICY "Public can view user uploads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'user-uploads'
);

-- Policy 6: Legacy support - allow reading all files in uploads bucket
CREATE POLICY "Public can view all uploads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads'
);

-- Check if policies were created successfully
SELECT policyname, cmd, permissive
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
