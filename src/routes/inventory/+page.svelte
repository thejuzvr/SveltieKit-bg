<script lang="ts">
	import { gameStore } from '$lib/stores/gameStore.svelte';
	import type { CharacterInventoryItem } from '$lib/types/character';

	const character = $derived(gameStore.character);
	const inventory = $derived(character?.inventory || []);
	
	let activeFilter = $state<'all' | 'weapon' | 'armor' | 'potion' | 'misc'>('all');

	const filteredItems = $derived(
		activeFilter === 'all' 
			? inventory 
			: inventory.filter(i => {
				if (activeFilter === 'potion') return i.type === 'potion' || i.type === 'food';
				return i.type === activeFilter;
			})
	);

	const totalWeight = $derived(
		inventory.reduce((sum, item) => sum + (item.weight * (item.quantity || 1)), 0)
	);
	
	const maxWeight = $derived(character ? 100 + (character.attributes.strength || 0) * 10 : 100);
	const weightPercent = $derived(Math.min(100, (totalWeight / maxWeight) * 100));

	const rarityColors: Record<string, string> = {
		common: '#9ca3af',
		uncommon: '#10b981',
		rare: '#3b82f6',
		epic: '#a855f7',
		legendary: '#f59e0b'
	};

	function getItemIcon(item: any) {
		switch (item.type) {
			case 'weapon': return '⚔️';
			case 'armor': return '🛡️';
			case 'potion': return '🧪';
			case 'food': return '🍞';
			case 'gold': return '💰';
			case 'spell_tome': return '📖';
			case 'learning_book': return '📚';
			case 'key_item': return '🔑';
			default: return '📦';
		}
	}
</script>

{#if character}
<div class="inventory-page container">
	<header class="page-header">
		<h1 class="font-cinzel">🎒 Инвентарь</h1>
		<div class="weight-status">
			<div class="weight-labels">
				<span>Вес: {totalWeight.toFixed(1)} / {maxWeight} кг</span>
				{#if totalWeight > maxWeight}
					<span class="overencumbered-label">⚠️ Перегруз!</span>
				{/if}
			</div>
			<div class="weight-bar-bg">
				<div 
					class="weight-bar-fill" 
					style="width: {weightPercent}%"
					class:danger={totalWeight > maxWeight}
					class:warning={weightPercent > 80}
				></div>
			</div>
		</div>
	</header>

	<div class="inventory-layout">
		<!-- Sidebar Filters -->
		<aside class="filters-sidebar">
			<button 
				class="filter-btn" 
				class:active={activeFilter === 'all'} 
				onclick={() => activeFilter = 'all'}
			>🏷️ Все</button>
			<button 
				class="filter-btn" 
				class:active={activeFilter === 'weapon'} 
				onclick={() => activeFilter = 'weapon'}
			>⚔️ Оружие</button>
			<button 
				class="filter-btn" 
				class:active={activeFilter === 'armor'} 
				onclick={() => activeFilter = 'armor'}
			>🛡️ Броня</button>
			<button 
				class="filter-btn" 
				class:active={activeFilter === 'potion'} 
				onclick={() => activeFilter = 'potion'}
			>🧪 Алхимия / Еда</button>
			<button 
				class="filter-btn" 
				class:active={activeFilter === 'misc'} 
				onclick={() => activeFilter = 'misc'}
			>📦 Разное</button>
		</aside>

		<!-- Items Grid -->
		<main class="items-grid-container">
			{#if filteredItems.length === 0}
				<div class="empty-state">
					<p>Здесь пока ничего нет...</p>
				</div>
			{:else}
				<div class="items-grid">
					{#each filteredItems as item}
						<div class="item-card rarity-{item.rarity || 'common'}">
							<div class="item-header">
								<span class="item-icon">{getItemIcon(item)}</span>
								{#if item.quantity > 1}
									<span class="item-qty">x{item.quantity}</span>
								{/if}
							</div>
							<div class="item-info">
								<h3 class="item-name">{item.name}</h3>
								<div class="item-stats">
									<span>⚖️ {item.weight} кг</span>
									{#if item.damage}<span>⚔️ {item.damage}</span>{/if}
									{#if item.armor}<span>🛡️ {item.armor}</span>{/if}
								</div>
							</div>
							<div class="rarity-indicator" style="background: {rarityColors[item.rarity || 'common']}"></div>
						</div>
					{/each}
				</div>
			{/if}
		</main>
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
		align-items: flex-end;
		margin-bottom: 2.5rem;
		gap: 2rem;
	}

	.page-header h1 {
		margin: 0;
		font-size: 2.2rem;
		color: var(--gold);
		text-shadow: 0 0 15px rgba(212, 175, 55, 0.3);
	}

	.weight-status {
		flex: 1;
		max-width: 400px;
	}

	.weight-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.85rem;
		color: var(--muted);
		margin-bottom: 0.5rem;
	}

	.overencumbered-label {
		color: var(--danger);
		font-weight: 700;
		animation: pulse 2s infinite;
	}

	.weight-bar-bg {
		height: 8px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 4px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.weight-bar-fill {
		height: 100%;
		background: var(--gold);
		transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.weight-bar-fill.warning { background: #f59e0b; }
	.weight-bar-fill.danger { background: var(--danger); box-shadow: 0 0 10px rgba(239, 68, 68, 0.5); }

	.inventory-layout {
		display: grid;
		grid-template-columns: 240px 1fr;
		gap: 2.5rem;
	}

	.filters-sidebar {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-btn {
		text-align: left;
		padding: 0.8rem 1.2rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--card-border);
		border-radius: var(--radius);
		color: var(--muted);
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.9rem;
	}

	.filter-btn:hover {
		background: rgba(255, 255, 255, 0.06);
		color: var(--fg);
	}

	.filter-btn.active {
		background: var(--gold-dim);
		border-color: var(--gold);
		color: var(--gold);
	}

	.items-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 1rem;
	}

	.item-card {
		background: var(--card);
		border: 1px solid var(--card-border);
		border-radius: var(--radius);
		padding: 1rem;
		position: relative;
		overflow: hidden;
		transition: transform 0.2s, border-color 0.2s;
		cursor: default;
	}

	.item-card:hover {
		transform: translateY(-3px);
		border-color: rgba(212, 175, 55, 0.3);
		background: rgba(255, 255, 255, 0.05);
	}

	.item-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.item-icon {
		font-size: 1.5rem;
	}

	.item-qty {
		font-size: 0.7rem;
		background: rgba(0,0,0,0.5);
		padding: 0.1rem 0.4rem;
		border-radius: 99px;
		color: var(--gold-bright);
		border: 1px solid rgba(212, 175, 55, 0.2);
	}

	.item-name {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--fg);
		line-height: 1.3;
		margin-bottom: 0.5rem;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.item-stats {
		display: flex;
		gap: 0.75rem;
		font-size: 0.7rem;
		color: var(--muted);
	}

	.rarity-indicator {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 3px;
		opacity: 0.6;
	}

	.empty-state {
		text-align: center;
		padding: 4rem;
		color: var(--muted);
		background: rgba(255, 255, 255, 0.02);
		border: 1px dashed var(--card-border);
		border-radius: var(--radius);
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}

	@media (max-width: 800px) {
		.inventory-layout {
			grid-template-columns: 1fr;
		}
		.page-header {
			flex-direction: column;
			align-items: flex-start;
		}
		.weight-status {
			max-width: none;
			width: 100%;
		}
	}
</style>
