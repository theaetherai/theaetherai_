// Simple script to create a .env.local file with Clerk JWT leeway configuration
const fs = require('fs');
const path = require('path');

const envContent = `# Add JWT leeway to handle clock skew issues (in seconds)
CLERK_JWT_LEEWAY=60
`;

const envPath = path.join(__dirname, '.env.local');

fs.writeFileSync(envPath, envContent, 'utf8');
console.log('.env.local file created with Clerk JWT leeway configuration'); 