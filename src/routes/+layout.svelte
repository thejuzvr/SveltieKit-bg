<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { gameStore } from '$lib/stores/gameStore.svelte';
	import { onMount, onDestroy } from 'svelte';

	let { data, children } = $props();

	// Initialize store with data from server load (runs during SSR and Hydration)
	if (data.character) {
		gameStore.init(data.character, data.offlineEvents || []);
	}

	const secondsSinceUpdate = $derived(Math.floor((gameStore.now - gameStore.lastTickAt) / 1000));
	const currentPath = $derived($page.url.pathname);

	function isActive(path: string) {
		if (path === '/character') return currentPath === '/character';
		return currentPath.startsWith(path);
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
</svelte:head>

<div class="app-shell">
	{#if data.user && data.character}
		<nav class="navbar">
			<div class="navbar-left">
				<a href="/character" class="navbar-logo">
					<span class="logo-icon">⚔️</span>
					<span class="logo-text font-cinzel">Godview</span>
				</a>
				<div class="navbar-links">
					<a href="/character" class="nav-link" class:active={isActive('/character')}>🏛️ Главная</a>
					<a href="/inventory" class="nav-link" class:active={isActive('/inventory')}>🎒 Инвентарь</a>
					<a href="/map" class="nav-link" class:active={isActive('/map')}>🗺️ Карта</a>
					<a href="/quests" class="nav-link" class:active={isActive('/quests')}>📜 Квесты</a>
					<a href="/analytics" class="nav-link" class:active={isActive('/analytics')}>📈 Аналитика</a>
				</div>
			</div>
			
			<div class="navbar-right">
				<div class="ws-badge" class:online={gameStore.wsStatus === 'connected'}>
					<span class="ws-dot"></span>
					<span class="ws-label">
						{gameStore.wsStatus === 'connected' ? `Live · ${secondsSinceUpdate}с` : 'Подключение...'}
					</span>
				</div>
				<div class="user-menu">
					<a href="/profile" class="nav-link" class:active={isActive('/profile')}>👤 Профиль</a>
					<a href="/auth/logout" class="btn-logout">Выход</a>
				</div>
			</div>
		</nav>
	{/if}

	<main class="main-content" class:has-nav={data.user && data.character}>
		{@render children()}
	</main>
</div>

<style>
	:root {
		--gold: #d4af37;
		--gold-bright: #ffdf00;
		--gold-dim: rgba(212,175,55,0.12);
		--bg: #0a0a0a;
		--card: rgba(15,13,10,0.96);
		--card-border: rgba(255,255,255,0.055);
		--fg: #f0ede8;
		--muted: #888898;
		--danger: #ef4444;
		--green: #10b981;
		--radius: 0.55rem;
		--font-body: 'Inter', system-ui, sans-serif;
		--font-cinzel: 'Cinzel', serif;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		background: var(--bg);
		color: var(--fg);
		font-family: var(--font-body);
		overflow-x: hidden;
	}

	:global(*) { box-sizing: border-box; }
	:global(a) { color: inherit; text-decoration: none; }

	.app-shell {
		min-height: 100vh;
		background: radial-gradient(ellipse 90% 45% at 50% -5%, #1e0e00 0%, #0a0a0a 60%);
		display: flex;
		flex-direction: column;
	}

	.navbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.65rem 2rem;
		background: rgba(7,5,1,0.92);
		border-bottom: 1px solid rgba(212,175,55,0.16);
		backdrop-filter: blur(16px);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.navbar-left, .navbar-right {
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.navbar-logo {
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}

	.logo-icon { font-size: 1.25rem; }
	.logo-text {
		color: var(--gold);
		font-size: 0.95rem;
		letter-spacing: 0.07em;
		font-family: var(--font-cinzel);
	}

	.navbar-links {
		display: flex;
		gap: 0.15rem;
	}

	.nav-link {
		color: var(--muted);
		padding: 0.36rem 0.8rem;
		border-radius: var(--radius);
		font-size: 0.86rem;
		transition: all 0.2s;
	}

	.nav-link:hover {
		color: var(--fg);
		background: rgba(255,255,255,0.05);
	}

	.nav-link.active {
		color: var(--gold);
		background: var(--gold-dim);
	}

	.ws-badge {
		display: flex;
		align-items: center;
		gap: 0.38rem;
		font-size: 0.77rem;
		color: var(--muted);
	}

	.ws-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #4b5563;
		flex-shrink: 0;
	}

	.ws-badge.online .ws-dot {
		background: var(--green);
		box-shadow: 0 0 5px var(--green);
		animation: glow 2s infinite;
	}

	.ws-badge.online { color: var(--green); }

	.btn-logout {
		padding: 0.3rem 0.72rem;
		border-radius: var(--radius);
		border: 1px solid rgba(255,255,255,0.1);
		color: var(--muted);
		font-size: 0.8rem;
		transition: all 0.2s;
		margin-left: 0.5rem;
	}

	.btn-logout:hover {
		border-color: var(--danger);
		color: #fca5a5;
	}

	@keyframes glow {
		0%, 100% { opacity: 0.6; }
		50% { opacity: 1; }
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.font-cinzel { font-family: var(--font-cinzel); }
</style>
