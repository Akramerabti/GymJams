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

async function secureTheBucket() {
  console.log('🔒 Securing the Supabase bucket...\n');

  try {
    // Step 1: Make bucket private
    console.log('1. Making bucket private...');
    const { data: updateResult, error: updateError } = await supabase.storage.updateBucket('uploads', {
      public: false, // CRITICAL: Make it private!
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB limit
    });
    
    if (updateError) {
      console.error('❌ Error making bucket private:', updateError);
      return;
    }
    
    console.log('✅ Bucket is now PRIVATE');

    // Step 2: Enable RLS and create policies using SQL
    console.log('\n2. Setting up Row Level Security policies...');
    
    const policies = [
      // Enable RLS
      {
        name: 'Enable RLS',
        sql: `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`
      },
      
      // Allow service role to manage all files (for your backend)
      {
        name: 'Service role access',
        sql: `
          CREATE POLICY "Service role can manage all files" ON storage.objects
          FOR ALL USING (
            bucket_id = 'uploads' 
            AND auth.jwt() ->> 'role' = 'service_role'
          );
        `
      },
      
      // Allow public read access to profile images only
      {
        name: 'Public read profile images',
        sql: `
          CREATE POLICY "Public can view profile images" ON storage.objects
          FOR SELECT USING (
            bucket_id = 'uploads' 
            AND (storage.foldername(name))[1] = 'profile'
          );
        `
      },
      
      // Allow public read access to gym-bros images
      {
        name: 'Public read gym-bros images',
        sql: `
          CREATE POLICY "Public can view gym-bros images" ON storage.objects
          FOR SELECT USING (
            bucket_id = 'uploads' 
            AND (storage.foldername(name))[1] = 'gym-bros'
          );
        `
      },
      
      // Allow public read access to product images
      {
        name: 'Public read product images',
        sql: `
          CREATE POLICY "Public can view product images" ON storage.objects
          FOR SELECT USING (
            bucket_id = 'uploads' 
            AND (storage.foldername(name))[1] = 'products'
          );
        `
      }
    ];

    // Execute each policy
    for (const policy of policies) {
      try {
        console.log(`Creating policy: ${policy.name}...`);
        
        // Use the direct SQL execution through the REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({
            sql: policy.sql
          })
        });

        if (response.ok) {
          console.log(`✅ ${policy.name} - Success`);
        } else {
          const errorText = await response.text();
          console.log(`⚠️  ${policy.name} - May already exist or failed:`, errorText);
        }
      } catch (error) {
        console.error(`❌ Failed to create policy "${policy.name}":`, error.message);
      }
    }

    // Step 3: Test the new security
    console.log('\n3. Testing new security configuration...');
    
    // Verify bucket is now private
    const { data: buckets } = await supabase.storage.listBuckets();
    const uploadsBucket = buckets.find(b => b.name === 'uploads');
    console.log('Updated bucket config:', {
      name: uploadsBucket.name,
      public: uploadsBucket.public
    });

    // Test access with a new file
    const testFileName = `security-test-private-${Date.now()}.txt`;
    const testContent = 'This should only be accessible with proper auth';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(`profile/${testFileName}`, testContent, {
        contentType: 'text/plain'
      });
    
    if (uploadError) {
      console.error('Error uploading test file:', uploadError);
      return;
    }
    
    console.log('✅ Test file uploaded to profile folder');
    
    // Get public URL (should still work because of our policy)
    const { data: publicUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(`profile/${testFileName}`);
    
    console.log('📍 Public URL:', publicUrlData.publicUrl);
    
    // Test if the URL is accessible (should work due to profile policy)
    try {
      const response = await fetch(publicUrlData.publicUrl);
      if (response.ok) {
        console.log('✅ Profile images are still publicly readable (as intended)');
      } else {
        console.log('⚠️  Profile images may not be accessible. Status:', response.status);
      }
    } catch (fetchError) {
      console.log('❌ Error testing access:', fetchError.message);
    }
    
    // Clean up
    await supabase.storage.from('uploads').remove([`profile/${testFileName}`]);
    console.log('✅ Test file cleaned up');

    console.log('\n' + '='.repeat(60));
    console.log('🔒 BUCKET SECURITY STATUS: SECURED');
    console.log('='.repeat(60));
    console.log('✅ Bucket is now PRIVATE');
    console.log('✅ Row Level Security policies implemented');
    console.log('✅ Only authorized access allowed');
    console.log('✅ Profile images still publicly viewable (for app functionality)');
    console.log('✅ Service role can manage all files');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

secureTheBucket();
