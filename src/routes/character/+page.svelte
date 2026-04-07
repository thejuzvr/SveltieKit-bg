	<script lang="ts">
	import { gameStore } from '$lib/stores/gameStore.svelte';
	import { onMount } from 'svelte';

	// ── Derived ────────────────────────────────────────────────────────────
	const character = $derived(gameStore.character);
	const events = $derived(gameStore.events);
	const now = $derived(gameStore.now);
	const lastTickAt = $derived(gameStore.lastTickAt);
	const wsStatus = $derived(gameStore.wsStatus);
	const unreadCombat = $derived(gameStore.unreadCombat);
	
	let logLimit = $state<number>(40);
	let sendingMessage = $state(false);
	let divineMessage = $state('');
	let activeTab = $state<'journal' | 'combat'>('journal');
	let selectedEffect = $state<any>(null);

	const secondsSinceUpdate = $derived(character ? Math.floor((now - lastTickAt) / 1000) : 0);
	const visualPrana = $derived(
		character?.interventionPower.lastRegenAt 
			? Math.min(
					character.interventionPower.max, 
					character.interventionPower.current + ((now - character.interventionPower.lastRegenAt) / 900000) * character.interventionPower.max
				)
			: character?.interventionPower.current || 0
	);
	const raceTranslations: Record<string, string> = {
		'nord': 'Норд', 'dunmer': 'Данмер', 'altmer': 'Альтмер',
		'bosmer': 'Босмер', 'khajiit': 'Каджит', 'argonian': 'Аргонианин'
	};
	const raceName = $derived(character ? (raceTranslations[character.race] || character.race) : '');
	const hpPercent = $derived(character ? Math.round((character.stats.health.current / character.stats.health.max) * 100) : 0);
	const mpPercent = $derived(character ? Math.round((character.stats.magicka.current / character.stats.magicka.max) * 100) : 0);
	const spPercent = $derived(character ? Math.round((character.stats.stamina.current / character.stats.stamina.max) * 100) : 0);
	const xpPercent = $derived(character ? Math.round((character.xp.current / character.xp.required) * 100) : 0);
	const isInCombat = $derived(character?.status === 'in-combat');
	const isDead = $derived(character?.status === 'dead');
	const goldCount = $derived(
		character ? character.inventory
			.filter(i => i.type === 'gold' || i.id === 'gold')
			.reduce((sum, i) => sum + (i.quantity || 0), 0) : 0
	);
	const statusLabel = $derived(
		character?.status === 'in-combat' ? '⚔️ Сражается' :
		character?.status === 'dead' ? '💀 В Совнгарде' :
		character?.status === 'sleeping' ? '😴 Спит' :
		character?.status === 'busy' ? '⏳ Выполняет дело' :
		character?.status === 'exploring' ? '🗺️ В подземелье' :
		'🌿 Бездействует'
	);
	const moodFace = $derived(
		!character ? '😐' :
		character.mood > 80 ? '🤩' :
		character.mood > 60 ? '😊' :
		character.mood > 40 ? '😐' :
		character.mood > 20 ? '😟' :
		'🤕'
	);
	const moodText = $derived(
		!character ? '...' :
		character.mood > 80 ? 'Отличное' :
		character.mood > 60 ? 'Хорошее' :
		character.mood > 40 ? 'Обыденное' :
		character.mood > 20 ? 'Удручённое' :
		'Мрачное'
	);
	const moodColor = $derived(
		!character ? '#60a5fa' :
		character.mood > 80 ? '#fbbf24' : // Gold
		character.mood > 60 ? '#34d399' : // Green
		character.mood > 40 ? '#60a5fa' : // Blue
		character.mood > 20 ? '#a8a29e' : // Gray
		'#ef4444' // Red
	);
	const moodGlow = $derived(
		!character ? 'rgba(96, 165, 250, 0.3)' :
		character.mood > 80 ? 'rgba(251, 191, 36, 0.5)' :
		character.mood > 60 ? 'rgba(52, 211, 153, 0.4)' :
		character.mood > 40 ? 'rgba(96, 165, 250, 0.3)' :
		character.mood > 20 ? 'rgba(168, 162, 158, 0.2)' :
		'rgba(239, 68, 68, 0.5)'
	);

	onMount(() => {
		const savedLimit = localStorage.getItem('sveltiekit_journal_limit');
		if (savedLimit) {
			const parsed = parseInt(savedLimit, 10);
			if ([20, 40, 60].includes(parsed)) logLimit = parsed;
		}
	});

	// ── Log limit selector ────────────────────────────────────────────────────
	function changeLogLimit(limit: number) {
		logLimit = limit;
		localStorage.setItem('sveltiekit_journal_limit', limit.toString());
	}

	// ── Intervention Handlers ─────────────────────────────────────────────────
	async function handleIntervention(type: 'bless' | 'punish') {
		try {
			const res = await fetch('/api/divine/intervention', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type })
			});
			const json = await res.json();
			if (json.success) {
				gameStore.refresh();
			} else {
				alert(json.error || 'Ошибка вмешательства');
			}
		} catch (err) {
			console.error('[handleIntervention]', err);
		}
	}
	
	async function handleSendMessage() {
		if (!divineMessage.trim() || sendingMessage) return;
		sendingMessage = true;
		try {
			const res = await fetch('/api/divine/message', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: divineMessage })
			});
			const json = await res.json();
			if (json.success) {
				divineMessage = '';
				gameStore.fetchEvents();
			} else {
				alert(json.error || 'Ошибка отправки');
			}
		} catch (err) {
			console.error('[handleSendMessage]', err);
		} finally {
			sendingMessage = false;
		}
	}

	// Clear unread on tab switch
	$effect(() => {
		if (activeTab === 'combat' && gameStore.unreadCombat) {
			gameStore.markCombatRead();
		}
	});
