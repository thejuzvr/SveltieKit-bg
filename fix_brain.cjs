const fs = require('fs');
let code = fs.readFileSync('src/lib/ai/brain.ts', 'utf8');

// replace gameData.services as any with (gameData as any).services as any
code = code.replace(/gameData\.services as any/g, '(gameData as any).services as any');

fs.writeFileSync('src/lib/ai/brain.ts', code, 'utf8');
