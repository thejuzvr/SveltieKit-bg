<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	// Character choices
	const RACES = [
		{ id: 'nord', name: 'Nord', icon: '🪓', desc: 'Child of the Sky. Natural resistance to cold, fierce in battle.' },
		{ id: 'imperial', name: 'Imperial', icon: '⚖️', desc: 'Skilled diplomats and traders. Natural born leaders.' },
		{ id: 'dunmer', name: 'Dark Elf', icon: '🔥', desc: 'Masters of fire magic and stealth. Mysterious outlanders.' },
		{ id: 'altmer', name: 'High Elf', icon: '✨', desc: 'Supreme mages with vast knowledge of arcane arts.' },
		{ id: 'argonian', name: 'Argonian', icon: '🐊', desc: 'Swamp-born survivors. Disease immune, amphibious.' },
		{ id: 'khajiit', name: 'Khajiit', icon: '🐱', desc: 'Desert cats with sharp claws and sharper wits.' },
		{ id: 'bosmer', name: 'Wood Elf', icon: '🏹', desc: 'Forest hunters with uncanny archery skills.' },
		{ id: 'orsimer', name: 'Orc', icon: '💪', desc: 'Berserkers born in strongholds. Fiercest warriors.' },
		{ id: 'redguard', name: 'Redguard', icon: '⚔️', desc: 'Master swordsmen from the Alik\'r desert.' },
		{ id: 'breton', name: 'Breton', icon: '🛡️', desc: 'Half-Elven scholars with innate magic resistance.' }
	];

	const DEITIES = [
		{ id: 'talos', name: 'Talos', icon: '⚡', bonus: '+Combat power, warrior blessings' },
		{ id: 'mara', name: 'Mara', icon: '💛', bonus: '+Health regen, social bonuses' },
		{ id: 'dibella', name: 'Dibella', icon: '🌹', bonus: '+Charm, better NPC relations' },
		{ id: 'arkay', name: 'Arkay', icon: '⚰️', bonus: '+Max health, death protection' },
		{ id: 'julianos', name: 'Julianos', icon: '📚', bonus: '+Magicka, learning speed' },
		{ id: 'kynareth', name: 'Kynareth', icon: '🌬️', bonus: '+Stamina, travel speed' },
		{ id: 'stendarr', name: 'Stendarr', icon: '🛡️', bonus: '+Armor, undead protection' },
		{ id: 'zenithar', name: 'Zenithar', icon: '💰', bonus: '+Gold finds, trading prices' },
		{ id: 'akatosh', name: 'Akatosh', icon: '🐉', bonus: '+XP gain, dragon blessing' }
	];

	const BACKSTORIES = [
		'Former soldier who deserted after a massacre',
		'Orphan raised by a wandering merchant',
		'Scholar expelled from the College of Winterhold',
		'Ex-bandit seeking redemption',
		'Noble fallen from grace, stripped of titles',
		'Farmhand who found an ancient amulet and heard its call',
		'Escaped prisoner with a mysterious past',
		'Traveling bard with a dark secret'
	];

	let step = $state(1);
	let name = $state('');
	let gender = $state<'male' | 'female'>('male');
	let race = $state('nord');
	let patronDeity = $state('talos');
	let backstory = $state(BACKSTORIES[0]);
	let customBackstory = $state(false);

	let error = $state('');
	let loading = $state(false);

	function nextStep() {
		if (step === 1 && !name.trim()) {
			error = 'Your hero needs a name';
			return;
		}
		error = '';
		step++;
	}

	async function createCharacter() {
		loading = true;
		error = '';

		const res = await fetch('/api/character', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: name.trim(), gender, race, patronDeity, backstory })
		});

		const result = await res.json();

		if (!res.ok || result.error) {
			error = result.error || 'Failed to create character';
			loading = false;
			return;
		}

		goto('/character');
	}

	const selectedRace = $derived(RACES.find(r => r.id === race));
	const selectedDeity = $derived(DEITIES.find(d => d.id === patronDeity));
</script>

<svelte:head>
	<title>Create Your Hero — ElderScrollsIdle</title>
</svelte:head>

