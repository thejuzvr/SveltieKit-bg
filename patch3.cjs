const fs = require('fs');

let content = fs.readFileSync('src/lib/components/dashboard/CombatArena.svelte', 'utf-8');

// Fix typing for CombatArena computed values
const searchLastAction = `	let lastAction = $derived(() => {
		if (!combatState?.lastRoll) return null;
		return combatState.lastRoll;
	});`;
const replaceLastAction = `	let lastAction = $derived(combatState?.lastRoll || null);`;
content = content.replace(searchLastAction, replaceLastAction);

const searchRecentLogs = `	let recentLogs = $derived(() => {
		if (!combatState?.combatLog || !Array.isArray(combatState.combatLog)) return [];
		return [...combatState.combatLog].slice(-5).reverse();
	});`;
const replaceRecentLogs = `	let recentLogs = $derived(
		combatState?.combatLog && Array.isArray(combatState.combatLog)
			? [...combatState.combatLog].slice(-5).reverse()
			: []
	);`;
content = content.replace(searchRecentLogs, replaceRecentLogs);

// Fix computed percentages without functions
content = content.replace(/let heroHpPercent = \$derived\(\(\) => \{[\s\S]*?\}\);/, `let heroHpPercent = $derived(heroStats ? Math.max(0, (heroStats.health.current / heroStats.health.max) * 100) : 100);`);
content = content.replace(/let enemyHpPercent = \$derived\(\(\) => \{[\s\S]*?\}\);/, `let enemyHpPercent = $derived((combatState && combatState.enemy) ? Math.max(0, (combatState.enemy.health.current / combatState.enemy.health.max) * 100) : 100);`);

// In the template, remove () since they are no longer functions
content = content.replace(/{heroHpPercent\(\)}/g, '{heroHpPercent}');
content = content.replace(/{enemyHpPercent\(\)}/g, '{enemyHpPercent}');

fs.writeFileSync('src/lib/components/dashboard/CombatArena.svelte', content, 'utf-8');
