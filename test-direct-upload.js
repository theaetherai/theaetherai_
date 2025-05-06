// Test direct upload to Cloudinary
require('dotenv').config({ path: '.env.local' });
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testDirectUpload() {
  console.log('\n--- Testing Direct Cloudinary Upload Flow ---\n');
  
  // 1. Generate a signature (like our API does)
  console.log('1. Generating upload signature...');
  
  const timestamp = Math.floor(Date.now() / 1000);
  const public_id = `test_video_${timestamp}`;
  
  const signatureParams = {
    timestamp,
    public_id,
    folder: 'opal_videos',
    upload_preset: 'video_uploads', 
  };
  
  const signature = cloudinary.utils.api_sign_request(
    signatureParams, 
    process.env.CLOUDINARY_API_SECRET
  );
  
  console.log('✅ Generated signature:', signature.substring(0, 10) + '...');
  console.log('   Public ID:', public_id);
  
  // 2. Create a test video file (or use an existing one)
  console.log('\n2. Preparing test video file...');
  const videoPath = path.join(__dirname, 'test-video.mp4');
  
  // Check if test video exists, otherwise show instructions
  if (!fs.existsSync(videoPath)) {
    console.error('❌ Test video file not found at:', videoPath);
    console.log('\nPlease create a test MP4 video file at this location to continue.');
    console.log('You can use any small MP4 file for testing (a few seconds long is fine).');
    return false;
  }
  
  console.log('✅ Found test video file');
  
  // 3. Upload to Cloudinary using the signature
  console.log('\n3. Uploading to Cloudinary using signed upload...');
  
  try {
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id,
          folder: 'opal_videos',
          timestamp,
          signature,
          upload_preset: 'video_uploads',
          resource_type: 'video',
          context: JSON.stringify({
            userId: 'test-user',
            workspaceId: 'test-workspace',
            source: 'test-script',
          }),
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      // Create read stream from file and pipe to upload stream
      fs.createReadStream(videoPath).pipe(uploadStream);
    });
    
    console.log('✅ Upload successful!');
    console.log('   Video URL:', uploadResult.secure_url);
    console.log('   Resource type:', uploadResult.resource_type);
    console.log('   Format:', uploadResult.format);
    console.log('\nThis confirms your Cloudinary setup is working correctly for video uploads.');
    return true;
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    if (error.error && error.error.message) {
      console.error('   Error details:', error.error.message);
    }
    console.log('\nPossible issues:');
    console.log('- Incorrect upload preset name or settings');
    console.log('- Signature generation problem');
    console.log('- Video format not supported');
    console.log('- Account restrictions or limits');
    return false;
  }
}

testDirectUpload().then(success => {
  if (!success) {
    console.log('\n❌ Direct upload test failed. Please check the error messages above.');
  }
}); 