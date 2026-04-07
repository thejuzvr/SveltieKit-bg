<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>ElderScrollsIdle — TES Idle RPG</title>
</svelte:head>

<main class="landing">
	<!-- Background stars -->
	<div class="stars" aria-hidden="true">
		{#each Array(80) as _, i}
			<div class="star" style="
				left: {Math.random() * 100}%;
				top: {Math.random() * 100}%;
				width: {Math.random() * 2 + 1}px;
				height: {Math.random() * 2 + 1}px;
				animation-delay: {Math.random() * 3}s;
				animation-duration: {2 + Math.random() * 3}s;
			"></div>
		{/each}
	</div>

	<!-- Dragon watermark -->
	<div class="dragon-bg" aria-hidden="true">🐉</div>

	<div class="container landing-content">
		<!-- Logo -->
		<header class="landing-header">
			<div class="logo-emblem">⚔️</div>
			<h1 class="logo-title">ELDER SCROLLS IDLE</h1>
			<p class="logo-sub">Chronicles of an Autonomous Hero</p>
		</header>

		<!-- Hero section -->
		<section class="hero-section">
			<div class="hero-text">
				<h2 class="hero-title">Your hero lives their own life</h2>
				<p class="hero-desc">
					An automated adventurer explores the vast province of Skyrim —
					fighting Draugr, drinking mead in Whiterun's tavern, joining guilds,
					fishing along the White River, and sometimes getting arrested for theft.
					All while you watch... or look away.
				</p>

				<div class="features-grid">
					<div class="feature-item">
						<span class="feature-icon">⚔️</span>
						<span>Turn-based combat</span>
					</div>
					<div class="feature-item">
						<span class="feature-icon">🗺️</span>
						<span>Explore all of Skyrim</span>
					</div>
					<div class="feature-item">
						<span class="feature-icon">🍺</span>
						<span>Tavern life & social</span>
					</div>
					<div class="feature-item">
						<span class="feature-icon">🎣</span>
						<span>Fishing & crafting</span>
					</div>
					<div class="feature-item">
						<span class="feature-icon">📜</span>
						<span>Quests & guilds</span>
					</div>
					<div class="feature-item">
						<span class="feature-icon">🌙</span>
						<span>Offline progression</span>
					</div>
				</div>
			</div>

			<!-- Auth panel -->
			<div class="auth-panel card">
				<h3 class="auth-title">Begin your journey</h3>
				<div class="divider-gold"></div>
				<div class="auth-buttons">
					<a href="/auth/login" class="btn btn-gold w-full" id="btn-login">
						⚔️ Enter the World
					</a>
					<a href="/auth/register" class="btn btn-ghost w-full" id="btn-register">
						📜 Create Account
					</a>
				</div>
				<p class="auth-note">Your hero will keep adventuring even when you log out</p>
			</div>
		</section>

		<!-- Stats strip -->
		<section class="stats-strip">
			<div class="stat-item">
				<span class="stat-num">9</span>
				<span class="stat-label">Divine Patrons</span>
			</div>
			<div class="stat-divider">|</div>
			<div class="stat-item">
				<span class="stat-num">10+</span>
				<span class="stat-label">Races</span>
			</div>
			<div class="stat-divider">|</div>
			<div class="stat-item">
				<span class="stat-num">50+</span>
				<span class="stat-label">Locations</span>
			</div>
			<div class="stat-divider">|</div>
			<div class="stat-item">
				<span class="stat-num">100+</span>
				<span class="stat-label">Enemies</span>
			</div>
		</section>
	</div>
</main>

<style>
.landing {
	min-height: 100vh;
	position: relative;
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

/* Stars */
.stars {
	position: fixed;
	inset: 0;
	pointer-events: none;
	z-index: 0;
}

.star {
	position: absolute;
	background: rgba(255, 255, 220, 0.6);
	border-radius: 50%;
	animation: twinkle var(--dur, 2s) ease-in-out infinite;
}

@keyframes twinkle {
	0%, 100% { opacity: 0.2; transform: scale(0.8); }
	50% { opacity: 1; transform: scale(1.2); }
}

/* Dragon BG */
.dragon-bg {
	position: fixed;
	bottom: -5%;
	right: -5%;
	font-size: 40vw;
	opacity: 0.025;
	pointer-events: none;
	z-index: 0;
	filter: blur(2px);
}

/* Landing content */
.landing-content {
	position: relative;
	z-index: 1;
	padding-top: 4rem;
	padding-bottom: 4rem;
}

/* Header */
.landing-header {
	text-align: center;
	margin-bottom: 4rem;
}

.logo-emblem {
	font-size: 3rem;
	display: block;
	margin-bottom: 0.5rem;
	animation: float 3s ease-in-out infinite;
}

.logo-title {
	font-family: 'Cinzel', serif;
	font-size: clamp(2rem, 5vw, 3.5rem);
	color: var(--gold-bright);
	letter-spacing: 0.15em;
	text-shadow: var(--glow-gold);
	margin-bottom: 0.5rem;
}

.logo-sub {
	color: var(--text-secondary);
	font-size: 1.1rem;
	font-style: italic;
	letter-spacing: 0.1em;
}

/* Hero */
.hero-section {
	display: grid;
	grid-template-columns: 1fr 380px;
	gap: 3rem;
	align-items: start;
	margin-bottom: 4rem;
}

@media (max-width: 900px) {
	.hero-section {
		grid-template-columns: 1fr;
	}
}

.hero-title {
	font-family: 'Cinzel', serif;
	font-size: 1.8rem;
	color: var(--gold-bright);
	margin-bottom: 1rem;
}

.hero-desc {
	font-size: 1.15rem;
	color: var(--text-secondary);
	line-height: 1.7;
	margin-bottom: 2rem;
}

.features-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.75rem;
}

.feature-item {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	padding: 0.6rem 1rem;
	background: var(--bg-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-md);
	font-size: 0.95rem;
	color: var(--text-primary);
	transition: border-color 0.2s;
}

.feature-item:hover {
	border-color: var(--border-light);
}

.feature-icon {
	font-size: 1.2rem;
}

/* Auth panel */
.auth-panel {
	position: sticky;
	top: 2rem;
}

.auth-title {
	font-family: 'Cinzel', serif;
	font-size: 1.1rem;
	color: var(--gold-bright);
	text-align: center;
	margin-bottom: 1rem;
}

.auth-buttons {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	margin: 1.25rem 0;
}

.auth-note {
	text-align: center;
	font-size: 0.82rem;
	color: var(--text-muted);
	font-style: italic;
	margin-top: 1rem;
}

/* Stats strip */
.stats-strip {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 2rem;
	padding: 1.5rem;
	background: var(--bg-card);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-xl);
}

.stat-item {
	text-align: center;
}

.stat-num {
	display: block;
	font-family: 'Cinzel', serif;
	font-size: 1.8rem;
	color: var(--gold-bright);
	font-weight: 700;
}

.stat-label {
	font-size: 0.8rem;
	color: var(--text-muted);
	text-transform: uppercase;
	letter-spacing: 0.1em;
}

.stat-divider {
	color: var(--border-light);
	font-size: 1.5rem;
}
</style>
