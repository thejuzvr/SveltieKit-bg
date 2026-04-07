const fs = require('fs');
const path = 'src/lib/server/worker.ts';
let code = fs.readFileSync(path, 'utf8');

const target = `	} catch (error: any) {
		logWorker(\`ERROR in processCharacterTick for \${character.id}: \${error.stack}\`);
		await scheduleCharacterTick(character.id, ONLINE_TICK_MAX);
	} finally {`;

const replacement = `	} catch (error: any) {
		logWorker(\`ERROR in processCharacterTick for \${character.id}: \${error.stack}\`);

		// Self-healing mechanism: reset stuck states on crash
		try {
			character.status = 'idle';
			character.combat = null;
			character.currentAction = null;
			await storage.saveCharacter(character);
			await storage.addOfflineEvent(character.id, {
				type: 'system',
				message: 'Неведомая божественная сила вмешалась, прервав текущее занятие героя и вернув его в чувство.',
				timestamp: Date.now()
			});
			logWorker(\`[Self-Healing] Reset state for \${character.name} (\${character.id}) after crash.\`);
		} catch (recoveryError) {
			logWorker(\`[Self-Healing] FAILED to recover \${character.id}: \${recoveryError}\`);
		}

		await scheduleCharacterTick(character.id, ONLINE_TICK_MAX);
	} finally {`;

code = code.replace(target, replacement);
fs.writeFileSync(path, code, 'utf8');
