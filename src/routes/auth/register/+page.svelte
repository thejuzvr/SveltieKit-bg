<script lang="ts">
	import { authClient } from '$lib/auth-client.js';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleRegister(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		error = '';

		const result = await authClient.signUp.email({
			email,
			password,
			name: email.split('@')[0]
		});

		if (result.error) {
			error = result.error.message || 'Registration failed';
			loading = false;
			return;
		}

		goto('/character/create');
	}
</script>

<svelte:head>
	<title>Create Account — ElderScrollsIdle</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-container">
		<div class="auth-logo">
			<span class="logo-icon">📜</span>
			<h1 class="logo-text">ELDER SCROLLS IDLE</h1>
			<p class="logo-sub">Your legend begins here</p>
		</div>

		<div class="card auth-card">
			<h2>Create Account</h2>
			<div class="divider-gold"></div>

			{#if error}
				<div class="error-banner">⚠️ {error}</div>
			{/if}

			<form onsubmit={handleRegister} class="auth-form">
				<div class="form-group">
					<label for="reg-email" class="form-label">Email</label>
					<input
						id="reg-email"
						type="email"
						class="input"
						bind:value={email}
						placeholder="your@email.com"
						required
						autocomplete="username"
					/>
				</div>

				<div class="form-group">
					<label for="reg-password" class="form-label">Password</label>
					<input
						id="reg-password"
						type="password"
						class="input"
						bind:value={password}
						placeholder="Min 8 characters"
						minlength="8"
						required
						autocomplete="new-password"
					/>
				</div>

				<button
					type="submit"
					class="btn btn-gold w-full"
					id="btn-create-account"
					disabled={loading}
				>
					{#if loading}
						<span>Creating your fate...</span>
					{:else}
						📜 Begin Your Legend
					{/if}
				</button>
			</form>

			<div class="auth-footer">
				<p>Already have a hero?</p>
				<a href="/auth/login" class="btn btn-ghost">
					⚔️ Enter the World
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
	background: radial-gradient(ellipse at center, rgba(80,80,200,0.05) 0%, transparent 70%);
}

.auth-container {
	width: 100%;
	max-width: 420px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2rem;
}

.auth-logo { text-align: center; }

.logo-icon {
	font-size: 2.5rem;
	display: block;
	margin-bottom: 0.5rem;
}

.logo-text {
	font-family: 'Cinzel', serif;
	font-size: 1.4rem;
	color: var(--gold-bright);
	letter-spacing: 0.1em;
	text-shadow: var(--glow-gold);
}

.logo-sub {
	color: var(--text-muted);
	font-style: italic;
	font-size: 0.9rem;
	margin-top: 0.25rem;
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
</style>
