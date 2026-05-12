const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'public', 'icons');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function cleanup() {
    console.log('Starting Cleanup V2...');
    
    // 1. Define folder mapping
    const folders = ['at-your-doorstep', 'delivery', 'ordered', 'ordered_temp', 'shipped', 'shipped_temp'];
    const targetDirs = {
        delivery: path.join(iconsDir, 'delivery'),
        ordered: path.join(iconsDir, 'ordered'),
        shipping: path.join(iconsDir, 'shipped') // We use 'shipped' as folder name
    };

    // Create targets if missing
    Object.values(targetDirs).forEach(d => ensureDir(d));

    // 2. Move all PNG files from any of these folders to the correct target and rename
    folders.forEach(folder => {
        const sourcePath = path.join(iconsDir, folder);
        if (fs.existsSync(sourcePath) && fs.statSync(sourcePath).isDirectory()) {
            const files = fs.readdirSync(sourcePath);
            files.forEach(file => {
                if (file.endsWith('.png')) {
                    const oldFilePath = path.join(sourcePath, file);
                    
                    // Determine target category
                    let targetDir = targetDirs.ordered;
                    if (folder.includes('ship') || folder.includes('shipped')) targetDir = targetDirs.shipping;
                    if (folder.includes('doorstep') || folder.includes('delivery')) targetDir = targetDirs.delivery;

                    // Clean name
                    const cleanName = file.replace(/--Streamline-Ultimate/g, '').replace(/\s+/g, '-').toLowerCase();
                    const newFilePath = path.join(targetDir, cleanName);

                    try {
                        fs.renameSync(oldFilePath, newFilePath);
                        console.log(`Moved & Renamed: ${folder}/${file} -> ${path.basename(targetDir)}/${cleanName}`);
                    } catch (e) {
                        console.error(`Failed to move ${file}: ${e.message}`);
                    }
                }
            });
            
            // Try to remove old empty dir (except targets)
            try {
               if (!Object.values(targetDirs).includes(sourcePath)) {
                  const remaining = fs.readdirSync(sourcePath);
                  if (remaining.length === 0) fs.rmdirSync(sourcePath);
               }
            } catch (e) {}
        }
    });

    console.log('Cleanup V2 complete.');
}

cleanup();
