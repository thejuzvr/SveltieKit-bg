import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'webSocketServer',
			configureServer(server) {
				if (!server.httpServer) return;
				
				const httpServer = server.httpServer;
				
				// Re-attach upgrade listener on every reload (internal guard in websocket.ts)
				import('./src/lib/server/websocket.js').then(({ wsManager, attachWebSocket }) => {
					wsManager.init(httpServer as any);
					attachWebSocket(httpServer as any);
					console.log('[Vite][WS] System initialization triggered');
				}).catch(err => {
					console.error('[Vite][WS] Initialization failed:', err);
				});

				// Direct upgrade hook for extra reliability
				httpServer.on('upgrade', (req, socket, head) => {
					if (req.url?.includes('/ws')) {
						console.log(`[Vite][WS] Raw Upgrade intercepted for: ${req.url}`);
					}
				});
			}
		}
	]
});
