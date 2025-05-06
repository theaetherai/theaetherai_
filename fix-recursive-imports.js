// Script to fix recursive import patterns in React components
const fs = require('fs');
const path = require('path');

// Components to analyze - focus on common recursive patterns
const componentsToSearch = ['src/components', 'src/app'];
const ignoreDirs = ['node_modules', '.next', '.git'];
const fileExtensions = ['.jsx', '.tsx'];

console.log('🛠️ Checking for recursive component patterns...');

// Find React component files
function findComponentFiles(dir) {
  let results = [];
  
  try {
    const list = fs.readdirSync(dir);
    
    for (let file of list) {
      if (ignoreDirs.some(ignore => dir.includes(ignore))) continue;
      
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat && stat.isDirectory()) {
        results = results.concat(findComponentFiles(filePath));
      } else {
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

// Check for potential recursive rendering patterns in a component file
function checkForRecursivePatterns(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath).split('.')[0];
    const issues = [];
    
    // Check 1: Component rendering itself without conditions
    const selfReferenceRegex = new RegExp(`<\\s*${fileName}\\s*[^>]*>`, 'g');
    if (selfReferenceRegex.test(content)) {
      issues.push({
        type: 'self-reference',
        description: `Component appears to render itself without proper conditions`,
        suggestion: `Add a termination condition to prevent infinite recursion`
      });
    }
    
    // Check 2: Risky useState patterns that might cause infinite re-renders
    const stateUpdateInRenderRegex = /const\s+\[\w+,\s*set(\w+)\]\s*=\s*useState.+\n(?:(?!\s*useEffect|\s*if|\s*return).)*\s*set\1\(/gs;
    if (stateUpdateInRenderRegex.test(content)) {
      issues.push({
        type: 'state-in-render',
        description: `State updater may be called unconditionally in render`,
        suggestion: `Move state updates to useEffect or event handlers`
      });
    }
    
    // Check 3: Self-importing components
    const selfImportRegex = new RegExp(`import\\s+(?:{[^}]*}|\\*\\s+as\\s+\\w+|${fileName})\\s+from\\s+['"]\\.\\/${fileName}['"]`, 'g');
    if (selfImportRegex.test(content)) {
      issues.push({
        type: 'self-import',
        description: `Component imports itself directly`,
        suggestion: `Refactor to avoid self-imports`
      });
    }
    
    // Check 4: Component defined inside itself
    const nestedComponentRegex = new RegExp(`function\\s+${fileName}.*return.*?function\\s+${fileName}\\s*\\(`, 'gs');
    if (nestedComponentRegex.test(content)) {
      issues.push({
        type: 'nested-definition',
        description: `Nested component definition with same name`,
        suggestion: `Move nested component outside or rename it`
      });
    }
    
    return { path: filePath, issues };
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
    return { path: filePath, issues: [] };
  }
}

// Fix recursive rendering issues
function fixRecursiveIssues(fileInfo) {
  const { path: filePath, issues } = fileInfo;
  
  if (issues.length === 0) return false;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const fileName = path.basename(filePath).split('.')[0];
    
    for (const issue of issues) {
      if (issue.type === 'self-reference') {
        // Add missing condition to self-references
        const selfReferenceRegex = new RegExp(`<\\s*${fileName}\\s+`, 'g');
        if (content.includes('depth={depth + 1}')) {
          // Already has depth prop, but might be missing check
          if (!content.includes('if (depth') && !content.includes('depth >')) {
            // Add maximum depth check where component is defined
            const componentDefRegex = new RegExp(`function\\s+${fileName}\\s*\\(([^)]*)\\)`, 'g');
            content = content.replace(componentDefRegex, (match, params) => {
              const newParams = params.includes('depth') ? params : params ? `${params}, { depth = 0 }` : '{ depth = 0 }';
              return `function ${fileName}(${newParams}) {\n  // Maximum depth check to prevent infinite recursion\n  if (depth > 5) return null;\n`;
            });
            modified = true;
          }
        } else {
          // Add depth prop and check
          const componentDefRegex = new RegExp(`function\\s+${fileName}\\s*\\(([^)]*)\\)`, 'g');
          content = content.replace(componentDefRegex, (match, params) => {
            const newParams = params ? `${params}, { depth = 0 }` : '{ depth = 0 }';
            return `function ${fileName}(${newParams}) {\n  // Maximum depth check to prevent infinite recursion\n  if (depth > 5) return null;\n`;
          });
          
          // Add depth prop to self-references
          content = content.replace(selfReferenceRegex, `<${fileName} depth={depth + 1} `);
          modified = true;
        }
      }
      
      if (issue.type === 'state-in-render') {
        // Move state updates to useEffect
        const stateUpdateInRenderRegex = /const\s+\[(\w+),\s*set(\w+)\]\s*=\s*useState.+\n(?:(?!\s*useEffect|\s*if|\s*return).)*\s*(set\1\(.*?\))/gs;
        content = content.replace(stateUpdateInRenderRegex, (match, state, setter, update) => {
          return `const [${state}, set${setter}] = useState${match.split('useState')[1].split('\n')[0]}\n  
  // Moved state update to useEffect to prevent infinite re-renders
  useEffect(() => {
    ${update};
  }, []);\n`;
        });
        
        // Ensure useEffect is imported
        if (!content.includes("import { useEffect }") && !content.includes("import useEffect")) {
          const reactImportRegex = /import React,?\s*{([^}]*)}\s*from 'react';?/;
          if (reactImportRegex.test(content)) {
            content = content.replace(reactImportRegex, (match, imports) => {
              return match.replace("{" + imports + "}", "{ useEffect, " + imports + "}");
            });
          } else {
            const importRegex = /import.*from 'react';?/;
            if (importRegex.test(content)) {
              content = content.replace(importRegex, (match) => {
                return match + "\nimport { useEffect } from 'react';";
              });
            } else {
              // Add a new import at the top if no React import exists
              content = "import { useEffect } from 'react';\n" + content;
            }
          }
        }
        
        modified = true;
      }
      
      if (issue.type === 'self-import') {
        // Remove self-imports as they cause circular dependencies
        const selfImportRegex = new RegExp(`import\\s+(?:{[^}]*}|\\*\\s+as\\s+\\w+|${fileName})\\s+from\\s+['"]\\.\\/${fileName}['"];?\\n?`, 'g');
        content = content.replace(selfImportRegex, '');
        modified = true;
      }
      
      if (issue.type === 'nested-definition') {
        // Extract and rename nested component
        const componentDefRegex = new RegExp(`(function\\s+)${fileName}(\\s*\\(.*?\\)\\s*{[\\s\\S]*?)(function\\s+)${fileName}(\\s*\\([^)]*\\))`, 'g');
        content = content.replace(componentDefRegex, (match, func1, content1, func2, params) => {
          return `${func1}${fileName}${content1}${func2}Inner${fileName}${params}`;
        });
        
        // Update references to the nested component
        const nestedRefRegex = new RegExp(`<\\s*${fileName}\\s+`, 'g');
        content = content.replace(nestedRefRegex, (match) => {
          // Don't replace the first occurrence (which is likely correct)
          if (content.indexOf(match) === content.indexOf(nestedRefRegex)) {
            return match;
          }
          return `<Inner${fileName} `;
        });
        
        modified = true;
      }
    }
    
    if (modified) {
      // Create backup of original file
      const backupPath = filePath + '.bak';
      fs.writeFileSync(backupPath, fs.readFileSync(filePath));
      
      // Write fixed content
      fs.writeFileSync(filePath, content);
      return true;
    }
    
    return false;
  } catch (err) {
    console.error(`Error fixing ${filePath}:`, err.message);
    return false;
  }
}

