import path from 'path';
impo      if (file.type === 'video') {
        result = await uploadVideoToCloudinary(file.localPath, {
          public_id: file.publicId
        });
      } else {
        result = await uploadToCloudinary(file.localPath, {
          public_id: file.publicId
        });
      }LToPath } from 'url';
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
    localPath: path.join(__dirname, '../client/public/coaching_thumbnail.png'),
    publicId: 'coaching_thumbnail',
    type: 'image'
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
          public_id: file.publicId,
          folder: 'gymtonic'
        });
      } else {
        result = await uploadToCloudinary(file.localPath, {
          public_id: file.publicId,
          folder: 'gymtonic'
        });
      }

      console.log(`✅ Successfully uploaded ${file.publicId}`);
      console.log(`   📍 URL: ${result.secure_url}`);
      console.log(`   📊 Size: ${(result.bytes / 1024 / 1024).toFixed(2)} MB\n`);
      
    } catch (error) {
      console.error(`❌ Failed to upload ${file.publicId}:`, error.message);
    }
  }

  console.log('🎉 Upload process completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Update your .env files with your Cloudinary credentials');
  console.log('2. Remove large files from Git repository');
  console.log('3. Test the application with Cloudinary URLs');
}

// Run the upload script
uploadFiles().catch(console.error);