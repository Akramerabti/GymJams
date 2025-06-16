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

async function setupStoragePolicies() {
  console.log('Setting up Supabase Storage policies...');

  try {
    // First, let's check the current bucket configuration
    console.log('1. Checking bucket configuration...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const uploadsBucket = buckets.find(b => b.name === 'uploads');
    console.log('Uploads bucket config:', uploadsBucket);
    
    // Update bucket to be public
    console.log('2. Making bucket public...');
    const { data: updateResult, error: updateError } = await supabase.storage.updateBucket('uploads', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });
    
    if (updateError) {
      console.error('Error updating bucket:', updateError);
    } else {
      console.log('✅ Bucket updated to public:', updateResult);
    }

    // Test creating a simple file and accessing it
    console.log('3. Testing public access...');
    
    const testFileName = `test-public-${Date.now()}.txt`;
    const testContent = 'This is a test file for public access';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(`profile/${testFileName}`, testContent, {
        contentType: 'text/plain'
      });
    
    if (uploadError) {
      console.error('Error uploading test file:', uploadError);
      return;
    }
    
    console.log('✅ Test file uploaded:', uploadData);
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(`profile/${testFileName}`);
    
    console.log('✅ Public URL:', publicUrlData.publicUrl);
    
    // Test if the URL is accessible
    console.log('4. Testing URL accessibility...');
    try {
      const response = await fetch(publicUrlData.publicUrl);
      if (response.ok) {
        const content = await response.text();
        console.log('✅ Public URL is accessible! Content:', content);
      } else {
        console.log('❌ Public URL returned status:', response.status, response.statusText);
        const errorText = await response.text();
        console.log('Error response:', errorText);
      }
    } catch (fetchError) {
      console.error('❌ Error fetching public URL:', fetchError.message);
    }
    
    // Clean up
    console.log('5. Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from('uploads')
      .remove([`profile/${testFileName}`]);
    
    if (!deleteError) {
      console.log('✅ Test file cleaned up');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

setupStoragePolicies();
