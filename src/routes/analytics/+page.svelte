<script lang="ts">
	import { gameStore } from '$lib/stores/gameStore.svelte';
	
	const character = $derived(gameStore.character);
	const analytics = $derived(character?.analytics);
	
	const d20Rolls = $derived(analytics?.diceRolls?.d20 || Array(21).fill(0));
	const maxRollCount = $derived(Math.max(1, ...d20Rolls.slice(1)));
	
	const totalRolls = $derived(d20Rolls.reduce((a, b) => a + b, 0));
	const crits = $derived(d20Rolls[20] || 0);
	const fumbles = $derived(d20Rolls[1] || 0);
	
	const luckScore = $derived(totalRolls > 0 ? (((crits - fumbles) / totalRolls) * 100).toFixed(1) : '0.0');

	const killedEnemies = $derived(
		analytics?.killedEnemies 
			? Object.entries(analytics.killedEnemies).sort(([, a], [, b]) => b - a).slice(0, 10)
			: []
	);

	const totalEnemiesDefeated = $derived(
		analytics?.killedEnemies 
			? Object.values(analytics.killedEnemies).reduce((sum: number, count: any) => sum + count, 0)
			: 0
	);

	const actionHistory = $derived(character?.actionHistory || []);
	
	function getRollColor(roll: number) {
		if (roll === 20) return 'var(--gold)';
		if (roll === 1) return 'var(--danger)';
		if (roll > 15) return 'var(--green)';
		if (roll < 5) return '#f87171';
		return 'rgba(255,255,255,0.2)';
	}
</script>

