<script lang="ts">
	import { gameStore } from '$lib/stores/gameStore.svelte';
	import { initialLocations } from '$lib/data/locations';
	
	const character = $derived(gameStore.character);
	const currentLocId = $derived(character?.location);
	
	const visitedLocations = $derived(character?.visitedLocations || []);
	
	function isDiscovered(locId: string) {
		const loc = initialLocations.find(l => l.id === locId);
		if (!loc) return false;
		if (loc.isStartingLocation) return true;
		if (!character) return false;
		return visitedLocations.includes(locId);
	}

	let hoveredLoc = $state<string | null>(null);
</script>

{#if character}
<div class="map-page container">
	<header class="page-header">
		<h1 class="font-cinzel">🗺️ Карта Скайрима</h1>
		<div class="map-stats">
			<span>Открыто локаций: {visitedLocations.length} / {initialLocations.length}</span>
			<span class="current-region">Текущее место: <strong>{initialLocations.find(l => l.id === currentLocId)?.name || currentLocId}</strong></span>
		</div>
	</header>

	<div class="map-container-wrapper">
		<div class="map-canvas">
			<!-- Background Map Texture/Image -->
			<div class="map-background"></div>
			
			<!-- Grid lines for flavor -->
			<div class="map-grid"></div>

			<!-- Location Markers -->
			{#each initialLocations as loc}
				{@const discovered = isDiscovered(loc.id)}
				{@const active = loc.id === currentLocId}
				
				<div 
					class="map-marker loc-type-{loc.type}" 
					role="button"
					tabindex="0"
					aria-label={discovered ? loc.name : 'Неизвестная локация'}
					class:discovered={discovered}
					class:active={active}
					class:hovered={hoveredLoc === loc.id}
					style="left: {loc.coords.x}%; top: {loc.coords.y}%;"
					onmouseenter={() => hoveredLoc = loc.id}
					onmouseleave={() => hoveredLoc = null}
					onfocus={() => hoveredLoc = loc.id}
					onblur={() => hoveredLoc = null}
					onkeydown={(e) => { if (e.key === 'Enter') hoveredLoc = loc.id; }}
				>
					<div class="marker-dot"></div>
					<div class="marker-label font-cinzel">
						{discovered ? loc.name : '???'}
					</div>
					
					{#if discovered && hoveredLoc === loc.id}
						<div class="marker-popup card">
							<div class="popup-header">
								<span class="popup-icon">
									{#if loc.type === 'city'}🏛️
									{:else if loc.type === 'town'}🏡
									{:else if loc.type === 'ruin'}💀
									{:else}📍{/if}
								</span>
								<strong>{loc.name}</strong>
							</div>
							<div class="popup-content">
								<p>{loc.type === 'city' ? 'Крупный город' : 'Поселение'}</p>
								{#if !loc.isSafe}
									<p class="text-danger">⚠️ Опасно (Ур. {loc.dangerLevel || '??'})</p>
								{:else}
									<p class="text-success">✅ Безопасно</p>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Legend -->
		<aside class="map-legend card">
			<h3 class="font-cinzel">Легенда</h3>
			<div class="legend-item">
				<div class="marker-dot city"></div>
				<span>Город</span>
			</div>
			<div class="legend-item">
				<div class="marker-dot town"></div>
				<span>Поселение</span>
			</div>
			<div class="legend-item">
				<div class="marker-dot outskirts"></div>
				<span>Окрестности</span>
			</div>
			<div class="legend-item">
				<div class="marker-dot ruin"></div>
				<span>Руины / Подземелья</span>
			</div>
			<hr class="legend-sep" />
			<div class="legend-item">
				<div class="marker-dot active pulse"></div>
				<span>Текущая позиция</span>
			</div>
			<div class="legend-item">
				<div class="marker-dot unknown"></div>
				<span>Неизвестно</span>
			</div>
		</aside>
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
		margin-bottom: 2rem;
	}

	.page-header h1 {
		margin: 0;
		font-size: 2.2rem;
		color: var(--gold);
	}

	.map-stats {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		font-size: 0.9rem;
		color: var(--muted);
		gap: 0.3rem;
	}

	.current-region strong { color: var(--gold-bright); }

	.map-container-wrapper {
		display: grid;
		grid-template-columns: 1fr 220px;
		gap: 2rem;
		height: 700px;
	}

	.map-canvas {
		background: #111;
		border: 2px solid rgba(212, 175, 55, 0.2);
		border-radius: var(--radius);
		position: relative;
		overflow: hidden;
		box-shadow: inset 0 0 100px rgba(0,0,0,0.8);
	}

	.map-background {
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at center, #1b1610 0%, #0a0a0a 100%);
		opacity: 0.8;
	}

	.map-grid {
		position: absolute;
		inset: 0;
		background-image: 
			linear-gradient(rgba(212, 175, 55, 0.03) 1px, transparent 1px),
			linear-gradient(90deg, rgba(212, 175, 55, 0.03) 1px, transparent 1px);
		background-size: 50px 50px;
	}

	.map-marker {
		position: absolute;
		transform: translate(-50%, -50%);
		z-index: 5;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		transition: all 0.3s;
	}

	.marker-dot {
		width: 10px;
		height: 10px;
		background: #444;
		border-radius: 50%;
		border: 2px solid rgba(255,255,255,0.1);
		transition: all 0.3s;
	}

	.map-marker.discovered:not(.active) .marker-dot {
		background: #888;
		border-color: #fff;
	}

	.map-marker.discovered.loc-type-city .marker-dot {
		width: 14px; height: 14px;
		background: var(--gold);
		box-shadow: 0 0 10px rgba(212, 175, 55, 0.4);
	}

	.map-marker.active .marker-dot {
		background: #fff;
		box-shadow: 0 0 15px #fff, 0 0 30px var(--gold);
		transform: scale(1.3);
		animation: pulse-border 2s infinite;
	}

	.marker-label {
		font-size: 0.65rem;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
		text-shadow: 0 1px 3px rgba(0,0,0,0.8);
		opacity: 0.6;
	}

	.map-marker.discovered .marker-label {
		color: #ccc;
		opacity: 1;
	}
	
	.map-marker.active .marker-label {
		color: var(--gold-bright);
		font-weight: 700;
		font-size: 0.75rem;
	}

	@keyframes pulse-border {
		0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
		70% { box-shadow: 0 0 0 15px rgba(255, 255, 255, 0); }
		100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
	}

	.marker-popup {
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%) translateY(-10px);
		min-width: 160px;
		padding: 0.75rem;
		z-index: 20;
		pointer-events: none;
		border: 1px solid var(--gold);
		background: rgba(10,10,10,0.95);
	}

	.popup-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		border-bottom: 1px solid rgba(255,255,255,0.1);
		padding-bottom: 0.4rem;
		margin-bottom: 0.4rem;
	}

	.popup-content p {
		margin: 0.2rem 0;
		font-size: 0.75rem;
		color: var(--muted);
	}

	.text-danger { color: #f87171; }
	.text-success { color: #4ade80; }

	/* Legend Styles */
	.map-legend {
		padding: 1.2rem;
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		background: rgba(15,13,10,0.6);
	}

	.map-legend h3 {
		font-size: 1rem;
		margin: 0 0 0.5rem;
		color: var(--gold);
		border-bottom: 1px solid var(--gold-dim);
		padding-bottom: 0.5rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: var(--muted);
	}

	.legend-item .marker-dot.city { background: var(--gold); }
	.legend-item .marker-dot.town { background: #888; border-color: #fff; }
	.legend-item .marker-dot.outskirts { background: #444; border: 1px solid rgba(255,255,255,0.2); }
	.legend-item .marker-dot.ruin { background: #ef4444; border-color: #000; }
	.legend-item .marker-dot.active { background: #fff; box-shadow: 0 0 8px var(--gold); }
	.legend-item .marker-dot.unknown { background: transparent; border: 1px dashed #444; }

	.pulse { animation: pulse 2s infinite; }
	@keyframes pulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.3); }
	}

	.legend-sep {
		border: none;
		border-top: 1px solid rgba(255,255,255,0.05);
		margin: 0.5rem 0;
	}

	@media (max-width: 1000px) {
		.map-container-wrapper {
			grid-template-columns: 1fr;
			height: auto;
		}
		.map-canvas {
			height: 500px;
		}
	}
</style>
