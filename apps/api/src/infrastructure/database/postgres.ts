import { Pool, QueryResultRow } from 'pg';

let pool: Pool | undefined;

export function getPostgresPool(): Pool | undefined {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return undefined;
  }

  pool ??= new Pool({ connectionString });
  return pool;
}

export async function queryPostgres<T extends QueryResultRow>(
  text: string,
  values: unknown[]
): Promise<T[]> {
  const activePool = getPostgresPool();
  if (!activePool) {
    return [];
  }

  const result = await activePool.query<T>(text, values);
  return result.rows;
}
