const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Path patterns to find "@/" imports
const importRegex = /import\s+(?:.*\s+from\s+)?['"]@\/([^'"]+)['"]/g;
const dynamicImportRegex = /import\(['"]@\/([^'"]+)['"]\)/g;
const requireRegex = /require\(['"]@\/([^'"]+)['"]\)/g;

async function getAllFiles(dir, fileList = []) {
  const files = await readdir(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileStat = await stat(filePath);
    
    if (fileStat.isDirectory()) {
      // Skip node_modules and .next
      if (file === 'node_modules' || file === '.next') continue;
      
      // Recursively scan directories
      fileList = await getAllFiles(filePath, fileList);
    } else if (
      filePath.endsWith('.js') || 
      filePath.endsWith('.ts') || 
      filePath.endsWith('.jsx') || 
      filePath.endsWith('.tsx')
    ) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

function calculateRelativePath(fromFilePath, toModule) {
  const fromDir = path.dirname(fromFilePath);
  const srcIndex = fromFilePath.indexOf('src');
  
  if (srcIndex === -1) {
    return null; // Can't process files outside src
  }
  
  // Get relative path from file to src
  const toSrc = path.relative(fromDir, path.join(fromFilePath.substring(0, srcIndex), 'src'));
  
  // Replace empty path with current directory
  const relativePath = toSrc ? `${toSrc}/${toModule}` : `./${toModule}`;
  
  // Remove trailing .js etc if present (imports usually don't include extensions)
  return relativePath.replace(/\\/g, '/');
}

async function processFile(filePath) {
  try {
    let fileContent = await readFile(filePath, 'utf8');
    let modified = false;
    let newContent = fileContent;
    
    // Process regular imports
    newContent = newContent.replace(importRegex, (match, modulePath) => {
      const relativePath = calculateRelativePath(filePath, modulePath);
      if (!relativePath) return match;
      modified = true;
      return match.replace(`@/${modulePath}`, relativePath);
    });
    
    // Process dynamic imports
    newContent = newContent.replace(dynamicImportRegex, (match, modulePath) => {
      const relativePath = calculateRelativePath(filePath, modulePath);
      if (!relativePath) return match;
      modified = true;
      return match.replace(`@/${modulePath}`, relativePath);
    });
    
    // Process require statements
    newContent = newContent.replace(requireRegex, (match, modulePath) => {
      const relativePath = calculateRelativePath(filePath, modulePath);
      if (!relativePath) return match;
      modified = true;
      return match.replace(`@/${modulePath}`, relativePath);
    });
    
    if (modified) {
      await writeFile(filePath, newContent, 'utf8');
      console.log(`Updated imports in: ${filePath}`);
      return 1;
    }
    
    return 0;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return 0;
  }
}

async function main() {
  try {
    const rootDir = process.cwd();
    console.log(`Scanning for files in: ${rootDir}`);
    
    const files = await getAllFiles(rootDir);
    console.log(`Found ${files.length} files to process`);
    
    let modifiedCount = 0;
    
    for (const file of files) {
      modifiedCount += await processFile(file);
    }
    
    console.log(`\nCompleted! Modified ${modifiedCount} files.`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main(); 