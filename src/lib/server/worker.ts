import { Worker, Queue, type Job } from 'bullmq';
import { getRedis } from './redis.js';
import * as storage from './storage.js';
import type { Character } from '$lib/types/character.js';
import fs from 'fs';
import { processGameTick } from '$lib/ai/game-engine.js';
import { wsManager } from './websocket.js';
import * as questService from '$lib/services/questService.js';
import { selectDivineReaction } from '$lib/data/divine-reactions.js';

// Static imports of game data
import { initialQuests } from '$lib/data/quests.js';
import { initialEvents } from '$lib/data/events.js';
import { initialCityEvents } from '$lib/data/cityEvents.js';
import { initialSovngardeQuests } from '$lib/data/sovngarde.js';
import { initialItems } from '$lib/data/items.js';
import { initialEnemies } from '$lib/data/enemies.js';
import { initialLocations } from '$lib/data/locations.js';
import { initialNpcs } from '$lib/data/npcs.js';

// ─── Constants ──────────────────────────────────────────────────────────

const QUEUE_NAME = 'game-tick-v4';
const ONLINE_TICK_MIN = 20_000;
const ONLINE_TICK_MAX = 120_000;
const COMBAT_TICK_MIN = 5_000;
const COMBAT_TICK_MAX = 15_000;
const OFFLINE_TICK_MIN = 10 * 60_000; 
const OFFLINE_TICK_MAX = 60 * 60_000; 

const GLOBAL_WORKER_KEY = Symbol.for('elderscrolls.worker.v2');
const GLOBAL_QUEUE_KEY = Symbol.for('elderscrolls.queue.v2');
const GLOBAL_WATCHDOG_KEY = Symbol.for('elderscrolls.watchdog.v2');

function logWorker(msg: string) {
    if (process.env.LOGS !== 'true') return;
    const ts = new Date().toISOString();
    try {
        fs.appendFileSync('/tmp/worker.log', `[${ts}] ${msg}\n`);
    } catch {}
    console.log(`[Worker][${ts}] ${msg}`);
}

