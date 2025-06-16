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

async function checkRLSStatus() {
  console.log('🔍 Checking Row Level Security status...\n');

  try {
    // Try to check if RLS is enabled by attempting to query policies
    console.log('Attempting to check current policies...');
    
    // This should work even without owner permissions
    const { data, error } = await supabase
      .rpc('sql', {
        query: `
          SELECT policyname, cmd, permissive, roles
          FROM pg_policies 
          WHERE tablename = 'objects' 
          AND schemaname = 'storage';
        `
      });

    if (error) {
      console.log('Could not query policies via RPC:', error.message);
      
      // Try alternative approach
      console.log('\nTrying to check table info...');
      const { data: tableInfo, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_name', 'objects')
        .eq('table_schema', 'storage');
      
      if (tableError) {
        console.log('Cannot access table information');
      } else {
        console.log('Found storage.objects table');
      }
    } else {
      console.log('Current policies:', data);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎯 RECOMMENDED APPROACH');
    console.log('='.repeat(60));
    console.log('Since you cannot modify the table via API, please:');
    console.log('');
    console.log('1. 🌐 Go to https://supabase.com/dashboard');
    console.log('2. 📂 Navigate to Storage → Policies');
    console.log('3. 🔒 Enable RLS if not already enabled');
    console.log('4. ➕ Add the policies from "simple-policies.sql"');
    console.log('5. ✅ Test your application');
    console.log('');
    console.log('OR use the SQL Editor approach:');
    console.log('1. 📝 Go to SQL Editor in dashboard');
    console.log('2. 📋 Copy policies from "simple-policies.sql"');
    console.log('3. ▶️  Run them one by one');

  } catch (error) {
    console.error('Error checking RLS status:', error);
  }
}

checkRLSStatus();
