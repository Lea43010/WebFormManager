import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

// Create a PostgreSQL client with Neon
const sql = neon(process.env.DATABASE_URL);

// Create a drizzle instance
export const db = drizzle(sql);