</script>

<svelte:head>
	<title>{character?.name || 'Загрузка'} — Дневник героя</title>
</svelte:head>

{#if character}
<div class="dashboard-grid">

		<!-- COL 1: HERO PROFILE -->
		<div class="col col-profile">

			<div class="card">
				<div class="card-header">
					<div class="hero-identity">
						<div class="avatar">{character.name.substring(0,2).toUpperCase()}</div>
						<div>
							<h2 class="font-cinzel hero-name">{character.name}</h2>
							<p class="hero-meta">Ур. {character.level} · {raceName}</p>
							<p class="hero-meta">📍 {character.location}</p>
						</div>
					</div>
					<div class="hero-status-badge" class:combat={isInCombat} class:dead={isDead}>
						{statusLabel}
						{#if character.currentAction}
							<span class="opacity-70"> — {character.currentAction.name}</span>
						{/if}
					</div>
				</div>
				<div class="card-content">
					<div class="stats-list">
						<div class="stat-row">
							<span class="stat-label">❤️ Здоровье</span>
							<span class="stat-nums">{character.stats.health.current}/{character.stats.health.max}</span>
							<div class="bar-bg"><div class="bar-fill health" style="width:{hpPercent}%"></div></div>
						</div>
						<div class="stat-row">
							<span class="stat-label">✨ Магика</span>
							<span class="stat-nums">{character.stats.magicka.current}/{character.stats.magicka.max}</span>
							<div class="bar-bg"><div class="bar-fill magicka" style="width:{mpPercent}%"></div></div>
						</div>
						<div class="stat-row">
							<span class="stat-label">⚡ Стамина</span>
							<span class="stat-nums">{character.stats.stamina.current}/{character.stats.stamina.max}</span>
							<div class="bar-bg"><div class="bar-fill stamina" style="width:{spPercent}%"></div></div>
						</div>
						<div class="stat-row mt-4">
							<span class="stat-label text-gold">⭐ Опыт (Ур.{character.level})</span>
							<span class="stat-nums text-gold">{character.xp.current}/{character.xp.required}</span>
							<div class="bar-bg"><div class="bar-fill xp" style="width:{xpPercent}%"></div></div>
						</div>
					</div>

				</div>
			</div>

			<!-- Active/Negative Effects -->
			{#if character.effects && character.effects.length > 0}
				<div class="card">
					<div class="card-header-sm">✨ Активные Эффекты</div>
					<div class="card-content effects-list">
						{#each character.effects as effect}
							<button class="effect-chip clickable" class:buff={effect.type === 'buff'} class:debuff={effect.type !== 'buff'} onclick={() => selectedEffect = effect}>
								<span class="effect-icon">{effect.type === 'buff' ? '🌟' : '☠️'}</span>
								<div class="effect-info">
									<span class="effect-name">{effect.name}</span>
									{#if effect.expiresAt}
										<span class="effect-time">{Math.max(0, Math.round((effect.expiresAt - now) / 60000))}м</span>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Equipment Slots -->
			<div class="card">
				<div class="card-header-sm">🛡️ Снаряжение</div>
				<div class="card-content">
					<div class="equip-slots">
						{#each [
							{ key: 'head',     label: 'Голова', icon: '🪖' },
							{ key: 'chest',    label: 'Торс',   icon: '🥋' },
							{ key: 'legs',     label: 'Ноги',   icon: '👖' },
							{ key: 'hands',    label: 'Руки',   icon: '🧤' },
							{ key: 'feet',     label: 'Обувь',  icon: '👟' },
							{ key: 'mainHand', label: 'Оружие', icon: '⚔️' },
							{ key: 'offHand',  label: 'Щит',    icon: '🛡️' },
							{ key: 'ring',     label: 'Кольцо', icon: '💍' },
							{ key: 'amulet',   label: 'Амулет', icon: '🪬' },
						] as slot}
							<div class="equip-row">
								<span class="equip-icon">{slot.icon}</span>
								<span class="equip-label">{slot.label}</span>
								<span class="equip-item">
									{#if character.equippedItems && character.equippedItems[slot.key]}
										{character.inventory.find(i => i.id === character.equippedItems[slot.key])?.name ?? character.equippedItems[slot.key]}
									{:else}
										<span class="equip-empty">— пусто —</span>
									{/if}
								</span>
							</div>
						{/each}
					</div>
					<div class="gold-row">
						<span>💰 Казна</span>
						<span class="text-gold font-bold">{goldCount} септимов</span>
					</div>
				</div>
			</div>

		</div>

		<!-- COL 2+3: CENTRAL (ACTION + JOURNAL + COMBAT LOG) -->
		<div class="col col-main">

			{#if character.currentAction}
				<div class="card action-card">
					<div class="action-inner">
						<div class="action-indicator"></div>
						<div>
							<p class="action-type">{character.currentAction.type}</p>
							<h3 class="action-name font-cinzel">{character.currentAction.name}</h3>
							<p class="action-desc">{character.currentAction.description}</p>
						</div>
						<div class="spinner"></div>
					</div>
				</div>
			{/if}

			{#if isInCombat && character.combat}
				<div class="card combat-card">
					<div class="card-content">
						<p class="combat-title blinking">⚔ БОЕВОЕ СТОЛКНОВЕНИЕ ⚔</p>
						<div class="combat-arena">
							<div class="combatant">
								<div class="combatant-name font-cinzel">{character.name}</div>
								<div class="combatant-hp hero-hp">❤️ {character.stats.health.current}</div>
							</div>
							<div class="vs-divider">VS</div>
							<div class="combatant">
								<div class="combatant-name font-cinzel">{character.combat.enemy.name}</div>
								<div class="combatant-hp enemy-hp">☠️ {character.combat.enemy.health.current}</div>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Central Log (Tabs) -->
			<div class="card journal-card">
				<div class="card-header-row tabs-header">
					<div class="tabs-nav">
						<button class="tab-btn font-cinzel" class:active={activeTab === 'journal'} onclick={() => activeTab = 'journal'}>📜 Журнал</button>
						<button class="tab-btn font-cinzel" class:active={activeTab === 'combat'} 
							onclick={() => { 
								activeTab = 'combat'; 
								gameStore.markCombatRead(); 
							}}>
							⚔️ Бой
							{#if unreadCombat} <span class="tab-badge">!</span> {/if}
						</button>
					</div>
					<div class="limit-selector">
						<span class="limit-label">{events.filter(e => activeTab === 'combat' ? e.type === 'combat' : (e.type !== 'combat' && !e.message.includes('настроение'))).length} зап.</span>
						{#each [20, 40, 60] as lim}
							<button class="btn-limit" class:active={logLimit === lim} onclick={() => changeLogLimit(lim)}>{lim}</button>
						{/each}
					</div>
				</div>
				
				<div class="card-content event-feed">
					{#if activeTab === 'journal'}
						{@const journalEvents = events.filter(e => e.type !== 'combat' && !e.message.toLowerCase().includes('настроение') && !e.message.toLowerCase().includes('удручён') && !e.message.toLowerCase().includes('страдает')).slice(0, logLimit)}
						{#if journalEvents.length === 0}
							<div class="empty-feed">
								<p>🌿 Герой только начинает свой путь...</p>
								<p class="muted-text">Первые записи скоро появятся здесь.</p>
							</div>
						{:else}
							{#each journalEvents as ev, i}
								{@const isWeather = ev.message.includes('Погода') || ev.message.includes('погода')}
								{@const isTravel = ev.message.includes('прибыл') || ev.message.includes('направил') || ev.message.includes('путь') || ev.message.includes('Солитьюд') || ev.message.includes('Вайтран')}
								{@const isLevel = ev.message.includes('уровень') || ev.message.includes('Уровень')}
								{@const isSleep = ev.message.includes('спит') || ev.message.includes('проснул') || ev.message.includes('отдых')}
								{@const isDivine = ev.message.includes('Голос') || ev.message.includes('шёпот') || ev.message.includes('божество')}
								
								<div class="event-item" 
									class:ev-weather={isWeather}
									class:ev-travel={isTravel}
									class:ev-level={isLevel}
									class:ev-divine={isDivine}
									class:ev-sleep={isSleep}>
									<span class="ev-time">{new Date(ev.timestamp).toLocaleTimeString('ru', {hour:'2-digit', minute:'2-digit'})}</span>
									<span class="ev-icon">
										{#if isWeather}🌤️
										{:else if isLevel}🏆
										{:else if isTravel}🧭
										{:else if isSleep}😴
										{:else if isDivine}✨
										{:else}📜{/if}
									</span>
									<span class="ev-msg" class:msg-divine={isDivine}>
										{@html ev.message
											.replace(/^\[божество\]\s*/u, '')
											.replace(/(Джон|Солитьюд|Вайтран|Рифтен|Маркарт|Виндхельм|Альтмер|Имперец|Данмер)/g, '<span class="text-highlight">$1</span>')
										}
									</span>
								</div>
								{#if i < journalEvents.length - 1}<hr class="ev-sep" />{/if}
							{/each}
						{/if}
					{:else}
						{@const combatEvents = events.filter(e => e.type === 'combat').slice(0, logLimit)}
						{#if combatEvents.length === 0}
							<div class="empty-feed">
								<p>🕊️ Здесь пока мирно.</p>
								<p class="muted-text">Боевые действия отсутствуют.</p>
							</div>
						{:else}
							{#each combatEvents as ev, i}
								<div class="event-item combat-ev-item" class:is-hit={ev.message.includes('урон') || ev.message.includes('бьёт')} class:is-victory={ev.message.includes('повержен') || ev.message.includes('убит')}>
									<span class="ev-time">{new Date(ev.timestamp).toLocaleTimeString('ru', {hour:'2-digit', minute:'2-digit'})}</span>
									<span class="ev-icon">{ev.message.includes('повержен') || ev.message.includes('убит') ? '💀' : '⚔️'}</span>
									<span class="ev-msg combat-msg" class:combat-highlight={ev.message.includes('урон')}>{ev.message}</span>
								</div>
								{#if i < combatEvents.length - 1}<hr class="ev-sep" />{/if}
							{/each}
						{/if}
					{/if}
				</div>
			</div>

		</div>

		<!-- COL 4: WORLD + DIVINE CONSOLE -->
		<div class="col col-world">

			<!-- MOOD & STATUS WIDGET -->
			<div class="card mood-card">
				<div class="card-header-sm">🎭 Состояние Духа</div>
				<div class="card-content">
					<div class="mood-display">
						<div class="mood-avatar-3d" style="--sphere-color: {moodColor}; --sphere-glow: {moodGlow}; --sphere-scale: {0.8 + (character.mood/200)}">
							<div class="sphere-surface"></div>
							<div class="sphere-glow"></div>
							<div class="mood-face-overlay">{moodFace}</div>
						</div>
						<div class="mood-info">
							<div class="mood-label">Состояние Духа</div>
							<div class="mood-bar-wrap">
								<div class="mood-bar-fill" style="width: {character.mood}%; background: {moodColor}" class:good={character.mood >= 60} class:bad={character.mood <= 30}></div>
							</div>
							<div class="mood-desc">{moodText} ({character.mood}%)</div>
						</div>
					</div>
				</div>
			</div>

			<div class="card world-card">
				<div class="card-header-sm">🌍 Мир</div>
				<div class="card-content">
					<div class="world-row">
						<div class="world-tile">
							<div class="world-bigicon">
								{#if character.timeOfDay === 'morning'}🌅
								{:else if character.timeOfDay === 'day'}☀️
								{:else if character.timeOfDay === 'evening'}🌇
								{:else}🌙{/if}
							</div>
							<div class="world-info">
								<div class="world-label">Время</div>
								<div class="world-val font-cinzel">
									{#if character.timeOfDay === 'morning'}Утро
									{:else if character.timeOfDay === 'day'}День
									{:else if character.timeOfDay === 'evening'}Вечер
									{:else}Ночь{/if}
								</div>
								<div class="world-sub">{character.season}</div>
							</div>
						</div>
						<div class="world-divider"></div>
						<div class="world-tile">
							<div class="world-bigicon">
								{#if character.weather === 'Clear'}☀️
								{:else if character.weather?.includes('Rain')}🌧️
								{:else if character.weather?.includes('Snow')}❄️
								{:else if character.weather?.includes('Storm')}⛈️
								{:else if character.weather?.includes('Fog')}🌫️
								{:else}☁️{/if}
							</div>
							<div class="world-info">
								<div class="world-label">Погода</div>
								<div class="world-val font-cinzel">{character.weather}</div>
								<div class="world-sub">Влияет на стамину</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="card divine-card">
				<div class="card-header">
					<h2 class="font-cinzel divine-title">⚡ Пульт Вмешательства</h2>
					<p class="card-desc">Каждое действие тратит Прану.</p>
				</div>
				<div class="card-content">
					<div class="prana-block">
						<div class="prana-labels">
							<span class="text-gold">🕉️ Прана</span>
							<span class="text-gold prana-val">{Math.floor(visualPrana)} / {character.interventionPower.max}</span>
						</div>
						<div class="prana-bar-bg">
							<div class="prana-bar-fill" style="width:{Math.min(100,(visualPrana/character.interventionPower.max)*100)}%"></div>
						</div>
					</div>
					<div class="whisper-block">
						<label for="divine-input" class="whisper-label">💬 Глас Божий</label>
						<textarea id="divine-input" class="input-area" bind:value={divineMessage}
							placeholder="Отправить мысль герою... (макс 200)" maxlength="200" rows="3"></textarea>
						<button class="btn btn-primary btn-full" disabled={sendingMessage || divineMessage.length === 0} onclick={handleSendMessage}>
							{sendingMessage ? 'Передаю...' : '🔮 Шепнуть (−10 Праны)'}
						</button>
					</div>
					<hr class="divider" />
					<div class="action-btns">
						<button class="btn btn-bless" onclick={() => handleIntervention('bless')}>
							<span class="btn-icon">🎇</span>
							<span class="btn-text">Добро<br><small>+20 HP · −20 Прана</small></span>
						</button>
						<button class="btn btn-punish" onclick={() => handleIntervention('punish')}>
							<span class="btn-icon">🌩️</span>
							<span class="btn-text">Зло<br><small>−15 HP · −20 Прана</small></span>
						</button>
					</div>
				</div>
			</div>

		</div>

	<!-- EFFECTS MODAL -->
	{#if selectedEffect}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-backdrop" onclick={() => selectedEffect = null}>
			<div class="modal-content" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<h3 class="font-cinzel effect-modal-title">
						<span class="effect-icon-lg">{selectedEffect.type === 'buff' ? '🌟' : '☠️'}</span>
						{selectedEffect.name}
					</h3>
					<button class="close-btn" onclick={() => selectedEffect = null}>×</button>
				</div>
				<div class="modal-body">
					<p>{selectedEffect.description || 'Эффект влияет на характеристики персонажа, но точное описание неизвестно.'}</p>
					{#if selectedEffect.expiresAt}
						<p class="text-gold mt-4 text-xs font-bold uppercase tracking-widest">
							⏳ Пройдёт через: {Math.max(0, Math.round((selectedEffect.expiresAt - now) / 60000))} м.
						</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
{/if}

<style>
:global(:root) {
	--gold: #d4af37;
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
:global(body) { margin: 0; padding: 0; background: var(--bg); color: var(--fg); font-family: var(--font-body); }
:global(*) { box-sizing: border-box; }
:global(a) { color: inherit; text-decoration: none; }

.app-shell {
	min-height: 100vh;
	background: radial-gradient(ellipse 90% 45% at 50% -5%, #1e0e00 0%, #0a0a0a 60%);
	display: flex; flex-direction: column;
}

/* NAVBAR */
.navbar {
	display: flex; align-items: center; justify-content: space-between;
	padding: 0.65rem 2rem;
	background: rgba(7,5,1,0.92);
	border-bottom: 1px solid rgba(212,175,55,0.16);
	backdrop-filter: blur(16px);
	position: sticky; top: 0; z-index: 100;
}
.navbar-logo { display: flex; align-items: center; gap: 0.45rem; }
.logo-icon { font-size: 1.25rem; }
.logo-text { color: var(--gold); font-size: 0.95rem; letter-spacing: 0.07em; }
.navbar-links { display: flex; gap: 0.15rem; }
.nav-link {
	color: var(--muted); padding: 0.36rem 0.8rem;
	border-radius: var(--radius); font-size: 0.86rem; transition: all 0.2s;
}
.nav-link:hover { color: var(--fg); background: rgba(255,255,255,0.05); }
.nav-link.active { color: var(--gold); background: var(--gold-dim); }
.navbar-right { display: flex; align-items: center; gap: 1rem; }
@keyframes glow { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }

/* GRID */
.dashboard-grid {
	display: grid; grid-template-columns: 1fr; gap: 1.1rem;
	padding: 1.4rem 1.5rem 2rem; flex: 1;
}
@media (min-width: 1280px) {
	.dashboard-grid { grid-template-columns: 275px 1fr 275px; align-items: start; }
}
.col { display: flex; flex-direction: column; gap: 0.9rem; }

/* CARDS */
.card {
	background: var(--card);
	border: 1px solid var(--card-border);
	border-radius: var(--radius);
	backdrop-filter: blur(8px);
	box-shadow: 0 4px 20px rgba(0,0,0,0.55);
	overflow: hidden;
}
.card-header { padding: 0.9rem 1.15rem; border-bottom: 1px solid var(--card-border); }
.card-content { padding: 0.9rem 1.15rem; }
.card-desc { font-size: 0.79rem; color: var(--muted); margin-top: 0.18rem; }
.card-header-sm {
	padding: 0.5rem 0.9rem; border-bottom: 1px solid var(--card-border);
	font-size: 0.7rem; font-weight: 600; color: var(--muted);
	text-transform: uppercase; letter-spacing: 0.08em;
}
.card-header-row {
	padding: 0.8rem 1.15rem; border-bottom: 1px solid var(--card-border);
	display: flex; align-items: center; justify-content: space-between;
}

/* HERO */
.hero-identity { display: flex; gap: 0.85rem; align-items: center; margin-bottom: 0.7rem; }
.avatar {
	width: 50px; height: 50px; border-radius: 50%;
	background: var(--gold-dim); border: 2px solid var(--gold);
	display: flex; align-items: center; justify-content: center;
	font-size: 1.15rem; font-weight: 700; color: var(--gold);
	font-family: var(--font-cinzel); flex-shrink: 0;
}
.hero-name { margin: 0; font-size: 1rem; color: var(--fg); }
.hero-meta { margin: 0.1rem 0 0; font-size: 0.75rem; color: var(--muted); }
.hero-status-badge {
	padding: 0.32rem 0.65rem; border-radius: var(--radius);
	background: rgba(16,185,129,0.1); color: #34d399;
	border: 1px solid rgba(16,185,129,0.2); font-size: 0.8rem; text-align: center;
}
.hero-status-badge.combat { background: rgba(239,68,68,0.1); color: #f87171; border-color: rgba(239,68,68,0.25); }
.hero-status-badge.dead { background: rgba(80,80,80,0.1); color: var(--muted); border-color: var(--card-border); }
.opacity-70 { opacity: 0.7; }

/* STATS */
.stats-list { display: flex; flex-direction: column; gap: 0.57rem; }
.stat-row { display: flex; flex-direction: column; gap: 0.16rem; position: relative; }
.stat-label { font-size: 0.74rem; font-weight: 600; }
.stat-nums { position: absolute; right: 0; top: 0; font-size: 0.72rem; color: var(--muted); font-variant-numeric: tabular-nums; }
.bar-bg { height: 5px; background: rgba(255,255,255,0.07); border-radius: 99px; margin-top: 0.1rem; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 99px; transition: width 0.4s ease; }
.health { background: linear-gradient(90deg, #b91c1c, #ef4444); }
.magicka { background: linear-gradient(90deg, #1d4ed8, #3b82f6); }
.stamina { background: linear-gradient(90deg, #047857, #10b981); }
.xp { background: linear-gradient(90deg, #854d0e, var(--gold)); }
.mt-4 { margin-top: 0.9rem; }
.text-gold { color: var(--gold); }
.font-bold { font-weight: 700; }
.font-bold { font-weight: 700; }

/* EFFECTS */
.effects-list { display: flex; flex-direction: column; gap: 0.4rem; }
.effect-chip {
	display: flex; align-items: center; gap: 0.45rem;
	padding: 0.35rem 0.55rem; border-radius: var(--radius);
	border: 1px solid transparent; font-size: 0.79rem;
}
.effect-chip.buff { background: rgba(16,185,129,0.08); border-color: rgba(16,185,129,0.2); color: #34d399; }
.effect-chip.debuff { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.2); color: #f87171; }
.effect-icon { font-size: 0.9rem; }
.effect-info { display: flex; align-items: center; justify-content: space-between; flex: 1; }
.effect-name { font-weight: 500; }
.effect-time { font-size: 0.68rem; opacity: 0.7; }

/* EQUIPMENT */
.equip-slots { display: flex; flex-direction: column; gap: 0; margin-bottom: 0.6rem; }
.equip-row {
	display: flex; align-items: center; gap: 0.38rem;
	padding: 0.26rem 0; font-size: 0.78rem;
	border-bottom: 1px solid rgba(255,255,255,0.04);
}
.equip-icon { flex-shrink: 0; width: 1.1rem; text-align: center; font-size: 0.85rem; }
.equip-label { color: var(--muted); width: 4rem; flex-shrink: 0; font-size: 0.74rem; }
.equip-item { color: var(--fg); font-size: 0.77rem; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.equip-empty { color: rgba(255,255,255,0.16); font-style: italic; }
.gold-row { display: flex; justify-content: space-between; padding-top: 0.55rem; font-size: 0.8rem; }

/* ACTION CARD */
.action-card { border-left: 3px solid var(--gold); }
.action-inner { padding: 0.8rem 1.15rem; display: flex; gap: 0.9rem; align-items: center; }
.action-indicator {
	width: 7px; height: 7px; border-radius: 50%; background: var(--gold);
	box-shadow: 0 0 7px var(--gold); flex-shrink: 0; animation: glow 1.5s infinite;
}
.action-type { margin: 0 0 0.18rem; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); }
.action-name { margin: 0 0 0.18rem; font-size: 0.92rem; color: var(--gold); }
.action-desc { margin: 0; font-size: 0.78rem; color: var(--muted); }
.spinner {
	width: 17px; height: 17px; border: 2px solid rgba(255,255,255,0.07);
	border-top-color: var(--gold); border-radius: 50%; animation: spin 1s linear infinite;
	flex-shrink: 0; margin-left: auto;
}
@keyframes spin { 100% { transform: rotate(360deg); } }

/* COMBAT LIVE */
.combat-card { border: 1px solid rgba(239,68,68,0.32); animation: cpulse 2s infinite; }
@keyframes cpulse { 0%,100% { border-color: rgba(239,68,68,0.32); } 50% { border-color: rgba(239,68,68,0.65); } }
.combat-title { text-align: center; color: #f87171; font-size: 0.8rem; letter-spacing: 0.2em; font-family: var(--font-cinzel); }
.blinking { animation: blink 1s infinite; }
@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
.combat-arena { display: flex; align-items: center; justify-content: center; gap: 2rem; margin-top: 0.85rem; }
.combatant { text-align: center; }
.combatant-name { font-size: 0.88rem; margin-bottom: 0.22rem; }
.combatant-hp { font-size: 1rem; font-weight: 700; }
.hero-hp { color: #34d399; }
.enemy-hp { color: #f87171; }
.vs-divider { font-size: 1.2rem; color: var(--muted); font-family: var(--font-cinzel); }

/* JOURNAL */
/* JOURNAL */
.limit-selector { display: flex; align-items: center; gap: 0.28rem; }
.limit-label { font-size: 0.7rem; color: var(--muted); margin-right: 0.15rem; }
.btn-limit {
	background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
	color: var(--muted); padding: 2px 6px; border-radius: 3px;
	font-size: 0.69rem; cursor: pointer; transition: all 0.18s;
}
.btn-limit:hover { background: rgba(255,255,255,0.08); color: var(--fg); }
.btn-limit.active { background: var(--gold-dim); border-color: var(--gold); color: var(--gold); }
.event-feed { max-height: 420px; overflow-y: auto; display: flex; flex-direction: column; }
.event-feed::-webkit-scrollbar { width: 3px; }
.event-feed::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
.empty-feed { text-align: center; padding: 2.5rem 1rem; color: var(--muted); font-size: 0.86rem; }
.muted-text { color: var(--muted); margin-top: 0.4rem; }
.event-item { display: flex; gap: 0.42rem; align-items: flex-start; padding: 0.48rem 0; font-size: 0.82rem; }
.divine-item { background: rgba(212,175,55,0.04); border-radius: 4px; padding: 0.48rem 0.4rem; margin: 0 -0.4rem; }
.ev-time { color: var(--muted); font-size: 0.7rem; flex-shrink: 0; padding-top: 2px; font-variant-numeric: tabular-nums; }
.ev-icon { flex-shrink: 0; }
.ev-msg { line-height: 1.5; color: rgba(240,237,232,0.88); }
.msg-divine { color: var(--gold); font-family: var(--font-cinzel); font-style: italic; font-size: 0.79rem; }
.ev-sep { border: none; border-top: 1px solid rgba(255,255,255,0.042); margin: 0; }
.journal-card { flex: 1; }

/* COMBAT LOG */
.combat-msg { color: #fca5a5; font-size: 0.79rem; }

/* WORLD */
.world-row { display: flex; gap: 0.2rem; }
.world-tile { flex: 1; display: flex; gap: 0.55rem; align-items: center; padding: 0.25rem; }
.world-bigicon { font-size: 1.7rem; }
.world-label { font-size: 0.66rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
.world-val { font-size: 0.86rem; color: var(--fg); margin: 0.07rem 0; }
.world-sub { font-size: 0.68rem; color: var(--muted); }
.world-divider { width: 1px; background: var(--card-border); margin: 0.2rem 0; align-self: stretch; }

/* DIVINE CONSOLE */
.divine-card { border-top: 2px solid var(--gold); }
.divine-title { color: var(--gold); font-size: 0.97rem; margin: 0; }
.prana-block { margin-bottom: 0.9rem; }
.prana-labels { display: flex; justify-content: space-between; margin-bottom: 0.38rem; font-size: 0.82rem; }
.prana-val { font-variant-numeric: tabular-nums; }
.prana-bar-bg { height: 7px; background: rgba(255,255,255,0.07); border-radius: 99px; overflow: hidden; }
.prana-bar-fill {
	height: 100%; border-radius: 99px;
	background: linear-gradient(90deg, #92400e, var(--gold));
	box-shadow: 0 0 8px rgba(212,175,55,0.35);
	transition: width 0.5s ease;
}
.whisper-block { margin-bottom: 0.9rem; }
.whisper-label { display: block; font-size: 0.76rem; font-weight: 600; margin-bottom: 0.42rem; color: var(--muted); }
.input-area {
	width: 100%; background: rgba(255,255,255,0.04); border: 1px solid var(--card-border);
	border-radius: var(--radius); padding: 0.58rem; color: var(--fg);
	font-family: var(--font-body); resize: none; font-size: 0.82rem;
	transition: border-color 0.2s;
}
.input-area:focus { outline: none; border-color: var(--gold); }
.divider { border: none; border-top: 1px solid var(--card-border); margin: 0.9rem 0; }
.action-btns { display: flex; gap: 0.65rem; }
.btn {
	display: flex; align-items: center; justify-content: center; gap: 0.38rem;
	padding: 0.58rem 0.9rem; border-radius: var(--radius);
	font-weight: 600; cursor: pointer; border: 1px solid transparent;
	transition: all 0.2s; text-align: center; font-size: 0.82rem; line-height: 1.3;
}
.btn:disabled { opacity: 0.38; cursor: not-allowed; }
.btn-primary { background: var(--gold); color: #000; border-color: var(--gold); }
.btn-primary:hover:not(:disabled) { background: #c9a227; }
.btn-full { width: 100%; margin-top: 0.42rem; }
.btn-bless {
	flex: 1; flex-direction: column; gap: 0.1rem;
	background: rgba(16,185,129,0.08); border-color: rgba(16,185,129,0.28); color: #34d399;
}
.btn-bless:hover:not(:disabled) { background: rgba(16,185,129,0.16); }
.btn-punish {
	flex: 1; flex-direction: column; gap: 0.1rem;
	background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.28); color: #f87171;
}
.btn-punish:hover:not(:disabled) { background: rgba(239,68,68,0.16); }
.btn-icon { font-size: 1.2rem; }
.btn-text { font-size: 0.77rem; }
.btn-text small { font-size: 0.63rem; opacity: 0.62; display: block; font-weight: 400; }
.font-cinzel { font-family: var(--font-cinzel); font-weight: bold; }

/* MODAL */
.modal-backdrop {
	position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
	display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-content {
	background: var(--card); border: 1px solid var(--card-border);
	border-radius: var(--radius); width: 100%; max-width: 400px;
	box-shadow: 0 10px 30px rgba(0,0,0,0.8); overflow: hidden;
	animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.modal-header {
	padding: 1rem 1.25rem; border-bottom: 1px solid var(--card-border);
	display: flex; justify-content: space-between; align-items: center;
}
.effect-modal-title { margin: 0; color: var(--gold); font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem; }
.effect-icon-lg { font-size: 1.4rem; padding-bottom: 2px; }
.close-btn { background: none; border: none; color: var(--muted); font-size: 1.5rem; cursor: pointer; transition: color 0.2s; line-height: 1; }
.close-btn:hover { color: var(--fg); }
.modal-body { padding: 1.25rem; font-size: 0.9rem; line-height: 1.5; color: rgba(240,237,232,0.88); }
.effect-chip.clickable { cursor: pointer; text-align: left; width: 100%; transition: transform 0.2s; }
.effect-chip.clickable:hover { transform: translateY(-1px); border-color: rgba(255,255,255,0.1); }
.tracking-widest { letter-spacing: 0.1em; }
.uppercase { text-transform: uppercase; }

/* TABS */
.tabs-header { padding-bottom: 0; }
.tabs-nav { display: flex; gap: 0.2rem; align-self: flex-end; margin-bottom: -1px; }
.tab-btn {
	background: none; border: none; border-bottom: 2px solid transparent; 
	padding: 0.6rem 0.8rem; font-size: 0.85rem; color: var(--muted); 
	cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.4rem;
}
.tab-btn:hover { color: var(--fg); background: rgba(255,255,255,0.02); }
.tab-btn.active { color: var(--gold); border-bottom-color: var(--gold); }
.tab-badge {
	background: var(--danger); color: white; border-radius: 99px; font-family: var(--font-body);
	font-size: 0.65rem; padding: 0.05rem 0.35rem; font-weight: bold; line-height: 1;
}
.combat-highlight { color: #fca5a5; font-weight: 500; }
.combat-ev-item.is-hit { background: rgba(239,68,68,0.06); padding: 0.45rem; border-radius: var(--radius); margin: 0 -0.45rem; border-left: 2px solid rgba(239,68,68,0.5); }
.combat-ev-item.is-victory { background: rgba(212,175,55,0.08); padding: 0.45rem; border-radius: var(--radius); margin: 0 -0.45rem; border-left: 2px solid var(--gold); }

/* MOOD WIDGET (3D Sphere) */
.mood-avatar-3d {
	width: 55px; height: 55px; border-radius: 50%;
	position: relative; flex-shrink: 0;
	transform: scale(var(--sphere-scale, 1));
	transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
	animation: breathe 4s ease-in-out infinite;
	background: var(--sphere-color);
	box-shadow: 
		0 0 20px var(--sphere-glow),
		inset -8px -8px 15px rgba(0,0,0,0.5),
		inset 8px 8px 15px rgba(255,255,255,0.2);
}
.sphere-surface {
	position: absolute; inset: 2px; border-radius: 50%;
	background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%);
	pointer-events: none;
}
.mood-face-overlay {
	position: absolute; inset: 0;
	display: flex; align-items: center; justify-content: center;
	font-size: 1.6rem; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));
	z-index: 2;
}
@keyframes breathe {
	0%, 100% { transform: scale(var(--sphere-scale)) translateY(0); box-shadow: 0 0 20px var(--sphere-glow); }
	50% { transform: scale(calc(var(--sphere-scale) * 1.05)) translateY(-4px); box-shadow: 0 0 35px var(--sphere-glow); }
}

/* ENHANCED LOG */
.event-item { transition: background 0.3s; margin: 0 -0.5rem; padding: 0.6rem 0.5rem; border-radius: 6px; }
.event-item:hover { background: rgba(255,255,255,0.03); }
.ev-weather { border-left: 2px solid #60a5fa; background: linear-gradient(90deg, rgba(96,165,250,0.05), transparent); }
.ev-travel { border-left: 2px solid #34d399; background: linear-gradient(90deg, rgba(52,211,153,0.05), transparent); }
.ev-level { border-left: 2px solid var(--gold); background: linear-gradient(90deg, rgba(212,175,55,0.08), transparent); animation: highlight-pulse 2s infinite; }
.ev-divine { border-left: 2px solid var(--gold); background: rgba(212,175,55,0.04); }
.ev-sleep { border-left: 2px solid #818cf8; opacity: 0.8; }

@keyframes highlight-pulse { 0%, 100% { background-color: rgba(212,175,55,0.08); } 50% { background-color: rgba(212,175,55,0.15); } }



.mood-display { display: flex; align-items: center; gap: 1.2rem; }
.mood-info { flex: 1; }
.mood-label { font-size: 0.72rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.2rem; }
.mood-bar-wrap { height: 6px; background: rgba(255,255,255,0.06); border-radius: 99px; margin-bottom: 0.3rem; overflow: hidden; }
.mood-bar-fill { height: 100%; border-radius: 99px; transition: width 0.4s ease, background-color 0.8s; }
.mood-desc { font-size: 0.82rem; color: var(--fg); font-weight: 500; }
</style>
