const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'public', 'icons');

function renameRecursive(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            renameRecursive(fullPath);
        } else if (file.endsWith('.png')) {
            const newName = file.replace('--Streamline-Ultimate', '').toLowerCase();
            const newPath = path.join(dir, newName);
            if (fullPath !== newPath) {
                fs.renameSync(fullPath, newPath);
                console.log(`Renamed: ${file} -> ${newName}`);
            }
        }
    });
}

renameRecursive(iconsDir);
console.log('Icon renaming complete.');
