const fs = require('fs');

let content = fs.readFileSync('src/routes/character/+page.svelte', 'utf-8');

// Replace the old combat view or top-grid section to include our new components
const targetHtml = `<!-- WIDGETS ROW -->
	<div class="top-grid">
		<div class="card status-card">`;

const replacementHtml = `<!-- WIDGETS ROW -->
	<div class="top-grid">
		<!-- New GameTimeClock Widget -->
		<GameTimeClock
			timeOfDay={character.timeOfDay}
			weather={character.weather}
			season={character.season}
			gameDate={character.gameDate}
		/>

		<div class="card status-card">`;

content = content.replace(targetHtml, replacementHtml);

// Insert CombatArena
const combatTarget = `<!-- COMBAT VIEW -->
	{#if character.combat && character.combat.enemy}`;

const combatReplacement = `<!-- COMBAT VIEW -->
	{#if character.combat && character.combat.enemy}
		<div style="margin-bottom: 1.5rem;">
			<CombatArena
				combatState={character.combat}
				heroName={character.name}
				heroStats={character.stats}
			/>
		</div>`;

content = content.replace(combatTarget, combatReplacement);

// Fix potential grid issue
content = content.replace(`.top-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem; }`,
						  `.top-grid { display: grid; grid-template-columns: auto 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem; }`);

fs.writeFileSync('src/routes/character/+page.svelte', content, 'utf-8');
