# Cloudinary Setup Guide for Opal Video Uploads

This guide will walk you through setting up Cloudinary for the video upload feature.

## 1. Create a Cloudinary Account

If you haven't already, sign up for a free Cloudinary account at [cloudinary.com](https://cloudinary.com/users/register/free).

## 2. Get Your Cloudinary Credentials

1. Log in to your Cloudinary dashboard
2. Look for the "Account Details" section
3. Note down these three values:
   - **Cloud name**
   - **API Key**
   - **API Secret**

## 3. Configure Environment Variables

Add these values to your `.env.local` file in the root of the `opal-webprodigies` directory:

```
# Cloudinary configuration - REQUIRED for video uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

⚠️ **IMPORTANT**: Replace the placeholder values with your actual Cloudinary credentials.

## 4. Create an Upload Preset

The application requires a specific upload preset to work properly:

1. In your Cloudinary dashboard, go to **Settings** > **Upload**
2. Scroll down to **Upload presets** and click **Add upload preset**
3. Configure the preset with these settings:
   - **Name**: `video_uploads` (this exact name is required)
   - **Folder**: `opal_videos`
   - **Signing Mode**: `Signed` (very important!)
   - **Use filename or externally defined Public ID**: Enable this option

## 5. Test Your Configuration

After setting up your environment variables and upload preset, you can test your configuration:

1. Run the application with `npm run dev`
2. Navigate to the video upload page
3. Upload a small test video
4. Check the browser console for any error messages 
5. Verify that the video appears in your Cloudinary dashboard

## Troubleshooting

### Video uploads appear to succeed but aren't visible in Cloudinary

1. Check your browser console for detailed error messages
2. Verify that your environment variables are correctly set
3. Make sure the upload preset is named exactly `video_uploads`
4. Ensure the upload preset is configured for signed uploads
5. Check your Cloudinary account for any upload limits or restrictions

### Invalid signature errors

If you see "Invalid signature" errors, check that:
1. Your API secret is correctly copied to the environment variables
2. The upload preset is set to "Signed" mode
3. The cloud name and API key match your account details

### Network errors during upload

1. Check if your internet connection is stable
2. Try uploading a smaller video (under 10MB) for testing
3. Ensure your Cloudinary account is active and not suspended

## Need Additional Help?

If you continue experiencing issues:
1. Check the detailed logs in the browser console
2. Verify all environment variables are correctly set
3. Make sure the Cloudinary upload preset is correctly configured
4. Try recreating the upload preset with exactly the settings mentioned above 