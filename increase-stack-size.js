// Script to increase Node.js stack size for Next.js builds
const fs = require('fs');
const path = require('path');

console.log('🔧 Modifying Next.js configuration to increase stack size...');

// Update package.json build script
function updatePackageJson() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Get current build script
    const currentBuildScript = packageJson.scripts?.build || '';
    
    // Check if already includes stack size increase
    if (currentBuildScript.includes('--stack-size')) {
      console.log('✅ Build script already includes stack size flag');
      return false;
    }
    
    // Add stack size increase to build script
    // Note: We're using node with --stack-size flag which allows bigger call stacks
    packageJson.scripts.build = 'node --stack-size=4000 ./node_modules/.bin/next build';
    
    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json build script to increase stack size');
    return true;
  } catch (err) {
    console.error('❌ Failed to update package.json:', err.message);
    return false;
  }
}

// Create a custom .babelrc with optimizations
function createOptimizedBabelrc() {
  console.log('⚠️ Skipping .babelrc creation to avoid dependency issues');
  console.log('✅ Using Next.js default Babel configuration');
  return false;
}

// Update next.config.js to include optimization settings
function updateNextConfig() {
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  
  if (!fs.existsSync(nextConfigPath)) {
    console.error('❌ next.config.js not found');
    return false;
  }
  
  try {
    let configContent = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Check if config already has optimization settings
    if (configContent.includes('reactStrictMode: false') || 
        configContent.includes('experimental: {') && configContent.includes('esmExternals')) {
      console.log('✅ next.config.js already has optimization settings');
    } else {
      // Try to add the settings in a way that works with the existing file
      if (configContent.includes('const nextConfig = {')) {
        // Standard config format
        configContent = configContent.replace(
          'const nextConfig = {',
          `const nextConfig = {
  // Disable strict mode to reduce recursive renders
  reactStrictMode: false,
  
  // Optimize build process
  swcMinify: false, // Use Terser for more stable minification
  
  experimental: {
    // Better code splitting and reduced bundle size
    optimizeCss: true,
    
    // Optimize module resolution
    esmExternals: 'loose',
    
    // More aggressive tree shaking
    forceSwcTransforms: true,
  },`
        );
      } else if (configContent.includes('module.exports = {')) {
        // Direct exports format
        configContent = configContent.replace(
          'module.exports = {',
          `module.exports = {
  // Disable strict mode to reduce recursive renders
  reactStrictMode: false,
  
  // Optimize build process
  swcMinify: false, // Use Terser for more stable minification
  
  experimental: {
    // Better code splitting and reduced bundle size
    optimizeCss: true,
    
    // Optimize module resolution
    esmExternals: 'loose',
    
    // More aggressive tree shaking
    forceSwcTransforms: true,
  },`
        );
      } else {
        // Fallback: append to the end of the file
        configContent = configContent.replace(
          'module.exports = nextConfig',
          `// Add optimization settings to prevent stack overflow
nextConfig.reactStrictMode = false;
nextConfig.swcMinify = false;
nextConfig.experimental = {
  ...nextConfig.experimental,
  optimizeCss: true,
  esmExternals: 'loose',
  forceSwcTransforms: true,
};

module.exports = nextConfig`
        );
      }
      
      fs.writeFileSync(nextConfigPath, configContent);
      console.log('✅ Updated next.config.js with optimization settings');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Failed to update next.config.js:', err.message);
    return false;
  }
}

// Create Vercel config with appropriate memory limit
function updateVercelConfig() {
  const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
  
  // Check if vercel.json already exists
  if (fs.existsSync(vercelConfigPath)) {
    try {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
      
      // Update function memory - respect Hobby plan limits (1024 MB max)
      vercelConfig.functions = vercelConfig.functions || {};
      vercelConfig.functions["app/**/*.js"] = vercelConfig.functions["app/**/*.js"] || {};
      vercelConfig.functions["app/**/*.js"].memory = 1024; // Hobby plan limit
      vercelConfig.functions["app/**/*.js"].maxDuration = 60;
      
      // Remove build command to use the one from package.json
      if (vercelConfig.buildCommand) {
        delete vercelConfig.buildCommand;
        console.log('✅ Removed buildCommand from vercel.json to use package.json build script');
      }
      
      // Add NODE_OPTIONS environment variable
      vercelConfig.env = vercelConfig.env || {};
      vercelConfig.env.NODE_OPTIONS = "--max-old-space-size=1024";
      
      fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
      console.log('✅ Updated vercel.json with optimized configuration for Hobby plan');
      return true;
    } catch (err) {
      console.error('❌ Failed to update vercel.json:', err.message);
      return false;
    }
  } else {
    // Create new vercel.json
    const vercelConfig = {
      "functions": {
        "app/**/*.js": {
          "memory": 1024, // Hobby plan limit
          "maxDuration": 60
        }
      },
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=1024"
      }
    };
    
    try {
      fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
      console.log('✅ Created vercel.json with memory configuration for Hobby plan');
      return true;
    } catch (err) {
      console.error('❌ Failed to create vercel.json:', err.message);
      return false;
    }
  }
}

// Main execution
try {
  console.log('🚀 Starting Next.js stack size optimization...');
  
  const packageJsonUpdated = updatePackageJson();
  const babelrcUpdated = createOptimizedBabelrc();
  const nextConfigUpdated = updateNextConfig();
  const vercelConfigUpdated = updateVercelConfig();
  
  console.log('\n📊 SUMMARY:');
  console.log('====================');
  
  if (packageJsonUpdated || babelrcUpdated || nextConfigUpdated || vercelConfigUpdated) {
    console.log('✅ Successfully applied stack size and performance optimizations!');
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Commit these changes to your repository');
    console.log('2. Redeploy to Vercel to apply the new settings');
    console.log('3. For a more permanent solution, consider running the fix-recursive script');
  } else {
    console.log('ℹ️ No changes were needed or could be applied');
    console.log('Consider running the find-circular and fix-recursive scripts instead');
  }
  
} catch (err) {
  console.error('❌ Error during optimization:', err);
} 