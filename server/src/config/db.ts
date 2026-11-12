import mongoose from 'mongoose';
import { env } from './env.js';
import type { DatabaseHealth, DatabaseStatusState } from '../types/system.js';

let lastConnectionError: string | null = null;
let listenersAttached = false;

function attachConnectionListeners(): void {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('connected', () => {
    lastConnectionError = null;
    console.info('[DB] MongoDB connection established.');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected.');
  });

  mongoose.connection.on('error', (err: Error) => {
    lastConnectionError = err.message;
    console.error('[DB] MongoDB error:', err.message);
  });
}

function mapReadyState(readyState: number, isConfigured: boolean): DatabaseStatusState {
  if (!isConfigured && readyState === 0) {
    return 'unconfigured';
  }
  switch (readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'disconnected';
  }
}

/**
 * Connect to MongoDB when MONGODB_URI is provided.
 * If unconfigured or unreachable in development, keeps the API running and reports status accurately.
 */
export async function connectDatabase(): Promise<void> {
  if (!env.MONGODB_URI) {
    lastConnectionError = null;
    console.info('[DB] MONGODB_URI is not configured. Running in API-only mode (database: unconfigured).');
    return;
  }

  attachConnectionListeners();

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    lastConnectionError = null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown MongoDB connection error';
    lastConnectionError = message;
    console.error(`[DB] Failed to connect to MongoDB: ${message}`);

    if (env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function getDatabaseHealth(): DatabaseHealth {
  const configured = Boolean(env.MONGODB_URI);
  const readyState = mongoose.connection.readyState;
  const status = mapReadyState(readyState, configured);

  return {
    configured,
    connected: readyState === 1,
    status,
    readyState,
    lastError: lastConnectionError,
  };
}

