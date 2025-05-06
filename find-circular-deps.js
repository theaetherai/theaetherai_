// Script to find potential circular dependencies in the codebase
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to analyze
const targetDirs = ['src/components', 'src/app', 'src/lib', 'src/hooks'];
const ignoreDirs = ['node_modules', '.next', '.git'];
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];

console.log('🔍 Searching for potential circular dependencies...');

// Track import relationships
const importMap = new Map();
const filesWithImports = new Set();

// Find all source files
function findFiles(dir) {
  let results = [];
  
  try {
    const list = fs.readdirSync(dir);
    
    for (let file of list) {
      // Skip ignored directories
      if (ignoreDirs.some(ignore => dir.includes(ignore))) continue;
      
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat && stat.isDirectory()) {
        // Recursively search directories
        results = results.concat(findFiles(filePath));
      } else {
        // Only include files with target extensions
        if (fileExtensions.some(ext => file.endsWith(ext))) {
          results.push(filePath);
        }
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err.message);
  }
  
  return results;
}

// Extract imports from a file
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = [];
    
    // Match import statements
    const importRegex = /import\s+(?:(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      // Only track internal imports (not packages)
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) continue;
      
      // Resolve relative import to absolute path
      const importedFilePath = resolveImportPath(filePath, importPath);
      if (importedFilePath) {
        imports.push(importedFilePath);
      }
    }
    
    if (imports.length > 0) {
      importMap.set(filePath, imports);
      filesWithImports.add(filePath);
    }
    
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
}

// Resolve relative import to absolute file path
function resolveImportPath(sourceFile, importPath) {
  const sourceDir = path.dirname(sourceFile);
  let resolvedPath = importPath;
  
  // Handle relative imports
  if (importPath.startsWith('.')) {
    resolvedPath = path.resolve(sourceDir, importPath);
  } else if (importPath.startsWith('/')) {
    // Absolute import from project root
    resolvedPath = path.join(process.cwd(), importPath);
  } else {
    // External package, ignore
    return null;
  }
  
  // Try to resolve the actual file (handling index files and extensions)
  for (const ext of ['', '.js', '.jsx', '.ts', '.tsx']) {
    const candidatePath = resolvedPath + ext;
    if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
      return candidatePath;
    }
    
    // Check for index files
    const indexPath = path.join(resolvedPath, `index${ext}`);
    if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
      return indexPath;
    }
  }
  
  return null;
}

// Find circular dependencies
function findCircularDependencies() {
  const visitedGlobal = new Set();
  const circularPaths = [];
  
  function detectCircular(filePath, visited = new Set(), path = []) {
    // Skip if already globally visited to improve performance
    if (visitedGlobal.has(filePath)) return false;
    
    // Circular dependency detected
    if (visited.has(filePath)) {
      const circleStart = path.indexOf(filePath);
      const circle = [...path.slice(circleStart), filePath];
      circularPaths.push(circle);
      return true;
    }
    
    // No imports, no circular dependency
    const imports = importMap.get(filePath);
    if (!imports || imports.length === 0) return false;
    
    visited.add(filePath);
    path.push(filePath);
    
    let foundCircular = false;
    for (const importedFile of imports) {
      if (detectCircular(importedFile, new Set(visited), [...path])) {
        foundCircular = true;
      }
    }
    
    if (!foundCircular) {
      visitedGlobal.add(filePath);
    }
    
    return foundCircular;
  }
  
  // Check each file for circular dependencies
  for (const filePath of filesWithImports) {
    detectCircular(filePath);
  }
  
  return circularPaths;
}

// Generate relative paths for better readability
function getRelativePath(filePath) {
  return filePath.replace(process.cwd(), '').replace(/\\/g, '/');
}

// Main execution
try {
  console.log('Analyzing target directories...');
  
  // Collect all source files
  let allFiles = [];
  for (const dir of targetDirs) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      const files = findFiles(dirPath);
      allFiles = allFiles.concat(files);
    }
  }
  
  console.log(`Found ${allFiles.length} source files to analyze`);
  
  // Extract imports from each file
  allFiles.forEach(extractImports);
  console.log(`Processed ${importMap.size} files with imports`);
  
  // Find circular dependencies
  const circularPaths = findCircularDependencies();
  
  console.log('\n📊 RESULTS:');
  console.log('====================');
  
  if (circularPaths.length === 0) {
    console.log('✅ No circular dependencies found!');
  } else {
    console.log(`❌ Found ${circularPaths.length} circular dependency chains:`);
    
    // Display circular dependencies
    circularPaths.forEach((circle, index) => {
      console.log(`\n🔄 Circular Dependency #${index + 1}:`);
      circle.forEach((file, i) => {
        const nextFile = i < circle.length - 1 ? circle[i + 1] : circle[0];
        console.log(`   ${getRelativePath(file)} → ${getRelativePath(nextFile)}`);
      });
    });
    
    console.log('\n💡 SUGGESTIONS:');
    console.log('1. For component circular dependencies, move shared logic to a separate utility file');
    console.log('2. Use React Context or state management libraries to avoid prop drilling');
    console.log('3. Replace direct imports with dynamic imports where appropriate');
    console.log('4. Reorganize component hierarchy to avoid circular references');
  }
  
} catch (err) {
  console.error('Error analyzing dependencies:', err);
} 