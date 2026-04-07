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
			case 'day': return 'День';
			case 'evening': return 'Вечер';
			case 'night': return 'Ночь';
			default: return 'День';
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

<div class="status-bar">
	<div class="group clock">
		<span class="icon">{timeOfDay === 'night' || timeOfDay === 'evening' ? '🌙' : '☀️'}</span>
		<span class="label text-gold">{timeDisplay}</span>
		<span class="separator">·</span>
		<span class="date">{formattedDate}</span>
	</div>

	<div class="group weather">
		<span class="icon">{weatherIcon}</span>
		<span class="label">{weather}</span>
		<span class="season">{season}</span>
	</div>
</div>

<style>
	.status-bar {
		display: flex;
		align-items: center;
		gap: 2rem;
		background: rgba(15, 13, 10, 0.6);
		border: 1px solid rgba(212, 175, 55, 0.15);
		padding: 0.6rem 1.2rem;
		border-radius: var(--radius, 8px);
		backdrop-filter: blur(8px);
		font-size: 0.9rem;
		color: var(--muted, #888);
		width: fit-content;
	}

	.group {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.icon {
		font-size: 1.1rem;
		filter: drop-shadow(0 0 5px rgba(212, 175, 55, 0.2));
	}

	.label {
		font-family: var(--font-cinzel, serif);
		font-weight: 700;
		letter-spacing: 0.05em;
	}

	.text-gold {
		color: var(--gold, #d4af37);
	}

	.separator {
		opacity: 0.3;
		padding: 0 0.2rem;
	}

	.date {
		font-size: 0.8rem;
		opacity: 0.8;
	}

	.season {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		opacity: 0.6;
		margin-left: 0.4rem;
	}

	@media (max-width: 640px) {
		.status-bar {
			gap: 1rem;
			flex-wrap: wrap;
			padding: 0.5rem 1rem;
		}
	}
</style>
