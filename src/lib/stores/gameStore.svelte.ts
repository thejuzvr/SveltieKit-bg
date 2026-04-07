import { browser } from '$app/environment';
import { untrack } from 'svelte';
import type { Character } from '$lib/types/character';

export class GameStore {
    character = $state<Character | null>(null);
    events = $state<any[]>([]);
    wsStatus = $state<'connecting' | 'connected' | 'disconnected'>('connecting');
    lastTickAt = $state<number>(Date.now());
    now = $state(Date.now());
    ws: WebSocket | null = null;
    private refreshInterval: any = null;
    lastCombatLogTime = 0;
    unreadCombat = $state(false);

    constructor() {
        if (browser) {
            setInterval(() => {
                this.now = Date.now();
            }, 1000);
        }
    }

    init(initialCharacter: Character, initialEvents: any[]) {
        const isSameCharacter = untrack(() => this.character?.id === initialCharacter.id);
        
        this.character = initialCharacter;
        this.events = initialEvents;

        if (browser) {
            // Only reconnect if the character has changed or if no socket exists
            if (!isSameCharacter || !this.ws || this.ws.readyState === WebSocket.CLOSED) {
                this.connectWebSocket();
            }

            // Always clear the old interval and start a new one to avoid leaks
            if (this.refreshInterval) clearInterval(this.refreshInterval);
            this.refreshInterval = setInterval(() => this.refresh(), 30000);
        }
    }

    async refresh() {
        await this.fetchCharacter();
        await this.fetchEvents();
    }

    async fetchCharacter() {
        try {
            const res = await fetch('/api/character');
            if (res.ok) {
                const json = await res.json();
                if (json.character) this.character = json.character;
            }
        } catch (e) {
            console.error('[Store] fetchCharacter failed:', e);
        }
    }

    async fetchEvents() {
        try {
            const res = await fetch('/api/character/events?limit=60');
            if (res.ok) {
                const json = await res.json();
                if (Array.isArray(json.events)) {
                    this.events = json.events;
                    this.checkUnreadCombat();
                }
            }
        } catch (e) {
            console.error('[Store] fetchEvents failed:', e);
        }
    }

    checkUnreadCombat() {
        const latestCombat = this.events.find(e => e.type === 'combat');
        if (latestCombat && latestCombat.timestamp > this.lastCombatLogTime) {
            this.unreadCombat = true;
        }
    }

    markCombatRead() {
        const latestCombat = this.events.find(e => e.type === 'combat');
        if (latestCombat) {
            this.lastCombatLogTime = latestCombat.timestamp;
        }
        this.unreadCombat = false;
    }

    connectWebSocket() {
        if (!this.character?.id || !browser) return;
        
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws?characterId=${this.character.id}`;
        
        if (this.ws) this.ws.close();
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            this.wsStatus = 'connected';
            this.refresh();
        };

        this.ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'tick') {
                    this.lastTickAt = Date.now();
                    if (this.character) {
                        this.character = {
                            ...this.character,
                            ...msg,
                            // Ensure these are preserved if missing in msg
                            stats: msg.stats ?? this.character.stats,
                            status: msg.status ?? this.character.status,
                            location: msg.location ?? this.character.location,
                            equippedItems: msg.equipment ?? msg.equippedItems ?? this.character.equippedItems,
                            inventory: msg.inventory ?? this.character.inventory,
                        } as Character;
                    }
                    this.fetchEvents();
                }
            } catch (e) {
                console.error('[WS] Parse error:', e);
            }
        };

        this.ws.onclose = () => {
            this.wsStatus = 'disconnected';
            setTimeout(() => this.connectWebSocket(), 3000);
        };
    }
}

export const gameStore = new GameStore();
