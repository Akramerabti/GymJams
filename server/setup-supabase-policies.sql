-- Supabase Storage Policies for uploads bucket
-- Run these commands in your Supabase SQL Editor

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to upload their own profile images
CREATE POLICY "Users can upload profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'profile'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy to allow users to view their own profile images
CREATE POLICY "Users can view their own profile images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'profile'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy to allow users to update their own profile images
CREATE POLICY "Users can update their own profile images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'profile'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy to allow users to delete their own profile images
CREATE POLICY "Users can delete their own profile images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'profile'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy to allow public read access to all profile images (for viewing other users' profiles)
CREATE POLICY "Public can view all profile images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'profile'
);

-- Policy for gym images (if you have gym-related uploads)
CREATE POLICY "Users can upload gym images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'gyms'
  AND auth.role() = 'authenticated'
);

-- Policy for workout images
CREATE POLICY "Users can upload workout images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'workouts'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy for public viewing of gym and workout images
CREATE POLICY "Public can view gym and workout images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads' 
  AND ((storage.foldername(name))[1] = 'gyms' OR (storage.foldername(name))[1] = 'workouts')
);

-- Service role policy (for backend operations)
CREATE POLICY "Service role can manage all files" ON storage.objects
FOR ALL USING (
  bucket_id = 'uploads' 
  AND auth.jwt() ->> 'role' = 'service_role'
);