// Main execution
try {
  console.log('Analyzing React components for recursive patterns...');
  
  // Find all component files
  let allFiles = [];
  for (const dir of componentsToSearch) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      const files = findComponentFiles(dirPath);
      allFiles = allFiles.concat(files);
    }
  }
  
  console.log(`Found ${allFiles.length} React component files to analyze`);
  
  // Check each file for recursive patterns
  const filesWithIssues = [];
  
  allFiles.forEach(filePath => {
    const result = checkForRecursivePatterns(filePath);
    if (result.issues.length > 0) {
      filesWithIssues.push(result);
    }
  });
  
  console.log('\n📊 RESULTS:');
  console.log('====================');
  
  if (filesWithIssues.length === 0) {
    console.log('✅ No recursive rendering patterns found!');
  } else {
    console.log(`🔎 Found ${filesWithIssues.length} files with potential issues:`);
    
    let fixedCount = 0;
    
    // Display and attempt to fix issues
    filesWithIssues.forEach((fileInfo, index) => {
      const relativePath = fileInfo.path.replace(process.cwd(), '').replace(/\\/g, '/');
      console.log(`\n🔄 File #${index + 1}: ${relativePath}`);
      
      fileInfo.issues.forEach((issue, i) => {
        console.log(`   Issue ${i + 1}: ${issue.description}`);
        console.log(`   Suggestion: ${issue.suggestion}`);
      });
      
      const fixed = fixRecursiveIssues(fileInfo);
      if (fixed) {
        console.log(`   ✅ Applied automatic fixes (backup saved at ${relativePath}.bak)`);
        fixedCount++;
      } else {
        console.log(`   ⚠️ Could not automatically fix issues`);
      }
    });
    
    console.log(`\n🛠️ Fixed ${fixedCount}/${filesWithIssues.length} files with issues`);
    
    console.log('\n💡 ADDITIONAL SUGGESTIONS:');
    console.log('1. Consider using React.lazy for components that cause stack size errors');
    console.log('2. Use memoization (React.memo, useMemo) for expensive components');
    console.log('3. Check for render props or HOCs that might cause rendering loops');
    console.log('4. Review useEffect dependencies to prevent infinite re-render cycles');
  }
  
} catch (err) {
  console.error('Error analyzing components:', err);
} 