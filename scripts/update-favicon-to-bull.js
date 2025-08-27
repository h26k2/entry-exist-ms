const fs = require('fs');
const path = require('path');

// Function to update favicon references to use bull.jpg
function updateFaviconToBullJpg() {
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
            
            // Replace favicon.svg with bull.jpg
            const faviconPattern = /<link rel="icon" type="image\/svg\+xml" href="\/images\/favicon\.svg">/g;
            if (faviconPattern.test(content)) {
                content = content.replace(faviconPattern, '<link rel="icon" type="image/jpeg" href="/images/bull.jpg">');
                
                if (content !== originalContent) {
                    fs.writeFileSync(filePath, content, 'utf8');
                    console.log(`✓ Updated favicon to bull.jpg: ${path.relative(process.cwd(), filePath)}`);
                    updatedFiles++;
                }
            }
        } catch (error) {
            console.error(`✗ Error updating ${filePath}:`, error.message);
        }
    }
    
    console.log(`\nFavicon update complete! ${updatedFiles} files were updated to use bull.jpg.`);
}

// Run the update
updateFaviconToBullJpg();
