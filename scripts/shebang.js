const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../dist/index.js');

const shebang = '#!/usr/bin/env node\n';
fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    // Prepend the shebang if it doesn't already exist
    if (!data.startsWith(shebang)) {
        fs.writeFile(filePath, shebang + data, (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log('Shebang added successfully.');
            }
        });
    }
});
