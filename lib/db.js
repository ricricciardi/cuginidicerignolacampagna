import { neon } from '@neondatabase/serverless';

let client;
// Connessione pigra: evita errori in fase di build quando DATABASE_URL non c'è.
// In locale, con DEV_FAKE_DB=1, usa il database finto in memoria (lib/dev-db.js).
export async function sql(strings, ...values) {
  if (process.env.DEV_FAKE_DB === '1' && process.env.NODE_ENV !== 'production') {
    const { devSql } = await import('./dev-db.js');
    return devSql(strings, ...values);
  }
  client ??= neon(process.env.DATABASE_URL);
  return client(strings, ...values);
}
