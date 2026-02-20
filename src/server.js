import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createApp } from './app.js';
import { createMemoryStore } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIST = path.resolve(__dirname, '..', 'web', 'dist');

if (!existsSync(WEB_DIST)) {
  process.stderr.write(
    '[warn] web/dist not found – the frontend has not been built.\n' +
    '[warn] Run "npm run build" first, or use "npm start" which builds automatically.\n'
  );
}

const port = Number(process.env.PORT ?? 3000);
const backend = (process.env.STORE_BACKEND ?? 'memory').toLowerCase();

async function loadStore() {
  if (backend === 'postgres') {
    const { createPostgresStore } = await import('./store-postgres.js');
    return createPostgresStore({ connectionString: process.env.DATABASE_URL });
  }

  return createMemoryStore();
}

const store = await loadStore();
const { server } = createApp({ store });

server.listen(port, () => {
  process.stdout.write(
    `Career Intelligence OS API listening on http://localhost:${port} (backend=${store.backend})\n`
  );
});

async function shutdown(signal) {
  process.stdout.write(`Received ${signal}. Shutting down...\n`);
  server.close(async () => {
    await store.close();
    process.exit(0);
  });
}

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});
