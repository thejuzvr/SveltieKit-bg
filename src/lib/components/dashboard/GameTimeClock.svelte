<script lang="ts">
	import type { TimeOfDay, Weather, Season } from '$lib/types/character';

	let {
		timeOfDay = 'morning',
		weather = 'Clear',
		season = 'Summer',
		gameDate = Date.now()
	} = $props<{
		timeOfDay?: TimeOfDay;
		weather?: Weather;
		season?: Season;
		gameDate?: number;
	}>();

	let timeDisplay = $derived((() => {
		switch (timeOfDay) {
			case 'morning': return 'Утро';
			case 'afternoon': return 'День';
			case 'evening': return 'Вечер';
			case 'night': return 'Ночь';
			default: return 'Неизвестно';
		}
	})());

	let weatherIcon = $derived((() => {
		switch (weather) {
			case 'Clear': return '☀️';
			case 'Cloudy': return '☁️';
			case 'Rain': return '🌧️';
			case 'Storm': return '⛈️';
			case 'Snow': return '❄️';
			case 'Fog': return '🌫️';
			default: return '☀️';
		}
	})());

	let weatherEffect = $derived((() => {
		switch (weather) {
			case 'Rain': return 'Дождь замедляет передвижение.';
			case 'Storm': return 'Свирепая буря. Шанс засады снижен.';
			case 'Snow': return 'Холод замедляет регенерацию сил.';
			case 'Fog': return 'Трудно ориентироваться. Меткость снижена.';
			default: return 'Спокойная погода.';
		}
	})());

	// TES Months (Lore flavor)
	const months = [
		"Morning Star", "Sun's Dawn", "First Seed", "Rain's Hand",
		"Second Seed", "Midyear", "Sun's Height", "Last Seed",
		"Hearthfire", "Frostfall", "Sun's Dusk", "Evening Star"
	];

	let formattedDate = $derived((() => {
		const d = new Date(gameDate);
		const day = d.getDate();
		const monthIndex = d.getMonth();
		return `${day} ${months[monthIndex]}`;
	})());
</script>

<div class="widget-container">
	<!-- Clock Section -->
	<div class="clock-section">
		<div class="icon-ring">
			{#if timeOfDay === 'night' || timeOfDay === 'evening'}
				<span class="celestial-icon">🌙</span>
			{:else}
				<span class="celestial-icon">☀️</span>
			{/if}
		</div>
		<div class="time-details">
			<h3 class="time-title">{timeDisplay}</h3>
			<p class="date-text">{formattedDate}</p>
			<p class="season-text">{season}</p>
		</div>
	</div>

	<hr class="gilded-divider" />

	<!-- Weather Section -->
	<div class="weather-section">
		<div class="weather-header">
			<span class="weather-icon">{weatherIcon}</span>
			<span class="weather-title">{weather}</span>
		</div>
		<p class="weather-effect">{weatherEffect}</p>
	</div>
</div>

<style>
	.widget-container {
		background: var(--surface, #131313);
		border: 1px solid var(--outline-variant, rgba(153, 144, 124, 0.15));
		padding: 1.5rem;
		border-radius: 0; /* Intentional brutalism */
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
		min-width: 280px;
		color: var(--on-surface, #e5e2e1);
		position: relative;
		overflow: hidden;
	}

	.widget-container::before {
		content: '';
		position: absolute;
		top: 0; left: 0; right: 0; height: 2px;
		background: linear-gradient(90deg, transparent, var(--primary, #d4af37), transparent);
		opacity: 0.5;
	}

	.clock-section {
		display: flex;
		align-items: center;
		gap: 1.2rem;
	}

	.icon-ring {
		width: 50px;
		height: 50px;
		border: 1px solid var(--primary-container, #554300);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		background: radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%);
		box-shadow: 0 0 15px rgba(212, 175, 55, 0.05);
	}

	.time-title {
		font-family: var(--font-cinzel, serif);
		font-size: 1.4rem;
		margin: 0 0 0.2rem 0;
		color: var(--primary, #f2ca50);
		letter-spacing: 0.05em;
	}

	.date-text {
		font-family: var(--font-body, serif);
		font-size: 0.9rem;
		margin: 0;
		color: var(--on-surface-variant, #d0c5af);
	}

	.season-text {
		font-family: var(--font-label, sans-serif);
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--muted, #888);
		margin: 0.2rem 0 0 0;
	}

	.gilded-divider {
		border: none;
		height: 1px;
		background: linear-gradient(90deg, transparent, var(--outline-variant, #4d4635), transparent);
		margin: 0;
	}

	.weather-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.weather-header {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.weather-icon {
		font-size: 1.2rem;
	}

	.weather-title {
		font-family: var(--font-cinzel, serif);
		font-size: 1.1rem;
		font-weight: bold;
	}

	.weather-effect {
		font-family: var(--font-body, serif);
		font-size: 0.85rem;
		color: var(--on-surface-variant, #d0c5af);
		margin: 0;
		line-height: 1.4;
		opacity: 0.8;
	}
</style>
