import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';

// Configure neon
neonConfig.fetchConnectionCache = true;

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

// Create the database connection
const sql = neon(process.env.DATABASE_URL);

// Create the drizzle database instance
export const db = drizzle(sql, { schema });
