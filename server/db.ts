import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';
import { sql as drizzleSql } from 'drizzle-orm';

// Configure neon
neonConfig.fetchConnectionCache = true;

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

// Create the database connection
export const sql = neon(process.env.DATABASE_URL);

// Export drizzleSql for raw SQL queries
export { drizzleSql };

// Create the drizzle database instance
export const db = drizzle(sql, { schema });
