<script lang="ts">
	import type { CombatState, CharacterStats } from '$lib/types/character';

	let {
		combatState,
		heroName,
		heroStats
	} = $props<{
		combatState: CombatState | null;
		heroName: string;
		heroStats: CharacterStats;
	}>();

	// Calculate percentages for health bars
	let heroHpPercent = $derived(heroStats ? Math.max(0, (heroStats.health.current / heroStats.health.max) * 100) : 100);

	let enemyHpPercent = $derived((combatState && combatState.enemy) ? Math.max(0, (combatState.enemy.health.current / combatState.enemy.health.max) * 100) : 100);

	// Get the last action for the central display
	let lastAction = $derived(combatState?.lastRoll || null);

	// Get recent logs (last 5)
	let recentLogs = $derived(
		combatState?.combatLog && Array.isArray(combatState.combatLog)
			? [...combatState.combatLog].slice(-5).reverse()
			: []
	);
</script>

{#if combatState && combatState.enemy}
<div class="arena-container">
	<div class="combatants-wrapper">
		<!-- Hero Side -->
		<div class="combatant hero">
			<div class="portrait-box">
				<img src="/images/avatars/hero.png" alt="Hero" class="portrait-image hero-bg" />
				<div class="name-plate">{heroName}</div>
			</div>

			<div class="bars-container">
				<div class="bar-bg">
					<div class="bar-fill hp hero-hp" style="width: {heroHpPercent}%;"></div>
				</div>
				<div class="hp-text">{Math.floor(heroStats.health.current)} / {heroStats.health.max} HP</div>
			</div>

			<div class="effects-row">
				<!-- Mock buffs -->
				<span class="effect-icon buff" title="Защита">🛡️</span>
			</div>
		</div>

		<!-- Center Action Indicator -->
		<div class="center-action">
			<div class="vs-badge">VS</div>

			{#if lastAction}
				<div class="action-highlight {lastAction.success ? 'success' : 'fail'}">
					<div class="roll-info">
						<span class="actor">{lastAction.actor === 'hero' ? heroName : combatState.enemy.name}</span>
						бросает d20: <strong class="roll-val">{lastAction.roll}</strong>
						{#if lastAction.bonus !== 0}
							<span class="bonus">({lastAction.bonus > 0 ? '+' : ''}{lastAction.bonus})</span>
						{/if}
						= {lastAction.total} (цель {lastAction.target})
					</div>
					<div class="result-text">
						{lastAction.success ? 'Успех!' : 'Промах!'}
					</div>
				</div>
			{/if}
		</div>

		<!-- Enemy Side -->
		<div class="combatant enemy">
			<div class="portrait-box">
				<img src="/images/avatars/monster.png" alt="Enemy" class="portrait-image enemy-bg" />
				<div class="name-plate">{combatState.enemy.name}</div>
			</div>

			<div class="bars-container">
				<div class="bar-bg right-align">
					<div class="bar-fill hp enemy-hp" style="width: {enemyHpPercent}%;"></div>
				</div>
				<div class="hp-text text-right">{Math.floor(combatState.enemy.health.current)} / {combatState.enemy.health.max} HP</div>
			</div>

			<div class="effects-row justify-end">
				{#if combatState.enemy.appliesEffect}
					<span class="effect-icon debuff" title={combatState.enemy.appliesEffect.name}>☠️</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Scrolling Combat Log -->
	<div class="combat-log-container">
		<div class="log-header">Летопись Боя</div>
		<div class="log-scroll">
			{#each recentLogs as log}
				<div class="log-entry">{log}</div>
			{/each}
			{#if recentLogs.length === 0}
				<div class="log-entry muted">Бой только начался...</div>
			{/if}
		</div>
	</div>
</div>
{/if}

<style>
	.arena-container {
		background: var(--surface-container-low, #1c1b1b);
		border: 1px solid var(--outline-variant, #4d4635);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		position: relative;
	}

	.combatants-wrapper {
		display: flex;
		justify-content: space-between;
		align-items: stretch;
		gap: 1rem;
	}

	.combatant {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		max-width: 35%;
	}

	.enemy {
		align-items: flex-end;
	}

	.portrait-box {
		position: relative;
		width: 100%;
		aspect-ratio: 4/3;
		border: 1px solid var(--outline-variant, #4d4635);
		background: var(--surface-container-highest, #353535);
		overflow: hidden;
	}

	.portrait-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.9;
		mix-blend-mode: normal;
	}

	.hero-bg { background-image: radial-gradient(circle, #2a4365, #1a202c); border: 2px solid #3b82f6; }
	.enemy-bg { background-image: radial-gradient(circle, #742a2a, #1a202c); border: 2px solid #ef4444; }

	.name-plate {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: rgba(0,0,0,0.8);
		border-top: 1px solid var(--primary-container, #554300);
		padding: 0.4rem;
		font-family: var(--font-cinzel, serif);
		font-size: 0.9rem;
		color: var(--primary, #f2ca50);
		text-align: center;
		backdrop-filter: blur(4px);
	}

	.bars-container {
		width: 100%;
	}

	.bar-bg {
		height: 8px;
		background: rgba(255,255,255,0.05);
		border: 1px solid rgba(255,255,255,0.1);
		position: relative;
		overflow: hidden;
	}

	.right-align {
		display: flex;
		justify-content: flex-end;
	}

	.bar-fill {
		height: 100%;
		transition: width 0.3s ease-out;
	}

	.hp.hero-hp { background: linear-gradient(90deg, #064e3b, #10b981); }
	.hp.enemy-hp { background: linear-gradient(90deg, #7f1d1d, #ef4444); }
	.right-align .hp.enemy-hp { background: linear-gradient(270deg, #7f1d1d, #ef4444); }

	.hp-text {
		font-family: var(--font-label, sans-serif);
		font-size: 0.75rem;
		color: var(--on-surface-variant, #d0c5af);
		margin-top: 0.2rem;
	}
	.text-right { text-align: right; }

	.effects-row {
		display: flex;
		gap: 0.4rem;
	}
	.justify-end { justify-content: flex-end; }

	.effect-icon {
		width: 24px; height: 24px;
		display: flex; align-items: center; justify-content: center;
		background: rgba(255,255,255,0.05);
		border: 1px solid rgba(255,255,255,0.1);
		font-size: 0.8rem;
	}

	/* Center Action */
	.center-action {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 0 1rem;
	}

	.vs-badge {
		font-family: var(--font-cinzel, serif);
		font-size: 1.5rem;
		color: var(--outline-variant, #4d4635);
		font-weight: bold;
		letter-spacing: 0.2em;
	}

	.action-highlight {
		background: var(--surface-container-highest, #353535);
		border: 1px solid var(--outline-variant, #4d4635);
		padding: 1rem;
		text-align: center;
		width: 100%;
		box-shadow: 0 4px 20px rgba(0,0,0,0.5);
	}

	.action-highlight.success {
		border-color: rgba(16, 185, 129, 0.4);
		box-shadow: 0 0 15px rgba(16, 185, 129, 0.1);
	}

	.action-highlight.fail {
		border-color: rgba(239, 68, 68, 0.4);
		box-shadow: 0 0 15px rgba(239, 68, 68, 0.1);
	}

	.roll-info {
		font-family: var(--font-body, serif);
		font-size: 0.85rem;
		color: var(--on-surface, #e5e2e1);
		margin-bottom: 0.5rem;
	}

	.roll-val {
		color: var(--primary, #f2ca50);
		font-size: 1.1rem;
	}
	.bonus { opacity: 0.7; }

	.result-text {
		font-family: var(--font-cinzel, serif);
		font-size: 1.2rem;
		font-weight: bold;
	}
	.success .result-text { color: #34d399; }
	.fail .result-text { color: #f87171; }

	/* Log */
	.combat-log-container {
		background: var(--surface, #131313);
		border: 1px solid var(--outline-variant, #4d4635);
		padding: 1rem;
	}

	.log-header {
		font-family: var(--font-cinzel, serif);
		font-size: 0.9rem;
		color: var(--primary, #f2ca50);
		border-bottom: 1px solid rgba(255,255,255,0.05);
		padding-bottom: 0.5rem;
		margin-bottom: 0.8rem;
		text-align: center;
		letter-spacing: 0.1em;
	}

	.log-scroll {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.log-entry {
		font-family: var(--font-body, serif);
		font-size: 0.85rem;
		color: var(--on-surface-variant, #d0c5af);
		line-height: 1.4;
		padding: 0.3rem 0;
		border-bottom: 1px dashed rgba(255,255,255,0.05);
	}

	.log-entry:last-child {
		border-bottom: none;
	}

	.muted { opacity: 0.5; font-style: italic; text-align: center; }
</style>
