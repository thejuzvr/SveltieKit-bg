<script lang="ts">
	import { gameStore } from '$lib/stores/gameStore.svelte';
	import { initialQuests } from '$lib/data/quests';
	
	const character = $derived(gameStore.character);
	
	// Active Quest (Generated or Static)
	const activeQuest = $derived(character?.activeGeneratedQuest || (
		character?.currentAction?.type === 'quest' 
			? initialQuests.find(q => q.id === character.currentAction?.questId)
			: null
	));

	const completedQuestIds = $derived(character?.completedQuests || []);
	const completedQuests = $derived(
		initialQuests.filter(q => completedQuestIds.includes(q.id))
	);

	const failedQuests = $derived(character?.failedQuests || []);

	function getQuestTypeIcon(type: string) {
		switch (type) {
			case 'main': return '👑';
			case 'side': return '📜';
			case 'bounty': return '⚔️';
			default: return '📍';
		}
	}
</script>

{#if character}
<div class="quests-page container">
	<header class="page-header">
		<h1 class="font-cinzel">📜 Журнал Заданий</h1>
		<div class="quest-summary">
			<span>Выполнено: {completedQuestIds.length}</span>
			{#if failedQuests.length > 0}
				<span class="text-danger">Провалено: {failedQuests.length}</span>
			{/if}
		</div>
	</header>

	<div class="quests-layout">
		<!-- ACTIVE QUEST -->
		<section class="active-quest-section">
			<h2 class="section-title font-cinzel">Текущее Задание</h2>
			{#if activeQuest}
				{@const currentRewards = (activeQuest as any).rewards || (activeQuest as any).reward || {}}
				<div class="card active-quest-card">
					<div class="quest-header">
						<div class="quest-title-row">
							<span class="quest-icon">{getQuestTypeIcon((activeQuest as any).type || 'side')}</span>
							<h3 class="font-cinzel">{(activeQuest as any).title || 'Безымянное задание'}</h3>
						</div>
						<span class="quest-badge">В процессе</span>
					</div>
					
					<div class="quest-body">
						<p class="quest-desc">{@html (activeQuest as any).description || (activeQuest as any).narrative || ''}</p>
						
						{#if 'steps' in activeQuest && activeQuest.steps}
							<div class="quest-steps">
								<div class="steps-label">Прогресс:</div>
								{#each activeQuest.steps as step, i}
									<div class="step-item" class:completed={i < (activeQuest as any).currentStep} class:current={i === (activeQuest as any).currentStep}>
										<div class="step-marker"></div>
										<span class="step-text">{step.description}</span>
									</div>
								{/each}
							</div>
						{/if}

						<div class="quest-footer">
							<div class="reward-box">
								<span class="reward-label">Награда:</span>
								<div class="reward-values">
									{#if currentRewards.gold}
										<span class="reward-item">💰 {currentRewards.gold}</span>
									{/if}
									{#if currentRewards.xp}
										<span class="reward-item">✨ {currentRewards.xp} XP</span>
									{/if}
									{#if currentRewards.items && currentRewards.items.length > 0}
										<span class="reward-item">🎁 {currentRewards.items.length} предм.</span>
									{/if}
								</div>
							</div>
							{#if (activeQuest as any).location}
								<div class="quest-loc">📍 {(activeQuest as any).location}</div>
							{/if}
						</div>
					</div>
				</div>
			{:else}
				<div class="empty-state">
					<p>Нет активных заданий. Герой отдыхает или ищет приключения.</p>
				</div>
			{/if}
		</section>

		<!-- COMPLETED ARCHIVE -->
		<section class="archive-section">
			<h2 class="section-title font-cinzel">Архив Выполненных</h2>
			<div class="archive-list">
				{#if completedQuests.length === 0}
					<p class="empty-msg">Список пуст...</p>
				{:else}
					{#each [...completedQuests].reverse() as quest}
						{@const qReward = (quest as any).reward || (quest as any).rewards || {}}
						<div class="archive-item card">
							<div class="archive-info">
								<span class="archive-icon">✅</span>
								<div>
									<h4 class="archive-name">{quest.title}</h4>
									<p class="archive-meta">{quest.type === 'bounty' ? 'Контракт' : 'Поручение'} · {(quest as any).location || 'Скайрим'}</p>
								</div>
							</div>
							<div class="archive-reward">
								<span>+{qReward.gold || 0}💰</span>
							</div>
						</div>
					{/each}
				{/if}
			</div>
			
			{#if failedQuests.length > 0}
				<h2 class="section-title font-cinzel mt-4">Проваленные</h2>
				<div class="failed-list">
					{#each failedQuests as failed}
						<div class="archive-item card failed">
							<div class="archive-info">
								<span class="archive-icon">❌</span>
								<div>
									<h4 class="archive-name">{failed.questId}</h4>
									<p class="archive-meta">Причина: {failed.reason}</p>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>
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
		margin-bottom: 2.5rem;
	}

	.page-header h1 {
		margin: 0;
		font-size: 2.2rem;
		color: var(--gold);
	}

	.quest-summary {
		display: flex;
		gap: 1.5rem;
		font-size: 0.9rem;
		color: var(--muted);
	}

	.quests-layout {
		display: grid;
		grid-template-columns: 1fr 350px;
		gap: 3rem;
		align-items: start;
	}

	.section-title {
		font-size: 1rem;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin-bottom: 1.2rem;
		border-bottom: 1px solid rgba(212,175,55,0.1);
		padding-bottom: 0.5rem;
	}

	.mt-4 { margin-top: 2rem; }

	.active-quest-card {
		border: 1px solid rgba(212, 175, 55, 0.3);
		box-shadow: 0 0 30px rgba(212, 175, 55, 0.05);
	}

	.quest-header {
		padding: 1.2rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: rgba(212, 175, 55, 0.03);
		border-bottom: 1px solid var(--card-border);
	}

	.quest-title-row {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.quest-icon { font-size: 1.8rem; }
	.quest-header h3 { margin: 0; font-size: 1.3rem; color: var(--gold-bright); }

	.quest-badge {
		font-size: 0.7rem;
		background: var(--gold-dim);
		color: var(--gold);
		padding: 0.2rem 0.6rem;
		border-radius: 99px;
		border: 1px solid rgba(212, 175, 55, 0.3);
		text-transform: uppercase;
		font-weight: 700;
	}

	.quest-body { padding: 1.5rem; }
	.quest-desc { font-size: 1rem; line-height: 1.6; color: #ccc; margin-bottom: 1.5rem; }

	.steps-label { font-size: 0.8rem; color: var(--muted); margin-bottom: 0.75rem; font-weight: 600; }
	.quest-steps {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin-bottom: 2rem;
		padding-left: 0.5rem;
	}

	.step-item {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		font-size: 0.9rem;
		color: var(--muted);
	}

	.step-marker {
		width: 10px; height: 10px; border-radius: 50%;
		border: 2px solid #444; background: transparent;
		flex-shrink: 0;
	}

	.step-item.completed { color: #888; text-decoration: line-through; opacity: 0.6; }
	.step-item.completed .step-marker { background: var(--green); border-color: var(--green); }
	.step-item.current { color: var(--fg); font-weight: 600; }
	.step-item.current .step-marker { 
		border-color: var(--gold); 
		background: #fff;
		box-shadow: 0 0 10px var(--gold);
	}

	.quest-footer {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		padding-top: 1.5rem;
		border-top: 1px solid rgba(255,255,255,0.05);
	}

	.reward-label { font-size: 0.75rem; color: var(--muted); display: block; margin-bottom: 0.3rem; }
	.reward-values { display: flex; gap: 1rem; }
	.reward-item { font-size: 1rem; font-weight: 700; color: var(--gold-bright); }

	.quest-loc { font-size: 0.8rem; color: var(--muted); font-style: italic; }

	/* Archive */
	.archive-list, .failed-list { display: flex; flex-direction: column; gap: 0.75rem; }
	
	.archive-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.8rem 1rem;
		background: rgba(255,255,255,0.02);
		transition: transform 0.2s;
	}
	.archive-item:hover { transform: translateX(5px); background: rgba(255,255,255,0.04); }

	.archive-info { display: flex; align-items: center; gap: 1rem; }
	.archive-name { margin: 0; font-size: 0.85rem; color: var(--fg); }
	.archive-meta { margin: 0; font-size: 0.7rem; color: var(--muted); }
	.archive-reward { font-size: 0.8rem; font-weight: 700; color: var(--green); }

	.archive-item.failed { border-left: 2px solid var(--danger); }

	.empty-state, .empty-msg {
		text-align: center;
		padding: 3rem;
		color: var(--muted);
		background: rgba(255, 255, 255, 0.02);
		border-radius: var(--radius);
		border: 1px dashed var(--card-border);
	}

	@media (max-width: 900px) {
		.quests-layout { grid-template-columns: 1fr; }
	}
</style>
