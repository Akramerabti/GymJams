import { supabaseAdmin } from './src/config/supabase.js';

async function createBucket() {
  try {
    console.log('🔍 Checking existing buckets...');
    
    // List existing buckets
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }
    
    console.log('📦 Existing buckets:', buckets.map(b => b.name));
    
    // Check if uploads bucket exists
    const uploadsExists = buckets.find(b => b.name === 'uploads');
    
    if (uploadsExists) {
      console.log('✅ uploads bucket already exists!');
      
      // Make sure it's public
      const { data, error: updateError } = await supabaseAdmin.storage.updateBucket('uploads', {
        public: true
      });
      
      if (updateError) {
        console.error('❌ Error making bucket public:', updateError);
      } else {
        console.log('✅ uploads bucket is now public');
      }
      
      return;
    }
    
    // Create the uploads bucket
    console.log('🚀 Creating uploads bucket...');
    
    const { data, error } = await supabaseAdmin.storage.createBucket('uploads', {
      public: true,
      allowedMimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      fileSizeLimit: 5242880 // 5MB
    });
    
    if (error) {
      console.error('❌ Error creating bucket:', error);
    } else {
      console.log('✅ uploads bucket created successfully!');
      console.log('📊 Bucket data:', data);
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

createBucket();