function randomBetween(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getNextTickDelay(characterId: string, status?: string): number {
    const onlineCount = wsManager.getOnlineCount(characterId);
    const isOnline = onlineCount > 0;
    
    if (isOnline) {
        let min = ONLINE_TICK_MIN;
        let max = ONLINE_TICK_MAX;

        // If in combat, speed up ticks
        if (status === 'in-combat') {
            min = COMBAT_TICK_MIN;
            max = COMBAT_TICK_MAX;
        }

        const delay = randomBetween(min, max);
        logWorker(`[Tick] Char ${characterId} is ONLINE (status: ${status || 'unknown'}). Sockets: ${onlineCount}. Next in ${Math.round(delay/1000)}s`);
        return delay;
    } else {
        const delay = randomBetween(OFFLINE_TICK_MIN, OFFLINE_TICK_MAX);
        logWorker(`[Tick] Char ${characterId} is OFFLINE. Next in ${Math.round(delay/60000)}m`);
        return delay;
    }
}

// ─── Game Data Cache ─────────────────────────────────────────────────────────

const cachedGameData = {
	items: Array.isArray(initialItems) ? initialItems : Object.values(initialItems),
	enemies: Array.isArray(initialEnemies) ? initialEnemies : Object.values(initialEnemies),
	locations: Array.isArray(initialLocations) ? initialLocations : Object.values(initialLocations),
	npcs: Array.isArray(initialNpcs) ? initialNpcs : Object.values(initialNpcs),
	quests: initialQuests,
	events: initialEvents,
	cityEvents: initialCityEvents,
	sovngardeQuests: initialSovngardeQuests
};

// ─── Processing ──────────────────────────────────────────────────────────────

async function processCharacterTick(character: Character): Promise<void> {
	try {
        const now = Date.now();
        const lastTickAt = character.lastProcessedAt || character.createdAt || now;
        const diffMs = now - lastTickAt;
        
        // Debounce: prevent same character ticking more than once every 1s
        if (diffMs < 1000) {
            logWorker(`[Worker] Skipping duplicate tick for ${character.name} (${character.id}). Diff: ${diffMs}ms`);
            return;
        }

        const elapsedMin = diffMs / 60000;
        logWorker(`Processing tick for ${character.name} (${character.id}). Action: ${character.currentAction?.type || 'none'}. Elapsed: ${elapsedMin.toFixed(2)}m`);
        
        // Prepare services for DI to avoid Vite module runner closure errors
        const services = {
            getPendingDivineMessages: storage.getPendingDivineMessages,
            markDivineMessageProcessed: storage.markDivineMessageProcessed,
            selectDivineReaction: selectDivineReaction,
            listInteractions: questService.listInteractions,
            evaluateAchievements: questService.evaluateAchievements,
            persistAchievementUnlocks: questService.persistAchievementUnlocks
        };

		const result = await processGameTick(character, cachedGameData as any, services as any);

		// Save updated state
		await storage.saveCharacter(result.updatedCharacter);
		await storage.updateCharacterLastProcessed(character.id, now);

		// Log events to persistence
		const baseTs = Date.now();
		let offset = 0;
		for (const message of (result.adventureLog || [])) {
			await storage.addOfflineEvent(character.id, {
				type: 'system',
				message,
				timestamp: baseTs + offset
			});
			offset += 10;
		}
		for (const message of (result.combatLog || [])) {
			await storage.addOfflineEvent(character.id, {
				type: 'combat',
				message,
				timestamp: baseTs + offset
			});
			offset += 10;
		}

		// Push to WebSocket
		const redis = getRedis();
		const updatedChar = result.updatedCharacter as any;
		await redis.publish('ws:tick', JSON.stringify({
			type: 'tick',
			characterId: character.id,
			tickAt: Date.now(),
			stats: updatedChar.stats,
			status: updatedChar.status,
			location: updatedChar.location,
			currentAction: updatedChar.currentAction,
			mood: updatedChar.mood,
			interventionPower: updatedChar.interventionPower,
			equipment: updatedChar.equipment,
			inventory: updatedChar.inventory,
			adventureLog: result.adventureLog || [],
			combatLog: result.combatLog || []
		}));

		// Schedule next tick
		const delay = getNextTickDelay(character.id, result.updatedCharacter.status);
		await scheduleCharacterTick(character.id, delay);

	} catch (error: any) {
		logWorker(`ERROR in processCharacterTick for ${character.id}: ${error.stack}`);
		await scheduleCharacterTick(character.id, ONLINE_TICK_MAX);
	}
}

export async function scheduleCharacterTick(characterId: string, delay?: number, status?: string): Promise<void> {
    const queue = (globalThis as any)[GLOBAL_QUEUE_KEY] as Queue;
	if (!queue) return;

	const tickDelay = delay ?? getNextTickDelay(characterId, status);

	await queue.add(
		'tick',
		{ characterId, scheduledAt: Date.now() },
		{
			delay: tickDelay,
			removeOnComplete: true,
			removeOnFail: { count: 5 }
		}
	);
}

// ─── Lifecycle & Watchdog ───────────────────────────────────────────────────

async function runWatchdog() {
    logWorker('[Watchdog] Checking for stalled characters...');
    try {
        const allCharacters = await storage.getAllActiveCharacters();
        const now = Date.now();
        
        for (const char of allCharacters) {
            const lastAt = char.lastProcessedAt || char.createdAt || now;
            const diffMs = now - lastAt;
            const onlineCount = wsManager.getOnlineCount(char.id);
            
            // If online and no tick for 5 minutes, force it
            if (onlineCount > 0 && diffMs > 5 * 60_000) {
                logWorker(`[Watchdog] Character ${char.name} seems STALLED (Online, last tick ${Math.round(diffMs/1000)}s ago). Re-scheduling.`);
                await scheduleCharacterTick(char.id, 1000);
            } 
            // If offline and no tick for 2 hours, force it
            else if (onlineCount === 0 && diffMs > 120 * 60_000) {
                logWorker(`[Watchdog] Character ${char.name} seems STALLED (Offline, last tick ${Math.round(diffMs/60000)}m ago). Re-scheduling.`);
                await scheduleCharacterTick(char.id, 1000);
            }
        }
    } catch (e) {
        logWorker(`[Watchdog] Error: ${e}`);
    }
}

export async function startGameWorker(): Promise<void> {
    logWorker('startGameWorker STARTING...');
    
    // Cleanup items on globalThis if HMR
    if ((globalThis as any)[GLOBAL_WORKER_KEY]) {
        await (globalThis as any)[GLOBAL_WORKER_KEY].close();
        delete (globalThis as any)[GLOBAL_WORKER_KEY];
    }
    if ((globalThis as any)[GLOBAL_QUEUE_KEY]) {
        await (globalThis as any)[GLOBAL_QUEUE_KEY].close();
        delete (globalThis as any)[GLOBAL_QUEUE_KEY];
    }
    if ((globalThis as any)[GLOBAL_WATCHDOG_KEY]) {
        clearInterval((globalThis as any)[GLOBAL_WATCHDOG_KEY]);
        delete (globalThis as any)[GLOBAL_WATCHDOG_KEY];
    }

	const connection = getRedis();
	const queue = new Queue(QUEUE_NAME, { connection });
    (globalThis as any)[GLOBAL_QUEUE_KEY] = queue;

	const worker = new Worker(
		QUEUE_NAME,
		async (job: Job) => {
			const { characterId } = job.data;
			const character = await storage.getCharacterById(characterId);
			if (character) await processCharacterTick(character);
		},
		{
			connection,
			concurrency: 10,
			removeOnComplete: { count: 100 },
			removeOnFail: { count: 100 }
		}
	);

    (globalThis as any)[GLOBAL_WORKER_KEY] = worker;

	const allCharacters = await storage.getAllActiveCharacters();
	for (const char of allCharacters) {
		await scheduleCharacterTick(char.id, 2000, char.status);
	}

    // Start Watchdog every 5 minutes
    (globalThis as any)[GLOBAL_WATCHDOG_KEY] = setInterval(runWatchdog, 5 * 60_000);

	logWorker(`[Worker] v4 INITIALIZED with Watchdog ✓`);
}
