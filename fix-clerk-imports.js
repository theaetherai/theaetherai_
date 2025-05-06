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
    // Find: import { getAuth } from "@clerk/nextjs/server";
    // Replace: import { getAuth } from "@clerk/nextjs/server";
    find: /import\s+\{\s*currentUser\s*\}\s+from\s+["']@clerk\/nextjs["'];?/g,
    replace: 'import { getAuth } from "@clerk/nextjs/server";'
  },
  {
    // Find: import { client } from "../../lib/prisma";
    // Replace: import { client } from "../../lib/prisma";
    find: /import\s+\{\s*db\s*\}\s+from\s+["'](.*)\/lib\/db["'];?/g,
    replace: 'import { client } from "$1/lib/prisma";'
  },
  {
    // Find: const { userId } = getAuth(req);
    // Replace: const { userId } = getAuth(req);
    find: /const\s+user\s*=\s*await\s+currentUser\(\);/g,
    replace: 'const { userId } = getAuth(req);'
  },
  {
    // Find: if (!userId)
    // Replace: if (!userId)
    find: /if\s*\(\s*!user\s*\)/g,
    replace: 'if (!userId)'
  },
  {
    // Find: clerkid: userId
    // Replace: clerkid: userId
    find: /clerkId:\s*user\.id/g,
    replace: 'clerkid: userId'
  },
  {
    // Find: db.anyMethod
    // Replace: client.anyMethod
    find: /db\.([\w]+)\./g,
    replace: 'client.$1.'
  },
  {
    // Find: db.anyMethod
    // Replace: client.anyMethod
    find: /db\.([\w]+)\(/g,
    replace: 'client.$1('
  },
  {
    // Find: user.publicMetadata
    // Replace: Just remove these checks where possible
    find: /&&\s*(?:!user\.publicMetadata\.isAdmin|!user\.publicMetadata\.admin)/g,
    replace: ''
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
    
    // Check if file has any of our target patterns before processing
    const hasTargetImports = fileContent.includes('currentUser') || 
                            fileContent.includes('db') ||
                            fileContent.includes('@clerk/nextjs');
    
    if (!hasTargetImports) {
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