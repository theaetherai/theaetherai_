# Fixing "Maximum call stack size exceeded" Error in Next.js Deployments

This document provides solutions for the "Maximum call stack size exceeded" errors during Next.js builds and deployments.

## Root Causes

This error typically occurs due to:

1. **Circular Dependencies**: Components or modules importing each other in a circular manner
2. **Recursive Component Rendering**: Components rendering themselves infinitely without termination conditions
3. **Stack Size Limitations**: Default Node.js stack size may be too small for complex component trees
4. **Infinite React Reconciliation**: Component state updates causing infinite re-renders

## Available Tools in This Repository

We've created several tools to help diagnose and fix stack size issues:

1. **find-circular-deps.js**: Identifies circular dependencies in your codebase
   ```
   npm run find-circular
   ```

2. **fix-recursive-imports.js**: Fixes common patterns that cause recursive rendering
   ```
   npm run fix-recursive
   ```

3. **increase-stack-size.js**: Applies configuration changes to increase stack size
   ```
   npm run increase-stack
   ```

4. **verify-deployment.js**: Checks overall project configuration for deployment readiness
   ```
   npm run verify
   ```

## Step-by-Step Solution

### 1. Apply Stack Size Increase (Quick Fix)

Run the following command to apply immediate fixes:

```
npm run increase-stack
```

This will:
- Update build script to use increased stack size
- Update next.config.js with performance settings
- Update vercel.json with optimized memory limits

### 2. Find and Fix Circular Dependencies

Run the circular dependency finder:

```
npm run find-circular
```

This tool will analyze your codebase and identify any circular import patterns. When found, refactor these dependencies:

- Extract shared logic to a separate utility file
- Use dynamic imports with `React.lazy()`
- Refactor component hierarchy to avoid circular relationships

### 3. Fix Recursive Component Patterns

Identify and fix components with recursive rendering issues:

```
npm run fix-recursive
```

This tool automatically fixes common patterns that cause stack size issues:
- Add termination conditions to recursive components
- Move state updates to useEffect hooks to prevent render loops
- Fix nested component definitions with same names
- Remove self-importing components

### 4. Manual Fixes for Complex Cases

If automated tools don't resolve the issue, consider these manual approaches:

1. **React.memo for Component Memoization**:
   ```jsx
   const MyComponent = React.memo(function MyComponent(props) {
     // Component implementation
   });
   ```

2. **Use Dynamic Imports**:
   ```jsx
   const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
   
   function MyApp() {
     return (
       <React.Suspense fallback={<div>Loading...</div>}>
         <HeavyComponent />
       </React.Suspense>
     );
   }
   ```

3. **Refactor Deeply Nested Components**:
   - Break large components into smaller focused ones
   - Use composition instead of nesting

### 5. Vercel-Specific Configuration

Our `vercel.json` now includes:

```json
{
  "functions": {
    "app/**/*.js": {
      "memory": 1024,
      "maxDuration": 60
    }
  },
  "buildCommand": "node --stack-size=4000 ./node_modules/.bin/next build",
  "env": {
    "NODE_OPTIONS": "--max-old-space-size=1024"
  }
}
```

This configuration:
- Uses maximum allowed memory (1024 MB) for Hobby plan serverless functions
- Uses a custom build command with increased stack size
- Adds environment variables to optimize Node.js memory usage

> **Note:** Vercel Hobby plans are limited to 1024 MB memory for serverless functions. If you need more memory for complex applications, consider upgrading to a Pro plan by creating a team.

### 6. Troubleshooting Build Errors

If you encounter build errors after applying these fixes, try these troubleshooting steps:

1. **Dependency Issues**: 
   - Remove any custom .babelrc or .babel configuration that might require additional dependencies
   - Let Next.js handle the default Babel configuration

2. **Webpack Errors**:
   - Simplify your webpack configuration if custom changes are causing conflicts
   - Remove any plugins that may not be compatible with the latest Next.js version

3. **Module Resolution Errors**:
   - Check for typos in import paths
   - Make sure all required dependencies are properly installed

### 7. Fixing API Route Recursion Issues

When you see errors specifically mentioning a particular API route like:

```
Error: Failed to collect page data for /api/videos/[id]/status
```

This typically means that specific route has a recursion or circular dependency issue:

1. **Simplify API Response Structure**:
   - Keep queries minimal, selecting only essential fields
   - Avoid nested relationships unless absolutely necessary
   - Example:
     ```js
     // AVOID:
     const data = await prisma.model.findUnique({
       where: { id },
       include: { 
         relatedModel: { include: { otherModel: true } } 
       }
     });
     
     // BETTER:
     const data = await prisma.model.findUnique({
       where: { id },
       select: {
         id: true,
         name: true,
         // Only select specific fields from related models
         relatedModel: { select: { id: true, name: true } }
       }
     });
     ```

2. **Break Circular Dependencies**:
   - Analyze where API routes might be calling each other
   - If route A imports a utility that imports route B that imports route A, break the chain
   - Move shared functionality to a separate utility module

3. **Reduce Object Complexity**:
   - Large nested objects can cause stack overflows during serialization
   - Break down complex objects into simpler structures before returning

