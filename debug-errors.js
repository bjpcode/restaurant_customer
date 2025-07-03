// Debug script to check for common React errors

const fs = require('fs');
const path = require('path');

// Check for common issues
const checkFiles = [
  'src/components/MenuGrid.js',
  'src/components/MenuContainer.js', 
  'src/utils/performance.js',
  'src/utils/analytics.js'
];

checkFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check for missing imports
    if (content.includes('useCallback') && !content.includes('import React') && !content.includes('useCallback')) {
      console.error(`❌ ${filePath}: useCallback used but not imported`);
    }
    
    if (content.includes('useState') && !content.includes('import React') && !content.includes('useState')) {
      console.error(`❌ ${filePath}: useState used but not imported`);
    }
    
    if (content.includes('useEffect') && !content.includes('import React') && !content.includes('useEffect')) {
      console.error(`❌ ${filePath}: useEffect used but not imported`);
    }
    
    // Check for unclosed JSX
    const openTags = (content.match(/<[^/>][^>]*>/g) || []).length;
    const closeTags = (content.match(/<\/[^>]+>/g) || []).length;
    const selfClosing = (content.match(/<[^>]*\/>/g) || []).length;
    
    if (openTags !== closeTags + selfClosing) {
      console.warn(`⚠️  ${filePath}: Potential JSX tag mismatch`);
    }
    
    console.log(`✅ ${filePath}: Basic checks passed`);
  } else {
    console.error(`❌ ${filePath}: File not found`);
  }
});

console.log('\n🔍 Debug complete');