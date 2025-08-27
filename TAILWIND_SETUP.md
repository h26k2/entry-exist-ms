# Tailwind CSS Offline Setup

This project has been updated to use Tailwind CSS offline instead of the CDN. Here's how to work with it:

## Available Commands

### Build CSS for Production (Minified)
```bash
npm run build:css:prod
```
Use this command when you're ready for production or when you want a smaller CSS file.

### Build CSS for Development (With Watch Mode)
```bash
npm run build:css
```
This command will watch for changes in your HTML/EJS files and automatically rebuild the CSS when you make changes. Perfect for development.

### Update All EJS Files to Use Local Tailwind
```bash
npm run update:tailwind
```
This command automatically converts all EJS files from using Tailwind CDN to local CSS file. (Already run once)

## File Structure

- **src/input.css** - Source file for Tailwind CSS (contains @tailwind directives)
- **public/css/tailwind.css** - Generated CSS file that gets served to browsers
- **tailwind.config.js** - Tailwind configuration with your custom colors and settings

## Custom Colors Available

Your custom color palette is already configured:
- `primary`: #1e40af (blue-800)
- `secondary`: #3b82f6 (blue-500)
- `accent`: #06b6d4 (cyan-500)
- `dark`: #1f2937 (gray-800)
- `light`: #f8fafc (slate-50)

You can use these in your HTML like: `bg-primary`, `text-secondary`, `border-accent`, etc.

## Development Workflow

1. **For daily development**: Run `npm run build:css` to start watch mode
2. **When adding new Tailwind classes**: The CSS will automatically rebuild
3. **Before deployment**: Run `npm run build:css:prod` to create optimized CSS
4. **If you add new HTML/EJS files**: Make sure they're covered in `tailwind.config.js` content array

## Content Sources

Tailwind scans these locations for classes to include:
- `./views/**/*.ejs` - All EJS template files
- `./public/**/*.js` - All JavaScript files in public
- `./public/**/*.html` - Any HTML files in public

## Benefits of Offline Setup

- ✅ No internet dependency
- ✅ Faster page loads
- ✅ Better caching
- ✅ Smaller CSS file (only includes used classes)
- ✅ Version control over exact Tailwind version
- ✅ Offline development capability
