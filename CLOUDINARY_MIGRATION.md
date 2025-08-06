# Cloudinary Migration Guide for GymJams

## Overview
This guide will help you migrate from local file storage to Cloudinary, solving the GitHub file size issues and improving performance.

## 🎯 Benefits
- ✅ Solves GitHub's 50MB file limit issue
- ✅ Automatic image/video optimization
- ✅ Global CDN delivery for faster loading
- ✅ Responsive image delivery
- ✅ Reduced repository size
- ✅ Better deployment performance

## 🛠️ Setup Instructions

### 1. Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com) and sign up
2. Get your credentials from the dashboard:
   - Cloud Name
   - API Key  
   - API Secret

### 2. Update Environment Variables

**Client (.env)**:
```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Server (.env)**:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### 3. Upload Existing Files
Run the upload script to move your large files to Cloudinary:

```bash
cd server
node upload-to-cloudinary.js
```

### 4. Remove Large Files from Git
After confirming uploads work:

```bash
# Remove large files from Git history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch client/public/coaching_preview.mp4' \
  --prune-empty --tag-name-filter cat -- --all

# Push the cleaned repository
git push origin --force --all
```

### 5. Update .gitignore
Add to your `.gitignore`:
```
# Large media files (now using Cloudinary)
*.mp4
*.mov
*.avi
*.mkv
# But keep small images if needed
```

## 🔧 Code Changes Made

### New Files Created:
- `client/src/utils/cloudinary.js` - Client-side Cloudinary utilities
- `server/src/utils/cloudinary.js` - Server-side Cloudinary utilities  
- `server/upload-to-cloudinary.js` - Script to upload existing files

### Files Modified:
- `client/src/components/home-sections/CoachingSection.jsx` - Updated video sources
- `client/src/pages/CoachingHome.jsx` - Updated video URL generation
- `client/.env` - Added Cloudinary configuration
- `server/.env` - Added Cloudinary configuration

## 🚀 Usage Examples

### Client-side Image Optimization:
```javascript
import { getCloudinaryImageUrl } from '../utils/cloudinary';

// Get optimized image
const imageUrl = getCloudinaryImageUrl('my-image', {
  width: 800,
  height: 600,
  quality: 'auto'
});
```

### Client-side Video Optimization:
```javascript
import { getCloudinaryVideoUrl } from '../utils/cloudinary';

// Get optimized video
const videoUrl = getCloudinaryVideoUrl('my-video', {
  quality: 'auto:good',
  format: 'auto'
});
```

### Server-side Upload:
```javascript
import { uploadToCloudinary } from '../utils/cloudinary.js';

// Upload file
const result = await uploadToCloudinary(filePath, {
  folder: 'gymjams',
  public_id: 'my-file'
});
```

## 🎬 Video Transformations Available

### Quality Options:
- `auto:best` - Highest quality
- `auto:good` - Good quality (recommended)
- `auto:eco` - Lowest file size
- `auto:low` - Low quality for previews

### Format Options:
- `auto` - Best format for browser
- `mp4` - Standard MP4
- `webm` - Modern web format

### Resize Options:
```javascript
{
  width: 1280,
  height: 720,
  crop: 'fill' // or 'fit', 'scale', etc.
}
```

## 🔍 Testing

### 1. Local Testing:
```bash
# Start client
cd client && npm run dev

# Start server  
cd server && npm run dev
```

### 2. Check Browser Network Tab:
- Videos should load from `res.cloudinary.com`
- File sizes should be smaller
- Loading should be faster

### 3. Test Different Devices:
- Mobile phones
- Tablets  
- Desktop browsers

## 🚨 Important Notes

1. **Environment Variables**: Never commit real API keys to Git
2. **Folder Organization**: Use consistent folder names in Cloudinary
3. **Public IDs**: Use descriptive, URL-friendly names
4. **Backup**: Keep a backup of original files before deletion
5. **Gradual Migration**: Test with a few files first

## 🐛 Troubleshooting

### Video Not Loading:
- Check Cloudinary credentials
- Verify public ID exists
- Check browser console for errors

### Large Upload Errors:
- Check file size limits in Cloudinary plan
- Verify API credentials
- Check network connectivity

### Performance Issues:
- Use appropriate quality settings
- Enable eager transformations for frequently used files
- Consider lazy loading for images

## 📊 Monitoring

Check your Cloudinary dashboard for:
- Bandwidth usage
- Storage usage  
- Transformation usage
- API call limits

## 🔄 Future Enhancements

Consider implementing:
- Automatic image resizing based on device
- Progressive image loading
- Video streaming with adaptive bitrate
- Image SEO optimization
- Automatic format selection (WebP, AVIF)

---

For more information, visit the [Cloudinary Documentation](https://cloudinary.com/documentation).
