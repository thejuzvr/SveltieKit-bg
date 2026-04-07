<script lang="ts">
	import { authClient } from '$lib/auth-client.js';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		error = '';

		const result = await authClient.signIn.email({ email, password });

		if (result.error) {
			error = result.error.message || 'Login failed';
			loading = false;
			return;
		}

		goto('/character');
	}
</script>

<svelte:head>
	<title>Enter the World — ElderScrollsIdle</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-container">
		<div class="auth-logo">
			<span class="logo-icon">⚔️</span>
			<h1 class="logo-text">ELDER SCROLLS IDLE</h1>
		</div>

		<div class="card auth-card">
			<h2>Enter the World</h2>
			<div class="divider-gold"></div>

			{#if error}
				<div class="error-banner">⚠️ {error}</div>
			{/if}

			<form onsubmit={handleLogin} class="auth-form">
				<div class="form-group">
					<label for="email" class="form-label">Email</label>
					<input
						id="email"
						type="email"
						class="input"
						bind:value={email}
						placeholder="your@email.com"
						required
						autocomplete="username"
					/>
				</div>

				<div class="form-group">
					<label for="password" class="form-label">Password</label>
					<input
						id="password"
						type="password"
						class="input"
						bind:value={password}
						placeholder="••••••••"
						required
						autocomplete="current-password"
					/>
				</div>

				<button
					type="submit"
					class="btn btn-gold w-full"
					id="btn-enter-world"
					disabled={loading}
				>
					{#if loading}
						<span class="loading-dots">◌◌◌</span>
					{:else}
						⚔️ Enter the World
					{/if}
				</button>
			</form>

			<div class="auth-footer">
				<p>New to Tamriel?</p>
				<a href="/auth/register" class="btn btn-ghost">
					📜 Create Account
				</a>
			</div>
		</div>
	</div>
</div>

<style>
.auth-page {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 2rem;
	background: radial-gradient(ellipse at center, rgba(200,160,50,0.05) 0%, transparent 70%);
}

.auth-container {
	width: 100%;
	max-width: 420px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2rem;
}

.auth-logo {
	text-align: center;
}

.logo-icon {
	font-size: 2.5rem;
	display: block;
	margin-bottom: 0.5rem;
	animation: float 3s ease-in-out infinite;
}

.logo-text {
	font-family: 'Cinzel', serif;
	font-size: 1.4rem;
	color: var(--gold-bright);
	letter-spacing: 0.1em;
	text-shadow: var(--glow-gold);
}

.auth-card {
	width: 100%;
}

.auth-card h2 {
	font-family: 'Cinzel', serif;
	font-size: 1.3rem;
	text-align: center;
	margin-bottom: 0.75rem;
}

.auth-form {
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
	margin-top: 1.25rem;
}

.form-group {
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
}

.form-label {
	font-size: 0.85rem;
	color: var(--text-secondary);
	letter-spacing: 0.05em;
	text-transform: uppercase;
	font-family: 'Cinzel', serif;
}

.error-banner {
	padding: 0.75rem 1rem;
	background: rgba(224, 80, 80, 0.12);
	border: 1px solid rgba(224, 80, 80, 0.3);
	border-radius: var(--radius-md);
	color: var(--red-health);
	font-size: 0.9rem;
	margin-bottom: 0.5rem;
}

.auth-footer {
	text-align: center;
	margin-top: 1.5rem;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.75rem;
}

.auth-footer p {
	color: var(--text-muted);
	font-size: 0.9rem;
}

.loading-dots {
	animation: blink 1s infinite;
}

@keyframes blink {
	0%, 100% { opacity: 0.3; }
	50% { opacity: 1; }
}
</style>