{#if character}
<div class="analytics-page container">
	<header class="page-header">
		<h1 class="font-cinzel">📈 Аналитика Судьбы</h1>
		<div class="header-stats">
			<div class="stat-box">
				<span class="label">Всего бросков</span>
				<span class="value">{totalRolls}</span>
			</div>
		</div>
	</header>

	<div class="analytics-grid">
		<!-- Summary Cards -->
		<div class="summary-cards">
			<div class="card stat-card">
				<span class="stat-icon crit">🎇</span>
				<div class="stat-value">{crits}</div>
				<div class="stat-label">Критические удачи (20)</div>
			</div>
			<div class="card stat-card">
				<span class="stat-icon fumble">💀</span>
				<div class="stat-value">{fumbles}</div>
				<div class="stat-label">Критические провалы (1)</div>
			</div>
			<div class="card stat-card">
				<span class="stat-icon luck">☘️</span>
				<div class="stat-value">{luckScore}%</div>
				<div class="stat-label">Индекс Удачи</div>
			</div>
			<div class="card stat-card">
				<span class="stat-icon enemies">⚔️</span>
				<div class="stat-value">{totalEnemiesDefeated}</div>
				<div class="stat-label">Врагов повержено</div>
			</div>
		</div>

		<!-- Dice Distribution -->
		<section class="card analytics-card dice-dist">
			<div class="card-header-sm">🎲 Распределение d20</div>
			<div class="dice-chart">
				{#each Array.from({ length: 20 }, (_, i) => i + 1) as face}
					{@const count = d20Rolls[face] || 0}
					{@const height = (count / maxRollCount) * 100}
					<div class="chart-col">
						<div class="bar-wrap">
							<div 
								class="bar" 
								style="height: {height}%; background: {getRollColor(face)}"
								title="Выпало {count} раз"
							></div>
						</div>
						<span class="bar-label" class:highlight={face === 1 || face === 20}>
							{face}
						</span>
					</div>
				{/each}
			</div>
		</section>

		<!-- Luck Meter -->
		<section class="card analytics-card">
			<div class="card-header-sm">☘️ Индекс Удачи</div>
			<div class="luck-meter-wrap">
				<div class="luck-value font-cinzel {Number(luckScore) >= 0 ? 'text-success' : 'text-danger'}">
					{luckScore}%
				</div>
				<p class="luck-desc">Относительный перевес критических успехов над провалами.</p>
				<div class="luck-bar">
					<div class="luck-fill" style="width: {50 + Number(luckScore)}%; background: {Number(luckScore) >= 0 ? 'var(--green)' : 'var(--danger)'}"></div>
				</div>
			</div>
		</section>

		<!-- Summary Stats -->
		<section class="card analytics-card">
			<div class="card-header-sm">⚔️ Поверженные враги (Топ-10)</div>
			<div class="kills-list">
				{#if killedEnemies.length === 0}
					<p class="empty-msg">Враги еще не повержены...</p>
				{:else}
					{#each killedEnemies as [enemy, count]}
						<div class="kill-item">
							<span class="enemy-name">{enemy}</span>
							<span class="kill-count">{count}</span>
						</div>
					{/each}
				{/if}
			</div>
		</section>

		<!-- Action Stats -->
		<section class="card analytics-card">
			<div class="card-header-sm">📜 Последние действия</div>
			<div class="history-list">
				{#if actionHistory.length === 0}
					<p class="empty-msg">История пуста...</p>
				{:else}
					{#each actionHistory.slice(-8).reverse() as entry}
						<div class="history-item">
							<span class="history-icon">
								{#if entry.type === 'combat'}⚔️
								{:else if entry.type === 'travel'}🧭
								{:else if entry.type === 'quest'}📜
								{:else if entry.type === 'rest'}😴
								{:else}📍{/if}
							</span>
							<span class="history-type">
								{entry.type === 'combat' ? 'Сражение' :
								 entry.type === 'travel' ? 'Путешествие' :
								 entry.type === 'quest' ? 'Задание' :
								 entry.type === 'rest' ? 'Отдых' : 'Событие'}
							</span>
							<span class="history-time">{new Date(entry.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
						</div>
					{/each}
				{/if}
			</div>
		</section>
	</div>
</div>
{/if}

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		width: 100%;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2.5rem;
	}

	.page-header h1 {
		margin: 0;
		font-size: 2.2rem;
		color: var(--gold);
	}

	.header-stats {
		display: flex;
		gap: 2rem;
	}

	.stat-box {
		text-align: right;
	}

	.stat-box .label {
		display: block;
		font-size: 0.75rem;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-box .value {
		font-size: 1.5rem;
		font-weight: 700;
		font-family: var(--font-cinzel);
	}

	.text-gold { color: var(--gold); }
	.text-danger { color: var(--danger); }
	.text-success { color: var(--green); }

	.analytics-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: auto auto;
		gap: 2rem;
	}

	.dice-dist {
		grid-column: 1 / -1;
	}

	.analytics-card {
		background: rgba(15,13,10,0.6);
	}

	.dice-chart {
		height: 250px;
		display: grid;
		grid-template-columns: repeat(20, 1fr);
		gap: 0.5rem;
		padding: 1.5rem 1.5rem 0.5rem;
		align-items: flex-end;
	}

	.chart-col {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.bar-wrap {
		flex: 1;
		width: 100%;
		background: rgba(255,255,255,0.03);
		border-radius: 4px 4px 0 0;
		position: relative;
		display: flex;
		align-items: flex-end;
		overflow: hidden;
	}

	.bar {
		width: 100%;
		border-radius: 4px 4px 0 0;
		transition: height 0.5s cubic-bezier(0.16, 1, 0.3, 1);
		opacity: 0.7;
	}

	.chart-col:hover .bar {
		opacity: 1;
		filter: brightness(1.2);
	}

	.bar-label {
		font-size: 0.7rem;
		color: var(--muted);
		font-weight: 500;
	}

	.bar-label.highlight {
		color: var(--fg);
		font-weight: 700;
	}

	.luck-meter-wrap {
		padding: 1.5rem;
		text-align: center;
	}

	.luck-value {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	.luck-desc {
		font-size: 0.85rem;
		color: var(--muted);
		margin-bottom: 1.5rem;
	}

	.luck-bar {
		height: 8px;
		background: rgba(255,255,255,0.05);
		border-radius: 99px;
		position: relative;
		overflow: hidden;
	}

	.luck-bar::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 0; bottom: 0;
		width: 2px;
		background: rgba(255,255,255,0.2);
		z-index: 2;
	}

	.luck-fill {
		height: 100%;
		transition: width 1s ease-out;
	}

	.kills-list, .history-list {
		padding: 0.5rem 0;
	}

	.kill-item {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 1.15rem;
		border-bottom: 1px solid rgba(212,175,55,0.05);
	}

	.kill-item:last-child { border-bottom: none; }

	.enemy-name {
		font-size: 0.9rem;
		color: var(--fg);
	}

	.kill-count {
		font-weight: 700;
		color: var(--gold);
		font-variant-numeric: tabular-nums;
	}

	.history-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1.15rem;
		border-bottom: 1px solid rgba(255,255,255,0.03);
	}

	.history-icon { font-size: 1.1rem; }
	.history-type { flex: 1; font-size: 0.85rem; color: #ccc; }
	.history-time { font-size: 0.75rem; color: var(--muted); }

	.empty-msg {
		text-align: center;
		padding: 2rem;
		color: var(--muted);
		font-style: italic;
	}

	@media (max-width: 900px) {
		.analytics-grid { grid-template-columns: 1fr; }
		.dice-dist { grid-column: auto; }
		.dice-chart { height: 180px; gap: 0.2rem; }
		.bar-label { font-size: 0.55rem; }
	}
</style>
