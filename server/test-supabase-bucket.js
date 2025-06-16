import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

console.log('Testing Supabase configuration...');
console.log('Supabase URL:', supabaseUrl);
console.log('Bucket name:', bucketName);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBucket() {
  try {
    console.log('\n1. Testing Supabase connection...');
    
    // Test basic connection
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error connecting to Supabase:', listError);
      return;
    }
    
    console.log('✅ Connected to Supabase successfully');
    console.log('Available buckets:', buckets.map(b => b.name));
    
    // Check if uploads bucket exists
    const uploadsExists = buckets.find(bucket => bucket.name === bucketName);
    
    if (!uploadsExists) {
      console.log(`\n2. Bucket "${bucketName}" not found. Creating it...`);
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        return;
      }
      
      console.log('✅ Bucket created successfully:', newBucket);
    } else {
      console.log(`✅ Bucket "${bucketName}" already exists`);
    }
    
    // Test upload functionality
    console.log('\n3. Testing file upload...');
    
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'This is a test file to verify upload functionality';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(`profile/${testFileName}`, testContent, {
        contentType: 'text/plain'
      });
    
    if (uploadError) {
      console.error('Error uploading test file:', uploadError);
      return;
    }
    
    console.log('✅ Test file uploaded successfully:', uploadData);
    
    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from(bucketName)
      .getPublicUrl(`profile/${testFileName}`);
    
    console.log('✅ Public URL generated:', publicUrl.publicUrl);
    
    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([`profile/${testFileName}`]);
    
    if (!deleteError) {
      console.log('✅ Test file cleaned up successfully');
    }
    
    console.log('\n🎉 All tests passed! Supabase storage is working correctly.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testBucket();
