const fs = require('fs');

// In worker, questService doesn't export some of these things directly, maybe they are in another file or named differently?
// Let's check what's inside questService.ts
