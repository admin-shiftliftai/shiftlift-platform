import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }
    pool = new Pool({ connectionString });
      // Set default search_path to our Prep schema
    pool.query("set search_path to shiftlift_prep, public").catch(() => {});
}
  
  return pool;
}
