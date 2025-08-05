import path from 'path';
import { fileURLToPath } from 'url';
import { uploadVideoToCloudinary, uploadToCloudinary } from './src/utils/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to upload to Cloudinary
const filesToUpload = [
  {
    localPath: path.join(__dirname, '../client/public/coaching_preview.mp4'),
    publicId: 'coaching_preview',
    type: 'video'
  },
  {
    localPath: path.join(__dirname, '../client/public/GymTonic.mp4'),
    publicId: 'gymtonic',
    type: 'video'
  },
  // Add more files as needed
];

async function uploadFiles() {
  console.log('🚀 Starting file upload to Cloudinary...\n');

  for (const file of filesToUpload) {
    try {
      console.log(`📤 Uploading ${file.publicId}...`);
      
      let result;
      if (file.type === 'video') {
        result = await uploadVideoToCloudinary(file.localPath, {
          public_id: file.publicId
        });
      } else {
        result = await uploadToCloudinary(file.localPath, {
          public_id: file.publicId
        });
      }

      console.log(`✅ Successfully uploaded ${file.publicId}`);
      console.log(`   📍 URL: ${result.secure_url}`);
      console.log(`   📊 Size: ${(result.bytes / 1024 / 1024).toFixed(2)} MB\n`);
      
    } catch (error) {
      console.error(`❌ Failed to upload ${file.publicId}:`, error.message);
      console.error('Full error:', error);
    }
  }

  console.log('🎉 Upload process completed!');
}

// Run the upload script
uploadFiles().catch(console.error);
