import { pathToFileURL } from 'node:url';
import { buildApp } from './app.js';
import { API_VERSION } from './version.js';

export { API_VERSION };
export { buildApp } from './app.js';

/**
 * Entry point only: importing this module must not start a server, so tests
 * can import buildApp safely. Run directly (`npm run dev -w @verge-ledger/api`
 * or `node dist/server.js`) to listen.
 */
const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const port = Number(process.env.PORT ?? 3001);
  const host = process.env.HOST ?? '127.0.0.1';
  const app = buildApp();
  app
    .listen({ port, host })
    .then((address) => {
      console.log(`Verge Ledger API ${API_VERSION} listening on ${address} (storage: memory)`);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
