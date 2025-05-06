// Verify Cloudinary configuration
require('dotenv').config({ path: '.env.local' });
const { v2: cloudinary } = require('cloudinary');

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function verifyCloudinarySetup() {
  console.log('\n--- Cloudinary Configuration Verification ---\n');
  
  // Check if credentials are set
  console.log('Checking Cloudinary credentials:');
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.error('❌ CLOUDINARY_CLOUD_NAME is not set in .env.local');
    return false;
  }
  if (!process.env.CLOUDINARY_API_KEY) {
    console.error('❌ CLOUDINARY_API_KEY is not set in .env.local');
    return false;
  }
  if (!process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ CLOUDINARY_API_SECRET is not set in .env.local');
    return false;
  }
  
  console.log('✅ All required environment variables are set');
  console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY.substring(0, 5)}...`);
  
  // Test API connection
  try {
    console.log('\nTesting Cloudinary API connection...');
    // Using a simpler API call that's definitely available
    const result = await cloudinary.api.ping();
    console.log('✅ Connected to Cloudinary successfully');
  } catch (error) {
    console.error('❌ Failed to connect to Cloudinary API:', error.message);
    console.log('\nDiagnostic info:');
    console.log('- Is cloudinary package installed? Try running "npm install cloudinary"');
    console.log('- Are your credentials correct? Double-check them in the Cloudinary dashboard');
    console.log('- Do you have internet connectivity?');
    return false;
  }
  
  // Check for upload preset
  try {
    console.log('\nChecking for "video_uploads" preset...');
    // Get all upload presets
    const result = await cloudinary.api.upload_presets({ max_results: 500 });
    
    // Check if presets exist and if our preset is among them
    if (!result || !result.presets || !Array.isArray(result.presets)) {
      console.error('❌ Failed to retrieve upload presets. Unexpected API response format.');
      return false;
    }
    
    const foundPreset = result.presets.some(preset => preset.name === 'video_uploads');
    
    if (foundPreset) {
      console.log('✅ "video_uploads" preset exists');
      console.log('\nImportant notes about the preset:');
      console.log('- It should be set to "Signed" mode');
      console.log('- Its folder should be "opal_videos"');
      console.log('- "Use filename or externally defined Public ID" should be enabled');
    } else {
      console.error('❌ "video_uploads" preset does not exist!');
      console.log('\nYou need to create it in the Cloudinary dashboard:');
      console.log('1. Go to Settings > Upload');
      console.log('2. Scroll down to Upload Presets and click "Add upload preset"');
      console.log('3. Name it "video_uploads"');
      console.log('4. Set folder to "opal_videos"');
      console.log('5. Set mode to "Signed"');
      console.log('6. Make sure to enable "Use filename or externally defined Public ID"');
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking upload presets:', error.message);
    console.log('\nThis could be due to:');
    console.log('- The API credentials not having permission to list presets');
    console.log('- Network connectivity issues');
    console.log('- The Cloudinary package not being installed correctly');
    return false;
  }
  
  // Try a small test upload
  try {
    console.log('\nTesting a small upload to Cloudinary...');
    // Create a temporary text file
    const fs = require('fs');
    const testFilePath = './cloudinary-test.txt';
    fs.writeFileSync(testFilePath, 'Cloudinary test file');
    
    // Upload it to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(testFilePath, 
        { 
          folder: 'opal_videos',
          resource_type: 'raw'
        }, 
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });
    
    console.log('✅ Test upload successful!');
    console.log(`   Uploaded to: ${uploadResult.secure_url}`);
    
    // Clean up
    fs.unlinkSync(testFilePath);
  } catch (error) {
    console.error('❌ Test upload failed:', error.message);
    console.log('\nThis suggests your account cannot perform uploads. Possible reasons:');
    console.log('- The API credentials don\'t have upload permission');
    console.log('- Your account has reached its upload limit or is inactive');
    console.log('- Network connectivity issues');
    return false;
  }
  
  console.log('\n✅ Cloudinary configuration looks good!');
  console.log('\nYou should now be able to upload videos using the Opal application.');
  console.log('Remember to create the "video_uploads" preset if you haven\'t already.');
  return true;
}

verifyCloudinarySetup().then(success => {
  if (!success) {
    console.log('\n❌ There are issues with your Cloudinary setup that need to be fixed.');
    console.log('   Please follow the instructions in CLOUDINARY-SETUP.md to resolve them.');
  }
}); 