-- Supabase Storage Policies for GymJams Application
-- Run these policies in your Supabase SQL editor to secure your storage bucket

-- Policy for resume uploads (application submissions)
CREATE POLICY "Service role can manage resumes" ON storage.objects
FOR ALL USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'resumes'
  AND auth.jwt() ->> 'role' = 'service_role'
);

-- Policy for signed documents
CREATE POLICY "Service role can manage signed documents" ON storage.objects
FOR ALL USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'signed-documents'
  AND auth.jwt() ->> 'role' = 'service_role'
);

-- Policy for taskforce members to view application documents
CREATE POLICY "Taskforce can view application documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads' 
  AND ((storage.foldername(name))[1] = 'resumes' OR (storage.foldername(name))[1] = 'signed-documents')
  AND auth.jwt() ->> 'role' IN ('taskforce', 'admin')
);

-- Policy for product images
CREATE POLICY "Service role can manage product images" ON storage.objects
FOR ALL USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'products'
  AND auth.jwt() ->> 'role' = 'service_role'
);

-- Policy for public viewing of product images
CREATE POLICY "Public can view product images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'products'
);

-- Policy for gym-bros images (coach/member profile images)
CREATE POLICY "Service role can manage gym-bros images" ON storage.objects
FOR ALL USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'gym-bros'
  AND auth.jwt() ->> 'role' = 'service_role'
);

-- Policy for public viewing of gym-bros images
CREATE POLICY "Public can view gym-bros images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'gym-bros'
);

-- Policy for profile images
CREATE POLICY "Users can manage their own profile images" ON storage.objects
FOR ALL USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy for public viewing of profile images
CREATE POLICY "Public can view profile images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'profiles'
);

-- Policy for general uploads (fallback for other file types)
CREATE POLICY "Service role can manage general uploads" ON storage.objects
FOR ALL USING (
  bucket_id = 'uploads' 
  AND auth.jwt() ->> 'role' = 'service_role'
);

-- Policy for authenticated users to view their own files
CREATE POLICY "Users can view their own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads' 
  AND auth.uid() IS NOT NULL
  AND (
    -- User can see their own profile images
    ((storage.foldername(name))[1] = 'profiles' AND auth.uid()::text = (storage.foldername(name))[2])
    -- Or public content
    OR (storage.foldername(name))[1] IN ('products', 'gym-bros')
  )
);
