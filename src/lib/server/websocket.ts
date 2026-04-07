import type { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import type { Server } from 'http';
import { createRedisClient } from './redis.js';
import fs from 'fs';

interface GameWebSocket extends WebSocket {
	characterId?: string;
	userId?: string;
	isAlive?: boolean;
}

const GLOBAL_WS_MANAGER_KEY = Symbol.for('elderscrolls.wsmanager.v3');

function logWS(msg: string) {
    if (process.env.LOGS !== 'true') return;
    const timestamp = new Date().toISOString();
    try {
        fs.appendFileSync('/tmp/worker.log', `[WS][${timestamp}] ${msg}\n`);
    } catch {}
    console.log(`[WS][${timestamp}] ${msg}`);
}

class WebSocketManager {
	public wss: WebSocketServer | null = null;
	private clients = new Map<string, Set<GameWebSocket>>();
	private redisSub = createRedisClient();
	private initialized = false;

	async init(server: Server) {
		if (this.initialized) {
            logWS('WebSocketManager already initialized, skipping init core.');
            return;
        }
		this.initialized = true;

		this.wss = new WebSocketServer({ noServer: true });
        logWS('WebSocketServer (wss) instance created ✓');

		// Subscribe to Redis
		await this.redisSub.subscribe('ws:tick', 'ws:event');
		this.redisSub.on('message', (channel, message) => {
			try {
				const data = JSON.parse(message);
				if (data.characterId) {
                    const count = this.getOnlineCount(data.characterId);
                    if (count > 0) {
                        logWS(`Broadcast: Pub/Sub message for ${data.characterId} to ${count} clients.`);
                        this.broadcast(data.characterId, data);
                    }
                }
			} catch (e) { logWS(`Redis message error: ${e}`); }
		});

		this.wss.on('connection', (ws: GameWebSocket, req: IncomingMessage) => {
			ws.isAlive = true;
			const characterId = this.getCharacterIdFromRequest(req);
			if (characterId) {
				ws.characterId = characterId;
				this.addClient(characterId, ws);
				logWS(`Connect: Char ${characterId}. Sockets total for this char: ${this.getOnlineCount(characterId)}`);
				ws.send(JSON.stringify({ type: 'connected', characterId }));
			} else {
				logWS(`Reject: No characterId in URL ${req.url}`);
				ws.close(1008, 'Missing characterId');
			}
			ws.on('pong', () => { ws.isAlive = true; });
			ws.on('close', (code) => {
				if (ws.characterId) {
					this.removeClient(ws.characterId, ws);
					logWS(`Disconnect: ${ws.characterId} (code ${code})`);
				}
			});
		});

		// Heartbeat
		const heartbeat = setInterval(() => {
			this.wss?.clients.forEach((ws: any) => {
				if (!ws.isAlive) return ws.terminate();
				ws.isAlive = false;
				ws.ping();
			});
		}, 30000);
        
        // Prevent leak if server reloads
        (server as any)._elderscrolls_ws_timer = heartbeat;
	}

	private getCharacterIdFromRequest(req: IncomingMessage): string | null {
		try {
			const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
			return url.searchParams.get('characterId');
		} catch (e) { return null; }
	}

	private addClient(characterId: string, ws: GameWebSocket) {
		if (!this.clients.has(characterId)) this.clients.set(characterId, new Set());
		this.clients.get(characterId)!.add(ws);
	}

	private removeClient(characterId: string, ws: GameWebSocket) {
		const sockets = this.clients.get(characterId);
		if (sockets) {
			sockets.delete(ws);
			if (sockets.size === 0) this.clients.delete(characterId);
		}
	}

	getOnlineCount(characterId: string): number {
		return this.clients.get(characterId)?.size || 0;
	}

	broadcast(characterId: string, data: unknown) {
		const sockets = this.clients.get(characterId);
		if (!sockets?.size) return;
		const message = JSON.stringify(data);
		sockets.forEach((ws) => {
			if (ws.readyState === ws.OPEN) ws.send(message);
		});
	}
}

// ─── HMR-Safe Export ─────────────────────────────────────────────────────────

if (!(globalThis as any)[GLOBAL_WS_MANAGER_KEY]) {
	(globalThis as any)[GLOBAL_WS_MANAGER_KEY] = new WebSocketManager();
}

export const wsManager = (globalThis as any)[GLOBAL_WS_MANAGER_KEY] as WebSocketManager;

// Helper to attach to server once
export function attachWebSocket(server: Server) {
    const ATTACHED_KEY = '_elderscrolls_ws_attached_v3';
    if ((server as any)[ATTACHED_KEY]) {
        logWS('Upgrade listener already attached to this server instance, skipping.');
        return;
    }
    (server as any)[ATTACHED_KEY] = true;

    server.on('upgrade', (req, socket, head) => {
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        if (url.pathname.endsWith('/ws')) {
            const currentManager = (globalThis as any)[GLOBAL_WS_MANAGER_KEY] as WebSocketManager;
            if (currentManager && currentManager.wss) {
                logWS(`Handshake: Upgrade for ${url.pathname} via Manager ✓`);
                currentManager.wss.handleUpgrade(req, socket, head, (ws) => {
                    currentManager.wss!.emit('connection', ws, req);
                });
            } else {
                logWS('ERROR: No wss instance on currentManager during upgrade!');
                socket.destroy();
            }
        }
    });
    logWS('Permanent upgrade listener attached to server instance ✓');
}
