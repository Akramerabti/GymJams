import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStoragePolicies() {
  console.log('Setting up Supabase Storage policies...');

  try {
    // Enable RLS on storage.objects
    console.log('1. Enabling Row Level Security...');
    await supabase.rpc('sql', {
      query: 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;'
    });

    // Drop existing policies if they exist (to avoid conflicts)
    const policiesToDrop = [
      'Users can upload profile images',
      'Users can view their own profile images',
      'Users can update their own profile images',
      'Users can delete their own profile images',
      'Public can view all profile images',
      'Users can upload gym images',
      'Users can upload workout images',
      'Public can view gym and workout images',
      'Service role can manage all files'
    ];

    console.log('2. Dropping existing policies (if any)...');
    for (const policyName of policiesToDrop) {
      try {
        await supabase.rpc('sql', {
          query: `DROP POLICY IF EXISTS "${policyName}" ON storage.objects;`
        });
      } catch (error) {
        // Ignore errors for non-existing policies
      }
    }

    // Create new policies
    const policies = [
      {
        name: 'Users can upload profile images',
        query: `
          CREATE POLICY "Users can upload profile images" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'uploads' 
            AND (storage.foldername(name))[1] = 'profile'
            AND auth.uid()::text = (storage.foldername(name))[2]
          );`
      },
      {
        name: 'Public can view all profile images',
        query: `
          CREATE POLICY "Public can view all profile images" ON storage.objects
          FOR SELECT USING (
            bucket_id = 'uploads' 
            AND (storage.foldername(name))[1] = 'profile'
          );`
      },
      {
        name: 'Users can update their own profile images',
        query: `
          CREATE POLICY "Users can update their own profile images" ON storage.objects
          FOR UPDATE USING (
            bucket_id = 'uploads' 
            AND (storage.foldername(name))[1] = 'profile'
            AND auth.uid()::text = (storage.foldername(name))[2]
          );`
      },
      {
        name: 'Users can delete their own profile images',
        query: `
          CREATE POLICY "Users can delete their own profile images" ON storage.objects
          FOR DELETE USING (
            bucket_id = 'uploads' 
            AND (storage.foldername(name))[1] = 'profile'
            AND auth.uid()::text = (storage.foldername(name))[2]
          );`
      },
      {
        name: 'Service role can manage all files',
        query: `
          CREATE POLICY "Service role can manage all files" ON storage.objects
          FOR ALL USING (
            bucket_id = 'uploads' 
            AND auth.jwt() ->> 'role' = 'service_role'
          );`
      }
    ];

    console.log('3. Creating new policies...');
    for (const policy of policies) {
      try {
        await supabase.rpc('sql', { query: policy.query });
        console.log(`✅ Created policy: ${policy.name}`);
      } catch (error) {
        console.error(`❌ Failed to create policy "${policy.name}":`, error.message);
      }
    }

    console.log('\n🎉 Storage policies setup completed!');
    console.log('\nNext steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Storage > Policies');
    console.log('3. Verify that the policies are created correctly');
    console.log('4. Test file uploads to ensure they work with the new policies');

  } catch (error) {
    console.error('Error setting up policies:', error);
  }
}

setupStoragePolicies();
