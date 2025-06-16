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

async function fixBucketConfiguration() {
  console.log('Fixing Supabase Storage bucket configuration...');

  try {
    // Update bucket to be public with proper settings
    console.log('1. Making bucket fully public...');
    const { data: updateResult, error: updateError } = await supabase.storage.updateBucket('uploads', {
      public: true,
      allowedMimeTypes: null, // Allow all MIME types
      fileSizeLimit: null // Remove size limit (or set to a large value)
    });
    
    if (updateError) {
      console.error('Error updating bucket:', updateError);
      return;
    }
    
    console.log('✅ Bucket updated to public:', updateResult);

    // Verify the bucket configuration
    console.log('2. Verifying bucket configuration...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const uploadsBucket = buckets.find(b => b.name === 'uploads');
    console.log('Updated bucket config:', uploadsBucket);

    // Test with an image file (create a simple 1x1 pixel PNG)
    console.log('3. Testing with image upload...');
    
    // Create a simple 1x1 transparent PNG as base64
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const pngBuffer = Buffer.from(pngBase64, 'base64');
    
    const testFileName = `test-image-${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(`profile/${testFileName}`, pngBuffer, {
        contentType: 'image/png'
      });
    
    if (uploadError) {
      console.error('Error uploading test image:', uploadError);
      return;
    }
    
    console.log('✅ Test image uploaded:', uploadData);
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(`profile/${testFileName}`);
    
    console.log('✅ Public URL:', publicUrlData.publicUrl);
    
    // Test if the URL is accessible
    console.log('4. Testing URL accessibility...');
    try {
      const response = await fetch(publicUrlData.publicUrl);
      console.log('Response status:', response.status, response.statusText);
      
      if (response.ok) {
        console.log('✅ Public URL is accessible!');
        console.log('Content-Type:', response.headers.get('content-type'));
        console.log('Content-Length:', response.headers.get('content-length'));
      } else {
        console.log('❌ Public URL returned error status');
        const errorText = await response.text();
        console.log('Error response:', errorText);
      }
    } catch (fetchError) {
      console.error('❌ Error fetching public URL:', fetchError.message);
    }
    
    // Don't clean up the test file so you can manually test the URL
    console.log('✅ Test file left for manual testing. URL:');
    console.log(publicUrlData.publicUrl);
    console.log('\nTry clicking this URL in your browser to verify it works!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixBucketConfiguration();
