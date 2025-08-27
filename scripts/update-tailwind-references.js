const fs = require('fs');
const path = require('path');

// Function to update EJS files to use local Tailwind CSS
function updateTailwindReferences() {
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
            
            // Replace CDN script tag with local CSS link
            const cdnPattern = /<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/;
            if (cdnPattern.test(content)) {
                content = content.replace(cdnPattern, '<link rel="stylesheet" href="/css/tailwind.css" />');
                
                // Remove the inline tailwind config script block
                const configPattern = /<script>\s*tailwind\.config\s*=\s*{[\s\S]*?};\s*<\/script>/;
                content = content.replace(configPattern, '');
                
                // Clean up any extra whitespace
                content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
                
                if (content !== originalContent) {
                    fs.writeFileSync(filePath, content, 'utf8');
                    console.log(`✓ Updated: ${path.relative(process.cwd(), filePath)}`);
                    updatedFiles++;
                }
            }
        } catch (error) {
            console.error(`✗ Error updating ${filePath}:`, error.message);
        }
    }
    
    console.log(`\nUpdate complete! ${updatedFiles} files were updated.`);
    console.log('\nMake sure to run "npm run build:css:prod" whenever you modify your HTML/CSS to rebuild the Tailwind CSS file.');
}

// Run the update
updateTailwindReferences();
