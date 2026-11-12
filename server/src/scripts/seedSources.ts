import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { env } from '../config/env.js';
import { OFFICIAL_SOURCE_CATALOGUE } from '../data/sourceCatalogue.js';
import { DataSourceModel } from '../models/index.js';

export async function seedOfficialSources(): Promise<{ upserted: number }> {
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured in server/.env. Cannot seed sources.');
  }

  await connectDatabase();
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Failed to establish MongoDB connection for source seeding.');
  }

  let upserted = 0;
  try {
    for (const entry of OFFICIAL_SOURCE_CATALOGUE) {
      await DataSourceModel.findOneAndUpdate(
        { sourceUrl: entry.sourceUrl },
        { $set: entry },
        { upsert: true, new: true, runValidators: true }
      );
      upserted += 1;
    }
    console.info(`[Seed] Upserted ${upserted} researched source registry entries.`);
    return { upserted };
  } finally {
    await disconnectDatabase();
  }
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && currentFile === process.argv[1]) {
  seedOfficialSources().catch((err) => {
    console.error('[Seed] Failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
}

