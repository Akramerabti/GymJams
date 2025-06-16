import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkBucketSecurity() {
  console.log('🔍 Checking current bucket security status...\n');

  try {
    // Check bucket configuration
    console.log('1. Checking bucket configuration...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const uploadsBucket = buckets.find(b => b.name === 'uploads');
    console.log('Uploads bucket config:', {
      name: uploadsBucket.name,
      public: uploadsBucket.public,
      file_size_limit: uploadsBucket.file_size_limit,
      allowed_mime_types: uploadsBucket.allowed_mime_types
    });

    // Check if RLS is enabled
    console.log('\n2. Checking Row Level Security policies...');
    
    // Try to query policies (this will show us what policies exist)
    try {
      const { data: policies, error: policyError } = await supabase
        .from('information_schema.table_privileges')
        .select('*')
        .eq('table_name', 'objects')
        .eq('table_schema', 'storage');
      
      if (policyError) {
        console.log('Could not query policies directly');
      }
    } catch (e) {
      console.log('Policy query not available');
    }

    console.log('\n3. Testing public access...');
    
    // Create a test file to see if it's publicly accessible
    const testFileName = `security-test-${Date.now()}.txt`;
    const testContent = 'This is a security test file';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(`test/${testFileName}`, testContent, {
        contentType: 'text/plain'
      });
    
    if (uploadError) {
      console.error('Error uploading test file:', uploadError);
      return;
    }
    
    console.log('✅ Test file uploaded:', uploadData.path);
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(`test/${testFileName}`);
    
    console.log('📍 Public URL:', publicUrlData.publicUrl);
    
    // Test if the URL is accessible without authentication
    console.log('\n4. Testing public accessibility...');
    try {
      const response = await fetch(publicUrlData.publicUrl);
      if (response.ok) {
        const content = await response.text();
        console.log('⚠️  SECURITY RISK: File is publicly accessible without authentication!');
        console.log('Content retrieved:', content);
        console.log('🚨 This means ANYONE can access files in this bucket!');
      } else {
        console.log('✅ File is NOT publicly accessible (good!)');
        console.log('Response status:', response.status);
      }
    } catch (fetchError) {
      console.log('✅ File is NOT publicly accessible (good!)');
      console.log('Fetch error:', fetchError.message);
    }
    
    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from('uploads')
      .remove([`test/${testFileName}`]);
    
    if (!deleteError) {
      console.log('\n✅ Test file cleaned up');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔒 SECURITY RECOMMENDATION:');
    console.log('='.repeat(60));
    console.log('1. Make bucket PRIVATE (not public)');
    console.log('2. Implement Row Level Security (RLS) policies');
    console.log('3. Use signed URLs for controlled access');
    console.log('4. Implement proper authentication checks');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkBucketSecurity();
