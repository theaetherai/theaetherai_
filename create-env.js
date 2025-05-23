// Script to create a comprehensive .env.example file with all required environment variables
const fs = require('fs');
const path = require('path');

const envContent = `# Database
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_your_clerk_secret_key
CLERK_JWT_LEEWAY=60

# Cloudinary (for video/image storage)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Stripe (for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# AI Services
OPEN_AI_KEY=your_openai_api_key
GROQ_API_KEY=your_groq_api_key  # Optional (will use OpenAI if not provided)

# Application URLs
NEXT_PUBLIC_HOST_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Redis (for queues)
REDIS_URL=redis://localhost:6379
`;

const envExamplePath = path.join(__dirname, '.env.example');
const envLocalPath = path.join(__dirname, '.env.local');

// Create .env.example
fs.writeFileSync(envExamplePath, envContent, 'utf8');
console.log('.env.example file created with all required environment variables');

// Create a minimal .env.local file with just the Clerk JWT leeway
const minimalEnvContent = `# Add JWT leeway to handle clock skew issues (in seconds)
CLERK_JWT_LEEWAY=60
`;

fs.writeFileSync(envLocalPath, minimalEnvContent, 'utf8');
console.log('.env.local file created with Clerk JWT leeway configuration'); 