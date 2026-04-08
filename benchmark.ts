import fs from 'fs';
import { performance } from 'perf_hooks';

process.env.LOGS = 'true';

function logWS_sync(msg: string) {
    if (process.env.LOGS !== 'true') return;
    const timestamp = new Date().toISOString();
    try {
        fs.appendFileSync('/tmp/worker_sync.log', `[WS][${timestamp}] ${msg}\n`);
    } catch {}
}

function logWS_appendFile(msg: string) {
    if (process.env.LOGS !== 'true') return;
    const timestamp = new Date().toISOString();
    fs.appendFile('/tmp/worker_async.log', `[WS][${timestamp}] ${msg}\n`, () => {});
}

async function benchmark() {
    const iterations = 10000;
    const message = "This is a typical websocket log message that gets written to the file.";

    const startSync = performance.now();
    for (let i = 0; i < iterations; i++) {
        logWS_sync(message);
    }
    const endSync = performance.now();

    const startAsync = performance.now();
    for (let i = 0; i < iterations; i++) {
        logWS_appendFile(message);
    }
    const endAsync = performance.now();

    console.log(`Sync time for ${iterations} logs: ${(endSync - startSync).toFixed(2)} ms`);
    console.log(`Async time for ${iterations} logs: ${(endAsync - startAsync).toFixed(2)} ms`);

    // Clean up
    if (fs.existsSync('/tmp/worker_sync.log')) fs.unlinkSync('/tmp/worker_sync.log');
    if (fs.existsSync('/tmp/worker_async.log')) fs.unlinkSync('/tmp/worker_async.log');
}

benchmark().catch(console.error);
