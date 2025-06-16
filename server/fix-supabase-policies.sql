-- Updated Supabase Storage Policies to match actual folder structure
-- Run these commands in your Supabase SQL Editor

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view all profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload gym images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view gym and workout images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload workout images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage all files" ON storage.objects;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow public read access to ALL files in uploads bucket
-- This is the most important one for displaying images
CREATE POLICY "Public can view all uploads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads'
);

-- Policy for authenticated users to upload profile images
CREATE POLICY "Authenticated users can upload profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'profile-images'
  AND auth.role() = 'authenticated'
);

-- Policy for authenticated users to upload gym-bros images
CREATE POLICY "Authenticated users can upload gym-bros images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'gym-bros'
  AND auth.role() = 'authenticated'
);

-- Policy for uploading other types (products, resumes, etc.)
CREATE POLICY "Authenticated users can upload general files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
);

-- Service role policy (for backend operations) - this is critical
CREATE POLICY "Service role can manage all files" ON storage.objects
FOR ALL USING (
  bucket_id = 'uploads'
);

-- Policy for authenticated users to delete their own uploads
CREATE POLICY "Users can delete their own uploads" ON storage.objects
FOR DELETE USING (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
);

-- Policy for authenticated users to update their own uploads
CREATE POLICY "Users can update their own uploads" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
);
