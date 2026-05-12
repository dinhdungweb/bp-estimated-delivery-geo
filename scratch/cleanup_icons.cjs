const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'public', 'icons');

// 1. Rename directories
const dirMapping = {
    'at-your-doorstep': 'delivery',
    'ordered_temp': 'ordered',
    'shipped_temp': 'shipped'
};

Object.entries(dirMapping).forEach(([oldName, newName]) => {
    const oldPath = path.join(iconsDir, oldName);
    const newPath = path.join(iconsDir, newName);
    if (fs.existsSync(oldPath)) {
        if (fs.existsSync(newPath)) {
            // Merge files if newPath already exists
            fs.readdirSync(oldPath).forEach(file => {
                fs.renameSync(path.join(oldPath, file), path.join(newPath, file));
            });
            fs.rmdirSync(oldPath);
        } else {
            fs.renameSync(oldPath, newPath);
        }
    }
});

// 2. Comprehensive Rename Files
function cleanupFiles(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
            cleanupFiles(fullPath);
        } else if (item.endsWith('.png')) {
            let newName = item
                .replace(/--Streamline-Ultimate/g, '')
                .replace(/\s+/g, '-')
                .toLowerCase();
            const newPath = path.join(dir, newName);
            if (fullPath !== newPath) {
                fs.renameSync(fullPath, newPath);
            }
        }
    });
}

cleanupFiles(iconsDir);
console.log('Cleanup complete.');
