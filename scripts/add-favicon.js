const fs = require('fs');
const path = require('path');

// Function to add favicon to all EJS files
function addFaviconToPages() {
    const viewsDir = path.join(__dirname, '..', 'views');
    
    // Find all EJS files recursively
    function findEjsFiles(dir) {
        const files = [];
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                files.push(...findEjsFiles(fullPath));
            } else if (item.endsWith('.ejs')) {
                files.push(fullPath);
            }
        }
        
        return files;
    }
    
    const ejsFiles = findEjsFiles(viewsDir);
    let updatedFiles = 0;
    
    console.log(`Found ${ejsFiles.length} EJS files to check...`);
    
    for (const filePath of ejsFiles) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let originalContent = content;
            
            // Skip if file already has a favicon
            if (content.includes('favicon.svg') || content.includes('rel="icon"')) {
                continue;
            }
            
            // Add favicon after the title tag
            const titlePattern = /(<title>.*?<\/title>)/;
            if (titlePattern.test(content)) {
                content = content.replace(titlePattern, '$1\n    <link rel="icon" type="image/svg+xml" href="/images/favicon.svg">');
                
                if (content !== originalContent) {
                    fs.writeFileSync(filePath, content, 'utf8');
                    console.log(`✓ Added favicon to: ${path.relative(process.cwd(), filePath)}`);
                    updatedFiles++;
                }
            }
        } catch (error) {
            console.error(`✗ Error updating ${filePath}:`, error.message);
        }
    }
    
    console.log(`\nFavicon update complete! ${updatedFiles} files were updated.`);
}

// Run the update
addFaviconToPages();
