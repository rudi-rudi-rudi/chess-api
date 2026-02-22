import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const connection = process.env.DATABASE_URL;
if (!connection) {
  throw new Error('DATABASE_URL is required');
}

const client = postgres(connection, { prepare: false });
export const db = drizzle(client);
export { client };
