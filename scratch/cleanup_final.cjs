const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

function processDir(dirName, category) {
    const fullPath = path.join(iconsDir, dirName);
    if (!fs.existsSync(fullPath)) {
        console.log(`Directory ${dirName} not found, skipping.`);
        return;
    }

    const files = fs.readdirSync(fullPath);
    console.log(`Processing ${files.length} files in ${dirName}...`);

    files.forEach(file => {
        if (file.toLowerCase().endsWith('.png')) {
            const oldPath = path.join(fullPath, file);
            let cleanName = file
                .replace(/--Streamline-Ultimate/gi, '')
                .replace(/\s+/g, '-')
                .toLowerCase();
            
            // Fix case: arrived--streamline-ultimate.png -> arrived.png
            const newPath = path.join(fullPath, cleanName);
            
            if (oldPath !== newPath) {
                try {
                    fs.renameSync(oldPath, newPath);
                    console.log(`[OK] Rename: ${file} -> ${cleanName}`);
                } catch (e) {
                    console.error(`[ERR] Failed to rename ${file}: ${e.message}`);
                }
            }
        }
    });
}

console.log('--- STARTING FINAL CLEANUP ---');

// 1. Rename bad directories first if they exist
const mapping = {
    'at-your-doorstep': 'delivery',
    'ordered_temp': 'ordered',
    'shipped_temp': 'shipped'
};

Object.entries(mapping).forEach(([oldN, newN]) => {
    const oP = path.join(iconsDir, oldN);
    const nP = path.join(iconsDir, newN);
    if (fs.existsSync(oP)) {
        try {
            if (fs.existsSync(nP)) {
               // Move files from old to new if new exists
               fs.readdirSync(oP).forEach(f => fs.renameSync(path.join(oP, f), path.join(nP, f)));
               fs.rmdirSync(oP);
               console.log(`Merged ${oldN} into ${newN}`);
            } else {
               fs.renameSync(oP, nP);
               console.log(`Renamed directory ${oldN} to ${newN}`);
            }
        } catch(e) { console.error(`Folder rename error: ${e.message}`); }
    }
});

// 2. Cleanup files in standard directories
processDir('delivery', 'delivery');
processDir('ordered', 'ordered');
processDir('shipped', 'shipped');

console.log('--- CLEANUP COMPLETE ---');
