const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const categories = ['delivery', 'ordered', 'shipped'];

const collection = [];

categories.forEach(cat => {
    const dir = path.join(iconsDir, cat);
    if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
        files.forEach(file => {
            const name = file
                .replace('.png', '')
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            
            collection.push({
                id: `/icons/${cat === 'shipped' ? 'shipped' : cat}/${file}`,
                category: cat === 'shipped' ? 'shipping' : cat,
                name: name
            });
        });
    }
});

console.log(JSON.stringify(collection, null, 2));