### 8. Case Study: Fixing /api/videos/completed Route

We encountered and fixed a "Maximum call stack size exceeded" error in the `/api/videos/completed` route:

1. **Problem Identification**:
   - The route was importing the `processVideo` function from a shared library
   - This created a circular dependency chain where the library was importing other modules that ultimately imported the route

2. **Solution Approach**:
   - Changed direct function import to a separate API call using `fetch()`
   - Created a new `/api/videos/[id]/process` endpoint that handles video processing
   - Used direct PrismaClient instances instead of shared client imports
   - Simplified database queries to avoid nested connections and use direct ID assignments
   - Made sure to properly disconnect Prisma clients to prevent connection leaks

3. **Implementation Details**:
   ```js
   // BEFORE - problematic direct import
   import { processVideo } from '../../../../lib/video-processing';
   
   // Process video
   processVideo(video.id, url, userId);
   
   // AFTER - API-based approach
   async function triggerVideoProcessing(videoId, url, userId) {
     const response = await fetch(`/api/videos/${videoId}/process`, {
       method: 'POST',
       body: JSON.stringify({ url, userId }),
     });
   }
   
   // Trigger processing
   triggerVideoProcessing(video.id, url, userId);
   ```

4. **Additional Improvements**:
   - Replaced nested object relationships with direct ID assignments:
   ```js
   // BEFORE - using nested connections
   videoData.User = {
     connect: { id: userId }
   };
   
   // AFTER - direct assignment
   videoData.userId = userId;
   ```
   - Ensured database connections are properly closed with try/finally blocks
   - Implemented proper error handling without circular dependencies

This pattern of replacing direct imports with API calls can be applied to other routes experiencing similar stack size issues.

### 9. Addressing Stack Size Errors in API Route Handlers

We encountered a second stack size error in our newly created `/api/videos/[id]/process` route. This highlights an important lesson: **even when fixing one circular dependency, we may inadvertently create another**.

The solution involved:

1. **Extreme Minimalism**: Strip API routes down to their absolute essentials
   - Remove all unnecessary imports
   - Remove all heavy processing logic from the API route itself
   - Use only the most basic database operations

2. **Breaking Synchronous Execution Chains**: 
   - Move processing to asynchronous background tasks
   - Use techniques like setTimeout or fetch() to background processes
   - Replace direct function calls with message-passing patterns

3. **Simplified Implementation Example**:
   ```js
   // BEFORE - Heavy processing in API route
   export async function POST(request, { params }) {
     // Direct imports of heavy processing libraries
     // Complex video processing logic inside the API route
     // Many nested dependencies creating potential circular issues
   }
   
   // AFTER - Minimal API route with background processing
   export async function POST(request, { params }) {
     // Update status in database
     await prisma.video.update({
       where: { id: params.id },
       data: { processing: true }
     });
     
     // Trigger processing via message or API call
     // Do not await the processing
     fetch(`/api/videos/${params.id}/status`, {
       method: 'POST',
       body: JSON.stringify({ action: 'start-processing' })
     }).catch(err => console.error(err));
     
     return NextResponse.json({ status: 'Processing initiated' });
   }
   ```

This approach completely decouples the API route handler from the actual processing logic, breaking any circular dependencies that might occur during Vercel's build process.

### 10. Using Dynamic Imports for Background Processing

For video processing and other heavy computational tasks, we implemented a pattern using dynamic imports that helps prevent build-time circular dependencies:

1. **Move Processing Logic to a Separate Worker Module**:
   - Create a dedicated worker file (e.g., `src/lib/video-worker.ts`)
   - Implement all heavy processing logic in this file
   - Ensure this module doesn't import from API routes

2. **Use Dynamic Imports in API Routes**:
   ```js
   // Static imports would create circular dependencies at build time
   // import { processVideo } from '../../../../lib/video-processing';
   
   // Instead, use dynamic imports at runtime
   import('../../../../../lib/video-worker').then(({ processVideoInBackground }) => {
     // Fire and forget - don't await
     processVideoInBackground(videoId, url).catch((err) => {
       console.error(`Background processing error:`, err);
     });
   });
   ```

3. **Benefits of This Pattern**:
   - Circular dependencies are prevented at build time
   - Processing logic remains properly organized in dedicated files
   - Background tasks can run without blocking or erroring API routes
   - The application can be built successfully on Vercel

This approach is especially useful for Node.js serverless functions where you need to do heavy processing but want to avoid circular dependencies and stack size limitations.

## Prevention Strategies

To prevent stack size issues in the future:

1. **Use Component Design Best Practices**:
   - Keep components focused and small
   - Use props for data flow instead of circular dependencies
   - Memoize expensive components and calculations

2. **State Management**:
   - Use appropriate state management for your app scale
   - Be careful with unconditional state updates in render functions

3. **Project Structure**:
   - Organize files to prevent circular dependencies
   - Maintain clear boundaries between feature areas

## References

- [Next.js Performance Optimization](https://nextjs.org/docs/advanced-features/performance)
- [React Profiler for Performance Analysis](https://reactjs.org/docs/profiler.html)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Node.js Command Line Options](https://nodejs.org/api/cli.html#--stack-sizesize) 