<div class="create-page">
	<div class="create-container">
		<div class="create-header">
			<h1>Forge Your Destiny</h1>
			<p class="text-secondary">Choose wisely — your hero will live this life</p>
		</div>

		<!-- Steps indicator -->
		<div class="steps-indicator">
			{#each [1, 2, 3] as s}
				<div class="step-dot" class:active={step === s} class:done={step > s}>
					{step > s ? '✓' : s}
				</div>
				{#if s < 3}
					<div class="step-line" class:done={step > s}></div>
				{/if}
			{/each}
		</div>

		{#if error}
			<div class="error-banner">⚠️ {error}</div>
		{/if}

		<!-- Step 1: Name & Gender -->
		{#if step === 1}
			<div class="step-content card">
				<h2>Who are you?</h2>
				<div class="divider-gold"></div>

				<div class="form-group">
					<label for="char-name" class="form-label">Hero's Name</label>
					<input
						id="char-name"
						type="text"
						class="input"
						bind:value={name}
						placeholder="Enter a name worthy of legend..."
						maxlength="30"
					/>
				</div>

				<div class="form-group">
					<span class="form-label">Gender</span>
					<div class="gender-picker">
						<button
							type="button"
							class="gender-btn"
							class:active={gender === 'male'}
							onclick={() => gender = 'male'}
							id="btn-gender-male"
						>
							♂ Male
						</button>
						<button
							type="button"
							class="gender-btn"
							class:active={gender === 'female'}
							onclick={() => gender = 'female'}
							id="btn-gender-female"
						>
							♀ Female
						</button>
					</div>
				</div>

				<button class="btn btn-gold" onclick={nextStep} id="btn-step1-next">
					Continue →
				</button>
			</div>

		<!-- Step 2: Race & Deity -->
		{:else if step === 2}
			<div class="step-content card">
				<h2>Choose your blood</h2>
				<div class="divider-gold"></div>

				<div class="form-group">
					<span class="form-label">Race</span>
					<div class="race-grid">
						{#each RACES as r}
							<button
								type="button"
								class="race-btn"
								class:active={race === r.id}
								onclick={() => race = r.id}
								id="btn-race-{r.id}"
								title={r.desc}
							>
								<span class="race-icon">{r.icon}</span>
								<span class="race-name">{r.name}</span>
							</button>
						{/each}
					</div>
					{#if selectedRace}
						<p class="race-desc">{selectedRace.desc}</p>
					{/if}
				</div>

				<div class="form-group">
					<span class="form-label">Patron Deity</span>
					<div class="deity-list">
						{#each DEITIES as d}
							<button
								type="button"
								class="deity-btn"
								class:active={patronDeity === d.id}
								onclick={() => patronDeity = d.id}
								id="btn-deity-{d.id}"
							>
								<span>{d.icon}</span>
								<span class="deity-name">{d.name}</span>
								<span class="deity-bonus">{d.bonus}</span>
							</button>
						{/each}
					</div>
				</div>

				<div class="step-nav">
					<button class="btn btn-ghost" onclick={() => step--}>← Back</button>
					<button class="btn btn-gold" onclick={nextStep} id="btn-step2-next">Continue →</button>
				</div>
			</div>

		<!-- Step 3: Backstory & Confirm -->
		{:else if step === 3}
			<div class="step-content card">
				<h2>Your story so far</h2>
				<div class="divider-gold"></div>

				<div class="form-group">
					<span class="form-label">Backstory</span>
					{#if !customBackstory}
						<div class="backstory-list">
							{#each BACKSTORIES as bs}
								<button
									type="button"
									class="backstory-btn"
									class:active={backstory === bs}
									onclick={() => backstory = bs}
								>
									{bs}
								</button>
							{/each}
						</div>
						<button type="button" class="btn btn-ghost" onclick={() => customBackstory = true}>
							✍️ Write your own
						</button>
					{:else}
						<textarea
							class="input"
							rows="4"
							bind:value={backstory}
							placeholder="Write your hero's backstory..."
							maxlength="500"
						></textarea>
						<button type="button" class="btn btn-ghost" onclick={() => customBackstory = false}>
							← Use preset
						</button>
					{/if}
				</div>

				<!-- Preview -->
				<div class="char-preview">
					<div class="preview-avatar">{selectedRace?.icon}</div>
					<div class="preview-info">
						<h3 class="preview-name">{name || 'Hero'}</h3>
						<p class="preview-race">{gender === 'male' ? '♂' : '♀'} {selectedRace?.name}</p>
						<p class="preview-deity">🙏 {selectedDeity?.name}</p>
					</div>
				</div>

				<div class="step-nav">
					<button class="btn btn-ghost" onclick={() => step--}>← Back</button>
					<button
						class="btn btn-gold"
						onclick={createCharacter}
						disabled={loading}
						id="btn-create-hero"
					>
						{#if loading}
							Creating legend...
						{:else}
							⚔️ Begin Adventure
						{/if}
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
.create-page {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 2rem;
}

.create-container {
	width: 100%;
	max-width: 680px;
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

.create-header {
	text-align: center;
}

.create-header h1 {
	font-size: 2rem;
	color: var(--gold-bright);
	text-shadow: var(--glow-gold);
}

/* Steps */
.steps-indicator {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0;
}

.step-dot {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-family: 'Cinzel', serif;
	font-size: 0.85rem;
	border: 2px solid var(--border-subtle);
	color: var(--text-muted);
	transition: all 0.3s;
}

.step-dot.active {
	border-color: var(--gold-bright);
	color: var(--gold-bright);
	box-shadow: var(--glow-gold);
}

.step-dot.done {
	background: var(--gold-dark);
	border-color: var(--gold-dark);
	color: var(--bg-void);
}

.step-line {
	flex: 1;
	height: 2px;
	background: var(--border-subtle);
	max-width: 80px;
	transition: background 0.3s;
}

.step-line.done { background: var(--gold-dark); }

/* Step content */
.step-content h2 {
	font-size: 1.3rem;
	margin-bottom: 0.5rem;
}

/* Gender picker */
.gender-picker {
	display: flex;
	gap: 1rem;
}

.gender-btn {
	flex: 1;
	padding: 0.75rem;
	background: var(--bg-deep);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-md);
	color: var(--text-secondary);
	font-family: 'Cinzel', serif;
	font-size: 0.95rem;
	cursor: pointer;
	transition: all 0.2s;
}

.gender-btn.active {
	border-color: var(--gold-bright);
	color: var(--gold-bright);
	background: rgba(200, 160, 50, 0.1);
}

/* Race grid */
.race-grid {
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: 0.5rem;
	margin-bottom: 0.75rem;
}

.race-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.25rem;
	padding: 0.6rem 0.4rem;
	background: var(--bg-deep);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-md);
	cursor: pointer;
	transition: all 0.2s;
}

.race-btn.active {
	border-color: var(--gold-bright);
	background: rgba(200, 160, 50, 0.1);
}

.race-icon { font-size: 1.5rem; }

.race-name {
	font-size: 0.7rem;
	color: var(--text-secondary);
	font-family: 'Cinzel', serif;
}

.race-btn.active .race-name { color: var(--gold-bright); }

.race-desc {
	font-size: 0.88rem;
	color: var(--text-muted);
	font-style: italic;
	padding: 0.5rem;
	background: rgba(255,255,255,0.03);
	border-radius: var(--radius-sm);
}

/* Deity list */
.deity-list {
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
	max-height: 280px;
	overflow-y: auto;
}

.deity-btn {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.6rem 1rem;
	background: var(--bg-deep);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-sm);
	cursor: pointer;
	text-align: left;
	transition: all 0.2s;
	width: 100%;
}

.deity-btn.active {
	border-color: var(--gold-bright);
	background: rgba(200, 160, 50, 0.08);
}

.deity-name {
	font-family: 'Cinzel', serif;
	font-size: 0.9rem;
	color: var(--text-primary);
	min-width: 80px;
}

.deity-bonus {
	font-size: 0.8rem;
	color: var(--text-muted);
}

/* Backstory */
.backstory-list {
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
	margin-bottom: 0.75rem;
	max-height: 250px;
	overflow-y: auto;
}

.backstory-btn {
	padding: 0.6rem 0.9rem;
	background: var(--bg-deep);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-sm);
	color: var(--text-secondary);
	font-family: 'Crimson Text', serif;
	font-size: 0.95rem;
	text-align: left;
	cursor: pointer;
	transition: all 0.2s;
}

.backstory-btn.active {
	border-color: var(--gold-bright);
	color: var(--gold-light);
	background: rgba(200, 160, 50, 0.08);
}

/* Preview */
.char-preview {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1rem;
	background: var(--bg-deep);
	border: 1px solid var(--border-light);
	border-radius: var(--radius-lg);
	margin: 1rem 0;
}

.preview-avatar {
	font-size: 3rem;
	width: 60px;
	text-align: center;
}

.preview-name {
	font-size: 1.2rem;
	color: var(--gold-bright);
	font-family: 'Cinzel', serif;
}

.preview-race, .preview-deity {
	font-size: 0.9rem;
	color: var(--text-secondary);
}

/* Nav */
.step-nav {
	display: flex;
	justify-content: space-between;
	gap: 1rem;
	margin-top: 0.5rem;
}

.form-group {
	display: flex;
	flex-direction: column;
	gap: 0.6rem;
	margin-bottom: 1.25rem;
}

.form-label {
	font-size: 0.82rem;
	color: var(--text-secondary);
	letter-spacing: 0.08em;
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
}
</style>
