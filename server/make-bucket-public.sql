-- Simple fix: Make the uploads bucket publicly accessible
-- Run this in your Supabase SQL Editor

-- Method 1: Update bucket to be public (simplest solution)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'uploads';

-- Method 2: If you prefer to keep the bucket private but allow public reads
-- Use the policies from fix-supabase-policies.sql instead
