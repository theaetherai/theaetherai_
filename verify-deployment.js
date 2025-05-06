// Deployment verification script to check required environment and services
const { execSync } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

console.log("\n🔍 AETHEMUS DEPLOYMENT VERIFICATION\n");

// Load environment variables from .env file if it exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log("✅ Found .env file");
} else {
  console.log("⚠️  No .env file found. Will check for environment variables directly.");
}

// Required environment variables
const requiredVars = [
  { name: 'DATABASE_URL', message: 'Required for database connectivity' },
  { name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', message: 'Required for authentication' },
  { name: 'CLERK_SECRET_KEY', message: 'Required for authentication' },
  { name: 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', message: 'Required for media uploads' },
  { name: 'CLOUDINARY_API_SECRET', message: 'Required for media uploads' },
];

// Nice-to-have environment variables
const optionalVars = [
  { name: 'OPEN_AI_KEY', message: 'Required for AI tutor functionality' },
  { name: 'GROQ_API_KEY', message: 'Optional, enhances AI tutor performance' },
  { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', message: 'Required for payment processing' },
  { name: 'STRIPE_SECRET_KEY', message: 'Required for payment processing' },
  { name: 'REDIS_URL', message: 'Required for queue processing' },
];

let missingRequired = 0;
let missingOptional = 0;

console.log("\n🔑 Checking environment variables...");

// Check required vars
requiredVars.forEach(variable => {
  if (!process.env[variable.name]) {
    console.log(`❌ Missing required: ${variable.name} - ${variable.message}`);
    missingRequired++;
  } else {
    console.log(`✅ Found: ${variable.name}`);
  }
});

console.log("\n⚙️  Checking optional variables...");

// Check optional vars
optionalVars.forEach(variable => {
  if (!process.env[variable.name]) {
    console.log(`⚠️  Missing optional: ${variable.name} - ${variable.message}`);
    missingOptional++;
  } else {
    console.log(`✅ Found: ${variable.name}`);
  }
});

// Check if database is accessible
console.log("\n🔌 Checking database connectivity...");
try {
  if (process.env.DATABASE_URL) {
    console.log("Attempting to connect to database...");
    try {
      execSync('npx prisma db pull', { stdio: 'inherit' });
      console.log("✅ Database connection successful");
    } catch (error) {
      console.log("❌ Database connection failed. Check your DATABASE_URL.");
    }
  } else {
    console.log("❌ Cannot check database connection without DATABASE_URL");
  }
} catch (error) {
  console.log("❌ Error checking database:", error.message);
}

// Verify Clerk configuration
console.log("\n🔒 Checking Clerk authentication...");
if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) {
  console.log("✅ Clerk API keys found");
  
  // Check for JWT leeway setting
  if (process.env.CLERK_JWT_LEEWAY) {
    console.log("✅ CLERK_JWT_LEEWAY is set to:", process.env.CLERK_JWT_LEEWAY);
  } else {
    console.log("⚠️  CLERK_JWT_LEEWAY is not set. Recommended value is 60.");
  }
} else {
  console.log("❌ Clerk API keys incomplete or missing");
}

// Check for build optimization settings
console.log("\n🧰 Checking build optimization settings...");
const pkgPath = path.join(__dirname, 'package.json');
try {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (pkg.scripts.build && pkg.scripts.build.includes('--legacy-peer-deps')) {
    console.log("✅ Build script includes --legacy-peer-deps flag");
  } else {
    console.log("⚠️  Build script doesn't include --legacy-peer-deps which may cause dependency issues");
  }
  
  // Check for npmrc
  if (fs.existsSync(path.join(__dirname, '.npmrc'))) {
    console.log("✅ .npmrc file found");
    const npmrcContent = fs.readFileSync(path.join(__dirname, '.npmrc'), 'utf8');
    if (npmrcContent.includes('legacy-peer-deps=true')) {
      console.log("✅ .npmrc has legacy-peer-deps configuration");
    } else {
      console.log("⚠️  .npmrc doesn't contain legacy-peer-deps=true");
    }
  } else {
    console.log("⚠️  No .npmrc file found. Recommended to create one with legacy-peer-deps=true");
  }
} catch (error) {
  console.log("❌ Error checking package.json:", error.message);
}

// Summary
console.log("\n📊 VERIFICATION SUMMARY");
console.log("====================");
console.log(`Required variables: ${requiredVars.length - missingRequired}/${requiredVars.length} present`);
console.log(`Optional variables: ${optionalVars.length - missingOptional}/${optionalVars.length} present`);

if (missingRequired > 0) {
  console.log("\n❌ DEPLOYMENT MAY FAIL - Missing required environment variables");
} else {
  console.log("\n✅ BASIC REQUIREMENTS MET - Project should be deployable");
}

console.log("\nFor detailed deployment instructions, see the README.md"); 