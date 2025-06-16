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

async function testCurrentSecurity() {
  console.log('🔍 Testing current security status after making bucket private...\n');

  try {
    // Check bucket configuration
    const { data: buckets } = await supabase.storage.listBuckets();
    const uploadsBucket = buckets.find(b => b.name === 'uploads');
    
    console.log('Current bucket status:');
    console.log('- Name:', uploadsBucket.name);
    console.log('- Public:', uploadsBucket.public);
    console.log('- File size limit:', uploadsBucket.file_size_limit);
    console.log('- Allowed MIME types:', uploadsBucket.allowed_mime_types);

    // Test uploading an image (should work since we're using service key)
    console.log('\n📤 Testing image upload with service key...');
    
    // Create a simple 1x1 PNG
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const pngBuffer = Buffer.from(pngBase64, 'base64');
    
    const testFileName = `security-test-${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(`profile-images/${testFileName}`, pngBuffer, {
        contentType: 'image/png'
      });
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
    } else {
      console.log('✅ Upload successful:', uploadData.path);
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(`profile-images/${testFileName}`);
      
      console.log('📍 Generated public URL:', publicUrlData.publicUrl);
      
      // Test public access
      console.log('\n🌐 Testing public access to uploaded file...');
      try {
        const response = await fetch(publicUrlData.publicUrl);
        console.log('Response status:', response.status);
        console.log('Response status text:', response.statusText);
        
        if (response.ok) {
          console.log('✅ File is accessible (policies working correctly)');
        } else {
          console.log('❌ File is NOT accessible - RLS policies may be blocking access');
          const errorText = await response.text();
          console.log('Error response:', errorText);
        }
      } catch (fetchError) {
        console.log('❌ Network error accessing file:', fetchError.message);
      }
      
      // Clean up
      await supabase.storage.from('uploads').remove([`profile-images/${testFileName}`]);
      console.log('🧹 Test file cleaned up');
    }

    console.log('\n' + '='.repeat(80));
    console.log('🔒 SECURITY STATUS SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Bucket is now PRIVATE: ${!uploadsBucket.public}`);
    console.log('⚠️  RLS Policies need to be set up manually in Supabase dashboard');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the contents of "setup-rls-policies.sql"');
    console.log('5. Run the SQL commands');
    console.log('6. Verify your app still works correctly');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testCurrentSecurity();
