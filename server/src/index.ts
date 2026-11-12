import type { Server } from 'node:http';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';

let server: Server | null = null;
let isShuttingDown = false;

async function startServer(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  server = app.listen(env.PORT, () => {
    console.info(
      `[Server] GreenGrid India API listening on port ${env.PORT} (env=${env.NODE_ENV}, adminAuth=${Boolean(env.ADMIN_API_KEY)}, dbConfigured=${Boolean(env.MONGODB_URI)})`
    );
  });
}

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.info(`\n[Server] Received ${signal}. Starting graceful shutdown...`);

  const closeHttpServer = (): Promise<void> =>
    new Promise((resolve, reject) => {
      if (!server) {
        resolve();
        return;
      }
      server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });

  try {
    await closeHttpServer();
    await disconnectDatabase();
    console.info('[Server] HTTP server and database connections closed cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('[Server] Error during graceful shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

startServer().catch((error) => {
  console.error('[Server] Failed to start server:', error);
  process.exit(1);
});

