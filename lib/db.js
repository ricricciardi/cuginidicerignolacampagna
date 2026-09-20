import { neon } from '@neondatabase/serverless';

let client;
// Connessione pigra: evita errori in fase di build quando DATABASE_URL non c'è.
export function sql(strings, ...values) {
  client ??= neon(process.env.DATABASE_URL);
  return client(strings, ...values);
}
