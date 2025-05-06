const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Patterns to find and replace
const patterns = [
  {
    // Find: if (!user?.id)
    // Replace: if (!user?.id)
    find: /if\s*\(\s*!userId\s*\)/g,
    replace: 'if (!user?.id)'
  },
  {
    // In case there are instances where the user variable might be null
    find: /const\s+\{\s*userId\s*\}\s*=\s*await\s+currentUser\(\)/g,
    replace: 'const user = await currentUser()'
  }
];

async function getAllFiles(dir, fileList = []) {
  const files = await readdir(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileStat = await stat(filePath);
    
    if (fileStat.isDirectory()) {
      // Skip node_modules and .next
      if (file === 'node_modules' || file === '.next' || file === '.git') continue;
      
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

async function processFile(filePath) {
  try {
    let fileContent = await readFile(filePath, 'utf8');
    let modified = false;
    
    // Check if file has userId references before processing
    const hasUserId = fileContent.includes('userId');
    
    if (!hasUserId) {
      return 0;
    }
    
    let newContent = fileContent;
    
    for (const pattern of patterns) {
      const originalContent = newContent;
      newContent = newContent.replace(pattern.find, pattern.replace);
      
      if (originalContent !== newContent) {
        modified = true;
      }
    }
    
    if (modified) {
      await writeFile(filePath, newContent, 'utf8');
      console.log(`Updated: ${filePath}`);
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
    console.log(`Scanning for files with userId references in: ${rootDir}`);
    
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