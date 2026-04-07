const fs = require('fs');

// Fix CombatArena.svelte
let arenaContent = fs.readFileSync('src/lib/components/dashboard/CombatArena.svelte', 'utf-8');
arenaContent = arenaContent.replace(/let lastAction = \$derived\(\(\) => \{[\s\S]*?\}\);/, `let lastAction = $derived(() => {
		if (!combatState?.lastRoll) return null;
		return combatState.lastRoll;
	});`);

// Fix type issues with length in recentLogs
arenaContent = arenaContent.replace(/let recentLogs = \$derived\(\(\) => \{[\s\S]*?\}\);/, `let recentLogs = $derived(() => {
		if (!combatState?.combatLog || !Array.isArray(combatState.combatLog)) return [];
		return [...combatState.combatLog].slice(-5).reverse();
	});`);

// We also need to fix how derived is typed, Svelte 5 expects proper types
fs.writeFileSync('src/lib/components/dashboard/CombatArena.svelte', arenaContent, 'utf-8');

// Fix imports in character page
let charContent = fs.readFileSync('src/routes/character/+page.svelte', 'utf-8');
charContent = charContent.replace(`import GameTimeClock from '/components/dashboard/GameTimeClock.svelte';`, `import GameTimeClock from '$lib/components/dashboard/GameTimeClock.svelte';`);
charContent = charContent.replace(`import CombatArena from '/components/dashboard/CombatArena.svelte';`, `import CombatArena from '$lib/components/dashboard/CombatArena.svelte';`);
fs.writeFileSync('src/routes/character/+page.svelte', charContent, 'utf-8');
